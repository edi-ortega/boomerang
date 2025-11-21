import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Plus, Check, X, Filter, Calendar, Edit, Trash2, Download, BarChart3, User } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import { useContextSidebar } from "@/contexts/ContextSidebarContext";
import TimeLogModal from "@/components/TimeLogModal";
import TimesheetAnalytics from "@/components/timesheet/TimesheetAnalytics";
import { format } from "date-fns";
import { sendMentionNotifications } from "@/lib/mention-helper";
import { getUserTimesheetPermissions, canApproveTimeLog, canEditTimeLog, TimesheetPermissions } from "@/lib/timesheet-permissions";

interface TimeLog {
  id: string;
  task_id: string;
  task_title: string;
  project_id: string;
  project_name: string;
  user_id?: string;
  user_email: string;
  user_name: string;
  user_avatar_url?: string;
  hours: number;
  date: string;
  description: string;
  is_billable: boolean;
  is_approved: boolean;
  is_rejected: boolean;
  approved_by?: string;
  approved_by_email?: string;
  rejected_by?: string;
  rejected_by_email?: string;
  rejection_reason?: string;
  log_type?: string;
}

interface Project {
  id: string;
  name: string;
}

interface User {
  user_id: string;
  name: string;
  email: string;
}

export default function Timesheet() {
  const navigate = useNavigate();
  const { currentTenantId } = useTenant();
  const { updateContext, clearContext } = useContextSidebar();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<TimeLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Permissions
  const [permissions, setPermissions] = useState<TimesheetPermissions>({
    canViewAll: false,
    canApprove: false,
    canEditAll: false,
    canEditOwn: true,
    isReadOnly: false,
    profile: "Usuário",
  });
  const canViewAll = permissions.canViewAll;
  const canApprove = permissions.canApprove;
  const canEditAll = permissions.canEditAll;
  
  // Modals
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
  const [viewingLog, setViewingLog] = useState<TimeLog | null>(null);
  const [rejectingLogId, setRejectingLogId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showManualLogModal, setShowManualLogModal] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUser, setFilterUser] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    loadData();
    return () => clearContext();
  }, [currentTenantId]);

  useEffect(() => {
    applyFilters();
  }, [timeLogs, searchTerm, filterUser, filterProject, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (!loading && filteredLogs.length > 0) {
      updateContextSidebar();
    }
  }, [filteredLogs, loading]);

  useEffect(() => {
    if (canApprove && timeLogs.length > 0) {
      checkPendingTimesheets();
    }
  }, [canApprove, timeLogs]);

  const refreshTimeLogs = async () => {
    try {
      if (!currentUser || !currentTenantId || currentTenantId === "null") return;
      
      // Recarregar os time logs
      let logsQuery = supabase
        .from("prj_time_log")
        .select("*")
        .eq("client_id", currentTenantId);

      if (!permissions.canViewAll) {
        logsQuery = logsQuery.eq("user_email", currentUser.email);
      }

      const { data: logsData, error: logsError } = await logsQuery.order("date", { ascending: false });
      if (logsError) throw logsError;
      
      // Buscar avatares dos usuários
      if (logsData && logsData.length > 0) {
        const userEmails = [...new Set(logsData.map((log: any) => log.user_email))];
        const { data: usersData } = await supabase
          .from("bmr_user")
          .select("email, avatar_url")
          .in("email", userEmails);
        
        const avatarMap = new Map(usersData?.map(u => [u.email, u.avatar_url]) || []);
        
        const mappedLogs = logsData.map((log: any) => ({
          ...log,
          user_avatar_url: avatarMap.get(log.user_email) || null
        }));
        
        setTimeLogs(mappedLogs);
      } else {
        setTimeLogs([]);
      }
    } catch (error) {
      console.error("Error refreshing time logs:", error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Validar tenant ID
      if (!currentTenantId || currentTenantId === "null") {
        toast.error("Tenant não selecionado");
        setLoading(false);
        return;
      }
      
      // Get current user from BMR session
      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) {
        toast.error("Usuário não autenticado");
        navigate("/auth");
        return;
      }
      
      const parsedSession = JSON.parse(storedSession);
      const user = parsedSession.user;
      if (!user) {
        toast.error("Usuário não autenticado");
        navigate("/auth");
        return;
      }
      setCurrentUser(user);

      // Check permissions using bmr_user_system_access
      const userPermissions = await getUserTimesheetPermissions(user.user_id);
      setPermissions(userPermissions);

      // Load time logs e buscar avatares dos usuários
      let logsQuery = supabase
        .from("prj_time_log")
        .select("*")
        .eq("client_id", currentTenantId);

      // Se não pode ver tudo, filtra apenas seus logs
      if (!userPermissions.canViewAll) {
        logsQuery = logsQuery.eq("user_email", user.email);
      }

      const { data: logsData, error: logsError } = await logsQuery.order("date", { ascending: false });
      if (logsError) throw logsError;
      
      // Buscar avatares dos usuários
      if (logsData && logsData.length > 0) {
        const userEmails = [...new Set(logsData.map((log: any) => log.user_email))];
        const { data: usersData } = await supabase
          .from("bmr_user")
          .select("email, avatar_url")
          .in("email", userEmails);
        
        const avatarMap = new Map(usersData?.map(u => [u.email, u.avatar_url]) || []);
        
        const mappedLogs = logsData.map((log: any) => ({
          ...log,
          user_avatar_url: avatarMap.get(log.user_email) || null
        }));
        
        setTimeLogs(mappedLogs);
      } else {
        setTimeLogs([]);
      }

      // Load projects
      const { data: projectsData } = await supabase
        .from("prj_project")
        .select("id, name")
        .eq("client_id", currentTenantId)
        .order("name");
      setProjects(projectsData || []);

      // Load users
      const { data: userClientsData } = await supabase
        .from("bmr_user_clients")
        .select(`
          user_id,
          bmr_user!inner (
            user_id,
            name,
            email,
            avatar_url
          )
        `)
        .eq("client_id", currentTenantId);
      
      const usersData = userClientsData?.map((uc: any) => ({
        user_id: uc.bmr_user.user_id,
        name: uc.bmr_user.name,
        email: uc.bmr_user.email,
        avatar_url: uc.bmr_user.avatar_url
      })) || [];
      setUsers(usersData);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...timeLogs];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.task_title?.toLowerCase().includes(search) ||
          log.project_name?.toLowerCase().includes(search) ||
          log.user_name?.toLowerCase().includes(search) ||
          log.description?.toLowerCase().includes(search)
      );
    }

    // User filter
    if (filterUser !== "all") {
      filtered = filtered.filter((log) => log.user_email === filterUser);
    }

    // Project filter
    if (filterProject !== "all") {
      filtered = filtered.filter((log) => log.project_id === filterProject);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((log) => {
        if (statusFilter === "pending") return !log.is_approved && !log.is_rejected;
        if (statusFilter === "approved") return log.is_approved;
        if (statusFilter === "rejected") return log.is_rejected;
        return true;
      });
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((log) => log.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((log) => log.date <= dateTo);
    }

    setFilteredLogs(filtered);
  };

  const updateContextSidebar = () => {
    const totalHours = filteredLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
    const billableHours = filteredLogs.filter(log => log.is_billable).reduce((sum, log) => sum + (log.hours || 0), 0);
    const approvedHours = filteredLogs.filter(log => log.is_approved).reduce((sum, log) => sum + (log.hours || 0), 0);
    const pendingApproval = filteredLogs.filter(log => !log.is_approved && !log.is_rejected).length;
    const rejectedCount = filteredLogs.filter(log => log.is_rejected).length;

    updateContext({
      title: "Timesheet",
      stats: [
        {
          label: "Total de Horas",
          value: `${totalHours.toFixed(2)}h`,
          icon: <Clock className="w-4 h-4 text-blue-500" />,
          badge: filteredLogs.length > 0 ? `${filteredLogs.length} registros` : null,
          badgeColor: "bg-blue-500/20 text-blue-600"
        },
        {
          label: "Horas Faturáveis",
          value: `${billableHours.toFixed(2)}h`,
          icon: <BarChart3 className="w-4 h-4 text-green-500" />,
          badge: totalHours > 0 ? `${((billableHours/totalHours)*100).toFixed(0)}%` : null,
          badgeColor: "bg-green-500/20 text-green-600"
        },
        {
          label: "Horas Aprovadas",
          value: `${approvedHours.toFixed(2)}h`,
          icon: <Check className="w-4 h-4 text-purple-500" />,
          badge: totalHours > 0 ? `${((approvedHours/totalHours)*100).toFixed(0)}%` : null,
          badgeColor: "bg-purple-500/20 text-purple-600"
        },
        {
          label: "Pendente Aprovação",
          value: pendingApproval,
          icon: <Calendar className="w-4 h-4 text-yellow-500" />,
          badge: pendingApproval > 0 ? "Ação necessária" : "Tudo ok",
          badgeColor: pendingApproval > 0 ? "bg-yellow-500/20 text-yellow-600" : "bg-green-500/20 text-green-600"
        },
        ...(rejectedCount > 0 ? [{
          label: "Rejeitados",
          value: rejectedCount,
          icon: <X className="w-4 h-4 text-red-500" />,
          badge: "Atenção",
          badgeColor: "bg-red-500/20 text-red-600"
        }] : [])
      ],
      info: {
        title: "Gestão de Tempo",
        description: canViewAll 
          ? "Você pode visualizar e gerenciar todos os registros de tempo da equipe."
          : "Registre suas horas trabalhadas e acompanhe a aprovação."
      },
      tips: [
        "Registre suas horas diariamente para maior precisão",
        "Adicione descrições detalhadas ao registrar tempo",
        "Use os filtros para encontrar registros específicos",
        canApprove ? "Aprove registros pendentes regularmente" : "Aguarde aprovação de seus registros",
        "Exporte relatórios em CSV para análise externa"
      ],
      actions: [
        {
          label: "Registrar Tempo",
          icon: <Plus className="w-4 h-4" />,
          onClick: () => setShowManualLogModal(true)
        },
        {
          label: "Exportar CSV",
          icon: <Download className="w-4 h-4" />,
          onClick: exportToCSV
        },
        ...(canApprove && pendingApproval > 0 ? [{
          label: `Aprovar Pendentes (${pendingApproval})`,
          icon: <Check className="w-4 h-4" />,
          onClick: () => {
            const table = document.querySelector('table');
            if (table) table.scrollIntoView({ behavior: 'smooth' });
          }
        }] : [])
      ]
    });
  };

  const checkPendingTimesheets = () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const oldPending = timeLogs.filter(
      log => !log.is_approved && !log.is_rejected && new Date(log.date) < twoDaysAgo
    );

    if (oldPending.length > 0) {
      toast.warning(`${oldPending.length} timesheets pendentes há mais de 48h`, {
        duration: 5000
      });
    }
  };

  const handleApprove = async (logId: string) => {
    try {
      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) {
        toast.error("Usuário não autenticado");
        return;
      }
      
      const parsedSession = JSON.parse(storedSession);
      const user = parsedSession.user;
      
      const { error } = await supabase
        .from("prj_time_log")
        .update({
          is_approved: true,
          is_rejected: false,
          approved_by_email: user.email,
          rejection_reason: null
        })
        .eq("id", logId);

      if (error) throw error;

      // Atualizar apenas o registro específico no estado
      setTimeLogs(prev => prev.map(log => 
        log.id === logId 
          ? { ...log, is_approved: true, is_rejected: false, approved_by_email: user.email, rejection_reason: null }
          : log
      ));

      toast.success("Timesheet aprovado com sucesso");
    } catch (error) {
      console.error("Error approving time log:", error);
      toast.error("Erro ao aprovar timesheet");
    }
  };

  const handleReject = (logId: string) => {
    setRejectingLogId(logId);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }

    try {
      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) {
        toast.error("Usuário não autenticado");
        return;
      }
      
      const parsedSession = JSON.parse(storedSession);
      const user = parsedSession.user;

      const { error } = await supabase
        .from("prj_time_log")
        .update({
          is_rejected: true,
          is_approved: false,
          rejected_by_email: user.email,
          rejection_reason: rejectionReason
        })
        .eq("id", rejectingLogId);

      if (error) throw error;

      // Atualizar apenas o registro específico no estado
      setTimeLogs(prev => prev.map(log => 
        log.id === rejectingLogId 
          ? { 
              ...log, 
              is_rejected: true, 
              rejected_by: user.user_id, 
              rejected_by_email: user.email,
              rejection_reason: rejectionReason 
            }
          : log
      ));

      toast.success("Timesheet rejeitado");
      setShowRejectModal(false);
      setRejectingLogId(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting time log:", error);
      toast.error("Erro ao rejeitar timesheet");
    }
  };

  const handleEdit = (log: TimeLog) => {
    setEditingLog(log);
    setSelectedTaskId(log.task_id);
    setShowTimeLogModal(true);
  };

  const handleDelete = async (logId: string) => {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;

    try {
      const { error } = await supabase
        .from("prj_time_log")
        .delete()
        .eq("id", logId);

      if (error) throw error;

      // Remover o registro do estado
      setTimeLogs(prev => prev.filter(log => log.id !== logId));

      toast.success("Registro excluído com sucesso");
    } catch (error) {
      console.error("Error deleting time log:", error);
      toast.error("Erro ao excluir registro");
    }
  };

  const exportToCSV = () => {
    const headers = ["Data", "Projeto", "Tarefa", "Usuário", "Horas", "Status", "Descrição"];
    const rows = filteredLogs.map(log => [
      format(new Date(log.date), "dd/MM/yyyy"),
      log.project_name,
      log.task_title,
      log.user_name,
      log.hours.toString(),
      log.is_approved ? "Aprovado" : log.is_rejected ? "Rejeitado" : "Pendente",
      log.description || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `timesheet_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Relatório exportado com sucesso");
  };

  const getStatusBadge = (log: TimeLog) => {
    if (log.is_approved) {
      return <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">✓ Aprovado</Badge>;
    }
    if (log.is_rejected) {
      return <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0">✗ Rejeitado</Badge>;
    }
    return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">⏳ Pendente</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando timesheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Timesheet</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Gerencie e aprove registros de tempo</p>
            <Badge variant="outline" className="text-xs">
              {permissions.profile}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/backlog")} variant="outline">
            <Clock className="w-4 h-4 mr-2" />
            Ir para Backlog
          </Button>
          {!permissions.isReadOnly && (
            <Button onClick={() => setShowManualLogModal(true)} className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Registro
            </Button>
          )}
        </div>
      </div>


      {/* Tabs */}
      <Tabs defaultValue="records" className="w-full">
        <TabsList>
          <TabsTrigger value="records">Registros</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background"
                />

                {canViewAll && (
                  <Select value={filterUser} onValueChange={setFilterUser}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuários</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.user_id} value={user.email}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Projeto" />
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
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="Data inicial"
                  className="bg-background"
                />

                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="Data final"
                  className="bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Tarefa</TableHead>
                    {canViewAll && <TableHead>Usuário</TableHead>}
                    <TableHead>Horas</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canViewAll ? 9 : 8} className="text-center py-8 text-muted-foreground">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => {
                        setViewingLog(log);
                        setShowViewModal(true);
                      }}>
                        <TableCell className="font-medium">{format(new Date(log.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-foreground border-blue-500/20">
                            {log.project_name || "Sem projeto"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-foreground border-purple-500/20">
                            {log.task_title || "Sem tarefa"}
                          </Badge>
                        </TableCell>
                        {canViewAll && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={log.user_avatar_url || undefined} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {log.user_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{log.user_name}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {Number(log.hours).toFixed(2)}h
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.log_type === 'manual' ? 'secondary' : 'default'} className="text-xs">
                            {log.log_type === 'manual' ? '✍️ Manual' : '⏱️ Tracker'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(log)}</TableCell>
                        <TableCell className="max-w-xs">
                          <span className="text-sm text-muted-foreground truncate block">
                            {log.description || "Sem descrição"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {canApproveTimeLog(log, currentUser?.email || "", permissions) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleApprove(log.id)}
                                  title="Aprovar"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleReject(log.id)}
                                  title="Rejeitar"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {canEditTimeLog(log, currentUser?.email || "", permissions) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(log)}
                                  title="Editar"
                                  className="hover:bg-accent"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(log.id)}
                                  title="Excluir"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <TimesheetAnalytics timeLogs={filteredLogs} />
        </TabsContent>
      </Tabs>

      {/* Time Log Modal */}
      {showTimeLogModal && (
        <TimeLogModal
          taskId={selectedTaskId}
          existingLog={editingLog}
          users={users}
          onClose={() => {
            setShowTimeLogModal(false);
            setEditingLog(null);
          }}
          onSave={() => {
            refreshTimeLogs();
            setEditingLog(null);
          }}
        />
      )}

      {/* Manual Log Modal */}
      <Dialog open={showManualLogModal} onOpenChange={setShowManualLogModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Registro Manual de Tempo</DialogTitle>
          </DialogHeader>
          <ManualTimeLogForm
            onClose={() => setShowManualLogModal(false)}
            onSave={() => {
              setShowManualLogModal(false);
              refreshTimeLogs();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* View Log Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro de Tempo</DialogTitle>
          </DialogHeader>
          {viewingLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data</label>
                  <p className="text-lg">{format(new Date(viewingLog.date), "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Horas</label>
                  <p className="text-lg font-bold">{Number(viewingLog.hours).toFixed(2)}h</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Projeto</label>
                  <p className="text-lg">{viewingLog.project_name || "Sem projeto"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tarefa</label>
                  <p className="text-lg">{viewingLog.task_title || "Sem tarefa"}</p>
                </div>
                {canViewAll && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Usuário</label>
                    <p className="text-lg">{viewingLog.user_name}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <p className="text-lg">{viewingLog.log_type === 'manual' ? 'Manual' : 'Tracker'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(viewingLog)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Faturável</label>
                  <p className="text-lg">{viewingLog.is_billable ? 'Sim' : 'Não'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-base mt-1 p-3 bg-muted rounded-md">
                  {viewingLog.description || "Sem descrição"}
                </p>
              </div>
              {viewingLog.is_rejected && viewingLog.rejection_reason && (
                <div>
                  <label className="text-sm font-medium text-red-600">Motivo da Rejeição</label>
                  <p className="text-base mt-1 p-3 bg-red-50 border border-red-200 rounded-md text-red-900">
                    {viewingLog.rejection_reason}
                  </p>
                </div>
              )}
              {viewingLog.is_approved && viewingLog.approved_by_email && (
                <div>
                  <label className="text-sm font-medium text-green-600">Aprovado por</label>
                  <p className="text-base mt-1">{viewingLog.approved_by_email}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Timesheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe o motivo da rejeição deste registro de tempo:
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Horas não compatíveis com o escopo da tarefa"
              rows={4}
              className="bg-background"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Manual Time Log Form Component
function ManualTimeLogForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const { currentTenantId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    project_id: "",
    task_id: "",
    hours: 0,
    date: new Date().toISOString().split('T')[0],
    description: "",
    is_billable: true
  });

  useEffect(() => {
    loadProjects();
  }, [currentTenantId]);

  useEffect(() => {
    if (formData.project_id) {
      loadTasks(formData.project_id);
    }
  }, [formData.project_id]);

  const loadProjects = async () => {
    const { data } = await supabase
      .from('prj_project')
      .select('id, name')
      .eq('client_id', currentTenantId)
      .order('name');
    setProjects(data || []);
  };

  const loadTasks = async (projectId: string) => {
    const { data } = await supabase
      .from('prj_task')
      .select('id, title')
      .eq('project_id', projectId)
      .eq('client_id', currentTenantId)
      .order('title');
    setTasks(data || []);
  };

  const handleSubmit = async () => {
    if (!formData.project_id || !formData.task_id || formData.hours <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) {
        toast.error("Usuário não autenticado");
        return;
      }

      const parsedSession = JSON.parse(storedSession);
      const user = parsedSession.user;

      const project = projects.find(p => p.id === formData.project_id);
      const task = tasks.find(t => t.id === formData.task_id);

      const mentions = mentionedUsers.length > 0 ? JSON.stringify(mentionedUsers) : null;

      const { error } = await supabase
        .from('prj_time_log')
        .insert({
          task_id: formData.task_id,
          task_title: task?.title || '',
          project_id: formData.project_id,
          project_name: project?.name || '',
          user_email: user.email,
          user_name: user.name || user.email,
          hours: formData.hours,
          date: formData.date,
          description: formData.description,
          mentions: mentions,
          client_id: currentTenantId,
          log_type: 'manual',
          is_billable: formData.is_billable
        });

      if (error) throw error;

      if (mentionedUsers.length > 0) {
        await sendMentionNotifications({
          mentionedEmails: mentionedUsers,
          entityType: "task",
          entityId: formData.task_id,
          entityTitle: task?.title || "Registro de Tempo",
          comment: formData.description,
          mentionedBy: user.name || user.email,
        });
      }

      toast.success("Registro criado com sucesso!");
      onSave();
    } catch (error) {
      console.error("Error creating time log:", error);
      toast.error("Erro ao criar registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Projeto *</label>
          <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value, task_id: "" })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Tarefa *</label>
          <Select value={formData.task_id} onValueChange={(value) => setFormData({ ...formData, task_id: value })} disabled={!formData.project_id}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {tasks.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Horas *</label>
          <Input
            type="number"
            step="0.25"
            min="0"
            value={formData.hours}
            onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Data *</label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Descrição (use @ para mencionar)</label>
        <MentionTextarea
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          onMention={setMentionedUsers}
          placeholder="Descreva o trabalho realizado. Use @ para mencionar alguém"
          rows={4}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="billable"
          checked={formData.is_billable}
          onChange={(e) => setFormData({ ...formData, is_billable: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="billable" className="text-sm">Faturável</label>
      </div>
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button onClick={handleSubmit} disabled={loading} className="flex-1">
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
