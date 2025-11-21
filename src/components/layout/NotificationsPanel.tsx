import { useState, useEffect } from "react";
import { bmr } from "@/api/boomerangClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle, MessageCircle, User, CheckSquare, BookOpen, Filter, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/hooks/use-confirm";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onOpenTask?: (taskId: string) => void;
  onOpenStory?: (storyId: string) => void;
}

export default function NotificationsPanel({ isOpen, onClose, currentUser, onOpenTask, onOpenStory }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnlyUnread, setShowOnlyUnread] = useState(true);
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    if (isOpen && currentUser) {
      loadNotifications();
    }
  }, [isOpen, currentUser]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const allNotifications = await bmr.entities.Notification.filter(
        { user_email: currentUser.email },
        "-created_at"
      );
      setNotifications(allNotifications || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await bmr.entities.Notification.update(notificationId, {
        is_read: true,
        read_at: new Date().toISOString()
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      for (const notification of unreadNotifications) {
        await bmr.entities.Notification.update(notification.id, {
          is_read: true,
          read_at: new Date().toISOString()
        });
      }
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const confirmed = await confirm({
      title: "Excluir notificação?",
      description: "Tem certeza que deseja excluir esta notificação?"
    });

    if (!confirmed) return;

    try {
      await bmr.entities.Notification.delete(notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast({
        title: "Notificação excluída!",
        description: "A notificação foi removida com sucesso."
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a notificação.",
        variant: "destructive"
      });
    }
  };

  const deleteAllRead = async () => {
    const readNotifications = notifications.filter(n => n.is_read);
    
    if (readNotifications.length === 0) {
      toast({
        title: "Nenhuma notificação lida",
        description: "Não há notificações lidas para excluir.",
        variant: "destructive"
      });
      return;
    }

    const confirmed = await confirm({
      title: "Excluir todas lidas?",
      description: `Tem certeza que deseja excluir ${readNotifications.length} notificações lidas?`
    });

    if (!confirmed) return;

    try {
      for (const notification of readNotifications) {
        await bmr.entities.Notification.delete(notification.id);
      }
      
      setNotifications(prev => prev.filter(n => !n.is_read));
      
      toast({
        title: "Notificações excluídas!",
        description: `${readNotifications.length} notificações foram removidas.`
      });
    } catch (error) {
      console.error("Error deleting read notifications:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir as notificações.",
        variant: "destructive"
      });
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Marcar como lida
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Abrir tarefa ou story relacionada
    if (notification.reference_type === "task" && onOpenTask) {
      onOpenTask(notification.reference_id);
    } else if (notification.reference_type === "story" && onOpenStory) {
      onOpenStory(notification.reference_id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
      case "task_updated":
        return <CheckSquare className="w-5 h-5" />;
      case "story_assigned":
      case "story_updated":
        return <BookOpen className="w-5 h-5" />;
      case "mention":
        return <MessageCircle className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const filteredNotifications = showOnlyUnread
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="h-full flex flex-col border-0 rounded-none">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    Notificações
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {unreadCount}
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                    className="flex-1"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showOnlyUnread ? "Todas" : "Não Lidas"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar Todas Lidas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteAllRead}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mb-2" />
                    <p>Nenhuma notificação {showOnlyUnread ? "não lida" : ""}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredNotifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        className={`p-4 hover:bg-accent/50 cursor-pointer transition-colors ${
                          !notification.is_read ? "bg-accent/20" : ""
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.created_date).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => deleteNotification(notification.id, e)}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </AnimatePresence>
      <ConfirmDialog />
    </>
  );
}
