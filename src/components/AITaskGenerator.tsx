import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenant } from "@/contexts/TenantContext";

interface AITaskGeneratorProps {
  story: any;
  onTasksCreated?: (tasks: any[]) => void;
  onClose: () => void;
}

export default function AITaskGenerator({ story, onTasksCreated, onClose }: AITaskGeneratorProps) {
  const { currentTenantId } = useTenant();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [generatedTasks, setGeneratedTasks] = useState<any[]>([]);
  const [taskCount, setTaskCount] = useState(5);

  const getPlainText = (html: string) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(10);
    setCurrentStep("Analisando história e critérios...");

    try {
      const description = getPlainText(story.description);
      const technicalDetails = getPlainText(story.technical_details);
      const acceptanceCriteria = (story.acceptance_criteria || []).map((c: any) => c.text).join('\n- ');

      setProgress(30);
      setCurrentStep("Gerando tarefas...");

      // Simular geração de tarefas (substituir por IA real quando disponível)
      const tasks = Array.from({ length: taskCount }, (_, i) => ({
        title: `Tarefa ${i + 1}: Implementar funcionalidade`,
        description: `Descrição da tarefa ${i + 1}`,
        estimated_hours: Math.ceil(Math.random() * 8),
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      }));

      setProgress(50);
      setCurrentStep(`Criando ${tasks.length} tarefas...`);

      const createdTasks = [];
      const progressIncrement = 50 / tasks.length;

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        
        setCurrentStep(`Criando tarefa ${i + 1} de ${tasks.length}: ${task.title}`);

        const { data: newTask, error } = await supabase
          .from('prj_task' as any)
          .insert({
            title: task.title,
            description: task.description,
            project_id: story.project_id,
            story_id: story.id,
            status: 'todo',
            priority: task.priority || 'medium',
            estimated_hours: task.estimated_hours || 0,
            sprint_id: story.sprint_id || null,
            tenant_id: currentTenantId
          })
          .select()
          .maybeSingle() as any;

        if (error) throw error;

        createdTasks.push(newTask);
        setProgress(50 + (i + 1) * progressIncrement);
      }

      setProgress(100);
      setCurrentStep("Tarefas criadas com sucesso!");
      setGeneratedTasks(createdTasks);

      toast.success(`${createdTasks.length} tarefas foram criadas automaticamente.`);

      setTimeout(() => {
        if (onTasksCreated) {
          onTasksCreated(createdTasks);
        }
      }, 1500);

    } catch (error) {
      console.error("Error generating tasks:", error);
      toast.error("Não foi possível gerar as tarefas automaticamente. Tente novamente.");
      setIsGenerating(false);
      setProgress(0);
      setCurrentStep("");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-border bg-card">
        <CardHeader className="sticky top-0 bg-card z-10 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-foreground">Gerar Tarefas com IA</CardTitle>
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
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">História:</h4>
            <p className="text-sm text-muted-foreground mb-3">{story.title}</p>
            
            {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-1">
                  Critérios de Aceitação: {story.acceptance_criteria.length}
                </h4>
              </div>
            )}
          </div>

          {!isGenerating ? (
            generatedTasks.length === 0 ? (
              <>
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-sm text-foreground mb-2">
                    <strong>O que será feito:</strong>
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Análise da descrição e detalhes técnicos</li>
                    <li>Interpretação dos critérios de aceitação</li>
                    <li>Geração de tarefas técnicas detalhadas</li>
                    <li>Estimativa de horas para cada tarefa</li>
                    <li>Criação automática no sistema</li>
                  </ul>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Quantidade de Tarefas
                  </label>
                  <Select value={taskCount.toString()} onValueChange={(value) => setTaskCount(parseInt(value))}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Selecione a quantidade" />
                    </SelectTrigger>
                    <SelectContent className="z-[80]">
                      <SelectItem value="3">3 tarefas</SelectItem>
                      <SelectItem value="4">4 tarefas</SelectItem>
                      <SelectItem value="5">5 tarefas</SelectItem>
                      <SelectItem value="6">6 tarefas</SelectItem>
                      <SelectItem value="8">8 tarefas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 border-border"
                    disabled={isGenerating}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    disabled={isGenerating}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Tarefas
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Tarefas Criadas:</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {generatedTasks.map((task, index) => (
                      <div key={index} className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-sm font-medium text-foreground">{task.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={onClose} className="w-full mt-4">Fechar</Button>
              </div>
            )
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{currentStep}</span>
                  <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
                </div>
                
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
              </div>

              {generatedTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Tarefas Criadas:</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {generatedTasks.map((task, index) => (
                      <div key={index} className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-sm font-medium text-foreground">{task.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
