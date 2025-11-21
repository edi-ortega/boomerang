import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Square, Clock } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";

interface TimeTrackerProps {
  task: any;
  onTimeLogged?: () => void;
}

export default function TimeTracker({ task, onTimeLogged }: TimeTrackerProps) {
  const { currentTenantId } = useTenant();
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);

  useEffect(() => {
    checkTaskCompletionStatus();
    checkActiveSession();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [task?.id, task?.status]);

  const checkTaskCompletionStatus = async () => {
    if (!task) return;
    
    if (task.status === 'done') {
      setIsTaskCompleted(true);
      return;
    }

    try {
      const { data: projects } = await supabase
        .from('prj_project' as any)
        .select('board_id')
        .eq('id', task.project_id)
        .maybeSingle() as any;

      if (projects?.board_id) {
        const { data: boards } = await supabase
          .from('prj_board' as any)
          .select('columns')
          .eq('id', projects.board_id)
          .maybeSingle() as any;

        if (boards?.columns) {
          const taskColumn = boards.columns.find((col: any) => col.id === task.status);
          if (taskColumn?.is_final) {
            setIsTaskCompleted(true);
            return;
          }
        }
      }
    } catch (error) {
      console.error("Error checking task completion:", error);
    }

    setIsTaskCompleted(false);
  };

  const checkActiveSession = async () => {
    if (!task) return;
    
    try {
      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) return;

      const parsedSession = JSON.parse(storedSession);
      const currentUser = parsedSession.user;

      const { data: sessions } = await supabase
        .from('prj_time_tracking_session' as any)
        .select('*')
        .eq('user_email', currentUser.email)
        .eq('task_id', task.id)
        .eq('status', 'active') as any;

      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        setCurrentSession(session);
        setIsTracking(true);
        
        const startTime = new Date(session.start_time).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
        startTimeRef.current = startTime;
        
        startTimer();
      }
    } catch (error) {
      console.error("Error checking active session:", error);
    }
  };

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current && !isPaused) {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000) - pausedTimeRef.current;
        setElapsedTime(elapsed);
      }
    }, 1000);
  };

  const handleStart = async () => {
    if (isTaskCompleted) {
      toast.error("Tarefa concluída", {
        description: "Não é possível rastrear tempo em tarefas concluídas"
      });
      return;
    }

    try {
      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) {
        toast.error("Sessão inválida");
        return;
      }

      const parsedSession = JSON.parse(storedSession);
      const currentUser = parsedSession.user;

      const sessionData = {
        user_email: currentUser.email,
        task_id: task.id,
        project_id: task.project_id,
        start_time: new Date().toISOString(),
        status: 'active',
        tenant_id: currentTenantId,
      };

      const { data, error } = await supabase
        .from('prj_time_tracking_session' as any)
        .insert(sessionData)
        .select()
        .maybeSingle() as any;

      if (error) throw error;

      setCurrentSession(data);
      setIsTracking(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setElapsedTime(0);
      startTimer();

      toast.success("Timer iniciado!");
    } catch (error) {
      console.error("Error starting timer:", error);
      toast.error("Erro ao iniciar timer");
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    toast.info("Timer pausado");
  };

  const handleResume = () => {
    setIsPaused(false);
    const pausedDuration = Math.floor((Date.now() - (startTimeRef.current || 0)) / 1000) - elapsedTime;
    pausedTimeRef.current += pausedDuration;
    startTimer();
    toast.info("Timer retomado");
  };

  const handleStop = async () => {
    if (!currentSession) return;

    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const endTime = new Date();
      const durationSeconds = elapsedTime;
      const durationHours = (durationSeconds / 3600).toFixed(2);

      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) return;

      const parsedSession = JSON.parse(storedSession);
      const currentUser = parsedSession.user;

      // Atualizar sessão
      await supabase
        .from('prj_time_tracking_session' as any)
        .update({
          end_time: endTime.toISOString(),
          duration_seconds: durationSeconds,
          status: 'completed'
        })
        .eq('id', currentSession.id) as any;

      // Criar log de tempo
      const logData = {
        user_email: currentUser.email,
        task_id: task.id,
        project_id: task.project_id,
        hours: parseFloat(durationHours),
        date: new Date().toISOString().split('T')[0],
        start_time: new Date(currentSession.start_time).toISOString(),
        end_time: endTime.toISOString(),
        description: `Registro automático de ${formatTime(elapsedTime)}`,
        is_billable: true,
        tenant_id: currentTenantId,
      };

      await supabase
        .from('prj_timelog' as any)
        .insert(logData) as any;

      toast.success("Tempo registrado!", {
        description: `${formatTime(elapsedTime)} registrado com sucesso`
      });

      setIsTracking(false);
      setIsPaused(false);
      setElapsedTime(0);
      setCurrentSession(null);
      startTimeRef.current = null;
      pausedTimeRef.current = 0;

      if (onTimeLogged) {
        onTimeLogged();
      }
    } catch (error) {
      console.error("Error stopping timer:", error);
      toast.error("Erro ao parar timer");
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isTaskCompleted) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tarefa concluída</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</p>
              <p className="text-xs text-muted-foreground">
                {isTracking ? (isPaused ? 'Pausado' : 'Em andamento') : 'Não iniciado'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {!isTracking && (
              <Button onClick={handleStart} size="sm">
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </Button>
            )}

            {isTracking && !isPaused && (
              <>
                <Button onClick={handlePause} size="sm" variant="outline">
                  <Pause className="w-4 h-4" />
                </Button>
                <Button onClick={handleStop} size="sm" variant="destructive">
                  <Square className="w-4 h-4" />
                </Button>
              </>
            )}

            {isTracking && isPaused && (
              <>
                <Button onClick={handleResume} size="sm">
                  <Play className="w-4 h-4" />
                </Button>
                <Button onClick={handleStop} size="sm" variant="destructive">
                  <Square className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
