import React, { useState } from "react";
import { withAuth } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, LayoutGrid, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";

interface BoardModalProps {
  board?: any;
  onClose: () => void;
}

export default function BoardModal({ board, onClose }: BoardModalProps) {
  const { currentTenantId } = useTenant();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: board?.name || "",
    description: board?.description || "",
    columns: board?.columns || [
      { id: "todo", name: "A Fazer", color: "#3b82f6", order: 0 },
      { id: "in_progress", name: "Em Progresso", color: "#eab308", order: 1 },
      { id: "review", name: "Revisão", color: "#8b5cf6", order: 2 },
      { id: "done", name: "Concluído", color: "#22c55e", order: 3 }
    ]
  });

  const addColumn = () => {
    const newColumn = {
      id: `column_${Date.now()}`,
      name: "Nova Coluna",
      color: "#64748b",
      order: formData.columns.length
    };
    setFormData({
      ...formData,
      columns: [...formData.columns, newColumn]
    });
  };

  const removeColumn = (index: number) => {
    const newColumns = formData.columns.filter((_, i) => i !== index);
    setFormData({ ...formData, columns: newColumns });
  };

  const updateColumn = (index: number, field: string, value: any) => {
    const newColumns = [...formData.columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setFormData({ ...formData, columns: newColumns });
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório.");
      return;
    }

    if (formData.columns.length === 0) {
      toast.error("Adicione pelo menos uma coluna.");
      return;
    }

    setIsSaving(true);
    try {
      const boardData = {
        name: formData.name,
        description: formData.description || null,
        columns: formData.columns,
        tenant_id: currentTenantId
      };

      console.log("💾 Saving board with data:", boardData);

      if (board) {
        await withAuth(async (client) => {
          const { error } = await client
            .from('prj_board' as any)
            .update(boardData)
            .eq('id', board.id) as any;

          if (error) throw error;
        });
        toast.success("Board atualizado com sucesso.");
      } else {
        await withAuth(async (client) => {
          const { error } = await client
            .from('prj_board' as any)
            .insert(boardData) as any;

          if (error) throw error;
        });
        toast.success("Board criado com sucesso.");
      }
      onClose();
    } catch (error) {
      console.error("Error saving board:", error);
      toast.error("Não foi possível salvar o board.");
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
              <LayoutGrid className="w-5 h-5 text-primary" />
              <CardTitle className="text-foreground">
                {board ? "Editar Board" : "Novo Board"}
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

        <CardContent className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Nome do Board *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Desenvolvimento Ágil"
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
              placeholder="Descrição do board"
              className="bg-background border-border text-foreground h-20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">
                Colunas *
              </label>
              <Button onClick={addColumn} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Coluna
              </Button>
            </div>

            <div className="space-y-3">
              {formData.columns.map((column, index) => (
                <Card key={column.id} className="border-border bg-accent/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-5 h-5 text-muted-foreground mt-2 cursor-move" />
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <Input
                          value={column.name}
                          onChange={(e) => updateColumn(index, 'name', e.target.value)}
                          placeholder="Nome da coluna"
                          className="bg-background border-border text-foreground"
                        />
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={column.color}
                            onChange={(e) => updateColumn(index, 'color', e.target.value)}
                            className="w-16 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={column.color}
                            onChange={(e) => updateColumn(index, 'color', e.target.value)}
                            className="flex-1 bg-background border-border text-foreground"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeColumn(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
  );
}
