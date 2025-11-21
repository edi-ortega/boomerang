import { useState, useEffect } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useSupabaseQuery } from "./useSupabaseQuery";
import { toast } from "sonner";

export function useStories(projectId?: string) {
  const { currentTenantId } = useTenant();
  const { select, insert, update, delete: deleteFrom } = useSupabaseQuery();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTenantId) {
      loadStories();
    }
  }, [projectId, currentTenantId]);

  const loadStories = async () => {
    if (!currentTenantId) return;

    setLoading(true);
    try {
      let query = select('prj_story', '*');
      
      // Filtrar por projeto apenas se um projeto estiver selecionado
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false }) as any;

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error("Error loading stories:", error);
      toast.error("Erro ao carregar histórias.");
    } finally {
      setLoading(false);
    }
  };

  const createStory = async (storyData: any) => {
    try {
      const result = await insert('prj_story', {
        ...storyData,
        project_id: projectId,
      });
      const { data, error } = await result.select('*').maybeSingle() as any;

      if (error) throw error;
      setStories([data, ...stories]);
      toast.success("História criada com sucesso.");
      return data;
    } catch (error) {
      console.error("Error creating story:", error);
      toast.error("Erro ao criar história.");
      throw error;
    }
  };

  const updateStory = async (storyId: string, storyData: any) => {
    try {
      const result = update('prj_story', storyData).eq('id', storyId);
      const { data, error } = await result.select('*').maybeSingle() as any;

      if (error) throw error;
      setStories(stories.map(s => s.id === storyId ? data : s));
      toast.success("História atualizada.");
      return data;
    } catch (error) {
      console.error("Error updating story:", error);
      toast.error("Erro ao atualizar história.");
      throw error;
    }
  };

  const deleteStory = async (storyId: string) => {
    try {
      const result = deleteFrom('prj_story').eq('id', storyId);
      const { error } = await result as any;

      if (error) throw error;
      setStories(stories.filter(s => s.id !== storyId));
      toast.success("História excluída.");
    } catch (error) {
      console.error("Error deleting story:", error);
      toast.error("Erro ao excluir história.");
      throw error;
    }
  };

  return {
    stories,
    loading,
    loadStories,
    createStory,
    updateStory,
    deleteStory
  };
}
