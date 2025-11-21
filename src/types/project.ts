export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectMethodology = 'agile' | 'scrum' | 'kanban' | 'waterfall' | 'hybrid';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type HealthStatus = 'healthy' | 'at_risk' | 'critical';
export type ComplexityType = 'fibonacci' | 'tshirt' | 'power_of_2' | 'linear';

export interface Project {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description?: string;
  methodology: ProjectMethodology;
  board_id?: string;
  category?: string;
  status: ProjectStatus;
  priority: Priority;
  start_date?: string;
  end_date?: string;
  manager_email?: string;
  manager_name?: string;
  color?: string;
  complexity_type?: ComplexityType;
  health_status?: HealthStatus;
  progress?: number;
  parent_project_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Epic {
  id: string;
  tenant_id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  priority: Priority;
  progress?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Feature {
  id: string;
  tenant_id: string;
  project_id: string;
  epic_id?: string;
  title: string;
  description?: string;
  status: string;
  priority: Priority;
  progress?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Story {
  id: string;
  tenant_id: string;
  project_id: string;
  feature_id?: string;
  sprint_id?: string;
  title: string;
  description?: string;
  status: string;
  priority: Priority;
  story_points?: number;
  assigned_to_email?: string;
  progress?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  tenant_id: string;
  project_id: string;
  story_id?: string;
  sprint_id?: string;
  title: string;
  description?: string;
  status: string;
  priority: Priority;
  assigned_to_email?: string;
  due_date?: string;
  progress?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Sprint {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  goal?: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  total_story_points?: number;
  completed_story_points?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Board {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  columns: BoardColumn[];
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  color: string;
  order: number;
  is_initial: boolean;
  is_final: boolean;
  wip_limit?: number;
}

export interface Team {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectCategory {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}
