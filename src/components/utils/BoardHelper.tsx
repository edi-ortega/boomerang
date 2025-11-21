import { bmr } from "@/api/boomerangClient";

let cachedBoards: any[] = [];
let boardsMap = new Map();

export const preloadProjectBoards = async (projectIds: string[]) => {
  try {
    const boards = await bmr.entities.Board.list();
    cachedBoards = boards.filter((b: any) => projectIds.includes(b.project_id));
    
    // Create map
    boardsMap.clear();
    cachedBoards.forEach((board: any) => {
      if (!boardsMap.has(board.project_id)) {
        boardsMap.set(board.project_id, []);
      }
      boardsMap.get(board.project_id).push(board);
    });
    
    return cachedBoards;
  } catch (error) {
    console.error('Error preloading boards:', error);
    return [];
  }
};

export const getColumnInfo = (taskOrStory: any, projectId: string) => {
  const projectBoards = boardsMap.get(projectId) || [];
  
  if (projectBoards.length === 0) {
    return { columnName: taskOrStory.status || 'Desconhecido', columnColor: '#888' };
  }

  // Find the board and column
  for (const board of projectBoards) {
    if (board.columns) {
      const column = board.columns.find((col: any) => col.status === taskOrStory.status);
      if (column) {
        return {
          columnName: column.name || taskOrStory.status,
          columnColor: column.color || '#888'
        };
      }
    }
  }

  return { columnName: taskOrStory.status || 'Desconhecido', columnColor: '#888' };
};
