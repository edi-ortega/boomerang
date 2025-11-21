import React, { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Trash2, CheckSquare, Clock } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import CommentsSection from "@/components/comments/CommentsSection";
import TimeTracker from "@/components/TimeTracker";
import TimeLogModal from "@/components/TimeLogModal";

export default function TaskDetail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get("id");

  const [task, setTask] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);

  useEffect(() => {
    if (taskId) loadData();
  }, [taskId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [taskData, allProjects, allStories, allUsers] = await Promise.all([
        base44.entities.Task.filter({ id: taskId }),
        base44.entities.Project.list("-created_at"),
        base44.entities.Story.list("-created_at"),
        base44.entities.User.list()
      ]);

      if (taskData && taskData.length > 0) setTask(taskData[0]);
      setProjects(allProjects);
      setStories(allStories);
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!task || !task.title || !task.project_id) {
      toast({ title: "Campos obrigatórios", description: "Título e projeto são obrigatórios.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.Task.update(taskId!, task);
      toast({ title: "Tarefa atualizada!", description: "A tarefa foi atualizada com sucesso." });
      navigate(createPageUrl("BacklogManagement"));
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ title: "Erro ao atualizar", description: "Não foi possível atualizar a tarefa.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.Task.delete(taskId!);
      toast({ title: "Tarefa excluída", description: "A tarefa foi excluída com sucesso." });
      navigate(createPageUrl("BacklogManagement"));
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({ title: "Erro ao excluir", description: "Não foi possível excluir a tarefa.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="min-h-screen p-8 flex items-center justify-center bg-background"><p className="text-foreground">Carregando...</p></div>;
  if (!task) return <div className="min-h-screen p-8 flex items-center justify-center bg-background"><p className="text-foreground">Tarefa não encontrada</p></div>;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("BacklogManagement"))}><ArrowLeft className="w-4 h-4" /></Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3"><CheckSquare className="w-8 h-8 text-primary" />Detalhes da Tarefa</h1>
              <p className="text-muted-foreground">Gerencie as informações da tarefa</p>
            </div>
          </div>
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={isSaving}><Trash2 className="w-4 h-4 mr-2" />Excluir</Button>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Título *</label>
              <Input value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} className="bg-background border-border text-foreground" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Descrição</label>
              <ReactQuill value={task.description || ""} onChange={(value: string) => setTask({ ...task, description: value })} className="bg-background text-foreground rounded-lg" theme="snow" />
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
                <p className="text-muted-foreground mb-4">Tem certeza que deseja excluir esta tarefa?</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">Cancelar</Button>
                  <Button variant="destructive" onClick={handleDelete} className="flex-1">Excluir</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showTimeLogModal && <TimeLogModal taskId={taskId!} onClose={() => setShowTimeLogModal(false)} />}
      </div>
    </div>
  );
}
