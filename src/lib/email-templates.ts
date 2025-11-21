/**
 * Templates de email para o sistema IT Manager
 * Usando as cores do tema: laranja (#f97316) e tons de cinza
 */

export interface EmailTemplateParams {
  title: string;
  preheader?: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
}

/**
 * Template base para emails do sistema
 */
export function getBaseEmailTemplate(params: EmailTemplateParams): string {
  const {
    title,
    preheader = '',
    content,
    buttonText,
    buttonUrl,
    footerText = 'Esta é uma mensagem automática do IT Manager.'
  } = params;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    table {
      border-collapse: collapse;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f3f4f6;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 20% 50%, rgba(249, 115, 22, 0.15) 0%, transparent 50%),
                  radial-gradient(circle at 80% 80%, rgba(249, 115, 22, 0.15) 0%, transparent 50%);
      pointer-events: none;
    }
    .logo {
      width: 60px;
      height: 60px;
      background-color: rgba(249, 115, 22, 0.2);
      border: 2px solid rgba(249, 115, 22, 0.3);
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 1;
    }
    .logo-icon {
      width: 32px;
      height: 32px;
      color: #f97316;
    }
    .brand {
      position: relative;
      z-index: 1;
    }
    .brand h1 {
      margin: 0 0 5px 0;
      color: #ffffff;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .brand p {
      margin: 0;
      color: #f97316;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 40px 30px;
      color: #374151;
      line-height: 1.6;
    }
    .content h2 {
      margin: 0 0 20px 0;
      color: #111827;
      font-size: 24px;
      font-weight: 600;
    }
    .content p {
      margin: 0 0 15px 0;
      font-size: 16px;
    }
    .button-wrapper {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);
      transition: all 0.3s ease;
    }
    .button:hover {
      box-shadow: 0 6px 8px rgba(249, 115, 22, 0.4);
      transform: translateY(-2px);
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e5e7eb, transparent);
      margin: 30px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 0 0 10px 0;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #f97316;
      text-decoration: none;
    }
    .social-links {
      margin-top: 20px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #9ca3af;
      text-decoration: none;
      font-size: 12px;
    }
    @media only screen and (max-width: 600px) {
      .wrapper {
        padding: 20px 0;
      }
      .container {
        margin: 0 10px;
      }
      .header {
        padding: 30px 20px;
      }
      .content {
        padding: 30px 20px;
      }
      .content h2 {
        font-size: 20px;
      }
      .content p {
        font-size: 15px;
      }
      .button {
        padding: 12px 24px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          ${preheader ? `
          <div style="display: none; max-height: 0; overflow: hidden;">
            ${preheader}
          </div>
          ` : ''}
          
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="logo">
                <svg class="logo-icon" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 4h4v3h-4V4zm10 16H4V9h16v11z"/>
                  <circle cx="9" cy="13" r="1"/>
                  <circle cx="15" cy="13" r="1"/>
                  <circle cx="9" cy="17" r="1"/>
                  <circle cx="15" cy="17" r="1"/>
                  <circle cx="12" cy="15" r="1"/>
                </svg>
              </div>
              <div class="brand">
                <h1>IT Manager</h1>
                <p>GESTÃO INTELIGENTE DE TI</p>
              </div>
            </div>

            <!-- Content -->
            <div class="content">
              <h2>${title}</h2>
              ${content}
              
              ${buttonText && buttonUrl ? `
              <div class="button-wrapper">
                <a href="${buttonUrl}" class="button">${buttonText}</a>
              </div>
              ` : ''}
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>${footerText}</p>
              <div class="divider" style="margin: 20px 0;"></div>
              <p style="font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} IT Manager. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Template para email de alerta
 */
export function getAlertEmailTemplate(
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'error' | 'success' = 'info'
): string {
  const severityConfig = {
    info: {
      icon: '&#9432;',
      color: '#3b82f6',
      bgColor: '#eff6ff',
      label: 'Informação'
    },
    warning: {
      icon: '&#9888;',
      color: '#f59e0b',
      bgColor: '#fffbeb',
      label: 'Atenção'
    },
    error: {
      icon: '&#10006;',
      color: '#ef4444',
      bgColor: '#fef2f2',
      label: 'Erro'
    },
    success: {
      icon: '&#10004;',
      color: '#10b981',
      bgColor: '#f0fdf4',
      label: 'Sucesso'
    }
  };

  const config = severityConfig[severity];

  const content = `
    <div style="background-color: ${config.bgColor}; border-left: 4px solid ${config.color}; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px; color: ${config.color};">${config.icon}</span>
        <strong style="color: ${config.color}; font-size: 14px; text-transform: uppercase;">${config.label}</strong>
      </div>
    </div>
    <p>${message}</p>
  `;

  return getBaseEmailTemplate({ title, content });
}

/**
 * Template para email de boas-vindas
 */
export function getWelcomeEmailTemplate(userName: string, loginUrl: string): string {
  const content = `
    <p>Olá <strong>${userName}</strong>,</p>
    <p>Seja bem-vindo ao <strong>IT Manager</strong>! Estamos muito felizes em tê-lo conosco.</p>
    <p>Nossa plataforma foi desenvolvida para facilitar a gestão de TI da sua empresa, oferecendo ferramentas poderosas e intuitivas para:</p>
    <ul style="margin: 20px 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Gerenciamento de projetos e tarefas</li>
      <li style="margin-bottom: 8px;">Controle de ativos e inventário</li>
      <li style="margin-bottom: 8px;">Acompanhamento de manutenções</li>
      <li style="margin-bottom: 8px;">Relatórios e métricas em tempo real</li>
    </ul>
    <p>Clique no botão abaixo para fazer seu primeiro acesso:</p>
  `;

  return getBaseEmailTemplate({
    title: 'Bem-vindo ao IT Manager',
    preheader: 'Comece a usar nossa plataforma agora mesmo',
    content,
    buttonText: 'Acessar Plataforma',
    buttonUrl: loginUrl
  });
}

/**
 * Template para email de recuperação de senha
 */
export function getPasswordResetEmailTemplate(userName: string, resetUrl: string): string {
  const content = `
    <p>Olá <strong>${userName}</strong>,</p>
    <p>Recebemos uma solicitação para redefinir a senha da sua conta no IT Manager.</p>
    <p>Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:</p>
    <div class="divider"></div>
    <p style="font-size: 14px; color: #6b7280;">
      <strong>Este link expira em 1 hora.</strong><br>
      Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanecerá inalterada.
    </p>
  `;

  return getBaseEmailTemplate({
    title: 'Redefinir sua senha',
    preheader: 'Clique para criar uma nova senha',
    content,
    buttonText: 'Redefinir Senha',
    buttonUrl: resetUrl
  });
}

/**
 * Template para notificação de manutenção
 */
export function getMaintenanceNotificationTemplate(
  assetName: string,
  maintenanceDate: string,
  description: string
): string {
  const content = `
    <p>Uma manutenção foi agendada para o seguinte ativo:</p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Ativo:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${assetName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Data agendada:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${maintenanceDate}</td>
        </tr>
      </table>
    </div>
    <p><strong>Descrição:</strong></p>
    <p>${description}</p>
    <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
      Por favor, certifique-se de que o ativo estará disponível na data agendada.
    </p>
  `;

  return getBaseEmailTemplate({
    title: 'Manutenção Agendada',
    preheader: `Manutenção agendada para ${assetName}`,
    content
  });
}
