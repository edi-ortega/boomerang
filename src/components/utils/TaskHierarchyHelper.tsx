import { bmr } from "@/api/boomerangClient";
import { supabase } from "@/integrations/supabase/client";

// ==================== WORK CALENDAR FUNCTIONS ====================

export async function getWorkCalendar(tenantId: string) {
  try {
    const { data: settings } = await supabase
      .from('inv_system_settings')
      .select('*')
      .eq('client_id', tenantId)
      .eq('category', 'calendar')
      .eq('setting_key', 'work_calendar')
      .limit(1);
    
    if (settings && settings.length > 0) {
      return JSON.parse(settings[0].setting_value);
    }
    
    // Default work calendar
    return {
      workDays: [1, 2, 3, 4, 5], // Monday to Friday
      workHoursStart: 9,
      workHoursEnd: 18,
      hoursPerDay: 8
    };
  } catch (error) {
    console.error("Error loading work calendar:", error);
    return {
      workDays: [1, 2, 3, 4, 5],
      workHoursStart: 9,
      workHoursEnd: 18,
      hoursPerDay: 8
    };
  }
}

export async function getHolidays(tenantId: string) {
  try {
    const { data: settings } = await supabase
      .from('inv_system_settings')
      .select('*')
      .eq('client_id', tenantId)
      .eq('category', 'calendar')
      .eq('setting_key', 'holidays')
      .limit(1);
    
    if (settings && settings.length > 0) {
      return JSON.parse(settings[0].setting_value);
    }
    
    return [];
  } catch (error) {
    console.error("Error loading holidays:", error);
    return [];
  }
}

// ==================== DATE VALIDATION FUNCTIONS ====================

export function isWorkDay(date: Date, workCalendar: any, holidays: any[]) {
  const dayOfWeek = date.getDay();
  if (!workCalendar.workDays.includes(dayOfWeek)) {
    return false;
  }
  
  const dateStr = date.toISOString().split('T')[0];
  if (holidays.some((h: any) => h.date === dateStr)) {
    return false;
  }
  
  return true;
}

export function getNextWorkDay(date: Date, workCalendar: any, holidays: any[]) {
  let nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (!isWorkDay(nextDay, workCalendar, holidays)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

export function validateTaskStartDate(
  startDate: Date, 
  predecessorTasks: any[], 
  workCalendar: any, 
  holidays: any[]
) {
  if (!predecessorTasks || predecessorTasks.length === 0) {
    return startDate;
  }
  
  let latestEndDate = new Date(startDate);
  
  predecessorTasks.forEach(pred => {
    if (pred.due_date) {
      const predEndDate = new Date(pred.due_date);
      if (predEndDate > latestEndDate) {
        latestEndDate = predEndDate;
      }
    }
  });
  
  // Get next work day after the latest predecessor end date
  const validStartDate = getNextWorkDay(latestEndDate, workCalendar, holidays);
  
  return validStartDate > startDate ? validStartDate : startDate;
}

// ==================== TASK HIERARCHY FUNCTIONS ====================

export function buildTaskHierarchy(tasks: any[]) {
  // Primeiro ordenar todas as tarefas por task_number para manter ordem original
  const sortedTasks = [...tasks].sort((a, b) => {
    // Prioridade 1: task_number
    if (a.task_number !== null && b.task_number !== null) {
      return a.task_number - b.task_number;
    }
    if (a.task_number !== null) return -1;
    if (b.task_number !== null) return 1;
    
    // Prioridade 2: milestone_order
    if (a.milestone_order !== null && b.milestone_order !== null) {
      return a.milestone_order - b.milestone_order;
    }
    if (a.milestone_order !== null) return -1;
    if (b.milestone_order !== null) return 1;
    
    // Prioridade 3: data de início
    if (a.start_date && b.start_date) {
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    }
    
    // Fallback: título
    return (a.title || '').localeCompare(b.title || '');
  });
  
  const taskMap = new Map();
  const rootTasks: any[] = [];
  
  // First pass: create map mantendo a ordem
  sortedTasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [] });
  });
  
  // Second pass: build hierarchy mantendo a ordem do array original
  sortedTasks.forEach(task => {
    const taskWithChildren = taskMap.get(task.id);
    if (task.parent_id) {
      const parent = taskMap.get(task.parent_id);
      if (parent) {
        parent.children.push(taskWithChildren);
      } else {
        rootTasks.push(taskWithChildren);
      }
    } else {
      rootTasks.push(taskWithChildren);
    }
  });
  
  // Não precisa mais ordenar aqui, pois já está ordenado
  return rootTasks;
}

export function getAllTasksFlat(tasks: any[], level = 0): any[] {
  let result: any[] = [];
  
  tasks.forEach(task => {
    result.push({ ...task, level });
    if (task.children && task.children.length > 0) {
      result = result.concat(getAllTasksFlat(task.children, level + 1));
    }
  });
  
  return result;
}

export async function updateTaskHierarchy(
  taskId: string,
  parentId: string | null,
  allTasks: any[],
  tenantId: string
) {
  try {
    // Update the task's parent
    await bmr.entities.Task.update(taskId, { parent_id: parentId });
    
    // If moving to a parent, validate dates
    if (parentId) {
      const parent = allTasks.find(t => t.id === parentId);
      const task = allTasks.find(t => t.id === taskId);
      
      if (parent && task) {
        // Ensure child dates are within parent dates
        const parentStart = new Date(parent.start_date);
        const parentEnd = new Date(parent.due_date);
        const taskStart = new Date(task.start_date);
        const taskEnd = new Date(task.due_date);
        
        const updates: any = {};
        
        if (taskStart < parentStart) {
          updates.start_date = parent.start_date;
        }
        
        if (taskEnd > parentEnd) {
          updates.due_date = parent.due_date;
        }
        
        if (Object.keys(updates).length > 0) {
          await bmr.entities.Task.update(taskId, updates);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error updating task hierarchy:", error);
    throw error;
  }
}

// ==================== DATE CALCULATION FUNCTIONS ====================

export function calculateDuration(startDate: Date, endDate: Date, workCalendar: any, holidays: any[]) {
  let duration = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isWorkDay(currentDate, workCalendar, holidays)) {
      duration++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return duration;
}

export function calculateEndDate(startDate: Date, durationDays: number, workCalendar: any, holidays: any[]) {
  let remainingDays = durationDays;
  let currentDate = new Date(startDate);
  
  while (remainingDays > 0) {
    if (isWorkDay(currentDate, workCalendar, holidays)) {
      remainingDays--;
    }
    if (remainingDays > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return currentDate;
}

// ==================== GANTT HELPER FUNCTIONS ====================

export function getTaskColor(status: string) {
  const colors: Record<string, string> = {
    todo: '#94a3b8',
    in_progress: '#3b82f6',
    done: '#10b981',
    blocked: '#ef4444'
  };
  return colors[status] || colors.todo;
}

export function getTaskProgressColor(progress: number) {
  if (progress >= 100) return '#10b981';
  if (progress >= 75) return '#22c55e';
  if (progress >= 50) return '#3b82f6';
  if (progress >= 25) return '#f59e0b';
  return '#ef4444';
}
