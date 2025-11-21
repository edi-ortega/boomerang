import { bmr } from "@/api/boomerangClient";
import { getCurrentTenantId } from "./tenant-helper";

interface MentionNotificationParams {
  mentionedEmails: string[];
  entityType: "epic" | "feature" | "story" | "task";
  entityId: string;
  entityTitle: string;
  comment?: string;
  mentionedBy: string;
}

export async function sendMentionNotifications({
  mentionedEmails,
  entityType,
  entityId,
  entityTitle,
  comment,
  mentionedBy,
}: MentionNotificationParams) {
  try {
    const tenantId = await getCurrentTenantId();
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

    // Filtrar para não notificar o próprio usuário
    const emailsToNotify = mentionedEmails.filter(
      (email) => email !== currentUser.email
    );

    if (emailsToNotify.length === 0) return;

    // Criar notificações para cada usuário mencionado
    const notifications = emailsToNotify.map((email) => ({
      user_email: email,
      type: "mention",
      title: `${mentionedBy} mencionou você`,
      message: comment
        ? `Você foi mencionado em um comentário: "${comment.substring(0, 100)}..."`
        : `Você foi mencionado em ${getEntityLabel(entityType)}: ${entityTitle}`,
      reference_type: entityType,
      reference_id: entityId,
      client_id: tenantId,
      read: false,
    }));

    // Criar todas as notificações
    await Promise.all(
      notifications.map((notification) =>
        bmr.entities.Notification.create(notification)
      )
    );

    console.log(
      `✅ Sent ${notifications.length} mention notifications for ${entityType} ${entityId}`
    );
  } catch (error) {
    console.error("Error sending mention notifications:", error);
  }
}

function getEntityLabel(entityType: string): string {
  const labels: Record<string, string> = {
    epic: "um épico",
    feature: "uma funcionalidade",
    story: "uma história",
    task: "uma tarefa",
  };
  return labels[entityType] || "um item";
}

export function extractMentionsFromText(text: string, users: any[]): string[] {
  const mentions: string[] = [];
  const regex = /@(\w+(?:\s+\w+)*)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const mentionedName = match[1];
    const user = users.find((u: any) => u.name === mentionedName);
    if (user) {
      mentions.push(user.email);
    }
  }

  return mentions;
}
