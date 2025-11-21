import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface Risk {
  id: string;
  title: string;
  probability: number; // 1-5
  impact: number; // 1-5
  status: string;
}

interface RiskMatrixProps {
  risks: Risk[];
  onRiskClick?: (risk: Risk) => void;
}

export default function RiskMatrix({ risks, onRiskClick }: RiskMatrixProps) {
  // Matriz 5x5: Probabilidade (Y) vs Impacto (X)
  const matrix: (Risk[] | null)[][] = Array.from({ length: 5 }, () => Array(5).fill(null));

  // Preencher matriz com riscos
  risks.forEach(risk => {
    const row = 5 - risk.probability; // Inverter para ter mais probabilidade no topo
    const col = risk.impact - 1;
    
    if (!matrix[row][col]) {
      matrix[row][col] = [];
    }
    matrix[row][col]!.push(risk);
  });

  // Determinar cor da célula baseado no nível de risco
  const getCellColor = (probability: number, impact: number): string => {
    const score = (5 - probability + 1) * (impact + 1);
    
    if (score <= 6) return 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30';
    if (score <= 12) return 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30';
    if (score <= 20) return 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30';
    return 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30';
  };

  const getRiskLevelLabel = (probability: number, impact: number): { label: string; badgeClass: string } => {
    const score = (5 - probability + 1) * (impact + 1);
    
    if (score <= 6) return { label: 'Baixo', badgeClass: 'bg-green-500 text-white border-green-600' };
    if (score <= 12) return { label: 'Médio', badgeClass: 'bg-yellow-500 text-white border-yellow-600' };
    if (score <= 20) return { label: 'Alto', badgeClass: 'bg-orange-500 text-white border-orange-600' };
    return { label: 'Crítico', badgeClass: 'bg-red-500 text-white border-red-600' };
  };

  const probabilityLabels = ['Muito Alta', 'Alta', 'Média', 'Baixa', 'Muito Baixa'];
  const impactLabels = ['Muito Baixo', 'Baixo', 'Médio', 'Alto', 'Muito Alto'];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Matriz de Riscos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Visualização dos riscos por probabilidade e impacto
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Legenda Superior - Impacto */}
            <div className="flex items-center mb-2">
              <div className="w-32 flex-shrink-0" /> {/* Espaço para label de probabilidade */}
              <div className="flex-1 text-center">
                <p className="text-sm font-bold text-foreground mb-2">IMPACTO →</p>
              </div>
            </div>

            <div className="flex">
              {/* Label de Probabilidade (Vertical) */}
              <div className="w-32 flex-shrink-0 flex flex-col justify-center items-end pr-4">
                <p className="text-sm font-bold text-foreground transform -rotate-90 whitespace-nowrap origin-center">
                  ← PROBABILIDADE
                </p>
              </div>

              {/* Matriz */}
              <div className="flex-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="w-24 p-2" /> {/* Canto superior esquerdo vazio */}
                      {impactLabels.map((label, idx) => (
                        <th key={idx} className="p-2 text-xs font-semibold text-center text-muted-foreground min-w-[120px]">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        <td className="p-2 text-xs font-semibold text-right text-muted-foreground whitespace-nowrap">
                          {probabilityLabels[rowIdx]}
                        </td>
                        {row.map((cell, colIdx) => {
                          const riskLevel = getRiskLevelLabel(rowIdx, colIdx);
                          return (
                            <td
                              key={colIdx}
                              className={`border border-border p-2 h-24 align-top ${getCellColor(rowIdx, colIdx)} transition-colors cursor-pointer`}
                            >
                              <div className="text-center">
                                <Badge
                                  className={`text-[10px] mb-2 ${riskLevel.badgeClass}`}
                                >
                                  {riskLevel.label}
                                </Badge>
                                {cell && cell.length > 0 && (
                                  <div className="space-y-1">
                                    {cell.map(risk => (
                                      <div
                                        key={risk.id}
                                        onClick={() => onRiskClick?.(risk)}
                                        className="text-xs bg-card p-1 rounded hover:bg-accent cursor-pointer truncate"
                                        title={risk.title}
                                      >
                                        {risk.title}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legenda */}
            <div className="mt-4 flex items-center gap-4 justify-center flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500/20 border border-green-500/30 rounded" />
                <span className="text-xs text-muted-foreground">Baixo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500/20 border border-yellow-500/30 rounded" />
                <span className="text-xs text-muted-foreground">Médio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500/20 border border-orange-500/30 rounded" />
                <span className="text-xs text-muted-foreground">Alto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500/20 border border-red-500/30 rounded" />
                <span className="text-xs text-muted-foreground">Crítico</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
