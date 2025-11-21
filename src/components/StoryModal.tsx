import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, BookOpen, Plus, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import StoryTypeQuickCreateModal from "./StoryTypeQuickCreateModal";
import AIDescriptionButton from "./AIDescriptionButton";
import { sendMentionNotifications } from "@/lib/mention-helper";

interface StoryModalProps {
  story?: any;
  projectId: string;
  featureId?: string;
  onClose: () => void;
  onSave?: (story: any) => void;
}

export default function StoryModal({ story, projectId, featureId, onClose, onSave }: StoryModalProps) {
  const { currentTenantId } = useTenant();
  const [isSaving, setIsSaving] = useState(false);
  const [storyTypes, setStoryTypes] = useState<any[]>([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [complexityOptions, setComplexityOptions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: story?.title || "",
    description: story?.description || "",
    notes: story?.notes || "",
    story_type_id: story?.story_type_id || "",
    feature_id: story?.feature_id || featureId || "",
    acceptance_criteria: story?.acceptance_criteria || "",
    definition_of_done: story?.definition_of_done || "",
    assigned_to_email: story?.assigned_to_email || "",
    priority: story?.priority || "medium",
    status: story?.status || "backlog",
    story_points: story?.story_points || ""
  });
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);

  useEffect(() => {
    loadStoryTypes();
    loadUsers();
    loadComplexityOptions();
  }, [projectId]);

  const loadStoryTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('prj_story_type' as any)
        .select('*')
        .eq('client_id', currentTenantId)
        .order('order') as any;

      if (error) throw error;
      setStoryTypes(data || []);
    } catch (error) {
      console.error("Error loading story types:", error);
      toast.error("Não foi possível carregar os tipos de história.");
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

  const loadComplexityOptions = async () => {
    try {
      // Buscar o complexity_type do projeto
      const { data: project, error: projectError } = await supabase
        .from('prj_project' as any)
        .select('complexity_type')
        .eq('id', projectId)
        .maybeSingle() as any;

      if (projectError) throw projectError;

      if (!project?.complexity_type) {
        setComplexityOptions([]);
        return;
      }

      // Buscar as configurações de complexidade
      const { data: complexitySetting, error: settingError } = await supabase
        .from('prj_custom_complexity_setting' as any)
        .select('setting_value')
        .eq('complexity_type_id', project.complexity_type)
        .maybeSingle() as any;

      if (settingError) throw settingError;

      if (complexitySetting?.setting_value) {
        const options = complexitySetting.setting_value.split(',').map((v: string) => v.trim());
        setComplexityOptions(options);
      } else {
        setComplexityOptions([]);
      }
    } catch (error) {
      console.error("Error loading complexity options:", error);
      setComplexityOptions([]);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.story_type_id) {
      toast.error("Título e tipo são obrigatórios.");
      return;
    }

    if (!formData.definition_of_done?.trim()) {
      toast.error("Definição de pronto é obrigatória.");
      return;
    }

    setIsSaving(true);
    try {
      const storyData = {
        title: formData.title,
        description: formData.description,
        story_type_id: formData.story_type_id,
        feature_id: formData.feature_id || null,
        acceptance_criteria: formData.acceptance_criteria,
        definition_of_done: formData.definition_of_done,
        assigned_to_email: formData.assigned_to_email || null,
        assigned_to_name: formData.assigned_to_email ? users.find(u => u.email === formData.assigned_to_email)?.name : null,
        priority: formData.priority,
        status: formData.status,
        story_points: formData.story_points || null,
        project_id: projectId,
        client_id: currentTenantId
      };

      if (story) {
        // Update
        const { data: updated, error } = await supabase
          .from('prj_story' as any)
          .update(storyData)
          .eq('id', story.id)
          .select()
          .maybeSingle() as any;

        if (error) throw error;
        
        // Enviar notificações para usuários mencionados
        if (mentionedUsers.length > 0) {
          const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
          await sendMentionNotifications({
            mentionedEmails: mentionedUsers,
            entityType: 'story',
            entityId: updated.id,
            entityTitle: formData.title,
            mentionedBy: currentUser.name || currentUser.email
          });
        }
        
        toast.success("História atualizada com sucesso.");
        if (onSave) onSave(updated);
      } else {
        // Create
        const { data: created, error } = await supabase
          .from('prj_story' as any)
          .insert(storyData)
          .select()
          .maybeSingle() as any;

        if (error) throw error;
        
        // Enviar notificações para usuários mencionados
        if (mentionedUsers.length > 0) {
          const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
          await sendMentionNotifications({
            mentionedEmails: mentionedUsers,
            entityType: 'story',
            entityId: created.id,
            entityTitle: formData.title,
            mentionedBy: currentUser.name || currentUser.email
          });
        }
        
        toast.success("História criada com sucesso.");
        if (onSave) onSave(created);
      }
      onClose();
    } catch (error) {
      console.error("Error saving story:", error);
      toast.error("Não foi possível salvar a história.");
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
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle className="text-foreground">
                  {story ? "Editar História" : "Nova História"}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Funcionalidade de anexos em desenvolvimento")}
                  className="border-border text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Anexar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
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
                placeholder="Título da história"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Tipo de História *
              </label>
              <div className="flex gap-2">
                <Select
                  value={formData.story_type_id}
                  onValueChange={(value) => setFormData({ ...formData, story_type_id: value })}
                >
                  <SelectTrigger className="flex-1 bg-background border-border text-foreground">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {storyTypes.map((type) => (
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">
                  Descrição
                </label>
                <AIDescriptionButton
                  title={formData.title}
                  type="story"
                  onGenerated={(description) => setFormData({ ...formData, description: description as string })}
                />
              </div>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Descrição da história"
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

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Critérios de Aceitação
              </label>
              <Textarea
                value={formData.acceptance_criteria}
                onChange={(e) => setFormData({ ...formData, acceptance_criteria: e.target.value })}
                placeholder="Critérios de aceitação"
                className="bg-background border-border text-foreground h-24"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Definição de Pronto *
              </label>
              <Textarea
                value={formData.definition_of_done}
                onChange={(e) => setFormData({ ...formData, definition_of_done: e.target.value })}
                placeholder="Descreva quando esta história será considerada pronta"
                className="bg-background border-border text-foreground h-24"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Responsável
              </label>
              <Select
                value={formData.assigned_to_email || "unassigned"}
                onValueChange={(value) => setFormData({ ...formData, assigned_to_email: value === "unassigned" ? "" : value })}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sem responsável</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.user_id} value={user.email}>
                      <div className="flex items-center gap-2">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name || user.email}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <span>{user.name || user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Story Points
                </label>
                <Select
                  value={formData.story_points || "none"}
                  onValueChange={(value) => setFormData({ ...formData, story_points: value === "none" ? "" : value })}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não estimado</SelectItem>
                    {complexityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                  </SelectContent>
                </Select>
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
        <StoryTypeQuickCreateModal
          onClose={() => setShowTypeModal(false)}
          onCreate={(newType) => {
            setStoryTypes([...storyTypes, newType]);
            setFormData({ ...formData, story_type_id: newType.id });
          }}
        />
      )}
    </>
  );
}
