import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AIDescriptionButtonProps {
  title: string;
  type: 'epic' | 'feature' | 'story' | 'task' | 'acceptance_criteria';
  onGenerated: (description: string | any[]) => void;
  disabled?: boolean;
  className?: string;
  existingDescription?: string;
}

export default function AIDescriptionButton({ 
  title, 
  type, 
  onGenerated,
  disabled = false,
  className = "",
  existingDescription = ""
}: AIDescriptionButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDescription = async () => {
    if (!title || !title.trim()) {
      toast.error("Título vazio", {
        description: "Informe um título antes de gerar a descrição"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const typeLabels: Record<string, string> = {
        epic: "épico",
        feature: "funcionalidade",
        story: "história de usuário",
        task: "tarefa",
        acceptance_criteria: "critérios de aceitação"
      };

      const typeLabel = typeLabels[type] || type;

      let prompt = "";
      
      if (type === "acceptance_criteria") {
        prompt = `Com base no seguinte título de história de usuário: "${title}"

Gere uma lista de critérios de aceitação claros e objetivos em formato de lista JSON.
Cada critério deve ser específico, testável e focado no comportamento esperado.

Retorne APENAS um array JSON com objetos no formato: [{"text": "critério aqui", "completed": false}]

IMPORTANTE: Não inclua marcações de código como \`\`\`json ou \`\`\`. Retorne apenas o JSON puro.`;
      } else if (type === "story") {
        prompt = `Como Product Owner, preciso criar uma história de usuário detalhada.

Título: "${title}"

Gere uma descrição completa no formato de história de usuário seguindo o padrão:
- Como [tipo de usuário]
- Eu quero [objetivo/ação]
- Para que [benefício/valor]

Adicione também:
- Contexto adicional relevante
- Possíveis casos de uso
- Considerações importantes

A descrição deve ser clara, objetiva e focada no valor para o usuário.
Use HTML simples para formatação (tags <p>, <ul>, <li>, <strong>).

IMPORTANTE: Retorne APENAS o HTML puro, SEM marcações de código como \`\`\`html ou \`\`\`. Comece direto com as tags HTML.`;
      } else if (type === "task") {
        prompt = `Preciso criar uma tarefa técnica com descrição detalhada.

Título: "${title}"

Gere uma descrição técnica que inclua:
- Objetivo claro da tarefa
- Principais atividades a serem realizadas
- Possíveis dependências ou pré-requisitos
- Considerações técnicas relevantes

A descrição deve ser objetiva e orientada à execução.
Use HTML simples para formatação (tags <p>, <ul>, <li>, <strong>).

IMPORTANTE: Retorne APENAS o HTML puro, SEM marcações de código. Comece direto com as tags HTML.`;
      } else if (type === "feature") {
        prompt = `Preciso criar uma descrição detalhada para uma funcionalidade.

Título: "${title}"

Gere uma descrição que inclua:
- Objetivo da funcionalidade
- Benefícios para o usuário/negócio
- Principais componentes ou módulos envolvidos
- Escopo geral

A descrição deve ser clara e orientada a produto.
Use HTML simples para formatação (tags <p>, <ul>, <li>, <strong>).

IMPORTANTE: Retorne APENAS o HTML puro, SEM marcações de código. Comece direto com as tags HTML.`;
      } else if (type === "epic") {
        prompt = `Preciso criar uma descrição detalhada para um épico.

Título: "${title}"

Gere uma descrição que inclua:
- Visão geral do épico
- Objetivos estratégicos
- Valor para o negócio
- Principais temas ou áreas envolvidas

A descrição deve ser abrangente e estratégica.
Use HTML simples para formatação (tags <p>, <ul>, <li>, <strong>).

IMPORTANTE: Retorne APENAS o HTML puro, SEM marcações de código. Comece direto com as tags HTML.`;
      }

      // Simular chamada de IA (em produção, fazer chamada real para API)
      // Como não temos integração real com IA, vamos gerar um placeholder
      
      toast.info("Gerando com IA...", {
        description: `Gerando ${typeLabel} para: ${title}`
      });

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1500));

      let generatedContent: string | any[];
      
      if (type === "acceptance_criteria") {
        generatedContent = [
          { text: `O sistema deve validar os dados de entrada corretamente`, completed: false },
          { text: `A interface deve ser responsiva e funcionar em dispositivos móveis`, completed: false },
          { text: `O usuário deve receber feedback visual ao realizar ações`, completed: false },
        ];
      } else {
        generatedContent = `<p><strong>Descrição gerada automaticamente para:</strong> ${title}</p>
<p>Esta é uma descrição preliminar que deve ser revisada e ajustada conforme necessário.</p>
<ul>
  <li>Objetivo principal da ${typeLabel}</li>
  <li>Benefícios esperados</li>
  <li>Considerações importantes</li>
</ul>
<p><em>Nota: Esta descrição foi gerada automaticamente e deve ser revisada.</em></p>`;
      }

      onGenerated(generatedContent);
      
      toast.success("Descrição gerada!", {
        description: "Revise e ajuste conforme necessário"
      });
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error("Erro ao gerar", {
        description: "Não foi possível gerar a descrição com IA"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={generateDescription}
      disabled={disabled || isGenerating || !title}
      className={className}
    >
      <Sparkles className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
      {isGenerating ? "Gerando..." : "Gerar com IA"}
    </Button>
  );
}
