import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Plus, Target, Layers, BookOpen, ChevronRight } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import EpicModal from "@/components/EpicModal";
import FeatureModal from "@/components/FeatureModal";

export default function EpicView() {
  const navigate = useNavigate();
  const { currentTenantId } = useTenant();
  const [searchParams] = useSearchParams();
  const epicId = searchParams.get("id");

  const [epic, setEpic] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [features, setFeatures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<any>(null);

  useEffect(() => {
    if (epicId) loadData();
  }, [epicId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: epicData, error: epicError } = await supabase
        .from('prj_epic' as any)
        .select('*')
        .eq('id', epicId)
        .eq('client_id', currentTenantId)
        .maybeSingle() as any;

      if (epicError) throw epicError;
      if (!epicData) {
        toast.error("Épico não encontrado.");
        navigate(createPageUrl("Backlog"));
        return;
      }

      setEpic(epicData);

      // Load project
      if (epicData.project_id) {
        const { data: projectData } = await supabase
          .from('prj_project' as any)
          .select('*')
          .eq('id', epicData.project_id)
          .maybeSingle() as any;
        setProject(projectData);
      }

      // Load features
      const { data: featuresData } = await supabase
        .from('prj_feature' as any)
        .select(`
          *,
          stories:prj_story(count)
        `)
        .eq('epic_id', epicId)
        .eq('client_id', currentTenantId)
        .order('created_at', { ascending: false }) as any;
      setFeatures(featuresData || []);

    } catch (error) {
      console.error("Error loading epic:", error);
      toast.error("Erro ao carregar épico.");
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
      planning: "Planejamento",
      in_progress: "Em Progresso",
      completed: "Concluído"
    };
    return labels[status as keyof typeof labels] || status;
  };

  const handleEditFeature = (feature: any) => {
    setEditingFeature(feature);
    setShowFeatureModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-background">
        <p className="text-foreground">Carregando...</p>
      </div>
    );
  }

  if (!epic) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-background">
        <p className="text-foreground">Épico não encontrado</p>
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
                <Target className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">{epic.title}</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {epic.epic_number} • {project?.name || "Projeto"}
              </p>
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
                <Badge className={getPriorityColor(epic.priority)}>
                  {getPriorityLabel(epic.priority)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline">{getStatusLabel(epic.status)}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progresso</span>
                <span className="text-foreground font-semibold">{epic.progress || 0}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Epic Details */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {epic.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-foreground mt-1 whitespace-pre-wrap">{epic.description}</p>
              </div>
            )}

            {(epic.start_date || epic.end_date) && (
              <div className="grid grid-cols-2 gap-4">
                {epic.start_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
                    <p className="text-foreground mt-1">
                      {new Date(epic.start_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                {epic.end_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Término</label>
                    <p className="text-foreground mt-1">
                      {new Date(epic.end_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <CardTitle className="text-foreground">
                  Funcionalidades ({features.length})
                </CardTitle>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingFeature(null);
                  setShowFeatureModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Funcionalidade
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {features.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma funcionalidade criada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex-1">
                      <Link to={`${createPageUrl("FeatureView")}?id=${feature.id}`}>
                        <h4 className="text-foreground font-medium group-hover:text-primary transition-colors">
                          {feature.title}
                        </h4>
                      </Link>
                      {feature.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {feature.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {getStatusLabel(feature.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {feature.stories?.[0]?.count || 0} histórias
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditFeature(feature)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Link to={`${createPageUrl("FeatureView")}?id=${feature.id}`}>
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
        <EpicModal
          epic={epic}
          projectId={epic.project_id}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            loadData();
            setShowEditModal(false);
          }}
        />
      )}

      {showFeatureModal && (
        <FeatureModal
          feature={editingFeature}
          projectId={epic.project_id}
          epicId={epicId!}
          onClose={() => {
            setShowFeatureModal(false);
            setEditingFeature(null);
          }}
          onSave={() => {
            loadData();
            setShowFeatureModal(false);
            setEditingFeature(null);
          }}
        />
      )}
    </div>
  );
}
