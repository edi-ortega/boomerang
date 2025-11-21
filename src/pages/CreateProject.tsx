import React, { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { withAuth } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { addTenantData, addTenantFilter } from "@/components/utils/TenantHelper";

interface Board {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  code: string;
}

interface Team {
  id: string;
  name: string;
}

interface User {
  email: string;
  full_name?: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
  color?: string;
}

export default function CreateProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
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
    complexity_type: "fibonacci",
    team_ids: [] as string[],
    parent_project_id: "none"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const [allBoards, allCategories, allTeams, allUsers, projects] = await Promise.all([
        base44.entities.Board.list(),
        base44.entities.ProjectCategory.filter(await addTenantFilter(), "order"),
        base44.entities.Team.filter(await addTenantFilter()),
        base44.entities.User.list(),
        base44.entities.Project.filter(await addTenantFilter(), "-created_at")
      ]);

      setBoards(allBoards || []);
      setCategories(allCategories || []);
      setTeams(allTeams || []);
      setUsers(allUsers || []);
      setAllProjects(projects || []);

      setFormData(prev => ({
        ...prev,
        manager_email: user.email,
        manager_name: user.full_name || user.email
      }));

    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os dados necessários.",
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
      const projectData = await addTenantData({
        ...formData,
        board_id: formData.methodology === 'waterfall' ? null : formData.board_id,
        complexity_type: formData.methodology === 'waterfall' ? null : formData.complexity_type,
        parent_project_id: formData.parent_project_id === "none" ? null : formData.parent_project_id
      });
      
      console.log("📝 Creating project with data:", projectData);
      
      let projectId = "";
      
      await withAuth(async (client) => {
        // Set session user_id for RLS policies
        const storedSession = localStorage.getItem("bmr_session");
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          const userId = parsedSession.user?.user_id;
          
          await client.rpc('set_session_user_id', { p_user_id: userId });
        }
        
        const result: any = await client
          .from('prj_project' as any)
          .insert(projectData)
          .select('id')
          .single();
        
        if (result.error) throw result.error;
        projectId = result.data?.id || "";
      });

      toast({
        title: "Projeto criado!",
        description: `O projeto "${formData.name}" foi criado com sucesso.`,
      });

      navigate(createPageUrl(`ProjectDetail?id=${projectId}`));
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Erro ao criar",
        description: "Não foi possível criar o projeto.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateCode = () => {
    const name = formData.name.trim();
    if (!name) return;

    const words = name.split(' ').filter(w => w.length > 0);
    let code = '';

    if (words.length === 1) {
      code = words[0].substring(0, 4).toUpperCase();
    } else {
      code = words.map(w => w.charAt(0)).join('').toUpperCase();
      if (code.length < 3) {
        code = words[0].substring(0, 4).toUpperCase();
      }
    }

    setFormData(prev => ({
      ...prev,
      code
    }));
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
          <p className="text-foreground">Carregando...</p>
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
            onClick={() => navigate(createPageUrl("ProjectList"))}
            className="border-border hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Novo Projeto</h1>
            <p className="text-muted-foreground">Crie um novo projeto de gerenciamento</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <Card className="glass-effect border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Nome do Projeto *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      onBlur={generateCode}
                      placeholder="Ex: Sistema de Vendas"
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Código *
                    </label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="Ex: PROJ-001"
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Projeto Pai (Hierarquia)
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Selecione um projeto pai para criar uma hierarquia (opcional)
                  </p>
                  <Select 
                    value={formData.parent_project_id} 
                    onValueChange={(value) => setFormData({...formData, parent_project_id: value})}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Nenhum (projeto raiz)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (projeto raiz)</SelectItem>
                      {allProjects.map(proj => (
                        <SelectItem key={proj.id} value={proj.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: proj.color || '#3b82f6' }}
                            />
                            <span>{proj.name} ({proj.code})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Descrição
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descreva o objetivo e escopo do projeto..."
                    className="bg-background border-border text-foreground h-24"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Metodologia *
                    </label>
                    <Select value={formData.methodology} onValueChange={(value) => setFormData({...formData, methodology: value})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waterfall">Waterfall (Cascata)</SelectItem>
                        <SelectItem value="scrum">Scrum (Ágil)</SelectItem>
                        <SelectItem value="kanban">Kanban (Ágil)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Board {isWaterfall && <span className="text-xs text-muted-foreground">(Não disponível para Waterfall)</span>}
                    </label>
                    <Select 
                      value={formData.board_id} 
                      onValueChange={(value) => setFormData({...formData, board_id: value})}
                      disabled={isWaterfall}
                    >
                      <SelectTrigger className={`bg-background border-border text-foreground ${isWaterfall ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <SelectValue placeholder="Selecione um board" />
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
                </div>

                {!isWaterfall && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Escala de Complexidade *
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Defina qual escala será usada para estimar story points neste projeto
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {complexityTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData({...formData, complexity_type: type.id})}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            formData.complexity_type === type.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50 bg-accent/30'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{type.icon}</span>
                            <div className="flex-1">
                              <h4 className={`font-semibold mb-1 ${
                                formData.complexity_type === type.id ? 'text-primary' : 'text-foreground'
                              }`}>
                                {type.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {type.description}
                              </p>
                              {formData.complexity_type === type.id && (
                                <Badge className="mt-2 bg-primary text-primary-foreground">
                                  Selecionado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isWaterfall && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground">
                      ℹ️ <strong>Metodologia Waterfall:</strong> Board e Escalas de Complexidade não são necessários para projetos em cascata. 
                      Estes recursos são específicos para metodologias ágeis.
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Categoria
                    </label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.code}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Status Inicial
                    </label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planejamento</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="on_hold">Pausado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Prioridade
                    </label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
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
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Cor do Projeto
                    </label>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="h-10 w-full"
                    />
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
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Data de Término
                    </label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Gerente do Projeto
                    </label>
                    <Input
                      value={formData.manager_name}
                      onChange={(e) => setFormData({...formData, manager_name: e.target.value})}
                      className="bg-background border-border text-foreground"
                      placeholder="Nome do gerente"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Email do Gerente
                    </label>
                    <Input
                      type="email"
                      value={formData.manager_email}
                      onChange={(e) => setFormData({...formData, manager_email: e.target.value})}
                      className="bg-background border-border text-foreground"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(createPageUrl("ProjectList"))}
                disabled={isSaving}
                className="border-border hover:bg-accent"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Criar Projeto
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
