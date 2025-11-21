import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, GitBranch, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

interface TaskDependenciesModalProps {
  task: any;
  onClose: () => void;
  onUpdate?: (task: any) => void;
}

export default function TaskDependenciesModal({ task, onClose, onUpdate }: TaskDependenciesModalProps) {
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(task.dependencies || []);
  const [isSaving, setIsSaving] = useState(false);
  const [dependencyDetails, setDependencyDetails] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState('');

  useEffect(() => {
    loadTasks();
    if (task.dependencies && task.dependencies.length > 0) {
      loadDependencyDetails(task.dependencies);
    }
  }, []);

  const loadTasks = async () => {
    try {
      const { data: projectTasks, error } = await supabase
        .from('prj_task' as any)
        .select('*')
        .eq('project_id', task.project_id)
        .neq('id', task.id) as any;

      if (error) throw error;

      setAllTasks(projectTasks || []);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Não foi possível carregar as tarefas do projeto.");
    }
  };

  const loadDependencyDetails = async (dependenciesToLoad: string[]) => {
    try {
      if (!dependenciesToLoad || dependenciesToLoad.length === 0) {
        setDependencyDetails([]);
        return;
      }

      const { data: details, error } = await supabase
        .from('prj_task' as any)
        .select('*')
        .in('id', dependenciesToLoad) as any;

      if (error) throw error;

      setDependencyDetails(details || []);
    } catch (error) {
      console.error("Error loading dependency details:", error);
    }
  };

  const isTaskCompleted = (taskToCheck: any) => {
    const completedStatuses = ['done', 'completed'];
    return completedStatuses.includes(taskToCheck.status);
  };

  const toggleDependency = (taskId: string) => {
    setSelectedDependencies(selectedDependencies.filter(id => id !== taskId));
    setDependencyDetails(prevDetails => prevDetails.filter(dep => dep.id !== taskId));
  };

  const handleSelectAndAddDependency = async (newlySelectedTaskId: string) => {
    if (newlySelectedTaskId && !selectedDependencies.includes(newlySelectedTaskId)) {
      setSelectedDependencies((prev) => [...prev, newlySelectedTaskId]);

      try {
        const { data: newTaskDetail, error } = await supabase
          .from('prj_task' as any)
          .select('*')
          .eq('id', newlySelectedTaskId)
          .maybeSingle() as any;

        if (error) throw error;

        if (newTaskDetail) {
          setDependencyDetails((prevDetails) => [...prevDetails, newTaskDetail]);
        }
      } catch (error) {
        console.error("Error fetching details for new dependency:", error);
      }
    }
    setSelectedTask('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('prj_task' as any)
        .update({ dependencies: selectedDependencies })
        .eq('id', task.id) as any;

      if (error) throw error;

      toast.success(`${selectedDependencies.length} dependência(s) configurada(s).`);

      if (onUpdate) {
        onUpdate({ ...task, dependencies: selectedDependencies });
      }
      onClose();
    } catch (error) {
      console.error("Error updating dependencies:", error);
      toast.error("Não foi possível salvar as dependências.");
    } finally {
      setIsSaving(false);
    }
  };

  const statusColors: Record<string, string> = {
    backlog: "bg-gray-500/20 text-gray-600",
    todo: "bg-blue-500/20 text-blue-600",
    in_progress: "bg-yellow-500/20 text-yellow-600",
    review: "bg-purple-500/20 text-purple-600",
    done: "bg-green-500/20 text-green-600",
    blocked: "bg-red-500/20 text-red-600"
  };

  const availableTasksForSelect = allTasks.filter(t => !selectedDependencies.includes(t.id));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-border bg-card">
        <CardHeader className="sticky top-0 bg-card z-10 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              <CardTitle className="text-foreground">Gerenciar Dependências</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {dependencyDetails.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Dependências Atuais
              </h3>
              <div className="space-y-2">
                {dependencyDetails.map((dep) => (
                  <Card key={dep.id} className="border-border bg-accent/30">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isTaskCompleted(dep) ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-orange-500" />
                            )}
                            <h4 className="text-sm font-medium text-foreground">
                              {dep.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${statusColors[dep.status] || 'bg-gray-500/20 text-gray-600'} text-xs`}>
                              {dep.status}
                            </Badge>
                            {dep.assigned_to_name && (
                              <span className="text-xs text-muted-foreground">
                                Atribuída a {dep.assigned_to_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDependency(dep.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Adicionar Dependência
            </label>
            <Select
              value={selectedTask}
              onValueChange={handleSelectAndAddDependency}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Selecione uma tarefa" />
              </SelectTrigger>
              <SelectContent className="z-[80]">
                {availableTasksForSelect.length === 0 ? (
                  <SelectItem value="no-tasks" disabled>Nenhuma tarefa disponível</SelectItem>
                ) : (
                  availableTasksForSelect.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{t.title}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-primary/80"
              disabled={isSaving}
            >
              <GitBranch className="w-4 h-4 mr-2" />
              {isSaving ? "Salvando..." : `Salvar (${selectedDependencies.length})`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
