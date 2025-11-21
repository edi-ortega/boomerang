import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, Plus, Play, CheckCircle, Trash2, Eye, Users, BarChart, Target, TrendingUp, Folder } from "lucide-react";
import { bmr as base44 } from "@/api/boomerangClient";
import { hasPermission, PERMISSIONS } from "@/lib/permissions-helper";
import { useContextSidebar } from "@/contexts/ContextSidebarContext";
import { getCurrentTenantId } from "@/lib/tenant-helper";
import SprintReportModal from "@/components/reports/SprintReportModal";
import CreatePokerSessionModal from "@/components/poker/CreatePokerSessionModal";
import AISprintGoalButton from "@/components/sprint/AISprintGoalButton";
import { useConfirm } from "@/hooks/use-confirm";

interface Sprint {
  id: string;
  name: string;
  goal?: string;
  project_id: string;
  project?: { name: string; code?: string };
  status: string;
  start_date?: string;
  end_date?: string;
  total_story_points?: number;
  completed_story_points?: number;
  tenant_id: string;
}

interface PokerSession {
  id: string;
  sprint_id: string;
  status: string;
  name?: string;
  created_at: string;
}

export default function SprintManagement() {
  const { confirm, ConfirmDialog } = useConfirm();
  const navigate = useNavigate();
  const { updateContext, clearContext } = useContextSidebar();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [pokerSessions, setPokerSessions] = useState<PokerSession[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Modals
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedSprintForReport, setSelectedSprintForReport] = useState<Sprint | null>(null);
  const [pokerModalOpen, setPokerModalOpen] = useState(false);
  const [selectedSprintForPoker, setSelectedSprintForPoker] = useState<Sprint | null>(null);
  
  // Filters
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // New sprint form
  const [newSprint, setNewSprint] = useState({
    name: "",
    goal: "",
    project_id: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    checkPermissionsAndLoadData();
    
    return () => {
      clearContext();
    };
  }, []);

  // Polling para sessões de poker
  useEffect(() => {
    if (!canManage) return;
    
    const interval = setInterval(() => {
      loadPokerSessions();
    }, 10000); // Poll a cada 10 segundos
    
    return () => clearInterval(interval);
  }, [canManage]);

  const checkPermissionsAndLoadData = async () => {
    try {
      const manage = await hasPermission(PERMISSIONS.MANAGE_SPRINTS);
      setCanManage(manage);
      
      await Promise.all([loadProjects(), loadSprints(), loadBoards(), loadPokerSessions()]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const tenantId = await getCurrentTenantId();
      const data = await base44.entities.Project.list();
      setProjects((data || []).filter((p: any) => p.tenant_id === tenantId));
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadSprints = async () => {
    try {
      const tenantId = await getCurrentTenantId();
      const data = await base44.entities.Sprint.list("start_date DESC");
      const allProjects = await base44.entities.Project.list();
      
      const sprintsWithProjects = (data || []).map((sprint: any) => ({
        ...sprint,
        project: allProjects.find((p: any) => p.id === sprint.project_id),
      }));
      
      const filtered = sprintsWithProjects.filter((s: any) => {
        const proj = allProjects.find((p: any) => p.id === s.project_id);
        return proj?.tenant_id === tenantId;
      });
      
      setSprints(filtered);
      updateContextSidebar(filtered);
    } catch (error) {
      console.error("Error loading sprints:", error);
    }
  };

  const loadBoards = async () => {
    try {
      const data = await base44.entities.Board.list();
      setBoards(data || []);
    } catch (error) {
      console.error("Error loading boards:", error);
    }
  };

  const loadPokerSessions = async () => {
    try {
      const data = await base44.entities.PlanningPokerSession.filter({ status: "active" });
      setPokerSessions(data || []);
    } catch (error) {
      console.error("Error loading poker sessions:", error);
    }
  };

  const updateContextSidebar = (sprintsList: Sprint[]) => {
    const activeSprints = sprintsList.filter(s => s.status === "active").length;
    const plannedSprints = sprintsList.filter(s => s.status === "planning" || s.status === "planned").length;
    const completedSprints = sprintsList.filter(s => s.status === "completed").length;
    const totalPoints = sprintsList.reduce((sum, s) => sum + (s.total_story_points || 0), 0);

    updateContext({
      title: "Gestão de Sprints",
      stats: [
        { label: "Sprints Ativos", value: activeSprints, icon: <Play className="h-4 w-4" /> },
        { label: "Planejados", value: plannedSprints, icon: <Calendar className="h-4 w-4" /> },
        { label: "Concluídos", value: completedSprints, icon: <CheckCircle className="h-4 w-4" /> },
        { label: "Story Points Total", value: totalPoints, icon: <Target className="h-4 w-4" /> },
      ],
      tips: [
        { icon: <TrendingUp className="h-4 w-4" />, text: "Mantenha os sprints com duração consistente (2-4 semanas)" },
        { icon: <Users className="h-4 w-4" />, text: "Use Planning Poker para estimar story points em equipe" },
        { icon: <BarChart className="h-4 w-4" />, text: "Acompanhe a velocidade da equipe através dos relatórios" },
      ],
    });
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSprint.name || !newSprint.project_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const tenantId = await getCurrentTenantId();
      await base44.entities.Sprint.create({
        ...newSprint,
        status: "planning",
        tenant_id: tenantId,
      });
      
      toast.success("Sprint criado com sucesso");
      
      setShowForm(false);
      setNewSprint({
        name: "",
        goal: "",
        project_id: "",
        start_date: "",
        end_date: "",
      });
      
      await loadSprints();
    } catch (error) {
      console.error("Error creating sprint:", error);
      toast.error("Erro ao criar sprint");
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    try {
      await base44.entities.Sprint.update(sprintId, { status: "active" });
      toast.success("Sprint iniciado com sucesso");
      await loadSprints();
    } catch (error) {
      console.error("Error starting sprint:", error);
      toast.error("Erro ao iniciar sprint");
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    try {
      await base44.entities.Sprint.update(sprintId, { status: "completed" });
      toast.success("Sprint concluído com sucesso");
      await loadSprints();
    } catch (error) {
      console.error("Error completing sprint:", error);
      toast.error("Erro ao concluir sprint");
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    const confirmed = await confirm({
      title: "Excluir Sprint",
      description: "Tem certeza que deseja excluir este sprint? Esta ação não pode ser desfeita.",
    });
    
    if (!confirmed) return;

    try {
      await base44.entities.Sprint.delete(sprintId);
      toast.success("Sprint excluído com sucesso");
      await loadSprints();
    } catch (error) {
      console.error("Error deleting sprint:", error);
      toast.error("Erro ao excluir sprint");
    }
  };

  const handleViewReport = (sprint: Sprint) => {
    setSelectedSprintForReport(sprint);
    setReportModalOpen(true);
  };

  const handleCreatePokerSession = (sprint: Sprint) => {
    setSelectedSprintForPoker(sprint);
    setPokerModalOpen(true);
  };

  const handleSubmitPokerSession = async (data: any) => {
    if (!selectedSprintForPoker) return;

    try {
      const tenantId = await getCurrentTenantId();
      await base44.entities.PlanningPokerSession.create({
        sprint_id: selectedSprintForPoker.id,
        name: data.name,
        status: "active",
        tenant_id: tenantId,
      });

      toast.success("Sessão de Planning Poker criada");

      setPokerModalOpen(false);
      setSelectedSprintForPoker(null);
      await loadPokerSessions();
    } catch (error) {
      console.error("Error creating poker session:", error);
      toast.error("Erro ao criar sessão de poker");
    }
  };

  const getFilteredSprints = () => {
    return sprints.filter((sprint) => {
      if (selectedProject !== "all" && sprint.project_id !== selectedProject) return false;
      if (selectedStatus !== "all" && sprint.status !== selectedStatus) return false;
      return true;
    });
  };

  const getActivePokerSession = (sprintId: string) => {
    return pokerSessions.find(ps => ps.sprint_id === sprintId);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      planning: { label: "Planejamento", variant: "secondary" },
      planned: { label: "Planejado", variant: "secondary" },
      active: { label: "Ativo", variant: "default" },
      completed: { label: "Concluído", variant: "outline" },
    };

    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando sprints...</p>
        </div>
      </div>
    );
  }

  const filteredSprints = getFilteredSprints();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Sprints</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os sprints dos seus projetos
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Sprint
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Projeto</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os projetos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="planning">Planejamento</SelectItem>
                  <SelectItem value="planned">Planejado</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Sprint Form */}
      {canManage && showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Sprint</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSprint} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Projeto *</Label>
                  <Select
                    value={newSprint.project_id}
                    onValueChange={(value) =>
                      setNewSprint({ ...newSprint, project_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Sprint *</Label>
                  <Input
                    id="name"
                    value={newSprint.name}
                    onChange={(e) =>
                      setNewSprint({ ...newSprint, name: e.target.value })
                    }
                    placeholder="Ex: Sprint 1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="goal">Objetivo do Sprint</Label>
                  <AISprintGoalButton
                    onGoalGenerated={(goal) => setNewSprint({ ...newSprint, goal })}
                    sprintName={newSprint.name}
                    projectId={newSprint.project_id}
                  />
                </div>
                <Textarea
                  id="goal"
                  value={newSprint.goal}
                  onChange={(e) =>
                    setNewSprint({ ...newSprint, goal: e.target.value })
                  }
                  placeholder="Descreva o objetivo deste sprint"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newSprint.start_date}
                    onChange={(e) =>
                      setNewSprint({ ...newSprint, start_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Término</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newSprint.end_date}
                    onChange={(e) =>
                      setNewSprint({ ...newSprint, end_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Criar Sprint</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sprints List */}
      <div className="grid gap-4">
        {filteredSprints.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Folder className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum sprint encontrado</p>
              <p className="text-muted-foreground">
                {canManage
                  ? "Crie um novo sprint para começar"
                  : "Entre em contato com o administrador"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSprints.map((sprint) => (
            <Card key={sprint.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{sprint.name}</CardTitle>
                    {sprint.goal && (
                      <p className="text-sm text-muted-foreground">{sprint.goal}</p>
                    )}
                  </div>
                  {getStatusBadge(sprint.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Sessão de Poker Ativa */}
                {getActivePokerSession(sprint.id) && (
                  <div className="p-4 bg-accent/50 rounded-lg border border-accent mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-accent-foreground" />
                        <span className="font-medium text-accent-foreground">
                          Planning Poker em andamento
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/planning-poker/${getActivePokerSession(sprint.id)?.id}`)
                        }
                      >
                        Entrar na Sessão
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Projeto</p>
                    <p className="font-medium">
                      {sprint.project?.code
                        ? `[${sprint.project.code}] ${sprint.project.name}`
                        : sprint.project?.name}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/sprints/${sprint.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>

                    {canManage && sprint.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReport(sprint)}
                      >
                        <BarChart className="h-4 w-4 mr-2" />
                        Relatório
                      </Button>
                    )}

                    {canManage &&
                      (sprint.status === "planning" || sprint.status === "planned") &&
                      !getActivePokerSession(sprint.id) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreatePokerSession(sprint)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Planning Poker
                        </Button>
                      )}

                    {canManage && (sprint.status === "planning" || sprint.status === "planned") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartSprint(sprint.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar
                      </Button>
                    )}

                    {canManage && sprint.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompleteSprint(sprint.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Concluir
                      </Button>
                    )}

                    {canManage && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSprint(sprint.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress */}
                {sprint.total_story_points !== undefined &&
                  sprint.total_story_points > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">
                          {sprint.completed_story_points || 0} / {sprint.total_story_points}{" "}
                          pontos
                        </span>
                      </div>
                      <Progress
                        value={
                          ((sprint.completed_story_points || 0) /
                            sprint.total_story_points) *
                          100
                        }
                      />
                    </div>
                  )}

                {/* Dates */}
                {(sprint.start_date || sprint.end_date) && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {sprint.start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Início:{" "}
                          {new Date(sprint.start_date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}
                    {sprint.end_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Término:{" "}
                          {new Date(sprint.end_date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <SprintReportModal
        open={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setSelectedSprintForReport(null);
        }}
        sprint={selectedSprintForReport}
      />

      <CreatePokerSessionModal
        open={pokerModalOpen}
        onClose={() => {
          setPokerModalOpen(false);
          setSelectedSprintForPoker(null);
        }}
        onSubmit={handleSubmitPokerSession}
      />
    </div>
  );
}
