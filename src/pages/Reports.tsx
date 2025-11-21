import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Calendar,
  RefreshCw,
  Download,
  Plus,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import BurndownChart from "@/components/reports/BurndownChart";
import VelocityChart from "@/components/reports/VelocityChart";
import ResourceUtilizationChart from "@/components/reports/ResourceUtilizationChart";
import ProjectHealthChart from "@/components/reports/ProjectHealthChart";
import DashboardBuilder from "@/components/reports/DashboardBuilder";
import ExportButton from "@/components/reports/ExportButton";
import { format, subDays } from "date-fns";

interface Project {
  id: string;
  name: string;
  status: string;
  progress?: number;
  health_status?: 'healthy' | 'at_risk' | 'critical';
}

interface Sprint {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  project_id: string;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  is_default?: boolean;
  widgets?: any[];
}

export default function Reports() {
  const { currentTenantId } = useTenant();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(null);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(['burndown', 'velocity', 'resources', 'health']);
  
  // Filters
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedSprint, setSelectedSprint] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  // Chart Data
  const [burndownData, setBurndownData] = useState<any[]>([]);
  const [velocityData, setVelocityData] = useState<any[]>([]);
  const [resourceData, setResourceData] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [currentTenantId]);

  useEffect(() => {
    if (projects.length > 0 || sprints.length > 0) {
      loadChartData();
    }
  }, [selectedProject, selectedSprint, dateRange, projects, sprints]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("prj_project")
        .select("*")
        .eq("client_id", currentTenantId)
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Load sprints
      const { data: sprintsData, error: sprintsError } = await supabase
        .from("prj_sprint")
        .select("*")
        .eq("client_id", currentTenantId)
        .order("created_at", { ascending: false });

      if (sprintsError) throw sprintsError;

      setProjects((projectsData || []) as Project[]);
      setSprints((sprintsData || []) as Sprint[]);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      await loadBurndownData();
      await loadVelocityData();
      await loadResourceData();
      await loadHealthData();
    } catch (error) {
      console.error("Error loading chart data:", error);
    }
  };

  const loadBurndownData = async () => {
    try {
      let query = supabase
        .from("prj_story")
        .select("*")
        .eq("client_id", currentTenantId);

      if (selectedProject !== "all") {
        query = query.eq("project_id", selectedProject);
      }

      if (selectedSprint !== "all") {
        query = query.eq("sprint_id", selectedSprint);
      }

      const { data: stories } = await query;

      const daysInPeriod = 14;
      const burndown = [];
      
      const totalPoints = stories?.reduce((sum, s) => sum + (parseInt(s.story_points || '0') || 0), 0) || 0;
      const idealBurnRate = totalPoints / daysInPeriod;

      for (let i = 0; i <= daysInPeriod; i++) {
        const day = format(subDays(new Date(), daysInPeriod - i), 'dd/MM');
        const completedStories = stories?.filter(s => s.status === 'done') || [];
        const completedPoints = completedStories.reduce((sum, s) => sum + (parseInt(s.story_points || '0') || 0), 0);
        
        burndown.push({
          day,
          ideal: Math.max(0, totalPoints - (idealBurnRate * i)),
          actual: Math.max(0, totalPoints - completedPoints)
        });
      }

      setBurndownData(burndown);
    } catch (error) {
      console.error("Error loading burndown data:", error);
    }
  };

  const loadVelocityData = async () => {
    try {
      let query = supabase
        .from("prj_sprint")
        .select("*, stories:prj_story(*)")
        .eq("client_id", currentTenantId)
        .order("start_date", { ascending: false })
        .limit(6);

      if (selectedProject !== "all") {
        query = query.eq("project_id", selectedProject);
      }

      const { data: sprintsData } = await query;

      const velocity = sprintsData?.map(sprint => {
        const stories = sprint.stories || [];
        const planned = stories.reduce((sum: number, s: any) => sum + (parseInt(s.story_points || '0') || 0), 0);
        const completed = stories
          .filter((s: any) => s.status === 'done')
          .reduce((sum: number, s: any) => sum + (parseInt(s.story_points || '0') || 0), 0);

        return {
          sprint: sprint.name,
          planned,
          completed
        };
      }) || [];

      setVelocityData(velocity.reverse());
    } catch (error) {
      console.error("Error loading velocity data:", error);
    }
  };

  const loadResourceData = async () => {
    try {
      const { data: allocations } = await supabase
        .from("prj_resource_allocation")
        .select("*")
        .eq("client_id", currentTenantId)
        .gte("start_date", dateRange.start)
        .lte("end_date", dateRange.end);

      const resourceMap = new Map();
      allocations?.forEach(alloc => {
        const userName = alloc.user_name || alloc.user_email;
        const current = resourceMap.get(userName) || { name: userName, utilization: 0, count: 0 };
        current.utilization += parseFloat(alloc.availability_percentage?.toString() || '0');
        current.count += 1;
        resourceMap.set(userName, current);
      });

      const resources = Array.from(resourceMap.values()).map(r => ({
        name: r.name,
        utilization: Math.round(r.utilization / r.count)
      }));

      setResourceData(resources);
    } catch (error) {
      console.error("Error loading resource data:", error);
    }
  };

  const loadHealthData = async () => {
    try {
      let query = supabase
        .from("prj_project")
        .select("*")
        .eq("client_id", currentTenantId);

      if (selectedProject !== "all") {
        query = query.eq("id", selectedProject);
      }

      const { data: projectsData } = await query;

      const health = projectsData?.map(project => ({
        name: project.name,
        value: project.progress || 0,
        status: project.health_status || 'healthy'
      })) || [];

      setHealthData(health);
    } catch (error) {
      console.error("Error loading health data:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    await loadChartData();
    setIsRefreshing(false);
    toast.success("Dados atualizados!");
  };

  const handleSaveDashboard = async (dashboard: Partial<Dashboard>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("prj_dashboard_config")
        .insert([{
          name: dashboard.name || "Novo Dashboard",
          description: dashboard.description || "",
          is_default: dashboard.is_default || false,
          client_id: currentTenantId,
          user_email: userData.user?.email || "",
          widgets: selectedWidgets
        }])
        .select()
        .maybeSingle();

      if (error) throw error;

      setDashboards([...dashboards, data as Dashboard]);
      setCurrentDashboard(data as Dashboard);
      toast.success("Dashboard salvo!");
    } catch (error) {
      console.error("Error saving dashboard:", error);
      toast.error("Erro ao salvar dashboard");
    }
  };

  const handleLoadDashboard = (dashboard: Dashboard) => {
    setCurrentDashboard(dashboard);
    setSelectedWidgets(dashboard.widgets || ['burndown', 'velocity', 'resources', 'health']);
    toast.success(`Dashboard "${dashboard.name}" carregado!`);
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    try {
      const { error } = await supabase
        .from("prj_dashboard_config")
        .delete()
        .eq("id", dashboardId);

      if (error) throw error;

      setDashboards(dashboards.filter(d => d.id !== dashboardId));
      if (currentDashboard?.id === dashboardId) {
        setCurrentDashboard(null);
      }
      toast.success("Dashboard excluído!");
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      toast.error("Erro ao excluir dashboard");
    }
  };

  const handleAddWidget = (widgetType: string) => {
    if (!selectedWidgets.includes(widgetType)) {
      setSelectedWidgets([...selectedWidgets, widgetType]);
    }
  };

  const handleExport = () => {
    const data = {
      burndown: burndownData,
      velocity: velocityData,
      resources: resourceData,
      health: healthData,
      filters: {
        project: selectedProject,
        sprint: selectedSprint,
        dateRange
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  const filteredSprints = selectedProject === "all" 
    ? sprints 
    : sprints.filter(s => s.project_id === selectedProject);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Relatórios e Análises
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize métricas e indicadores do seu projeto
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Dashboard Builder */}
      <DashboardBuilder
        dashboards={dashboards}
        currentDashboard={currentDashboard}
        onSave={handleSaveDashboard}
        onLoad={handleLoadDashboard}
        onDelete={handleDeleteDashboard}
        onAddWidget={handleAddWidget}
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Projeto</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione um projeto" />
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
            </div>

            <div className="space-y-2">
              <Label>Sprint</Label>
              <Select 
                value={selectedSprint} 
                onValueChange={setSelectedSprint}
                disabled={selectedProject === "all"}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione um sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os sprints</SelectItem>
                  {filteredSprints.map(sprint => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Projetos Ativos</p>
                <p className="text-2xl font-bold text-foreground">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
              <Target className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sprints em Andamento</p>
                <p className="text-2xl font-bold text-foreground">
                  {sprints.filter(s => s.status === 'active').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Velocity Média</p>
                <p className="text-2xl font-bold text-foreground">
                  {velocityData.length > 0
                    ? Math.round(
                        velocityData.reduce((sum, v) => sum + v.completed, 0) / velocityData.length
                      )
                    : 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recursos Alocados</p>
                <p className="text-2xl font-bold text-foreground">
                  {resourceData.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {selectedWidgets.includes('burndown') && (
          <BurndownChart data={burndownData} title="Burndown Chart" />
        )}
        
        {selectedWidgets.includes('velocity') && (
          <VelocityChart data={velocityData} title="Velocity Chart" />
        )}
        
        {selectedWidgets.includes('resources') && (
          <ResourceUtilizationChart data={resourceData} title="Utilização de Recursos" />
        )}
        
        {selectedWidgets.includes('health') && (
          <ProjectHealthChart data={healthData} title="Saúde dos Projetos" />
        )}
      </div>

      {/* Detailed Reports Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="projects" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="projects">Projetos</TabsTrigger>
              <TabsTrigger value="sprints">Sprints</TabsTrigger>
              <TabsTrigger value="resources">Recursos</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-4">
              <div className="space-y-2">
                {projects.map(project => (
                  <div 
                    key={project.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold text-foreground">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Progresso: {project.progress || 0}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        project.health_status === 'healthy' ? 'default' :
                        project.health_status === 'at_risk' ? 'secondary' : 'destructive'
                      }>
                        {project.health_status === 'healthy' && '✓ Saudável'}
                        {project.health_status === 'at_risk' && '⚠ Em Risco'}
                        {project.health_status === 'critical' && '✕ Crítico'}
                      </Badge>
                      <Badge variant={project.status === 'active' ? 'default' : 'outline'}>
                        {project.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sprints" className="space-y-4">
              <div className="space-y-2">
                {sprints.map(sprint => (
                  <div 
                    key={sprint.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-card"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{sprint.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(sprint.start_date), 'dd/MM/yyyy')} - {format(new Date(sprint.end_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <Badge variant={sprint.status === 'active' ? 'default' : 'outline'}>
                      {sprint.status === 'active' ? 'Em Andamento' : 
                       sprint.status === 'completed' ? 'Concluído' : 'Planejado'}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <div className="space-y-2">
                {resourceData.map(resource => (
                  <div 
                    key={resource.name}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-card"
                  >
                    <p className="font-semibold text-foreground">{resource.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(resource.utilization, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {resource.utilization}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Taxa de Conclusão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">
                      {velocityData.length > 0
                        ? Math.round(
                            (velocityData.reduce((sum, v) => sum + v.completed, 0) /
                            velocityData.reduce((sum, v) => sum + v.planned, 0)) * 100
                          )
                        : 0}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Projetos no Prazo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">
                      {projects.length > 0
                        ? Math.round(
                            (projects.filter(p => p.health_status !== 'critical').length /
                            projects.length) * 100
                          )
                        : 0}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
