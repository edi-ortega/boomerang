import { useState, useEffect } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { useSupabaseQuery } from "./useSupabaseQuery";

interface UseTasksOptions {
  projectId?: string;
  storyId?: string;
  sprintId?: string;
}

export function useTasksEnhanced(options: UseTasksOptions = {}) {
  const { projectId, storyId, sprintId } = options;
  const { currentTenantId } = useTenant();
  const { select, insert, update, delete: deleteFrom } = useSupabaseQuery();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTenantId && (projectId || storyId || sprintId)) {
      loadTasks();
    }
  }, [projectId, storyId, sprintId, currentTenantId]);

  const loadTasks = async () => {
    if (!currentTenantId) return;

    setLoading(true);
    try {
      console.log("📦 Carregando tarefas - tenant:", currentTenantId);
      let query = select('prj_task', '*');

      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      if (storyId) {
        query = query.eq('story_id', storyId);
      }
      if (sprintId) {
        query = query.eq('sprint_id', sprintId);
      }

      const { data, error } = await query.order('created_at', { ascending: false }) as any;

      if (error) {
        console.error("❌ Erro ao carregar tarefas:", error);
        throw error;
      }
      console.log("✅ Tarefas carregadas:", data?.length || 0);
      setTasks(data || []);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Erro ao carregar tarefas.");
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: any) => {
    try {
      const result = await insert('prj_task', taskData);
      const { data, error } = await result.select('*').maybeSingle() as any;

      if (error) throw error;
      setTasks([data, ...tasks]);
      toast.success("Tarefa criada com sucesso.");
      return data;
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Erro ao criar tarefa.");
      throw error;
    }
  };

  const updateTask = async (taskId: string, taskData: any) => {
    try {
      const result = update('prj_task', taskData).eq('id', taskId);
      const { data, error } = await result.select('*').maybeSingle() as any;

      if (error) throw error;
      setTasks(tasks.map(t => t.id === taskId ? data : t));
      toast.success("Tarefa atualizada.");
      return data;
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Erro ao atualizar tarefa.");
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const result = deleteFrom('prj_task').eq('id', taskId);
      const { error } = await result as any;

      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success("Tarefa excluída.");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Erro ao excluir tarefa.");
      throw error;
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    return updateTask(taskId, { status });
  };

  return {
    tasks,
    loading,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus
  };
}
