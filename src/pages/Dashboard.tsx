import { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTenantId } from "@/contexts/TenantContext";
import {
  Folder,
  CheckCircle,
  AlertTriangle,
  Target,
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  Activity,
  Zap,
  AlertCircle,
  Sparkles,
  Send,
  ArrowRight,
  Users,
  Trophy,
  Rocket,
  Star,
  ListTodo,
  Brain,
  Flame
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  useEffect(() => {
    if (tenantId) {
      loadData();
    }

    return () => {
      clearContext();
    };
  }, [tenantId]);

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

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiProcessing(true);

    setTimeout(() => {
      toast.success("Processando sua solicitação com IA...", {
        description: "Em breve você receberá insights personalizados"
      });
      setAiPrompt("");
      setIsAiProcessing(false);
    }, 1500);
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
          icon: <Rocket className="w-4 h-4" />,
          href: createPageUrl("/projects/create")
        },
        {
          label: "Nova Tarefa",
          icon: <ListTodo className="w-4 h-4" />,
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        />
        <p className="mt-4 text-muted-foreground">Carregando seu workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Section with AI Prompt */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl" />
          <Card className="relative border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-xl">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Rocket className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                      Bem-vindo, {currentUser?.full_name || 'Usuário'}
                    </h1>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Como posso ajudar você a gerenciar seus projetos hoje?
                  </p>
                </div>
                {realtimeUpdates > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Badge variant="outline" className="gap-2 bg-green-500/10 border-green-500/30">
                      <Flame className="w-3 h-3 text-green-500 animate-pulse" />
                      <span className="text-green-700">Live</span>
                    </Badge>
                  </motion.div>
                )}
              </div>

              <form onSubmit={handleAiSubmit} className="relative">
                <div className="relative">
                  <Brain className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <Input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Pergunte qualquer coisa sobre seus projetos, tarefas ou sprints..."
                    className="pl-12 pr-12 h-14 text-lg bg-background/50 backdrop-blur-sm border-2 border-primary/20 focus:border-primary/50 rounded-xl"
                    disabled={isAiProcessing}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
                    disabled={isAiProcessing || !aiPrompt.trim()}
                  >
                    {isAiProcessing ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Experimente: "Mostre tarefas atrasadas" ou "Crie um novo projeto de vendas"
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="relative overflow-hidden border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent" />
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Projetos Ativos</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-bold text-foreground">{stats.activeProjects}</p>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-700">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +12%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Folder className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="relative overflow-hidden border-2 border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-500/5">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent" />
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Minhas Tarefas</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-bold text-foreground">{stats.myOpenTasks}</p>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                        <ListTodo className="w-3 h-3 mr-1" />
                        Abertas
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="relative overflow-hidden border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent" />
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-bold text-foreground">{stats.completionRate}%</p>
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-700">
                        <Target className="w-3 h-3 mr-1" />
                        Meta
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="relative overflow-hidden border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent" />
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Velocity Média</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-bold text-foreground">{stats.avgVelocity}</p>
                      <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">
                        <Zap className="w-3 h-3 mr-1" />
                        Pontos
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Alerts Section */}
        <AnimatePresence>
          {overdueTasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-2 border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    Atenção: {overdueTasks.length} Tarefas Atrasadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {overdueTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-12 ${getPriorityColor(task.priority)} rounded-full`} />
                          <div>
                            <p className="font-medium text-foreground">{task.title}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Atrasada desde {new Date(task.due_date!).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Urgente
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Charts Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <Card className="border-2 border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Velocity dos Sprints
              </CardTitle>
            </CardHeader>
            <CardContent>
              {velocityData.length > 0 ? (
                <VelocityChart data={velocityData} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BarChart3 className="w-16 h-16 opacity-20 mb-4" />
                  <p>Nenhum dado de velocity disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Saúde dos Projetos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthChartData.some(d => d.value > 0) ? (
                <ProjectHealthChart data={healthChartData} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Activity className="w-16 h-16 opacity-20 mb-4" />
                  <p>Nenhum projeto ativo para análise</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Projects and Tasks Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <Card className="border-2 border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-primary" />
                  Projetos Ativos
                </CardTitle>
                <Link to={createPageUrl("/projects")}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    Ver Todos
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {activeProjectsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Folder className="w-16 h-16 opacity-20 mb-4" />
                  <p className="mb-4">Nenhum projeto ativo</p>
                  <Link to={createPageUrl("/projects/create")}>
                    <Button variant="outline" className="gap-2">
                      <Rocket className="w-4 h-4" />
                      Criar Projeto
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeProjectsList.map((project, index) => (
                    <Link key={project.id} to={createPageUrl(`/projects/${project.id}`)}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="p-4 border-2 border-border rounded-xl hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full ring-2 ring-offset-2 ring-offset-background"
                              style={{ backgroundColor: project.color || '#3b82f6' }}
                            />
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {project.name}
                            </h4>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${getHealthColor(project.health_status)} border-current`}
                          >
                            {project.health_status || 'healthy'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <Progress value={project.progress || 0} className="h-2" />
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {project.progress || 0}% concluído
                            </p>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Próximas Tarefas
                </CardTitle>
                <Link to={createPageUrl("/tasks")}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    Ver Todas
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle className="w-16 h-16 opacity-20 mb-4" />
                  <p className="mb-4">Nenhuma tarefa próxima</p>
                  <Link to={createPageUrl("/tasks/create")}>
                    <Button variant="outline" className="gap-2">
                      <ListTodo className="w-4 h-4" />
                      Criar Tarefa
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex items-center justify-between p-3 border-2 border-border rounded-xl hover:border-primary/50 hover:bg-accent/50 transition-all group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-1.5 h-10 ${getPriorityColor(task.priority)} rounded-full`} />
                        <div className="flex-1">
                          <p className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(task.due_date!).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {task.priority || 'medium'}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-2 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="text-4xl font-bold text-green-600 mb-2">{projectHealth.healthy}</div>
                  <p className="text-sm text-muted-foreground">Projetos Saudáveis</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="text-4xl font-bold text-yellow-600 mb-2">{projectHealth.atRisk}</div>
                  <p className="text-sm text-muted-foreground">Em Risco</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="text-4xl font-bold text-red-600 mb-2">{projectHealth.critical}</div>
                  <p className="text-sm text-muted-foreground">Críticos</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="text-4xl font-bold text-primary mb-2">{stats.totalStoryPoints}</div>
                  <p className="text-sm text-muted-foreground">Story Points</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
