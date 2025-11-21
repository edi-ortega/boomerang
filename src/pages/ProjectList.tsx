import React, { useState, useEffect, useMemo } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, Folder, TrendingUp, AlertCircle, ArrowLeft, CheckCircle, Target, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { hasPermission, PERMISSIONS } from "@/components/utils/PermissionsHelper";
import { useContextSidebar } from "../contexts/ContextSidebarContext";
import { useTenantId } from "@/hooks/useTenantId";
import { ViewToggle } from "@/components/ViewToggle";
import { useViewModeStore } from "@/stores/viewModeStore";
import { useProjects } from "@/hooks/useProjects";
import { useQuery } from "@tanstack/react-query";

export default function ProjectList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateContext, clearContext } = useContextSidebar();
  const tenantId = useTenantId();
  const { viewMode } = useViewModeStore();
  
  const { projects, isLoading: projectsLoading, deleteProject } = useProjects();
  
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", tenantId],
    queryFn: async () => {
      const result = await base44.entities.ProjectCategory.list();
      return result;
    },
    enabled: !!tenantId,
    staleTime: 0,
    refetchOnMount: "always"
  });
  
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", tenantId],
    queryFn: async () => {
      const result = await base44.entities.Task.list();
      return result.filter((t: any) => t.client_id === tenantId);
    },
    enabled: !!tenantId,
    staleTime: 0,
    refetchOnMount: "always"
  });
  
  const { data: boards = [] } = useQuery({
    queryKey: ["boards", tenantId],
    queryFn: async () => {
      const result = await base44.entities.Board.list();
      return result;
    },
    enabled: !!tenantId,
    staleTime: 0,
    refetchOnMount: "always"
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [methodologyFilter, setMethodologyFilter] = useState("all");
  const [canManage, setCanManage] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const isLoading = projectsLoading;

  useEffect(() => {
    const checkPermissions = async () => {
      const canManageProjects = await hasPermission(PERMISSIONS.MANAGE_PROJECTS);
      setCanManage(canManageProjects);
    };
    checkPermissions();
    
    return () => {
      clearContext();
    };
  }, []);

  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (methodologyFilter !== "all") {
      filtered = filtered.filter(p => p.methodology === methodologyFilter);
    }

    return filtered;
  }, [projects, searchTerm, statusFilter, categoryFilter, methodologyFilter]);

  useEffect(() => {
    if (!isLoading && projects.length > 0) {
      updateContextSidebar();
    }
  }, [projects, filteredProjects, isLoading, tasks, boards]);

  const updateContextSidebar = () => {
    const rootProjectsForSidebar = projects.filter(p => !p.parent_project_id);

    const activeProjects = rootProjectsForSidebar.filter(p => p.status === 'in_progress').length;
    const completedProjects = rootProjectsForSidebar.filter(p => p.status === 'completed').length;
    const healthyProjects = rootProjectsForSidebar.filter(p => p.health_status === 'healthy').length;
    const atRiskProjects = rootProjectsForSidebar.filter(p => p.health_status === 'at_risk').length;
    const criticalProjects = rootProjectsForSidebar.filter(p => p.health_status === 'critical').length;
    
    const avgProgress = rootProjectsForSidebar.length > 0 
      ? Math.round(rootProjectsForSidebar.reduce((sum, p) => sum + (calculateProjectProgress(p)), 0) / rootProjectsForSidebar.length)
      : 0;

    updateContext({
      title: "Projetos",
      stats: [
        {
          label: "Total de Projetos",
          value: rootProjectsForSidebar.length,
          icon: <Folder className="w-4 h-4 text-blue-500" />
        },
        {
          label: "Em Andamento",
          value: activeProjects,
          icon: <TrendingUp className="w-4 h-4 text-green-500" />
        },
        {
          label: "Concluídos",
          value: completedProjects,
          icon: <CheckCircle className="w-4 h-4 text-blue-600" />
        },
        {
          label: "Progresso Médio",
          value: `${avgProgress}%`,
          icon: <Target className="w-4 h-4 text-purple-500" />
        },
        {
          label: "Saúde dos Projetos",
          value: `${healthyProjects}/${rootProjectsForSidebar.length}`,
          icon: <AlertCircle className="w-4 h-4 text-yellow-500" />
        }
      ],
      tips: [
        { text: "Use a busca para encontrar projetos rapidamente" },
        { text: "Filtre por status para ver apenas projetos ativos" },
        { text: "Cartões com borda vermelha indicam projetos críticos" },
        { text: "Clique em um projeto para ver detalhes completos" }
      ]
    });
  };

  const handleDeleteProject = async () => {
    if (!deleteProjectId) return;
    
    try {
      await deleteProject.mutateAsync(deleteProjectId);
      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído com sucesso."
      });
      setShowDeleteConfirm(false);
      setDeleteProjectId(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o projeto.",
        variant: "destructive"
      });
    }
  };

  // Calcula o progresso de cada projeto com base em tasks e boards
  const projectProgressMap = useMemo(() => {
    const progressMap = new Map<string, number>();
    
    projects.forEach((project: any) => {
      // Para projetos waterfall, usar o progresso manual do projeto
      if (project.methodology === 'waterfall' && project.progress !== undefined && project.progress !== null) {
        progressMap.set(project.id, project.progress);
        return;
      }

      // Para projetos ágeis, calcular com base nas tasks
      const projectTasks = tasks.filter(t => t.project_id === project.id);
      
      if (projectTasks.length === 0) {
        progressMap.set(project.id, project.progress || 0);
        return;
      }

      const projectBoard = boards.find(b => b.id === project.board_id);
      
      let completedTasks = 0;
      projectTasks.forEach(task => {
        if (task.status === 'done') {
          completedTasks++;
        } else if (projectBoard && projectBoard.columns) {
          const taskColumn = projectBoard.columns.find((col: any) => col.id === task.status);
          if (taskColumn && taskColumn.is_final) {
            completedTasks++;
          }
        }
      });

      const calculatedProgress = Math.round((completedTasks / projectTasks.length) * 100);
      progressMap.set(project.id, calculatedProgress);
    });
    
    return progressMap;
  }, [projects, tasks, boards]);

  const calculateProjectProgress = (project: any) => {
    return projectProgressMap.get(project.id) || 0;
  };


  const statusColors: Record<string, string> = {
    planning: "bg-gray-500/20 text-gray-600 dark:text-gray-400",
    in_progress: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
    on_hold: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    completed: "bg-green-500/20 text-green-600 dark:text-green-400",
    cancelled: "bg-red-500/20 text-red-600 dark:text-red-400"
  };

  const statusLabels: Record<string, string> = {
    planning: "Planejamento",
    in_progress: "Em Andamento",
    on_hold: "Pausado",
    completed: "Concluído",
    cancelled: "Cancelado"
  };

  const methodologyLabels: Record<string, string> = {
    waterfall: "Waterfall",
    scrum: "Scrum",
    kanban: "Kanban",
    hybrid: "Híbrido"
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="border-border hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Projetos</h1>
              <p className="text-muted-foreground">Gerencie todos os seus projetos</p>
            </div>
          </div>
          {canManage && (
            <Button
              onClick={() => navigate(createPageUrl("CreateProject"))}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Projeto
            </Button>
          )}
          {!canManage && (
            <div className="text-sm text-muted-foreground">
              Sem permissão para criar projetos
            </div>
          )}
        </motion.div>

        <Card className="border-border bg-card mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Filtros</h2>
              <ViewToggle />
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="planning">Planejamento</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="on_hold">Pausado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodologyFilter} onValueChange={setMethodologyFilter}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Metodologia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="waterfall">Waterfall</SelectItem>
                  <SelectItem value="scrum">Scrum</SelectItem>
                  <SelectItem value="kanban">Kanban</SelectItem>
                  <SelectItem value="hybrid">Híbrido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="glass-effect border-border animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-40 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        ) : filteredProjects.filter(p => !p.parent_project_id).length > 0 ? (
          viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.filter(p => !p.parent_project_id).map((project: any, index: number) => {
              const calculatedProgress = calculateProjectProgress(project);
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="glass-effect border-border hover:border-primary/50 transition-all group h-full">
                    <CardContent className="p-6">
                      <div
                        className="h-2 rounded-full mb-4"
                        style={{ backgroundColor: project.color || '#3b82f6' }}
                      />

                      <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                              {project.name}
                            </h3>
                            <p className="text-sm text-muted-foreground font-mono">{project.code}</p>
                          </div>
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(createPageUrl(`ProjectEdit?id=${project.id}`));
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.preventDefault();
                                setDeleteProjectId(project.id);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className={statusColors[project.status]}>
                            {statusLabels[project.status]}
                          </Badge>
                          <Badge variant="outline" className="border-border">
                            {methodologyLabels[project.methodology]}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-semibold text-foreground">{calculatedProgress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${calculatedProgress}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          ) : (
            <Card className="border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Metodologia</TableHead>
                    <TableHead className="text-right">Progresso</TableHead>
                    {canManage && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.filter(p => !p.parent_project_id).map((project: any) => {
                    const calculatedProgress = calculateProjectProgress(project);
                    
                    return (
                      <TableRow 
                        key={project.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(createPageUrl(`ProjectDetail?id=${project.id}`))}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: project.color || '#3b82f6' }}
                            />
                            {project.name}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{project.code}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[project.status]}>
                            {statusLabels[project.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border">
                            {methodologyLabels[project.methodology]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm font-semibold">{calculatedProgress}%</span>
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${calculatedProgress}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(createPageUrl(`ProjectEdit?id=${project.id}`));
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteProjectId(project.id);
                                  setShowDeleteConfirm(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )
        ) : (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <Folder className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum projeto encontrado</h3>
              <p className="text-muted-foreground mb-6">
                {canManage ? "Comece criando seu primeiro projeto" : "Não há projetos disponíveis no momento"}
              </p>
              {canManage && (
                <Button
                  onClick={() => navigate(createPageUrl("CreateProject"))}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.
              Todos os dados relacionados ao projeto também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProjectId(null)}>Cancelar</AlertDialogCancel>
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
