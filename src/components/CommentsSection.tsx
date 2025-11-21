import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { sendMentionNotifications } from "@/lib/mention-helper";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, User, Edit2, Trash2, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { useTenant } from "@/contexts/TenantContext";

interface CommentsSectionProps {
  taskId?: string;
  storyId?: string;
  projectId: string;
}

export default function CommentsSection({ taskId, storyId, projectId }: CommentsSectionProps) {
  const { confirm } = useConfirm();
  const { currentTenantId } = useTenant();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [taskId, storyId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Buscar usuário atual
      const storedSession = localStorage.getItem("bmr_session");
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        setCurrentUser(parsedSession.user);
      }

      // Buscar comentários
      let query = supabase
        .from('prj_comment' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('created_date', { ascending: false });

      if (taskId) {
        query = query.eq('task_id', taskId);
      } else if (storyId) {
        query = query.eq('story_id', storyId);
      }

      const { data: allComments } = await query as any;
      setComments(allComments || []);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        content: newComment,
        user_email: currentUser.email,
        user_name: currentUser.name || currentUser.email,
        project_id: projectId,
        task_id: taskId || null,
        story_id: storyId || null,
        tenant_id: currentTenantId,
      };

      const { error } = await supabase
        .from('prj_comment' as any)
        .insert(commentData) as any;

      if (error) throw error;

      // Enviar notificações de menção
      if (mentionedUsers.length > 0) {
        await sendMentionNotifications({
          mentionedEmails: mentionedUsers,
          entityType: taskId ? "task" : "story",
          entityId: taskId || storyId || "",
          entityTitle: `Comentário no projeto`,
          comment: newComment,
          mentionedBy: currentUser.name || currentUser.email,
        });
      }

      toast.success("Comentário adicionado!");
      setNewComment("");
      setMentionedUsers([]);
      loadData();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Erro ao adicionar comentário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('prj_comment' as any)
        .update({ content: editContent })
        .eq('id', commentId) as any;

      if (error) throw error;

      toast.success("Comentário atualizado!");
      setEditingCommentId(null);
      setEditContent("");
      loadData();
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Erro ao atualizar comentário");
    }
  };

  const handleDelete = async (commentId: string) => {
    const confirmed = await confirm({
      title: "Excluir comentário?",
      description: "Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar"
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('prj_comment' as any)
        .delete()
        .eq('id', commentId) as any;

      if (error) throw error;

      toast.success("Comentário excluído!");
      loadData();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Erro ao excluir comentário");
    }
  };

  const startEdit = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Comentários</h3>
          <Badge variant="secondary" className="ml-auto">{comments.length}</Badge>
        </div>

        {/* Novo comentário */}
        <div className="space-y-2">
          <MentionTextarea
            value={newComment}
            onChange={setNewComment}
            onMention={setMentionedUsers}
            placeholder="Adicione um comentário... (use @ para mencionar alguém)"
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !newComment.trim()}
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "Enviando..." : "Comentar"}
            </Button>
          </div>
        </div>

        {/* Lista de comentários */}
        <div className="space-y-3 mt-6">
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{comment.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.created_date).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {currentUser?.email === comment.user_email && (
                    <div className="flex gap-1">
                      {editingCommentId !== comment.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEdit(comment)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(comment.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <MentionTextarea
                      value={editContent}
                      onChange={setEditContent}
                      onMention={setMentionedUsers}
                      placeholder="Editar comentário..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(comment.id)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {comments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum comentário ainda</p>
              <p className="text-xs">Seja o primeiro a comentar!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
