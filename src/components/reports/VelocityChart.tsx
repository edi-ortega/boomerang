import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface VelocityChartProps {
  data: Array<{
    sprint: string;
    planned: number;
    completed: number;
  }>;
  title?: string;
}

export default function VelocityChart({ data, title = "Velocity Chart" }: VelocityChartProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="sprint" className="text-muted-foreground" />
            <YAxis className="text-muted-foreground" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="planned" fill="hsl(var(--muted))" name="Planejado" />
            <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completado" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
