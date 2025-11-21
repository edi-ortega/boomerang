import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, CheckCircle, XCircle } from "lucide-react";

/**
 * Componente educacional que mostra exemplos de boas e más metas de sprint
 * Pode ser usado em tooltips, help sections, ou modals
 */
export default function SprintGoalExamples() {
  const goodExamples = [
    {
      goal: "Entregar sistema de pagamento via PIX totalmente funcional e testado, permitindo que usuários realizem transferências instantâneas com segurança",
      points: "Clara, mensurável, focada em valor"
    },
    {
      goal: "Implementar e validar o fluxo completo de cadastro de usuários, desde o registro até a verificação de email, garantindo 100% de cobertura de testes",
      points: "Específica, tem critério de sucesso definido"
    },
    {
      goal: "Lançar módulo de relatórios gerenciais com dashboards interativos e exportação em PDF, permitindo aos gestores visualizarem KPIs em tempo real",
      points: "Orientada a resultado, clara sobre o benefício"
    }
  ];

  const badExamples = [
    {
      goal: "Fazer tarefas do sprint",
      reason: "Muito vaga, não define o resultado esperado"
    },
    {
      goal: "US-123, US-124, US-125, US-126",
      reason: "Lista de tarefas, não é uma meta coesa"
    },
    {
      goal: "Trabalhar no projeto e entregar algumas funcionalidades importantes",
      reason: "Não específica, sem critérios mensuráveis"
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          ✅ Boas Metas de Sprint
        </h3>
        <div className="space-y-3">
          {goodExamples.map((example, index) => (
            <Card key={index} className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-foreground mb-2 italic">
                  "{example.goal}"
                </p>
                <Badge className="bg-green-500/20 text-green-600 text-xs">
                  {example.points}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          ❌ Metas Inadequadas
        </h3>
        <div className="space-y-3">
          {badExamples.map((example, index) => (
            <Card key={index} className="border-red-500/30 bg-red-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-foreground mb-2 italic line-through opacity-60">
                  "{example.goal}"
                </p>
                <Badge variant="outline" className="border-red-500/50 text-red-600 text-xs">
                  Problema: {example.reason}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-2">Dicas para uma boa meta de sprint:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Seja específica sobre o que será entregue</li>
                <li>• Foque no valor para o usuário/negócio, não nas tarefas</li>
                <li>• Tenha critérios claros de sucesso</li>
                <li>• Seja alcançável dentro do prazo do sprint</li>
                <li>• Inspire e alinhe o time em torno de um objetivo comum</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
