import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { useSupabaseQuery } from "./useSupabaseQuery";

export function useEpics(projectId?: string) {
  const { currentTenantId } = useTenant();
  const { select, insert, update, delete: deleteFrom } = useSupabaseQuery();
  const queryClient = useQueryClient();

  const { data: epics = [], isLoading } = useQuery({
    queryKey: ["epics", projectId, currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) {
        console.log("⚠️ useEpics: currentTenantId não disponível");
        return [];
      }

      console.log("📦 Carregando épicos - tenant:", currentTenantId, "projeto:", projectId);
      let query = select("prj_epic", "*");

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erro ao carregar épicos:", error);
        throw error;
      }
      console.log("✅ Épicos carregados:", data?.length || 0);
      return data || [];
    },
    enabled: !!currentTenantId,
  });

  const createEpic = useMutation({
    mutationFn: async (epic: any) => {
      const result = await insert("prj_epic", epic);
      const { data, error } = await result.select().maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epics", projectId, currentTenantId] });
    },
  });

  const updateEpic = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const result = update("prj_epic", updates).eq("id", id);
      const { data, error } = await result.select().maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epics", projectId, currentTenantId] });
    },
  });

  const deleteEpic = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteFrom("prj_epic").eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epics", projectId, currentTenantId] });
    },
  });

  return {
    epics,
    isLoading,
    createEpic,
    updateEpic,
    deleteEpic,
  };
}
