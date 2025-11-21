import { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTenantId } from "@/contexts/TenantContext";
import {
  Folder,
  CheckCircle,
  AlertTriangle,
  Plus,
  Target,
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  Activity,
  Zap,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { useContextSidebar } from "@/contexts/ContextSidebarContext";
import { StatCard } from "@/components/StatCard";
import { toast } from "sonner";
import VelocityChart from "@/components/reports/VelocityChart";
import ProjectHealthChart from "@/components/reports/ProjectHealthChart";

interface Project {
  id: string;
  name: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  color?: string;
  methodology?: 'agile' | 'waterfall' | 'hybrid';
  progress?: number;
  health_status?: 'healthy' | 'at_risk' | 'critical';
  client_id: string;
  created_at: string;
  start_date?: string;
  end_date?: string;
}

interface Task {
  id: string;
  title: string;
  assigned_to_email?: string;
  status: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  project_id?: string;
  client_id: string;
  story_points?: number;
}

interface Sprint {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  client_id: string;
}

interface User {
  email: string;
  role?: string;
  user_type?: string;
  full_name?: string;
}

interface Stats {
  activeProjects: number;
  completedProjects: number;
  myOpenTasks: number;
  overdueTasks: number;
  completionRate: number;
  avgVelocity: number;
  totalStoryPoints: number;
  activeSprints: number;
}

export default function Dashboard() {
  const { updateContext, clearContext } = useContextSidebar();
  const tenantId = useTenantId();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState(0);

  useEffect(() => {
    if (tenantId) {
      loadData();
    }
    
    return () => {
      clearContext();
    };
  }, [tenantId]);

  // Realtime subscriptions
  useEffect(() => {
    if (!tenantId) return;

    const tasksChannel = supabase
      .channel('dashboard-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prj_task',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          console.log('Task change detected:', payload);
          setRealtimeUpdates(prev => prev + 1);
          loadTasks();
          
          if (payload.eventType === 'INSERT') {
            toast.success('Nova tarefa criada!');
          } else if (payload.eventType === 'UPDATE') {
            toast.info('Tarefa atualizada');
          }
        }
      )
      .subscribe();

    const projectsChannel = supabase
      .channel('dashboard-projects')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prj_project',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          console.log('Project change detected:', payload);
          setRealtimeUpdates(prev => prev + 1);
          loadProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(projectsChannel);
    };
  }, [tenantId]);

  useEffect(() => {
    if (!isLoading && tenantId) {
      updateContextSidebar();
    }
  }, [projects.length, tasks.length, sprints.length, isLoading, currentUser?.email, tenantId]);

  const loadData = async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      await Promise.all([
        loadProjects(),
        loadTasks(),
        loadSprints()
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!tenantId) return;
    try {
      const allProjects = await base44.entities.Project.list("-created_at");
      const tenantProjects = allProjects.filter((p: any) => p.client_id === tenantId);
      setProjects(tenantProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Erro ao carregar projetos");
    }
  };

  const loadTasks = async () => {
    if (!tenantId) return;
    try {
      const allTasks = await base44.entities.Task.list("-created_at");
      const tenantTasks = allTasks.filter((t: any) => t.client_id === tenantId);
      setTasks(tenantTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Erro ao carregar tarefas");
    }
  };

  const loadSprints = async () => {
    if (!tenantId) return;
    try {
      const allSprints = await base44.entities.Sprint.list("-created_at");
      const tenantSprints = allSprints.filter((s: any) => s.client_id === tenantId);
      setSprints(tenantSprints);
    } catch (error) {
      console.error("Error loading sprints:", error);
      toast.error("Erro ao carregar sprints");
    }
  };

  const getStats = (): Stats => {
    const activeProjects = projects.filter(p => p.status === 'in_progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const myTasks = tasks.filter(t => t.assigned_to_email === currentUser?.email);
    const myOpenTasks = myTasks.filter(t => !['done', 'cancelled'].includes(t.status)).length;
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date || ['done', 'cancelled'].includes(t.status)) return false;
      return new Date(t.due_date) < new Date();
    }).length;

    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalStoryPoints = tasks
      .filter(t => t.story_points && t.status === 'done')
      .reduce((sum, t) => sum + (t.story_points || 0), 0);

    const activeSprints = sprints.filter(s => s.status === 'active').length;
    const avgVelocity = activeSprints > 0 ? Math.round(totalStoryPoints / activeSprints) : 0;

    return { 
      activeProjects, 
      completedProjects, 
      myOpenTasks, 
      overdueTasks,
      completionRate,
      avgVelocity,
      totalStoryPoints,
      activeSprints
    };
  };

  const getOverdueTasks = () => {
    return tasks
      .filter(t => {
        if (!t.due_date || ['done', 'cancelled'].includes(t.status)) return false;
        return new Date(t.due_date) < new Date();
      })
      .sort((a, b) => {
        const dateA = new Date(a.due_date!).getTime();
        const dateB = new Date(b.due_date!).getTime();
        return dateA - dateB;
      })
      .slice(0, 5);
  };

  const getUpcomingTasks = () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return tasks
      .filter(t => {
        if (!t.due_date || ['done', 'cancelled'].includes(t.status)) return false;
        const dueDate = new Date(t.due_date);
        return dueDate >= now && dueDate <= nextWeek;
      })
      .sort((a, b) => {
        const dateA = new Date(a.due_date!).getTime();
        const dateB = new Date(b.due_date!).getTime();
        return dateA - dateB;
      })
      .slice(0, 5);
  };

  const getProjectsByHealth = () => {
    const activeProjects = projects.filter(p => p.status === 'in_progress');
    return {
      healthy: activeProjects.filter(p => p.health_status === 'healthy').length,
      atRisk: activeProjects.filter(p => p.health_status === 'at_risk').length,
      critical: activeProjects.filter(p => p.health_status === 'critical').length
    };
  };

  const getVelocityData = () => {
    const recentSprints = sprints
      .filter(s => s.status === 'completed' || s.status === 'active')
      .slice(0, 6)
      .reverse();

    return recentSprints.map(sprint => {
      const sprintTasks = tasks.filter(t => t.project_id && t.story_points);
      const planned = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
      const completed = sprintTasks
        .filter(t => t.status === 'done')
        .reduce((sum, t) => sum + (t.story_points || 0), 0);

      return {
        sprint: sprint.name,
        planned,
        completed
      };
    });
  };

  const getHealthChartData = () => {
    const health = getProjectsByHealth();
    return [
      { name: 'healthy', value: health.healthy },
      { name: 'at_risk', value: health.atRisk },
      { name: 'critical', value: health.critical }
    ];
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthColor = (health?: string) => {
    switch (health) {
      case 'healthy': return 'text-green-500';
      case 'at_risk': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const updateContextSidebar = () => {
    const stats = getStats();

    updateContext({
      title: "Dashboard",
      stats: [
        {
          label: "Projetos Ativos",
          value: stats.activeProjects,
          icon: <Folder className="w-4 h-4 text-primary" />
        },
        {
          label: "Minhas Tarefas",
          value: stats.myOpenTasks,
          icon: <CheckCircle className="w-4 h-4 text-accent" />
        },
        {
          label: "Tarefas Atrasadas",
          value: stats.overdueTasks,
          icon: <AlertTriangle className="w-4 h-4 text-destructive" />
        },
        {
          label: "Taxa de Conclusão",
          value: `${stats.completionRate}%`,
          icon: <Target className="w-4 h-4 text-success" />
        }
      ],
      info: {
        title: "Bem-vindo ao Sprintix",
        items: [
          `${stats.activeProjects} projetos em andamento`,
          `${stats.myOpenTasks} tarefas atribuídas a você`,
          `Velocity média: ${stats.avgVelocity} pontos`
        ]
      },
      quickActions: [
        {
          label: "Novo Projeto",
          icon: <Plus className="w-4 h-4" />,
          href: createPageUrl("/projects/create")
        },
        {
          label: "Nova Tarefa",
          icon: <Plus className="w-4 h-4" />,
          href: createPageUrl("/tasks/create")
        },
        {
          label: "Ver Relatórios",
          icon: <BarChart3 className="w-4 h-4" />,
          href: createPageUrl("/reports")
        }
      ]
    });
  };

  const stats = getStats();
  const overdueTasks = getOverdueTasks();
  const upcomingTasks = getUpcomingTasks();
  const projectHealth = getProjectsByHealth();
  const activeProjectsList = projects.filter(p => p.status === 'in_progress').slice(0, 6);
  const velocityData = getVelocityData();
  const healthChartData = getHealthChartData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo de volta, {currentUser?.full_name || currentUser?.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {realtimeUpdates > 0 && (
            <Badge variant="outline" className="gap-1">
              <Activity className="w-3 h-3 animate-pulse" />
              Atualização em tempo real
            </Badge>
          )}
          <Link to={createPageUrl("/projects/create")}>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Projeto
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Projetos Ativos"
          value={stats.activeProjects}
          icon={Folder}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Minhas Tarefas"
          value={stats.myOpenTasks}
          icon={CheckCircle}
        />
        <StatCard
          title="Taxa de Conclusão"
          value={`${stats.completionRate}%`}
          icon={Target}
          trend={{ value: stats.completionRate - 75, isPositive: stats.completionRate >= 75 }}
        />
        <StatCard
          title="Velocity Média"
          value={stats.avgVelocity}
          icon={Zap}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Alerts Section */}
      {overdueTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                Alertas Importantes ({overdueTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-1 h-8 ${getPriorityColor(task.priority)} rounded`} />
                      <div>
                        <p className="font-medium text-foreground">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Atrasada desde {new Date(task.due_date!).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="destructive">Atrasada</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Velocity dos Sprints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VelocityChart data={velocityData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Saúde dos Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectHealthChart data={healthChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Projects and Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Projetos Ativos ({activeProjectsList.length})
              </CardTitle>
              <Link to={createPageUrl("/projects")}>
                <Button variant="ghost" size="sm">Ver Todos</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeProjectsList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum projeto ativo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeProjectsList.map((project) => (
                  <Link key={project.id} to={createPageUrl(`/projects/${project.id}`)}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color || '#3b82f6' }}
                          />
                          <h4 className="font-medium text-foreground">{project.name}</h4>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={getHealthColor(project.health_status)}
                        >
                          {project.health_status || 'healthy'}
                        </Badge>
                      </div>
                      <Progress value={project.progress || 0} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {project.progress || 0}% concluído
                      </p>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Próximas Tarefas ({upcomingTasks.length})
              </CardTitle>
              <Link to={createPageUrl("/tasks")}>
                <Button variant="ghost" size="sm">Ver Todas</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma tarefa próxima</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-1 h-8 ${getPriorityColor(task.priority)} rounded`} />
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(task.due_date!).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {task.priority || 'medium'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Estatísticas Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{projectHealth.healthy}</div>
              <p className="text-sm text-muted-foreground mt-1">Projetos Saudáveis</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500">{projectHealth.atRisk}</div>
              <p className="text-sm text-muted-foreground mt-1">Em Risco</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{projectHealth.critical}</div>
              <p className="text-sm text-muted-foreground mt-1">Críticos</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.totalStoryPoints}</div>
              <p className="text-sm text-muted-foreground mt-1">Story Points Concluídos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
