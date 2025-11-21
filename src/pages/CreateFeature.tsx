import React, { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/hooks/use-toast";
import AIDescriptionButton from "@/components/utils/AIDescriptionButton";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { addTenantData, addTenantFilter } from "@/lib/tenant-helper";

interface FormData {
  title: string;
  description: string;
  project_id: string;
  epic_id: string;
  priority: string;
  owner_email: string;
  start_date: string;
  target_date: string;
  acceptance_criteria: string;
}

export default function CreateFeature() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    project_id: "",
    epic_id: "",
    priority: "medium",
    owner_email: "none",
    start_date: "",
    target_date: "",
    acceptance_criteria: ""
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [epics, setEpics] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allProjects, allUsers] = await Promise.all([
        base44.entities.Project.filter(await addTenantFilter({}), "-created_at"),
        base44.entities.User.list()
      ]);

      setProjects(allProjects || []);
      setUsers(allUsers || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados necessários.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectChange = async (newProjectId: string) => {
    setFormData(prev => ({ ...prev, project_id: newProjectId, epic_id: "" }));
    
    if (newProjectId) {
      try {
        const allEpics = await base44.entities.Epic.filter(await addTenantFilter({ project_id: newProjectId }));
        setEpics(allEpics || []);
      } catch (error) {
        console.error("Error loading epics:", error);
        setEpics([]);
      }
    } else {
      setEpics([]);
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
      const epic = epics.find(e => e.id === formData.epic_id);
      const owner = users.find(u => u.email === formData.owner_email);

      let featureNumber = null;
      if (project) {
        const existingFeatures = await base44.entities.Feature.filter(await addTenantFilter({ project_id: formData.project_id }));
        const featureCount = existingFeatures.length + 1;
        featureNumber = `${project.code}-F-${String(featureCount).padStart(3, '0')}`;
      }

      await base44.entities.Feature.create(await addTenantData({
        ...formData,
        owner_email: formData.owner_email === "none" ? "" : formData.owner_email,
        feature_number: featureNumber,
        project_name: project?.name,
        epic_title: epic?.title,
        owner_name: owner?.full_name || owner?.email,
        status: 'backlog',
        progress: 0
      }));

      toast({
        title: "Funcionalidade criada!",
        description: "A funcionalidade foi criada com sucesso."
      });

      navigate(createPageUrl("BacklogManagement"));
    } catch (error) {
      console.error("Error creating feature:", error);
      toast({
        title: "Erro ao criar funcionalidade",
        description: "Não foi possível criar a funcionalidade.",
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
            <h1 className="text-3xl font-bold text-foreground">Nova Funcionalidade</h1>
            <p className="text-muted-foreground">Crie uma nova funcionalidade para organizar histórias</p>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Informações da Funcionalidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Projeto *
              </label>
              <Select
                value={formData.project_id}
                onValueChange={handleProjectChange}
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
                Épico (Opcional)
              </label>
              <Select
                value={formData.epic_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, epic_id: value }))}
                disabled={!formData.project_id}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecione o épico" />
                </SelectTrigger>
                <SelectContent>
                  {epics.map(epic => (
                    <SelectItem key={epic.id} value={epic.id}>
                      {epic.title}
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
                placeholder="Nome da funcionalidade"
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
                  type="feature"
                  onGenerated={(description: any) => setFormData(prev => ({ ...prev, description: String(description) }))}
                  disabled={!formData.title}
                />
              </div>
              <ReactQuill
                value={formData.description}
                onChange={(value: string) => setFormData(prev => ({ ...prev, description: value }))}
                className="bg-background text-foreground rounded-lg"
                theme="snow"
                placeholder="Descreva a funcionalidade e seu valor..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Critérios de Aceitação
              </label>
              <ReactQuill
                value={formData.acceptance_criteria}
                onChange={(value: string) => setFormData(prev => ({ ...prev, acceptance_criteria: value }))}
                className="bg-background text-foreground rounded-lg"
                theme="snow"
                placeholder="Defina os critérios de aceitação..."
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
                        {user.full_name || user.email}
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
                {isSaving ? "Salvando..." : "Criar Funcionalidade"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
