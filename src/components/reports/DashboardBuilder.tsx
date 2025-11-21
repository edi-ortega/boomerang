import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Save, Trash2, Layout } from "lucide-react";

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  is_default?: boolean;
  widgets?: any[];
}

interface DashboardBuilderProps {
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  onSave: (dashboard: Partial<Dashboard>) => void;
  onLoad: (dashboard: Dashboard) => void;
  onDelete: (dashboardId: string) => void;
  onAddWidget: (widgetType: any) => void;
}

const WIDGET_TYPES = [
  { id: 'burndown_chart', name: 'Burndown Chart', icon: '📉' },
  { id: 'velocity_chart', name: 'Velocity Chart', icon: '📊' },
  { id: 'resource_utilization', name: 'Utilização de Recursos', icon: '👥' },
  { id: 'project_health', name: 'Saúde dos Projetos', icon: '❤️' }
];

export default function DashboardBuilder({ 
  dashboards, 
  currentDashboard, 
  onSave, 
  onLoad, 
  onDelete, 
  onAddWidget 
}: DashboardBuilderProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState("");
  const [newDashboardDescription, setNewDashboardDescription] = useState("");

  const handleCreateDashboard = () => {
    if (!newDashboardName.trim()) return;

    onSave({
      name: newDashboardName,
      description: newDashboardDescription,
      is_default: dashboards.length === 0
    });

    setNewDashboardName("");
    setNewDashboardDescription("");
    setIsCreateOpen(false);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Dashboards
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Criar Dashboard</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newDashboardName}
                    onChange={(e) => setNewDashboardName(e.target.value)}
                    placeholder="Meu Dashboard"
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Input
                    id="description"
                    value={newDashboardDescription}
                    onChange={(e) => setNewDashboardDescription(e.target.value)}
                    placeholder="Dashboard para visualizar métricas..."
                    className="bg-background border-border"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateDashboard}>
                    <Save className="w-4 h-4 mr-2" />
                    Criar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {dashboards.length > 0 && (
            <div>
              <Label>Selecionar Dashboard</Label>
              <Select 
                value={currentDashboard?.id || ""} 
                onValueChange={(id) => {
                  const dashboard = dashboards.find(d => d.id === id);
                  if (dashboard) onLoad(dashboard);
                }}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Selecione um dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {dashboards.map(dashboard => (
                    <SelectItem key={dashboard.id} value={dashboard.id}>
                      {dashboard.name}
                      {dashboard.is_default && " (Padrão)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {currentDashboard && (
            <div>
              <Label>Adicionar Widget</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {WIDGET_TYPES.map(widget => (
                  <Button
                    key={widget.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onAddWidget(widget)}
                    className="justify-start"
                  >
                    <span className="mr-2">{widget.icon}</span>
                    {widget.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {currentDashboard && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(currentDashboard.id)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Dashboard
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
