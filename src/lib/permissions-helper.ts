/**
 * PermissionsHelper - Sistema de Permissões
 * Versão simplificada para Supabase
 */

export const PERMISSIONS = {
  // Backlog
  CREATE_EPIC: 'create_epic',
  EDIT_EPIC: 'edit_epic',
  DELETE_EPIC: 'delete_epic',
  CREATE_FEATURE: 'create_feature',
  EDIT_FEATURE: 'edit_feature',
  DELETE_FEATURE: 'delete_feature',
  CREATE_STORY: 'create_story',
  EDIT_STORY: 'edit_story',
  DELETE_STORY: 'delete_story',
  
  // Tasks
  CREATE_TASK: 'create_task',
  EDIT_TASK: 'edit_task',
  DELETE_TASK: 'delete_task',
  ASSIGN_TASK: 'assign_task',
  
  // Sprints
  CREATE_SPRINT: 'create_sprint',
  EDIT_SPRINT: 'edit_sprint',
  DELETE_SPRINT: 'delete_sprint',
  START_SPRINT: 'start_sprint',
  COMPLETE_SPRINT: 'complete_sprint',
  VIEW_SPRINTS: 'view_sprints',
  MANAGE_SPRINTS: 'manage_sprints',
  
  // Projects
  MANAGE_PROJECTS: 'manage_projects',
  
  // Team
  MANAGE_TEAM: 'manage_team',
  
  // Reports
  VIEW_REPORTS: 'view_reports',
  
  // Planning Poker
  JOIN_PLANNING_POKER: 'join_planning_poker',
  CREATE_PLANNING_POKER: 'create_planning_poker',
  
  // Timesheet
  LOG_TIME: 'log_time',
  VIEW_OWN_TIMESHEET: 'view_own_timesheet',
  VIEW_ALL_TIMESHEETS: 'view_all_timesheets',
  APPROVE_TIMESHEETS: 'approve_timesheets',
  EDIT_ALL_TIMELOGS: 'edit_all_timelogs',
  
  // Admin
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_BOARDS: 'manage_boards'
} as const;

// Cache de permissões
let cachedPermissions: Record<string, boolean> | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 300000; // 5 minutos

/**
 * Permissões padrão por tipo de usuário
 */
const getDefaultPermissions = (userType: string): Record<string, boolean> => {
  // Admin tem todas as permissões
  if (userType === 'admin' || userType === 'manager') {
    return Object.values(PERMISSIONS).reduce((acc, perm) => {
      acc[perm] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }

  // Product Owner
  if (userType === 'product_owner') {
    return {
      [PERMISSIONS.CREATE_EPIC]: true,
      [PERMISSIONS.EDIT_EPIC]: true,
      [PERMISSIONS.CREATE_FEATURE]: true,
      [PERMISSIONS.EDIT_FEATURE]: true,
      [PERMISSIONS.CREATE_STORY]: true,
      [PERMISSIONS.EDIT_STORY]: true,
      [PERMISSIONS.VIEW_SPRINTS]: true,
      [PERMISSIONS.VIEW_REPORTS]: true,
      [PERMISSIONS.CREATE_PLANNING_POKER]: true,
      [PERMISSIONS.JOIN_PLANNING_POKER]: true,
    };
  }

  // Scrum Master
  if (userType === 'scrum_master') {
    return {
      [PERMISSIONS.CREATE_SPRINT]: true,
      [PERMISSIONS.EDIT_SPRINT]: true,
      [PERMISSIONS.DELETE_SPRINT]: true,
      [PERMISSIONS.START_SPRINT]: true,
      [PERMISSIONS.COMPLETE_SPRINT]: true,
      [PERMISSIONS.VIEW_SPRINTS]: true,
      [PERMISSIONS.MANAGE_SPRINTS]: true,
      [PERMISSIONS.MANAGE_TEAM]: true,
      [PERMISSIONS.VIEW_REPORTS]: true,
      [PERMISSIONS.CREATE_PLANNING_POKER]: true,
      [PERMISSIONS.JOIN_PLANNING_POKER]: true,
      [PERMISSIONS.VIEW_ALL_TIMESHEETS]: true,
      [PERMISSIONS.APPROVE_TIMESHEETS]: true,
    };
  }

  // Developer (membro padrão)
  return {
    [PERMISSIONS.CREATE_TASK]: true,
    [PERMISSIONS.EDIT_TASK]: true,
    [PERMISSIONS.ASSIGN_TASK]: true,
    [PERMISSIONS.VIEW_SPRINTS]: true,
    [PERMISSIONS.JOIN_PLANNING_POKER]: true,
    [PERMISSIONS.LOG_TIME]: true,
    [PERMISSIONS.VIEW_OWN_TIMESHEET]: true,
  };
};

/**
 * Obtém permissões do usuário
 */
export const getUserPermissions = async (): Promise<Record<string, boolean>> => {
  try {
    const now = Date.now();
    
    // Verificar cache
    if (cachedPermissions && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedPermissions;
    }

    // Buscar tipo de usuário da sessão
    const storedSession = localStorage.getItem("bmr_session");
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      const userType = parsedSession.user?.user_type || 'member';
      
      cachedPermissions = getDefaultPermissions(userType);
      cacheTimestamp = Date.now();
      return cachedPermissions;
    }

    // Fallback: permissões de desenvolvedor
    cachedPermissions = getDefaultPermissions('member');
    cacheTimestamp = Date.now();
    return cachedPermissions;
  } catch (error) {
    console.error('[PermissionsHelper] Error getting permissions:', error);
    return getDefaultPermissions('member');
  }
};

/**
 * Verifica se o usuário tem uma permissão específica
 */
export const hasPermission = async (permission: string): Promise<boolean> => {
  try {
    const permissions = await getUserPermissions();
    return permissions[permission] === true;
  } catch (error) {
    console.error('[PermissionsHelper] Error checking permission:', error);
    return false;
  }
};

/**
 * Verifica se o usuário tem qualquer uma das permissões especificadas
 */
export const hasAnyPermission = async (permissionList: string[]): Promise<boolean> => {
  try {
    const permissions = await getUserPermissions();
    return permissionList.some(p => permissions[p] === true);
  } catch (error) {
    console.error('[PermissionsHelper] Error checking permissions:', error);
    return false;
  }
};

/**
 * Verifica se o usuário tem todas as permissões especificadas
 */
export const hasAllPermissions = async (permissionList: string[]): Promise<boolean> => {
  try {
    const permissions = await getUserPermissions();
    return permissionList.every(p => permissions[p] === true);
  } catch (error) {
    console.error('[PermissionsHelper] Error checking permissions:', error);
    return false;
  }
};

/**
 * Obtém o usuário do cache (sem fazer requisições)
 */
export const getCachedUser = (): any => {
  try {
    const storedSession = localStorage.getItem("bmr_session");
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      return parsedSession.user;
    }
  } catch (error) {
    console.error('[PermissionsHelper] Error getting cached user:', error);
  }
  return null;
};

/**
 * Limpa cache de permissões
 */
export const clearPermissionsCache = () => {
  cachedPermissions = null;
  cacheTimestamp = null;
};
