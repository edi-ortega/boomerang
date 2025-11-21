import React, { useState, useEffect, useRef, useMemo } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { getSupabaseClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { UserSelect } from "@/components/ui/user-select";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Plus,
  Save,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  GanttChartSquare,
  Sparkles,
  Target,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentTenantId } from "@/lib/tenant-helper";
import AIGanttGeneratorModal from "@/components/gantt/AIGanttGeneratorModal";
import { useConfirm } from "@/hooks/use-confirm";
import {
  getWorkCalendar,
  getHolidays,
  validateTaskStartDate,
  buildTaskHierarchy,
  getAllTasksFlat,
  getTaskColor
} from "@/components/utils/TaskHierarchyHelper";

// ==================== CONFIGURAÇÕES ====================
const GANTT_CONFIG = {
  dayWidth: 45,
  rowHeight: 40,
  barHeight: 24,
  headerHeight: 90,
  leftPanelWidth: 350
};

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  background: '#ffffff',
  border: '#e2e8f0',
  text: '#1e293b',
  textLight: '#64748b',
  today: '#dc2626'
};

// ==================== HELPERS ====================
const formatDate = (date: Date | string | null): string => {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'done':
    case 'completed':
      return COLORS.success;
    case 'in_progress':
    case 'doing':
      return COLORS.primary;
    case 'blocked':
      return COLORS.danger;
    case 'review':
      return COLORS.warning;
    default:
      return COLORS.textLight;
  }
};

interface Task {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  due_date: string;
  assigned_to_email?: string;
  parent_id?: string | null;
  status: string;
  priority: string;
  progress: number;
  is_milestone?: boolean;
  milestone_order?: number | null;
  children?: Task[];
  start?: Date;
  finish?: Date;
  level?: number;
}

interface Project {
  id: string;
  name: string;
  methodology?: string;
  team_ids?: string[];
  manager_email?: string;
}

interface TeamMember {
  email: string;
  name: string;
  avatar_url?: string | null;
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function ProjectGanttV2() {
  const { confirm, ConfirmDialog } = useConfirm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || searchParams.get("id") || searchParams.get("project_id");

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAIGeneratorModal, setShowAIGeneratorModal] = useState(false);
  const [workCalendar, setWorkCalendar] = useState<any>(null);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [risksCount, setRisksCount] = useState(0);
  const [issuesCount, setIssuesCount] = useState(0);
  
  // Estados para drag de barras
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  
  // Estados para resize de barras
  const [isResizing, setIsResizing] = useState(false);
  const [resizeEdge, setResizeEdge] = useState<'left' | 'right' | null>(null);
  const [resizeStartDate, setResizeStartDate] = useState<Date | null>(null);
  
  // Estados para drag na lista de tarefas
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    start_date: "",
    due_date: "",
    assigned_to_email: "",
    parent_id: null as string | null,
    status: "todo",
    priority: "medium",
    progress: 0,
    is_milestone: false,
    milestone_order: null as number | null
  });

  // ==================== LOAD TENANT & CALENDAR ====================
  useEffect(() => {
    const loadTenant = async () => {
      try {
        const tid = await getCurrentTenantId();
        setTenantId(tid);
        
        // Load work calendar and holidays
        if (tid) {
          const calendar = await getWorkCalendar(tid);
          const holidaysList = await getHolidays(tid);
          setWorkCalendar(calendar);
          setHolidays(holidaysList);
        }
      } catch (error) {
        console.error("Error loading tenant:", error);
      }
    };
    loadTenant();
  }, []);

  // ==================== LOAD DATA ====================
  useEffect(() => {
    if (projectId && tenantId) {
      fetchInitialData();
    }
  }, [projectId, tenantId]);

  useEffect(() => {
    drawGantt();
  }, [tasks, expandedTasks, isDragging]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [projectData, allTasks, allUsersData] = await Promise.all([
        base44.entities.Project.filter({ id: projectId, client_id: tenantId }),
        base44.entities.Task.filter({ project_id: projectId, client_id: tenantId }),
        base44.entities.User.list()
      ]);

      setAllUsers(allUsersData || []);

      if (projectData && projectData.length > 0) {
        const proj = projectData[0];
        setProject(proj);

        // Buscar contadores de riscos e issues
        try {
          const [risks, issues] = await Promise.all([
            base44.entities.Risk.filter({ project_id: projectId, client_id: tenantId, status: 'active' }),
            base44.entities.Issue.filter({ project_id: projectId, client_id: tenantId, status: 'open' })
          ]);
          setRisksCount(risks?.length || 0);
          setIssuesCount(issues?.length || 0);
        } catch (error) {
          console.error('Error loading risks/issues:', error);
          setRisksCount(0);
          setIssuesCount(0);
        }
        
        // Verificar e corrigir ordenação dos marcos (executar apenas uma vez)
        const needsReorder = localStorage.getItem(`gantt_milestones_reordered_${projectId}`) !== 'true';
        if (needsReorder && allTasks && allTasks.length > 0) {
          try {
            // Marco 2: atualizar para task_number = 2
            await base44.entities.Task.update('291c5fb9-003b-4861-ab1f-2b774f140ebb', {
              task_number: 2,
              start_date: '2025-11-27',
              due_date: '2025-12-26'
            });
            
            // Marco 3: atualizar para task_number = 3
            await base44.entities.Task.update('3b3864f7-04d4-4539-8f9c-94961a9af79a', {
              task_number: 3,
              start_date: '2025-12-27',
              due_date: '2026-01-29'
            });
            
            localStorage.setItem(`gantt_milestones_reordered_${projectId}`, 'true');
            toast.success('Marcos reordenados com sucesso!');
            
            // Recarregar tarefas após reordenação
            const updatedTasks = await base44.entities.Task.filter({ project_id: projectId, client_id: tenantId });
            allTasks.length = 0;
            allTasks.push(...(updatedTasks || []));
          } catch (error) {
            console.error('Error reordering milestones:', error);
          }
        }

        // Criar mapa de usuários
        const userMap: Record<string, any> = {};
        (allUsersData || []).forEach((user: any) => {
          userMap[user.email] = user;
        });

        // Buscar membros dos times do projeto
        const memberEmails = new Set<string>();

        if (proj.team_ids && proj.team_ids.length > 0) {
          try {
            const allTeams = await base44.entities.Team.list();
            const projectTeams = allTeams.filter((team: any) => proj.team_ids!.includes(team.id));

            projectTeams.forEach((team: any) => {
              if (team.members && Array.isArray(team.members)) {
                team.members.forEach((member: any) => {
                  if (member.email) {
                    memberEmails.add(member.email);
                  }
                });
              }
            });
          } catch (error) {
            console.error('Error loading teams:', error);
          }
        }

        if (proj.manager_email) {
          memberEmails.add(proj.manager_email);
        }

        if (memberEmails.size === 0) {
          (allTasks || []).forEach((task: any) => {
            if (task.assigned_to_email) {
              memberEmails.add(task.assigned_to_email);
            }
          });
        }

        const members = Array.from(memberEmails).map(email => {
          const user = userMap[email];
          return {
            email: email,
            name: user?.full_name || email,
            avatar_url: user?.avatar_url || null
          };
        }).filter(m => m.email);

        setTeamMembers(members);
      }

      const hierarchicalTasks = buildTaskHierarchy(allTasks || []);
      setTasks(hierarchicalTasks);

      // Corrigir ordenação de tarefas no banco se necessário
      await fixTaskOrdering(allTasks || []);

      // Expandir todas as tarefas por padrão
      const allTaskIds = new Set<string>();
      const collectIds = (tasksToCollect: Task[]) => {
        tasksToCollect.forEach(task => {
          allTaskIds.add(task.id);
          if (task.children && task.children.length > 0) {
            collectIds(task.children);
          }
        });
      };
      collectIds(hierarchicalTasks);
      setExpandedTasks(allTaskIds);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const reloadTasks = async () => {
    try {
      const allTasks = await base44.entities.Task.filter({ project_id: projectId, client_id: tenantId });
      console.log('🔄 Reloaded tasks:', allTasks?.slice(0, 3).map(t => ({ 
        id: t.id, 
        title: t.title, 
        progress: t.progress, 
        status: t.status 
      })));
      
      const hierarchicalTasks = buildTaskHierarchy(allTasks || []);
      setTasks(hierarchicalTasks);

      const allTaskIds = new Set<string>();
      const collectIds = (tasksToProcess: Task[]) => {
        tasksToProcess.forEach(task => {
          allTaskIds.add(task.id);
          if (task.children && task.children.length > 0) {
            collectIds(task.children);
          }
        });
      };
      collectIds(hierarchicalTasks);
      setExpandedTasks(prev => new Set([...prev, ...allTaskIds]));

    } catch (error) {
      console.error("Error reloading tasks:", error);
      toast.error("Erro ao recarregar tarefas");
    }
  };

  const fixTaskOrdering = async (tasks: any[]) => {
    try {
      const supabase = await getSupabaseClient();
      
      // Agrupar por parent_id
      const taskGroups = new Map<string | null, any[]>();
      tasks.forEach((task: any) => {
        const parentKey = task.parent_id || 'root';
        if (!taskGroups.has(parentKey)) {
          taskGroups.set(parentKey, []);
        }
        taskGroups.get(parentKey)!.push(task);
      });
      
      // Verificar e corrigir cada grupo
      const updates: any[] = [];
      taskGroups.forEach((group) => {
        // Ordenar por data de início
        group.sort((a, b) => {
          const dateA = new Date(a.start_date || '9999-12-31').getTime();
          const dateB = new Date(b.start_date || '9999-12-31').getTime();
          return dateA - dateB;
        });
        
        // Verificar se a ordem está correta
        group.forEach((task, index) => {
          const expectedNumber = index + 1;
          if (task.task_number !== expectedNumber) {
            updates.push({
              id: task.id,
              task_number: expectedNumber
            });
          }
        });
      });
      
      // Aplicar correções se necessário
      if (updates.length > 0) {
        console.log(`🔧 Fixing ${updates.length} task orderings`);
        for (const update of updates) {
          await (supabase as any)
            .from('prj_task')
            .update({ task_number: update.task_number })
            .eq('id', update.id)
            .eq('client_id', tenantId);
        }
      }
    } catch (error) {
      console.error("Error fixing task ordering:", error);
    }
  };

  const buildTaskHierarchy = (flatTasks: any[]): Task[] => {
    const taskMap = new Map<string, Task>();
    const rootTasks: Task[] = [];

    flatTasks.forEach((task: any) => {
      const taskWithDates: Task = {
        ...task,
        children: [],
        level: 0,
        start: task.start_date ? new Date(task.start_date) : new Date(),
        finish: task.due_date ? new Date(task.due_date) : new Date()
      };
      taskMap.set(task.id, taskWithDates);
    });

    flatTasks.forEach((task: any) => {
      const taskWithChildren = taskMap.get(task.id);
      if (!taskWithChildren) return;

      if (task.parent_id && taskMap.has(task.parent_id)) {
        const parent = taskMap.get(task.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(taskWithChildren);
        }
      } else {
        rootTasks.push(taskWithChildren);
      }
    });

    // Definir níveis recursivamente
    const setLevels = (taskList: Task[], level: number = 0) => {
      taskList.forEach(task => {
        task.level = level;
        if (task.children && task.children.length > 0) {
          setLevels(task.children, level + 1);
        }
      });
    };

    setLevels(rootTasks);

    return rootTasks;
  };

  const getVisibleTasks = (): Task[] => {
    const visible: Task[] = [];
    const traverse = (taskList: Task[]) => {
      taskList.forEach(task => {
        visible.push(task);
        if (task.children && task.children.length > 0 && expandedTasks.has(task.id)) {
          traverse(task.children);
        }
      });
    };
    traverse(tasks);
    return visible;
  };

  const getAllTasksFlat = (): Task[] => {
    const flat: Task[] = [];
    const traverse = (taskList: Task[]) => {
      taskList.forEach(task => {
        flat.push(task);
        if (task.children && task.children.length > 0) {
          traverse(task.children);
        }
      });
    };
    traverse(tasks);
    return flat;
  };

  // ==================== TASK ACTIONS ====================
  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: "",
      description: "",
      start_date: "",
      due_date: "",
      assigned_to_email: "",
      parent_id: null,
      status: "todo",
      priority: "medium",
      progress: 0,
      is_milestone: false,
      milestone_order: null
    });
    setShowTaskForm(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      start_date: task.start_date,
      due_date: task.due_date,
      assigned_to_email: task.assigned_to_email || "",
      parent_id: task.parent_id || null,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      is_milestone: task.is_milestone || false,
      milestone_order: task.milestone_order || null
    });
    setShowTaskForm(true);
  };

  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = await getSupabaseClient();
      
      const taskData = {
        ...taskForm,
        parent_id: taskForm.parent_id === "none" ? null : taskForm.parent_id,
        project_id: projectId,
        client_id: tenantId,
      };

      console.log('💾 Saving task with data:', { 
        id: editingTask?.id, 
        progress: taskForm.progress,
        oldProgress: editingTask?.progress,
        willLetTriggerHandleStatus: true
      });

      // Verificar se as datas foram realmente alteradas
      const datesChanged = editingTask && (
        (editingTask.start_date || '') !== (taskForm.start_date || '') || 
        (editingTask.due_date || '') !== (taskForm.due_date || '')
      );
      
      const shouldReorder = !editingTask || datesChanged;

      console.log('🔄 Reorder check:', { 
        isNewTask: !editingTask, 
        datesChanged, 
        shouldReorder,
        oldStart: editingTask?.start_date,
        newStart: taskForm.start_date,
        oldDue: editingTask?.due_date,
        newDue: taskForm.due_date
      });

      if (editingTask) {
        // Agora enviamos o status junto, pois a lógica está no frontend
        const { data, error } = await (supabase as any)
          .from('prj_task')
          .update(taskData)
          .eq('id', editingTask.id)
          .eq('client_id', tenantId)
          .select('id, progress, status')
          .single();
          
        if (error) throw error;
        
        console.log('📥 Task updated in DB:', data);
        toast.success("Tarefa atualizada");
      } else {
        // Na criação, incluir o status inicial
        const { data, error } = await (supabase as any)
          .from('prj_task')
          .insert({ ...taskData, status: 'todo' })
          .select()
          .single();
          
        if (error) throw error;
        
        toast.success("Tarefa criada");
      }

      setShowTaskForm(false);
      await reloadTasks();
      
      // Reordenar tarefas APENAS se for nova tarefa OU se as datas foram alteradas
      if (shouldReorder) {
        console.log('🔄 Reordering tasks due to date changes');
        await reorderTasksByDate();
      } else {
        console.log('⏭️ Skipping reorder - only progress/status changed');
      }
      
      console.log('✅ Task saved and reloaded');
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Erro ao salvar tarefa");
    } finally {
      setIsSaving(false);
    }
  };

  const reorderTasksByDate = async () => {
    try {
      const supabase = await getSupabaseClient();
      
      // Buscar todas as tarefas do projeto
      const { data: allTasks, error: fetchError } = await (supabase as any)
        .from('prj_task')
        .select('id, start_date, due_date, task_number, parent_id')
        .eq('project_id', projectId)
        .eq('client_id', tenantId)
        .order('start_date', { ascending: true });
      
      if (fetchError) throw fetchError;
      
      // Agrupar por parent_id (tarefas sem pai e subtarefas)
      const taskGroups = new Map<string | null, any[]>();
      allTasks?.forEach((task: any) => {
        const parentKey = task.parent_id || 'root';
        if (!taskGroups.has(parentKey)) {
          taskGroups.set(parentKey, []);
        }
        taskGroups.get(parentKey)!.push(task);
      });
      
      // Reordenar cada grupo
      const updates: any[] = [];
      taskGroups.forEach((group) => {
        // Ordenar por data de início
        group.sort((a, b) => {
          const dateA = new Date(a.start_date || '9999-12-31').getTime();
          const dateB = new Date(b.start_date || '9999-12-31').getTime();
          return dateA - dateB;
        });
        
        // Atualizar task_number sequencialmente
        group.forEach((task, index) => {
          const newTaskNumber = index + 1;
          if (task.task_number !== newTaskNumber) {
            updates.push({
              id: task.id,
              task_number: newTaskNumber
            });
          }
        });
      });
      
      // Aplicar atualizações em lote
      if (updates.length > 0) {
        for (const update of updates) {
          await (supabase as any)
            .from('prj_task')
            .update({ task_number: update.task_number })
            .eq('id', update.id)
            .eq('client_id', tenantId);
        }
        
        console.log(`🔄 Reordered ${updates.length} tasks by date`);
        await reloadTasks();
      }
    } catch (error) {
      console.error("Error reordering tasks:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const confirmed = await confirm({
      title: "Excluir Tarefa",
      description: "Deseja realmente excluir esta tarefa? Esta ação não pode ser desfeita.",
    });
    
    if (!confirmed) return;

    try {
      await base44.entities.Task.delete(taskId);
      toast.success("Tarefa excluída");
      await reloadTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Erro ao excluir tarefa");
    }
  };

  const handleAIGenerated = async () => {
    await reloadTasks();
    setShowAIGeneratorModal(false);
    toast.success("Gantt atualizado!");
  };

  // ==================== DRAG HANDLERS ====================
  const getTaskAtPosition = (x: number, y: number, minDate: Date): { task: Task, taskIndex: number, edge?: 'left' | 'right' | null } | null => {
    const visibleTasks = getVisibleTasks();
    const taskIndex = Math.floor((y - GANTT_CONFIG.headerHeight) / GANTT_CONFIG.rowHeight);
    
    if (taskIndex < 0 || taskIndex >= visibleTasks.length) return null;
    
    const task = visibleTasks[taskIndex];
    if (!task.start || !task.finish) return null;
    
    const taskStartDays = Math.floor((task.start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const taskDurationDays = Math.ceil((task.finish.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    
    const barX = taskStartDays * GANTT_CONFIG.dayWidth + 8;
    const barWidth = taskDurationDays * GANTT_CONFIG.dayWidth - 16;
    const barY = GANTT_CONFIG.headerHeight + taskIndex * GANTT_CONFIG.rowHeight + (GANTT_CONFIG.rowHeight - GANTT_CONFIG.barHeight) / 2;
    
    if (x >= barX && x <= barX + barWidth && y >= barY && y <= barY + GANTT_CONFIG.barHeight) {
      // Detectar se está nas extremidades (10px de margem)
      const edgeThreshold = 10;
      let edge: 'left' | 'right' | null = null;
      
      if (x >= barX && x <= barX + edgeThreshold) {
        edge = 'left';
      } else if (x >= barX + barWidth - edgeThreshold && x <= barX + barWidth) {
        edge = 'right';
      }
      
      return { task, taskIndex, edge };
    }
    
    return null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const visibleTasks = getVisibleTasks();
    if (visibleTasks.length === 0) return;
    
    let minDate = new Date();
    visibleTasks.forEach(task => {
      if (task.start && task.start < minDate) minDate = task.start;
    });
    minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    
    const taskInfo = getTaskAtPosition(x, y, minDate);
    if (taskInfo && taskInfo.task.status !== 'done') {
      if (taskInfo.edge) {
        // Iniciar resize
        setIsResizing(true);
        setResizeEdge(taskInfo.edge);
        setDraggedTask(taskInfo.task);
        setDragStartX(x);
        setResizeStartDate(taskInfo.edge === 'left' ? new Date(taskInfo.task.start!) : new Date(taskInfo.task.finish!));
        canvas.style.cursor = 'ew-resize';
      } else {
        // Iniciar drag normal
        setIsDragging(true);
        setDraggedTask(taskInfo.task);
        setDragStartX(x);
        setDragStartDate(new Date(taskInfo.task.start!));
        canvas.style.cursor = 'grabbing';
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isResizing && draggedTask && resizeStartDate && resizeEdge) {
      // Resize da barra
      const deltaX = x - dragStartX;
      const deltaDays = Math.round(deltaX / GANTT_CONFIG.dayWidth);
      
      if (deltaDays !== 0) {
        setTasks(prevTasks => {
          const updateTaskInTree = (taskList: Task[]): Task[] => {
            return taskList.map(task => {
              if (task.id === draggedTask.id) {
                if (resizeEdge === 'left') {
                  // Redimensionando início
                  const newStart = new Date(resizeStartDate);
                  newStart.setDate(newStart.getDate() + deltaDays);
                  // Não permitir que o início seja depois do fim
                  if (newStart < task.finish!) {
                    return { ...task, start: newStart };
                  }
                } else if (resizeEdge === 'right') {
                  // Redimensionando fim
                  const newFinish = new Date(resizeStartDate);
                  newFinish.setDate(newFinish.getDate() + deltaDays);
                  // Não permitir que o fim seja antes do início
                  if (newFinish > task.start!) {
                    return { ...task, finish: newFinish };
                  }
                }
              }
              if (task.children && task.children.length > 0) {
                return { ...task, children: updateTaskInTree(task.children) };
              }
              return task;
            });
          };
          return updateTaskInTree(prevTasks);
        });
      }
    } else if (isDragging && draggedTask && dragStartDate) {
      // Drag normal (mover toda a barra)
      const deltaX = x - dragStartX;
      const deltaDays = Math.round(deltaX / GANTT_CONFIG.dayWidth);
      
      if (deltaDays !== 0) {
        const newStart = new Date(dragStartDate);
        newStart.setDate(newStart.getDate() + deltaDays);
        
        const duration = Math.ceil((draggedTask.finish!.getTime() - draggedTask.start!.getTime()) / (1000 * 60 * 60 * 24));
        const newFinish = new Date(newStart);
        newFinish.setDate(newFinish.getDate() + duration);
        
        setTasks(prevTasks => {
          const updateTaskInTree = (taskList: Task[]): Task[] => {
            return taskList.map(task => {
              if (task.id === draggedTask.id) {
                return { ...task, start: newStart, finish: newFinish };
              }
              if (task.children && task.children.length > 0) {
                return { ...task, children: updateTaskInTree(task.children) };
              }
              return task;
            });
          };
          return updateTaskInTree(prevTasks);
        });
      }
    } else {
      // Atualizar cursor baseado na posição
      const visibleTasks = getVisibleTasks();
      if (visibleTasks.length === 0) return;
      
      let minDate = new Date();
      visibleTasks.forEach(task => {
        if (task.start && task.start < minDate) minDate = task.start;
      });
      minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      
      const taskInfo = getTaskAtPosition(x, y, minDate);
      
      if (taskInfo && taskInfo.task.status !== 'done') {
        if (taskInfo.edge) {
          canvas.style.cursor = 'ew-resize';
        } else {
          canvas.style.cursor = 'grab';
        }
      } else {
        canvas.style.cursor = 'default';
      }
    }
  };

  const handleCanvasMouseUp = async () => {
    if ((isDragging || isResizing) && draggedTask) {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.cursor = 'default';
      }
      
      try {
        const currentTask = tasks.flatMap(function flatten(t: Task): Task[] {
          return [t, ...(t.children || []).flatMap(flatten)];
        }).find(t => t.id === draggedTask.id);
        
        if (currentTask && currentTask.start && currentTask.finish) {
          await base44.entities.Task.update(draggedTask.id, {
            start_date: currentTask.start.toISOString().split('T')[0],
            due_date: currentTask.finish.toISOString().split('T')[0]
          });
          
          toast.success(`Datas atualizadas: ${formatDate(currentTask.start)} - ${formatDate(currentTask.finish)}`);
          // Não recarregar para manter a posição da tarefa
        }
      } catch (error) {
        console.error("Error updating task:", error);
        toast.error("Erro ao atualizar datas");
      }
    }
    
    setIsDragging(false);
    setIsResizing(false);
    setResizeEdge(null);
    setDraggedTask(null);
    setDragStartX(0);
    setDragStartDate(null);
    setResizeStartDate(null);
  };

  const handleCanvasMouseLeave = () => {
    if (isDragging || isResizing) {
      handleCanvasMouseUp();
    }
  };

  // ==================== DRAW GANTT ====================
  const drawGantt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const visibleTasks = getVisibleTasks();
    if (visibleTasks.length === 0) {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }

    let minDate = new Date();
    let maxDate = new Date();

    visibleTasks.forEach(task => {
      if (task.start && task.start < minDate) minDate = task.start;
      if (task.finish && task.finish > maxDate) maxDate = task.finish;
    });

    // Usar exatamente o intervalo das tarefas, com uma pequena folga de 1 dia após a última
    minDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate() + 1);

    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const calculatedWidth = totalDays * GANTT_CONFIG.dayWidth + 32; // 32px de padding lateral
    const canvasHeight = visibleTasks.length * GANTT_CONFIG.rowHeight + GANTT_CONFIG.headerHeight;

    console.log('GANTT DEBUG:', {
      totalDays,
      dayWidth: GANTT_CONFIG.dayWidth,
      calculatedWidth,
      minDate: minDate.toISOString(),
      maxDate: maxDate.toISOString()
    });

    canvas.width = calculatedWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, calculatedWidth, canvasHeight);

    drawTimelineHeader(ctx, minDate, totalDays);
    drawGrid(ctx, totalDays, visibleTasks.length);
    drawTodayLine(ctx, minDate, totalDays);

    // Desenhar linhas de hierarquia
    visibleTasks.forEach((task, taskIndex) => {
      if (task.children && task.children.length > 0 && expandedTasks.has(task.id)) {
        task.children.forEach(child => {
          const childIndex = visibleTasks.findIndex(t => t.id === child.id);
          if (childIndex !== -1) {
            drawHierarchyLine(ctx, taskIndex, childIndex, minDate, task, child);
          }
        });
      }
    });

    // Desenhar barras de tarefas
    visibleTasks.forEach((task, index) => {
      drawTaskBar(ctx, task, index, minDate);
    });

    // Desenhar linhas de hierarquia (pai -> filho)
    visibleTasks.forEach((task, taskIndex) => {
      if (task.parent_id) {
        const parentIndex = visibleTasks.findIndex(t => t.id === task.parent_id);
        if (parentIndex !== -1) {
          drawHierarchyLine(ctx, parentIndex, taskIndex, minDate, visibleTasks[parentIndex], task);
        }
      }
    });
  };

  const drawTimelineHeader = (ctx: CanvasRenderingContext2D, minDate: Date, totalDays: number) => {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, totalDays * GANTT_CONFIG.dayWidth, GANTT_CONFIG.headerHeight);

    let currentDate = new Date(minDate);
    let currentMonth = currentDate.getMonth();
    let monthStartX = 0;

    for (let day = 0; day < totalDays; day++) {
      const x = day * GANTT_CONFIG.dayWidth;

      if (currentDate.getMonth() !== currentMonth || day === 0) {
        if (day !== 0) {
          const monthWidth = x - monthStartX;
          const prevDate = new Date(currentDate);
          prevDate.setDate(prevDate.getDate() - 1);
          
          ctx.fillStyle = COLORS.text;
          ctx.font = 'bold 13px Inter, sans-serif';
          ctx.textAlign = 'center';
          const monthName = prevDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
          ctx.fillText(monthName, monthStartX + monthWidth / 2, 25);

          ctx.strokeStyle = COLORS.border;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, GANTT_CONFIG.headerHeight);
          ctx.stroke();
        }

        currentMonth = currentDate.getMonth();
        monthStartX = x;
      }

      // Desenhar dia
      ctx.fillStyle = COLORS.textLight;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(currentDate.getDate().toString(), x + GANTT_CONFIG.dayWidth / 2, 55);

      // Dia da semana
      const dayOfWeek = currentDate.toLocaleDateString('pt-BR', { weekday: 'short' });
      ctx.fillStyle = COLORS.textLight;
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(dayOfWeek, x + GANTT_CONFIG.dayWidth / 2, 70);

      // Grid vertical
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, GANTT_CONFIG.headerHeight);
      ctx.stroke();

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Desenhar último mês
    const lastMonthWidth = (totalDays * GANTT_CONFIG.dayWidth) - monthStartX;
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    const lastMonthName = currentDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    ctx.fillText(lastMonthName, monthStartX + lastMonthWidth / 2, 25);

    // Linha horizontal
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GANTT_CONFIG.headerHeight);
    ctx.lineTo(totalDays * GANTT_CONFIG.dayWidth, GANTT_CONFIG.headerHeight);
    ctx.stroke();
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, totalDays: number, taskCount: number) => {
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;

    // Linhas horizontais
    for (let i = 0; i <= taskCount; i++) {
      const y = GANTT_CONFIG.headerHeight + i * GANTT_CONFIG.rowHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(totalDays * GANTT_CONFIG.dayWidth, y);
      ctx.stroke();
    }

    // Linhas verticais
    for (let day = 0; day <= totalDays; day++) {
      const x = day * GANTT_CONFIG.dayWidth;
      ctx.beginPath();
      ctx.moveTo(x, GANTT_CONFIG.headerHeight);
      ctx.lineTo(x, GANTT_CONFIG.headerHeight + taskCount * GANTT_CONFIG.rowHeight);
      ctx.stroke();
    }
  };

  const drawTodayLine = (ctx: CanvasRenderingContext2D, minDate: Date, totalDays: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDays = Math.floor((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    if (todayDays >= 0 && todayDays <= totalDays) {
      const x = todayDays * GANTT_CONFIG.dayWidth;
      ctx.strokeStyle = COLORS.today;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ctx.canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const drawTaskBar = (ctx: CanvasRenderingContext2D, task: Task, index: number, minDate: Date) => {
    if (!task.start || !task.finish) return;

    const y = GANTT_CONFIG.headerHeight + index * GANTT_CONFIG.rowHeight + (GANTT_CONFIG.rowHeight - GANTT_CONFIG.barHeight) / 2;

    // Usar as datas diretamente (já atualizadas no estado durante o drag)
    const adjustedStart = task.start;
    const adjustedFinish = task.finish;

    const taskStartDays = Math.floor((adjustedStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const taskDurationDays = Math.ceil((adjustedFinish.getTime() - adjustedStart.getTime()) / (1000 * 60 * 60 * 24)) || 1;

    const x = taskStartDays * GANTT_CONFIG.dayWidth + 8;
    const width = taskDurationDays * GANTT_CONFIG.dayWidth - 16;

    // Definir cor baseado no status e tipo
    let barColor = COLORS.primary;
    if (task.status === 'done') {
      barColor = COLORS.success;
    } else if (task.status === 'blocked') {
      barColor = COLORS.danger;
    }

    // Desenhar barra
    const radius = 6;

    // Sombra
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    // Se é milestone, usar gradiente roxo/rosa
    if (task.is_milestone) {
      const gradient = ctx.createLinearGradient(x, y, x + width, y);
      gradient.addColorStop(0, '#8b5cf6');
      gradient.addColorStop(1, '#ec4899');
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = barColor;
    }

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + GANTT_CONFIG.barHeight - radius);
    ctx.quadraticCurveTo(x + width, y + GANTT_CONFIG.barHeight, x + width - radius, y + GANTT_CONFIG.barHeight);
    ctx.lineTo(x + radius, y + GANTT_CONFIG.barHeight);
    ctx.quadraticCurveTo(x, y + GANTT_CONFIG.barHeight, x, y + GANTT_CONFIG.barHeight - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Se é milestone, adicionar ícone de diamante
    if (task.is_milestone) {
      const diamondSize = 10;
      const diamondX = x - 6;
      const diamondY = y + GANTT_CONFIG.barHeight / 2;

      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(diamondX, diamondY - diamondSize / 2);
      ctx.lineTo(diamondX + diamondSize / 2, diamondY);
      ctx.lineTo(diamondX, diamondY + diamondSize / 2);
      ctx.lineTo(diamondX - diamondSize / 2, diamondY);
      ctx.closePath();
      ctx.fill();
    }

    // Barra de progresso (mais escura)
    if (task.progress > 0) {
      const progressWidth = (width * task.progress) / 100;

      let progressColor = '#2563eb';
      if (task.is_milestone) {
        progressColor = '#7c3aed';
      } else if (task.status === 'done') {
        progressColor = '#059669';
      } else if (task.status === 'blocked') {
        progressColor = '#dc2626';
      }

      ctx.fillStyle = progressColor;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);

      if (progressWidth > width - radius) {
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + GANTT_CONFIG.barHeight - radius);
        ctx.quadraticCurveTo(x + width, y + GANTT_CONFIG.barHeight, x + width - radius, y + GANTT_CONFIG.barHeight);
        ctx.lineTo(x + radius, y + GANTT_CONFIG.barHeight);
      } else {
        ctx.lineTo(x + progressWidth, y);
        ctx.lineTo(x + progressWidth, y + GANTT_CONFIG.barHeight);
        ctx.lineTo(x + radius, y + GANTT_CONFIG.barHeight);
      }

      ctx.quadraticCurveTo(x, y + GANTT_CONFIG.barHeight, x, y + GANTT_CONFIG.barHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
    }

    // Texto: título à esquerda, percentual à direita
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    if (width > 120) {
      ctx.font = 'bold 12px Arial';
      let displayTitle = task.title;
      let titleWidth = ctx.measureText(displayTitle).width;
      const maxTitleWidth = width - 70;

      while (titleWidth > maxTitleWidth && displayTitle.length > 3) {
        displayTitle = displayTitle.slice(0, -1);
        titleWidth = ctx.measureText(displayTitle + '...').width;
      }
      if (displayTitle !== task.title) {
        displayTitle += '...';
      }

      ctx.fillText(displayTitle, x + 10, y + GANTT_CONFIG.barHeight / 2);

      if (task.progress > 0) {
        ctx.textAlign = 'right';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(`${task.progress}%`, x + width - 10, y + GANTT_CONFIG.barHeight / 2);
      }
    } else if (width > 60) {
      if (task.progress > 0) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`${task.progress}%`, x + width / 2, y + GANTT_CONFIG.barHeight / 2);
      }
    }
  };

  const drawHierarchyLine = (
    ctx: CanvasRenderingContext2D,
    parentIndex: number,
    childIndex: number,
    minDate: Date,
    parentTask: Task,
    childTask: Task
  ) => {
    if (!parentTask.start || !parentTask.finish || !childTask.start) return;

    const parentY = GANTT_CONFIG.headerHeight + parentIndex * GANTT_CONFIG.rowHeight + GANTT_CONFIG.rowHeight / 2;
    const childY = GANTT_CONFIG.headerHeight + childIndex * GANTT_CONFIG.rowHeight + GANTT_CONFIG.rowHeight / 2;

    const parentStartDays = Math.floor((parentTask.start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const parentDurationDays = Math.ceil((parentTask.finish.getTime() - parentTask.start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const parentEndX = (parentStartDays + parentDurationDays) * GANTT_CONFIG.dayWidth - 8;

    const childStartDays = Math.floor((childTask.start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const childStartX = childStartDays * GANTT_CONFIG.dayWidth + 8;

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(parentEndX, parentY);

    const horizontalGap = childStartX - parentEndX;
    const verticalGap = childY - parentY;
    const curveRadius = 12;

    if (horizontalGap < -curveRadius * 2) {
      const backX = childStartX - 20;
      const firstVerticalY = parentY + curveRadius * 2;

      ctx.quadraticCurveTo(
        parentEndX + curveRadius,
        parentY,
        parentEndX + curveRadius,
        parentY + curveRadius
      );

      ctx.lineTo(parentEndX + curveRadius, firstVerticalY - curveRadius);

      ctx.quadraticCurveTo(
        parentEndX + curveRadius,
        firstVerticalY,
        parentEndX,
        firstVerticalY
      );

      ctx.lineTo(backX + curveRadius, firstVerticalY);

      ctx.quadraticCurveTo(
        backX,
        firstVerticalY,
        backX,
        firstVerticalY + curveRadius
      );

      ctx.lineTo(backX, childY - curveRadius);

      ctx.quadraticCurveTo(
        backX,
        childY,
        backX + curveRadius,
        childY
      );

      ctx.lineTo(childStartX, childY);
    } else {
      if (verticalGap > 0) {
        ctx.quadraticCurveTo(
          parentEndX + curveRadius,
          parentY,
          parentEndX + curveRadius,
          parentY + curveRadius
        );

        ctx.lineTo(parentEndX + curveRadius, childY - curveRadius);

        ctx.quadraticCurveTo(
          parentEndX + curveRadius,
          childY,
          parentEndX + curveRadius * 2,
          childY
        );

        ctx.lineTo(childStartX, childY);
      } else if (verticalGap < 0) {
        ctx.quadraticCurveTo(
          parentEndX + curveRadius,
          parentY,
          parentEndX + curveRadius,
          parentY - curveRadius
        );

        ctx.lineTo(parentEndX + curveRadius, childY + curveRadius);

        ctx.quadraticCurveTo(
          parentEndX + curveRadius,
          childY,
          parentEndX + curveRadius * 2,
          childY
        );

        ctx.lineTo(childStartX, childY);
      } else {
        ctx.quadraticCurveTo(
          parentEndX + curveRadius,
          parentY,
          parentEndX + curveRadius,
          parentY
        );

        ctx.lineTo(childStartX, childY);
      }
    }

    ctx.stroke();

    const arrowSize = 6;
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(childStartX, childY);
    ctx.lineTo(childStartX - arrowSize, childY - arrowSize / 2);
    ctx.lineTo(childStartX - arrowSize, childY + arrowSize / 2);
    ctx.closePath();
    ctx.fill();
  };

  const drawDependency = (
    ctx: CanvasRenderingContext2D,
    fromTask: Task,
    toTask: Task,
    fromIndex: number,
    toIndex: number,
    minDate: Date
  ) => {
    if (!fromTask.start || !fromTask.finish || !toTask.start) return;

    const fromStartDays = Math.floor((fromTask.start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const fromDurationDays = Math.ceil((fromTask.finish.getTime() - fromTask.start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const toStartDays = Math.floor((toTask.start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    const fromX = (fromStartDays + fromDurationDays) * GANTT_CONFIG.dayWidth - 8;
    const fromY = GANTT_CONFIG.headerHeight + fromIndex * GANTT_CONFIG.rowHeight + GANTT_CONFIG.rowHeight / 2;
    const toX = toStartDays * GANTT_CONFIG.dayWidth + 8;
    const toY = GANTT_CONFIG.headerHeight + toIndex * GANTT_CONFIG.rowHeight + GANTT_CONFIG.rowHeight / 2;

    ctx.strokeStyle = COLORS.warning;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(fromX + 15, fromY);
    ctx.lineTo(fromX + 15, toY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Seta
    ctx.fillStyle = COLORS.warning;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - 8, toY - 5);
    ctx.lineTo(toX - 8, toY + 5);
    ctx.closePath();
    ctx.fill();
  };

  const visibleTasks = useMemo(() => getVisibleTasks(), [tasks, expandedTasks]);
  const allTasksFlat = useMemo(() => getAllTasksFlat(), [tasks]);

  // Calcular estatísticas do projeto
  const projectStats = useMemo(() => {
    const allTasks = getAllTasksFlat();
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress' || t.status === 'doing').length;
    const blockedTasks = allTasks.filter(t => t.status === 'blocked').length;
    
    const avgProgress = totalTasks > 0 
      ? Math.round(allTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / totalTasks)
      : 0;
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      avgProgress,
      activeRisks: risksCount,
      openIssues: issuesCount
    };
  }, [tasks, risksCount, issuesCount]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Projeto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div>
         {/* Header */}
         <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex flex-col gap-4 mb-8"
         >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(`/projectdetail?id=${projectId}`)}
                className="border-border hover:bg-accent"
              >
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <GanttChartSquare className="w-8 h-8" />
                  Gantt - {project?.name}
                </h1>
                <p className="text-muted-foreground">Cronograma visual do projeto</p>
              </div>
            </div>
            
            {/* Cards de estatísticas - Mesma linha do header */}
            <div className="flex gap-1.5 flex-wrap">
              <Card className="glass-effect border-border/50 w-[105px]">
                <CardContent className="p-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 rounded bg-primary/10">
                      <Target className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                      <p className="text-base font-bold text-foreground">{projectStats.totalTasks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-border/50 w-[105px]">
                <CardContent className="p-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 rounded bg-success/10">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Concluídas</p>
                      <p className="text-base font-bold text-success">{projectStats.completedTasks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-border/50 w-[130px]">
                <CardContent className="p-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 rounded bg-destructive/10">
                      <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Bloqueadas</p>
                      <p className="text-base font-bold text-destructive">{projectStats.blockedTasks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-border/50 w-[130px]">
                <CardContent className="p-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 rounded bg-orange-100">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Riscos</p>
                      <p className="text-base font-bold text-orange-600">{projectStats.activeRisks || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-border/50 w-[130px]">
                <CardContent className="p-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 rounded bg-yellow-100">
                      <AlertCircle className="w-3.5 h-3.5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Issues</p>
                      <p className="text-base font-bold text-yellow-600">{projectStats.openIssues || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-border/50 w-[130px]">
                <CardContent className="p-2">
                  <div className="flex items-center gap-1.5">
                    <div className="relative inline-flex items-center justify-center w-8 h-8">
                      <svg width="32" height="32" className="transform -rotate-90">
                        <circle
                          cx="16"
                          cy="16"
                          r="13"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="13"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          fill="none"
                          strokeDasharray={81.68}
                          strokeDashoffset={81.68 - (81.68 * projectStats.avgProgress) / 100}
                          className="text-primary transition-all duration-300"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-foreground">{projectStats.avgProgress}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Progresso</p>
                      <p className="text-base font-bold text-foreground">{projectStats.avgProgress}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>

        {/* Layout: Sidebar + Canvas */}
        <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
          {/* Sidebar Esquerda - Lista de Tarefas com Colunas */}
          <div
            className="bg-white border-r border-gray-200 flex-shrink-0 shadow-lg flex flex-col overflow-y-auto"
            style={{ width: '480px' }}
          >
            {/* Header com colunas */}
            <div
              className="grid grid-cols-[140px_60px_60px_45px_70px_105px] px-2 border-b-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 relative"
              style={{ height: `${GANTT_CONFIG.headerHeight}px` }}
            >
              <div className="font-bold text-gray-800 flex items-center px-1" style={{ fontSize: '10px' }}>TAREFA</div>
              <div className="font-bold text-gray-800 flex items-center justify-center px-1" style={{ fontSize: '10px' }}>INÍCIO</div>
              <div className="font-bold text-gray-800 flex items-center justify-center px-1" style={{ fontSize: '10px' }}>FIM</div>
              <div className="font-bold text-gray-800 flex items-center justify-center px-1" style={{ fontSize: '10px' }}>DIAS</div>
              <div className="font-bold text-gray-800 flex items-center justify-center px-1" style={{ fontSize: '10px' }}>%</div>
              <div className="font-bold text-gray-800 flex items-center px-1" style={{ fontSize: '10px' }}>RESPONSÁVEL</div>
              
              {/* Botão Nova Tarefa */}
              <button
                onClick={() => {
                  setEditingTask(null);
                  setTaskForm({
                    title: "",
                    description: "",
                    start_date: "",
                    due_date: "",
                    assigned_to_email: "",
                    parent_id: "none",
                    status: "todo",
                    priority: "medium",
                    progress: 0,
                    is_milestone: false,
                    milestone_order: 0
                  });
                  setShowTaskForm(true);
                }}
                className="absolute top-2 right-2 w-6 h-6 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center shadow-sm transition-colors"
                title="Nova Tarefa"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Lista de tarefas */}
            <div>
              {visibleTasks.map((task) => {
                const qtdDias = Math.ceil((task.finish.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
                const isMilestone = task.is_milestone;

                // Buscar avatar do responsável
                const assignedUser = allUsers.find(u => u.email === task.assigned_to_email);
                const avatarUrl = assignedUser?.avatar_url;
                const avatarColor = (assignedUser as any)?.avatar_color || '#3b82f6';
                const assignedName = assignedUser?.name || task.assigned_to_email || 'Não atribuído';
                const initial = assignedName !== 'Não atribuído' ? assignedName.charAt(0).toUpperCase() : '?';

                return (
                  <div
                    key={task.id}
                    draggable={task.status !== 'done'}
                    onDragStart={(e) => {
                      if (task.status === 'done') {
                        e.preventDefault();
                        return;
                      }
                      setDraggedTaskId(task.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (draggedTaskId && draggedTaskId !== task.id) {
                        setDragOverTaskId(task.id);
                      }
                    }}
                    onDragLeave={() => {
                      setDragOverTaskId(null);
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setDragOverTaskId(null);
                      
                      if (!draggedTaskId || draggedTaskId === task.id) return;
                      
                      try {
                        // Buscar tarefas origem e destino
                        const allTasksFlat = tasks.flatMap(function flatten(t: Task): Task[] {
                          return [t, ...(t.children || []).flatMap(flatten)];
                        });
                        
                        const sourceTask = allTasksFlat.find(t => t.id === draggedTaskId);
                        const targetTask = allTasksFlat.find(t => t.id === task.id);
                        
                        if (!sourceTask || !targetTask) return;
                        
                        // Verificar se estão no mesmo nível (mesmo parent_id)
                        if (sourceTask.parent_id !== targetTask.parent_id) {
                          toast.error("Só é possível reordenar tarefas do mesmo nível");
                          setDraggedTaskId(null);
                          return;
                        }
                        
                        // Pegar todas as tarefas do mesmo nível
                        const sameLevelTasks = allTasksFlat.filter(t => t.parent_id === sourceTask.parent_id);
                        const sourceIndex = sameLevelTasks.findIndex(t => t.id === draggedTaskId);
                        const targetIndex = sameLevelTasks.findIndex(t => t.id === task.id);
                        
                        if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
                          // Reordenar apenas tarefas do mesmo nível
                          const reorderedTasks = [...sameLevelTasks];
                          const [movedTask] = reorderedTasks.splice(sourceIndex, 1);
                          reorderedTasks.splice(targetIndex, 0, movedTask);
                          
                          // Atualizar task_number sequencialmente
                          const updates: Promise<any>[] = [];
                          for (let i = 0; i < reorderedTasks.length; i++) {
                            const t = reorderedTasks[i];
                            updates.push(
                              base44.entities.Task.update(t.id, {
                                task_number: i + 1
                              })
                            );
                          }
                          
                          await Promise.all(updates);
                          
                          toast.success("Ordem atualizada");
                          await reloadTasks();
                        }
                      } catch (error) {
                        console.error("Error reordering task:", error);
                        toast.error("Erro ao reordenar tarefa");
                      }
                      
                      setDraggedTaskId(null);
                    }}
                    onDragEnd={() => {
                      setDraggedTaskId(null);
                      setDragOverTaskId(null);
                    }}
                    className={`group grid grid-cols-[140px_60px_60px_45px_70px_105px] px-2 border-b transition-all relative ${
                      selectedTask?.id === task.id
                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                        : isMilestone
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-l-4 border-l-purple-500'
                          : dragOverTaskId === task.id
                            ? 'bg-blue-100 border-t-4 border-t-blue-500'
                            : task.status === 'done'
                              ? 'border-gray-100 hover:bg-gray-50 opacity-60'
                              : 'border-gray-100 hover:bg-gray-50 cursor-move'
                    }`}
                    style={{ height: `${GANTT_CONFIG.rowHeight}px` }}
                    onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                  >
                    {/* Coluna Tarefa */}
                    <div className="flex items-center gap-1 px-1" style={{ paddingLeft: `${(task.level || 0) * 8}px` }}>
                      {task.children && task.children.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(task.id);
                          }}
                          className="p-0.5 hover:bg-gray-200 rounded-full flex-shrink-0 transition-colors"
                        >
                          {expandedTasks.has(task.id) ? (
                            <ChevronDown className="w-3 h-3 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-600" />
                          )}
                        </button>
                      )}
                      {(!task.children || task.children.length === 0) && (
                        <div style={{ width: '14px' }} className="flex-shrink-0" />
                      )}

                      {isMilestone && (
                        <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Target className="w-2 h-2 text-white" />
                        </div>
                      )}

                      <p className={`font-medium truncate flex-1 ${isMilestone ? 'text-purple-900 font-bold' : 'text-gray-900'}`} style={{ fontSize: '11px' }} title={task.title}>
                        {task.title}
                      </p>
                    </div>

                    {/* Coluna Dt Inicial */}
                    <div className="text-gray-700 flex items-center justify-center font-medium px-1" style={{ fontSize: '10px' }}>
                      {new Date(task.start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>

                    {/* Coluna Dt Final */}
                    <div className="text-gray-700 flex items-center justify-center font-medium px-1" style={{ fontSize: '10px' }}>
                      {new Date(task.finish).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>

                    {/* Coluna Qtd Dias */}
                    <div className="flex items-center justify-center px-1">
                      <div className="w-fit bg-gray-100 rounded-full px-1 py-0.5 text-center" style={{ fontSize: '10px' }}>
                        {qtdDias}
                      </div>
                    </div>

                    {/* Coluna Progresso - Barra */}
                    <div className="flex items-center justify-center px-1">
                      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-300 flex items-center justify-center ${
                            isMilestone
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                              : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                          }`}
                          style={{ width: `${task.progress || 0}%` }}
                        >
                          {(task.progress || 0) > 30 && (
                            <span className="font-bold text-white drop-shadow" style={{ fontSize: '9px' }}>
                              {task.progress}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Coluna Responsável - Avatar apenas */}
                    <div className="flex items-center gap-1 px-1">
                      {assignedName !== 'Não atribuído' ? (
                        <>
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={assignedName}
                              className="w-5 h-5 rounded-full object-cover border border-white shadow-sm flex-shrink-0"
                              title={assignedName}
                            />
                          ) : (
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white border border-white shadow-sm flex-shrink-0"
                              style={{ backgroundColor: avatarColor, fontSize: '10px' }}
                              title={assignedName}
                            >
                              {initial}
                            </div>
                          )}
                          <span className="text-gray-700 truncate flex-1 font-medium" style={{ fontSize: '10px' }} title={assignedName}>
                            {assignedName.split(' ')[0]}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400 italic" style={{ fontSize: '10px' }}>-</span>
                      )}
                    </div>

                    {/* Botões de ação - aparecem no hover */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow-md">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTask(task);
                        }}
                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Canvas à Direita */}
          <div ref={canvasContainerRef} className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-blue-50" style={{ minWidth: 0, width: '100%' }}>
            <div style={{ display: 'inline-block' }}>
              <canvas
                ref={canvasRef}
                className="cursor-default"
                style={{ display: 'block' }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseLeave}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de IA */}
      <AIGanttGeneratorModal
        open={showAIGeneratorModal}
        onClose={() => setShowAIGeneratorModal(false)}
        projectId={projectId || ""}
        tenantId={tenantId || ""}
        onGenerated={handleAIGenerated}
      />

      {/* Modal de Tarefa */}
      <AnimatePresence>
        {showTaskForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTaskForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTaskForm(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="Nome da tarefa"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Descreva a tarefa"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Data Início</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={taskForm.start_date}
                      onChange={(e) => setTaskForm({ ...taskForm, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">Data Fim</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={taskForm.status} onValueChange={(value) => setTaskForm({ ...taskForm, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">A Fazer</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="review">Revisão</SelectItem>
                        <SelectItem value="blocked">Bloqueado</SelectItem>
                        <SelectItem value="done">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="assigned_to_email">Responsável</Label>
                  <UserSelect
                    users={teamMembers.map(m => ({ 
                      email: m.email, 
                      name: m.name,
                      full_name: m.name,
                      avatar_url: m.avatar_url
                    }))}
                    value={taskForm.assigned_to_email || ""}
                    onValueChange={(value) => setTaskForm({ ...taskForm, assigned_to_email: value })}
                    placeholder="Selecione um responsável"
                  />
                </div>

                <div>
                  <Label htmlFor="parent_id">Tarefa Pai</Label>
                  <Select value={taskForm.parent_id || ''} onValueChange={(value) => setTaskForm({ ...taskForm, parent_id: value || null })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sem tarefa pai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem tarefa pai</SelectItem>
                      {allTasksFlat
                        .filter(t => !editingTask || t.id !== editingTask.id)
                        .map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="progress">Progresso: {taskForm.progress}%</Label>
                  <Slider
                    id="progress"
                    min={0}
                    max={100}
                    step={1}
                    value={[taskForm.progress]}
                    onValueChange={(value) => {
                      const newProgress = value[0];
                      let newStatus = taskForm.status;
                      
                      // Atualizar status baseado no progresso
                      if (newProgress === 0) {
                        newStatus = 'todo';
                      } else if (newProgress === 100) {
                        newStatus = 'done';
                      } else if (newProgress > 0 && newProgress < 100) {
                        newStatus = 'in_progress';
                      }
                      
                      setTaskForm({ 
                        ...taskForm, 
                        progress: newProgress,
                        status: newStatus
                      });
                    }}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_milestone"
                    checked={taskForm.is_milestone}
                    onCheckedChange={(checked) => setTaskForm({ ...taskForm, is_milestone: checked as boolean })}
                  />
                  <Label htmlFor="is_milestone" className="cursor-pointer">
                    É um marco (milestone)?
                  </Label>
                </div>
              </div>

              <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTaskForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveTask} disabled={isSaving}>
                  {isSaving ? (
                    <>Salvando...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog />
    </div>
  );
}
