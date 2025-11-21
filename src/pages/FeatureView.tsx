import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Plus, Layers, BookOpen, ChevronRight, Target } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import FeatureModal from "@/components/FeatureModal";
import StoryModal from "@/components/StoryModal";

export default function FeatureView() {
  const navigate = useNavigate();
  const { currentTenantId } = useTenant();
  const [searchParams] = useSearchParams();
  const featureId = searchParams.get("id");

  const [feature, setFeature] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [epic, setEpic] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);

  useEffect(() => {
    if (featureId) loadData();
  }, [featureId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: featureData, error: featureError } = await supabase
        .from('prj_feature' as any)
        .select('*')
        .eq('id', featureId)
        .eq('client_id', currentTenantId)
        .maybeSingle() as any;

      if (featureError) throw featureError;
      if (!featureData) {
        toast.error("Funcionalidade não encontrada.");
        navigate(createPageUrl("Backlog"));
        return;
      }

      setFeature(featureData);

      // Load project
      if (featureData.project_id) {
        const { data: projectData } = await supabase
          .from('prj_project' as any)
          .select('*')
          .eq('id', featureData.project_id)
          .maybeSingle() as any;
        setProject(projectData);
      }

      // Load epic
      if (featureData.epic_id) {
        const { data: epicData } = await supabase
          .from('prj_epic' as any)
          .select('*')
          .eq('id', featureData.epic_id)
          .maybeSingle() as any;
        setEpic(epicData);
      }

      // Load stories
      const { data: storiesData } = await supabase
        .from('prj_story' as any)
        .select(`
          *,
          story_type:prj_story_type(name, color),
          tasks:prj_task(count)
        `)
        .eq('feature_id', featureId)
        .eq('client_id', currentTenantId)
        .order('created_at', { ascending: false }) as any;
      setStories(storiesData || []);

    } catch (error) {
      console.error("Error loading feature:", error);
      toast.error("Erro ao carregar funcionalidade.");
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

  const handleEditStory = (story: any) => {
    setEditingStory(story);
    setShowStoryModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-background">
        <p className="text-foreground">Carregando...</p>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-background">
        <p className="text-foreground">Funcionalidade não encontrada</p>
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
                <Layers className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">{feature.title}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>{project?.name || "Projeto"}</span>
                {epic && (
                  <>
                    <span>•</span>
                    <Link
                      to={`${createPageUrl("EpicView")}?id=${epic.id}`}
                      className="hover:text-primary"
                    >
                      {epic.title}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button onClick={() => setShowEditModal(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prioridade</span>
                <Badge className={getPriorityColor(feature.priority)}>
                  {getPriorityLabel(feature.priority)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline">{getStatusLabel(feature.status)}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progresso</span>
                <span className="text-foreground font-semibold">{feature.progress || 0}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Details */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feature.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-foreground mt-1 whitespace-pre-wrap">{feature.description}</p>
              </div>
            )}

            {(feature.start_date || feature.target_date) && (
              <div className="grid grid-cols-2 gap-4">
                {feature.start_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
                    <p className="text-foreground mt-1">
                      {new Date(feature.start_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                {feature.target_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data Alvo</label>
                    <p className="text-foreground mt-1">
                      {new Date(feature.target_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stories */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle className="text-foreground">
                  Histórias ({stories.length})
                </CardTitle>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingStory(null);
                  setShowStoryModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova História
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stories.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma história criada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex-1">
                      <Link to={`${createPageUrl("StoryView")}?id=${story.id}`}>
                        <h4 className="text-foreground font-medium group-hover:text-primary transition-colors">
                          {story.title}
                        </h4>
                      </Link>
                      <div className="flex items-center gap-2 mt-2">
                        {story.story_type && (
                          <Badge
                            style={{
                              backgroundColor: story.story_type.color + '20',
                              color: story.story_type.color
                            }}
                            className="text-xs"
                          >
                            {story.story_type.name}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {getStatusLabel(story.status)}
                        </Badge>
                        {story.story_points && (
                          <span className="text-xs text-muted-foreground">
                            {story.story_points} pontos
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {story.tasks?.[0]?.count || 0} tarefas
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStory(story)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Link to={`${createPageUrl("StoryView")}?id=${story.id}`}>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showEditModal && (
        <FeatureModal
          feature={feature}
          projectId={feature.project_id}
          epicId={feature.epic_id}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            loadData();
            setShowEditModal(false);
          }}
        />
      )}

      {showStoryModal && (
        <StoryModal
          story={editingStory}
          projectId={feature.project_id}
          featureId={featureId!}
          onClose={() => {
            setShowStoryModal(false);
            setEditingStory(null);
          }}
          onSave={() => {
            loadData();
            setShowStoryModal(false);
            setEditingStory(null);
          }}
        />
      )}
    </div>
  );
}
