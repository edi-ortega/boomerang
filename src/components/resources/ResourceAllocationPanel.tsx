import React, { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Save, Info, PieChart, Pencil, Trash2 } from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { getCurrentTenantId } from "@/lib/tenant-helper";
import { calculateWorkHours, getWorkCalculationDetails } from "@/components/utils/WorkCalendarHelper";
import { UserSelect } from "@/components/ui/user-select";
import { useConfirm } from "@/hooks/use-confirm";

interface ResourceAllocationPanelProps {
  projectId?: string;
  sprintId?: string;
  startDate?: string;
  endDate?: string;
  onUpdate?: () => void;
}

export default function ResourceAllocationPanel({ 
  projectId, 
  sprintId, 
  startDate, 
  endDate, 
  onUpdate 
}: ResourceAllocationPanelProps) {
  const { ConfirmDialog, confirm } = useConfirm();
  
  const [workloadData, setWorkloadData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [calculatedHours, setCalculatedHours] = useState<number | null>(null);
  const [calculationDetails, setCalculationDetails] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [periodCapacity, setPeriodCapacity] = useState<number>(0);
  const [workedHours, setWorkedHours] = useState<Record<string, number>>({});
  const [editingAllocation, setEditingAllocation] = useState<any>(null);

  const [newAllocation, setNewAllocation] = useState({
    user_email: "",
    allocated_hours: 40,
    availability_percentage: 100,
    start_date: "",
    end_date: "",
    notes: ""
  });

  useEffect(() => {
    if (newAllocation.start_date && newAllocation.end_date) {
      calculateAllocationHours();
    } else {
      setCalculatedHours(null);
      setCalculationDetails(null);
    }
  }, [newAllocation.start_date, newAllocation.end_date, newAllocation.availability_percentage]);

  // Atualiza horas alocadas quando usuário é selecionado ou cálculo muda
  useEffect(() => {
    if (calculatedHours && newAllocation.user_email) {
      // Calcular horas restantes do projeto
      const totalAllocated = getTotalAllocatedHours();
      const remainingProjectHours = Math.max(0, periodCapacity - totalAllocated);
      
      // Calcular horas baseadas na disponibilidade
      const adjustedHours = (calculatedHours * newAllocation.availability_percentage) / 100;
      
      // Limitar às horas restantes do projeto
      const hoursToAllocate = Math.min(adjustedHours, remainingProjectHours);
      setNewAllocation(prev => ({ ...prev, allocated_hours: hoursToAllocate }));
    }
  }, [calculatedHours, newAllocation.availability_percentage, newAllocation.user_email, periodCapacity]);

  useEffect(() => {
    loadData();
  }, [projectId, sprintId]);

  useEffect(() => {
    if (!isLoading) {
      calculateWorkload();
    }
  }, [allocations, tasks, isLoading]);

  useEffect(() => {
    if (startDate && endDate) {
      calculatePeriodCapacity();
    }
  }, [startDate, endDate]);

  const calculatePeriodCapacity = async () => {
    if (!startDate || !endDate) return;
    try {
      const hours = await calculateWorkHours(startDate, endDate);
      setPeriodCapacity(hours);
    } catch (error) {
      console.error("Error calculating period capacity:", error);
      setPeriodCapacity(0);
    }
  };

  const getUserDisplayInfo = (email: string) => {
    const user = users.find((u: any) => u.email === email);
    const displayName = user?.full_name || user?.name || email.split('@')[0];
    return {
      avatar_url: user?.avatar_url || null,
      avatar_color: user?.avatar_color || '#3b82f6',
      initial: displayName.charAt(0).toUpperCase(),
      name: displayName
    };
  };

  const calculateAllocationHours = async () => {
    if (!newAllocation.start_date || !newAllocation.end_date) return;
    if (new Date(newAllocation.end_date) < new Date(newAllocation.start_date)) return;

    setIsCalculating(true);
    try {
      const [hours, details] = await Promise.all([
        calculateWorkHours(newAllocation.start_date, newAllocation.end_date),
        getWorkCalculationDetails(newAllocation.start_date, newAllocation.end_date)
      ]);

      setCalculatedHours(hours);
      setCalculationDetails(details);
    } catch (error) {
      console.error('Error calculating hours:', error);
      toast.error("Erro ao calcular horas baseado no calendário");
    } finally {
      setIsCalculating(false);
    }
  };

  const loadData = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const project = await base44.entities.Project.get(projectId);
      const teamIds = project?.team_ids || [];
      
      const filter: any = { project_id: projectId };
      if (sprintId) filter.sprint_id = sprintId;
      
      const [allAllocations, allTasks, allUsers, timeLogsData] = await Promise.all([
        base44.entities.ResourceAllocation.filter(filter),
        base44.entities.Task.filter({ project_id: projectId }),
        base44.entities.User.list(),
        base44.entities.TimeLog.filter({ project_id: projectId })
      ]);

      // Se há times no projeto, filtra usuários que estão nos times
      let filteredUsers = allUsers || [];
      if (teamIds.length > 0) {
        const teams = await Promise.all(
          teamIds.map((teamId: string) => base44.entities.Team.get(teamId))
        );
        const teamMemberEmails = new Set<string>();
        teams.forEach((team: any) => {
          if (team?.members) {
            team.members.forEach((member: any) => teamMemberEmails.add(member.email));
          }
        });
        filteredUsers = allUsers.filter((u: any) => teamMemberEmails.has(u.email));
      }

      setAllocations(allAllocations || []);
      setTasks(allTasks || []);
      setUsers(filteredUsers);
      
      // Calcular horas trabalhadas por usuário
      const workedByUser: Record<string, number> = {};
      (timeLogsData || []).forEach((log: any) => {
        if (log.user_email) {
          workedByUser[log.user_email] = (workedByUser[log.user_email] || 0) + (log.hours_logged || 0);
        }
      });
      setWorkedHours(workedByUser);
    } catch (error) {
      console.error("Error loading resource data:", error);
      toast.error("Erro ao carregar dados de recursos");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateWorkload = () => {
    const workload: Record<string, any> = {};

    (allocations || []).forEach((allocation: any) => {
      const user = (users || []).find((u: any) => u.email === allocation.user_email);
      if (!workload[allocation.user_email]) {
        workload[allocation.user_email] = {
          name: allocation.user_name || user?.full_name || allocation.user_email,
          email: allocation.user_email,
          role: user?.team_role || "Membro",
          allocated: 0,
          estimated: 0,
          availability: 100,
          avatar_url: user?.avatar_url
        };
      }
      workload[allocation.user_email].allocated += allocation.allocated_hours || 0;
      workload[allocation.user_email].availability = allocation.availability_percentage || 100;
    });

    (tasks || []).forEach((task: any) => {
      if (task.assigned_to_email && workload[task.assigned_to_email]) {
        workload[task.assigned_to_email].estimated += task.estimated_hours || 0;
      }
    });

    const calculated = Object.entries(workload).map(([email, data]: [string, any]) => ({
      ...data,
      capacity: (data.allocated * data.availability) / 100,
      utilization: data.allocated > 0 ? (data.estimated / data.allocated) * 100 : 0
    }));

    setWorkloadData(calculated);
  };

  const getTotalEstimatedHours = () => {
    return tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  };

  const getTotalAllocatedHours = () => {
    return allocations.reduce((sum, allocation) => sum + (allocation.allocated_hours || 0), 0);
  };

  const getAllocationPercentage = () => {
    const estimated = getTotalEstimatedHours();
    const allocated = getTotalAllocatedHours();
    if (estimated === 0) return 0;
    return Math.min(100, (allocated / estimated) * 100);
  };

  const getPreviewAllocationPercentage = () => {
    const currentAllocated = getTotalAllocatedHours();
    const newHours = Number(newAllocation.allocated_hours) || 0;
    const totalWithNew = currentAllocated + newHours;
    
    if (periodCapacity === 0) return 0;
    return Math.min(100, (totalWithNew / periodCapacity) * 100);
  };

  const handleOpenModal = () => {
    setEditingAllocation(null);
    setNewAllocation({
      user_email: "",
      allocated_hours: 0,
      availability_percentage: 100,
      start_date: startDate || "",
      end_date: endDate || "",
      notes: ""
    });
    setShowAddModal(true);
  };

  const handleEditAllocation = (allocation: any) => {
    setEditingAllocation(allocation);
    setNewAllocation({
      user_email: allocation.user_email,
      allocated_hours: allocation.allocated_hours,
      availability_percentage: allocation.availability_percentage,
      start_date: allocation.start_date,
      end_date: allocation.end_date,
      notes: allocation.notes || ""
    });
    setShowAddModal(true);
  };

  const handleDeleteAllocation = async (allocationId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const ok = await confirm({
      title: "Excluir Alocação",
      description: "Tem certeza que deseja excluir esta alocação? Esta ação não pode ser desfeita."
    });
    if (!ok) return;

    try {
      await base44.entities.ResourceAllocation.delete(allocationId);
      toast.success("Alocação removida com sucesso!");
      loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error deleting allocation:", error);
      toast.error("Erro ao remover alocação");
    }
  };

  const handleAddAllocation = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!newAllocation.user_email) {
      toast.error("Selecione um usuário");
      return;
    }

    if (!newAllocation.start_date || !newAllocation.end_date) {
      toast.error("Informe as datas de início e fim");
      return;
    }

    try {
      const clientId = await getCurrentTenantId();
      const selectedUser = users.find((u: any) => u.email === newAllocation.user_email);

      const allocationData: any = {
        client_id: clientId,
        project_id: projectId,
        user_email: newAllocation.user_email,
        user_name: selectedUser?.full_name || selectedUser?.name || newAllocation.user_email,
        allocated_hours: newAllocation.allocated_hours,
        availability_percentage: newAllocation.availability_percentage,
        start_date: newAllocation.start_date,
        end_date: newAllocation.end_date,
        notes: newAllocation.notes,
        allocation_type: sprintId ? 'sprint' : 'project'
      };

      if (sprintId) allocationData.sprint_id = sprintId;

      if (editingAllocation) {
        await base44.entities.ResourceAllocation.update(editingAllocation.id, allocationData);
        toast.success("Recurso atualizado com sucesso!");
      } else {
        await base44.entities.ResourceAllocation.create(allocationData);
        toast.success("Recurso alocado com sucesso!");
      }

      setShowAddModal(false);
      setEditingAllocation(null);
      loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error saving allocation:", error);
      toast.error(editingAllocation ? "Erro ao atualizar recurso" : "Erro ao alocar recurso");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Carregando alocação de recursos...</p>
        </CardContent>
      </Card>
    );
  }

  const renderEmptyState = () => (
    <Card>
      <CardContent className="p-12 text-center">
        <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground mb-4">Nenhum recurso alocado para este projeto</p>
        <Button onClick={handleOpenModal} type="button">
          <Plus className="w-4 h-4 mr-2" />
          Alocar Recurso
        </Button>
      </CardContent>
    </Card>
  );

  // Calcular percentual total de alocação baseado na capacidade do período
  const totalAllocated = getTotalAllocatedHours();
  const allocationPercentage = periodCapacity > 0 ? (totalAllocated / periodCapacity) * 100 : 0;
  const isFullyAllocated = allocationPercentage >= 100;

  return (
    <>
      {workloadData.length === 0 && allocations.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle>Alocação de Recursos</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {totalAllocated.toFixed(1)}h de {periodCapacity.toFixed(1)}h do período ({allocationPercentage.toFixed(1)}%)
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <CircularProgress 
                      value={Math.round(allocationPercentage)} 
                      size={64} 
                      strokeWidth={6} 
                    />
                  </div>
                  <Button 
                    onClick={handleOpenModal} 
                    disabled={isFullyAllocated}
                    type="button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Alocar Recursos
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Membro
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Função
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alocado
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trabalhado
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estimado
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacidade
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progresso
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workloadData.map((item: any) => {
                      const worked = workedHours[item.email] || 0;
                      const progressPercentage = item.allocated > 0 ? (worked / item.allocated) * 100 : 0;
                      
                      return (
                        <tr key={item.email}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              {(() => {
                                const info = getUserDisplayInfo(item.email);
                                return info.avatar_url ? (
                                  <img
                                    src={info.avatar_url}
                                    alt={item.name}
                                    className="w-8 h-8 rounded-full object-cover mr-2"
                                  />
                                ) : (
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground mr-2"
                                    style={{ backgroundColor: info.avatar_color }}
                                  >
                                    {info.initial}
                                  </div>
                                );
                              })()}
                              {item.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">{item.role}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">{item.allocated}h</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">{worked.toFixed(1)}h</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">{item.estimated}h</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {item.capacity ? item.capacity.toFixed(1) : 0}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <CircularProgress 
                                value={Math.min(100, Math.round(progressPercentage))} 
                                size={40} 
                                strokeWidth={4} 
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center gap-2">
                              {(() => {
                                const allocation = allocations.find((a: any) => a.user_email === item.email);
                                if (!allocation) return null;
                                return (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleEditAllocation(allocation);
                                      }}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteAllocation(allocation.id);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAllocation ? "Editar Alocação" : "Alocar Recurso"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Membro da Equipe</Label>
              <UserSelect
                users={users}
                value={newAllocation.user_email}
                onValueChange={(value) => setNewAllocation({ ...newAllocation, user_email: value })}
                placeholder="Selecione um membro"
                filterEmails={editingAllocation ? [] : workloadData.map(w => w.email)}
                disabled={!!editingAllocation}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={newAllocation.start_date}
                  onChange={(e) => setNewAllocation({ ...newAllocation, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={newAllocation.end_date}
                  onChange={(e) => setNewAllocation({ ...newAllocation, end_date: e.target.value })}
                />
              </div>
            </div>

            {calculationDetails && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold">Cálculo Automático de Horas</p>
                      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                        <p>Total de dias: {calculationDetails.totalDays}</p>
                        <p>Dias úteis: {calculationDetails.workDays}</p>
                        <p>Feriados: {calculationDetails.holidaysInPeriod}</p>
                        <p>Horas/dia: {calculationDetails.hoursPerDay}h</p>
                      </div>
                      <p className="font-semibold text-primary mt-2">
                        Total: {calculatedHours?.toFixed(1)}h úteis
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Com {newAllocation.availability_percentage}% disponibilidade: {(calculatedHours * newAllocation.availability_percentage / 100).toFixed(1)}h
                      </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <PieChart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="space-y-2 text-sm flex-1 min-h-[140px]">
                        <p className="font-semibold">Percentual Alocado</p>
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <CircularProgress 
                              key={`progress-${newAllocation.allocated_hours}`}
                              value={getPreviewAllocationPercentage()} 
                              size={80}
                              strokeWidth={8}
                            />
                          </div>
                          <div className="space-y-1 text-muted-foreground flex-1">
                            {periodCapacity > 0 ? (
                              <>
                                <p className="truncate">Cap. do período: {periodCapacity.toFixed(1)}h</p>
                                <p className="truncate">Já alocado: {getTotalAllocatedHours().toFixed(1)}h</p>
                                <p className="truncate text-primary font-medium">
                                  Restante: {Math.max(0, periodCapacity - getTotalAllocatedHours()).toFixed(1)}h
                                </p>
                                <p className="truncate">Nova alocação: {(Number(newAllocation.allocated_hours) || 0).toFixed(1)}h</p>
                                <p className="font-semibold text-foreground truncate">
                                  {getPreviewAllocationPercentage().toFixed(1)}% do período
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="truncate">Já alocado: {getTotalAllocatedHours().toFixed(1)}h</p>
                                <p className="truncate">Nova alocação: {(Number(newAllocation.allocated_hours) || 0).toFixed(1)}h</p>
                                <p className="text-muted-foreground text-xs">
                                  Aguardando cálculo do período
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horas Alocadas</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newAllocation.allocated_hours}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setNewAllocation({ ...newAllocation, allocated_hours: value });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Disponibilidade: {newAllocation.availability_percentage}%</Label>
                <div className="pt-2">
                  <Slider
                    value={[newAllocation.availability_percentage]}
                    onValueChange={(values) => {
                      setNewAllocation({ ...newAllocation, availability_percentage: values[0] });
                    }}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Ex: Férias previstas, ausências, etc."
                value={newAllocation.notes}
                onChange={(e) => setNewAllocation({ ...newAllocation, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} type="button">
              Cancelar
            </Button>
            <Button onClick={handleAddAllocation} disabled={isCalculating} type="button">
              <Save className="w-4 h-4 mr-2" />
              {editingAllocation ? "Atualizar Alocação" : "Salvar Alocação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </>
  );
}
