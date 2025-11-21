import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { bmr } from "@/api/boomerangClient";
import { useToast } from "@/hooks/use-toast";

interface AIGanttGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  tenantId: string;
  onGenerated?: () => void;
}

export default function AIGanttGeneratorModal({ 
  open, 
  onClose, 
  projectId, 
  tenantId,
  onGenerated 
}: AIGanttGeneratorModalProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(30);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt necessário",
        description: "Por favor, descreva o que deseja gerar",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Here you would integrate with an AI service
      // For now, we'll create a mock structure
      
      const phases = [
        { name: "Planejamento", duration: Math.ceil(duration * 0.2) },
        { name: "Desenvolvimento", duration: Math.ceil(duration * 0.5) },
        { name: "Testes", duration: Math.ceil(duration * 0.2) },
        { name: "Deploy", duration: Math.ceil(duration * 0.1) }
      ];

      let currentDate = new Date();
      
      for (const phase of phases) {
        const startDate = new Date(currentDate);
        const endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + phase.duration);
        
        // Create phase task
        await bmr.entities.Task.create({
          project_id: projectId,
          tenant_id: tenantId,
          title: phase.name,
          description: `Fase ${phase.name} gerada por IA`,
          start_date: startDate.toISOString(),
          due_date: endDate.toISOString(),
          status: "todo",
          priority: "medium",
          progress: 0,
          is_milestone: false
        });
        
        currentDate = new Date(endDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      toast({
        title: "Cronograma gerado!",
        description: `${phases.length} fases criadas com sucesso`,
        variant: "default"
      });

      if (onGenerated) {
        onGenerated();
      }
      
      onClose();
    } catch (error) {
      console.error("Error generating gantt:", error);
      toast({
        title: "Erro ao gerar",
        description: "Não foi possível gerar o cronograma",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Gerador de Gantt com IA
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="prompt">Descreva o projeto</Label>
            <Textarea
              id="prompt"
              placeholder="Ex: Criar um sistema de gestão com módulos de cadastro, relatórios e dashboard"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="duration">Duração estimada (dias)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="365"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              className="mt-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-primary"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Cronograma
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
