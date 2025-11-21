import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { useSupabaseQuery } from "./useSupabaseQuery";
import type { Sprint } from "@/types/project";

export function useSprints(projectId?: string) {
  const { currentTenantId } = useTenant();
  const { select, insert, update, delete: deleteFrom } = useSupabaseQuery();
  const queryClient = useQueryClient();

  const { data: sprints = [], isLoading } = useQuery({
    queryKey: ["sprints", projectId, currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) {
        console.log("⚠️ useSprints: currentTenantId não disponível");
        return [];
      }

      console.log("📦 Carregando sprints - tenant:", currentTenantId, "projeto:", projectId);

      let query = select("prj_sprint", "*");

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("❌ Erro ao carregar sprints:", error);
        throw error;
      }
      
      // Ordenar: sprints ativas/planejamento primeiro (ordem cronológica), finalizadas por último
      const sortedData = (data || []).sort((a, b) => {
        // Se um está completo e o outro não, o completo vai para o final
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        
        // Se ambos têm o mesmo status, ordenar por start_date (ordem cronológica)
        const dateA = new Date(a.start_date || '1900-01-01').getTime();
        const dateB = new Date(b.start_date || '1900-01-01').getTime();
        return dateA - dateB;
      });
      
      console.log("✅ Sprints carregados e ordenados:", sortedData?.length || 0);
      return sortedData as Sprint[];
    },
    enabled: !!currentTenantId,
  });

  const createSprint = useMutation({
    mutationFn: async (sprint: Partial<Sprint>) => {
      const result = await insert("prj_sprint", sprint);
      const { data, error } = await result.select().maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
    },
  });

  const updateSprint = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Sprint> & { id: string }) => {
      const result = update("prj_sprint", updates).eq("id", id);
      const { data, error } = await result.select().maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
    },
  });

  const deleteSprint = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteFrom("prj_sprint").eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
    },
  });

  return {
    sprints,
    isLoading,
    createSprint,
    updateSprint,
    deleteSprint,
  };
}

export function useSprint(sprintId?: string) {
  const { currentTenantId } = useTenant();
  const { select } = useSupabaseQuery();

  return useQuery({
    queryKey: ["sprint", sprintId, currentTenantId],
    queryFn: async () => {
      if (!sprintId || !currentTenantId) return null;

      const { data, error } = await select("prj_sprint", "*")
        .eq("id", sprintId)
        .maybeSingle();

      if (error) throw error;
      return data as Sprint;
    },
    enabled: !!sprintId && !!currentTenantId,
  });
}
