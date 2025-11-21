import React, { useState, useEffect } from "react";
import { bmr } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Trash2, Layers, BookOpen, ChevronRight } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/hooks/use-toast";

export default function FeatureDetail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const featureId = searchParams.get("id");

  const [feature, setFeature] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [epics, setEpics] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [showStories, setShowStories] = useState(false);

  useEffect(() => {
    if (featureId) loadData();
  }, [featureId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allFeatures, allProjects, allEpics, allUsers, relatedStories] = await Promise.all([
        bmr.entities.Feature.list(),
        bmr.entities.Project.list("-created_at"),
        bmr.entities.Epic.list("-created_at"),
        bmr.entities.User.list(),
        bmr.entities.Story.filter({ feature_id: featureId })
      ]);

      const featureData = allFeatures.find((f: any) => f.id === featureId);
      if (featureData) setFeature(featureData);
      setProjects(allProjects);
      setEpics(allEpics);
      setUsers(allUsers);
      setStories(relatedStories || []);
    } catch (error) {
      console.error("Error loading feature:", error);
      toast({ title: "Erro ao carregar", description: "Não foi possível carregar os dados da funcionalidade.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!feature || !feature.title || !feature.project_id) {
      toast({ title: "Campos obrigatórios", description: "Título e projeto são obrigatórios.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await bmr.entities.Feature.update(featureId!, feature);
      toast({ title: "Funcionalidade atualizada!", description: "A funcionalidade foi atualizada com sucesso." });
      navigate(createPageUrl("BacklogManagement"));
    } catch (error) {
      console.error("Error updating feature:", error);
      toast({ title: "Erro ao atualizar", description: "Não foi possível atualizar a funcionalidade.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await bmr.entities.Feature.delete(featureId!);
      toast({ title: "Funcionalidade excluída", description: "A funcionalidade foi excluída com sucesso." });
      navigate(createPageUrl("BacklogManagement"));
    } catch (error) {
      console.error("Error deleting feature:", error);
      toast({ title: "Erro ao excluir", description: "Não foi possível excluir a funcionalidade.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="min-h-screen p-8 flex items-center justify-center bg-background"><p className="text-foreground">Carregando...</p></div>;
  if (!feature) return <div className="min-h-screen p-8 flex items-center justify-center bg-background"><p className="text-foreground">Funcionalidade não encontrada</p></div>;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("BacklogManagement"))}><ArrowLeft className="w-4 h-4" /></Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3"><Layers className="w-8 h-8 text-primary" />Detalhes da Funcionalidade</h1>
              <p className="text-muted-foreground">Gerencie as informações da funcionalidade</p>
            </div>
          </div>
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={isSaving}><Trash2 className="w-4 h-4 mr-2" />Excluir</Button>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Título *</label>
              <Input value={feature.title} onChange={(e) => setFeature({ ...feature, title: e.target.value })} className="bg-background border-border text-foreground" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Descrição</label>
              <Textarea value={feature.description || ""} onChange={(e) => setFeature({ ...feature, description: e.target.value })} className="bg-background border-border text-foreground min-h-[100px]" />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => navigate(createPageUrl("BacklogManagement"))} className="flex-1" disabled={isSaving}>Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/80" disabled={isSaving}><Save className="w-4 h-4 mr-2" />{isSaving ? "Salvando..." : "Salvar Alterações"}</Button>
            </div>
          </CardContent>
        </Card>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Confirmar Exclusão</h3>
                <p className="text-muted-foreground mb-4">Tem certeza que deseja excluir esta funcionalidade?</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">Cancelar</Button>
                  <Button variant="destructive" onClick={handleDelete} className="flex-1">Excluir</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
