import React, { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Plus, Trash2, Tag } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { hasPermission, PERMISSIONS } from "@/lib/permissions-helper";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import AIDescriptionButton from "@/components/utils/AIDescriptionButton";

export default function CreateStory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get("project_id");
  const featureIdParam = searchParams.get("feature_id");

  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [storyTypes, setStoryTypes] = useState<any[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    technical_details: "",
    project_id: projectIdParam || "",
    feature_id: featureIdParam || "",
    story_type_id: "",
    priority: "medium",
    assigned_to_email: "",
    story_points: "",
    acceptance_criteria: [] as Array<{ text: string; completed: boolean }>,
    tags: [] as string[],
    due_date: ""
  });

  const [newCriteria, setNewCriteria] = useState("");
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const hasCreatePermission = await hasPermission(PERMISSIONS.CREATE_STORY);
      setCanCreate(hasCreatePermission);
      setIsCheckingPermission(false);

      if (!hasCreatePermission) {
        toast({
          title: "Sem permissão",
          description: "Você não tem permissão para criar histórias.",
          variant: "destructive"
        });
        setTimeout(() => navigate(createPageUrl("BacklogManagement")), 2000);
        return;
      }

      const [allProjects, allUsers, allStoryTypes] = await Promise.all([
        base44.entities.Project.list("-created_at"),
        base44.entities.User.list(),
        base44.entities.StoryType.filter({ is_active: true })
      ]);

      setProjects(allProjects);
      setUsers(allUsers);
      setStoryTypes(allStoryTypes);

      if (projectIdParam) {
        const allFeatures = await base44.entities.Feature.filter({ project_id: projectIdParam });
        setFeatures(allFeatures || []);
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
      const existingStories = await base44.entities.Story.filter({ project_id: formData.project_id });
      const storyNumber = `${project?.code || 'PRJ'}-S-${String(existingStories.length + 1).padStart(4, '0')}`;

      await base44.entities.Story.create({
        ...formData,
        story_number: storyNumber,
        status: 'backlog',
        progress: 0
      });

      toast({
        title: "História criada!",
        description: "A história foi criada com sucesso."
      });

      navigate(createPageUrl("BacklogManagement"));
    } catch (error) {
      console.error("Error creating story:", error);
      toast({
        title: "Erro ao criar",
        description: "Não foi possível criar a história.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingPermission) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-background">
        <p className="text-foreground">Verificando permissões...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Nova História</h1>
            <p className="text-muted-foreground">Crie uma nova história de usuário</p>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Informações da História</CardTitle>
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
                placeholder="Como [usuário], eu quero [ação] para que [benefício]"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => navigate(createPageUrl("BacklogManagement"))} className="flex-1" disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/80" disabled={isLoading || !formData.title || !formData.project_id}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Salvando..." : "Criar História"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
