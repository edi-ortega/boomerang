import { useState, useEffect } from "react";
import { bmr } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Check, Sparkles, Zap, Crown, UserCircle, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useTenantId } from "@/contexts/TenantContext";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Permission {
  code: string;
  name: string;
  category: string;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  { code: 'create_epic', name: 'Criar Épicos', category: 'Backlog' },
  { code: 'edit_epic', name: 'Editar Épicos', category: 'Backlog' },
  { code: 'delete_epic', name: 'Excluir Épicos', category: 'Backlog' },
  { code: 'create_feature', name: 'Criar Funcionalidades', category: 'Backlog' },
  { code: 'edit_feature', name: 'Editar Funcionalidades', category: 'Backlog' },
  { code: 'delete_feature', name: 'Excluir Funcionalidades', category: 'Backlog' },
  { code: 'create_story', name: 'Criar Histórias', category: 'Backlog' },
  { code: 'edit_story', name: 'Editar Histórias', category: 'Backlog' },
  { code: 'delete_story', name: 'Excluir Histórias', category: 'Backlog' },
  { code: 'create_task', name: 'Criar Tarefas', category: 'Tarefas' },
  { code: 'edit_task', name: 'Editar Tarefas', category: 'Tarefas' },
  { code: 'delete_task', name: 'Excluir Tarefas', category: 'Tarefas' },
  { code: 'assign_task', name: 'Atribuir Tarefas', category: 'Tarefas' },
  { code: 'create_sprint', name: 'Criar Sprints', category: 'Sprints' },
  { code: 'edit_sprint', name: 'Editar Sprints', category: 'Sprints' },
  { code: 'delete_sprint', name: 'Excluir Sprints', category: 'Sprints' },
  { code: 'start_sprint', name: 'Iniciar Sprints', category: 'Sprints' },
  { code: 'complete_sprint', name: 'Concluir Sprints', category: 'Sprints' },
  { code: 'view_sprints', name: 'Visualizar Sprints', category: 'Sprints' },
  { code: 'manage_projects', name: 'Gerenciar Projetos', category: 'Projetos' },
  { code: 'manage_team', name: 'Gerenciar Times', category: 'Time' },
  { code: 'view_reports', name: 'Visualizar Relatórios', category: 'Relatórios' },
  { code: 'join_planning_poker', name: 'Participar Planning Poker', category: 'Planning Poker' },
  { code: 'create_planning_poker', name: 'Criar Planning Poker', category: 'Planning Poker' },
  { code: 'log_time', name: 'Registrar Tempo', category: 'Timesheet' },
  { code: 'view_own_timesheet', name: 'Ver Próprio Timesheet', category: 'Timesheet' },
  { code: 'view_all_timesheets', name: 'Ver Todos os Timesheets', category: 'Timesheet' },
  { code: 'approve_timesheets', name: 'Aprovar Timesheets', category: 'Timesheet' },
  { code: 'edit_all_timelogs', name: 'Editar Todos os Registros', category: 'Timesheet' },
  { code: 'manage_settings', name: 'Gerenciar Configurações', category: 'Admin' },
  { code: 'manage_boards', name: 'Gerenciar Boards', category: 'Admin' }
];

const CATEGORY_COLORS: Record<string, string> = {
  "Backlog": "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  "Tarefas": "from-amber-500/20 to-orange-500/20 border-amber-500/30",
  "Sprints": "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
  "Projetos": "from-blue-500/20 to-indigo-500/20 border-blue-500/30",
  "Time": "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
  "Relatórios": "from-violet-500/20 to-purple-500/20 border-violet-500/30",
  "Planning Poker": "from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30",
  "Timesheet": "from-sky-500/20 to-cyan-500/20 border-sky-500/30",
  "Admin": "from-red-500/20 to-rose-500/20 border-red-500/30"
};

export default function PermissionsManagementSection() {
  const { toast } = useToast();
  const tenantId = useTenantId();
  const [userTypes, setUserTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<any | null>(null);
  const [availablePerms, setAvailablePerms] = useState<Permission[]>(AVAILABLE_PERMISSIONS);
  const [assignedPerms, setAssignedPerms] = useState<Permission[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserTypes();
  }, [tenantId]);

  const loadUserTypes = async () => {
    setIsLoading(true);
    try {
      const allTypes = await bmr.entities.UserType.list("name");
      const tenantTypes = allTypes.filter((t: any) => t.client_id === tenantId);
      setUserTypes(tenantTypes);
    } catch (error) {
      console.error("Error loading user types:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os tipos de usuário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectType = (userType: any) => {
    setSelectedType(userType);

    const currentPerms = (userType.permissions || []).map((code: string) =>
      AVAILABLE_PERMISSIONS.find(p => p.code === code)
    ).filter(Boolean) as Permission[];

    const remaining = AVAILABLE_PERMISSIONS.filter(p =>
      !userType.permissions?.includes(p.code)
    );

    setAssignedPerms(currentPerms);
    setAvailablePerms(remaining);
  };

  const handleDragEnd = (result: any) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      return;
    }

    const draggedPerm = AVAILABLE_PERMISSIONS.find(p => p.code === draggableId);
    if (!draggedPerm) return;

    if (source.droppableId === 'available' && destination.droppableId === 'assigned') {
      setAvailablePerms(prev => prev.filter(p => p.code !== draggableId));
      setAssignedPerms(prev => [...prev, draggedPerm]);
    } else if (source.droppableId === 'assigned' && destination.droppableId === 'available') {
      setAssignedPerms(prev => prev.filter(p => p.code !== draggableId));
      setAvailablePerms(prev => [...prev, draggedPerm]);
    }
  };

  const handleAssignCategory = (category: string) => {
    const categoryPerms = availablePerms.filter(p => p.category === category);
    if (categoryPerms.length === 0) return;

    setAvailablePerms(prev => prev.filter(p => p.category !== category));
    setAssignedPerms(prev => [...prev, ...categoryPerms]);
  };

  const handleRemoveCategory = (category: string) => {
    const categoryPerms = assignedPerms.filter(p => p.category === category);
    if (categoryPerms.length === 0) return;

    setAssignedPerms(prev => prev.filter(p => p.category !== category));
    setAvailablePerms(prev => [...prev, ...categoryPerms]);
  };

  const handleSave = async () => {
    if (!selectedType) return;

    setIsSaving(true);
    try {
      await bmr.entities.UserType.update(selectedType.id, {
        permissions: assignedPerms.map(p => p.code)
      });

      toast({
        title: "Permissões atualizadas!",
        description: `${assignedPerms.length} permissões foram configuradas para ${selectedType.name}.`,
      });

      await loadUserTypes();
      setSelectedType(null);
      setAvailablePerms(AVAILABLE_PERMISSIONS);
      setAssignedPerms([]);
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as permissões.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const groupByCategory = (perms: Permission[]) => {
    return perms.reduce<Record<string, Permission[]>>((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (selectedType) {
    const availableGrouped = groupByCategory(availablePerms);
    const assignedGrouped = groupByCategory(assignedPerms);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{selectedType.name}</h3>
              <p className="text-sm text-muted-foreground">Arraste as permissões entre os painéis</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setSelectedType(null);
              setAvailablePerms(AVAILABLE_PERMISSIONS);
              setAssignedPerms([]);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Salvar Permissões
                </>
              )}
            </Button>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Droppable droppableId="available">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`relative min-h-[500px] rounded-2xl border-2 transition-all ${
                    snapshot.isDraggingOver
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border bg-accent/30'
                  }`}
                >
                  <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border p-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-muted-foreground" />
                        <h4 className="font-semibold text-foreground">Permissões Disponíveis</h4>
                      </div>
                      <Badge variant="secondary">{availablePerms.length}</Badge>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {Object.entries(availableGrouped).map(([category, perms]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className={`flex-1 p-2 rounded-lg bg-gradient-to-r ${CATEGORY_COLORS[category]} border text-xs font-semibold text-foreground`}>
                            {category} ({perms.length})
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAssignCategory(category)}
                            className="h-8 px-2 hover:bg-green-500/20 hover:text-green-700"
                            title="Atribuir todas"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                        {perms.map((perm, index) => {
                          const globalIndex = availablePerms.findIndex(p => p.code === perm.code);
                          return (
                            <Draggable key={perm.code} draggableId={perm.code} index={globalIndex}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-3 rounded-lg bg-card border border-border cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/50 transition-all ${
                                    snapshot.isDragging ? 'shadow-2xl scale-105 border-primary bg-primary/5 rotate-1' : ''
                                  }`}
                                  style={{
                                    ...provided.draggableProps.style,
                                    transition: snapshot.isDragging ? 'none' : 'all 0.2s ease'
                                  }}
                                >
                                  <p className="text-sm font-medium text-foreground">{perm.name}</p>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                      </div>
                    ))}
                    {availablePerms.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Sparkles className="w-12 h-12 text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground">Todas as permissões foram atribuídas</p>
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            <Droppable droppableId="assigned">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`relative min-h-[500px] rounded-2xl border-2 transition-all ${
                    snapshot.isDraggingOver
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-border bg-gradient-to-br from-primary/5 to-primary/10'
                  }`}
                >
                  <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border p-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        <h4 className="font-semibold text-foreground">Permissões Atribuídas</h4>
                      </div>
                      <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                        {assignedPerms.length}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {Object.entries(assignedGrouped).map(([category, perms]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveCategory(category)}
                            className="h-8 px-2 hover:bg-red-500/20 hover:text-red-700"
                            title="Remover todas"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <div className={`flex-1 p-2 rounded-lg bg-gradient-to-r ${CATEGORY_COLORS[category]} border text-xs font-semibold text-foreground`}>
                            {category} ({perms.length})
                          </div>
                        </div>
                        {perms.map((perm, index) => {
                          const globalIndex = assignedPerms.findIndex(p => p.code === perm.code);
                          return (
                            <Draggable key={perm.code} draggableId={perm.code} index={globalIndex}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-3 rounded-lg bg-card border border-green-500/30 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-green-500 transition-all ${
                                    snapshot.isDragging ? 'shadow-2xl scale-105 border-green-500 bg-green-500/5 rotate-1' : ''
                                  }`}
                                  style={{
                                    ...provided.draggableProps.style,
                                    transition: snapshot.isDragging ? 'none' : 'all 0.2s ease'
                                  }}
                                >
                                  <p className="text-sm font-medium text-foreground">{perm.name}</p>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                      </div>
                    ))}
                    {assignedPerms.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Shield className="w-12 h-12 text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground">Arraste permissões para cá</p>
                        <p className="text-xs text-muted-foreground mt-1">Nenhuma permissão atribuída ainda</p>
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-3 py-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-foreground">Gerenciamento de Permissões</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Configure as permissões de acesso para cada tipo de usuário de forma visual e intuitiva.
          Selecione um tipo de usuário abaixo para começar.
        </p>
      </div>

      {userTypes.length === 0 ? (
        <Card className="border-2 border-dashed border-border">
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">Nenhum tipo de usuário encontrado</p>
            <p className="text-sm text-muted-foreground">
              Crie tipos de usuário em Cadastros para gerenciar permissões
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {userTypes.map((userType, index) => {
              const permCount = userType.permissions?.length || 0;
              const totalPerms = AVAILABLE_PERMISSIONS.length;
              const percentage = Math.round((permCount / totalPerms) * 100);

              return (
                <motion.div
                  key={userType.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  onClick={() => handleSelectType(userType)}
                  className="group cursor-pointer"
                >
                  <Card className="h-full border-2 border-border hover:border-primary/50 transition-all hover:shadow-xl bg-gradient-to-br from-card to-card/50">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            {userType.is_admin ? (
                              <Crown className="w-6 h-6 text-amber-500" />
                            ) : (
                              <Users className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {userType.name}
                            </h4>
                            {userType.is_admin && (
                              <Badge variant="secondary" className="mt-1">Admin</Badge>
                            )}
                          </div>
                        </div>
                        <Zap className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {userType.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {userType.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Permissões</span>
                          <span className="font-semibold text-foreground">
                            {permCount}/{totalPerms}
                          </span>
                        </div>
                        <div className="h-2 bg-accent rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {percentage}% configurado
                        </p>
                      </div>

                      <div className="pt-2 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        >
                          Gerenciar Permissões
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
