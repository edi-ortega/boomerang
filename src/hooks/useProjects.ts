import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { useSupabaseQuery } from "./useSupabaseQuery";
import type { Project } from "@/types/project";

export function useProjects() {
  const { currentTenantId } = useTenant();
  const { select, insert, update, delete: deleteFrom } = useSupabaseQuery();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", currentTenantId],
    queryFn: async () => {
      console.log("🔍 [useProjects] Executando query:", { currentTenantId });
      
      if (!currentTenantId) {
        console.warn("⚠️ [useProjects] currentTenantId está vazio, retornando array vazio");
        return [];
      }

      const { data, error } = await select("prj_project", "*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ [useProjects] Erro ao buscar projetos:", error);
        throw error;
      }
      
      console.log("✅ [useProjects] Projetos carregados:", { 
        count: data?.length || 0,
        projects: data 
      });
      
      return data as Project[];
    },
    enabled: !!currentTenantId,
    staleTime: 0,
    refetchOnMount: "always"
  });

  const createProject = useMutation({
    mutationFn: async (project: Partial<Project>) => {
      const result = await insert("prj_project", project);
      const { data, error } = await result.select().maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", currentTenantId] });
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const result = update("prj_project", updates).eq("id", id);
      const { data, error } = await result.select().maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", currentTenantId] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteFrom("prj_project").eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", currentTenantId] });
    },
  });

  return {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
  };
}

export function useProject(projectId?: string) {
  const { currentTenantId } = useTenant();
  const { select } = useSupabaseQuery();

  return useQuery({
    queryKey: ["project", projectId, currentTenantId],
    queryFn: async () => {
      if (!projectId || !currentTenantId) return null;

      const { data, error } = await select("prj_project", "*")
        .eq("id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!projectId && !!currentTenantId,
  });
}
