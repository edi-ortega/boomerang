import { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Filter, 
  Search,
  Folder,
  Calendar,
  Eye,
  AlertCircle,
  BookOpen
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import TaskViewModal from "../components/tasks/TaskViewModal";
import TaskCreateModal from "../components/tasks/TaskCreateModal";
import StoryViewModal from "../components/stories/StoryViewModal";
import StoryCreateModal from "../components/stories/StoryCreateModal";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { hasPermission, PERMISSIONS } from "@/lib/permissions-helper";
import { getCurrentTenantId } from "@/lib/tenant-helper";
import QuickTimeTracker from "../components/timesheet/QuickTimeTracker";
import { autoCompleteStoryIfNeeded, autoCompleteFeatureIfNeeded, autoCompleteEpicIfNeeded } from "../lib/complexity-helper";
import CircularProgress from "@/components/CircularProgress";

export default function KanbanBoard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [projects, setProjects] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedSprint, setSelectedSprint] = useState("all");
  const [viewMode, setViewMode] = useState<"tasks" | "stories" | "features" | "epics">("tasks");
  const [board, setBoard] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [storyTypes, setStoryTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showTaskCreateModal, setShowTaskCreateModal] = useState(false);
  const [showStoryCreateModal, setShowStoryCreateModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterStory, setFilterStory] = useState("all");
  const [canCreateTask, setCanCreateTask] = useState(false);
  const [canCreateStory, setCanCreateStory] = useState(false);
  const [features, setFeatures] = useState<any[]>([]);
  const [epics, setEpics] = useState<any[]>([]);

  // Função inteligente para mapear status para colunas
  const mapStatusToColumn = (status: string, columnId: string, columnName: string): boolean => {
    if (!status) return false;

    // Se o status corresponder exatamente ao ID da coluna, retornar true
    if (status === columnId) return true;

    // Normalizar strings para comparação
    const normalizeString = (str: string) => 
      str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/-/g, '_');

    const normalizedStatus = normalizeString(status);
    const normalizedColumnName = normalizeString(columnName);

    // Verificar correspondência DIRETA com nome da coluna normalizado
    if (normalizedStatus === normalizedColumnName) return true;

    // Mapeamento refinado - cada status mapeia para nomes específicos de colunas
    const statusToColumnMap: Record<string, string[]> = {
      // Backlog
      'backlog': ['backlog'],
      
      // To Do / A Fazer
      'todo': ['a_fazer', 'to_do'],
      'a_fazer': ['a_fazer'],
      'to_do': ['to_do'],
      'pendente': ['a_fazer', 'pendente'],
      
      // In Progress / Em Progresso / Doing
      'in_progress': ['em_progresso', 'in_progress'],
      'em_progresso': ['em_progresso'],
      'doing': ['em_progresso', 'doing'],
      'em_desenvolvimento': ['em_progresso', 'em_desenvolvimento'],
      
      // Aguardando / Waiting / Blocked
      'aguardando': ['aguardando'],
      'waiting': ['aguardando', 'waiting'],
      'blocked': ['aguardando', 'blocked', 'bloqueado'],
      'bloqueado': ['bloqueado', 'aguardando'],
      
      // Review
      'review': ['review', 'revisao'],
      'revisao': ['revisao', 'review'],
      
      // Testing
      'testing': ['testing', 'em_teste'],
      'em_teste': ['em_teste', 'testing'],
      
      // Done / Concluído
      'done': ['concluido', 'done'],
      'concluido': ['concluido'],
      'completed': ['concluido', 'completed'],
      'finalizado': ['concluido', 'finalizado']
    };

    const mappedColumns = statusToColumnMap[normalizedStatus];
    return mappedColumns ? mappedColumns.includes(normalizedColumnName) : false;
  };

  useEffect(() => {
    // Carregar filtros da URL
    const projectFromUrl = searchParams.get("project");
    const sprintFromUrl = searchParams.get("sprint");
    
    console.log('[KanbanBoard] URL params:', { projectFromUrl, sprintFromUrl });
    
    loadInitialData(projectFromUrl || undefined, sprintFromUrl || undefined);
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    }
  }, [selectedProject]);

  useEffect(() => {
    // Quando a sprint selecionada mudar, recarregar os dados para aplicar o filtro
    if (selectedProject && selectedSprint) {
      loadProjectData();
    }
  }, [selectedSprint]);

  const loadInitialData = async (projectFromUrl?: string, sprintFromUrl?: string) => {
    setIsLoading(true);
    try {
      const [canCreateT, canCreateS] = await Promise.all([
        hasPermission(PERMISSIONS.CREATE_TASK),
        hasPermission(PERMISSIONS.CREATE_STORY)
      ]);
      
      setCanCreateTask(canCreateT);
      setCanCreateStory(canCreateS);

      const tenantId = await getCurrentTenantId();
      console.log('[KanbanBoard] Loading data for tenant:', tenantId);

      if (!tenantId) {
        console.error('[KanbanBoard] No tenant ID found');
        toast({
          title: "Erro",
          description: "Tenant não encontrado. Por favor, faça login novamente.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const [allProjects, allUsers, allTaskTypes, allStoryTypes, allFeatures, allEpics] = await Promise.all([
        base44.entities.Project.list("-created_at"),
        base44.entities.User.list(),
        base44.entities.TaskType.list(),
        base44.entities.StoryType.list(),
        base44.entities.Feature.list(),
        base44.entities.Epic.list()
      ]);

      console.log('[KanbanBoard] Initial data loaded:', {
        projects: allProjects?.length,
        users: allUsers?.length,
        taskTypes: allTaskTypes?.length,
        storyTypes: allStoryTypes?.length,
        features: allFeatures?.length,
        epics: allEpics?.length
      });

      if (!allProjects || allProjects.length === 0) {
        console.warn('[KanbanBoard] No projects found for tenant:', tenantId);
      }

      setProjects(allProjects || []);
      setUsers(allUsers || []);
      setTaskTypes(allTaskTypes || []);
      setStoryTypes(allStoryTypes || []);
      setFeatures(allFeatures || []);
      setEpics(allEpics || []);

      // Se veio projeto da URL, usar ele; senão, usar o primeiro da lista
      let projectId = projectFromUrl;
      if (!projectId && allProjects && allProjects.length > 0) {
        projectId = allProjects[0].id;
      }

      if (projectId) {
        setSelectedProject(projectId);

        // Carregar dados do projeto imediatamente
        const project = allProjects.find(p => p.id === projectId);
        if (project) {
          const [projectSprints, boardData, projectTasks, projectStories] = await Promise.all([
            base44.entities.Sprint.filter({ project_id: projectId }),
            project.board_id ? base44.entities.Board.filter({ id: project.board_id }) : Promise.resolve([]),
            base44.entities.Task.filter({ project_id: projectId }),
            base44.entities.Story.filter({ project_id: projectId })
          ]);

          setSprints(projectSprints || []);
          setBoard(boardData && boardData.length > 0 ? boardData[0] : null);
          setTasks(projectTasks || []);
          setStories(projectStories || []);
          
          console.log('[KanbanBoard] Loaded project data:', {
            sprints: projectSprints?.length,
            board: boardData?.[0]?.name,
            boardColumns: boardData?.[0]?.columns?.map((c: any) => ({ id: c.id, name: c.name })),
            tasks: projectTasks?.length,
            taskStatuses: projectTasks?.map(t => ({ id: t.id, title: t.title, status: t.status })),
            stories: projectStories?.length,
            storyStatuses: projectStories?.map(s => ({ id: s.id, title: s.title, status: s.status }))
          });

          // Log crítico para debug
          if (boardData?.[0]?.columns && (projectTasks?.length || projectStories?.length)) {
            console.warn('=== KANBAN DEBUG ===');
            console.warn('Colunas do Board:', boardData[0].columns.map((c: any) => `${c.name} (${c.id})`).join(', '));
            if (projectTasks?.length) {
              console.warn('Status das Tasks:', [...new Set(projectTasks.map(t => t.status))].join(', '));
            }
            if (projectStories?.length) {
              console.warn('Status das Stories:', [...new Set(projectStories.map(s => s.status))].join(', '));
            }
            console.warn('===================');
          }
        }
      }

      // Se veio sprint da URL, setar ela DEPOIS de carregar os dados
      // Isso garante que o filtro seja aplicado corretamente
      if (sprintFromUrl) {
        console.log('[KanbanBoard] Setting sprint from URL:', sprintFromUrl);
        // Não aplicar filtro automaticamente, deixar como "all" para o usuário ver tudo
        // e escolher filtrar manualmente se quiser
        setSelectedSprint("all");
      }
    } catch (error) {
      console.error("[KanbanBoard] Error loading initial data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados iniciais.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncTasksSprintFromStories = async (projectTasks: any[], projectStories: any[]) => {
    try {
      // Encontrar tasks que precisam ser sincronizadas
      const tasksToSync = projectTasks.filter(task => {
        if (!task.story_id || task.sprint_id) return false;
        const story = projectStories.find(s => s.id === task.story_id);
        return story && story.sprint_id;
      });

      if (tasksToSync.length === 0) return;

      console.log(`[KanbanBoard] Sincronizando ${tasksToSync.length} tasks com sprint das histórias...`);

      // Atualizar cada task com o sprint da história
      await Promise.all(
        tasksToSync.map(task => {
          const story = projectStories.find(s => s.id === task.story_id);
          if (story?.sprint_id) {
            return base44.entities.Task.update(task.id, { sprint_id: story.sprint_id });
          }
        })
      );

      console.log('[KanbanBoard] Tasks sincronizadas com sucesso!');
    } catch (error) {
      console.error("[KanbanBoard] Error syncing tasks sprint:", error);
    }
  };

  const loadProjectData = async () => {
    if (!selectedProject) return;

    try {
      const project = projects.find(p => p.id === selectedProject);
      if (!project) return;

      const [projectSprints, boardData, projectTasks, projectStories] = await Promise.all([
        base44.entities.Sprint.filter({ project_id: selectedProject }),
        project.board_id ? base44.entities.Board.filter({ id: project.board_id }) : Promise.resolve([]),
        base44.entities.Task.filter({ project_id: selectedProject }),
        base44.entities.Story.filter({ project_id: selectedProject })
      ]);

      // Sincronizar tasks com sprint das histórias (executado uma vez)
      await syncTasksSprintFromStories(projectTasks || [], projectStories || []);

      // Recarregar tasks após sincronização
      const updatedTasks = await base44.entities.Task.filter({ project_id: selectedProject });

      setSprints(projectSprints || []);
      setBoard(boardData && boardData.length > 0 ? boardData[0] : null);
      setTasks(updatedTasks || []);
      setStories(projectStories || []);

    } catch (error) {
      console.error("[KanbanBoard] Error loading project data:", error);
      toast({
        title: "Erro ao carregar projeto",
        description: "Não foi possível carregar os dados do projeto.",
        variant: "destructive"
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;

    // Pegar o usuário atual da sessão
    const currentUserEmail = localStorage.getItem('bmr_session') 
      ? JSON.parse(localStorage.getItem('bmr_session') || '{}')?.user?.email 
      : null;

    try {
      if (viewMode === "tasks") {
        const taskToUpdate = tasks.find(t => t.id === draggableId);
        if (!taskToUpdate) return;

        // Preparar dados de atualização
        const updateData: any = { status: newStatus };
        
        // Se a task não tem responsável E o usuário está arrastando, atribuir automaticamente
        if (!taskToUpdate.assigned_to_email && currentUserEmail) {
          updateData.assigned_to_email = currentUserEmail;
        }

        // Atualização otimista: atualiza UI primeiro
        const updatedTasks = tasks.map(t => 
          t.id === draggableId ? { ...t, ...updateData } : t
        );
        setTasks(updatedTasks);

        // Depois atualiza no banco em background
        await base44.entities.Task.update(draggableId, updateData);

        // Auto-completar story se necessário, mas não recarrega toda a página
        if (taskToUpdate.story_id) {
          await autoCompleteStoryIfNeeded(taskToUpdate.story_id);
        }

        toast({
          title: "Status atualizado",
          description: updateData.assigned_to_email 
            ? "A tarefa foi movida e atribuída a você." 
            : "A tarefa foi movida com sucesso."
        });
      } else if (viewMode === "stories") {
        const storyToUpdate = stories.find(s => s.id === draggableId);
        if (!storyToUpdate) return;

        // Preparar dados de atualização
        const updateData: any = { status: newStatus };
        
        // Se a story não tem responsável E o usuário está arrastando, atribuir automaticamente
        if (!storyToUpdate.assigned_to_email && currentUserEmail) {
          updateData.assigned_to_email = currentUserEmail;
        }

        // Atualização otimista: atualiza UI primeiro
        const updatedStories = stories.map(s => 
          s.id === draggableId ? { ...s, ...updateData } : s
        );
        setStories(updatedStories);

        // Depois atualiza no banco em background
        await base44.entities.Story.update(draggableId, updateData);

        // Auto-completar feature se necessário, mas não recarrega toda a página
        if (storyToUpdate.feature_id) {
          await autoCompleteFeatureIfNeeded(storyToUpdate.feature_id);
        }

        toast({
          title: "Status atualizado",
          description: updateData.assigned_to_email 
            ? "A história foi movida e atribuída a você." 
            : "A história foi movida com sucesso."
        });
      }
    } catch (error) {
      console.error("[KanbanBoard] Error updating status:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status.",
        variant: "destructive"
      });
      // Reverter para estado anterior em caso de erro
      await loadProjectData();
    }
  };

  const handleCreateClick = (column: any) => {
    setSelectedColumn(column);
    if (viewMode === "tasks") {
      setShowTaskCreateModal(true);
    } else if (viewMode === "stories") {
      setShowStoryCreateModal(true);
    }
  };

  const handleViewTask = (task: any) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleViewStory = (story: any) => {
    setSelectedStory(story);
    setShowStoryModal(true);
  };

  const handleTaskUpdate = async (updatedTask: any) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleStoryUpdate = async (updatedStory: any) => {
    setStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
  };

  const handleTaskCreate = async () => {
    await loadProjectData();
    setShowTaskCreateModal(false);
    setSelectedColumn(null);
    
    toast({
      title: "Tarefa criada!",
      description: "A nova tarefa foi adicionada ao board."
    });
  };

  const handleStoryCreate = async () => {
    await loadProjectData();
    setShowStoryCreateModal(false);
    setSelectedColumn(null);
    
    toast({
      title: "História criada!",
      description: "A nova história foi adicionada ao board."
    });
  };

  const getFilteredTasks = (columnId: string) => {
    const column = board?.columns?.find((c: any) => c.id === columnId);
    const columnName = column?.name || '';
    
    console.log(`[getFilteredTasks] Verificando coluna: ${columnName} (${columnId})`);
    console.log('[getFilteredTasks] Total de tasks:', tasks.length);
    console.log('[getFilteredTasks] Tasks:', tasks.map(t => ({ title: t.title, status: t.status, sprint: t.sprint_id })));
    console.log('[getFilteredTasks] selectedSprint:', selectedSprint);
    
    const filtered = tasks.filter(task => {
      const statusMatch = mapStatusToColumn(task.status, columnId, columnName);
      console.log(`[getFilteredTasks] Task "${task.title}": statusMatch=${statusMatch}, status=${task.status}, sprint=${task.sprint_id}`);
      
      if (!statusMatch) return false;
      
      if (selectedSprint && selectedSprint !== "all" && task.sprint_id !== selectedSprint) {
        console.log(`[getFilteredTasks] Task "${task.title}" filtrada por sprint: ${task.sprint_id} !== ${selectedSprint}`);
        return false;
      }
      
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== "all" && task.priority !== filterPriority) return false;
      if (filterType !== "all" && task.task_type_id !== filterType) return false;
      if (filterAssignee !== "all" && task.assigned_to_email !== filterAssignee) return false;
      if (filterStory !== "all" && task.story_id !== filterStory) return false;
      return true;
    });
    
    console.log(`[getFilteredTasks] Coluna "${columnName}": ${filtered.length} tasks filtradas`);
    return filtered;
  };

  const getFilteredStories = (columnId: string) => {
    const column = board?.columns?.find((c: any) => c.id === columnId);
    const columnName = column?.name || '';
    
    return stories.filter(story => {
      if (!mapStatusToColumn(story.status, columnId, columnName)) return false;
      if (selectedSprint && selectedSprint !== "all" && story.sprint_id !== selectedSprint) return false;
      if (searchQuery && !story.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== "all" && story.priority !== filterPriority) return false;
      if (filterType !== "all" && story.story_type_id !== filterType) return false;
      if (filterAssignee !== "all" && story.assigned_to_email !== filterAssignee) return false;
      return true;
    });
  };

  const getFilteredFeatures = (columnId: string) => {
    const column = board?.columns?.find((c: any) => c.id === columnId);
    const columnName = column?.name || '';
    
    return features.filter(feature => {
      // Usar mapeamento inteligente de status
      if (!mapStatusToColumn(feature.status, columnId, columnName)) return false;
      
      if (searchQuery && !feature.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      if (filterPriority !== "all" && feature.priority !== filterPriority) {
        return false;
      }
      
      return true;
    });
  };

  const getFilteredEpics = (columnId: string) => {
    const column = board?.columns?.find((c: any) => c.id === columnId);
    const columnName = column?.name || '';
    
    return epics.filter(epic => {
      // Usar mapeamento inteligente de status
      if (!mapStatusToColumn(epic.status, columnId, columnName)) return false;
      
      if (searchQuery && !epic.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      if (filterPriority !== "all" && epic.priority !== filterPriority) {
        return false;
      }
      
      return true;
    });
  };

  const getUserName = (email: string) => {
    const user = users.find(u => u.email === email);
    return user?.name || user?.email || email;
  };

  const getUserAvatar = (email: string) => {
    const user = users.find(u => u.email === email);
    return user?.avatar_url;
  };

  const priorityColors: Record<string, string> = {
    low: "bg-blue-500/20 text-blue-600",
    medium: "bg-yellow-500/20 text-yellow-600",
    high: "bg-orange-500/20 text-orange-600",
    critical: "bg-red-500/20 text-red-600"
  };

  const priorityLabels: Record<string, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    critical: "Crítica"
  };

  const getTotalItemCount = () => {
    if (viewMode === "tasks") return getFilteredTasksAll().length;
    if (viewMode === "stories") return getFilteredStoriesAll().length;
    if (viewMode === "features") return features.filter(f => f.project_id === selectedProject).length;
    if (viewMode === "epics") return epics.filter(e => e.project_id === selectedProject).length;
    return 0;
  };

  const getItemCountInColumn = (columnId: string) => {
    if (viewMode === "tasks") return getFilteredTasks(columnId).length;
    if (viewMode === "stories") return getFilteredStories(columnId).length;
    if (viewMode === "features") return getFilteredFeatures(columnId).length;
    if (viewMode === "epics") return getFilteredEpics(columnId).length;
    return 0;
  };

  const getFilteredTasksAll = () => {
    return tasks.filter(task => {
      if (selectedSprint && selectedSprint !== "all" && task.sprint_id !== selectedSprint) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== "all" && task.priority !== filterPriority) return false;
      if (filterType !== "all" && task.task_type_id !== filterType) return false;
      if (filterAssignee !== "all" && task.assigned_to_email !== filterAssignee) return false;
      if (filterStory !== "all" && task.story_id !== filterStory) return false;
      return true;
    });
  };

  const getFilteredStoriesAll = () => {
    return stories.filter(story => {
      if (selectedSprint && selectedSprint !== "all" && story.sprint_id !== selectedSprint) return false;
      if (searchQuery && !story.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== "all" && story.priority !== filterPriority) return false;
      if (filterType !== "all" && story.story_type_id !== filterType) return false;
      if (filterAssignee !== "all" && story.assigned_to_email !== filterAssignee) return false;
      return true;
    });
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);
  const selectedSprintData = sprints.find(s => s.id === selectedSprint);

  // Calcular progresso da sprint
  const calculateSprintProgress = () => {
    if (selectedSprint === "all" || !board?.columns) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const filteredItems = viewMode === "tasks" ? getFilteredTasksAll() : 
                         viewMode === "stories" ? getFilteredStoriesAll() : [];
    
    const total = filteredItems.length;
    
    // Contar itens completados (na coluna final)
    const completed = filteredItems.filter(item => {
      const column = board.columns.find((col: any) => col.id === item.status);
      return column?.is_final === true;
    }).length;
    
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  const sprintProgress = calculateSprintProgress();

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground">Carregando quadro...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <Card>
          <CardContent className="p-12 text-center">
            <Folder className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Nenhum projeto encontrado</h2>
            <p className="text-muted-foreground mb-6">
              Crie um projeto para começar a usar o quadro Kanban
            </p>
            <Button onClick={() => navigate(createPageUrl("CreateProject"))}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Projeto
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Board não configurado</h2>
            <p className="text-muted-foreground mb-6">
              Este projeto não possui um board Kanban configurado
            </p>
            <Button onClick={() => navigate(createPageUrl("BoardManagement"))}>
              Gerenciar Boards
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Quadro Kanban</h1>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
              {/* Left side: Selects and project info */}
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Projeto
                    </label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Sprint
                    </label>
                    <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Sprints</SelectItem>
                        {sprints.map(sprint => (
                          <SelectItem key={sprint.id} value={sprint.id}>
                            {sprint.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Visualização
                    </label>
                    <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tasks">Tarefas</SelectItem>
                        <SelectItem value="stories">Histórias</SelectItem>
                        <SelectItem value="features">Funcionalidades</SelectItem>
                        <SelectItem value="epics">Épicos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedProjectData && (
                  <div className="flex items-center gap-4 p-3 bg-accent/30 rounded-lg flex-wrap">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedProjectData.color || '#3b82f6' }}
                      />
                      <span className="font-semibold text-foreground">{selectedProjectData.name}</span>
                    </div>
                    <Badge variant="outline">
                      {selectedProjectData.methodology === 'scrum' ? 'Scrum' : 
                       selectedProjectData.methodology === 'kanban' ? 'Kanban' : 
                       selectedProjectData.methodology === 'agile' ? 'Ágil' : 'Híbrido'}
                    </Badge>
                    {selectedSprintData && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <Badge className="bg-blue-500/20 text-blue-600">
                          Sprint: {selectedSprintData.name}
                        </Badge>
                      </>
                    )}
                    {board && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <Badge variant="outline">
                          Board: {board.name}
                        </Badge>
                        <Badge variant="outline">
                          {board.columns.length} colunas
                        </Badge>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Right side: Sprint progress circular chart */}
              {selectedSprint !== "all" && (
                <div className="flex items-center justify-center lg:border-l lg:pl-6">
                  <div className="flex flex-col items-center gap-2">
                    <CircularProgress 
                      value={sprintProgress.completed}
                      max={sprintProgress.total}
                      size={120}
                      strokeWidth={10}
                      showLabel={true}
                    />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Completude da Sprint</p>
                      <p className="text-xs text-muted-foreground">
                        {sprintProgress.completed} de {sprintProgress.total} {viewMode === "tasks" ? "tarefas" : "itens"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {board && board.columns && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 my-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{getTotalItemCount()}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            {board.columns.slice(0, 4).map((column: any) => (
              <Card key={column.id} className="border-l-4" style={{ borderLeftColor: column.color }}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{getItemCountInColumn(column.id)}</p>
                  <p className="text-sm text-muted-foreground">{column.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Prioridades</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {viewMode === "tasks" ? (
                taskTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))
              ) : (
                storyTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger>
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Responsáveis</SelectItem>
              {users.map(user => (
                <SelectItem key={user.email} value={user.email}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {viewMode === "tasks" && (
            <Select value={filterStory} onValueChange={setFilterStory}>
              <SelectTrigger>
                <SelectValue placeholder="História" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Histórias</SelectItem>
                {stories.map(story => (
                  <SelectItem key={story.id} value={story.id}>
                    {story.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {(() => {
          console.log('[KanbanBoard] Renderizando board:', { 
            hasBoard: !!board, 
            boardName: board?.name,
            hasColumns: !!board?.columns,
            columnsLength: board?.columns?.length,
            columns: board?.columns 
          });
          
          if (!board || !board.columns || board.columns.length === 0) {
            return (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {!board 
                    ? "Nenhum board configurado para este projeto." 
                    : !board.columns 
                    ? "Board sem colunas configuradas."
                    : "Board não possui colunas."}
                </p>
              </div>
            );
          }
          
          return (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {board.columns.map((column: any) => {
            const columnItems = viewMode === "tasks" 
              ? getFilteredTasks(column.id)
              : viewMode === "stories"
              ? getFilteredStories(column.id)
              : viewMode === "features"
              ? getFilteredFeatures(column.id)
              : getFilteredEpics(column.id);

            return (
              <div key={column.id} className="flex-shrink-0 w-80">
                <Card className="border-t-4 h-full flex flex-col" style={{ borderTopColor: column.color }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: column.color }}
                        />
                        <CardTitle className="text-lg">{column.name}</CardTitle>
                        <Badge variant="secondary">{columnItems.length}</Badge>
                      </div>
                      {(viewMode === "tasks" || viewMode === "stories") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCreateClick(column)}
                          disabled={viewMode === "tasks" ? !canCreateTask : !canCreateStory}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto p-4 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-accent/50' : ''
                        }`}
                      >
                        <AnimatePresence>
                          {viewMode === "tasks" ? (
                            columnItems.map((task: any, index: number) => (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <motion.div
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -20 }}
                                      className="mb-3"
                                    >
                                      <Card 
                                        className={`cursor-pointer hover:shadow-md transition-shadow ${
                                          snapshot.isDragging ? 'shadow-lg' : ''
                                        }`}
                                        onClick={() => handleViewTask(task)}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="font-medium text-sm text-foreground line-clamp-2 flex-1">
                                              {task.title}
                                            </h4>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 flex-shrink-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewTask(task);
                                              }}
                                            >
                                              <Eye className="w-3 h-3" />
                                            </Button>
                                          </div>

                                          <div className="flex flex-wrap gap-1 mb-2">
                                            {task.task_type_name && (
                                              <Badge 
                                                className="text-xs text-white"
                                                style={{ backgroundColor: task.task_type_color || '#3b82f6' }}
                                              >
                                                {task.task_type_name}
                                              </Badge>
                                            )}
                                            {task.priority && (
                                              <Badge className={`${priorityColors[task.priority]} text-xs`}>
                                                {priorityLabels[task.priority]}
                                              </Badge>
                                            )}
                                            {task.estimated_hours && (
                                              <Badge variant="outline" className="text-xs">
                                                {task.estimated_hours}h
                                              </Badge>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-2 mt-2">
                                            {task.assigned_to_email ? (
                                              <div className="flex items-center gap-2 flex-1">
                                                {getUserAvatar(task.assigned_to_email) ? (
                                                  <img
                                                    src={getUserAvatar(task.assigned_to_email)}
                                                    alt={getUserName(task.assigned_to_email)}
                                                    className="w-6 h-6 rounded-full object-cover"
                                                  />
                                                ) : (
                                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold">
                                                    {getUserName(task.assigned_to_email).charAt(0).toUpperCase()}
                                                  </div>
                                                )}
                                                <span className="text-xs text-muted-foreground truncate">
                                                  {getUserName(task.assigned_to_email)}
                                                </span>
                                              </div>
                                            ) : (
                                              <div className="flex-1" />
                                            )}
                                            
                                            <div className="flex-shrink-0 ml-2">
                                              <QuickTimeTracker 
                                                task={task} 
                                                compact={true}
                                                onTimeLogged={loadProjectData}
                                              />
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </motion.div>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          ) : viewMode === "stories" ? (
                            columnItems.map((story: any, index: number) => (
                              <Draggable key={story.id} draggableId={story.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <motion.div
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -20 }}
                                      className="mb-3"
                                    >
                                      <Card 
                                        className={`cursor-pointer hover:shadow-md transition-shadow ${
                                          snapshot.isDragging ? 'shadow-lg' : ''
                                        }`}
                                        onClick={() => handleViewStory(story)}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1">
                                              <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-2">
                                                {story.title}
                                              </h4>
                                              <div className="flex flex-wrap gap-1">
                                                {story.story_type_name && (
                                                  <Badge 
                                                    className="text-xs text-white"
                                                    style={{ backgroundColor: story.story_type_color || '#3b82f6' }}
                                                  >
                                                    {story.story_type_name}
                                                  </Badge>
                                                )}
                                                {story.priority && (
                                                  <Badge className={`${priorityColors[story.priority]} text-xs`}>
                                                    {priorityLabels[story.priority]}
                                                  </Badge>
                                                )}
                                                {story.story_points && (
                                                  <Badge variant="outline" className="text-xs">
                                                    {story.story_points} pts
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 flex-shrink-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewStory(story);
                                              }}
                                            >
                                              <BookOpen className="w-3 h-3" />
                                            </Button>
                                          </div>

                                          {story.assigned_to_email && (
                                            <div className="flex items-center gap-2 mt-2">
                                              {getUserAvatar(story.assigned_to_email) ? (
                                                <img
                                                  src={getUserAvatar(story.assigned_to_email)}
                                                  alt={getUserName(story.assigned_to_email)}
                                                  className="w-6 h-6 rounded-full object-cover"
                                                />
                                              ) : (
                                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold">
                                                  {getUserName(story.assigned_to_email).charAt(0).toUpperCase()}
                                                </div>
                                              )}
                                              <span className="text-xs text-muted-foreground truncate">
                                                {getUserName(story.assigned_to_email)}
                                              </span>
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </motion.div>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          ) : (
                            columnItems.map((item: any) => (
                              <Card key={item.id} className="mb-3">
                                <CardContent className="p-4">
                                  <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-2">
                                    {item.title}
                                  </h4>
                                  {item.priority && (
                                    <Badge className={`${priorityColors[item.priority]} text-xs`}>
                                      {priorityLabels[item.priority]}
                                    </Badge>
                                  )}
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </AnimatePresence>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </Card>
              </div>
            );
          })}
        </div>
          );
        })()}
      </DragDropContext>

      {showTaskModal && selectedTask && (
        <TaskViewModal
          task={selectedTask}
          projectId={selectedProject}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onSave={handleTaskUpdate}
        />
      )}

      {showStoryModal && selectedStory && (
        <StoryViewModal
          story={selectedStory}
          projectId={selectedProject}
          onClose={() => {
            setShowStoryModal(false);
            setSelectedStory(null);
          }}
          onSave={handleStoryUpdate}
        />
      )}

      {showTaskCreateModal && (
        <TaskCreateModal
          projectId={selectedProject}
          sprintId={selectedSprint !== "all" ? selectedSprint : undefined}
          onClose={() => {
            setShowTaskCreateModal(false);
            setSelectedColumn(null);
          }}
          onSave={handleTaskCreate}
        />
      )}

      {showStoryCreateModal && (
        <StoryCreateModal
          projectId={selectedProject}
          onClose={() => {
            setShowStoryCreateModal(false);
            setSelectedColumn(null);
          }}
          onSave={handleStoryCreate}
        />
      )}
    </div>
  );
}
