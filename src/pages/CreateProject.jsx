
import React, { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
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
import { getSupabaseClient } from "@/lib/supabase-client";

export default function CreateProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [boards, setBoards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]); // Added users state
  const [allProjects, setAllProjects] = useState([]); // Para hierarquia
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
    team_ids: [],
    parent_project_id: "" // Campo de hierarquia
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const tenantFilter = await addTenantFilter();
      const supabase = await getSupabaseClient();
      
      // Buscar usuários através da tabela de junção bmr_user_clients
      const { data: userClientRelations } = await supabase
        .from('bmr_user_clients')
        .select('user_id')
        .eq('client_id', tenantFilter.client_id);
      
      const userIds = (userClientRelations || []).map(rel => rel.user_id);
      
      // Buscar dados básicos primeiro
      const [allBoards, allCategories, allTeams, projects] = await Promise.all([
        base44.entities.Board.filter(tenantFilter),
        base44.entities.ProjectCategory.filter(tenantFilter, "order"),
        base44.entities.Team.filter(tenantFilter),
        base44.entities.Project.filter(tenantFilter, "-created_at") // Projetos para hierarquia
      ]);
      
      // Buscar usuários via Supabase diretamente
      let allUsers = [];
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('bmr_user')
          .select('user_id, name, email')
          .in('user_id', userIds);
        allUsers = usersData || [];
      }

      setBoards(allBoards || []);
      setCategories(allCategories || []);
      setTeams(allTeams || []);
      setUsers(allUsers);
      setAllProjects(projects || []); // Projetos do tenant

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

  const handleSubmit = async (e) => {
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
      // Preparar dados removendo campos UUID vazios (não enviar null para UUID)
      const cleanedData = { ...formData };
      
      // Lista de campos UUID que devem ser removidos se vazios
      const uuidFields = ['board_id', 'parent_project_id'];
      uuidFields.forEach(field => {
        if (!cleanedData[field] || cleanedData[field] === '' || cleanedData[field] === null) {
          delete cleanedData[field];
        }
      });
      
      // Converter strings vazias para null em campos de texto
      const textFields = ['category', 'description', 'manager_email', 'manager_name'];
      textFields.forEach(field => {
        if (!cleanedData[field] || cleanedData[field] === '') {
          cleanedData[field] = null;
        }
      });
      
      // Remover team_ids se for array vazio
      if (Array.isArray(cleanedData.team_ids) && cleanedData.team_ids.length === 0) {
        delete cleanedData.team_ids;
      }
      
      // Adicionar client_id (tenant)
      const projectData = await addTenantData(cleanedData);
      
      console.log('📝 Dados do projeto a serem enviados:', projectData);
      
      // Configurar sessão do usuário antes de inserir
      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) {
        throw new Error("Sessão não encontrada");
      }
      
      const parsedSession = JSON.parse(storedSession);
      const userId = parsedSession.user?.user_id;
      
      if (!userId) {
        throw new Error("ID do usuário não encontrado");
      }
      
      // Chamar set_session_user_id antes do INSERT
      const client = await getSupabaseClient();
      await client.rpc('set_session_user_id', { p_user_id: userId });
      
      // Agora inserir o projeto
      const newProject = await base44.entities.Project.create(projectData);

      toast({
        title: "Projeto criado!",
        description: `O projeto "${formData.name}" foi criado com sucesso.`,
        variant: "success"
      });

      navigate(createPageUrl(`ProjectDetail?id=${newProject.id}`));
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

  // Verificar se é Waterfall
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

                {/* CAMPO DE PROJETO PAI */}
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
                      <SelectItem value={null}>Nenhum (projeto raiz)</SelectItem> {/* Use empty string for null */}
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
                      Data de Término Prevista
                    </label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>

                {/* SEÇÃO DE EQUIPE - DIFERENTE PARA WATERFALL */}
                {isWaterfall ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Gerente do Projeto *
                      </label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Selecione o gerente responsável pelo projeto Waterfall
                      </p>
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
                        <SelectTrigger className="bg-background border-border text-foreground">
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
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                ) : (
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                                    style={{ backgroundColor: user.avatar_color || '#3b82f6' }}
                                  >
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

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Times do Projeto
                      </label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Selecione os times que farão parte deste projeto
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto p-3 bg-accent/20 rounded-lg border border-border">
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
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Gerente do Projeto
                      </label>
                      <Input
                        type="text"
                        value={formData.manager_name}
                        readOnly
                        className="bg-background border-border text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Definido como o usuário logado automaticamente.
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Times do Projeto
                      </label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Selecione os times que farão parte deste projeto
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto p-3 bg-accent/20 rounded-lg border border-border">
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
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Cor do Projeto
                  </label>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="bg-background border-border h-10"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl("ProjectList"))}
              className="flex-1 border-border hover:bg-accent"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                "Criar Projeto"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
