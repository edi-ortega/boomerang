import { bmr } from "@/api/boomerangClient";

export const PERMISSIONS = {
  // Project permissions
  MANAGE_PROJECTS: 'manage_projects',
  VIEW_ALL_PROJECTS: 'view_all_projects',
  CREATE_PROJECTS: 'create_projects',
  EDIT_PROJECTS: 'edit_projects',
  DELETE_PROJECTS: 'delete_projects',
  
  // Task permissions
  MANAGE_TASKS: 'manage_tasks',
  VIEW_ALL_TASKS: 'view_all_tasks',
  CREATE_TASKS: 'create_tasks',
  EDIT_TASKS: 'edit_tasks',
  DELETE_TASKS: 'delete_tasks',
  
  // Story permissions
  MANAGE_STORIES: 'manage_stories',
  CREATE_STORIES: 'create_stories',
  EDIT_STORIES: 'edit_stories',
  DELETE_STORIES: 'delete_stories',
  
  // Timesheet permissions
  VIEW_ALL_TIMESHEETS: 'view_all_timesheets',
  APPROVE_TIMESHEETS: 'approve_timesheets',
  EDIT_ALL_TIMELOGS: 'edit_all_timelogs',
  
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
} as const;

export const hasPermission = async (permission: string): Promise<boolean> => {
  try {
    const user = await bmr.auth.me();
    
    // Super admin tem todas as permissões
    if ((user as any).is_super_admin === true) {
      return true;
    }
    
    // Verificar perfil no sistema IT Manager
    const SYSTEM_ID = "9be384e5-7e97-43e0-82a2-dd1fb4756abb";
    const storedSession = localStorage.getItem("bmr_session");
    
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      const userId = parsedSession.user?.user_id;
      
      if (userId) {
        // Buscar perfil do usuário no sistema IT Manager
        const { data: systemAccess } = await (await import("@/integrations/supabase/client")).supabase
          .from("bmr_user_system_access")
          .select("profile")
          .eq("user_id", userId)
          .eq("system_id", SYSTEM_ID)
          .maybeSingle();
        
        // Administrador tem todas as permissões
        if (systemAccess?.profile === "Administrador") {
          return true;
        }
        
        // Gestor tem permissões de gerenciamento
        if (systemAccess?.profile === "Gestor") {
          const managerPermissions: string[] = [
            PERMISSIONS.VIEW_ALL_PROJECTS,
            PERMISSIONS.MANAGE_PROJECTS,
            PERMISSIONS.CREATE_PROJECTS,
            PERMISSIONS.EDIT_PROJECTS,
            PERMISSIONS.VIEW_ALL_TASKS,
            PERMISSIONS.MANAGE_TASKS,
            PERMISSIONS.CREATE_TASKS,
            PERMISSIONS.EDIT_TASKS,
            PERMISSIONS.MANAGE_STORIES,
            PERMISSIONS.CREATE_STORIES,
            PERMISSIONS.EDIT_STORIES,
            PERMISSIONS.VIEW_ALL_TIMESHEETS,
            PERMISSIONS.APPROVE_TIMESHEETS,
          ];
          return managerPermissions.includes(permission);
        }
        
        // Técnico tem permissões básicas
        if (systemAccess?.profile === "Técnico") {
          const technicianPermissions: string[] = [
            PERMISSIONS.CREATE_TASKS,
            PERMISSIONS.EDIT_TASKS,
            PERMISSIONS.CREATE_STORIES,
          ];
          return technicianPermissions.includes(permission);
        }
      }
    }
    
    // Fallback: verificar role antigo (compatibilidade)
    const userRole = (user as any).role || '';
    const userType = (user as any).user_type || '';
    
    if (userRole === 'admin' || userType === 'admin') {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};
