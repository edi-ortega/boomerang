import { supabase } from "@/integrations/supabase/client";
import { 
  getBaseEmailTemplate, 
  getAlertEmailTemplate, 
  getWelcomeEmailTemplate,
  getPasswordResetEmailTemplate,
  getMaintenanceNotificationTemplate,
  type EmailTemplateParams 
} from "./email-templates";

export interface SendEmailParams {
  client_id: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  alert_type?: string;
}

export {
  getBaseEmailTemplate,
  getAlertEmailTemplate,
  getWelcomeEmailTemplate,
  getPasswordResetEmailTemplate,
  getMaintenanceNotificationTemplate,
  type EmailTemplateParams
};

/**
 * Envia um email usando as configurações SMTP do cliente
 * 
 * @example
 * ```typescript
 * await sendEmail({
 *   client_id: "uuid-do-cliente",
 *   to: "usuario@exemplo.com",
 *   subject: "Bem-vindo ao sistema",
 *   html: "<h1>Olá!</h1><p>Bem-vindo ao nosso sistema.</p>",
 *   text: "Olá! Bem-vindo ao nosso sistema.",
 *   alert_type: "welcome"
 * });
 * ```
 */
export async function sendEmail(params: SendEmailParams) {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao invocar função de envio de email:', error);
    throw error;
  }
}

/**
 * Envia um email de alerta com template profissional
 */
export async function sendAlertEmail(
  client_id: string,
  to: string | string[],
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'error' | 'success' = 'info',
  alertType: string = 'alert'
) {
  const html = getAlertEmailTemplate(title, message, severity);
  const text = `${title}\n\n${message}\n\nEsta é uma mensagem automática do sistema IT Manager.`;

  return sendEmail({
    client_id,
    to,
    subject: title,
    html,
    text,
    alert_type: alertType,
  });
}

/**
 * Envia um email de notificação simples
 */
export async function sendNotificationEmail(
  client_id: string,
  to: string | string[],
  subject: string,
  message: string
) {
  return sendAlertEmail(client_id, to, subject, message, 'info', 'notification');
}

/**
 * Envia email de boas-vindas com template profissional
 */
export async function sendWelcomeEmail(
  client_id: string,
  to: string,
  userName: string,
  loginUrl: string = `${window.location.origin}/auth`
) {
  const html = getWelcomeEmailTemplate(userName, loginUrl);
  const text = `Olá ${userName},\n\nSeja bem-vindo ao IT Manager! Acesse: ${loginUrl}`;

  return sendEmail({
    client_id,
    to,
    subject: 'Bem-vindo ao IT Manager',
    html,
    text,
    alert_type: 'welcome',
  });
}

/**
 * Envia email de recuperação de senha com template profissional
 */
export async function sendPasswordResetEmail(
  client_id: string,
  to: string,
  userName: string,
  resetUrl: string
) {
  const html = getPasswordResetEmailTemplate(userName, resetUrl);
  const text = `Olá ${userName},\n\nPara redefinir sua senha, acesse: ${resetUrl}\n\nEste link expira em 1 hora.`;

  return sendEmail({
    client_id,
    to,
    subject: 'Redefinir sua senha - IT Manager',
    html,
    text,
    alert_type: 'password_reset',
  });
}

/**
 * Envia notificação de manutenção agendada
 */
export async function sendMaintenanceNotification(
  client_id: string,
  to: string | string[],
  assetName: string,
  maintenanceDate: string,
  description: string
) {
  const html = getMaintenanceNotificationTemplate(assetName, maintenanceDate, description);
  const text = `Manutenção agendada para ${assetName} em ${maintenanceDate}.\n\n${description}`;

  return sendEmail({
    client_id,
    to,
    subject: `Manutenção Agendada - ${assetName}`,
    html,
    text,
    alert_type: 'maintenance',
  });
}
