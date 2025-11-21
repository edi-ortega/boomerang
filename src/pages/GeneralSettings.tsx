import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserTypeManagementSection from "@/components/settings/UserTypeManagementSection";
import StoryTypeManagementSection from "@/components/settings/StoryTypeManagementSection";
import TaskTypeManagementSection from "@/components/settings/TaskTypeManagementSection";
import ProjectCategoryManagementSection from "@/components/settings/ProjectCategoryManagementSection";
import TeamManagementSection from "@/components/settings/TeamManagementSection";
import WorkCalendarManagementSection from "@/components/settings/WorkCalendarManagementSection";

export default function GeneralSettings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="border-border hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cadastros Gerais</h1>
            <p className="text-muted-foreground">Gerencie categorias, tipos e outros cadastros base</p>
          </div>
        </motion.div>

        <Tabs defaultValue="project_categories" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="project_categories">Categorias de Projeto</TabsTrigger>
            <TabsTrigger value="user_types">Tipos de Usuário</TabsTrigger>
            <TabsTrigger value="story_types">Tipos de História</TabsTrigger>
            <TabsTrigger value="task_types">Tipos de Tarefa</TabsTrigger>
            <TabsTrigger value="teams">Equipes</TabsTrigger>
          </TabsList>

          <TabsContent value="project_categories">
            <ProjectCategoryManagementSection />
          </TabsContent>

          <TabsContent value="user_types">
            <UserTypeManagementSection />
          </TabsContent>

          <TabsContent value="story_types">
            <StoryTypeManagementSection />
          </TabsContent>

          <TabsContent value="task_types">
            <TaskTypeManagementSection />
          </TabsContent>

          <TabsContent value="teams">
            <TeamManagementSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
