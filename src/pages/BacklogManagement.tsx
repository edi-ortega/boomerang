import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProjects } from "@/hooks/useProjects";
import { useEpics, useStories } from "@/hooks/useBacklog";
import { useFeatures } from "@/hooks/useFeatures";
import { useTasks } from "@/hooks/useTasks";
import { useSprints } from "@/hooks/useSprints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/circular-progress";
import { ViewToggle } from "@/components/ViewToggle";
import { useViewModeStore } from "@/stores/viewModeStore";
import { useConfirm } from "@/hooks/use-confirm";
import { Plus, Search, Edit, Trash2, Target, Layers, BookOpen, CheckSquare, Eye } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EpicModal from "@/components/EpicModal";
import FeatureModal from "@/components/FeatureModal";
import StoryModal from "@/components/StoryModal";
import TaskModal from "@/components/TaskModal";

export default function BacklogManagement() {
  const navigate = useNavigate();
  const { viewMode } = useViewModeStore();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  
  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedEpicId, setSelectedEpicId] = useState<string>("");
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>("");
  const [selectedStoryId, setSelectedStoryId] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Data hooks
  const { projects } = useProjects();
  const { epics, isLoading: epicsLoading, updateEpic, deleteEpic } = useEpics(selectedProjectId);
  const { features, isLoading: featuresLoading, updateFeature, deleteFeature } = useFeatures(selectedProjectId, selectedEpicId);
  const { stories, isLoading: storiesLoading, updateStory, deleteStory } = useStories(selectedProjectId);
  const { tasks, isLoading: tasksLoading, updateTask, deleteTask } = useTasks(selectedProjectId);
  const { sprints } = useSprints(selectedProjectId);

  // Modals state
  const [showEpicModal, setShowEpicModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [viewModeModal, setViewModeModal] = useState(false);
  const [editingEpic, setEditingEpic] = useState<any>(null);
  const [editingFeature, setEditingFeature] = useState<any>(null);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);

  // Auto-select first project when projects load
  useEffect(() => {
    console.log("📊 [BacklogManagement] Dados carregados:", {
      projectsCount: projects.length,
      projects,
      selectedProjectId,
      epicsCount: epics.length,
      featuresCount: features.length,
      storiesCount: stories.length,
      tasksCount: tasks.length
    });
    
    if (projects.length > 0 && !selectedProjectId) {
      console.log("🎯 [BacklogManagement] Auto-selecionando primeiro projeto:", projects[0].id);
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId, epics, features, stories, tasks]);

  // Filter data
  const filteredEpics = epics.filter(epic => {
    if (priorityFilter && epic.priority !== priorityFilter) return false;
    if (statusFilter && epic.status !== statusFilter) return false;
    if (searchQuery && !epic.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredFeatures = features.filter(feature => {
    if (priorityFilter && feature.priority !== priorityFilter) return false;
    if (statusFilter && feature.status !== statusFilter) return false;
    if (searchQuery && !feature.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredStories = stories.filter(story => {
    if (priorityFilter && story.priority !== priorityFilter) return false;
    if (statusFilter && story.status !== statusFilter) return false;
    if (searchQuery && !story.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredTasks = tasks.filter(task => {
    if (priorityFilter && task.priority !== priorityFilter) return false;
    if (statusFilter && task.status !== statusFilter) return false;
    if (selectedStoryId && task.story_id !== selectedStoryId) return false;
    if (searchQuery && !task.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Handlers
  const handleEditEpic = (epic: any) => {
    setEditingEpic(epic);
    setViewModeModal(false);
    setShowEpicModal(true);
  };

  const handleViewEpic = (epic: any) => {
    setEditingEpic(epic);
    setViewModeModal(true);
    setShowEpicModal(true);
  };

  const handleEpicSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["epics"] });
    setShowEpicModal(false);
    setEditingEpic(null);
    setViewModeModal(false);
  };

  const handleDeleteEpic = async (epicId: string) => {
    const confirmed = await confirm({
      title: "Excluir Épico",
      description: "Tem certeza que deseja excluir este épico? Esta ação não pode ser desfeita.",
    });

    if (confirmed) {
      try {
        await deleteEpic.mutateAsync(epicId);
        toast.success("Épico excluído com sucesso");
      } catch (error) {
        toast.error("Erro ao excluir épico");
      }
    }
  };

  const handleEditFeature = (feature: any) => {
    setEditingFeature(feature);
    setShowFeatureModal(true);
  };

  const handleFeatureSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["features"] });
    setShowFeatureModal(false);
    setEditingFeature(null);
  };

  const handleDeleteFeature = async (featureId: string) => {
    const confirmed = await confirm({
      title: "Excluir Feature",
      description: "Tem certeza que deseja excluir esta feature? Esta ação não pode ser desfeita.",
    });

    if (confirmed) {
      try {
        await deleteFeature.mutateAsync(featureId);
        toast.success("Feature excluída com sucesso");
      } catch (error) {
        toast.error("Erro ao excluir feature");
      }
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleTaskSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleEditStory = (story: any) => {
    setEditingStory(story);
    setShowStoryModal(true);
  };

  const handleStorySaved = () => {
    queryClient.invalidateQueries({ queryKey: ["stories"] });
    setShowStoryModal(false);
    setEditingStory(null);
  };

  const handleDeleteStory = async (storyId: string) => {
    const confirmed = await confirm({
      title: "Excluir História",
      description: "Tem certeza que deseja excluir esta história? Esta ação não pode ser desfeita.",
    });

    if (confirmed) {
      try {
        await deleteStory.mutateAsync(storyId);
        toast.success("História excluída com sucesso");
      } catch (error) {
        toast.error("Erro ao excluir história");
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const confirmed = await confirm({
      title: "Excluir Tarefa",
      description: "Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.",
    });

    if (confirmed) {
      try {
        await deleteTask.mutateAsync(taskId);
        toast.success("Tarefa excluída com sucesso");
      } catch (error) {
        toast.error("Erro ao excluir tarefa");
      }
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "done": return "default";
      case "in_progress": return "secondary";
      case "planning": return "outline";
      default: return "outline";
    }
  };

  const renderCard = (item: any, type: "epic" | "feature" | "story" | "task") => {
    const Icon = type === "epic" ? Target : type === "feature" ? Layers : type === "story" ? BookOpen : CheckSquare;
    
    return (
      <Card key={item.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Icon className="w-4 h-4 text-primary" />
                <CardTitle className="text-base line-clamp-1">{item.title}</CardTitle>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (type === "epic") navigate(`/epicview?id=${item.id}`);
                    else if (type === "feature") navigate(`/featureview?id=${item.id}`);
                    else if (type === "story") navigate(`/storyview?id=${item.id}`);
                    else if (type === "task") navigate(`/taskview?id=${item.id}`);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (type === "epic") handleEditEpic(item);
                    else if (type === "feature") handleEditFeature(item);
                    else if (type === "story") handleEditStory(item);
                    else if (type === "task") handleEditTask(item);
                  }}
                >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (type === "epic") handleDeleteEpic(item.id);
                  else if (type === "feature") handleDeleteFeature(item.id);
                  else if (type === "story") handleDeleteStory(item.id);
                  else if (type === "task") handleDeleteTask(item.id);
                }}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {stripHtml(item.description)}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {item.assigned_user && (
              <div className="flex items-center gap-2" title={item.assigned_user.name}>
                {item.assigned_user.avatar_url ? (
                  <img
                    src={item.assigned_user.avatar_url}
                    alt={item.assigned_user.name}
                    className="w-7 h-7 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium border-2 border-border">
                    {item.assigned_user.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            )}
            {item.priority && (
              <Badge variant={getPriorityColor(item.priority)}>
                {item.priority}
              </Badge>
            )}
            {item.status && (
              <Badge variant={getStatusColor(item.status)}>
                {item.status}
              </Badge>
            )}
          </div>
          {typeof item.progress === "number" && (
            <div className="flex items-center gap-2">
              <CircularProgress value={item.progress} size={40} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderList = (items: any[], type: "epic" | "feature" | "story" | "task") => {
    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => renderCard(item, type))}
        </div>
      );
    }

    // List mode - single column, compact
    return (
      <div className="space-y-3">
        {items.map(item => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {type === "epic" && <Target className="w-4 h-4 text-primary flex-shrink-0" />}
                  {type === "feature" && <Layers className="w-4 h-4 text-primary flex-shrink-0" />}
                  {type === "story" && <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />}
                  {type === "task" && <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {stripHtml(item.description)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.assigned_user && (
                    <div className="flex items-center gap-2" title={item.assigned_user.name}>
                      {item.assigned_user.avatar_url ? (
                        <img
                          src={item.assigned_user.avatar_url}
                          alt={item.assigned_user.name}
                          className="w-7 h-7 rounded-full object-cover border-2 border-border"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium border-2 border-border">
                          {item.assigned_user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                  )}
                  {item.priority && (
                    <Badge variant={getPriorityColor(item.priority)} className="text-xs">
                      {item.priority}
                    </Badge>
                  )}
                  {item.status && (
                    <Badge variant={getStatusColor(item.status)} className="text-xs">
                      {item.status}
                    </Badge>
                  )}
                  {typeof item.progress === "number" && (
                    <CircularProgress value={item.progress} size={32} strokeWidth={3} />
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      if (type === "epic") handleViewEpic(item);
                      else if (type === "feature") handleEditFeature(item);
                      else if (type === "story") handleEditStory(item);
                      else if (type === "task") handleEditTask(item);
                    }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      if (type === "epic") handleEditEpic(item);
                      else if (type === "feature") handleEditFeature(item);
                      else if (type === "story") handleEditStory(item);
                      else if (type === "task") handleEditTask(item);
                    }}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      if (type === "epic") handleDeleteEpic(item.id);
                      else if (type === "feature") handleDeleteFeature(item.id);
                      else if (type === "story") handleDeleteStory(item.id);
                      else if (type === "task") handleDeleteTask(item.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Backlog</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedProjectId || "all"} onValueChange={(val) => setSelectedProjectId(val === "all" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter || "all"} onValueChange={(val) => setPriorityFilter(val === "all" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter || "all"} onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="planning">Planejamento</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="done">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="epics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="epics">Épicos</TabsTrigger>
          <TabsTrigger value="features">Funcionalidades</TabsTrigger>
          <TabsTrigger value="stories">Histórias</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
        </TabsList>

        <TabsContent value="epics" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedProjectId || "all"} onValueChange={(val) => setSelectedProjectId(val === "all" ? "" : val)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <ViewToggle />
              <Button 
                onClick={() => setShowEpicModal(true)}
                disabled={!selectedProjectId}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Épico
              </Button>
            </div>
          </div>

          {epicsLoading ? (
            <div>Carregando...</div>
          ) : filteredEpics.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum épico encontrado
              </CardContent>
            </Card>
          ) : (
            renderList(filteredEpics, "epic")
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedEpicId || "all"} onValueChange={(val) => setSelectedEpicId(val === "all" ? "" : val)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por épico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os épicos</SelectItem>
                {epics.map(epic => (
                  <SelectItem key={epic.id} value={epic.id}>
                    {epic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <ViewToggle />
              <Button 
                onClick={() => setShowFeatureModal(true)}
                disabled={!selectedEpicId}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Funcionalidade
              </Button>
            </div>
          </div>

          {featuresLoading ? (
            <div>Carregando...</div>
          ) : filteredFeatures.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma feature encontrada
              </CardContent>
            </Card>
          ) : (
            renderList(filteredFeatures, "feature")
          )}
        </TabsContent>

        <TabsContent value="stories" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedFeatureId || "all"} onValueChange={(val) => setSelectedFeatureId(val === "all" ? "" : val)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por feature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as features</SelectItem>
                {features.map(feature => (
                  <SelectItem key={feature.id} value={feature.id}>
                    {feature.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <ViewToggle />
              <Button 
                onClick={() => setShowStoryModal(true)}
                disabled={!selectedFeatureId}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova História
              </Button>
            </div>
          </div>

          {storiesLoading ? (
            <div>Carregando...</div>
          ) : filteredStories.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma história encontrada
              </CardContent>
            </Card>
          ) : (
            renderList(filteredStories, "story")
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedStoryId || "all"} onValueChange={(val) => setSelectedStoryId(val === "all" ? "" : val)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por história" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as histórias</SelectItem>
                {stories.map(story => (
                  <SelectItem key={story.id} value={story.id}>
                    {story.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <ViewToggle />
              <Button 
                onClick={() => setShowTaskModal(true)}
                disabled={!selectedStoryId}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>
          </div>

          {tasksLoading ? (
            <div>Carregando...</div>
          ) : filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma tarefa encontrada
              </CardContent>
            </Card>
          ) : (
            renderList(filteredTasks, "task")
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showEpicModal && (
        <EpicModal
          epic={editingEpic}
          projectId={selectedProjectId}
          viewMode={viewModeModal}
          onClose={() => {
            setShowEpicModal(false);
            setEditingEpic(null);
            setViewModeModal(false);
          }}
          onSave={handleEpicSaved}
        />
      )}

      {showFeatureModal && (
        <FeatureModal
          feature={editingFeature}
          projectId={selectedEpicId ? epics.find(e => e.id === selectedEpicId)?.project_id : selectedProjectId}
          epicId={selectedEpicId}
          onClose={() => {
            setShowFeatureModal(false);
            setEditingFeature(null);
          }}
          onSave={handleFeatureSaved}
        />
      )}

      {showStoryModal && selectedProjectId && (
        <StoryModal
          story={editingStory}
          projectId={selectedProjectId}
          featureId={selectedFeatureId}
          onClose={() => {
            setShowStoryModal(false);
            setEditingStory(null);
          }}
          onSave={handleStorySaved}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          projectId={selectedProjectId}
          storyId={selectedStoryId}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSave={handleTaskSaved}
        />
      )}

      <ConfirmDialog />
    </div>
  );
}
