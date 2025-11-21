import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { Users, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface ProductivityMetrics {
  member_id: string;
  member_name: string;
  tasks_completed: number;
  story_points: number;
  hours_logged: number;
  productivity_score: number;
}

interface BurnoutMetrics {
  member_id: string;
  member_name: string;
  weekly_hours: number;
  overtime_hours: number;
  task_load: number;
  burnout_risk: "low" | "medium" | "high";
  risk_score: number;
}

interface AllocationMetrics {
  member_id: string;
  member_name: string;
  allocated_hours: number;
  available_hours: number;
  utilization_rate: number;
  active_projects: number;
}

export default function TeamMetrics() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [productivityData, setProductivityData] = useState<ProductivityMetrics[]>([]);
  const [burnoutData, setBurnoutData] = useState<BurnoutMetrics[]>([]);
  const [allocationData, setAllocationData] = useState<AllocationMetrics[]>([]);

  useEffect(() => {
    loadMetrics();
  }, [selectedPeriod, user]);

  const loadMetrics = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const daysAgo = parseInt(selectedPeriod);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get current tenant ID
      const currentTenantId = localStorage.getItem('currentTenantId');
      
      if (!currentTenantId) {
        setIsLoading(false);
        return;
      }

      // Load team members from gmd_user table
      const { data: members } = await supabase
        .from("gmd_user")
        .select("id, full_name, email, avatar_url")
        .eq("client_id", currentTenantId)
        .eq("active", true);

      setTeamMembers(members || []);

      // Load productivity metrics
      await loadProductivityMetrics(members || [], startDate);

      // Load burnout metrics
      await loadBurnoutMetrics(members || [], startDate);

      // Load allocation metrics
      await loadAllocationMetrics(members || []);
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductivityMetrics = async (members: TeamMember[], startDate: Date) => {
    const metrics: ProductivityMetrics[] = [];

    for (const member of members) {
      try {
        // Create untyped query to avoid deep type instantiation
        const client = supabase as any;
        const tasksResult = await client.from("prj_task").select("id, title, updated_at").eq("assigned_to", member.id).eq("status", "done");
        const tasks = tasksResult.data || [];

        // Filter by date in JS
        const recentTasks = (tasks || []).filter((t: any) => 
          new Date(t.updated_at) >= startDate
        );

        // Create untyped query to avoid deep type instantiation
        const logsResult = await client.from("prj_time_log").select("hours, created_at").eq("user_id", member.id);
        const timeLogs = logsResult.data || [];

        // Filter by date in JS
        const recentLogs = (timeLogs || []).filter((l: any) => 
          new Date(l.created_at) >= startDate
        );

        const tasksCompleted = recentTasks.length;
        const storyPoints = tasksCompleted * 3; // Estimate: 3 points per task
        const hoursLogged = recentLogs.reduce((sum: number, t: any) => sum + (t.hours || 0), 0);

      // Calculate productivity score (story points per hour, normalized)
      const productivityScore = hoursLogged > 0 ? Math.round((storyPoints / hoursLogged) * 10) : 0;

        metrics.push({
          member_id: member.id,
          member_name: member.full_name || member.email,
          tasks_completed: tasksCompleted,
          story_points: storyPoints,
          hours_logged: hoursLogged,
          productivity_score: productivityScore,
        });
      } catch (error) {
        console.error(`Error loading metrics for ${member.id}:`, error);
      }
    }

    setProductivityData(metrics);
  };

  const loadBurnoutMetrics = async (members: TeamMember[], startDate: Date) => {
    const metrics: BurnoutMetrics[] = [];

    for (const member of members) {
      try {
        // Create untyped query to avoid deep type instantiation
        const client = supabase as any;
        const logsResult = await client.from("prj_time_log").select("hours, created_at").eq("user_id", member.id);
        const timeLogs = logsResult.data || [];

        // Filter by date in JS
        const recentLogs = (timeLogs || []).filter((l: any) => 
          new Date(l.created_at) >= startDate
        );

        // Get active tasks
        const tasksResult = await client.from("prj_task").select("id").eq("assigned_to", member.id).in("status", ["todo", "in_progress"]);
        const activeTasks = tasksResult.data || [];

        const weeklyHours = recentLogs.reduce((sum: number, t: any) => sum + (t.hours || 0), 0);
        const overtimeHours = Math.max(0, weeklyHours - 40);
        const taskLoad = activeTasks?.length || 0;

      // Calculate burnout risk score
      let riskScore = 0;
      if (weeklyHours > 50) riskScore += 40;
      else if (weeklyHours > 45) riskScore += 25;
      else if (weeklyHours > 40) riskScore += 10;

      if (taskLoad > 10) riskScore += 30;
      else if (taskLoad > 7) riskScore += 15;

      if (overtimeHours > 10) riskScore += 30;
      else if (overtimeHours > 5) riskScore += 15;

      let burnoutRisk: "low" | "medium" | "high" = "low";
      if (riskScore >= 60) burnoutRisk = "high";
      else if (riskScore >= 30) burnoutRisk = "medium";

        metrics.push({
          member_id: member.id,
          member_name: member.full_name || member.email,
          weekly_hours: weeklyHours,
          overtime_hours: overtimeHours,
          task_load: taskLoad,
          burnout_risk: burnoutRisk,
          risk_score: riskScore,
        });
      } catch (error) {
        console.error(`Error loading burnout metrics for ${member.id}:`, error);
      }
    }

    setBurnoutData(metrics);
  };

  const loadAllocationMetrics = async (members: TeamMember[]) => {
    const metrics: AllocationMetrics[] = [];

    for (const member of members) {
      try {
        // Create untyped query to avoid deep type instantiation
        const client = supabase as any;
        const assignmentsResult = await client.from("prj_task").select("id, story_id").eq("assigned_to", member.id).in("status", ["todo", "in_progress"]);
        const assignments = assignmentsResult.data || [];

        // Count unique stories as projects proxy
        const activeProjects = new Set(assignments?.map((a: any) => a.story_id).filter(Boolean)).size || 1;
        const allocatedHours = (assignments?.length || 0) * 8; // Estimate: 8h per task
        const availableHours = 40; // Standard work week

        const utilizationRate = (allocatedHours / availableHours) * 100;

        metrics.push({
          member_id: member.id,
          member_name: member.full_name || member.email,
          allocated_hours: allocatedHours,
          available_hours: availableHours,
          utilization_rate: Math.min(utilizationRate, 150), // Cap at 150%
          active_projects: activeProjects,
        });
      } catch (error) {
        console.error(`Error loading allocation metrics for ${member.id}:`, error);
      }
    }

    setAllocationData(metrics);
  };

  const averageProductivity = productivityData.length > 0
    ? Math.round(productivityData.reduce((sum, m) => sum + m.productivity_score, 0) / productivityData.length)
    : 0;

  const highBurnoutCount = burnoutData.filter((m) => m.burnout_risk === "high").length;

  const averageUtilization = allocationData.length > 0
    ? Math.round(allocationData.reduce((sum, m) => sum + m.utilization_rate, 0) / allocationData.length)
    : 0;

  const totalHoursLogged = productivityData.reduce((sum, m) => sum + m.hours_logged, 0);

  const getBurnoutColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "hsl(var(--destructive))";
      case "medium":
        return "hsl(var(--warning))";
      default:
        return "hsl(var(--success))";
    }
  };

  const getBurnoutBadgeVariant = (risk: string): "default" | "secondary" | "destructive" => {
    switch (risk) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Métricas de Equipe</h1>
            <p className="text-muted-foreground mt-1">
              Monitoramento de produtividade, burnout e alocação
            </p>
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Produtividade Média"
            value={averageProductivity}
            icon={TrendingUp}
          />
          <StatCard
            title="Membros em Risco"
            value={highBurnoutCount}
            icon={AlertTriangle}
            className="border-destructive/50"
          />
          <StatCard
            title="Utilização Média"
            value={`${averageUtilization}%`}
            icon={BarChart3}
          />
          <StatCard
            title="Horas Registradas"
            value={totalHoursLogged}
            icon={Users}
          />
        </div>

        {/* Productivity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Produtividade por Membro</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="member_name" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="tasks_completed" fill="hsl(var(--primary))" name="Tarefas Completas" />
                <Bar dataKey="story_points" fill="hsl(var(--accent))" name="Story Points" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Burnout Risk */}
        <Card>
          <CardHeader>
            <CardTitle>Análise de Burnout Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {burnoutData.map((member) => (
                <div
                  key={member.member_id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{member.member_name}</p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Horas: {member.weekly_hours}h</span>
                      <span>Overtime: {member.overtime_hours}h</span>
                      <span>Tarefas: {member.task_load}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Score</div>
                      <div className="text-lg font-bold">{member.risk_score}</div>
                    </div>
                    <Badge variant={getBurnoutBadgeVariant(member.burnout_risk)}>
                      {member.burnout_risk.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Allocation Efficiency */}
        <Card>
          <CardHeader>
            <CardTitle>Eficiência de Alocação</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={allocationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="member_name" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="utilization_rate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Taxa de Utilização (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Allocation Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes de Alocação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allocationData.map((member) => (
                <div
                  key={member.member_id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{member.member_name}</p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Projetos: {member.active_projects}</span>
                      <span>Alocado: {member.allocated_hours}h</span>
                      <span>Disponível: {member.available_hours}h</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Utilização</div>
                    <div className="text-2xl font-bold">
                      {member.utilization_rate.toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
