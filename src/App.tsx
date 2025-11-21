import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ContextSidebarProvider } from "@/contexts/ContextSidebarContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "./pages/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import CreateProject from "./pages/CreateProject";
import Backlog from "./pages/Backlog";
import Kanban from "./pages/Kanban";
import Sprints from "./pages/Sprints";
import Timesheet from "./pages/Timesheet";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Boards from "./pages/Boards";
import KanbanBoard from "./pages/KanbanBoard";
import BacklogManagement from "./pages/BacklogManagement";
import Calendar from "./pages/Calendar";
import PlanningPoker from "./pages/PlanningPoker";
import PlanningPokerRoom from "./pages/PlanningPokerRoom";
import CreateEpic from "./pages/CreateEpic";
import CreateFeature from "./pages/CreateFeature";
import CreateStory from "./pages/CreateStory";
import CreateTask from "./pages/CreateTask";
import EpicDetail from "./pages/EpicDetail";
import FeatureDetail from "./pages/FeatureDetail";
import StoryDetail from "./pages/StoryDetail";
import TaskDetail from "./pages/TaskDetail";
import EpicView from "./pages/EpicView";
import FeatureView from "./pages/FeatureView";
import StoryView from "./pages/StoryView";
import TaskView from "./pages/TaskView";
import ProjectEdit from "./pages/ProjectEdit";
import SprintManagement from "./pages/SprintManagement";
import SprintDetail from "./pages/SprintDetail";
import EpicHierarchyGenerator from "./pages/EpicHierarchyGenerator";
import TeamMetrics from "./pages/TeamMetrics";
import BoardManagement from "./pages/BoardManagement";
import DataMigration from "./pages/DataMigration";
import UserManagement from "./pages/UserManagement";
import TeamManagement from "./pages/TeamManagement";
import GeneralSettings from "./pages/GeneralSettings";
import ProjectGanttV2 from "./pages/ProjectGanttV2";
import UserProfile from "./pages/UserProfile";
import ForgotPassword from "./pages/ForgotPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TenantProvider>
              <ContextSidebarProvider>
              <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cadastros" element={<Navigate to="/generalsettings" replace />} />
                <Route path="/projetos" element={<Projects />} />
                <Route path="/projectlist" element={<Projects />} />
                <Route path="/projetos/:id" element={<ProjectDetail />} />
                <Route path="/projectdetail" element={<ProjectDetail />} />
                <Route path="/createproject" element={<CreateProject />} />
                <Route path="/projectedit" element={<ProjectEdit />} />
                <Route path="/projectganttv2" element={<ProjectGanttV2 />} />
                <Route path="/backlog" element={<Backlog />} />
                <Route path="/backlog-management" element={<BacklogManagement />} />
                <Route path="/backlogmanagement" element={<BacklogManagement />} />
                <Route path="/sprints" element={<Sprints />} />
                <Route path="/sprint/:id" element={<SprintDetail />} />
                <Route path="/sprintmanagement" element={<SprintManagement />} />
                <Route path="/sprintdetail" element={<SprintDetail />} />
                <Route path="/boards" element={<Boards />} />
                <Route path="/boardmanagement" element={<BoardManagement />} />
                <Route path="/quadro-kanban" element={<Kanban />} />
                <Route path="/kanban" element={<KanbanBoard />} />
                <Route path="/kanban-board" element={<KanbanBoard />} />
                <Route path="/kanbanboard" element={<KanbanBoard />} />
                <Route path="/calendario" element={<Calendar />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/planning-poker" element={<PlanningPoker />} />
                <Route path="/planningpoker" element={<PlanningPoker />} />
                <Route path="/planning-poker/:id" element={<PlanningPokerRoom />} />
                <Route path="/planningpokerroom" element={<PlanningPokerRoom />} />
                <Route path="/epicos/novo" element={<CreateEpic />} />
                <Route path="/createepic" element={<CreateEpic />} />
                <Route path="/epicdetail" element={<EpicDetail />} />
                <Route path="/epicview" element={<EpicView />} />
                <Route path="/features/nova" element={<CreateFeature />} />
                <Route path="/createfeature" element={<CreateFeature />} />
                <Route path="/featuredetail" element={<FeatureDetail />} />
                <Route path="/featureview" element={<FeatureView />} />
                <Route path="/createstory" element={<CreateStory />} />
                <Route path="/storydetail" element={<StoryDetail />} />
                <Route path="/storyview" element={<StoryView />} />
                <Route path="/createtask" element={<CreateTask />} />
                <Route path="/taskdetail" element={<TaskDetail />} />
                <Route path="/taskview" element={<TaskView />} />
                <Route path="/epicos/hierarquia" element={<EpicHierarchyGenerator />} />
                <Route path="/epichierarchygenerator" element={<EpicHierarchyGenerator />} />
                <Route path="/timesheet" element={<Timesheet />} />
                <Route path="/relatorios" element={<Reports />} />
                <Route path="/team-metrics" element={<TeamMetrics />} />
                <Route path="/configuracoes" element={<Settings />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/generalsettings" element={<GeneralSettings />} />
                <Route path="/usermanagement" element={<UserManagement />} />
                <Route path="/teammanagement" element={<TeamManagement />} />
                <Route path="/datamigration" element={<DataMigration />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/userprofile" element={<UserProfile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
              </Routes>
            </ContextSidebarProvider>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
