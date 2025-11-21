import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AISprintGoalButtonProps {
  onGoalGenerated: (goal: string) => void;
  sprintName: string;
  projectId: string;
}

export default function AISprintGoalButton({ 
  onGoalGenerated, 
  sprintName, 
  projectId 
}: AISprintGoalButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateGoal = async () => {
    if (!sprintName || !projectId) {
      toast.error("Nome do sprint e projeto são obrigatórios");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sprint-goal', {
        body: { sprintName, projectId }
      });

      if (error) throw error;

      if (data?.goal) {
        onGoalGenerated(data.goal);
        toast.success("Meta gerada com sucesso!");
      } else {
        throw new Error("Nenhuma meta foi gerada");
      }
    } catch (error) {
      console.error("Erro ao gerar meta:", error);
      toast.error("Erro ao gerar meta com IA");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleGenerateGoal}
      disabled={isGenerating || !sprintName || !projectId}
    >
      <Sparkles className="w-4 h-4 mr-2" />
      {isGenerating ? "Gerando..." : "Gerar Meta com IA"}
    </Button>
  );
}
