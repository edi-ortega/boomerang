import { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function ProjectEdit() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");

  const [project, setProject] = useState<any>(null);
  const [boards, setBoards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    methodology: "kanban",
    board_id: "",
    category: "",
    status: "planning",
    priority: "medium",
    start_date: "",
    end_date: "",
    manager_email: "",
    manager_name: "",
    color: "#3b82f6",
    health_status: "healthy",
    complexity_type: "fibonacci",
    team_ids: [] as string[],
    parent_project_id: "none"
  });

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectData, allBoards, allCategories, allUsers, allTeams, projects] = await Promise.all([
        base44.entities.Project.filter({ id: projectId }),
        base44.entities.Board.list(),
        base44.entities.ProjectCategory.list("order"),
        base44.entities.User.list(),
        base44.entities.Team.list(),
        base44.entities.Project.list()
      ]);

      if (!projectData || projectData.length === 0) {
        toast({
          title: "Projeto não encontrado",
          description: "O projeto solicitado não existe.",
          variant: "destructive"
        });
        navigate(createPageUrl("ProjectList"));
        return;
      }

      const proj = projectData[0];
      setProject(proj);
      setBoards(allBoards || []);
      setCategories(allCategories || []);
      setUsers(allUsers || []);
      setTeams(allTeams || []);

      const tenantProjects = (projects || []).filter((p: any) =>
        p.tenant_id === proj.tenant_id && p.id !== proj.id
      );
      setAllProjects(tenantProjects);

      setFormData({
        name: proj.name || "",
        code: proj.code || "",
        description: proj.description || "",
        methodology: proj.methodology || "kanban",
        board_id: proj.board_id || "",
        category: proj.category || "",
        status: proj.status || "planning",
        priority: proj.priority || "medium",
        start_date: proj.start_date || "",
        end_date: proj.end_date || "",
        manager_email: proj.manager_email || "",
        manager_name: proj.manager_name || "",
        color: proj.color || "#3b82f6",
        health_status: proj.health_status || "healthy",
        complexity_type: proj.complexity_type || "fibonacci",
        team_ids: proj.team_ids || [],
        parent_project_id: proj.parent_project_id || "none"
      });

    } catch (error) {
      console.error("Error loading project:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os dados do projeto.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code || !formData.methodology) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome, código e metodologia são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const currentManager = users.find(u => u.email === formData.manager_email);
      const dataToUpdate = {
        ...formData,
        manager_name: currentManager ? (currentManager.full_name || currentManager.email) : formData.manager_name,
        board_id: formData.methodology === 'waterfall' ? null : formData.board_id,
        complexity_type: formData.methodology === 'waterfall' ? null : formData.complexity_type,
        parent_project_id: formData.parent_project_id === "none" ? null : formData.parent_project_id
      };

      await base44.entities.Project.update(projectId!, dataToUpdate);

      toast({
        title: "Projeto atualizado!",
        description: `O projeto "${formData.name}" foi atualizado com sucesso.`
      });

      navigate(createPageUrl(`ProjectDetail?id=${projectId}`));
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o projeto. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const complexityTypes = [
    { id: "fibonacci", name: "Fibonacci", description: "1, 2, 3, 5, 8, 13...", icon: "📊" },
    { id: "tshirt", name: "T-Shirt", description: "XS, S, M, L, XL, XXL", icon: "👕" },
    { id: "power_of_2", name: "Potências de 2", description: "1, 2, 4, 8, 16, 32", icon: "⚡" },
    { id: "linear", name: "Linear", description: "1, 2, 3, 4, 5, 6...", icon: "📈" }
  ];

  const isWaterfall = formData.methodology === 'waterfall';

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl(`ProjectDetail?id=${projectId}`))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Editar Projeto</h1>
            <p className="text-muted-foreground">{project?.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Nome do Projeto *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Sistema de Gestão"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Código *
                  </label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: SGE-2024"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Descrição
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o projeto..."
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Metodologia *
                  </label>
                  <Select
                    value={formData.methodology}
                    onValueChange={(value) => setFormData({ ...formData, methodology: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kanban">Kanban</SelectItem>
                      <SelectItem value="scrum">Scrum</SelectItem>
                      <SelectItem value="waterfall">Waterfall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Categoria
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!isWaterfall && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Quadro
                  </label>
                  <Select
                    value={formData.board_id}
                    onValueChange={(value) => setFormData({ ...formData, board_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um quadro" />
                    </SelectTrigger>
                    <SelectContent>
                      {boards.map(board => (
                        <SelectItem key={board.id} value={board.id}>
                          {board.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planejamento</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="on_hold">Em Espera</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Prioridade
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Data de Início
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Data de Término
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Health Status
                  </label>
                  <Select
                    value={formData.health_status}
                    onValueChange={(value) => setFormData({ ...formData, health_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthy">🟢 Saudável</SelectItem>
                      <SelectItem value="at_risk">🟡 Em Risco</SelectItem>
                      <SelectItem value="critical">🔴 Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Cor do Projeto
                  </label>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Projeto Pai (Hierarquia)
                </label>
                <Select
                  value={formData.parent_project_id}
                  onValueChange={(value) => setFormData({ ...formData, parent_project_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum (projeto raiz)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (projeto raiz)</SelectItem>
                    {allProjects.map(proj => (
                      <SelectItem key={proj.id} value={proj.id}>
                        {proj.name} ({proj.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isWaterfall ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Tipo de Complexidade
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Define a escala de pontos de complexidade para histórias
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {complexityTypes.map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, complexity_type: type.id })}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            formData.complexity_type === type.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{type.icon}</span>
                            <span className="font-semibold text-foreground">{type.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Times do Projeto
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Selecione os times que farão parte deste projeto
                    </p>
                    <div className="space-y-2 max-h-60 overflow-y-auto p-3 bg-accent/20 rounded-lg border">
                      {teams.length > 0 ? (
                        teams.map(team => (
                          <label
                            key={team.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.team_ids.includes(team.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    team_ids: [...formData.team_ids, team.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    team_ids: formData.team_ids.filter(id => id !== team.id)
                                  });
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground font-bold"
                              style={{ backgroundColor: team.color || '#3b82f6' }}
                            >
                              {team.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{team.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {team.members?.length || 0} {(team.members?.length || 0) === 1 ? 'membro' : 'membros'}
                              </p>
                            </div>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic text-center py-4">
                          Nenhum time cadastrado. Crie times na página de Gestão de Times.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Gerente do Projeto
                  </label>
                  <Select
                    value={formData.manager_email}
                    onValueChange={(value) => {
                      const selectedUser = users.find(u => u.email === value);
                      setFormData({
                        ...formData,
                        manager_email: value,
                        manager_name: selectedUser ? (selectedUser.full_name || selectedUser.email) : value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um gerente" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.email} value={user.email}>
                          <div className="flex items-center gap-2">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name || user.email}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                                {(user.full_name || user.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span>{user.full_name || user.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl(`ProjectDetail?id=${projectId}`))}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
