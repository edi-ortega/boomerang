import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Target } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import { useProjects } from "@/hooks/useProjects";
import { sendMentionNotifications } from "@/lib/mention-helper";

interface EpicModalProps {
  epic?: any;
  projectId?: string;
  onClose: () => void;
  onSave?: (epic: any) => void;
  viewMode?: boolean;
}

export default function EpicModal({ epic, projectId, onClose, onSave, viewMode = false }: EpicModalProps) {
  const { currentTenantId } = useTenant();
  const [isSaving, setIsSaving] = useState(false);
  const { projects } = useProjects();
  const [formData, setFormData] = useState({
    title: epic?.title || "",
    description: epic?.description || "",
    notes: epic?.notes || "",
    project_id: epic?.project_id || projectId || "",
    priority: epic?.priority || "medium",
    status: epic?.status || "planning",
    start_date: epic?.start_date || "",
    end_date: epic?.end_date || "",
    progress: epic?.progress || 0
  });
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);

  const handleSave = async () => {
    if (!formData.title || !formData.project_id) {
      toast.error("Título e projeto são obrigatórios.");
      return;
    }

    setIsSaving(true);
    try {
      const epicData = {
        ...formData,
        client_id: currentTenantId,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (epic) {
        // Update
        const { data: updated, error } = await supabase
          .from('prj_epic' as any)
          .update(epicData)
          .eq('id', epic.id)
          .select()
          .maybeSingle() as any;

        if (error) throw error;
        toast.success("Épico atualizado com sucesso.");
        if (onSave) onSave(updated);
        
        // Enviar notificações para usuários mencionados
        if (mentionedUsers.length > 0) {
          const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
          await sendMentionNotifications({
            mentionedEmails: mentionedUsers,
            entityType: "epic",
            entityId: epic.id,
            entityTitle: formData.title,
            comment: formData.notes,
            mentionedBy: currentUser.name || currentUser.email,
          });
        }
      } else {
        // Create
        const { data: created, error } = await supabase
          .from('prj_epic' as any)
          .insert(epicData)
          .select()
          .maybeSingle() as any;

        if (error) throw error;
        toast.success("Épico criado com sucesso.");
        if (onSave) onSave(created);
        
        // Enviar notificações para usuários mencionados
        if (mentionedUsers.length > 0 && created) {
          const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
          await sendMentionNotifications({
            mentionedEmails: mentionedUsers,
            entityType: "epic",
            entityId: created.id,
            entityTitle: formData.title,
            comment: formData.notes,
            mentionedBy: currentUser.name || currentUser.email,
          });
        }
      }
      onClose();
    } catch (error) {
      console.error("Error saving epic:", error);
      toast.error("Não foi possível salvar o épico.");
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
              <Target className="w-5 h-5 text-primary" />
              <CardTitle className="text-foreground">
                {viewMode ? "Visualizar Épico" : epic ? "Editar Épico" : "Novo Épico"}
              </CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Projeto */}
          {!projectId && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Projeto *</label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                disabled={viewMode}
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
          {projectId && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Projeto</label>
              <Input value={projects.find(p => p.id === projectId)?.name || ""} disabled className="bg-muted" />
            </div>
          )}

          {/* Título */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Título *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Digite o título do épico"
              disabled={viewMode}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Descreva o épico..."
              className="min-h-[200px]"
            />
          </div>

          {/* Priority e Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Prioridade</label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                disabled={viewMode}
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
                disabled={viewMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planejamento</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observações com Menções */}
          {!viewMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Observações</label>
              <MentionTextarea
                value={formData.notes}
                onChange={(value) => setFormData({ ...formData, notes: value })}
                onMention={setMentionedUsers}
                placeholder="Digite suas observações. Use @ para mencionar pessoas..."
                rows={3}
              />
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data Inicial</label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                disabled={viewMode}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data Final</label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                disabled={viewMode}
              />
            </div>
          </div>

          {/* Progresso */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Progresso (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
              disabled={viewMode}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              {viewMode ? "Fechar" : "Cancelar"}
            </Button>
            {!viewMode && (
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
