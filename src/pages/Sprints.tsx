import { useState, useEffect } from "react";
import { Plus, Calendar, Target, TrendingUp, Clock, Eye, Edit, Play, CheckCircle, Trash2, FileText, Users2, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ViewToggle } from "@/components/ViewToggle";
import { useViewModeStore } from "@/stores/viewModeStore";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSprints } from "@/hooks/useSprints";
import { useProjects } from "@/hooks/useProjects";
import { useTenant } from "@/contexts/TenantContext";
import { getSupabaseClient } from "@/lib/supabase-client";
import SprintModal from "@/components/SprintModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function Sprints() {
  const navigate = useNavigate();
  const { currentTenantId } = useTenant();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<any>(null);
  const [pokerSessions, setPokerSessions] = useState<Record<string, any>>({});

  const { projects } = useProjects();
  const { sprints, isLoading, createSprint, updateSprint, deleteSprint } = useSprints(
    selectedProjectId || undefined
  );
  const { viewMode } = useViewModeStore();

  // Carregar sessões de poker ativas para cada sprint
  useEffect(() => {
    const loadPokerSessions = async () => {
      if (!currentTenantId || sprints.length === 0) return;

      try {
        const client = await getSupabaseClient();
        const { data: sessions } = await client
          .from("prj_planning_poker_session")
          .select("*")
          .eq("client_id", currentTenantId)
          .neq("status", "completed");

        if (sessions) {
          const sessionsBySprintId: Record<string, any> = {};
          sessions.forEach((session: any) => {
            if (session.sprint_id) {
              sessionsBySprintId[session.sprint_id] = session;
            }
          });
          setPokerSessions(sessionsBySprintId);
        }
      } catch (error) {
        console.error("Erro ao carregar sessões de poker:", error);
      }
    };

    loadPokerSessions();
  }, [currentTenantId, sprints]);

  const filteredSprints = sprints
    .filter((sprint) => {
      const matchesSearch = sprint.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || sprint.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sprints finalizadas vão para o final
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      // Ordenar por data de início (mais antiga primeiro = ordem cronológica)
      const dateA = new Date(a.start_date || '1900-01-01').getTime();
      const dateB = new Date(b.start_date || '1900-01-01').getTime();
      return dateA - dateB;
    });

  const handleCreateSprint = () => {
    if (!selectedProjectId) {
      toast.error("Por favor, selecione um projeto antes de criar uma sprint");
      return;
    }
    setSelectedSprint(null);
    setIsModalOpen(true);
  };

  const handleEditSprint = (sprintId: string) => {
    navigate(`/sprint/${sprintId}`);
  };

  const handleSaveSprint = async (sprintData: any) => {
    try {
      if (selectedSprint) {
        await updateSprint.mutateAsync({ id: selectedSprint.id, ...sprintData });
      } else {
        await createSprint.mutateAsync(sprintData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar sprint:", error);
    }
  };

  const handleDeleteSprint = async (e: React.MouseEvent, sprintId: string) => {
    e.stopPropagation();
    if (window.confirm("Tem certeza que deseja excluir este sprint?")) {
      try {
        await deleteSprint.mutateAsync(sprintId);
        toast.success("Sprint excluído com sucesso");
      } catch (error) {
        console.error("Erro ao excluir sprint:", error);
        toast.error("Erro ao excluir sprint");
      }
    }
  };

  const handleStartSprint = async (e: React.MouseEvent, sprint: any) => {
    e.stopPropagation();
    try {
      await updateSprint.mutateAsync({ id: sprint.id, status: "active" });
      toast.success("Sprint iniciado com sucesso");
    } catch (error) {
      console.error("Erro ao iniciar sprint:", error);
      toast.error("Erro ao iniciar sprint");
    }
  };

  const handleCompleteSprint = async (e: React.MouseEvent, sprint: any) => {
    e.stopPropagation();
    if (window.confirm("Tem certeza que deseja finalizar este sprint?")) {
      try {
        await updateSprint.mutateAsync({ id: sprint.id, status: "completed" });
        toast.success("Sprint finalizado com sucesso");
      } catch (error) {
        console.error("Erro ao finalizar sprint:", error);
        toast.error("Erro ao finalizar sprint");
      }
    }
  };

  const handleGoToKanban = (e: React.MouseEvent, sprint: any) => {
    e.stopPropagation();
    navigate(`/kanban?project=${sprint.project_id}&sprint=${sprint.id}`);
  };

  const handleViewSprint = (e: React.MouseEvent, sprintId: string) => {
    e.stopPropagation();
    navigate(`/sprint/${sprintId}`);
  };

  const handleViewReport = (e: React.MouseEvent, sprintId: string) => {
    e.stopPropagation();
    navigate(`/sprint/${sprintId}?tab=report`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-muted text-muted-foreground";
      case "active":
        return "bg-primary text-primary-foreground";
      case "completed":
        return "bg-green-500 text-white";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planning":
        return "Planejamento";
      case "active":
        return "Ativo";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Sprints</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie os sprints dos seus projetos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ViewToggle />
              <Button 
                onClick={handleCreateSprint}
                disabled={!selectedProjectId}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Sprint
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar sprints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select 
                  value={selectedProjectId || "all"} 
                  onValueChange={(value) => setSelectedProjectId(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <SelectValue placeholder="Selecione um projeto" />
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="planning">Planejamento</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!selectedProjectId && (
                <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Selecione um projeto para criar novos sprints
                </p>
              )}
            </CardContent>
          </Card>

          {/* Lista de Sprints */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando sprints...
            </div>
          ) : filteredSprints.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Nenhum sprint encontrado
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedProjectId 
                      ? "Comece criando seu primeiro sprint para este projeto"
                      : "Selecione um projeto e comece criando seu primeiro sprint"
                    }
                  </p>
                  {selectedProjectId && (
                    <Button onClick={handleCreateSprint}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Sprint
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSprints.map((sprint) => {
                const daysRemaining = getDaysRemaining(sprint.end_date);
                const project = projects.find((p) => p.id === sprint.project_id);

                return (
                  <Card
                    key={sprint.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-lg text-foreground line-clamp-2">
                            {sprint.name}
                          </h3>
                          <Badge className={getStatusColor(sprint.status)}>
                            {getStatusLabel(sprint.status)}
                          </Badge>
                        </div>
                        {project && (
                          <p className="text-sm text-muted-foreground">
                            {project.name}
                          </p>
                        )}
                      </div>

                      {sprint.goal && (
                        <div className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {sprint.goal}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {format(new Date(sprint.start_date), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(sprint.end_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>

                        {sprint.status === "active" && daysRemaining >= 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {daysRemaining === 0 ? "Último dia" : daysRemaining === 1 ? "1 dia restante" : `${daysRemaining} dias restantes`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Story Points</p>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-foreground">
                              {sprint.completed_story_points || 0} / {sprint.total_story_points || 0}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Progresso</p>
                          <span className="font-semibold text-foreground">
                            {sprint.total_story_points ? Math.round(((sprint.completed_story_points || 0) / sprint.total_story_points) * 100) : 0}%
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                        {pokerSessions[sprint.id] && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              navigate(`/planning-poker/${pokerSessions[sprint.id].id}`); 
                            }} 
                            className="flex-1"
                          >
                            <Users2 className="h-4 w-4 mr-2" />
                            Entrar na Sessão
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm" onClick={(e) => handleViewSprint(e, sprint.id)} className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />Ver
                        </Button>
                        
                        <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleEditSprint(sprint.id); }} className="flex-1">
                          <Edit className="h-4 w-4 mr-2" />Gerenciar
                        </Button>

                        {sprint.status === "planning" && (
                          <Button variant="success" size="sm" onClick={(e) => handleStartSprint(e, sprint)} className="flex-1">
                            <Play className="h-4 w-4 mr-2" />Iniciar
                          </Button>
                        )}

                        {sprint.status === "active" && (
                          <>
                            <Button variant="default" size="sm" onClick={(e) => handleGoToKanban(e, sprint)} className="flex-1">
                              <LayoutGrid className="h-4 w-4 mr-2" />Kanban
                            </Button>
                            <Button variant="warning" size="sm" onClick={(e) => handleCompleteSprint(e, sprint)} className="flex-1">
                              <CheckCircle className="h-4 w-4 mr-2" />Finalizar
                            </Button>
                          </>
                        )}

                        {sprint.status === "completed" && (
                          <Button variant="info" size="sm" onClick={(e) => handleViewReport(e, sprint.id)} className="flex-1">
                            <FileText className="h-4 w-4 mr-2" />Relatório
                          </Button>
                        )}

                        <Button variant="destructive" size="sm" onClick={(e) => handleDeleteSprint(e, sprint.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Story Points</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSprints.map((sprint) => {
                    const project = projects.find((p) => p.id === sprint.project_id);
                    const daysRemaining = getDaysRemaining(sprint.end_date);

                    return (
                      <TableRow 
                        key={sprint.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/sprint/${sprint.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{sprint.name}</span>
                            {sprint.status === "active" && daysRemaining >= 0 && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {daysRemaining === 0 ? "Último dia" : daysRemaining === 1 ? "1 dia restante" : `${daysRemaining} dias restantes`}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{project?.name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(sprint.status)}>
                            {getStatusLabel(sprint.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(sprint.start_date), "dd/MM/yy", { locale: ptBR })} - {format(new Date(sprint.end_date), "dd/MM/yy", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm font-semibold">
                              {sprint.completed_story_points || 0} / {sprint.total_story_points || 0}
                            </span>
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${sprint.total_story_points ? Math.round(((sprint.completed_story_points || 0) / sprint.total_story_points) * 100) : 0}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {pokerSessions[sprint.id] && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-purple-600 hover:text-purple-700" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  navigate(`/planning-poker/${pokerSessions[sprint.id].id}`); 
                                }}
                                title="Entrar na sessão de Planning Poker"
                              >
                                <Users2 className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEditSprint(sprint.id); }}>
                              <Edit className="h-4 w-4" />
                            </Button>

                            {sprint.status === "planning" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={(e) => handleStartSprint(e, sprint)}>
                                <Play className="h-4 w-4" />
                              </Button>
                            )}

                            {sprint.status === "active" && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleGoToKanban(e, sprint)}>
                                  <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-600 hover:text-orange-700" onClick={(e) => handleCompleteSprint(e, sprint)}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            {sprint.status === "completed" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700" onClick={(e) => handleViewReport(e, sprint.id)}>
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}

                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => handleDeleteSprint(e, sprint.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>

        {isModalOpen && (
          <SprintModal
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveSprint}
            sprint={selectedSprint}
            projectId={selectedProjectId || ""}
          />
        )}
      </div>
    </div>
  );
}
