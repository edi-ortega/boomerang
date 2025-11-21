import React, { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Shield,
  Edit,
  Search,
  Plus,
  Trash2,
  Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { hasPermission, PERMISSIONS } from "@/components/utils/PermissionsHelper";
import { useContextSidebar } from "../contexts/ContextSidebarContext";
import { addTenantData, addTenantFilter } from "../components/utils/TenantHelper";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TeamManagement() {
  const { toast } = useToast();
  const { updateContext, clearContext } = useContextSidebar();
  
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [canManage, setCanManage] = useState(false);
  
  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    members: [] as any[]
  });

  const [memberForm, setMemberForm] = useState({
    email: "",
    team_role: ""
  });

  useEffect(() => {
    checkPermissionsAndLoadData();
    
    return () => {
      clearContext();
    };
  }, [clearContext]);

  useEffect(() => {
    if (!isLoading && teams.length >= 0) {
      updateContextSidebar();
    }
  }, [teams, isLoading]);

  const updateContextSidebar = () => {
    const totalMembers = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
    const activeTeams = teams.filter(t => t.is_active !== false).length;

    updateContext({
      title: "Times",
      stats: [
        {
          label: "Total de Times",
          value: activeTeams,
          icon: <Users className="w-4 h-4 text-blue-500" />
        },
        {
          label: "Total de Membros",
          value: totalMembers,
          icon: <Users className="w-4 h-4 text-green-500" />
        },
        {
          label: "Média por Time",
          value: activeTeams > 0 ? Math.round(totalMembers / activeTeams) : 0,
          icon: <Users className="w-4 h-4 text-purple-500" />
        }
      ],
      tips: [
        { text: "Crie times para organizar projetos" },
        { text: "Adicione membros aos times com funções específicas" },
        { text: "Associe times aos projetos ao criá-los" },
        { text: "Times facilitam a gestão de Planning Poker" }
      ]
    });
  };

  const checkPermissionsAndLoadData = async () => {
    setIsLoading(true);
    try {
      const canManageTeam = await hasPermission(PERMISSIONS.MANAGE_SETTINGS);
      setCanManage(canManageTeam);

      if (!canManageTeam) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para gerenciar times.",
          variant: "destructive"
        });
        return;
      }

      const [allTeams, allUsers] = await Promise.all([
        base44.entities.Team.filter(await addTenantFilter()),
        base44.entities.User.list()
      ]);

      setTeams(allTeams || []);
      setUsers(allUsers || []);
    } catch (error) {
      console.error("Error loading teams:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os times.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = () => {
    setEditingTeam(null);
    setTeamForm({
      name: "",
      description: "",
      color: "#3b82f6",
      members: []
    });
    setShowTeamModal(true);
  };

  const handleEditTeam = (team: any) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      description: team.description || "",
      color: team.color || "#3b82f6",
      members: team.members || []
    });
    setShowTeamModal(true);
  };

  const handleAddMember = () => {
    if (!memberForm.email) {
      toast({
        title: "Email obrigatório",
        description: "Selecione um membro para adicionar.",
        variant: "destructive"
      });
      return;
    }

    const user = users.find(u => u.email === memberForm.email);
    if (!user) return;

    if (teamForm.members.some(m => m.email === memberForm.email)) {
      toast({
        title: "Membro já adicionado",
        description: "Este membro já está no time.",
        variant: "destructive"
      });
      return;
    }

    setTeamForm({
      ...teamForm,
      members: [
        ...teamForm.members,
        {
          email: user.email,
          name: user.full_name || user.email,
          team_role: memberForm.team_role || ""
        }
      ]
    });

    setMemberForm({ email: "", team_role: "" });
  };

  const handleRemoveMember = (email: string) => {
    setTeamForm({
      ...teamForm,
      members: teamForm.members.filter(m => m.email !== email)
    });
  };

  const handleSaveTeam = async () => {
    if (!teamForm.name) {
      toast({
        title: "Nome obrigatório",
        description: "O time precisa ter um nome.",
        variant: "destructive"
      });
      return;
    }

    try {
      const teamData = await addTenantData({
        name: teamForm.name,
        description: teamForm.description,
        color: teamForm.color,
        members: teamForm.members,
        is_active: true
      });

      if (editingTeam) {
        await base44.entities.Team.update(editingTeam.id, teamData);
        toast({
          title: "Time atualizado!",
          description: "As alterações foram salvas.",
        });
      } else {
        await base44.entities.Team.create(teamData);
        toast({
          title: "Time criado!",
          description: `O time "${teamForm.name}" foi criado com sucesso.`,
        });
      }

      setShowTeamModal(false);
      checkPermissionsAndLoadData();
    } catch (error) {
      console.error("Error saving team:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o time.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este time?")) return;

    try {
      await base44.entities.Team.delete(teamId);
      toast({
        title: "Time excluído!",
        description: "O time foi removido com sucesso.",
      });
      checkPermissionsAndLoadData();
    } catch (error) {
      console.error("Error deleting team:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o time.",
        variant: "destructive"
      });
    }
  };

  const getUserAvatar = (email: string) => {
    const user = users.find(u => u.email === email);
    return {
      avatar_url: user?.avatar_url || null,
      avatar_color: user?.avatar_color || '#3b82f6',
      initial: (user?.full_name || email || '?').charAt(0).toUpperCase()
    };
  };

  const getTeamManager = (team: any) => {
    if (!team.members || team.members.length === 0) return null;
    
    const managerKeywords = ['gerente', 'manager', 'líder', 'lead', 'coordenador', 'coordinator', 'product owner', 'scrum master'];
    
    const manager = team.members.find((member: any) => {
      if (!member.team_role) return false;
      const role = member.team_role.toLowerCase();
      return managerKeywords.some(keyword => role.includes(keyword));
    });
    
    return manager || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground">Carregando times...</p>
        </div>
      </div>
    );
  }

  const filteredTeams = teams.filter(team => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return team.name?.toLowerCase().includes(query) ||
             team.description?.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Equipes / Squads</h1>
            <p className="text-muted-foreground">Gerencie as equipes e seus membros</p>
          </div>
          {canManage && (
            <Button
              onClick={handleCreateTeam}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Equipe / Squad
            </Button>
          )}
        </motion.div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar times..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team: any, index: number) => {
            const manager = getTeamManager(team);
            const regularMembers = team.members?.filter((m: any) => m.email !== manager?.email) || [];
            
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-effect border-border hover:border-primary/50 transition-all h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: team.color || '#3b82f6' }}
                        >
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {team.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {team.members?.length || 0} {(team.members?.length || 0) === 1 ? 'membro' : 'membros'}
                          </p>
                        </div>
                      </div>
                      {canManage && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTeam(team)}
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTeam(team.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {team.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {team.description}
                      </p>
                    )}

                    {manager && (
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          <Shield className="w-3 h-3 inline mr-1" />
                          Gerente/Líder
                        </p>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const avatar = getUserAvatar(manager.email);
                            return avatar.avatar_url ? (
                              <img
                                src={avatar.avatar_url}
                                alt={manager.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground border-2 border-primary"
                                style={{ backgroundColor: avatar.avatar_color }}
                              >
                                {avatar.initial}
                              </div>
                            );
                          })()}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{manager.name}</p>
                            <p className="text-xs text-primary font-medium truncate">
                              {manager.team_role}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {regularMembers.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          {manager ? 'Outros Membros:' : 'Membros:'}
                        </p>
                        <div className="space-y-1">
                          {regularMembers.slice(0, 3).map((member: any, idx: number) => {
                            const avatar = getUserAvatar(member.email);
                            return (
                              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                                {avatar.avatar_url ? (
                                  <img
                                    src={avatar.avatar_url}
                                    alt={member.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                                    style={{ backgroundColor: avatar.avatar_color }}
                                  >
                                    {avatar.initial}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">{member.name}</p>
                                  {member.team_role && (
                                    <p className="text-xs text-muted-foreground truncate">{member.team_role}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {regularMembers.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center py-1">
                              +{regularMembers.length - 3} mais
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredTeams.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum time encontrado</h3>
              <p className="text-muted-foreground mb-6">
                {canManage ? "Comece criando seu primeiro time" : "Não há times disponíveis"}
              </p>
              {canManage && (
                <Button
                  onClick={handleCreateTeam}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Time
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingTeam ? "Editar Time" : "Novo Time"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Nome *</label>
              <Input
                value={teamForm.name}
                onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
                className="bg-background border-border"
                placeholder="Nome do time"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Descrição</label>
              <Textarea
                value={teamForm.description}
                onChange={(e) => setTeamForm({...teamForm, description: e.target.value})}
                className="bg-background border-border"
                placeholder="Descrição do time"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Cor</label>
              <Input
                type="color"
                value={teamForm.color}
                onChange={(e) => setTeamForm({...teamForm, color: e.target.value})}
                className="h-10 w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTeamModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSaveTeam} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
