import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ProjectHealthChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title?: string;
}

const COLORS = {
  healthy: 'hsl(142, 76%, 36%)',
  at_risk: 'hsl(48, 96%, 53%)',
  critical: 'hsl(0, 84%, 60%)'
};

const LABELS = {
  healthy: 'Saudável',
  at_risk: 'Em Risco',
  critical: 'Crítico'
};

export default function ProjectHealthChart({ data, title = "Saúde dos Projetos" }: ProjectHealthChartProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${LABELS[entry.name as keyof typeof LABELS]}: ${entry.value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
