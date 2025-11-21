import React, { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Trash2, Mountain, Layers, ChevronRight, Plus } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/hooks/use-toast";
import { hasPermission, PERMISSIONS } from "@/lib/permissions-helper";

export default function EpicDetail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const epicId = searchParams.get("id");

  const [epic, setEpic] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [features, setFeatures] = useState<any[]>([]);
  const [showFeatures, setShowFeatures] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [hierarchyCount, setHierarchyCount] = useState({ features: 0, stories: 0, tasks: 0 });

  useEffect(() => {
    if (epicId) {
      loadData();
      loadPermissions();
      loadHierarchyCount();
    }
  }, [epicId]);

  const loadPermissions = async () => {
    try {
      const [edit, del] = await Promise.all([
        hasPermission(PERMISSIONS.EDIT_EPIC),
        hasPermission(PERMISSIONS.DELETE_EPIC)
      ]);
      setCanEdit(edit);
      setCanDelete(del);
    } catch (error) {
      console.error("Error loading permissions:", error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allEpics, allProjects, allUsers, relatedFeatures] = await Promise.all([
        base44.entities.Epic.list(),
        base44.entities.Project.list("-created_at"),
        base44.entities.User.list(),
        base44.entities.Feature.filter({ epic_id: epicId })
      ]);

      const epicData = allEpics.find((e: any) => e.id === epicId);
      if (epicData) {
        setEpic(epicData);
      }
      setProjects(allProjects);
      setUsers(allUsers);
      setFeatures(relatedFeatures || []);
    } catch (error) {
      console.error("Error loading epic:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os dados do épico.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadHierarchyCount = async () => {
    try {
      const [relatedFeatures, relatedStories, relatedTasks] = await Promise.all([
        base44.entities.Feature.filter({ epic_id: epicId }),
        base44.entities.Story.filter({ epic_id: epicId }),
        base44.entities.Task.filter({ epic_id: epicId })
      ]);

      setHierarchyCount({
        features: relatedFeatures.length,
        stories: relatedStories.length,
        tasks: relatedTasks.length
      });
    } catch (error) {
      console.error("Error loading hierarchy count:", error);
    }
  };

  const handleSave = async () => {
    if (!epic || !epic.title || !epic.project_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e projeto são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.Epic.update(epicId!, epic);
      toast({
        title: "Épico atualizado!",
        description: "O épico foi atualizado com sucesso."
      });
      navigate(createPageUrl("BacklogManagement"));
    } catch (error) {
      console.error("Error updating epic:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o épico.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.Epic.delete(epicId!);
      toast({ title: "Épico excluído", description: "O épico foi excluído com sucesso." });
      navigate(createPageUrl("BacklogManagement"));
    } catch (error) {
      console.error("Error deleting epic:", error);
      toast({ title: "Erro ao excluir", description: "Não foi possível excluir o épico.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="min-h-screen p-8 flex items-center justify-center bg-background"><p className="text-foreground">Carregando...</p></div>;
  if (!epic) return <div className="min-h-screen p-8 flex items-center justify-center bg-background"><p className="text-foreground">Épico não encontrado</p></div>;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("BacklogManagement"))}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Mountain className="w-8 h-8 text-primary" />
                Detalhes do Épico
              </h1>
              <p className="text-muted-foreground">Gerencie as informações do épico</p>
            </div>
          </div>
          {canDelete && <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={isSaving}><Trash2 className="w-4 h-4 mr-2" />Excluir</Button>}
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Título *</label>
              <Input value={epic.title} onChange={(e) => setEpic({ ...epic, title: e.target.value })} className="bg-background border-border text-foreground" disabled={!canEdit} />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Descrição</label>
              <Textarea value={epic.description || ""} onChange={(e) => setEpic({ ...epic, description: e.target.value })} className="bg-background border-border text-foreground min-h-[100px]" disabled={!canEdit} />
            </div>

            {canEdit && (
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => navigate(createPageUrl("BacklogManagement"))} className="flex-1" disabled={isSaving}>Cancelar</Button>
                <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/80" disabled={isSaving}><Save className="w-4 h-4 mr-2" />{isSaving ? "Salvando..." : "Salvar Alterações"}</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Confirmar Exclusão</h3>
                <p className="text-muted-foreground mb-4">Tem certeza que deseja excluir este épico?</p>
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
