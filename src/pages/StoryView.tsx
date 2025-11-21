import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Copy, CheckSquare, Plus, BookOpen, User } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import StoryModal from "@/components/StoryModal";
import StoryCopyModal from "@/components/StoryCopyModal";
import TaskModal from "@/components/TaskModal";
import CommentsSection from "@/components/comments/CommentsSection";

export default function StoryView() {
  const navigate = useNavigate();
  const { currentTenantId } = useTenant();
  const [searchParams] = useSearchParams();
  const storyId = searchParams.get("id");

  const [story, setStory] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [feature, setFeature] = useState<any>(null);
  const [storyType, setStoryType] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  useEffect(() => {
    if (storyId) loadData();
  }, [storyId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: storyData, error: storyError } = await supabase
        .from('prj_story' as any)
        .select(`
          *,
          story_type:prj_story_type(name, color)
        `)
        .eq('id', storyId)
        .eq('client_id', currentTenantId)
        .maybeSingle() as any;

      if (storyError) throw storyError;
      if (!storyData) {
        toast.error("História não encontrada.");
        navigate(createPageUrl("Backlog"));
        return;
      }

      setStory(storyData);
      setStoryType(storyData.story_type);

      // Load project
      if (storyData.project_id) {
        const { data: projectData } = await supabase
          .from('prj_project' as any)
          .select('*')
          .eq('id', storyData.project_id)
          .maybeSingle() as any;
        setProject(projectData);
      }

      // Load feature
      if (storyData.feature_id) {
        const { data: featureData } = await supabase
          .from('prj_feature' as any)
          .select('*')
          .eq('id', storyData.feature_id)
          .maybeSingle() as any;
        setFeature(featureData);
      }

      // Load tasks
      const { data: tasksData } = await supabase
        .from('prj_task' as any)
        .select('*')
        .eq('story_id', storyId)
        .eq('client_id', currentTenantId)
        .order('created_at', { ascending: false }) as any;
      setTasks(tasksData || []);

    } catch (error) {
      console.error("Error loading story:", error);
      toast.error("Erro ao carregar história.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-blue-500/10 text-blue-500",
      medium: "bg-yellow-500/10 text-yellow-500",
      high: "bg-orange-500/10 text-orange-500",
      critical: "bg-red-500/10 text-red-500"
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = { low: "Baixa", medium: "Média", high: "Alta", critical: "Crítica" };
    return labels[priority as keyof typeof labels] || "Média";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      backlog: "Backlog",
      in_progress: "Em Progresso",
      done: "Concluído"
    };
    return labels[status as keyof typeof labels] || status;
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const completedTasks = tasks.filter(t => t.status === 'done').length;

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-background">
        <p className="text-foreground">Carregando...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-background">
        <p className="text-foreground">História não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Backlog"))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">{story.title}</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {story.story_number} • {project?.name || "Projeto"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCopyModal(true)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
            <Button onClick={() => setShowEditModal(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo</span>
                <Badge
                  style={{ backgroundColor: storyType?.color + '20', color: storyType?.color }}
                >
                  {storyType?.name || "Sem tipo"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prioridade</span>
                <Badge className={getPriorityColor(story.priority)}>
                  {getPriorityLabel(story.priority)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline">{getStatusLabel(story.status)}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Story Details */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {story.story_points && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Story Points</label>
                <p className="text-foreground mt-1">{story.story_points}</p>
              </div>
            )}

            {story.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-foreground mt-1 whitespace-pre-wrap">{story.description}</p>
              </div>
            )}

            {story.acceptance_criteria && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Critérios de Aceitação</label>
                <p className="text-foreground mt-1 whitespace-pre-wrap">{story.acceptance_criteria}</p>
              </div>
            )}

            {story.definition_of_done && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Definição de Pronto</label>
                <p className="text-foreground mt-1 whitespace-pre-wrap">{story.definition_of_done}</p>
              </div>
            )}

            {story.assigned_to_name && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Responsável</label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <p className="text-foreground">{story.assigned_to_name}</p>
                </div>
              </div>
            )}

            {feature && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Funcionalidade</label>
                <Link to={`${createPageUrl("FeatureView")}?id=${feature.id}`}>
                  <p className="text-primary hover:underline mt-1">{feature.title}</p>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                <CardTitle className="text-foreground">
                  Tarefas ({completedTasks}/{tasks.length})
                </CardTitle>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma tarefa criada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleEditTask(task)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <div className="flex-1">
                        <p className="text-foreground font-medium">{task.title}</p>
                        {task.assigned_to_name && (
                          <p className="text-sm text-muted-foreground">{task.assigned_to_name}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {task.status === 'done' ? 'Concluída' : task.status === 'in_progress' ? 'Em andamento' : 'Pendente'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comments */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Comentários</CardTitle>
          </CardHeader>
          <CardContent>
            <CommentsSection
              storyId={storyId!}
              projectId={story.project_id}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showEditModal && (
        <StoryModal
          story={story}
          projectId={story.project_id}
          featureId={story.feature_id}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            loadData();
            setShowEditModal(false);
          }}
        />
      )}

      {showCopyModal && (
        <StoryCopyModal
          story={story}
          onClose={() => setShowCopyModal(false)}
          onCopied={() => {
            loadData();
            setShowCopyModal(false);
            toast.success("História copiada com sucesso!");
          }}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          storyId={storyId!}
          projectId={story.project_id}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSave={() => {
            loadData();
            setShowTaskModal(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
