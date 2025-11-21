import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { useSupabaseQuery } from "./useSupabaseQuery";
import type { Board } from "@/types/project";

export function useBoards(projectId?: string) {
  const { currentTenantId } = useTenant();
  const { select, insert, update, delete: deleteFrom } = useSupabaseQuery();
  const queryClient = useQueryClient();

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ["boards", projectId, currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return [];

      let query = select("prj_board", "*");

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as Board[];
    },
    enabled: !!currentTenantId,
  });

  const createBoard = useMutation({
    mutationFn: async (board: Partial<Board>) => {
      const result = await insert("prj_board", board);
      const { data, error } = await result.select().maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", projectId, currentTenantId] });
    },
  });

  const updateBoard = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Board> & { id: string }) => {
      const result = update("prj_board", updates).eq("id", id);
      const { data, error } = await result.select().maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", projectId, currentTenantId] });
    },
  });

  const deleteBoard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteFrom("prj_board").eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", projectId, currentTenantId] });
    },
  });

  return {
    boards,
    isLoading,
    createBoard,
    updateBoard,
    deleteBoard,
  };
}

export function useBoard(boardId?: string) {
  const { currentTenantId } = useTenant();
  const { select } = useSupabaseQuery();

  return useQuery({
    queryKey: ["board", boardId, currentTenantId],
    queryFn: async () => {
      if (!boardId || !currentTenantId) return null;

      const { data, error } = await select("prj_board", "*")
        .eq("id", boardId)
        .maybeSingle();

      if (error) throw error;
      return data as Board;
    },
    enabled: !!boardId && !!currentTenantId,
  });
}
