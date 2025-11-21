import { useState, useEffect, useRef } from "react";
import { bmr } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentTenantId } from "@/lib/tenant-helper";

interface QuickTimeTrackerProps {
  task: any;
  compact?: boolean;
  onTimeLogged?: () => void;
}

interface TimerSession {
  taskId: string;
  startTime: number;
  elapsedTime: number;
  isPaused: boolean;
  userEmail: string;
}

export default function QuickTimeTracker({ task, compact = true, onTimeLogged }: QuickTimeTrackerProps) {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (task?.id && task?.status) {
      checkTaskCompletionStatus();
      checkActiveSession();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [task?.id, task?.status]);

  const getStorageKey = () => `timeTracker_${task.id}`;

  const checkTaskCompletionStatus = async () => {
    try {
      if (task.status === "done") {
        setIsTaskCompleted(true);
        return;
      }

      const projects = await bmr.entities.Project.filter({ id: task.project_id });
      const project = projects[0];
      
      if (project?.board_id) {
        const boards = await bmr.entities.Board.filter({ id: project.board_id });
        const board = boards[0];
        if (board?.columns) {
          const currentColumn = board.columns.find((col: any) => col.id === task.status);
          if (currentColumn?.is_final) {
            setIsTaskCompleted(true);
          }
        }
      }
    } catch (error) {
      console.error("Error checking task completion:", error);
    }
  };

  const checkActiveSession = () => {
    try {
      const storedSession = localStorage.getItem(getStorageKey());
      if (storedSession) {
        const session: TimerSession = JSON.parse(storedSession);
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
        
        // Verificar se é do mesmo usuário
        if (session.userEmail === currentUser.email) {
          setIsTracking(true);
          setIsPaused(session.isPaused);
          
          if (!session.isPaused) {
            const now = Date.now();
            const elapsed = Math.floor((now - session.startTime) / 1000);
            setElapsedTime(elapsed);
            startTimer();
          } else {
            setElapsedTime(session.elapsedTime);
          }
        }
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
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const saveSession = (session: TimerSession) => {
    localStorage.setItem(getStorageKey(), JSON.stringify(session));
  };

  const clearSession = () => {
    localStorage.removeItem(getStorageKey());
  };

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const session: TimerSession = {
        taskId: task.id,
        startTime: Date.now(),
        elapsedTime: 0,
        isPaused: false,
        userEmail: currentUser.email
      };

      saveSession(session);
      setIsTracking(true);
      setIsPaused(false);
      setElapsedTime(0);
      startTimer();

      toast({
        title: "Timer iniciado",
        description: "Contagem de tempo iniciada para esta tarefa."
      });
    } catch (error) {
      console.error("Error starting timer:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o timer.",
        variant: "destructive"
      });
    }
  };

  const handlePause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const storedSession = localStorage.getItem(getStorageKey());
      if (storedSession) {
        const session: TimerSession = JSON.parse(storedSession);
        session.isPaused = true;
        session.elapsedTime = elapsedTime;
        saveSession(session);
      }

      setIsPaused(true);
      
      toast({
        title: "Timer pausado",
        description: "Contagem de tempo pausada."
      });
    } catch (error) {
      console.error("Error pausing timer:", error);
      toast({
        title: "Erro",
        description: "Não foi possível pausar o timer.",
        variant: "destructive"
      });
    }
  };

  const handleResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const storedSession = localStorage.getItem(getStorageKey());
      if (storedSession) {
        const session: TimerSession = JSON.parse(storedSession);
        // Recalcular startTime baseado no tempo já decorrido
        session.startTime = Date.now() - (session.elapsedTime * 1000);
        session.isPaused = false;
        saveSession(session);
      }

      setIsPaused(false);
      startTimer();
      
      toast({
        title: "Timer retomado",
        description: "Contagem de tempo retomada."
      });
    } catch (error) {
      console.error("Error resuming timer:", error);
      toast({
        title: "Erro",
        description: "Não foi possível retomar o timer.",
        variant: "destructive"
      });
    }
  };

  const handleStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const tenantId = await getCurrentTenantId();
      const storedSession = localStorage.getItem("bmr_session");
      
      if (!storedSession) {
        throw new Error("Sessão não encontrada");
      }
      
      const parsedSession = JSON.parse(storedSession);
      const userEmail = parsedSession.user?.email;
      
      if (!userEmail) {
        throw new Error("Email do usuário não encontrado");
      }
      
      const hoursSpent = elapsedTime / 3600;

      // Criar log de tempo
      await bmr.entities.TimeLog.create({
        task_id: task.id,
        project_id: task.project_id,
        user_email: userEmail,
        date: new Date().toISOString().split('T')[0],
        hours: hoursSpent,
        description: `Timer automático - ${formatTime(elapsedTime)}`,
        is_billable: true,
        client_id: tenantId
      });

      // Atualizar logged_hours da task
      const currentLoggedHours = task.logged_hours || 0;
      await bmr.entities.Task.update(task.id, {
        logged_hours: currentLoggedHours + hoursSpent
      });

      clearSession();
      setIsTracking(false);
      setIsPaused(false);
      setElapsedTime(0);

      if (onTimeLogged) {
        onTimeLogged();
      }

      toast({
        title: "Tempo registrado",
        description: `${formatTime(elapsedTime)} registrado com sucesso.`
      });
    } catch (error) {
      console.error("Error stopping timer:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível parar o timer.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (compact) {
      if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!task) return null;
  if (isTaskCompleted && !isTracking) return null;
  if (!compact) return null;

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {isTracking && (
        <span className="text-xs font-mono text-muted-foreground mr-1">
          {formatTime(elapsedTime)}
        </span>
      )}
      
      {!isTracking ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleStart}
          title="Iniciar timer"
        >
          <Play className="w-3 h-3" />
        </Button>
      ) : isPaused ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleResume}
            title="Retomar timer"
          >
            <Play className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleStop}
            title="Parar e registrar"
          >
            <Square className="w-3 h-3" />
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handlePause}
            title="Pausar timer"
          >
            <Pause className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleStop}
            title="Parar e registrar"
          >
            <Square className="w-3 h-3" />
          </Button>
        </>
      )}
    </div>
  );
}
