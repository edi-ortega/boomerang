/**
 * ComplexityHelper - Gerenciamento de Story Points e Complexidade
 */

import { supabase } from "@/integrations/supabase/client";

export type ComplexityType = 'fibonacci' | 'tshirt' | 'power_of_2' | 'linear';

export interface ComplexityOption {
  label: string;
  value: string;
}

export const getComplexityOptionsSync = (type: ComplexityType): ComplexityOption[] => {
  const complexityScales: Record<ComplexityType, ComplexityOption[]> = {
    fibonacci: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '5', value: '5' },
      { label: '8', value: '8' },
      { label: '13', value: '13' },
      { label: '21', value: '21' },
      { label: '34', value: '34' },
      { label: '?', value: '?' },
      { label: '☕', value: '☕' }
    ],
    tshirt: [
      { label: 'XS', value: 'XS' },
      { label: 'S', value: 'S' },
      { label: 'M', value: 'M' },
      { label: 'L', value: 'L' },
      { label: 'XL', value: 'XL' },
      { label: 'XXL', value: 'XXL' },
      { label: '?', value: '?' },
      { label: '☕', value: '☕' }
    ],
    power_of_2: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '4', value: '4' },
      { label: '8', value: '8' },
      { label: '16', value: '16' },
      { label: '32', value: '32' },
      { label: '?', value: '?' },
      { label: '☕', value: '☕' }
    ],
    linear: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
      { label: '5', value: '5' },
      { label: '6', value: '6' },
      { label: '7', value: '7' },
      { label: '8', value: '8' },
      { label: '9', value: '9' },
      { label: '10', value: '10' },
      { label: '?', value: '?' },
      { label: '☕', value: '☕' }
    ],
  };

  return complexityScales[type] || complexityScales.fibonacci;
};

export const getComplexityLabel = (type: ComplexityType): string => {
  const labels: Record<ComplexityType, string> = {
    fibonacci: 'Story Points (Fibonacci)',
    tshirt: 'Tamanho (T-Shirt)',
    power_of_2: 'Story Points (Potência de 2)',
    linear: 'Story Points (Linear)',
  };

  return labels[type] || 'Story Points';
};

export const isNumericComplexity = (complexityType: ComplexityType): boolean => {
  return ['fibonacci', 'power_of_2', 'linear'].includes(complexityType);
};

/**
 * Calcula progresso de uma sprint
 */
export const calculateSprintProgress = async (
  sprintId: string, 
  projectComplexityType: ComplexityType = 'fibonacci'
) => {
  try {
    const { data: stories } = await supabase
      .from('prj_stories' as any)
      .select('*')
      .eq('sprint_id', sprintId) as any;

    if (!stories || stories.length === 0) {
      return {
        total: 0,
        completed: 0,
        unit: 'pts',
        isNumeric: true
      };
    }

    const isNumeric = isNumericComplexity(projectComplexityType);
    const unit = isNumeric ? 'pts' : 'stories';

    if (isNumeric) {
      const calculatePoints = (storyList: any[]) => {
        return storyList.reduce((sum, story) => {
          const points = story.story_points ? parseInt(story.story_points, 10) : 0;
          return sum + (isNaN(points) ? 0 : points);
        }, 0);
      };

      const completedStories = stories.filter((s: any) => s.status === 'done');
      const totalPoints = calculatePoints(stories);
      const completedPoints = calculatePoints(completedStories);

      return {
        total: totalPoints,
        completed: completedPoints,
        unit,
        isNumeric
      };
    } else {
      // T-Shirt sizing: contar histórias
      const completedCount = stories.filter((s: any) => s.status === 'done').length;
      return {
        total: stories.length,
        completed: completedCount,
        unit,
        isNumeric
      };
    }
  } catch (error) {
    console.error('[ComplexityHelper] Error calculating sprint progress:', error);
    return {
      total: 0,
      completed: 0,
      unit: 'pts',
      isNumeric: true
    };
  }
};

/**
 * Auto-completa história quando todas as tasks estiverem concluídas
 */
export const autoCompleteStoryIfNeeded = async (storyId: string): Promise<boolean> => {
  try {
    // Buscar história para pegar o project_id
    const { data: story } = await supabase
      .from('prj_story' as any)
      .select('project_id')
      .eq('id', storyId)
      .single() as any;

    if (!story) return false;

    // Buscar a coluna final do board do projeto
    const { data: board } = await supabase
      .from('prj_board' as any)
      .select(`
        id,
        prj_board_column!inner(id, is_final)
      `)
      .eq('project_id', story.project_id)
      .eq('prj_board_column.is_final', true)
      .single() as any;

    if (!board || !board.prj_board_column?.[0]?.id) return false;
    
    const finalColumnId = board.prj_board_column[0].id;

    // Buscar todas as tasks da história
    const { data: tasks } = await supabase
      .from('prj_task' as any)
      .select('status')
      .eq('story_id', storyId) as any;

    if (!tasks || tasks.length === 0) {
      return false; // Sem tasks, não auto-completar
    }

    // Verificar se todas as tasks estão na coluna final
    const allCompleted = tasks.every((t: any) => t.status === finalColumnId);

    if (allCompleted) {
      // Atualizar história para a coluna final
      await supabase
        .from('prj_story' as any)
        .update({ status: finalColumnId })
        .eq('id', storyId) as any;

      console.log('[ComplexityHelper] Story auto-completed:', storyId);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[ComplexityHelper] Error auto-completing story:', error);
    return false;
  }
};

/**
 * Auto-completa feature quando todas as stories estiverem concluídas
 */
export const autoCompleteFeatureIfNeeded = async (featureId: string): Promise<boolean> => {
  try {
    const { data: stories } = await supabase
      .from('prj_story' as any)
      .select('*')
      .eq('feature_id', featureId) as any;

    if (!stories || stories.length === 0) {
      return false;
    }

    const allCompleted = stories.every((s: any) => s.status === 'done');

    if (allCompleted) {
      await supabase
        .from('prj_feature' as any)
        .update({ status: 'completed' })
        .eq('id', featureId) as any;

      console.log('[ComplexityHelper] Feature auto-completed:', featureId);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[ComplexityHelper] Error auto-completing feature:', error);
    return false;
  }
};

/**
 * Auto-completa epic quando todas as features estiverem concluídas
 */
export const autoCompleteEpicIfNeeded = async (epicId: string): Promise<boolean> => {
  try {
    const { data: features } = await supabase
      .from('prj_feature' as any)
      .select('*')
      .eq('epic_id', epicId) as any;

    if (!features || features.length === 0) {
      return false;
    }

    const allCompleted = features.every((f: any) => f.status === 'completed');

    if (allCompleted) {
      await supabase
        .from('prj_epic' as any)
        .update({ status: 'completed' })
        .eq('id', epicId) as any;

      console.log('[ComplexityHelper] Epic auto-completed:', epicId);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[ComplexityHelper] Error auto-completing epic:', error);
    return false;
  }
};
