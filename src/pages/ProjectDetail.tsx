import React, { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Target, ChevronRight, Calendar, Users, CheckCircle, TrendingUp, DollarSign, User, Plus, Folder, Trash2, GanttChartSquare } from "lucide-react";
import EpicHierarchyView from "@/components/timeline/EpicHierarchyView";
import MilestoneTimelineView from "@/components/timeline/MilestoneTimelineView";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getCurrentTenantId } from "@/lib/tenant-helper";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { hasPermission, PERMISSIONS } from "@/lib/permissions-helper";
import { useContextSidebar } from "@/contexts/ContextSidebarContext";
import { isNumericComplexity } from "@/lib/complexity-helper";
import ProjectHierarchyModal from "@/components/gantt/ProjectHierarchyModal";
import SprintDetailModal from "@/components/sprint/SprintDetailModal";
import ResourceAllocationPanel from "@/components/resources/ResourceAllocationPanel";
import RiskManagementSection from "@/components/risk/RiskManagementSection";
import IssueManagementSection from "@/components/issue/IssueManagementSection";
import { getColumnInfo, preloadProjectBoards } from "@/lib/board-helper";
import CircularProgress from "@/components/CircularProgress";
import { format } from "date-fns";

interface Project {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status: string;
  methodology: string;
  priority: string;
  health_status?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  progress?: number;
  board_id?: string;
  team_ids?: string[];
  parent_project_id?: string;
  tenant_id: string;
  color?: string;
  manager_email?: string;
  manager_name?: string;
}

interface Sprint {
  id: string;
  name: string;
  goal?: string;
  status: string;
  start_date: string;
  end_date: string;
  total_story_points?: number;
  completed_story_points?: number;
}

interface Task {
  id: string;
  title: string;
  status: string;
  assigned_to_email?: string;
  progress?: number;
  is_milestone?: boolean;
  milestone_order?: number;
  due_date?: string;
  start_date?: string;
  project_id: string;
  tenant_id: string;
}

export default function ProjectDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");
  const { updateContext, clearContext } = useContextSidebar();

  const cleanProjectId = projectId?.toString().trim().replace(/^[-\s]+/, '').replace(/\s+/g, '');

  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [epics, setEpics] = useState<any[]>([]);
  const [milestoneTasks, setMilestoneTasks] = useState<Task[]>([]);
  const [projectBoard, setProjectBoard] = useState<any>(null);
  const [pokerSessions, setPokerSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [canViewSprints, setCanViewSprints] = useState(false);
  const [showHierarchyModal, setShowHierarchyModal] = useState(false);
  const [childProjects, setChildProjects] = useState<Project[]>([]);
  const [showSprintDetail, setShowSprintDetail] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (cleanProjectId) {
      loadData();
    } else {
      setIsLoading(false);
    }
    
    return () => {
      clearContext();
    };
  }, [cleanProjectId, clearContext]);

  const loadData = async () => {
    if (!cleanProjectId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const canManageProjects = await hasPermission(PERMISSIONS.MANAGE_PROJECTS);
      const canView = await hasPermission(PERMISSIONS.VIEW_SPRINTS);
      
      setCanManage(canManageProjects);
      setCanViewSprints(canView || canManageProjects);

      const tenantId = await getCurrentTenantId();
      
      const [allProjects, allSprints, allTasks, allStories, allUsers, allBoards, allEpics, allFeatures] = await Promise.all([
        base44.entities.Project.list("-created_at"),
        base44.entities.Sprint.filter({ project_id: cleanProjectId }),
        base44.entities.Task.filter({ project_id: cleanProjectId }),
        base44.entities.Story.filter({ project_id: cleanProjectId }),
        base44.entities.User.list(),
        base44.entities.Board.list(),
        base44.entities.Epic.filter({ project_id: cleanProjectId }),
        base44.entities.Feature.list()
      ]);

      const projectById = allProjects.find((p: any) => p.id === cleanProjectId);
      
      if (!projectById) {
        toast.error("Projeto não encontrado");
        navigate(createPageUrl("ProjectList"));
        return;
      }

      setProject(projectById);
      setSprints(allSprints || []);
      setTasks(allTasks || []);
      setStories(allStories || []);
      setUsers(allUsers || []);
      setEpics(allEpics || []);
      
      // Filter features that belong to epics of this project
      const projectEpicIds = (allEpics || []).map((e: any) => e.id);
      const projectFeatures = (allFeatures || []).filter((f: any) => projectEpicIds.includes(f.epic_id));
      setFeatures(projectFeatures);
      
      const projectMilestoneTasks = (allTasks || []).filter((t: any) => 
        t.project_id === cleanProjectId && 
        t.client_id === tenantId && 
        t.is_milestone === true
      );
      console.log('🎯 Milestone Tasks Found:', projectMilestoneTasks.length, projectMilestoneTasks);
      setMilestoneTasks(projectMilestoneTasks);
      
      if (projectById.board_id) {
        const board = allBoards.find((b: any) => b.id === projectById.board_id);
        setProjectBoard(board);
      }

      if (projectById.id) {
        await preloadProjectBoards([projectById.id]);
      }

      if (projectById.team_ids && projectById.team_ids.length > 0) {
        try {
          const allTeams = await base44.entities.Team.list();
          const filteredTeams = allTeams.filter((team: any) => projectById.team_ids.includes(team.id));
          
          // Os times já vêm com o campo 'members' populado do banco
          // Vamos enriquecer com informações de avatar dos usuários
          const teamsWithAvatars = filteredTeams.map((team: any) => {
            if (team.members && team.members.length > 0) {
              const membersWithAvatars = team.members.map((member: any) => {
                // Buscar usuário correspondente para pegar avatar
                const user = allUsers.find((u: any) => 
                  u.email === member.email || u.user_id === member.email
                );
                return {
                  ...member,
                  avatar_url: user?.avatar_url || null,
                  user_id: user?.user_id || member.email
                };
              });
              return { ...team, members: membersWithAvatars };
            }
            return team;
          });
          
          setTeams(teamsWithAvatars);
        } catch (error) {
          console.error("Error loading teams:", error);
          setTeams([]);
        }
      }
    } catch (error) {
      console.error("Error loading project:", error);
      navigate(createPageUrl("ProjectList"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (project && project.id) {
      loadPokerSessions();
    }
  }, [project?.id]);

  const loadPokerSessions = async () => {
    if (!project || !project.id) return;
    
    try {
      const allSessions = await base44.entities.PlanningPokerSession.list();
      const activeSessions = allSessions.filter((s: any) => 
        s.project_id === project.id &&
        (s.status === 'waiting' || s.status === 'voting' || s.status === 'revealed')
      );
      setPokerSessions(activeSessions);
    } catch (error) {
      console.error("Error loading poker sessions:", error);
    }
  };

  const getSprintPokerSession = (sprintId: string) => {
    return pokerSessions.find((session: any) => session.sprint_id === sprintId);
  };

  const handleJoinPokerSession = (sessionId: string) => {
    navigate(createPageUrl("PlanningPokerRoom?id=" + sessionId));
  };

  const handleDeleteProject = async () => {
    try {
      await base44.entities.Project.delete(cleanProjectId!);
      toast.success("Projeto excluído com sucesso");
      navigate(createPageUrl("ProjectList"));
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Erro ao excluir projeto");
    }
  };

  const getUserAvatar = (email: string) => {
    const user = users.find((u: any) => u.email === email);
    return {
      avatar_url: user?.avatar_url || null,
      avatar_color: user?.avatar_color || '#3b82f6',
      initial: (user?.full_name || email || '?').charAt(0).toUpperCase()
    };
  };

  const isTaskCompleted = (task: Task) => {
    if (task.status === 'done') return true;
    
    if (projectBoard && projectBoard.columns) {
      const taskColumn = projectBoard.columns.find((col: any) => col.id === task.status);
      if (taskColumn && taskColumn.is_final) return true;
    }
    
    return false;
  };

  const calculateDuration = () => {
    if (!project || !project.start_date || !project.end_date) return null;
    
    const start = new Date(project.start_date + 'T12:00:00');
    const end = new Date(project.end_date + 'T12:00:00');
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} dias`;
    } else if (diffDays < 365) {
      return `${Math.round(diffDays / 30)} meses`;
    } else {
      return `${(diffDays / 365).toFixed(1)} anos`;
    }
  };

  const calculateProjectProgress = () => {
    if (!tasks || tasks.length === 0) return project?.progress || 0;
    
    const completedTasks = tasks.filter(t => isTaskCompleted(t)).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const calculateEpicProgress = (epicId: string) => {
    const epicStories = stories.filter((s: any) => s.epic_id === epicId);
    const completedStories = epicStories.filter((s: any) => s.status === 'done').length;
    
    return {
      total: epicStories.length,
      completed: completedStories,
      percentage: epicStories.length === 0 ? 0 : Math.round((completedStories / epicStories.length) * 100)
    };
  };

  const calculateFeatureProgress = (featureId: string) => {
    const featureStories = stories.filter((s: any) => s.feature_id === featureId);
    const completedStories = featureStories.filter((s: any) => s.status === 'done').length;
    
    return {
      total: featureStories.length,
      completed: completedStories,
      percentage: featureStories.length === 0 ? 0 : Math.round((completedStories / featureStories.length) * 100)
    };
  };

  const getEpicsStats = () => {
    const total = epics.length;
    const completed = epics.filter((e: any) => e.status === 'done').length;
    const inProgress = epics.filter((e: any) => e.status === 'in_progress').length;
    return { total, completed, inProgress };
  };

  const getFeaturesStats = () => {
    const total = features.length;
    const completed = features.filter((f: any) => f.status === 'done').length;
    const inProgress = features.filter((f: any) => f.status === 'in_progress').length;
    return { total, completed, inProgress };
  };

  useEffect(() => {
    const loadChildProjects = async () => {
      if (!project || !project.id) return;
      
      try {
        const tenantId = await getCurrentTenantId();
        const allChildProjects = await base44.entities.Project.filter({ 
          parent_project_id: project.id,
          client_id: tenantId 
        });
        setChildProjects(allChildProjects || []);
      } catch (error) {
        console.error("Error loading child projects:", error);
        setChildProjects([]);
      }
    };
    
    loadChildProjects();
  }, [project?.id, project?.tenant_id]);

  const handleTabChange = async (newTab: string) => {
    setActiveTab(newTab);
    
    if (newTab === 'timeline' && project?.methodology === 'scrum' && cleanProjectId) {
      try {
        const tenantId = await getCurrentTenantId();
        const freshEpics = await base44.entities.Epic.filter({ project_id: cleanProjectId });
        const freshFeatures = await base44.entities.Feature.filter({ project_id: cleanProjectId });
        const freshStories = await base44.entities.Story.filter({ project_id: cleanProjectId });
        setEpics(freshEpics || []);
        setFeatures(freshFeatures || []);
        setStories(freshStories || []);
      } catch (error) {
        console.error('Error reloading epics hierarchy:', error);
      }
    }
    
    if (newTab === 'timeline' && project?.methodology === 'waterfall' && cleanProjectId) {
      try {
        const tenantId = await getCurrentTenantId();
        const allTasks = await base44.entities.Task.filter({ project_id: cleanProjectId });
        const projectMilestoneTasks = (allTasks || []).filter((t: any) => 
          t.project_id === cleanProjectId && 
          t.client_id === tenantId && 
          t.is_milestone === true
        );
        console.log('🎯 Timeline Tab - Milestone Tasks Reloaded:', projectMilestoneTasks.length, projectMilestoneTasks);
        setMilestoneTasks(projectMilestoneTasks);
      } catch (error) {
        console.error('Error reloading milestones:', error);
      }
    }
  };

  const realProjectProgress = calculateProjectProgress();
  const hasChildProjects = childProjects.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando projeto...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-background">
        <Card className="border-border max-w-md mx-auto">
          <CardContent className="p-12 text-center">
            <p className="text-foreground mb-4">Projeto não encontrado</p>
            <Button onClick={() => navigate(createPageUrl("ProjectList"))}>
              Voltar para Projetos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    planning: "bg-gray-500/20 text-gray-600",
    in_progress: "bg-blue-500/20 text-blue-600",
    completed: "bg-green-500/20 text-green-600"
  };

  const statusLabels: Record<string, string> = {
    planning: "Planejamento",
    in_progress: "Ativo",
    completed: "Concluído"
  };

  const methodologyLabels: Record<string, string> = {
    waterfall: "Waterfall",
    scrum: "Scrum",
    kanban: "Kanban",
    hybrid: "Híbrido"
  };

  const isWaterfall = project?.methodology === 'waterfall';
  const isScrum = project?.methodology === 'scrum';
  const isKanban = project?.methodology === 'kanban';

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => isTaskCompleted(t)).length,
    in_progress: tasks.filter(t => !isTaskCompleted(t) && t.status !== 'blocked').length,
    blocked: tasks.filter(t => t.status === 'blocked').length
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("ProjectList"))}
              className="border-border hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {project.color && (
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                )}
                <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
                <Badge className={statusColors[project.status] || statusColors.planning}>
                  {statusLabels[project.status] || project.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
            {canManage && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl(`ProjectGanttV2?id=${cleanProjectId}`))}
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  <GanttChartSquare className="w-4 h-4 mr-2" />
                  Abrir Gantt
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl(`ProjectEdit?id=${cleanProjectId}`))}
                  className="border-border hover:bg-accent"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
                {hasChildProjects && (
                  <Button
                    variant="outline"
                    onClick={() => setShowHierarchyModal(true)}
                    className="border-primary/50 text-primary hover:bg-primary/10"
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    Ver Hierarquia
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Progresso</p>
                    <p className="text-xl font-bold text-foreground">{realProjectProgress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tarefas</p>
                    <p className="text-xl font-bold text-foreground">{taskStats.completed}/{taskStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="text-xl font-bold text-foreground">{teams.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duração</p>
                    <p className="text-xl font-bold text-foreground">{calculateDuration() || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Orçamento</p>
                    <p className="text-xl font-bold text-foreground">
                      {project.budget ? `R$ ${project.budget.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className={`grid w-full ${
            childProjects.length > 0 ? 
              (isKanban ? 'grid-cols-6' : 
               isWaterfall ? 'grid-cols-7' : 
               'grid-cols-8') :
            (isKanban ? 'grid-cols-5' : 
             isWaterfall ? 'grid-cols-6' : 
             'grid-cols-7')
          } mb-6`}>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            {!isWaterfall && !isKanban && canViewSprints && <TabsTrigger value="sprints">Sprints</TabsTrigger>}
            <TabsTrigger value="team">Equipe</TabsTrigger>
            {!isKanban && <TabsTrigger value="timeline">Cronograma</TabsTrigger>}
            <TabsTrigger value="resources">Recursos</TabsTrigger>
            <TabsTrigger value="risks">Riscos & Issues</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            {childProjects.length > 0 && <TabsTrigger value="subprojects">Sub-projetos</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Metodologia</p>
                    <p className="text-lg font-bold text-foreground">
                      {methodologyLabels[project.methodology] || 'Não Definido'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prioridade</p>
                    <p className="text-lg font-bold text-foreground capitalize">{project.priority}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status de Saúde</p>
                    <p className="text-lg font-bold text-foreground capitalize">
                      {project.health_status === 'healthy' ? 'Saudável' :
                       project.health_status === 'at_risk' ? 'Em Risco' : 'Crítico'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`grid ${isScrum ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Progresso das Tarefas</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <Badge variant="outline">{taskStats.total}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Concluídas</span>
                      <Badge className="bg-green-500/20 text-green-600">{taskStats.completed}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Em Progresso</span>
                      <Badge className="bg-blue-500/20 text-blue-600">{taskStats.in_progress}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Bloqueadas</span>
                      <Badge className="bg-red-500/20 text-red-600">{taskStats.blocked}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!isScrum && (
                <Card className="border-border bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Andamento do Projeto</h3>
                    <div className="flex items-center justify-center py-4">
                      <div className="relative">
                         <svg width="160" height="160" className="transform -rotate-90 drop-shadow-lg">
                          <defs>
                            <linearGradient id="project-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                            </linearGradient>
                          </defs>
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            fill="transparent"
                            stroke="hsl(var(--muted))"
                            strokeWidth="12"
                            opacity="0.3"
                          />
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            fill="transparent"
                            stroke="url(#project-progress-gradient)"
                            strokeWidth="12"
                            strokeDasharray={2 * Math.PI * 70}
                            strokeDashoffset={2 * Math.PI * 70 - (realProjectProgress / 100) * 2 * Math.PI * 70}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                            {realProjectProgress}%
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">Concluído</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Baseado em tarefas concluídas</span>
                        <span className="font-semibold">{taskStats.completed}/{taskStats.total}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isScrum && (
                <>
                  <Card className="border-border">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Épicos</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <Badge variant="outline">{getEpicsStats().total}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Concluídos</span>
                          <Badge className="bg-green-500/20 text-green-600">{getEpicsStats().completed}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Em Progresso</span>
                          <Badge className="bg-blue-500/20 text-blue-600">{getEpicsStats().inProgress}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Backlog</span>
                          <Badge className="bg-muted text-muted-foreground">
                            {getEpicsStats().total - getEpicsStats().completed - getEpicsStats().inProgress}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Funcionalidades</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <Badge variant="outline">{getFeaturesStats().total}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Concluídas</span>
                          <Badge className="bg-green-500/20 text-green-600">{getFeaturesStats().completed}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Em Progresso</span>
                          <Badge className="bg-blue-500/20 text-blue-600">{getFeaturesStats().inProgress}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Backlog</span>
                          <Badge className="bg-muted text-muted-foreground">
                            {getFeaturesStats().total - getFeaturesStats().completed - getFeaturesStats().inProgress}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <div className="grid md:grid-cols-1 gap-6 mt-6">
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Times do Projeto</h3>
                  {teams.length > 0 ? (
                    <div className="space-y-4">
                      {teams.map((team: any) => (
                        <div key={team.id} className="p-4 rounded-lg bg-accent/50 border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Users className="w-5 h-5 text-primary" />
                              <div>
                                <p className="font-medium text-foreground">{team.name}</p>
                                {team.description && (
                                  <p className="text-xs text-muted-foreground">{team.description}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline">{team.members?.length || 0} membros</Badge>
                          </div>
                          {team.members && team.members.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
                              {team.members.map((member: any) => (
                                <div key={member.user_id || member.id} className="flex items-center gap-2">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={member.avatar_url} alt={member.name} />
                                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                      {member.name?.substring(0, 2).toUpperCase() || member.email?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-foreground">{member.name || member.email}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Nenhum time associado</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sprints">
            {sprints.length > 0 ? (
              <div className="grid gap-6">
                {sprints.map((sprint) => {
                  const sprintTasks = tasks.filter((t: any) => t.sprint_id === sprint.id);
                  const sprintTasksCompleted = sprintTasks.filter(t => isTaskCompleted(t)).length;
                  const progressPercent = sprintTasks.length > 0 ? Math.round((sprintTasksCompleted / sprintTasks.length) * 100) : 0;
                  const pokerSession = getSprintPokerSession(sprint.id);

                  return (
                    <Card key={sprint.id} className="border-border hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-foreground">{sprint.name}</h3>
                            {sprint.goal && (
                              <p className="text-sm text-muted-foreground mt-1">{sprint.goal}</p>
                            )}
                          </div>
                          <Badge className={
                            sprint.status === 'active' ? 'bg-blue-500/20 text-blue-600' :
                            sprint.status === 'completed' ? 'bg-green-500/20 text-green-600' :
                            'bg-gray-500/20 text-gray-600'
                          }>
                            {sprint.status === 'active' ? '● Ativa' :
                             sprint.status === 'completed' ? '✓ Concluída' : '○ Planejamento'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <p className="text-xs text-muted-foreground mb-1">Tarefas</p>
                            <p className="text-2xl font-bold text-blue-600">{sprintTasks.length}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {sprintTasks.length > 0 ? Math.round((sprintTasksCompleted / sprintTasks.length) * 100) : 0}% concluídas
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <p className="text-xs text-muted-foreground mb-1">Story Points</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {sprint.completed_story_points || 0}/{sprint.total_story_points || 0}
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                            <p className="text-xs text-muted-foreground mb-1">Duração</p>
                            <p className="text-2xl font-bold text-cyan-600">
                              {Math.ceil((new Date(sprint.end_date).getTime() - new Date(sprint.start_date).getTime()) / (1000 * 60 * 60 * 24))}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">dias</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Progresso Geral</span>
                            <span className="text-xs font-bold text-foreground">{progressPercent}%</span>
                          </div>
                          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500" 
                              style={{ width: progressPercent + "%" }} 
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 flex-wrap">
                          <span className="flex items-center gap-1.5 bg-accent/50 px-3 py-1.5 rounded-full">
                            <Calendar className="w-3 h-3" />
                            {new Date(sprint.start_date).toLocaleDateString('pt-BR')} - {new Date(sprint.end_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        {pokerSession && (
                          <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Target className="w-5 h-5 text-purple-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {pokerSession.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Planning Poker ativo - Clique para participar
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleJoinPokerSession(pokerSession.id)}
                                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white flex-shrink-0"
                              >
                                <Users className="w-4 h-4 mr-2" />
                                Entrar
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedSprintId(sprint.id);
                              setShowSprintDetail(true);
                            }}
                            className="flex-1"
                          >
                            Ver Detalhes
                          </Button>
                          <Button
                            onClick={() => navigate(createPageUrl(`KanbanBoard?project=${cleanProjectId}&sprint=${sprint.id}`))}
                            className="flex-1 bg-primary"
                          >
                            Abrir Kanban
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-border">
                <CardContent className="p-12 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">Nenhuma sprint cadastrada</p>
                  {canManage && (
                    <Button onClick={() => navigate(createPageUrl("SprintManagement"))}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Sprint
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tasks">
            {canManage && (
              <div className="flex gap-3 mb-6 flex-wrap">
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                  onClick={() => navigate(createPageUrl("CreateTask?project_id=" + cleanProjectId))}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Nova Tarefa
                </Button>
                <Button 
                  variant="outline"
                  className="border-border hover:bg-accent"
                  onClick={() => navigate(createPageUrl("KanbanBoard?project_id=" + cleanProjectId))}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Ver no Kanban
                </Button>
              </div>
            )}
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const columnInfo = getColumnInfo(projectBoard, task.status);
                  
                  return (
                    <div 
                      key={task.id} 
                      className="p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(createPageUrl("TaskDetail?id=" + task.id))}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-foreground">{task.title}</p>
                        <Badge 
                          className="text-white"
                          style={{ backgroundColor: columnInfo?.color || '#6b7280' }}
                        >
                          {columnInfo?.name || task.status}
                        </Badge>
                      </div>
                      {task.assigned_to_email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>Atribuída a: {users.find((u: any) => u.email === task.assigned_to_email)?.name || task.assigned_to_email}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">Nenhuma tarefa cadastrada</p>
                {canManage && (
                  <Button 
                    className="bg-primary hover:bg-primary/80" 
                    onClick={() => navigate(createPageUrl("CreateTask?project_id=" + cleanProjectId))}
                  >
                    Criar Primeira Tarefa
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Cronograma do Projeto</h3>
              <p className="text-muted-foreground">
                {project?.methodology === 'scrum' 
                  ? 'Visualize o progresso dos épicos e features do projeto'
                  : 'Visualize o progresso das etapas e marcos do projeto'
                }
              </p>
            </div>

            <Card className="border-border">
              <CardHeader className="border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">
                    {project?.methodology === 'scrum' ? 'Épicos' : 'Timeline'}
                  </CardTitle>
                  {project?.methodology !== 'scrum' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          toast.info("A geração de cronograma com IA estará disponível em breve.");
                        }}
                        variant="outline"
                        size="sm"
                        className="border-primary/50 text-primary hover:bg-primary/10"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Gerar com IA
                      </Button>
                      <Button
                        onClick={() => navigate(createPageUrl("ProjectGanttV2?project_id=" + cleanProjectId))}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        <GanttChartSquare className="w-4 h-4 mr-2" />
                        Abrir Gantt
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {project?.methodology === 'scrum' ? (
                  epics.length > 0 ? (
                    <EpicHierarchyView 
                      epics={epics.map(epic => ({
                        ...epic,
                        progress: calculateEpicProgress(epic.id).percentage,
                        features: features
                          .filter(f => f.epic_id === epic.id)
                          .map(feature => ({
                            ...feature,
                            progress: calculateFeatureProgress(feature.id).percentage,
                            stories: stories.filter(s => s.feature_id === feature.id)
                          }))
                      }))}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum épico encontrado</h3>
                      <p className="text-muted-foreground mb-4">
                        Crie épicos para visualizar a hierarquia do projeto
                      </p>
                    </div>
                  )
                ) : (
                  milestoneTasks.length > 0 ? (
                    <MilestoneTimelineView 
                      milestones={milestoneTasks}
                      isTaskCompleted={isTaskCompleted}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum marco encontrado</h3>
                      <p className="text-muted-foreground mb-4">
                        Marque tarefas como marcos para visualizar a timeline do projeto
                      </p>
                      {canManage && (
                        <Button 
                          onClick={() => navigate(createPageUrl("ProjectGanttV2?project_id=" + cleanProjectId))}
                          className="bg-primary hover:bg-primary/80"
                        >
                          <GanttChartSquare className="w-4 h-4 mr-2" />
                          Abrir Gantt
                        </Button>
                      )}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks">
            <Tabs defaultValue="risks" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="risks">Riscos</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
              </TabsList>
              
              <TabsContent value="risks" className="mt-6">
                <RiskManagementSection 
                  projectId={cleanProjectId || ""}
                />
              </TabsContent>
              
              <TabsContent value="issues" className="mt-6">
                <IssueManagementSection 
                  projectId={cleanProjectId || ""}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="team">
            {canManage && (
              <div className="flex gap-3 mb-6 flex-wrap">
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                  onClick={() => navigate(createPageUrl("TeamManagement"))}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Gerenciar Equipes
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {project.manager_email && (
                <div className="p-6 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-4 border-primary shadow-lg">
                      <AvatarImage src={getUserAvatar(project.manager_email).avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {getUserAvatar(project.manager_email).initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-xl font-bold text-foreground mb-1">
                        {(project as any).manager_name || project.manager_email}
                      </p>
                      <p className="text-sm text-muted-foreground">Gerente do Projeto</p>
                    </div>
                    <Badge className="bg-primary/20 text-primary text-sm px-4 py-2">Gerente</Badge>
                  </div>
                </div>
              )}

              {teams && teams.length > 0 ? (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-foreground">Times do Projeto</h3>
                  {teams.map((team: any) => (
                    <div key={team.id} className="p-6 rounded-xl bg-accent/30 border border-border">
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
                        <div
                          className="w-16 h-16 rounded-xl flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg"
                          style={{ backgroundColor: team.color || '#3b82f6' }}
                        >
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-foreground mb-1">{team.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {team.members?.length || 0} {(team.members?.length || 0) === 1 ? 'membro' : 'membros'}
                          </p>
                        </div>
                      </div>

                      {team.members && team.members.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {team.members.map((member: any) => (
                            <div 
                              key={member.email} 
                              className="p-4 rounded-xl bg-background border border-border hover:border-primary/50 transition-all"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar className="w-12 h-12 border-2 border-primary/20">
                                  <AvatarImage src={getUserAvatar(member.email).avatar_url || undefined} />
                                  <AvatarFallback className="bg-primary/20 text-primary">
                                    {getUserAvatar(member.email).initial}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {member.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                              {member.team_role && (
                                <Badge variant="outline" className="w-full justify-center text-xs">
                                  {member.team_role}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">Nenhum time associado ao projeto</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resources">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Alocação de Recursos</h3>
              <p className="text-muted-foreground">
                Gerencie a carga de trabalho e disponibilidade da equipe do projeto
              </p>
            </div>
            <ResourceAllocationPanel 
              projectId={cleanProjectId || ''} 
              startDate={project.start_date} 
              endDate={project.end_date} 
            />
          </TabsContent>

          {childProjects.length > 0 && (
            <TabsContent value="subprojects">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      Sub-projetos de {project.name}
                    </h3>
                    <p className="text-muted-foreground">
                      {childProjects.length} {childProjects.length === 1 ? 'sub-projeto' : 'sub-projetos'} vinculados
                    </p>
                  </div>
                  {canManage && (
                    <Button
                      onClick={() => navigate(createPageUrl("CreateProject"))}
                      className="bg-primary hover:bg-primary/80"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Sub-projeto
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {childProjects.map((childProject, index) => {
                    const childProgress = childProject.progress || 0;
                    const statusColors: any = {
                      planning: "bg-gray-500/20 text-gray-600",
                      active: "bg-blue-500/20 text-blue-600",
                      completed: "bg-green-500/20 text-green-600"
                    };
                    const statusLabels: any = {
                      planning: "Planejamento",
                      active: "Ativo",
                      completed: "Concluído"
                    };
                    
                    return (
                      <motion.div
                        key={childProject.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card 
                          className="border-border hover:border-primary/50 transition-all cursor-pointer h-full"
                          onClick={() => navigate(createPageUrl(`ProjectDetail?id=${childProject.id}`))}
                        >
                          <CardContent className="p-6">
                            {/* Color Bar */}
                            <div
                              className="h-2 rounded-full mb-4"
                              style={{ backgroundColor: childProject.color || '#3b82f6' }}
                            />

                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xl font-bold text-foreground mb-1 truncate">
                                  {childProject.name}
                                </h4>
                                <p className="text-sm text-muted-foreground font-mono">{childProject.code}</p>
                              </div>
                              <Badge className={statusColors[childProject.status]}>
                                {statusLabels[childProject.status]}
                              </Badge>
                            </div>

                            {/* Description */}
                            {childProject.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                {childProject.description}
                              </p>
                            )}

                            {/* Progress */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">Progresso</span>
                                <span className="text-xs font-semibold text-foreground">{childProgress}%</span>
                              </div>
                              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                                  style={{ width: childProgress + '%' }}
                                />
                              </div>
                            </div>

                            {/* Metadata */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {childProject.start_date && new Date(childProject.start_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {childProject.team_ids?.length || 0} {childProject.team_ids?.length === 1 ? 'time' : 'times'}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {showHierarchyModal && project && (
        <ProjectHierarchyModal
          open={showHierarchyModal}
          project={project}
          onClose={() => setShowHierarchyModal(false)}
        />
      )}

      {showSprintDetail && selectedSprintId && (
        <SprintDetailModal
          open={showSprintDetail}
          sprint={sprints.find(s => s.id === selectedSprintId)!}
          onClose={() => {
            setShowSprintDetail(false);
            setSelectedSprintId(null);
          }}
        />
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto "{project?.name}"? Esta ação não pode ser desfeita.
              Todos os dados relacionados ao projeto também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
