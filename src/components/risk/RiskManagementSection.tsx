import React, { useState, useEffect } from "react";
import { bmr } from "@/api/boomerangClient";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { UserSelect } from "@/components/ui/user-select";
import { 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  User,
  Filter,
  TrendingUp,
  CheckCircle2,
  Grid3x3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import RiskMatrix from "./RiskMatrix";
import {
  notifyRiskAssignment,
  notifyRiskReviewDue,
  createMitigationTask,
  checkAndUpdateRiskStatus
} from "@/components/utils/RiskIssueWorkflowHelper";
import { useTenantId } from "@/hooks/useTenantId";
import { useConfirm } from "@/hooks/use-confirm";
import { getCurrentSystemId } from "@/lib/tenant-helper";

interface RiskManagementSectionProps {
  projectId?: string;
}

export default function RiskManagementSection({ projectId }: RiskManagementSectionProps) {
  const tenantId = useTenantId();
  const { confirm, ConfirmDialog } = useConfirm();
  
  const [risks, setRisks] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technical',
    probability: 3,
    impact: 3,
    status: 'identified',
    mitigation_plan: '',
    contingency_plan: '',
    owner_email: '',
    owner_name: '',
    identified_date: new Date().toISOString().split('T')[0],
    review_date: ''
  });

  useEffect(() => {
    loadData();
  }, [projectId, tenantId]);

  // Check for due reviews periodically
  useEffect(() => {
    const interval = setInterval(() => {
      risks.forEach(risk => {
        notifyRiskReviewDue(risk);
      });
    }, 1000 * 60 * 60); // Every hour

    return () => clearInterval(interval);
  }, [risks]);

  const loadData = async () => {
    if (!projectId || !tenantId) return;

    setIsLoading(true);
    try {
      const [allRisks, allTasks, allProjects] = await Promise.all([
        bmr.entities.Risk.filter({ project_id: projectId, client_id: tenantId }),
        bmr.entities.Task.filter({ project_id: projectId, client_id: tenantId }),
        bmr.entities.Project.filter({ id: projectId, client_id: tenantId })
      ]);

      // Get users from bmr_user_system_access (excluding super admin)
      const systemId = getCurrentSystemId();
      
      const { data: systemAccess } = await supabase
        .from('bmr_user_system_access' as any)
        .select('user_id')
        .eq('system_id', systemId);
      
      const userIds = systemAccess?.map((access: any) => access.user_id) || [];
      
      let allUsers: any[] = [];
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('bmr_user' as any)
          .select('*')
          .in('user_id', userIds)
          .eq('is_super_admin', false)
          .eq('is_active', true);
        
        allUsers = usersData || [];
      }
      
      setRisks(allRisks || []);
      setTasks(allTasks || []);
      setProject(allProjects?.[0]);
      setUsers(allUsers || []);

      // Check and update risk statuses
      for (const risk of allRisks || []) {
        await checkAndUpdateRiskStatus(risk, allTasks || []);
      }

      // Refresh risks after status updates
      const updatedRisks = await bmr.entities.Risk.filter({ project_id: projectId, client_id: tenantId });
      setRisks(updatedRisks || []);

    } catch (error) {
      console.error("Error loading risks:", error);
      toast.error("Erro ao carregar riscos");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRiskScore = (probability: number, impact: number) => {
    return probability * impact;
  };

  const calculateRiskLevel = (probability: number, impact: number) => {
    const score = calculateRiskScore(probability, impact);
    if (score <= 6) return 'low';
    if (score <= 12) return 'medium';
    if (score <= 16) return 'high';
    return 'critical';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.probability || !formData.impact) {
      toast.error("Preencha título, probabilidade e impacto");
      return;
    }

    try {
      const currentUser = await bmr.auth.me();
      const riskScore = calculateRiskScore(formData.probability, formData.impact);
      const riskLevel = calculateRiskLevel(formData.probability, formData.impact);

      const riskData = {
        ...formData,
        project_id: projectId,
        client_id: tenantId,
        risk_score: riskScore,
        risk_level: riskLevel
      };

      if (editingRisk) {
        await bmr.entities.Risk.update(editingRisk.id, riskData);
        toast.success("Risco atualizado com sucesso");
        
        if (formData.owner_email) {
          await notifyRiskAssignment({ ...riskData, id: editingRisk.id }, currentUser, true);
        }
      } else {
        const newRisk = await bmr.entities.Risk.create(riskData);
        toast.success("Risco cadastrado com sucesso");
        
        if (formData.owner_email) {
          await notifyRiskAssignment(newRisk, currentUser, false);
        }
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving risk:", error);
      toast.error("Erro ao salvar risco");
    }
  };

  const handleCreateMitigationTask = async (risk: any) => {
    if (!project) {
      toast.error("Projeto não encontrado");
      return;
    }

    const success = await createMitigationTask(risk, project);
    if (success) {
      toast.success("Tarefa de mitigação criada");
      loadData();
    } else {
      toast.error("Erro ao criar tarefa de mitigação");
    }
  };

  const handleEdit = (risk: any) => {
    setEditingRisk(risk);
    setFormData({
      title: risk.title || '',
      description: risk.description || '',
      category: risk.category || 'technical',
      probability: risk.probability || 3,
      impact: risk.impact || 3,
      status: risk.status || 'identified',
      mitigation_plan: risk.mitigation_plan || '',
      contingency_plan: risk.contingency_plan || '',
      owner_email: risk.owner_email || '',
      owner_name: risk.owner_name || '',
      identified_date: risk.identified_date || new Date().toISOString().split('T')[0],
      review_date: risk.review_date || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (risk: any) => {
    const confirmed = await confirm({
      title: "Confirmar exclusão",
      description: "Tem certeza que deseja excluir este risco?"
    });
    if (!confirmed) return;

    try {
      await bmr.entities.Risk.delete(risk.id);
      toast.success("Risco excluído");
      loadData();
    } catch (error) {
      console.error("Error deleting risk:", error);
      toast.error("Erro ao excluir risco");
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'technical',
      probability: 3,
      impact: 3,
      status: 'identified',
      mitigation_plan: '',
      contingency_plan: '',
      owner_email: '',
      owner_name: '',
      identified_date: new Date().toISOString().split('T')[0],
      review_date: ''
    });
    setEditingRisk(null);
    setShowForm(false);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-600 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'identified': return 'bg-blue-500/20 text-blue-600';
      case 'monitoring': return 'bg-cyan-500/20 text-cyan-600';
      case 'mitigating': return 'bg-yellow-500/20 text-yellow-600';
      case 'mitigated': return 'bg-green-500/20 text-green-600';
      case 'occurred': return 'bg-red-500/20 text-red-600';
      case 'closed': return 'bg-gray-500/20 text-gray-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const categoryLabels: Record<string, string> = {
    technical: 'Técnico',
    financial: 'Financeiro',
    resources: 'Recursos',
    schedule: 'Cronograma',
    quality: 'Qualidade',
    external: 'Externo',
    business: 'Negócio'
  };

  const statusLabels: Record<string, string> = {
    identified: 'Identificado',
    monitoring: 'Monitorando',
    mitigating: 'Em Mitigação',
    mitigated: 'Mitigado',
    occurred: 'Ocorrido',
    closed: 'Fechado'
  };

  const filteredRisks = risks.filter(r => {
    const statusMatch = filterStatus === 'all' || r.status === filterStatus;
    const levelMatch = filterLevel === 'all' || r.risk_level === filterLevel;
    return statusMatch && levelMatch;
  });

  const stats = {
    total: risks.length,
    critical: risks.filter(r => r.risk_level === 'critical').length,
    high: risks.filter(r => r.risk_level === 'high').length,
    active: risks.filter(r => r.status === 'identified' || r.status === 'mitigating').length
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Carregando riscos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ConfirmDialog />
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Gestão de Riscos</h3>
            <p className="text-muted-foreground">Acompanhe e mitigue os riscos do projeto</p>
          </div>
          <div className="flex gap-2">
            {risks.length > 0 && (
              <Dialog open={showMatrixModal} onOpenChange={setShowMatrixModal}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Grid3x3 className="w-4 h-4 mr-2" />
                    Ver Matriz
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Matriz de Riscos</DialogTitle>
                  </DialogHeader>
                  <RiskMatrix risks={risks} onRiskClick={(risk) => {
                    handleEdit(risk);
                    setShowMatrixModal(false);
                  }} />
                </DialogContent>
              </Dialog>
            )}
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showForm ? 'Cancelar' : 'Adicionar Risco'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Críticos</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Altos</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ativos</p>
                  <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                </div>
                <TrendingUp className="w-6 h-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{editingRisk ? 'Editar Risco' : 'Novo Risco'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Título *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Título do risco"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technical">Técnico</SelectItem>
                            <SelectItem value="financial">Financeiro</SelectItem>
                            <SelectItem value="resources">Recursos</SelectItem>
                            <SelectItem value="schedule">Cronograma</SelectItem>
                            <SelectItem value="quality">Qualidade</SelectItem>
                            <SelectItem value="external">Externo</SelectItem>
                            <SelectItem value="business">Negócio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="probability">Probabilidade * (1-5)</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <Slider
                            id="probability"
                            min={1}
                            max={5}
                            step={1}
                            value={[formData.probability]}
                            onValueChange={(value) => setFormData({ ...formData, probability: value[0] })}
                            className="flex-1"
                          />
                          <span className="text-lg font-bold w-8 text-center">
                            {formData.probability}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          1=Muito Baixa, 3=Média, 5=Muito Alta
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="impact">Impacto * (1-5)</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <Slider
                            id="impact"
                            min={1}
                            max={5}
                            step={1}
                            value={[formData.impact]}
                            onValueChange={(value) => setFormData({ ...formData, impact: value[0] })}
                            className="flex-1"
                          />
                          <span className="text-lg font-bold w-8 text-center">
                            {formData.impact}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          1=Muito Baixo, 3=Médio, 5=Muito Alto
                        </p>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <div className="p-4 rounded-lg bg-accent/30 border border-border">
                          <p className="text-sm font-medium mb-2">
                            Nível de Risco Calculado:
                          </p>
                          <div className="flex items-center gap-3">
                            <Badge className={getRiskLevelColor(calculateRiskLevel(formData.probability, formData.impact))}>
                              {calculateRiskLevel(formData.probability, formData.impact).toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Score: {calculateRiskScore(formData.probability, formData.impact)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="owner_email">Responsável</Label>
                        <UserSelect
                          users={users.map(u => ({
                            email: u.email,
                            name: u.name,
                            full_name: u.name,
                            avatar_url: u.avatar_url,
                            avatar_color: u.avatar_color
                          }))}
                          value={formData.owner_email}
                          onValueChange={(value) => {
                            const selectedUser = users.find(u => u.email === value);
                            setFormData({ 
                              ...formData, 
                              owner_email: value,
                              owner_name: selectedUser?.name || ''
                            });
                          }}
                          placeholder="Selecionar responsável"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="identified">Identificado</SelectItem>
                            <SelectItem value="mitigating">Em Mitigação</SelectItem>
                            <SelectItem value="mitigated">Mitigado</SelectItem>
                            <SelectItem value="occurred">Ocorrido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="identified_date">Data de Identificação</Label>
                        <Input
                          id="identified_date"
                          type="date"
                          value={formData.identified_date}
                          onChange={(e) => setFormData({ ...formData, identified_date: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="review_date">Data de Revisão</Label>
                        <Input
                          id="review_date"
                          type="date"
                          value={formData.review_date}
                          onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descreva o risco..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mitigation_plan">Plano de Mitigação</Label>
                      <Textarea
                        id="mitigation_plan"
                        value={formData.mitigation_plan}
                        onChange={(e) => setFormData({ ...formData, mitigation_plan: e.target.value })}
                        placeholder="Como mitigar este risco..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contingency_plan">Plano de Contingência</Label>
                      <Textarea
                        id="contingency_plan"
                        value={formData.contingency_plan}
                        onChange={(e) => setFormData({ ...formData, contingency_plan: e.target.value })}
                        placeholder="O que fazer se o risco ocorrer..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="bg-primary hover:bg-primary/90">
                        {editingRisk ? 'Atualizar' : 'Cadastrar'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={filterStatus === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterStatus('all')}
          >
            Todos
          </Button>
          <Button 
            variant={filterStatus === 'identified' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterStatus('identified')}
          >
            Identificados
          </Button>
          <Button 
            variant={filterStatus === 'mitigating' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterStatus('mitigating')}
          >
            Em Mitigação
          </Button>
          <Button 
            variant={filterStatus === 'mitigated' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterStatus('mitigated')}
          >
            Mitigados
          </Button>
          
          <div className="border-l mx-2"></div>
          
          <Button 
            variant={filterLevel === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterLevel('all')}
          >
            Todos Níveis
          </Button>
          <Button 
            variant={filterLevel === 'critical' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterLevel('critical')}
          >
            Crítico
          </Button>
          <Button 
            variant={filterLevel === 'high' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterLevel('high')}
          >
            Alto
          </Button>
        </div>

        {/* Risks List */}
        {filteredRisks.length > 0 ? (
          <div className="space-y-4">
            {filteredRisks.map((risk) => (
              <Card key={risk.id} className="border-border hover:border-primary/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="text-lg font-semibold text-foreground">{risk.title}</h4>
                        <Badge className={getRiskLevelColor(risk.risk_level)}>
                          {risk.risk_level === 'critical' ? 'Crítico' : 
                           risk.risk_level === 'high' ? 'Alto' : 
                           risk.risk_level === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                        <Badge className={getStatusColor(risk.status)}>
                          {statusLabels[risk.status] || risk.status}
                        </Badge>
                        <Badge variant="outline">
                          {categoryLabels[risk.category] || risk.category}
                        </Badge>
                      </div>
                      {risk.description && (
                        <p className="text-sm text-muted-foreground">{risk.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {risk.status === 'identified' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCreateMitigationTask(risk);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Criar Tarefa
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(risk);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(risk);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Probabilidade</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-sm ${
                              i < risk.probability ? 'bg-primary' : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Impacto</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-sm ${
                              i < risk.impact ? 'bg-primary' : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Score</p>
                      <p className="text-sm font-medium text-foreground">{risk.risk_score}</p>
                    </div>
                  </div>

                  {risk.mitigation_plan && (
                    <div className="mt-4 p-3 bg-accent/30 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Plano de Mitigação</p>
                      <p className="text-sm text-foreground">{risk.mitigation_plan}</p>
                    </div>
                  )}

                  {risk.contingency_plan && (
                    <div className="mt-2 p-3 bg-accent/30 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Plano de Contingência</p>
                      <p className="text-sm text-foreground">{risk.contingency_plan}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    {(risk.owner_name || risk.owner_email) && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{risk.owner_name || risk.owner_email}</span>
                      </div>
                    )}
                    {risk.identified_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Identificado: {new Date(risk.identified_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {risk.review_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Revisão: {new Date(risk.review_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {filterStatus !== 'all' || filterLevel !== 'all'
                  ? 'Nenhum risco encontrado com os filtros selecionados'
                  : 'Nenhum risco cadastrado'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
