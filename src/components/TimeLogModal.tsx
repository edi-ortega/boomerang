import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Save, Clock } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import { sendMentionNotifications, extractMentionsFromText } from "@/lib/mention-helper";

interface TimeLogModalProps {
  taskId: string;
  onClose: () => void;
  onSave?: () => void;
  existingLog?: any;
  users?: Array<{
    user_id: string;
    name: string;
    email: string;
    avatar_url?: string;
  }>;
}

export default function TimeLogModal({ taskId, onClose, onSave, existingLog, users = [] }: TimeLogModalProps) {
  const { currentTenantId } = useTenant();
  const [isSaving, setIsSaving] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    hours: 0,
    description: "",
    log_date: new Date().toISOString().split('T')[0],
    user_email: "",
    user_name: ""
  });

  // Carregar dados do log existente quando em modo de edição
  useEffect(() => {
    if (existingLog) {
      setFormData({
        hours: existingLog.hours || 0,
        description: existingLog.description || "",
        log_date: existingLog.date || new Date().toISOString().split('T')[0],
        user_email: existingLog.user_email || "",
        user_name: existingLog.user_name || ""
      });

      // Extrair mentions existentes
      if (existingLog.mentions) {
        try {
          const mentions = typeof existingLog.mentions === 'string' 
            ? JSON.parse(existingLog.mentions) 
            : existingLog.mentions;
          setMentionedUsers(mentions || []);
        } catch (e) {
          console.error("Error parsing mentions:", e);
        }
      }
    }
  }, [existingLog]);

  const handleSave = async () => {
    if (!formData.hours || formData.hours <= 0) {
      toast.error("Informe o número de horas trabalhadas.");
      return;
    }

    setIsSaving(true);
    try {
      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) {
        toast.error("Usuário não autenticado.");
        return;
      }
      
      const parsedSession = JSON.parse(storedSession);
      const user = parsedSession.user;
      
      if (!user) {
        toast.error("Usuário não autenticado.");
        return;
      }

      // Get task and project info
      const { data: task } = await supabase
        .from('prj_task')
        .select('title, project_id, prj_project(name)')
        .eq('id', taskId)
        .maybeSingle();

      // Salvar mentions no formato JSON
      const mentions = mentionedUsers.length > 0 ? JSON.stringify(mentionedUsers) : null;

      const logData = {
        task_id: taskId,
        task_title: task?.title || '',
        project_id: task?.project_id,
        project_name: (task?.prj_project as any)?.name || '',
        user_email: existingLog ? formData.user_email : user.email,
        user_name: existingLog ? formData.user_name : (user.name || user.email),
        hours: formData.hours,
        date: formData.log_date,
        description: formData.description,
        mentions: mentions,
        client_id: currentTenantId,
        log_type: 'manual',
        is_billable: true
      };

      if (existingLog) {
        // Update existing log
        const { error } = await supabase
          .from('prj_time_log' as any)
          .update(logData)
          .eq('id', existingLog.id) as any;

        if (error) throw error;
        toast.success("Registro atualizado com sucesso.");
      } else {
        // Insert new log
        const { error } = await supabase
          .from('prj_time_log' as any)
          .insert(logData) as any;

        if (error) throw error;
        toast.success(`${formData.hours}h registradas com sucesso.`);
      }

      // Enviar notificações para usuários mencionados
      if (mentionedUsers.length > 0) {
        await sendMentionNotifications({
          mentionedEmails: mentionedUsers,
          entityType: "task",
          entityId: taskId,
          entityTitle: task?.title || "Registro de Tempo",
          comment: formData.description,
          mentionedBy: user.name || user.email,
        });
      }
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Error saving time log:", error);
      toast.error("Não foi possível salvar o registro.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserChange = (email: string) => {
    const selectedUser = users.find(u => u.email === email);
    if (selectedUser) {
      setFormData({
        ...formData,
        user_email: email,
        user_name: selectedUser.name || email
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="max-w-md w-full border-2 border-border bg-card">
        <CardHeader className="border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <CardTitle className="text-foreground">
                {existingLog ? "Editar Registro" : "Registrar Tempo"}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {existingLog && users.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Usuário *
              </label>
              <Select value={formData.user_email} onValueChange={handleUserChange}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue>
                    {formData.user_email && (() => {
                      const selectedUser = users.find(u => u.email === formData.user_email);
                      return selectedUser ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedUser.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(selectedUser.name || selectedUser.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{selectedUser.name || selectedUser.email}</span>
                        </div>
                      ) : "Selecione um usuário";
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.user_id} value={user.email}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(user.name || user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.name || user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Horas Trabalhadas *
            </label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
              placeholder="Ex: 2.5"
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Data
            </label>
            <Input
              type="date"
              value={formData.log_date}
              onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Descrição (use @ para mencionar)
            </label>
            <MentionTextarea
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              onMention={setMentionedUsers}
              placeholder="O que você fez nesse período? Use @ para mencionar alguém"
              className="bg-background border-border text-foreground"
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-primary/80"
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Salvando..." : existingLog ? "Atualizar" : "Registrar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
