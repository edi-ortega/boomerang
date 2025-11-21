import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getSupabaseClient } from "@/lib/supabase-client";
import { useTenant } from "@/contexts/TenantContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CreatePokerSessionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  projectId?: string | null;
}

interface User {
  email: string;
  name: string;
  user_id: string;
  avatar_url: string | null;
}

export default function CreatePokerSessionModal({ open, onClose, onSubmit, projectId }: CreatePokerSessionModalProps) {
  const [sessionName, setSessionName] = useState("");
  const [moderatorEmail, setModeratorEmail] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { currentTenantId } = useTenant();

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open, projectId]);

  const loadUsers = async () => {
    try {
      const client = await getSupabaseClient();
      const { bmr } = await import("@/api/boomerangClient");
      
      let teamMemberEmails: string[] = [];
      
      // Se houver projectId, buscar apenas usuários do time do projeto
      if (projectId) {
        const { data: projectData } = await client
          .from("prj_project")
          .select("team_ids")
          .eq("id", projectId)
          .maybeSingle();
        
        if (projectData && projectData.team_ids) {
          const teamIds = Array.isArray(projectData.team_ids) 
            ? (projectData.team_ids as string[])
            : [];
            
          if (teamIds.length > 0) {
            const { data: teamsData } = await client
              .from("prj_team")
              .select("members")
              .in("id", teamIds);
            
            if (teamsData) {
              // Extrair emails de todos os members de todos os teams
              teamsData.forEach((team: any) => {
                if (team.members && Array.isArray(team.members)) {
                  team.members.forEach((member: any) => {
                    if (member.email) {
                      teamMemberEmails.push(member.email);
                    }
                  });
                }
              });
            }
          }
        }
      }
      
      // Buscar todos os usuários usando o boomerangClient
      const allUsers = await bmr.entities.User.list();
      
      // Filtrar: apenas usuários ativos, não super admins, e do time do projeto
      let filteredUsers = allUsers.filter((u: any) => {
        // Excluir inativos e super admins
        if (!u.is_active || u.is_super_admin) return false;
        
        // Se houver projectId, só incluir membros do time
        if (projectId && teamMemberEmails.length > 0) {
          return teamMemberEmails.includes(u.email);
        }
        
        // Se não houver projectId, não mostrar ninguém
        return false;
      });

      if (filteredUsers && filteredUsers.length > 0) {
        const usersData: User[] = filteredUsers.map((u: any) => ({
          user_id: u.user_id,
          email: u.email,
          name: u.name,
          avatar_url: u.avatar_url
        }));

        setUsers(usersData);
        
        // Definir o usuário atual como moderador por padrão
        const storedSession = localStorage.getItem("bmr_session");
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          setModeratorEmail(parsedSession.user.email);
        }
      } else {
        console.warn("Nenhum usuário encontrado para este projeto/tenant");
        setUsers([]);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    }
  };

  const handleParticipantToggle = (email: string) => {
    setSelectedParticipants(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      name: sessionName,
      moderatorEmail,
      participants: selectedParticipants
    });
    setSessionName("");
    setModeratorEmail("");
    setSelectedParticipants([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Sessão de Planning Poker</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionName">Nome da Sessão</Label>
            <Input
              id="sessionName"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              required
              placeholder="Ex: Sprint Planning - Sprint 1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="moderator">Moderador</Label>
            <Select value={moderatorEmail} onValueChange={setModeratorEmail} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o moderador" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.email}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {(user.name || user.email).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.name || user.email}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Participantes</Label>
            {users.length === 0 ? (
              <div className="border rounded-md p-4 text-center text-muted-foreground">
                Nenhum usuário disponível neste tenant
              </div>
            ) : (
              <>
                <ScrollArea className="h-48 border rounded-md p-4">
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div key={user.user_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`participant-${user.user_id}`}
                          checked={selectedParticipants.includes(user.email)}
                          onCheckedChange={() => handleParticipantToggle(user.email)}
                        />
                        <label
                          htmlFor={`participant-${user.user_id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {(user.name || user.email).substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {user.name || user.email}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-sm text-muted-foreground">
                  {selectedParticipants.length} participante{selectedParticipants.length !== 1 ? 's' : ''} selecionado{selectedParticipants.length !== 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!moderatorEmail || selectedParticipants.length === 0}>
              Criar Sessão
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
