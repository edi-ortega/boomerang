/**
 * BoardHelper - Gerenciamento de Boards e Colunas
 */

import { supabase } from "@/integrations/supabase/client";

interface BoardColumn {
  id: string;
  name: string;
  color: string;
  order_index: number;
  is_final?: boolean;
}

interface Board {
  id: string;
  name: string;
  columns: BoardColumn[];
}

// Cache de boards
const boardCache = new Map<string, { data: Board; timestamp: number }>();
const projectBoardCache = new Map<string, { data: Board; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Busca board do cache (síncrono)
 */
export const getBoardFromCache = (projectId: string): Board | null => {
  const cached = projectBoardCache.get(projectId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

/**
 * Busca o board de um projeto (com cache)
 */
export const getProjectBoard = async (projectId: string): Promise<Board | null> => {
  try {
    if (!projectId) return null;

    // Verificar cache
    const cached = projectBoardCache.get(projectId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.data;
    }

    // Buscar projeto
    const { data: projects } = await supabase
      .from('prj_project' as any)
      .select('board_id')
      .eq('id', projectId) as any;

    if (!projects || projects.length === 0) return null;

    const project = projects[0];
    if (!project.board_id) return null;

    // Buscar board
    const { data: boards } = await supabase
      .from('prj_board' as any)
      .select('*')
      .eq('id', project.board_id) as any;

    if (!boards || boards.length === 0) return null;

    const board = boards[0] as Board;

    // Salvar no cache
    boardCache.set(project.board_id, {
      data: board,
      timestamp: Date.now()
    });

    projectBoardCache.set(projectId, {
      data: board,
      timestamp: Date.now()
    });

    return board;
  } catch (error) {
    console.error('[BoardHelper] Error fetching project board:', error);
    return null;
  }
};

/**
 * Retorna informações da coluna (síncrono, usa cache)
 */
export const getColumnInfo = (
  board: Board | null,
  columnId: string
): { name: string; color: string } | null => {
  if (!board || !board.columns) return null;

  const column = board.columns.find(c => c.id === columnId);
  if (!column) return null;

  return {
    name: column.name,
    color: column.color
  };
};

/**
 * Pré-carrega boards de vários projetos
 */
export const preloadProjectBoards = async (projectIds: string[]): Promise<void> => {
  try {
    // Buscar board_ids dos projetos
    const { data: projects } = await supabase
      .from('prj_project' as any)
      .select('id, board_id')
      .in('id', projectIds) as any;

    if (!projects || projects.length === 0) return;

    const boardIds = [...new Set(projects.map((p: any) => p.board_id).filter(Boolean))];

    // Buscar todos os boards de uma vez
    const { data: boards } = await supabase
      .from('prj_board' as any)
      .select('*')
      .in('id', boardIds) as any;

    if (!boards) return;

    // Salvar no cache
    const now = Date.now();
    boards.forEach((board: Board) => {
      boardCache.set(board.id, { data: board, timestamp: now });
    });

    // Mapear boards para projetos
    projects.forEach((project: any) => {
      const board = boards.find((b: Board) => b.id === project.board_id);
      if (board) {
        projectBoardCache.set(project.id, { data: board, timestamp: now });
      }
    });

    console.log(`[BoardHelper] Preloaded ${boards.length} boards for ${projectIds.length} projects`);
  } catch (error) {
    console.error('[BoardHelper] Error preloading boards:', error);
  }
};

/**
 * Limpa cache expirado
 */
export const cleanExpiredBoardCache = (): void => {
  const now = Date.now();

  for (const [key, value] of boardCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      boardCache.delete(key);
    }
  }

  for (const [key, value] of projectBoardCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      projectBoardCache.delete(key);
    }
  }
};
