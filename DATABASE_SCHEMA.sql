-- ============================================
-- SCHEMA SQL PARA SISTEMA DE GESTÃO DE PROJETOS
-- Execute este SQL manualmente no Supabase SQL Editor
-- ============================================

-- Tabela: projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  methodology TEXT NOT NULL CHECK (methodology IN ('agile', 'scrum', 'kanban', 'waterfall', 'hybrid')),
  board_id UUID,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  start_date DATE,
  end_date DATE,
  manager_email TEXT,
  manager_name TEXT,
  color TEXT DEFAULT '#3b82f6',
  complexity_type TEXT CHECK (complexity_type IN ('fibonacci', 'tshirt', 'power_of_2', 'linear')),
  health_status TEXT CHECK (health_status IN ('healthy', 'at_risk', 'critical')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  parent_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: boards
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  columns JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: project_categories
CREATE TABLE IF NOT EXISTS public.project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: teams
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: epics
CREATE TABLE IF NOT EXISTS public.epics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: features
CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  epic_id UUID REFERENCES public.epics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: sprints
CREATE TABLE IF NOT EXISTS public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: stories
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES public.features(id) ON DELETE SET NULL,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  story_points INTEGER,
  assigned_to_email TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to_email TEXT,
  due_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON public.projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_parent_id ON public.projects(parent_project_id);
CREATE INDEX IF NOT EXISTS idx_boards_tenant_id ON public.boards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_epics_project_id ON public.epics(project_id);
CREATE INDEX IF NOT EXISTS idx_epics_tenant_id ON public.epics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_features_project_id ON public.features(project_id);
CREATE INDEX IF NOT EXISTS idx_features_epic_id ON public.features(epic_id);
CREATE INDEX IF NOT EXISTS idx_features_tenant_id ON public.features(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stories_project_id ON public.stories(project_id);
CREATE INDEX IF NOT EXISTS idx_stories_feature_id ON public.stories(feature_id);
CREATE INDEX IF NOT EXISTS idx_stories_sprint_id ON public.stories(sprint_id);
CREATE INDEX IF NOT EXISTS idx_stories_tenant_id ON public.stories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_story_id ON public.tasks(story_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON public.tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON public.tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON public.sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_tenant_id ON public.sprints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_teams_tenant_id ON public.teams(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON public.project_categories(tenant_id);

-- RLS Policies (Row Level Security)
-- IMPORTANTE: Ajuste conforme suas necessidades de segurança

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

-- Policies básicas (ajuste conforme necessário)
CREATE POLICY "Users can view projects in their tenant" ON public.projects
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage projects in their tenant" ON public.projects
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view boards in their tenant" ON public.boards
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage boards in their tenant" ON public.boards
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view categories in their tenant" ON public.project_categories
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage categories in their tenant" ON public.project_categories
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view teams in their tenant" ON public.teams
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage teams in their tenant" ON public.teams
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view epics in their tenant" ON public.epics
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage epics in their tenant" ON public.epics
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view features in their tenant" ON public.features
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage features in their tenant" ON public.features
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view stories in their tenant" ON public.stories
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage stories in their tenant" ON public.stories
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view tasks in their tenant" ON public.tasks
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage tasks in their tenant" ON public.tasks
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view sprints in their tenant" ON public.sprints
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage sprints in their tenant" ON public.sprints
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.project_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_epics_updated_at BEFORE UPDATE ON public.epics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_features_updated_at BEFORE UPDATE ON public.features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
