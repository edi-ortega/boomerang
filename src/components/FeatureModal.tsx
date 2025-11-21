import React, { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X, Save, Zap } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import { useProjects } from "@/hooks/useProjects";
import { useEpics } from "@/hooks/useBacklog";
import { sendMentionNotifications } from "@/lib/mention-helper";

interface FeatureModalProps {
  feature?: any;
  projectId?: string;
  epicId?: string;
  onClose: () => void;
  onSave?: (feature: any) => void;
}

export default function FeatureModal({ feature, projectId, epicId, onClose, onSave }: FeatureModalProps) {
  const { currentTenantId } = useTenant();
  const [isSaving, setIsSaving] = useState(false);
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(feature?.project_id || projectId || "");
  const { epics } = useEpics(selectedProjectId);
  
  const [formData, setFormData] = useState({
    title: feature?.title || "",
    description: feature?.description || "",
    notes: feature?.notes || "",
    project_id: feature?.project_id || projectId || "",
    epic_id: feature?.epic_id || epicId || "",
    priority: feature?.priority || "medium",
    status: feature?.status || "backlog",
    start_date: feature?.start_date || "",
    target_date: feature?.target_date || "",
    progress: feature?.progress || 0
  });
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);

  useEffect(() => {
    setSelectedProjectId(formData.project_id);
  }, [formData.project_id]);

  const handleSave = async () => {
    if (!formData.title || !formData.project_id) {
      toast.error("Título e projeto são obrigatórios.");
      return;
    }

    setIsSaving(true);
    try {
      // Garantir que temos o client_id correto
      if (!currentTenantId) {
        toast.error("Sessão inválida. Por favor, faça login novamente.");
        return;
      }

      const supabase = await getSupabaseClient();

      const featureData = {
        title: formData.title,
        description: formData.description || null,
        project_id: formData.project_id,
        epic_id: formData.epic_id || null,
        priority: formData.priority,
        status: formData.status,
        start_date: formData.start_date || null,
        target_date: formData.target_date || null,
        progress: formData.progress || 0,
        client_id: currentTenantId,
      };

      if (feature) {
        // Update
        const { data: updated, error } = await supabase
          .from('prj_feature')
          .update(featureData)
          .eq('id', feature.id)
          .select()
          .single();

        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        
        // Enviar notificações para usuários mencionados
        if (mentionedUsers.length > 0) {
          const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
          await sendMentionNotifications({
            mentionedEmails: mentionedUsers,
            entityType: 'feature',
            entityId: updated.id,
            entityTitle: formData.title,
            mentionedBy: currentUser.name || currentUser.email
          });
        }
        
        toast.success("Funcionalidade atualizada com sucesso.");
        if (onSave) onSave(updated);
      } else {
        // Create
        const { data: created, error } = await supabase
          .from('prj_feature')
          .insert(featureData)
          .select()
          .single();

        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        
        // Enviar notificações para usuários mencionados
        if (mentionedUsers.length > 0) {
          const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
          await sendMentionNotifications({
            mentionedEmails: mentionedUsers,
            entityType: 'feature',
            entityId: created.id,
            entityTitle: formData.title,
            mentionedBy: currentUser.name || currentUser.email
          });
        }
        
        toast.success("Funcionalidade criada com sucesso.");
        if (onSave) onSave(created);
      }
      onClose();
    } catch (error: any) {
      console.error("Error saving feature:", error);
      
      // Tratamento específico para erros de constraint
      let errorMessage = "Não foi possível salvar a funcionalidade.";
      
      if (error?.message) {
        // Erros de constraint CHECK
        if (error.message.includes("prj_feature_status_check")) {
          errorMessage = "Status inválido. Use: Backlog, Em Progresso, Concluído ou Cancelado.";
        } else if (error.message.includes("prj_feature_priority_check")) {
          errorMessage = "Prioridade inválida. Use: Baixa, Média, Alta ou Urgente.";
        } else if (error.message.includes("violates check constraint")) {
          errorMessage = "Um dos valores informados não é válido. Verifique os campos e tente novamente.";
        }
        // Erros de foreign key
        else if (error.message.includes("violates foreign key constraint")) {
          if (error.message.includes("project_id")) {
            errorMessage = "Projeto selecionado não existe. Por favor, selecione um projeto válido.";
          } else if (error.message.includes("epic_id")) {
            errorMessage = "Épico selecionado não existe. Por favor, selecione um épico válido.";
          }
        }
        // Erros de campos obrigatórios
        else if (error.message.includes("null value in column") && error.message.includes("violates not-null constraint")) {
          errorMessage = "Todos os campos obrigatórios devem ser preenchidos.";
        }
        // Outros erros
        else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-border bg-card">
        <CardHeader className="sticky top-0 bg-card z-10 border-b border-border">
          <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <CardTitle className="text-foreground">
                  {feature ? "Editar Funcionalidade" : "Nova Funcionalidade"}
                </CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Projeto */}
          {projectId ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Projeto</label>
              <Input 
                value={projects.find(p => p.id === projectId)?.name || ""} 
                disabled 
                className="bg-muted" 
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Projeto *</label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, project_id: value, epic_id: "" });
                  setSelectedProjectId(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Épico */}
          {epicId ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Épico</label>
              <Input 
                value={epics.find(e => e.id === epicId)?.title || ""} 
                disabled 
                className="bg-muted" 
              />
            </div>
          ) : formData.project_id ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Épico</label>
              <Select
                value={formData.epic_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, epic_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o épico (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {epics.map((epic) => (
                    <SelectItem key={epic.id} value={epic.id}>
                      {epic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Título */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Título *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Digite o título da feature"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Descreva a funcionalidade"
            />
          </div>

          {/* Observações com Menções */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Observações</label>
            <MentionTextarea
              value={formData.notes}
              onChange={(value) => setFormData({ ...formData, notes: value })}
              onMention={setMentionedUsers}
              placeholder="Adicione observações e mencione pessoas com @"
              rows={3}
            />
          </div>

          {/* Priority e Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Prioridade</label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data Inicial</label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data Alvo</label>
              <Input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              />
            </div>
          </div>

          {/* Progresso */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Progresso</label>
              <span className="text-sm font-semibold text-primary">{formData.progress}%</span>
            </div>
            <Slider
              value={[formData.progress]}
              onValueChange={(value) => setFormData({ ...formData, progress: value[0] })}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
