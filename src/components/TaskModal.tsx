import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, CheckSquare, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import TaskTypeQuickCreateModal from "./TaskTypeQuickCreateModal";
import AIDescriptionButton from "./AIDescriptionButton";
import { sendMentionNotifications } from "@/lib/mention-helper";

interface TaskModalProps {
  task?: any;
  storyId?: string;
  projectId: string;
  sprintId?: string;
  onClose: () => void;
  onSave?: (task: any) => void;
}

export default function TaskModal({ task, storyId, projectId, sprintId, onClose, onSave }: TaskModalProps) {
  const { currentTenantId } = useTenant();
  const [isSaving, setIsSaving] = useState(false);
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    notes: task?.notes || "",
    task_type_id: task?.task_type_id || "",
    story_id: task?.story_id || storyId || "none",
    assigned_to_email: task?.assigned_to_email || "none",
    estimated_hours: task?.estimated_hours || 0,
    priority: task?.priority || "medium",
    status: task?.status || "todo",
    due_date: task?.due_date || ""
  });
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);

  useEffect(() => {
    loadTaskTypes();
    loadUsers();
    loadStories();
  }, []);

  const loadTaskTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('prj_task_type' as any)
        .select('*')
        .eq('client_id', currentTenantId)
        .order('order') as any;

      if (error) throw error;
      setTaskTypes(data || []);
    } catch (error) {
      console.error("Error loading task types:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: userClients, error: clientsError } = await supabase
        .from('bmr_user_clients')
        .select('user_id')
        .eq('client_id', currentTenantId) as any;

      if (clientsError) throw clientsError;

      const userIds = userClients?.map((uc: any) => uc.user_id) || [];

      if (userIds.length === 0) {
        setUsers([]);
        return;
      }

      const { data, error } = await supabase
        .from('bmr_user')
        .select('user_id, name, email, avatar_url')
        .in('user_id', userIds)
        .eq('is_active', true)
        .order('name') as any;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from('prj_story' as any)
        .select('id, title')
        .eq('project_id', projectId)
        .eq('client_id', currentTenantId) as any;

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error("Error loading stories:", error);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.task_type_id) {
      toast.error("Título e tipo são obrigatórios.");
      return;
    }

    setIsSaving(true);
    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        task_type_id: formData.task_type_id,
        priority: formData.priority,
        status: formData.status,
        project_id: projectId,
        sprint_id: sprintId || null,
        client_id: currentTenantId,
        estimated_hours: formData.estimated_hours || null,
        due_date: formData.due_date || null,
        assigned_to_email: formData.assigned_to_email === "none" ? null : formData.assigned_to_email,
        assigned_to_name: (formData.assigned_to_email && formData.assigned_to_email !== "none") ? users.find(u => u.email === formData.assigned_to_email)?.name : null,
        story_id: formData.story_id === "none" ? null : formData.story_id
      };

      if (task) {
        // Update
        const { data: updated, error } = await supabase
          .from('prj_task' as any)
          .update(taskData)
          .eq('id', task.id)
          .select()
          .maybeSingle() as any;

        if (error) throw error;
        
        // Enviar notificações para usuários mencionados
        if (mentionedUsers.length > 0) {
          const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
          await sendMentionNotifications({
            mentionedEmails: mentionedUsers,
            entityType: 'task',
            entityId: updated.id,
            entityTitle: formData.title,
            mentionedBy: currentUser.name || currentUser.email
          });
        }
        
        toast.success("Tarefa atualizada com sucesso.");
        if (onSave) onSave(updated);
      } else {
        // Create
        const { data: created, error } = await supabase
          .from('prj_task' as any)
          .insert(taskData)
          .select()
          .maybeSingle() as any;

        if (error) throw error;
        
        // Enviar notificações para usuários mencionados
        if (mentionedUsers.length > 0) {
          const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
          await sendMentionNotifications({
            mentionedEmails: mentionedUsers,
            entityType: 'task',
            entityId: created.id,
            entityTitle: formData.title,
            mentionedBy: currentUser.name || currentUser.email
          });
        }
        
        toast.success("Tarefa criada com sucesso.");
        if (onSave) onSave(created);
      }
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Não foi possível salvar a tarefa.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-border bg-card">
          <CardHeader className="sticky top-0 bg-card z-10 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                <CardTitle className="text-foreground">
                  {task ? "Editar Tarefa" : "Nova Tarefa"}
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
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Título *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título da tarefa"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Tipo de Tarefa *
              </label>
              <div className="flex gap-2">
                <Select
                  value={formData.task_type_id}
                  onValueChange={(value) => setFormData({ ...formData, task_type_id: value })}
                >
                  <SelectTrigger className="flex-1 bg-background border-border text-foreground">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowTypeModal(true)}
                  className="border-border"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {stories.length > 0 && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  História
                </label>
                <Select
                  value={formData.story_id}
                  onValueChange={(value) => setFormData({ ...formData, story_id: value })}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Selecione uma história" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {stories.map((story) => (
                      <SelectItem key={story.id} value={story.id}>
                        {story.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">
                  Descrição
                </label>
                <AIDescriptionButton
                  title={formData.title}
                  type="task"
                  onGenerated={(description) => setFormData({ ...formData, description: description as string })}
                />
              </div>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Descrição da tarefa"
              />
            </div>

            {/* Observações com Menções */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Observações
              </label>
              <MentionTextarea
                value={formData.notes}
                onChange={(value) => setFormData({ ...formData, notes: value })}
                onMention={setMentionedUsers}
                placeholder="Adicione observações e mencione pessoas com @"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Atribuído a
                </label>
                <Select
                  value={formData.assigned_to_email}
                  onValueChange={(value) => setFormData({ ...formData, assigned_to_email: value })}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não atribuído</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.email}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Horas Estimadas
                </label>
                <Input
                  type="number"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) || 0 })}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Prioridade
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">A Fazer</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="review">Em Revisão</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data de Entrega
                </label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
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
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showTypeModal && (
        <TaskTypeQuickCreateModal
          onClose={() => setShowTypeModal(false)}
          onCreate={(newType) => {
            setTaskTypes([...taskTypes, newType]);
            setFormData({ ...formData, task_type_id: newType.id });
          }}
        />
      )}
    </>
  );
}
