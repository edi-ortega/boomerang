import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase-client";
import { useTenant } from "@/contexts/TenantContext";
import type { Epic, Feature, Story } from "@/types/project";

export function useEpics(projectId?: string) {
  const { currentTenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: epics = [], isLoading } = useQuery({
    queryKey: ["epics", projectId, currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) {
        console.log("⚠️ useEpics: currentTenantId não disponível");
        return [];
      }

      console.log("📦 Carregando épicos para tenant:", currentTenantId, "projeto:", projectId);
      const supabase = await getSupabaseClient();
      let query = (supabase as any)
        .from("prj_epic")
        .select("*")
        .eq("client_id", currentTenantId);

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erro ao carregar épicos:", error);
        throw error;
      }
      console.log("✅ Épicos carregados:", data?.length || 0);
      return data as Epic[];
    },
    enabled: !!currentTenantId,
  });

  const createEpic = useMutation({
    mutationFn: async (epic: Partial<Epic>) => {
      const supabase = await getSupabaseClient();
      const { data, error } = await (supabase as any)
        .from("prj_epic")
        .insert({ ...epic, client_id: currentTenantId })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epics", projectId, currentTenantId] });
    },
  });

  const updateEpic = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Epic> & { id: string }) => {
      const supabase = await getSupabaseClient();
      const { data, error } = await (supabase as any)
        .from("prj_epic")
        .update(updates)
        .eq("id", id)
        .eq("client_id", currentTenantId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epics", projectId, currentTenantId] });
    },
  });

  const deleteEpic = useMutation({
    mutationFn: async (id: string) => {
      const supabase = await getSupabaseClient();
      const { error } = await (supabase as any)
        .from("prj_epic")
        .delete()
        .eq("id", id)
        .eq("client_id", currentTenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epics", projectId, currentTenantId] });
    },
  });

  return { epics, isLoading, createEpic, updateEpic, deleteEpic };
}

export function useFeatures(projectId?: string, epicId?: string) {
  const { currentTenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: features = [], isLoading } = useQuery({
    queryKey: ["features", projectId, epicId, currentTenantId],
    queryFn: async () => {
      if (!currentTenantId || !projectId) return [];

      const supabase = await getSupabaseClient();
      let query = (supabase as any)
        .from("prj_feature")
        .select("*")
        .eq("client_id", currentTenantId)
        .eq("project_id", projectId);

      if (epicId) {
        query = query.eq("epic_id", epicId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as Feature[];
    },
    enabled: !!currentTenantId && !!projectId,
  });

  const createFeature = useMutation({
    mutationFn: async (feature: Partial<Feature>) => {
      const supabase = await getSupabaseClient();
      const { data, error } = await (supabase as any)
        .from("prj_feature")
        .insert({ ...feature, client_id: currentTenantId })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features", projectId, epicId, currentTenantId] });
    },
  });

  const updateFeature = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Feature> & { id: string }) => {
      const supabase = await getSupabaseClient();
      const { data, error } = await (supabase as any)
        .from("prj_feature")
        .update(updates)
        .eq("id", id)
        .eq("client_id", currentTenantId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features", projectId, epicId, currentTenantId] });
    },
  });

  const deleteFeature = useMutation({
    mutationFn: async (id: string) => {
      const supabase = await getSupabaseClient();
      const { error } = await (supabase as any)
        .from("prj_feature")
        .delete()
        .eq("id", id)
        .eq("client_id", currentTenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features", projectId, epicId, currentTenantId] });
    },
  });

  return { features, isLoading, createFeature, updateFeature, deleteFeature };
}

export function useStories(projectId?: string, featureId?: string) {
  const { currentTenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories", projectId, featureId, currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return [];

      console.log("📦 Carregando stories para tenant:", currentTenantId, "projeto:", projectId);
      const supabase = await getSupabaseClient();
      let query = (supabase as any)
        .from("prj_story")
        .select("*")
        .eq("client_id", currentTenantId);

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      if (featureId) {
        query = query.eq("feature_id", featureId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erro ao carregar stories:", error);
        throw error;
      }
      console.log("✅ Stories carregadas:", data?.length || 0);
      return data as Story[];
    },
    enabled: !!currentTenantId,
  });

  const createStory = useMutation({
    mutationFn: async (story: Partial<Story>) => {
      const supabase = await getSupabaseClient();
      const { data, error } = await (supabase as any)
        .from("prj_story")
        .insert({ ...story, client_id: currentTenantId })
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories", projectId, featureId, currentTenantId] });
    },
  });

  const updateStory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Story> & { id: string }) => {
      const supabase = await getSupabaseClient();
      const { data, error } = await (supabase as any)
        .from("prj_story")
        .update(updates)
        .eq("id", id)
        .eq("client_id", currentTenantId)
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories", projectId, featureId, currentTenantId] });
    },
  });

  const deleteStory = useMutation({
    mutationFn: async (id: string) => {
      const supabase = await getSupabaseClient();
      const { error } = await (supabase as any)
        .from("prj_story")
        .delete()
        .eq("id", id)
        .eq("client_id", currentTenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories", projectId, featureId, currentTenantId] });
    },
  });

  return { stories, isLoading, createStory, updateStory, deleteStory };
}
