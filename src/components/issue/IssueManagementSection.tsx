import React, { useState, useEffect } from "react";
import { bmr } from "@/api/boomerangClient";
import { supabase } from "@/integrations/supabase/client";
import { SYSTEM_CONFIG } from "@/config/system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { UserSelect } from "@/components/ui/user-select";
import { 
  AlertCircle, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  User,
  Clock,
  CheckCircle,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTenantId } from "@/hooks/useTenantId";
import { useConfirm } from "@/hooks/use-confirm";
import {
  notifyIssueAssignment,
  notifyIssueDueDateApproaching,
  createResolutionTask,
  checkAndUpdateIssueStatus,
  linkIssueToRisk,
  createNotification
} from "@/components/utils/RiskIssueWorkflowHelper";

interface IssueManagementSectionProps {
  projectId?: string;
}

export default function IssueManagementSection({ projectId }: IssueManagementSectionProps) {
  const tenantId = useTenantId();
  const { confirm, ConfirmDialog } = useConfirm();
  
  const [issues, setIssues] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    priority: 'medium',
    status: 'open',
    category: 'bug',
    assigned_to_email: '',
    due_date: '',
    impact_description: '',
    root_cause: '',
    risk_id: ''
  });

  useEffect(() => {
    loadData();
  }, [projectId, tenantId]);

  useEffect(() => {
    const interval = setInterval(() => {
      issues.forEach(issue => {
        notifyIssueDueDateApproaching(issue);
      });
    }, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [issues]);

  const loadData = async () => {
    if (!projectId || !tenantId) return;

    setIsLoading(true);
    try {
      // First, get users with access to the system
      const { data: systemAccess } = await supabase
        .from('bmr_user_system_access')
        .select('user_id')
        .eq('system_id', SYSTEM_CONFIG.SYSTEM_ID);
      
      const userIds = systemAccess?.map(sa => sa.user_id) || [];
      
      // Then get user details, filtering out super admins and inactive users
      const { data: usersWithAccess } = await supabase
        .from('bmr_user')
        .select('email,name,avatar_url,is_super_admin')
        .in('user_id', userIds)
        .eq('is_active', true)
        .eq('is_super_admin', false);

      const [allIssues, allRisks, allTasks, allProjects] = await Promise.all([
        bmr.entities.Issue.filter({ project_id: projectId, client_id: tenantId }),
        bmr.entities.Risk.filter({ project_id: projectId, client_id: tenantId }),
        bmr.entities.Task.filter({ project_id: projectId, client_id: tenantId }),
        bmr.entities.Project.filter({ id: projectId, client_id: tenantId })
      ]);
      
      setIssues(allIssues || []);
      setRisks(allRisks || []);
      setUsers(usersWithAccess || []);
      setTasks(allTasks || []);
      setProject(allProjects?.[0]);

      for (const issue of allIssues || []) {
        await checkAndUpdateIssueStatus(issue, allTasks || []);
      }

      const updatedIssues = await bmr.entities.Issue.filter({ project_id: projectId, client_id: tenantId });
      setIssues(updatedIssues || []);
    } catch (error) {
      console.error("Error loading issues:", error);
      toast.error("Erro ao carregar issues");
    } finally {
      setIsLoading(false);
    }
  };

  const generateIssueNumber = () => {
    const issueCount = issues.length + 1;
    return `ISS-${String(issueCount).padStart(4, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.severity) {
      toast.error("Preencha título e severidade");
      return;
    }

    try {
      const currentUser = await bmr.auth.me();
      const issueNumber = generateIssueNumber();

      // Find the assigned user's name
      const assignedUser = formData.assigned_to_email 
        ? users.find(u => u.email === formData.assigned_to_email)
        : null;

      const issueData = {
        ...formData,
        assigned_to_name: assignedUser?.name || null,
        issue_number: issueNumber,
        project_id: projectId,
        client_id: tenantId,
        reported_by_email: currentUser.email,
        reported_by_name: currentUser.name,
        reported_date: new Date().toISOString()
      };

      if (editingIssue) {
        await bmr.entities.Issue.update(editingIssue.id, issueData);
        toast.success("Issue atualizado");
        
        if (formData.assigned_to_email) {
          await notifyIssueAssignment({ ...issueData, id: editingIssue.id }, currentUser, true);
        }
      } else {
        const newIssue = await bmr.entities.Issue.create(issueData);
        toast.success("Issue cadastrado");
        
        if (formData.assigned_to_email) {
          await notifyIssueAssignment(newIssue, currentUser, false);
        }

        if (formData.risk_id) {
          await linkIssueToRisk(newIssue, formData.risk_id);
        }
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving issue:", error);
      toast.error("Erro ao salvar issue");
    }
  };

  const handleEdit = (issue: any) => {
    setEditingIssue(issue);
    setFormData({
      title: issue.title || '',
      description: issue.description || '',
      severity: issue.severity || 'medium',
      priority: issue.priority || 'medium',
      status: issue.status || 'open',
      category: issue.category || 'bug',
      assigned_to_email: issue.assigned_to_email || '',
      due_date: issue.due_date || '',
      impact_description: issue.impact_description || '',
      root_cause: issue.root_cause || '',
      risk_id: issue.risk_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (issue: any) => {
    const confirmed = await confirm({
      title: "Confirmar exclusão",
      description: "Tem certeza que deseja excluir este issue?"
    });
    if (!confirmed) return;

    try {
      await bmr.entities.Issue.delete(issue.id);
      toast.success("Issue excluído");
      loadData();
    } catch (error) {
      console.error("Error deleting issue:", error);
      toast.error("Erro ao excluir issue");
    }
  };

  const handleResolve = async (issue: any) => {
    try {
      await bmr.entities.Issue.update(issue.id, {
        status: 'resolved',
        resolved_date: new Date().toISOString()
      });

      if (issue.assigned_to_email) {
        const assignedUser = users.find(u => u.email === issue.assigned_to_email);
        if (assignedUser) {
          await createNotification({
            user_id: assignedUser.user_id,
            message: `Issue resolvido: ${issue.title}`,
            type: 'status_change',
            related_entity_type: 'issue',
            related_entity_id: issue.id,
            project_id: issue.project_id
          });
        }
      }

      toast.success("Issue resolvido");
      loadData();
    } catch (error) {
      console.error("Error resolving issue:", error);
      toast.error("Erro ao resolver issue");
    }
  };

  const handleCreateResolutionTask = async (issue: any) => {
    if (!project) {
      toast.error("Projeto não encontrado");
      return;
    }

    const success = await createResolutionTask(issue, project);
    if (success) {
      toast.success("Tarefa de resolução criada");
      loadData();
    } else {
      toast.error("Erro ao criar tarefa");
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      severity: 'medium',
      priority: 'medium',
      status: 'open',
      category: 'bug',
      assigned_to_email: '',
      due_date: '',
      impact_description: '',
      root_cause: '',
      risk_id: ''
    });
    setEditingIssue(null);
    setShowForm(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-600 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-600';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-600';
      case 'resolved': return 'bg-green-500/20 text-green-600';
      case 'closed': return 'bg-gray-500/20 text-gray-600';
      case 'wont_fix': return 'bg-red-500/20 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const categoryLabels: Record<string, string> = {
    bug: 'Bug',
    blocker: 'Bloqueador',
    technical_debt: 'Débito Técnico',
    process: 'Processo',
    communication: 'Comunicação',
    resource: 'Recurso',
    external: 'Externo'
  };

  const statusLabels: Record<string, string> = {
    open: 'Aberto',
    in_progress: 'Em Progresso',
    resolved: 'Resolvido',
    closed: 'Fechado',
    wont_fix: 'Não Será Corrigido'
  };

  const severityLabels: Record<string, string> = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Médio',
    low: 'Baixo'
  };

  const filteredIssues = issues.filter(i => {
    const statusMatch = filterStatus === 'all' || i.status === filterStatus;
    const severityMatch = filterSeverity === 'all' || i.severity === filterSeverity;
    return statusMatch && severityMatch;
  });

  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    in_progress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    critical: issues.filter(i => i.severity === 'critical' && i.status !== 'resolved').length
  };

  const getResolutionTasksProgress = (issue: any) => {
    const relatedTasks = tasks.filter(t => 
      t.title && t.title.includes(issue.title) && t.title.includes('[RESOLUÇÃO]')
    );
    
    if (relatedTasks.length === 0) return null;
    
    const completedTasks = relatedTasks.filter(t => t.status === 'done').length;
    const progress = (completedTasks / relatedTasks.length) * 100;
    
    return { completed: completedTasks, total: relatedTasks.length, progress };
  };

  if (isLoading) {
    return <Card><CardContent className="p-12 text-center"><p className="text-muted-foreground">Carregando issues...</p></CardContent></Card>;
  }

  return (
    <>
      <ConfirmDialog />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Gestão de Issues</h3>
            <p className="text-muted-foreground">Acompanhe e resolva os problemas do projeto</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? 'Cancelar' : 'Adicionar Issue'}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground mb-1">Total</p><p className="text-2xl font-bold text-foreground">{stats.total}</p></div><AlertCircle className="w-6 h-6 text-muted-foreground" /></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground mb-1">Abertos</p><p className="text-2xl font-bold text-blue-600">{stats.open}</p></div><Clock className="w-6 h-6 text-blue-600" /></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground mb-1">Em Progresso</p><p className="text-2xl font-bold text-yellow-600">{stats.in_progress}</p></div><Clock className="w-6 h-6 text-yellow-600" /></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground mb-1">Resolvidos</p><p className="text-2xl font-bold text-green-600">{stats.resolved}</p></div><CheckCircle className="w-6 h-6 text-green-600" /></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground mb-1">Críticos</p><p className="text-2xl font-bold text-red-600">{stats.critical}</p></div><AlertCircle className="w-6 h-6 text-red-600" /></div></CardContent></Card>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card><CardHeader><CardTitle>{editingIssue ? 'Editar Issue' : 'Novo Issue'}</CardTitle></CardHeader>
                <CardContent><form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="title">Título *</Label><Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título do issue" /></div>
                    <div className="space-y-2"><Label>Categoria</Label><Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bug">Bug</SelectItem><SelectItem value="blocker">Bloqueador</SelectItem><SelectItem value="technical_debt">Débito Técnico</SelectItem><SelectItem value="process">Processo</SelectItem><SelectItem value="communication">Comunicação</SelectItem><SelectItem value="resource">Recurso</SelectItem><SelectItem value="external">Externo</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Severidade *</Label><Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="critical">Crítico</SelectItem><SelectItem value="high">Alto</SelectItem><SelectItem value="medium">Médio</SelectItem><SelectItem value="low">Baixo</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Prioridade</Label><Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="urgent">Urgente</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="low">Baixa</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2">
                      <Label>Atribuído a</Label>
                      <UserSelect
                        users={users.map(u => ({
                          email: u.email,
                          name: u.name,
                          full_name: u.name,
                          avatar_url: u.avatar_url,
                          avatar_color: u.avatar_color,
                          id: u.user_id
                        }))}
                        value={formData.assigned_to_email}
                        onValueChange={(value) => setFormData({ ...formData, assigned_to_email: value })}
                        placeholder="Selecionar usuário"
                      />
                    </div>
                    <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Aberto</SelectItem><SelectItem value="in_progress">Em Progresso</SelectItem><SelectItem value="resolved">Resolvido</SelectItem><SelectItem value="closed">Fechado</SelectItem><SelectItem value="wont_fix">Não Será Corrigido</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Data de Vencimento</Label><Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Risco Relacionado</Label><Select value={formData.risk_id || undefined} onValueChange={(value) => setFormData({ ...formData, risk_id: value })}><SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger><SelectContent>{risks.map(risk => <SelectItem key={risk.id} value={risk.id}>{risk.title}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                  <div className="space-y-2"><Label>Descrição</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descreva o issue..." rows={3} /></div>
                  <div className="flex gap-2"><Button type="submit">{ editingIssue ? 'Atualizar' : 'Cadastrar' }</Button><Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button></div>
                </form></CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 flex-wrap">
          <Button variant={filterStatus === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('all')}>Todos</Button>
          <Button variant={filterStatus === 'open' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('open')}>Abertos</Button>
          <Button variant={filterStatus === 'in_progress' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('in_progress')}>Em Progresso</Button>
          <Button variant={filterStatus === 'resolved' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('resolved')}>Resolvidos</Button>
          <div className="border-l mx-2"></div>
          <Button variant={filterSeverity === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilterSeverity('all')}>Todas Severidades</Button>
          <Button variant={filterSeverity === 'critical' ? 'default' : 'outline'} size="sm" onClick={() => setFilterSeverity('critical')}>Crítico</Button>
          <Button variant={filterSeverity === 'high' ? 'default' : 'outline'} size="sm" onClick={() => setFilterSeverity('high')}>Alto</Button>
        </div>

        {filteredIssues.length > 0 ? (
          <div className="space-y-4">
            {filteredIssues.map(issue => {
              const resolutionProgress = getResolutionTasksProgress(issue);
              return (
                <Card key={issue.id} className="border-border hover:border-primary/50 transition-all"><CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{issue.issue_number}</span>
                        <h4 className="text-lg font-semibold">{issue.title}</h4>
                        <Badge className={getSeverityColor(issue.severity)}>{severityLabels[issue.severity]}</Badge>
                        <Badge className={getStatusColor(issue.status)}>{statusLabels[issue.status]}</Badge>
                        <Badge variant="outline">{categoryLabels[issue.category]}</Badge>
                      </div>
                      {issue.description && <p className="text-sm text-muted-foreground">{issue.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      {issue.status === 'open' && <Button type="button" size="sm" variant="outline" onClick={(e) => { e.preventDefault(); handleCreateResolutionTask(issue); }}><CheckCircle2 className="w-4 h-4 mr-1" />Criar Tarefa</Button>}
                      {issue.status !== 'resolved' && issue.status !== 'closed' && <Button type="button" size="sm" variant="outline" onClick={(e) => { e.preventDefault(); handleResolve(issue); }}><CheckCircle className="w-4 h-4 mr-1" />Resolver</Button>}
                      <Button type="button" size="sm" variant="outline" onClick={(e) => { e.preventDefault(); handleEdit(issue); }}><Edit className="w-4 h-4" /></Button>
                      <Button type="button" size="sm" variant="outline" onClick={(e) => { e.preventDefault(); handleDelete(issue); }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  {issue.risk_id && <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg"><p className="text-xs font-medium text-orange-600 mb-1">Risco Relacionado</p><p className="text-sm">{risks.find(r => r.id === issue.risk_id)?.title || 'N/A'}</p></div>}
                  {resolutionProgress && <div className="mb-4"><div className="flex items-center justify-between mb-2"><p className="text-xs font-medium text-muted-foreground">Progresso de Resolução</p><p className="text-xs text-muted-foreground">{resolutionProgress.completed}/{resolutionProgress.total} tarefas</p></div><Progress value={resolutionProgress.progress} className="h-2" /></div>}
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
                    {issue.assigned_to_email && <div className="flex items-center gap-1"><User className="w-3 h-3" /><span>{users.find(u => u.email === issue.assigned_to_email)?.name || issue.assigned_to_name || 'N/A'}</span></div>}
                    {issue.due_date && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>Vence: {new Date(issue.due_date).toLocaleDateString()}</span></div>}
                    {issue.resolved_date && <div className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-600" /><span>Resolvido: {new Date(issue.resolved_date).toLocaleDateString()}</span></div>}
                  </div>
                </CardContent></Card>
              );
            })}
          </div>
        ) : (
          <Card><CardContent className="p-12 text-center"><AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" /><p className="text-muted-foreground">{filterStatus !== 'all' || filterSeverity !== 'all' ? 'Nenhum issue encontrado' : 'Nenhum issue cadastrado'}</p></CardContent></Card>
        )}
      </div>
    </>
  );
}
