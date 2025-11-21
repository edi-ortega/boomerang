import React, { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/hooks/use-toast";
import { hasPermission, PERMISSIONS } from "@/lib/permissions-helper";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function CreateTask() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get("project_id");
  const storyIdParam = searchParams.get("story_id");
  
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: projectIdParam || "",
    story_id: storyIdParam || "",
    priority: "medium",
    assigned_to_email: "",
    due_date: "",
    estimated_hours: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const hasCreatePermission = await hasPermission(PERMISSIONS.CREATE_TASK);
      setCanCreate(hasCreatePermission);

      if (!hasCreatePermission) {
        toast({
          title: "Sem permissão",
          description: "Você não tem permissão para criar tarefas.",
          variant: "destructive"
        });
        setTimeout(() => navigate(createPageUrl("BacklogManagement")), 2000);
        return;
      }

      const [allProjects, allUsers] = await Promise.all([
        base44.entities.Project.list("-created_at"),
        base44.entities.User.list()
      ]);

      setProjects(allProjects);
      setUsers(allUsers);

      if (projectIdParam) {
        const allStories = await base44.entities.Story.filter({ project_id: projectIdParam });
        setStories(allStories || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
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

    setIsLoading(true);
    try {
      const project = projects.find(p => p.id === formData.project_id);
      const existingTasks = await base44.entities.Task.filter({ project_id: formData.project_id });
      const taskNumber = `${project?.code || 'PRJ'}-T-${String(existingTasks.length + 1).padStart(4, '0')}`;

      await base44.entities.Task.create({
        ...formData,
        task_number: taskNumber,
        status: 'todo'
      });

      toast({
        title: "Tarefa criada!",
        description: "A tarefa foi criada com sucesso."
      });

      navigate(createPageUrl("BacklogManagement"));
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Erro ao criar",
        description: "Não foi possível criar a tarefa.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-background">
        <p className="text-foreground">Sem permissão</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("BacklogManagement"))}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nova Tarefa</h1>
            <p className="text-muted-foreground">Crie uma nova tarefa</p>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Informações da Tarefa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Projeto *</label>
              <Select value={formData.project_id} onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Título *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nome da tarefa"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Descrição</label>
              <ReactQuill
                value={formData.description}
                onChange={(value: string) => setFormData(prev => ({ ...prev, description: value }))}
                className="bg-background text-foreground rounded-lg"
                theme="snow"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => navigate(createPageUrl("BacklogManagement"))} className="flex-1" disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/80" disabled={isLoading || !formData.title || !formData.project_id}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Salvando..." : "Criar Tarefa"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
