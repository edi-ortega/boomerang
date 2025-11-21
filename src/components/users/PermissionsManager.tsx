import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, BookOpen, Layers, Mountain, CheckSquare, Calendar, Users, Settings, BarChart3, Target, Zap, Eye, Search, CheckCircle2 } from "lucide-react";

interface Permission {
  code: string;
  name: string;
  category: string;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  // Backlog
  { code: 'create_epic', name: 'Criar Épicos', category: 'Backlog' },
  { code: 'edit_epic', name: 'Editar Épicos', category: 'Backlog' },
  { code: 'delete_epic', name: 'Excluir Épicos', category: 'Backlog' },
  { code: 'create_feature', name: 'Criar Funcionalidades', category: 'Backlog' },
  { code: 'edit_feature', name: 'Editar Funcionalidades', category: 'Backlog' },
  { code: 'delete_feature', name: 'Excluir Funcionalidades', category: 'Backlog' },
  { code: 'create_story', name: 'Criar Histórias', category: 'Backlog' },
  { code: 'edit_story', name: 'Editar Histórias', category: 'Backlog' },
  { code: 'delete_story', name: 'Excluir Histórias', category: 'Backlog' },

  // Tasks
  { code: 'create_task', name: 'Criar Tarefas', category: 'Tarefas' },
  { code: 'edit_task', name: 'Editar Tarefas', category: 'Tarefas' },
  { code: 'delete_task', name: 'Excluir Tarefas', category: 'Tarefas' },
  { code: 'assign_task', name: 'Atribuir Tarefas', category: 'Tarefas' },

  // Sprints
  { code: 'create_sprint', name: 'Criar Sprints', category: 'Sprints' },
  { code: 'edit_sprint', name: 'Editar Sprints', category: 'Sprints' },
  { code: 'delete_sprint', name: 'Excluir Sprints', category: 'Sprints' },
  { code: 'start_sprint', name: 'Iniciar Sprints', category: 'Sprints' },
  { code: 'complete_sprint', name: 'Concluir Sprints', category: 'Sprints' },
  { code: 'view_sprints', name: 'Visualizar Sprints', category: 'Sprints' },

  // Projects
  { code: 'manage_projects', name: 'Gerenciar Projetos', category: 'Projetos' },

  // Team
  { code: 'manage_team', name: 'Gerenciar Times', category: 'Time' },

  // Reports
  { code: 'view_reports', name: 'Visualizar Relatórios', category: 'Relatórios' },

  // Planning Poker
  { code: 'join_planning_poker', name: 'Participar Planning Poker', category: 'Planning Poker' },
  { code: 'create_planning_poker', name: 'Criar Planning Poker', category: 'Planning Poker' },

  // Timesheet
  { code: 'log_time', name: 'Registrar Tempo', category: 'Timesheet' },
  { code: 'view_own_timesheet', name: 'Ver Próprio Timesheet', category: 'Timesheet' },
  { code: 'view_all_timesheets', name: 'Ver Todos os Timesheets', category: 'Timesheet' },
  { code: 'approve_timesheets', name: 'Aprovar Timesheets', category: 'Timesheet' },
  { code: 'edit_all_timelogs', name: 'Editar Todos os Registros', category: 'Timesheet' },

  // Admin
  { code: 'manage_settings', name: 'Gerenciar Configurações', category: 'Admin' },
  { code: 'manage_boards', name: 'Gerenciar Boards', category: 'Admin' }
];

const CATEGORY_METADATA: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  "Backlog": { label: "Backlog", color: "#8b5cf6", icon: Mountain },
  "Tarefas": { label: "Tarefas", color: "#f59e0b", icon: CheckSquare },
  "Sprints": { label: "Sprints", color: "#06b6d4", icon: Calendar },
  "Projetos": { label: "Projetos", color: "#3b82f6", icon: Layers },
  "Time": { label: "Time", color: "#10b981", icon: Users },
  "Relatórios": { label: "Relatórios", color: "#6366f1", icon: BarChart3 },
  "Planning Poker": { label: "Planning Poker", color: "#8b5cf6", icon: Target },
  "Timesheet": { label: "Timesheet", color: "#0ea5e9", icon: Calendar },
  "Admin": { label: "Admin", color: "#dc2626", icon: Settings }
};

interface PermissionsManagerProps {
  selectedPermissions?: string[];
  onChange: (permissions: string[]) => void;
}

export default function PermissionsManager({ selectedPermissions = [], onChange }: PermissionsManagerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected(Array.isArray(selectedPermissions) ? selectedPermissions : []);
  }, [selectedPermissions]);

  const handleToggle = (permCode: string) => {
    const newSelected = selected.includes(permCode)
      ? selected.filter(p => p !== permCode)
      : [...selected, permCode];
    
    setSelected(newSelected);
    onChange(newSelected);
  };

  const handleToggleCategory = (category: string) => {
    const categoryPerms = AVAILABLE_PERMISSIONS
      .filter(p => p.category === category)
      .map(p => p.code);
    
    const allSelected = categoryPerms.every(p => selected.includes(p));
    
    const newSelected = allSelected
      ? selected.filter(p => !categoryPerms.includes(p))
      : [...new Set([...selected, ...categoryPerms])];
    
    setSelected(newSelected);
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    const allPermCodes = AVAILABLE_PERMISSIONS.map(p => p.code);
    setSelected(allPermCodes);
    onChange(allPermCodes);
  };

  const handleClearAll = () => {
    setSelected([]);
    onChange([]);
  };

  const filteredPermissions = AVAILABLE_PERMISSIONS.filter(perm =>
    perm.name.toLowerCase().includes(search.toLowerCase()) ||
    perm.category.toLowerCase().includes(search.toLowerCase())
  );

  const groupedPermissions = filteredPermissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Gerenciar Permissões
          </CardTitle>
          <Badge variant="secondary">
            {selected.length} de {AVAILABLE_PERMISSIONS.length}
          </Badge>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar permissões..."
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleSelectAll}
            variant="outline"
            size="sm"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Selecionar Todas
          </Button>
          <Button
            onClick={handleClearAll}
            variant="outline"
            size="sm"
          >
            Limpar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {Object.entries(groupedPermissions).map(([category, permissions]) => {
          const metadata = CATEGORY_METADATA[category];
          const Icon = metadata?.icon || Shield;
          const allCategorySelected = permissions.every(p => selected.includes(p.code));
          const someCategorySelected = permissions.some(p => selected.includes(p.code));

          return (
            <div key={category} className="space-y-2">
              <div
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => handleToggleCategory(category)}
              >
                <Checkbox
                  checked={allCategorySelected}
                  className={someCategorySelected && !allCategorySelected ? "data-[state=checked]:bg-primary/50" : ""}
                />
                <Icon className="w-4 h-4" style={{ color: metadata?.color }} />
                <span className="font-semibold text-sm flex-1">{category}</span>
                <Badge variant="secondary" className="text-xs">
                  {permissions.filter(p => selected.includes(p.code)).length}/{permissions.length}
                </Badge>
              </div>

              <div className="ml-8 space-y-1">
                {permissions.map(perm => (
                  <div
                    key={perm.code}
                    className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 cursor-pointer"
                    onClick={() => handleToggle(perm.code)}
                  >
                    <Checkbox checked={selected.includes(perm.code)} />
                    <span className="text-sm text-foreground">{perm.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
