/**
 * Nomes das tabelas do banco de dados
 * Centralizados para evitar erros de digitação
 * 
 * IMPORTANTE: Todos os nomes são SINGULARES, não plurais
 */

export const TABLES = {
  // Project Management
  PRJ_PROJECT: 'prj_project',
  PRJ_PROJECT_CATEGORY: 'prj_project_category',
  PRJ_BOARD: 'prj_board',
  PRJ_SPRINT: 'prj_sprint',
  PRJ_SPRINT_REPORT: 'prj_sprint_report',
  
  // Stories and Tasks
  PRJ_EPIC: 'prj_epic',
  PRJ_FEATURE: 'prj_feature',
  PRJ_STORY: 'prj_story',
  PRJ_STORY_TYPE: 'prj_story_type',
  PRJ_TASK: 'prj_task',
  PRJ_TASK_TYPE: 'prj_task_type',
  
  // Team and Users
  PRJ_TEAM: 'prj_team',
  PRJ_USER_TYPE: 'prj_user_type',
  
  // Time Tracking
  PRJ_TIME_LOG: 'prj_time_log',
  PRJ_TIME_TRACKING_SESSION: 'prj_time_tracking_session',
  
  // Other
  PRJ_COMMENT: 'prj_comment',
  PRJ_NOTIFICATION: 'prj_notification',
  PRJ_ISSUE: 'prj_issue',
  PRJ_RISK: 'prj_risk',
  PRJ_RESOURCE_ALLOCATION: 'prj_resource_allocation',
  PRJ_PLANNING_POKER_SESSION: 'prj_planning_poker_session',
  PRJ_PLANNING_POKER_VOTE: 'prj_planning_poker_vote',
  PRJ_DASHBOARD_CONFIG: 'prj_dashboard_config',
  PRJ_CUSTOM_COMPLEXITY_SETTING: 'prj_custom_complexity_setting',
  PRJ_SYSTEM_SETTINGS: 'prj_system_settings',
  PRJ_WORK_CALENDAR: 'prj_work_calendar',
  PRJ_HOLIDAY: 'prj_holiday',
  
  // BMR (Boomerang)
  BMR_USER: 'bmr_user',
  BMR_CLIENT: 'bmr_client',
  BMR_PLAN: 'bmr_plan',
  BMR_SYSTEM: 'bmr_system',
  BMR_USER_SYSTEM_ACCESS: 'bmr_user_system_access',
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];
