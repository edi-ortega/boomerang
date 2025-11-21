import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { useSupabaseQuery } from "./useSupabaseQuery";
import type { Task } from "@/types/project";

export function useTasks(projectId?: string) {
  const { currentTenantId } = useTenant();
  const { select, insert, update, delete: deleteFrom } = useSupabaseQuery();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", projectId, currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) {
        console.log("⚠️ useTasks: currentTenantId não disponível");
        return [];
      }

      console.log("📦 Carregando tarefas - tenant:", currentTenantId, "projeto:", projectId);

      let query = select("prj_task", "*");

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erro ao carregar tarefas:", error);
        throw error;
      }
      console.log("✅ Tarefas carregadas:", data?.length || 0);
      return data as Task[];
    },
    enabled: !!currentTenantId,
  });

  const createTask = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const result = await insert("prj_task", task);
      const { data, error } = await result.select().maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all task queries for this tenant
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const result = update("prj_task", updates).eq("id", id);
      const { data, error } = await result.select().maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all task queries for this tenant
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteFrom("prj_task").eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all task queries for this tenant
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
  };
}

export function useTask(taskId?: string) {
  const { currentTenantId } = useTenant();
  const { select } = useSupabaseQuery();

  return useQuery({
    queryKey: ["task", taskId, currentTenantId],
    queryFn: async () => {
      if (!taskId || !currentTenantId) return null;

      const { data, error } = await select("prj_task", "*")
        .eq("id", taskId)
        .maybeSingle();

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!taskId && !!currentTenantId,
  });
}
