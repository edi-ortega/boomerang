import { bmr } from "@/api/boomerangClient";

export const isNumericComplexity = (complexity: any): boolean => {
  return !isNaN(parseFloat(complexity)) && isFinite(complexity);
};

export const getComplexityOptionsSync = (type: string = 'story'): string[] => {
  // Default complexity options
  const defaults = {
    story: ['XS', 'S', 'M', 'L', 'XL'],
    task: ['1', '2', '3', '5', '8', '13'],
    epic: ['S', 'M', 'L', 'XL', 'XXL'],
  };
  
  return defaults[type as keyof typeof defaults] || defaults.story;
};

export const autoCompleteStoryIfNeeded = async (storyId: string) => {
  try {
    const story = await bmr.entities.Story.filter({ id: storyId });
    if (!story || story.length === 0) return;
    
    const storyData = story[0];
    const tasks = await bmr.entities.Task.filter({ story_id: storyId });
    
    // If all tasks are done, mark story as done
    const allDone = tasks.length > 0 && tasks.every((t: any) => t.status === 'done');
    if (allDone && storyData.status !== 'done') {
      await bmr.entities.Story.update(storyId, { status: 'done' });
    }
  } catch (error) {
    console.error('Error auto-completing story:', error);
  }
};

export const autoCompleteFeatureIfNeeded = async (featureId: string) => {
  try {
    const feature = await bmr.entities.Feature.filter({ id: featureId });
    if (!feature || feature.length === 0) return;
    
    const featureData = feature[0];
    const stories = await bmr.entities.Story.filter({ feature_id: featureId });
    
    // If all stories are done, mark feature as done
    const allDone = stories.length > 0 && stories.every((s: any) => s.status === 'done');
    if (allDone && featureData.status !== 'done') {
      await bmr.entities.Feature.update(featureId, { status: 'done' });
    }
  } catch (error) {
    console.error('Error auto-completing feature:', error);
  }
};

export const autoCompleteEpicIfNeeded = async (epicId: string) => {
  try {
    const epic = await bmr.entities.Epic.filter({ id: epicId });
    if (!epic || epic.length === 0) return;
    
    const epicData = epic[0];
    const features = await bmr.entities.Feature.filter({ epic_id: epicId });
    
    // If all features are done, mark epic as done
    const allDone = features.length > 0 && features.every((f: any) => f.status === 'done');
    if (allDone && epicData.status !== 'done') {
      await bmr.entities.Epic.update(epicId, { status: 'done' });
    }
  } catch (error) {
    console.error('Error auto-completing epic:', error);
  }
};

export const calculateSprintProgress = (tasks: any[]): number => {
  if (!tasks || tasks.length === 0) return 0;
  
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  return Math.round((doneTasks / tasks.length) * 100);
};
