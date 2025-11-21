import React, { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Trash2, BookOpen, Plus, X, CheckSquare, Sparkles } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { getComplexityOptionsSync, getComplexityLabel } from "@/lib/complexity-helper";
import CommentsSection from "../components/comments/CommentsSection";
import AITaskGenerator from "../components/stories/AITaskGenerator";

export default function StoryDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storyId = searchParams.get("id");

  const [story, setStory] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [projectBoard, setProjectBoard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newCriteria, setNewCriteria] = useState("");
  const [complexityOptions, setComplexityOptions] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: "",
    feature_id: "none",
    status: "backlog",
    priority: "medium",
    assigned_to_email: "none",
    story_points: "",
    acceptance_criteria: [] as string[]
  });

  useEffect(() => {
    if (storyId) loadData();
  }, [storyId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allStories, allProjects, allFeatures, allUsers, relatedTasks, allBoards] = await Promise.all([
        base44.entities.Story.list(),
        base44.entities.Project.list(),
        base44.entities.Feature.list(),
        base44.entities.User.list(),
        base44.entities.Task.filter({ story_id: storyId }),
        base44.entities.Board.list()
      ]);

      const storyData = allStories.find((s: any) => s.id === storyId);
      if (storyData) {
        setStory(storyData);
        setFormData({
          title: storyData.title || "",
          description: storyData.description || "",
          project_id: storyData.project_id || "",
          feature_id: storyData.feature_id || "none",
          status: storyData.status || "backlog",
          priority: storyData.priority || "medium",
          assigned_to_email: storyData.assigned_to_email || "none",
          story_points: storyData.story_points || "",
          acceptance_criteria: storyData.acceptance_criteria || []
        });

        const project = allProjects.find((p: any) => p.id === storyData.project_id);
        if (project?.board_id) {
          const board = allBoards.find((b: any) => b.id === project.board_id);
          setProjectBoard(board);
        }
        
        const options = getComplexityOptionsSync(project?.complexity_type || "fibonacci");
        setComplexityOptions(options.map(o => o.value));
      }

      setProjects(allProjects || []);
      setFeatures(allFeatures || []);
      setUsers(allUsers || []);
      setTasks(relatedTasks || []);
      setBoards(allBoards || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar história");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.project_id) {
      toast.error("Título e projeto são obrigatórios");
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.Story.update(storyId!, {
        ...formData,
        feature_id: formData.feature_id === "none" ? null : formData.feature_id,
        assigned_to_email: formData.assigned_to_email === "none" ? "" : formData.assigned_to_email
      });
      toast.success("História atualizada");
      navigate(createPageUrl("Backlog"));
    } catch (error) {
      console.error("Error saving story:", error);
      toast.error("Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.Story.delete(storyId!);
      toast.success("História excluída");
      navigate(createPageUrl("Backlog"));
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Erro ao excluir");
    }
  };

  const handleAddCriteria = () => {
    if (newCriteria.trim()) {
      setFormData({
        ...formData,
        acceptance_criteria: [...formData.acceptance_criteria, newCriteria.trim()]
      });
      setNewCriteria("");
    }
  };

  const handleRemoveCriteria = (index: number) => {
    setFormData({
      ...formData,
      acceptance_criteria: formData.acceptance_criteria.filter((_, i) => i !== index)
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                {story?.title}
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            {!showDeleteConfirm ? (
              <>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="text-red-500">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleDelete}>Confirmar Exclusão</Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Título *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-background"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Descrição</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-background"
                    rows={6}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Projeto *</label>
                    <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((proj: any) => (
                          <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Feature</label>
                    <Select value={formData.feature_id} onValueChange={(value) => setFormData({ ...formData, feature_id: value })}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {features.filter(f => f.project_id === formData.project_id).map((feat: any) => (
                          <SelectItem key={feat.id} value={feat.id}>{feat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="backlog">Backlog</SelectItem>
                        <SelectItem value="todo">A Fazer</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="done">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Prioridade</label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="highest">Altíssima</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="lowest">Baixíssima</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">

                  <div>
                    <label className="text-sm font-medium mb-2 block">Estimativa (Story Points)</label>
                    <Select
                      value={formData.story_points}
                      onValueChange={(value) => setFormData({ ...formData, story_points: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {complexityOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Responsável</label>
                    <Select value={formData.assigned_to_email} onValueChange={(value) => setFormData({ ...formData, assigned_to_email: value })}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {users.map((user: any) => (
                          <SelectItem key={user.email} value={user.email}>{user.full_name || user.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  Critérios de Aceitação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newCriteria}
                    onChange={(e) => setNewCriteria(e.target.value)}
                    placeholder="Novo critério..."
                    className="bg-background"
                    onKeyPress={(e) => e.key === "Enter" && handleAddCriteria()}
                  />
                  <Button onClick={handleAddCriteria} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.acceptance_criteria.map((criteria, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-background">
                      <Checkbox />
                      <span className="flex-1 text-sm">{criteria}</span>
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveCriteria(idx)} className="text-red-500">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckSquare className="w-5 h-5" />
                    Tarefas ({tasks.length})
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAIGenerator(!showAIGenerator)}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {showAIGenerator ? "Fechar" : "Gerar com IA"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAIGenerator && story && (
                  <AITaskGenerator
                    story={story}
                    onTasksCreated={() => {
                      loadData();
                    }}
                    onClose={() => setShowAIGenerator(false)}
                  />
                )}

                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-primary transition-colors">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={task.status === "done"} />
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {task.assigned_to_email || "Não atribuído"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{task.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma tarefa criada ainda
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Comentários</CardTitle>
              </CardHeader>
              <CardContent>
                <CommentsSection
                  storyId={storyId!}
                  projectId={formData.project_id}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
