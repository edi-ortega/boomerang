import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, CheckSquare, User } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import TaskModal from "@/components/TaskModal";
import CommentsSection from "@/components/comments/CommentsSection";

export default function TaskView() {
  const navigate = useNavigate();
  const { currentTenantId } = useTenant();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get("id");

  const [task, setTask] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [story, setStory] = useState<any>(null);
  const [taskType, setTaskType] = useState<any>(null);
  const [assignedUser, setAssignedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (taskId) loadData();
  }, [taskId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('prj_task' as any)
        .select(`
          *,
          task_type:prj_task_type(name, color)
        `)
        .eq('id', taskId)
        .eq('client_id', currentTenantId)
        .maybeSingle() as any;

      if (taskError) throw taskError;
      if (!taskData) {
        toast.error("Tarefa não encontrada.");
        navigate(createPageUrl("Backlog"));
        return;
      }

      setTask(taskData);
      setTaskType(taskData.task_type);

      // Load project
      if (taskData.project_id) {
        const { data: projectData } = await supabase
          .from('prj_project' as any)
          .select('*')
          .eq('id', taskData.project_id)
          .maybeSingle() as any;
        setProject(projectData);
      }

      // Load story
      if (taskData.story_id) {
        const { data: storyData } = await supabase
          .from('prj_story' as any)
          .select('*')
          .eq('id', taskData.story_id)
          .maybeSingle() as any;
        setStory(storyData);
      }

      // Load assigned user
      if (taskData.assigned_to_email) {
        const { data: userData } = await supabase
          .from('bmr_user' as any)
          .select('*')
          .eq('email', taskData.assigned_to_email)
          .maybeSingle() as any;
        setAssignedUser(userData);
      }

    } catch (error) {
      console.error("Error loading task:", error);
      toast.error("Erro ao carregar tarefa.");
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
      todo: "A Fazer",
      in_progress: "Em Progresso",
      done: "Concluído",
      blocked: "Bloqueado"
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      backlog: "bg-gray-500/10 text-gray-500",
      todo: "bg-blue-500/10 text-blue-500",
      in_progress: "bg-yellow-500/10 text-yellow-500",
      done: "bg-green-500/10 text-green-500",
      blocked: "bg-red-500/10 text-red-500"
    };
    return colors[status as keyof typeof colors] || colors.backlog;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6">
        <p>Tarefa não encontrada</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">{task.title}</h1>
          </div>
        </div>
        <Button onClick={() => setShowEditModal(true)}>
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {project && (
          <>
            <Link to={`/projectdetail?id=${project.id}`} className="hover:text-foreground">
              {project.name}
            </Link>
            <span>/</span>
          </>
        )}
        {story && (
          <>
            <Link to={`/storyview?id=${story.id}`} className="hover:text-foreground">
              {story.title}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground">{task.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Tarefa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.description && (
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: task.description }}
                  />
                </div>
              )}

              {task.acceptance_criteria && (
                <div>
                  <h3 className="font-semibold mb-2">Critérios de Aceitação</h3>
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: task.acceptance_criteria }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Comentários</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentsSection 
                taskId={task.id}
                projectId={task.project_id}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {taskType && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tipo</p>
                  <Badge 
                    className="text-white"
                    style={{ backgroundColor: taskType.color || '#3b82f6' }}
                  >
                    {taskType.name}
                  </Badge>
                </div>
              )}

              {task.priority && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prioridade</p>
                  <Badge className={getPriorityColor(task.priority)}>
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </div>
              )}

              {task.status && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge className={getStatusColor(task.status)}>
                    {getStatusLabel(task.status)}
                  </Badge>
                </div>
              )}

              {task.estimated_hours && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estimativa</p>
                  <p className="font-medium">{task.estimated_hours}h</p>
                </div>
              )}

              {task.actual_hours && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Horas Reais</p>
                  <p className="font-medium">{task.actual_hours}h</p>
                </div>
              )}

              {task.due_date && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data de Vencimento</p>
                  <p className="font-medium">
                    {new Date(task.due_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              {assignedUser && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Responsável</p>
                  <div className="flex items-center gap-2">
                    {assignedUser.avatar_url ? (
                      <img
                        src={assignedUser.avatar_url}
                        alt={assignedUser.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <span className="font-medium">{assignedUser.name || assignedUser.email}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <TaskModal
          task={task}
          projectId={task.project_id}
          storyId={task.story_id}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            loadData();
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}
