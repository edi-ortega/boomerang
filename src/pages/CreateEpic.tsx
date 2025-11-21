import React, { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/hooks/use-toast";
import AIDescriptionButton from "@/components/utils/AIDescriptionButton";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { addTenantData, addTenantFilter } from "@/lib/tenant-helper";

export default function CreateEpic() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: "",
    priority: "medium",
    owner_email: "none",
    start_date: "",
    target_date: "",
    business_value: "",
    color: "#8b5cf6"
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log("🔍 Iniciando carregamento de dados...");
      
      const filter = await addTenantFilter({});
      console.log("🔍 Filtro com tenant:", filter);
      
      const allProjects = await base44.entities.Project.filter(filter, "-created_at");
      console.log("🔍 Projetos carregados:", allProjects);
      console.log("🔍 Quantidade de projetos:", allProjects?.length || 0);
      
      const allUsers = await base44.entities.User.list();
      console.log("🔍 Usuários carregados:", allUsers?.length || 0);

      setProjects(allProjects || []);
      setUsers(allUsers || []);
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar projetos e usuários.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.project_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e selecione um projeto.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const project = projects.find(p => p.id === formData.project_id);
      const owner = users.find(u => u.email === formData.owner_email);

      let epicNumber = null;
      if (project) {
        const existingEpics = await base44.entities.Epic.filter(await addTenantFilter({ project_id: formData.project_id }));
        const epicCount = existingEpics.length + 1;
        epicNumber = `${project.code}-E-${String(epicCount).padStart(3, '0')}`;
      }

      // Preparar dados convertendo strings vazias em null para datas
      const epicData = {
        ...formData,
        owner_email: formData.owner_email === "none" ? null : formData.owner_email,
        start_date: formData.start_date || null,
        target_date: formData.target_date || null,
        epic_number: epicNumber,
        project_name: project?.name,
        owner_name: owner?.name || owner?.email,
        status: 'backlog',
        progress: 0
      };

      await base44.entities.Epic.create(await addTenantData(epicData));

      toast({
        title: "Épico criado!",
        description: "O épico foi criado com sucesso."
      });

      navigate(createPageUrl("BacklogManagement"));
    } catch (error) {
      console.error("Error creating epic:", error);
      toast({
        title: "Erro ao criar épico",
        description: "Não foi possível criar o épico.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-background">
        <p className="text-foreground">Carregando...</p>
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
            onClick={() => navigate(createPageUrl("BacklogManagement"))}
            className="border-border hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Novo Épico</h1>
            <p className="text-muted-foreground">Crie um novo épico para organizar funcionalidades</p>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Informações do Épico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Projeto *
              </label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Título *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nome do épico"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">
                  Descrição
                </label>
                <AIDescriptionButton
                  title={formData.title}
                  type="epic"
                  onGenerated={(description: any) => setFormData(prev => ({ ...prev, description: String(description) }))}
                  disabled={!formData.title}
                />
              </div>
              <ReactQuill
                value={formData.description}
                onChange={(value: string) => setFormData(prev => ({ ...prev, description: value }))}
                className="bg-background text-foreground rounded-lg"
                theme="snow"
                placeholder="Descreva o objetivo e escopo deste épico..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Valor de Negócio
              </label>
              <ReactQuill
                value={formData.business_value}
                onChange={(value: string) => setFormData(prev => ({ ...prev, business_value: value }))}
                className="bg-background text-foreground rounded-lg"
                theme="snow"
                placeholder="Qual o valor de negócio deste épico?"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Prioridade
                </label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
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
                  Responsável
                </label>
                <Select
                  value={formData.owner_email}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, owner_email: value }))}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não atribuído</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.email} value={user.email}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span>{user.name || user.email}</span>
                        </div>
                      </SelectItem>
                    ))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Data Alvo
                </label>
                <Input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Cor do Épico
              </label>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full h-12 bg-background border-border"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("BacklogManagement"))}
                className="flex-1 border-border hover:bg-accent"
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-primary hover:bg-primary/80"
                disabled={isSaving || !formData.title || !formData.project_id}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Salvando..." : "Criar Épico"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
