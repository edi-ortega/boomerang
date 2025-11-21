import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { useSupabaseQuery } from "./useSupabaseQuery";

export function useFeatures(projectId?: string, epicId?: string) {
  const { currentTenantId } = useTenant();
  const { select, insert, update, delete: deleteFrom } = useSupabaseQuery();
  const queryClient = useQueryClient();

  const { data: features = [], isLoading } = useQuery({
    queryKey: ["features", projectId, epicId, currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) {
        console.log("⚠️ useFeatures: currentTenantId não disponível");
        return [];
      }

      console.log("📦 Carregando features - tenant:", currentTenantId, "projeto:", projectId, "épico:", epicId);

      let query = select("prj_feature", "*");

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      if (epicId) {
        query = query.eq("epic_id", epicId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erro ao carregar features:", error);
        throw error;
      }
      console.log("✅ Features carregadas:", data?.length || 0);
      return data || [];
    },
    enabled: !!currentTenantId,
  });

  const createFeature = useMutation({
    mutationFn: async (feature: any) => {
      const result = await insert("prj_feature", feature);
      const { data, error } = await result.select().maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features", projectId, epicId, currentTenantId] });
    },
  });

  const updateFeature = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const result = update("prj_feature", updates).eq("id", id);
      const { data, error } = await result.select().maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features", projectId, epicId, currentTenantId] });
    },
  });

  const deleteFeature = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteFrom("prj_feature").eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features", projectId, epicId, currentTenantId] });
    },
  });

  return {
    features,
    isLoading,
    createFeature,
    updateFeature,
    deleteFeature,
  };
}
