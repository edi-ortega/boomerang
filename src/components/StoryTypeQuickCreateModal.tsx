import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";

interface StoryTypeQuickCreateModalProps {
  onClose: () => void;
  onCreate?: (type: any) => void;
}

export default function StoryTypeQuickCreateModal({ onClose, onCreate }: StoryTypeQuickCreateModalProps) {
  const { currentTenantId } = useTenant();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    color: "#3b82f6",
    order: 0
  });

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast.error("Nome e código são obrigatórios.");
      return;
    }

    setIsSaving(true);
    try {
      const { data: newType, error } = await supabase
        .from('prj_story_type' as any)
        .insert({
          ...formData,
          tenant_id: currentTenantId
        })
        .select()
        .maybeSingle() as any;

      if (error) throw error;

      toast.success(`O tipo "${formData.name}" foi criado com sucesso.`);
      
      if (onCreate) {
        onCreate(newType);
      }
      onClose();
    } catch (error) {
      console.error("Error creating story type:", error);
      toast.error("Não foi possível criar o tipo de história.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="max-w-md w-full border-2 border-border bg-card">
        <CardHeader className="border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <CardTitle className="text-foreground">Novo Tipo de História</CardTitle>
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
              Nome *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Feature"
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
              placeholder="Ex: FEATURE"
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
              placeholder="Descrição do tipo"
              className="bg-background border-border text-foreground h-20"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
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

          <div className="flex gap-3 pt-4">
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
              {isSaving ? "Criando..." : "Criar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
