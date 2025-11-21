import { supabase } from "@/integrations/supabase/client";

export interface TimesheetPermissions {
  canViewAll: boolean;
  canApprove: boolean;
  canEditAll: boolean;
  canEditOwn: boolean;
  isReadOnly: boolean;
  profile: string;
}

/**
 * Verifica as permissões do usuário para o timesheet
 */
export async function getUserTimesheetPermissions(
  userId: string
): Promise<TimesheetPermissions> {
  try {
    // Buscar perfil do usuário em bmr_user_system_access
    const { data: accessData, error } = await supabase
      .from("bmr_user_system_access")
      .select("profile")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (error || !accessData) {
      // Padrão: usuário comum sem permissões especiais
      return {
        canViewAll: false,
        canApprove: false,
        canEditAll: false,
        canEditOwn: true,
        isReadOnly: false,
        profile: "Usuário",
      };
    }

    const profile = accessData.profile.toLowerCase();

    // Mapear perfis para permissões
    if (profile.includes("admin")) {
      return {
        canViewAll: true,
        canApprove: true,
        canEditAll: true,
        canEditOwn: true,
        isReadOnly: false,
        profile: "Administrador",
      };
    }

    if (profile.includes("gestor")) {
      return {
        canViewAll: true, // Gestor vê seu time
        canApprove: true, // Pode aprovar horas do time
        canEditAll: false,
        canEditOwn: true,
        isReadOnly: false,
        profile: "Gestor",
      };
    }

    if (profile.includes("visualizador")) {
      return {
        canViewAll: true,
        canApprove: false,
        canEditAll: false,
        canEditOwn: false,
        isReadOnly: true,
        profile: "Visualizador",
      };
    }

    // Usuário padrão
    return {
      canViewAll: false,
      canApprove: false,
      canEditAll: false,
      canEditOwn: true,
      isReadOnly: false,
      profile: "Usuário",
    };
  } catch (error) {
    console.error("Error getting timesheet permissions:", error);
    return {
      canViewAll: false,
      canApprove: false,
      canEditAll: false,
      canEditOwn: true,
      isReadOnly: false,
      profile: "Usuário",
    };
  }
}

/**
 * Verifica se o usuário pode editar um time log específico
 */
export function canEditTimeLog(
  log: { user_email: string; is_approved: boolean },
  userEmail: string,
  permissions: TimesheetPermissions
): boolean {
  // Não pode editar log aprovado (apenas admin pode)
  if (log.is_approved && !permissions.canEditAll) {
    return false;
  }

  // Admin pode editar tudo
  if (permissions.canEditAll) {
    return true;
  }

  // Usuário pode editar apenas seus próprios logs
  if (permissions.canEditOwn && log.user_email === userEmail) {
    return true;
  }

  return false;
}

/**
 * Verifica se o usuário pode aprovar um time log
 */
export function canApproveTimeLog(
  log: { user_email: string; is_approved: boolean },
  userEmail: string,
  permissions: TimesheetPermissions
): boolean {
  // Não pode aprovar log já aprovado
  if (log.is_approved) {
    return false;
  }

  // Não pode aprovar se não tem permissão
  if (!permissions.canApprove) {
    return false;
  }

  // Não pode aprovar o próprio log
  if (log.user_email === userEmail) {
    return false;
  }

  return true;
}
