import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Save, 
  Target, 
  Plus, 
  Eye,
  Edit, 
  Trash2, 
  Play, 
  CheckCircle,
  TrendingUp,
  BarChart3,
  Users,
  FileText
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import { useContextSidebar } from "@/contexts/ContextSidebarContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import StoryViewModal from "@/components/stories/StoryViewModal";
import StoryCreateModal from "@/components/stories/StoryCreateModal";
import AISprintGoalButton from "@/components/sprint/AISprintGoalButton";
import BurndownChart from "@/components/reports/BurndownChart";
import PokerSummaryModal from "@/components/poker/PokerSummaryModal";
import { format, differenceInDays } from "date-fns";
import { useConfirm } from "@/hooks/use-confirm";

interface Story {
  id: string;
  title: string;
  description: string;
  story_points: string | number;
  sprint_id: string | null;
  status: string;
  project_id: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  priority?: string;
  story_type?: {
    name: string;
    color: string;
  };
}

interface Task {
  id: string;
  title: string;
  story_id: string;
  sprint_id: string | null;
  status: string;
}

export default function SprintDetail() {
  const { confirm, ConfirmDialog } = useConfirm();
  const navigate = useNavigate();
  const { id: sprintId } = useParams();
  const [searchParams] = useSearchParams();
  const { currentTenantId } = useTenant();
  const { updateContext, clearContext } = useContextSidebar();

  const initialTab = searchParams.get("tab") || "stories";

  const [sprint, setSprint] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [backlogStories, setBacklogStories] = useState<Story[]>([]);
  const [sprintStories, setSprintStories] = useState<Story[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showStoryCreateModal, setShowStoryCreateModal] = useState(false);
  const [showSprintSummary, setShowSprintSummary] = useState(false);
  const [selectedStories, setSelectedStories] = useState<string[]>([]);
  const [showMoveToSprintDialog, setShowMoveToSprintDialog] = useState(false);
  const [projectSprints, setProjectSprints] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    start_date: "",
    end_date: ""
  });

  useEffect(() => {
    if (sprintId) loadData();
    return () => clearContext();
  }, [sprintId, currentTenantId]);

  useEffect(() => {
    if (sprint && sprintStories.length > 0) {
      updateContextSidebar();
    }
  }, [sprint, sprintStories, tasks]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load sprint
      const { data: sprintData, error: sprintError } = await supabase
        .from("prj_sprint")
        .select("*")
        .eq("id", sprintId)
        .eq("client_id", currentTenantId)
        .maybeSingle();

      if (sprintError) throw sprintError;
      
      if (!sprintData) {
        toast.error("Sprint não encontrado");
        navigate("/sprints");
        return;
      }
      
      setSprint(sprintData);
      setFormData({
        name: sprintData.name || "",
        goal: sprintData.goal || "",
        start_date: sprintData.start_date || "",
        end_date: sprintData.end_date || ""
      });

      setIsReadOnly(sprintData.status === "completed" || sprintData.status === "active");

      // Load project
      const { data: projectData } = await supabase
        .from("prj_project")
        .select("*")
        .eq("id", sprintData.project_id)
        .eq("client_id", currentTenantId)
        .maybeSingle();
      
      setProject(projectData);

      // Load all project sprints for move dialog
      const { data: sprintsData } = await supabase
        .from("prj_sprint")
        .select("*")
        .eq("project_id", sprintData.project_id)
        .eq("client_id", currentTenantId);

      if (sprintsData) {
        // Ordenar: sprints ativas/planejamento primeiro (ordem cronológica), finalizadas por último
        const sortedSprints = sprintsData.sort((a, b) => {
          // Se um está completo e o outro não, o completo vai para o final
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (a.status !== 'completed' && b.status === 'completed') return -1;
          
          // Se ambos têm o mesmo status, ordenar por start_date (ordem cronológica)
          const dateA = new Date(a.start_date || '1900-01-01').getTime();
          const dateB = new Date(b.start_date || '1900-01-01').getTime();
          return dateA - dateB;
        });
        setProjectSprints(sortedSprints);
      }

      // Load stories
      const { data: allStories } = await supabase
        .from("prj_story")
        .select(`
          *,
          story_type:prj_story_type(name, color)
        `)
        .eq("project_id", sprintData.project_id)
        .eq("client_id", currentTenantId);

      const sprintStoriesData = (allStories || []).filter((s: any) => s.sprint_id === sprintId);
      const backlogStoriesData = (allStories || []).filter((s: any) => !s.sprint_id);

      setSprintStories(sprintStoriesData);
      setBacklogStories(backlogStoriesData);

      // Load tasks for sprint stories
      if (sprintStoriesData.length > 0) {
        const { data: tasksData } = await supabase
          .from("prj_task")
          .select("*")
          .in("story_id", sprintStoriesData.map((s: Story) => s.id))
          .eq("client_id", currentTenantId);

        setTasks(tasksData || []);
      } else {
        setTasks([]);
      }

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar sprint");
    } finally {
      setIsLoading(false);
    }
  };

  const updateContextSidebar = () => {
    if (!sprint) return;

    const totalPoints = sprintStories.reduce((sum, story) => sum + (Number(story.story_points) || 0), 0);
    const completedPoints = sprintStories
      .filter(story => story.status === "done")
      .reduce((sum, story) => sum + (Number(story.story_points) || 0), 0);
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === "done").length;
    
    const daysRemaining = sprint.end_date 
      ? differenceInDays(new Date(sprint.end_date), new Date())
      : 0;

    const velocity = sprint.status === "completed" ? completedPoints : 0;

    updateContext({
      title: sprint.name,
      stats: [
        { label: "Story Points", value: `${completedPoints}/${totalPoints}` },
        { label: "Tarefas", value: `${completedTasks}/${totalTasks}` },
        { label: "Histórias", value: sprintStories.length.toString() },
        { label: "Dias Restantes", value: daysRemaining > 0 ? daysRemaining.toString() : "0" },
        { label: "Velocity", value: `${velocity} pts` },
        { label: "Status", value: getStatusLabel(sprint.status) }
      ]
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planning": return "Planejamento";
      case "active": return "Em Andamento";
      case "completed": return "Concluído";
      default: return status;
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      const { error } = await supabase
        .from("prj_sprint")
        .update(formData)
        .eq("id", sprintId);

      if (error) throw error;

      toast.success("Sprint atualizado");
      loadData();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao salvar");
    }
  };

  const handleStartSprint = async () => {
    const confirmed = await confirm({
      title: "Iniciar Sprint",
      description: "Deseja realmente iniciar este sprint?",
    });
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("prj_sprint")
        .update({ status: "active" })
        .eq("id", sprintId);

      if (error) throw error;

      toast.success("Sprint iniciado");
      loadData();
    } catch (error) {
      console.error("Error starting sprint:", error);
      toast.error("Erro ao iniciar sprint");
    }
  };

  const handleCompleteSprint = async () => {
    const confirmed = await confirm({
      title: "Concluir Sprint",
      description: "Deseja realmente concluir este sprint?",
    });
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("prj_sprint")
        .update({ status: "completed" })
        .eq("id", sprintId);

      if (error) throw error;

      toast.success("Sprint concluído");
      loadData();
    } catch (error) {
      console.error("Error completing sprint:", error);
      toast.error("Erro ao concluir sprint");
    }
  };

  const handleDeleteSprint = async () => {
    const confirmed = await confirm({
      title: "Excluir Sprint",
      description: "Deseja realmente excluir este sprint? Esta ação não pode ser desfeita.",
    });
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("prj_sprint")
        .delete()
        .eq("id", sprintId);

      if (error) throw error;

      toast.success("Sprint excluído com sucesso");
      navigate("/sprints");
    } catch (error) {
      console.error("Error deleting sprint:", error);
      toast.error("Erro ao excluir sprint");
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (isReadOnly) {
      toast.error("Não é possível mover histórias em sprint ativo/concluído");
      return;
    }

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    try {
      const newSprintId = destination.droppableId === "sprint" ? sprintId : null;

      // Update state optimistically
      const storyToMove = source.droppableId === "sprint" 
        ? sprintStories.find(s => s.id === draggableId)
        : backlogStories.find(s => s.id === draggableId);

      if (!storyToMove) return;

      if (destination.droppableId === "sprint") {
        setBacklogStories(prev => prev.filter(s => s.id !== draggableId));
        setSprintStories(prev => [...prev, { ...storyToMove, sprint_id: sprintId }]);
      } else {
        setSprintStories(prev => prev.filter(s => s.id !== draggableId));
        setBacklogStories(prev => [...prev, { ...storyToMove, sprint_id: null }]);
      }

      const { error } = await supabase
        .from("prj_story")
        .update({ sprint_id: newSprintId })
        .eq("id", draggableId);

      if (error) throw error;

      // Update tasks for the story
      const storyTasks = tasks.filter(t => t.story_id === draggableId);
      if (storyTasks.length > 0) {
        await Promise.all(
          storyTasks.map(task =>
            supabase
              .from("prj_task")
              .update({ sprint_id: newSprintId })
              .eq("id", task.id)
          )
        );
      }

      toast.success("História movida com sucesso");
    } catch (error) {
      console.error("Error moving story:", error);
      toast.error("Erro ao mover história");
      // Revert optimistic update on error
      loadData();
    }
  };

  const handleEditStory = (story: Story) => {
    setSelectedStory(story);
    setShowStoryModal(true);
  };

  const handleDeleteStory = async (storyId: string) => {
    const confirmed = await confirm({
      title: "Remover História",
      description: "Deseja realmente remover esta história do sprint?",
    });
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("prj_story")
        .update({ sprint_id: null })
        .eq("id", storyId);

      if (error) throw error;

      toast.success("História removida do sprint");
      loadData();
    } catch (error) {
      console.error("Error removing story:", error);
      toast.error("Erro ao remover história");
    }
  };

  const getBurndownData = () => {
    if (!sprint || !sprint.start_date || !sprint.end_date) return [];

    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const totalDays = differenceInDays(endDate, startDate);
    const totalPoints = sprintStories.reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);

    const data = [];
    for (let i = 0; i <= totalDays; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(currentDay.getDate() + i);
      
      const ideal = totalPoints - (totalPoints / totalDays) * i;
      
      // Simulated actual burn (in production, track daily completion)
      const completedPoints = sprintStories
        .filter(s => s.status === "done")
        .reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);
      const actual = totalPoints - (completedPoints / totalDays) * i;

      data.push({
        day: format(currentDay, "dd/MM"),
        ideal: Math.max(0, ideal),
        actual: Math.max(0, actual)
      });
    }

    return data;
  };

  const renderStoryCard = (story: Story, index: number, provided: any, snapshot: any, isBacklog: boolean = false) => {
    const storyTasks = tasks.filter(t => t.story_id === story.id);
    const completedTasks = storyTasks.filter(t => t.status === "done").length;
    const isSelected = selectedStories.includes(story.id);
    
    const priorityColors: Record<string, string> = {
      low: "hsl(var(--info))",
      medium: "hsl(var(--warning))",
      high: "hsl(var(--destructive))",
      critical: "hsl(var(--destructive))"
    };

    return (
      <Card
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`mb-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
          snapshot.isDragging ? "shadow-lg rotate-2" : ""
        } ${isSelected ? "ring-2 ring-primary" : ""}`}
        style={{
          borderLeftColor: story.story_type?.color 
            ? story.story_type.color
            : story.priority 
            ? priorityColors[story.priority] || "hsl(var(--border))"
            : "hsl(var(--border))",
          ...provided.draggableProps.style
        }}
        onClick={(e) => {
          if (!snapshot.isDragging && !isBacklog) {
            navigate(`/storyview?id=${story.id}`);
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {isBacklog && !isReadOnly && (
              <div className="flex-shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStories([...selectedStories, story.id]);
                    } else {
                      setSelectedStories(selectedStories.filter(id => id !== story.id));
                    }
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground">{story.title}</h4>
                {story.story_points && (
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    {story.story_points} pts
                  </Badge>
                )}
              </div>
              {story.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {story.description}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {story.story_type && (
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ borderColor: story.story_type.color }}
                  >
                    {story.story_type.name}
                  </Badge>
                )}
                {story.priority && (
                  <Badge variant="outline" className="text-xs">
                    {story.priority === "low" && "Baixa"}
                    {story.priority === "medium" && "Média"}
                    {story.priority === "high" && "Alta"}
                    {story.priority === "critical" && "Crítica"}
                  </Badge>
                )}
                {storyTasks.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {completedTasks}/{storyTasks.length}
                  </Badge>
                )}
                <Badge 
                  variant={story.status === "done" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {story.status}
                </Badge>
                {story.assigned_to_name && (
                  <Badge variant="outline" className="text-xs">
                    {story.assigned_to_name}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/storyview?id=${story.id}`);
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
              {!isReadOnly && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditStory(story);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStory(story.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleMoveStoriesToSprint = async (targetSprintId: string) => {
    try {
      const { error } = await supabase
        .from("prj_story")
        .update({ sprint_id: targetSprintId })
        .in("id", selectedStories)
        .eq("client_id", currentTenantId);

      if (error) throw error;

      await loadData();
      setSelectedStories([]);
      setShowMoveToSprintDialog(false);
      
      toast.success(`${selectedStories.length} história(s) movida(s) com sucesso`);
    } catch (error) {
      console.error("Error moving stories:", error);
      toast.error("Erro ao mover histórias");
    }
  };

  if (isLoading || !sprint) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Target className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando sprint...</p>
        </div>
      </div>
    );
  }

  const totalPoints = sprintStories.reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);
  const completedPoints = sprintStories
    .filter(s => s.status === "done")
    .reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);
  const progressPercentage = totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/sprints")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Target className="w-8 h-8" />
                {sprint.name}
              </h1>
              <Badge
                variant={
                  sprint.status === "active"
                    ? "default"
                    : sprint.status === "completed"
                    ? "secondary"
                    : "outline"
                }
              >
                {getStatusLabel(sprint.status)}
              </Badge>
            </div>
            {project && <p className="text-muted-foreground mt-1">{project.name}</p>}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {sprint.status === "completed" && (
            <Button 
              onClick={() => navigate(`/sprint/${sprintId}?tab=report`)} 
              variant="outline" 
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Ver Relatório Final
            </Button>
          )}
          
          {sprint.status !== "completed" && (
            <>
              {sprintStories.length > 0 && (
                <>
                  <Button 
                    onClick={() => setShowSprintSummary(true)} 
                    variant="outline" 
                    className="gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Ver Resumo
                  </Button>
                  {(sprint.status === "planning" || sprint.status === "planned") && (
                    <Button 
                      onClick={() => navigate(`/planning-poker?sprint=${sprintId}`)} 
                      variant="outline" 
                      className="gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Planning Poker
                    </Button>
                  )}
                </>
              )}
              <Button 
                onClick={() => navigate(`/backlog?project=${sprint.project_id}`)} 
                variant="outline" 
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Ver Backlog
              </Button>
            </>
          )}
          {sprint.status === "active" && (
            <Button 
              onClick={() => navigate(`/kanban-board?sprint=${sprintId}`)} 
              variant="outline" 
              className="gap-2"
            >
              <Target className="w-4 h-4" />
              Quadro Kanban
            </Button>
          )}
          {sprint.status === "planning" && (
            <>
              <Button onClick={handleStartSprint} className="gap-2">
                <Play className="w-4 h-4" />
                Iniciar Sprint
              </Button>
              <Button 
                onClick={handleDeleteSprint} 
                variant="destructive" 
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </Button>
            </>
          )}
          {sprint.status === "active" && (
            <Button onClick={handleCompleteSprint} variant="default" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Concluir Sprint
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Story Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPoints}/{totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              {progressPercentage.toFixed(0)}% completo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Histórias</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sprintStories.length}</div>
            <p className="text-xs text-muted-foreground">
              {sprintStories.filter(s => s.status === "done").length} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter(t => t.status === "done").length} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sprint.start_date && sprint.end_date
                ? differenceInDays(new Date(sprint.end_date), new Date(sprint.start_date))
                : 0}{" "}
              dias
            </div>
            <p className="text-xs text-muted-foreground">
              {sprint.end_date
                ? `Até ${format(new Date(sprint.end_date), "dd/MM/yyyy")}`
                : "Sem data final"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList>
          <TabsTrigger value="stories">Histórias</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="burndown">Burndown</TabsTrigger>
          <TabsTrigger value="report">Relatório</TabsTrigger>
        </TabsList>

        <TabsContent value="stories" className="space-y-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Backlog Stories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Backlog ({backlogStories.length})</span>
                    <div className="flex gap-2">
                      {backlogStories.length > 0 && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStories(backlogStories.map(s => s.id))}
                          disabled={isReadOnly || selectedStories.length === backlogStories.length}
                        >
                          Selecionar Todas
                        </Button>
                      )}
                      <Button 
                        size="sm"
                        onClick={() => setShowStoryCreateModal(true)}
                        disabled={isReadOnly}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova História
                      </Button>
                    </div>
                  </CardTitle>
                  {selectedStories.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 p-3 bg-accent rounded-lg">
                      <span className="text-sm font-medium">
                        {selectedStories.length} {selectedStories.length === 1 ? 'história selecionada' : 'histórias selecionadas'}
                      </span>
                      <div className="flex gap-2 ml-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStories([])}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setShowMoveToSprintDialog(true)}
                        >
                          Mover para Sprint
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <Droppable droppableId="backlog" isDropDisabled={isReadOnly}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] p-2 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? "bg-accent" : ""
                        }`}
                      >
                        {backlogStories.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            Nenhuma história no backlog
                          </p>
                        ) : (
                          backlogStories.map((story, index) => (
                            <Draggable
                              key={story.id}
                              draggableId={story.id}
                              index={index}
                              isDragDisabled={isReadOnly || selectedStories.length > 0}
                            >
                              {(provided, snapshot) =>
                                renderStoryCard(story, index, provided, snapshot, true)
                              }
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>

              {/* Sprint Stories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Sprint ({sprintStories.length})</span>
                    <div className="flex gap-2">
                      {sprintStories.length > 0 && (sprint.status === "planning" || sprint.status === "planned") && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/planning-poker?sprint=${sprintId}`)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Planning Poker
                        </Button>
                      )}
                      {sprint.status === "active" && sprintStories.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/kanban?project=${sprint.project_id}&sprint=${sprintId}`)}
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Ir para Kanban
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId="sprint" isDropDisabled={isReadOnly}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] p-2 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? "bg-accent" : ""
                        }`}
                      >
                        {sprintStories.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            Arraste histórias do backlog para o sprint
                          </p>
                        ) : (
                          sprintStories.map((story, index) => (
                            <Draggable
                              key={story.id}
                              draggableId={story.id}
                              index={index}
                              isDragDisabled={isReadOnly}
                            >
                              {(provided, snapshot) =>
                                renderStoryCard(story, index, provided, snapshot)
                              }
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>
          </DragDropContext>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Detalhes do Sprint
                {!isReadOnly && (
                  <Button onClick={handleSave} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Nome do Sprint *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isReadOnly}
                  className="bg-background"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  Meta do Sprint
                  {sprint.status === "planning" && (
                    <AISprintGoalButton
                      sprintName={formData.name}
                      projectId={sprint.project_id}
                      onGoalGenerated={(goal) => setFormData({ ...formData, goal })}
                    />
                  )}
                </label>
                <Textarea
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  disabled={isReadOnly}
                  rows={4}
                  className="bg-background"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Data de Início
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    disabled={isReadOnly}
                    className="bg-background"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Data de Fim
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    disabled={isReadOnly}
                    className="bg-background"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="burndown">
          <BurndownChart data={getBurndownData()} title="Burndown Chart" />
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>Relatório do Sprint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Story Points Planejados</p>
                  <p className="text-2xl font-bold">{sprint?.total_story_points || 0}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Story Points Concluídos</p>
                  <p className="text-2xl font-bold text-green-600">{sprint?.completed_story_points || 0}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold">
                    {sprint?.total_story_points 
                      ? Math.round(((sprint.completed_story_points || 0) / sprint.total_story_points) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>
              <BurndownChart data={getBurndownData()} title="Burndown do Sprint" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showStoryModal && selectedStory && (
        <StoryViewModal
          story={selectedStory}
          projectId={sprint.project_id}
          onClose={() => {
            setShowStoryModal(false);
            setSelectedStory(null);
            loadData();
          }}
        />
      )}

      {showStoryCreateModal && (
        <StoryCreateModal
          projectId={sprint.project_id}
          onClose={() => setShowStoryCreateModal(false)}
          onSave={() => {
            setShowStoryCreateModal(false);
            loadData();
          }}
        />
      )}

      {showSprintSummary && sprint && project && (
        <PokerSummaryModal
          stories={sprintStories}
          projectName={project.name}
          sprintName={sprint.name}
          onClose={() => setShowSprintSummary(false)}
        />
      )}

      <Dialog open={showMoveToSprintDialog} onOpenChange={setShowMoveToSprintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover {selectedStories.length} história(s) para Sprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {projectSprints
              .filter(s => s.id !== sprintId && s.status === "planning")
              .map(sprint => (
                <Button
                  key={sprint.id}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => handleMoveStoriesToSprint(sprint.id)}
                >
                  <span>{sprint.name}</span>
                  <Badge variant="outline">
                    Planejamento
                  </Badge>
                </Button>
              ))}
            {projectSprints.filter(s => s.id !== sprintId && s.status === "planning").length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma sprint em planejamento disponível
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
