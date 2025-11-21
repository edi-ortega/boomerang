import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Folder } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";

interface ProjectModalProps {
  project?: any;
  onClose: () => void;
  onSave?: (project: any) => void;
}

export default function ProjectModal({ project, onClose, onSave }: ProjectModalProps) {
  const { currentTenantId } = useTenant();
  const [isSaving, setIsSaving] = useState(false);
  const [boards, setBoards] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: project?.name || "",
    code: project?.code || "",
    description: project?.description || "",
    methodology: project?.methodology || "scrum",
    status: project?.status || "planning",
    priority: project?.priority || "medium",
    health_status: project?.health_status || "healthy",
    board_id: project?.board_id || "",
    color: project?.color || "#3b82f6",
    start_date: project?.start_date || "",
    end_date: project?.end_date || "",
    progress: project?.progress || 0
  });

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('prj_board' as any)
        .select('*')
        .eq('tenant_id', currentTenantId)
        .order('name') as any;

      if (error) throw error;
      setBoards(data || []);
    } catch (error) {
      console.error("Error loading boards:", error);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast.error("Nome e código são obrigatórios.");
      return;
    }

    setIsSaving(true);
    try {
      const projectData = {
        ...formData,
        tenant_id: currentTenantId,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        board_id: formData.board_id === "none" ? null : formData.board_id
      };

      if (project) {
        // Update
        const { data: updated, error } = await supabase
          .from('prj_project' as any)
          .update(projectData)
          .eq('id', project.id)
          .select()
          .maybeSingle() as any;

        if (error) throw error;
        toast.success("Projeto atualizado com sucesso.");
        if (onSave) onSave(updated);
      } else {
        // Create
        const { data: created, error } = await supabase
          .from('prj_project' as any)
          .insert(projectData)
          .select()
          .maybeSingle() as any;

        if (error) throw error;
        toast.success("Projeto criado com sucesso.");
        if (onSave) onSave(created);
      }
      onClose();
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Não foi possível salvar o projeto.");
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
              <Folder className="w-5 h-5 text-primary" />
              <CardTitle className="text-foreground">
                {project ? "Editar Projeto" : "Novo Projeto"}
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
              Nome do Projeto *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Sistema de Gestão"
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Código *
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Ex: SYSGEST"
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Descrição
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do projeto"
              className="bg-background border-border text-foreground h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Metodologia
              </label>
              <Select
                value={formData.methodology}
                onValueChange={(value) => setFormData({ ...formData, methodology: value })}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scrum">Scrum</SelectItem>
                  <SelectItem value="kanban">Kanban</SelectItem>
                  <SelectItem value="agile">Ágil</SelectItem>
                  <SelectItem value="waterfall">Waterfall</SelectItem>
                  <SelectItem value="hybrid">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Board
              </label>
              <Select
                value={formData.board_id}
                onValueChange={(value) => setFormData({ ...formData, board_id: value })}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecione um board" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  <SelectItem value="planning">Planejamento</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="on_hold">Pausado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Saúde do Projeto
              </label>
              <Select
                value={formData.health_status}
                onValueChange={(value) => setFormData({ ...formData, health_status: value })}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Saudável</SelectItem>
                  <SelectItem value="at_risk">Em Risco</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                Cor
              </label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 bg-background border-border text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Data de Início
              </label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Data de Término
              </label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Progresso: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              className="w-full"
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
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
