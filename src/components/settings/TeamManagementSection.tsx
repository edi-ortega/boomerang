
import React, { useState, useEffect, useMemo } from "react";
import { bmr } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, Shield, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getCurrentTenantId } from "@/lib/tenant-helper";
import { motion } from "framer-motion";
import { useConfirm } from "@/hooks/use-confirm";
import { ViewToggle } from "@/components/ViewToggle";
import { useViewModeStore } from "@/stores/viewModeStore";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { UserSelect } from "@/components/ui/user-select";

export default function TeamManagementSection() {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const { viewMode } = useViewModeStore();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    members: []
  });

  const [memberForm, setMemberForm] = useState({
    email: "",
    team_role: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const tenantId = await getCurrentTenantId();
      
      // Buscar times, usuários e tipos - igual ao ProjectDetail
      const [allTeams, allUsers, allUserTypes] = await Promise.all([
        bmr.entities.Team.filter({ client_id: tenantId }),
        bmr.entities.User.list(),
        bmr.entities.UserType.list()
      ]);

      setTeams(allTeams || []);
      setUsers(allUsers || []);
      setUserTypes(allUserTypes || []);
    } catch (error) {
      console.error("Error loading teams:", error);
      toast({
        title: "Erro ao carregar equipes",
        description: "Não foi possível carregar as equipes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, preencha o nome da equipe."
      });
      return;
    }

    try {
      const storedSession = localStorage.getItem("bmr_session");
      const tenantId = storedSession ? JSON.parse(storedSession).user?.client_id : null;
      
      if (!tenantId) {
        toast({
          title: "Erro de sessão",
          description: "Não foi possível identificar o tenant.",
          variant: "destructive"
        });
        return;
      }

      const { supabase } = await import("@/integrations/supabase/client");
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        is_active: true,
        members: formData.members,
        client_id: tenantId
      };

      if (editingTeam) {
        const { error } = await supabase
          .from("prj_team")
          .update(dataToSave)
          .eq("id", editingTeam.id)
          .eq("client_id", tenantId);
        
        if (error) throw error;
        
        toast({
          title: "Equipe atualizada!",
          description: "A equipe foi atualizada com sucesso."
        });
      } else {
        const { error } = await supabase
          .from("prj_team")
          .insert(dataToSave);
        
        if (error) throw error;
        
        toast({
          title: "Equipe criada!",
          description: "A equipe foi criada com sucesso."
        });
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error("Error saving team:", error);
      toast({
        title: "Erro ao salvar equipe",
        description: "Não foi possível salvar a equipe.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      color: team.color || "#3b82f6",
      members: team.members || []
    });
    setShowForm(true);
  };

  const handleDelete = async (team) => {
    const confirmed = await confirm({
      title: "Confirmar exclusão",
      description: `Tem certeza que deseja excluir a equipe "${team.name}"? Esta ação não pode ser desfeita.`,
      confirmText: "Excluir",
      cancelText: "Cancelar"
    });

    if (!confirmed) return;

    try {
      const storedSession = localStorage.getItem("bmr_session");
      const tenantId = storedSession ? JSON.parse(storedSession).user?.client_id : null;
      
      if (!tenantId) {
        toast({
          title: "Erro de sessão",
          description: "Não foi possível identificar o tenant.",
          variant: "destructive"
        });
        return;
      }

      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase
        .from("prj_team")
        .delete()
        .eq("id", team.id)
        .eq("client_id", tenantId);
      
      if (error) throw error;
      
      toast({
        title: "Equipe excluída!",
        description: `A equipe "${team.name}" foi excluída.`
      });
      await loadData();
    } catch (error) {
      console.error("Error deleting team:", error);
      toast({
        title: "Erro ao excluir equipe",
        description: "Não foi possível excluir a equipe.",
        variant: "destructive"
      });
    }
  };

  const handleAddMember = () => {
    if (!memberForm.email) {
      toast({
        title: "Email obrigatório",
        description: "Selecione um membro para adicionar."
      });
      return;
    }

    const user = users.find(u => u.email === memberForm.email);
    if (!user) return;

    if (formData.members.some(m => m.email === memberForm.email)) {
      toast({
        title: "Membro já adicionado",
        description: "Este membro já está no time."
      });
      return;
    }

    setFormData({
      ...formData,
      members: [
        ...formData.members,
        {
          email: user.email,
          name: user.full_name || user.email,
          team_role: memberForm.team_role || ""
        }
      ]
    });

    setMemberForm({ email: "", team_role: "" });
  };

  const handleRemoveMember = (email) => {
    setFormData({
      ...formData,
      members: formData.members.filter(m => m.email !== email)
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6",
      members: []
    });
    setShowForm(false);
    setEditingTeam(null);
    setMemberForm({ email: "", team_role: "" });
  };

  const getUserAvatar = (email) => {
    const user = users.find(u => u.email === email);
    return {
      avatar_url: user?.avatar_url || null,
      avatar_color: user?.avatar_color || '#3b82f6',
      initial: (user?.full_name || user?.name || email || '?').charAt(0).toUpperCase()
    };
  };

  const getTeamManager = (team) => {
    if (!team.members || team.members.length === 0) return null;
    
    const managerKeywords = ['gerente', 'manager', 'líder', 'lead', 'coordenador', 'coordinator', 'product owner', 'scrum master'];
    
    const manager = team.members.find(member => {
      if (!member.team_role) return false;
      const role = member.team_role.toLowerCase();
      return managerKeywords.some(keyword => role.includes(keyword));
    });
    
    return manager || null;
  };

  return (
    <>
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Equipes</h2>
          <p className="text-muted-foreground">Gerencie as equipes do sistema</p>
        </div>
        <div className="flex gap-2">
          <ViewToggle />
          <Button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="bg-primary hover:bg-primary/80"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Equipe
          </Button>
        </div>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="glass-effect border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                {editingTeam ? "Editar Equipe" : "Nova Equipe"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Nome *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Time Alpha"
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Cor</label>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="bg-background border-border h-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Descrição</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descreva o propósito da equipe..."
                    className="bg-background border-border text-foreground h-20"
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Membros da Equipe</h3>
                  
                  <div className="grid md:grid-cols-3 gap-3 mb-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Selecionar Membro
                      </label>
                      <UserSelect
                        users={users}
                        value={memberForm.email}
                        onValueChange={(selectedEmail) => {
                          const selectedUser = users.find(u => u.email === selectedEmail);
                          
                          if (selectedUser) {
                            let suggestedRole = "";
                            
                            if (selectedUser.user_type) {
                              const userType = userTypes.find(ut => ut.code === selectedUser.user_type);
                              if (userType) {
                                suggestedRole = userType.name;
                              }
                            }
                            
                            setMemberForm({
                              email: selectedEmail,
                              team_role: suggestedRole
                            });
                          } else {
                            setMemberForm({ email: selectedEmail, team_role: "" });
                          }
                        }}
                        placeholder="Selecione um usuário"
                        filterEmails={formData.members.map(m => m.email)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Função no Time
                      </label>
                      <select
                        value={memberForm.team_role}
                        onChange={(e) => setMemberForm({...memberForm, team_role: e.target.value})}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                      >
                        <option value="">Selecione uma função</option>
                        {userTypes.map(type => (
                          <option key={type.code} value={type.name}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddMember}
                    variant="outline"
                    className="w-full mb-4 border-border hover:bg-accent"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Membro
                  </Button>

                  {formData.members.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {formData.members.map((member, idx) => {
                        const avatar = getUserAvatar(member.email);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-accent/30 rounded-lg border border-border"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {avatar.avatar_url ? (
                                <img
                                  src={avatar.avatar_url}
                                  alt={member.name}
                                  className="w-8 h-8 rounded-full object-cover border border-border"
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground border border-border"
                                  style={{ backgroundColor: avatar.avatar_color }}
                                >
                                  {avatar.initial}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {member.team_role || 'Sem função definida'}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(member.email)}
                              className="text-destructive hover:text-destructive flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 border-2 border-dashed border-border rounded-lg">
                      <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum membro adicionado à equipe
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm} 
                    className="flex-1 border-border hover:bg-accent"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateOrUpdate} 
                    className="flex-1 bg-primary hover:bg-primary/80"
                  >
                    {editingTeam ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="glass-effect border-border animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : teams.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? "grid md:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "space-y-4"
        }>
          {teams.map((team, index) => {
            const manager = getTeamManager(team);
            const regularMembers = team.members?.filter(m => m.email !== manager?.email) || [];
            
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`glass-effect border-border hover:border-primary/50 transition-all ${
                  viewMode === 'list' ? 'w-full' : ''
                }`}>
                  <CardContent className={viewMode === 'list' ? "p-4" : "p-6"}>
                    <div className={`flex ${viewMode === 'list' ? 'flex-row items-center gap-4' : 'flex-col'}`}>
                      <div className="flex items-start justify-between flex-1 w-full mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${team.color}20` }}
                          >
                            <Users className="w-6 h-6" style={{ color: team.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground text-lg">{team.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {team.members?.length || 0} {(team.members?.length || 0) === 1 ? 'membro' : 'membros'}
                            </p>
                            {viewMode === 'list' && team.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {team.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 ml-4">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(team)}
                            className="border-border hover:bg-accent"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(team)}
                            className="border-red-500/50 hover:bg-red-500/10 text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {viewMode === 'list' && manager && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
                          <Shield className="w-3 h-3 text-primary flex-shrink-0" />
                          {(() => {
                            const avatar = getUserAvatar(manager.email);
                            return avatar.avatar_url ? (
                              <img
                                src={avatar.avatar_url}
                                alt={manager.name}
                                className="w-6 h-6 rounded-full object-cover border border-primary flex-shrink-0"
                              />
                            ) : (
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground border border-primary flex-shrink-0"
                                style={{ backgroundColor: avatar.avatar_color }}
                              >
                                {avatar.initial}
                              </div>
                            );
                          })()}
                          <span className="text-xs font-medium text-primary whitespace-nowrap">{manager.name}</span>
                        </div>
                      )}
                    </div>

                    {viewMode === 'grid' && (
                      <>
                        {team.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {team.description}
                          </p>
                        )}

                        {/* Gerente do Time - Destacado */}
                        {manager && (
                          <div className="mb-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="w-3 h-3 text-primary" />
                              <p className="text-xs font-medium text-muted-foreground">
                                Gerente/Líder
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const avatar = getUserAvatar(manager.email);
                                return avatar.avatar_url ? (
                                  <img
                                    src={avatar.avatar_url}
                                    alt={manager.name}
                                    className="w-8 h-8 rounded-full object-cover border border-primary"
                                  />
                                ) : (
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground border border-primary"
                                    style={{ backgroundColor: avatar.avatar_color }}
                                  >
                                    {avatar.initial}
                                  </div>
                                );
                              })()}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{manager.name}</p>
                                <p className="text-xs text-primary truncate">
                                  {manager.team_role}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Membros do Time */}
                        {regularMembers.length > 0 && (
                          <div className="pt-3 border-t border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              {manager ? 'Outros Membros' : 'Membros'} ({regularMembers.length})
                            </p>
                            <div className="space-y-2">
                              {regularMembers.slice(0, 4).map((member, idx) => {
                                const avatar = getUserAvatar(member.email);
                                return (
                                  <div key={idx} className="flex items-center gap-2">
                                    {avatar.avatar_url ? (
                                      <img
                                        src={avatar.avatar_url}
                                        alt={member.name}
                                        className="w-7 h-7 rounded-full object-cover border border-border flex-shrink-0"
                                      />
                                    ) : (
                                      <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground border border-border flex-shrink-0"
                                        style={{ backgroundColor: avatar.avatar_color }}
                                      >
                                        {avatar.initial}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-foreground truncate">{member.name}</p>
                                      {member.team_role && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          {member.team_role}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {regularMembers.length > 4 && (
                                <p className="text-xs text-muted-foreground pl-9">
                                  +{regularMembers.length - 4} {regularMembers.length - 4 === 1 ? 'outro' : 'outros'}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {(!team.members || team.members.length === 0) && (
                          <div className="pt-3 border-t border-border text-center py-3">
                            <p className="text-sm text-muted-foreground italic">
                              Nenhum membro adicionado
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="glass-effect border-border">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma equipe cadastrada</h3>
            <p className="text-muted-foreground mb-6">Crie sua primeira equipe</p>
            <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/80">
              <Plus className="w-4 h-4 mr-2" />
              Criar Equipe
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
    <ConfirmDialog />
  </>
  );
}
