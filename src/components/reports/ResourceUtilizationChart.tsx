import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ResourceUtilizationChartProps {
  data: Array<{
    name: string;
    utilization: number;
  }>;
  title?: string;
}

export default function ResourceUtilizationChart({ data, title = "Utilização de Recursos" }: ResourceUtilizationChartProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis type="number" className="text-muted-foreground" />
            <YAxis dataKey="name" type="category" className="text-muted-foreground" width={150} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="utilization" fill="hsl(var(--primary))" name="Utilização %" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
