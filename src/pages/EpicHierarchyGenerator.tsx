import React, { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mountain, Sparkles, Layers, BookOpen, CheckSquare } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function EpicHierarchyGenerator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const epicId = searchParams.get("epic_id");

  const [epic, setEpic] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedFeatures, setGeneratedFeatures] = useState<any[]>([]);
  const [generatedStories, setGeneratedStories] = useState<any[]>([]);
  const [generatedTasks, setGeneratedTasks] = useState<any[]>([]);

  useEffect(() => {
    if (epicId) {
      loadEpic();
      loadExistingHierarchy();
    }
  }, [epicId]);

  const loadEpic = async () => {
    setIsLoading(true);
    try {
      const epics = await base44.entities.Epic.filter({ id: epicId });
      if (epics && epics.length > 0) {
        setEpic(epics[0]);
      }
    } catch (error) {
      console.error("Error loading epic:", error);
      toast.error("Erro ao carregar épico");
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingHierarchy = async () => {
    try {
      const [existingFeatures, existingStories, existingTasks] = await Promise.all([
        base44.entities.Feature.filter({ epic_id: epicId }),
        base44.entities.Story.filter({ epic_id: epicId }),
        base44.entities.Task.filter({ epic_id: epicId })
      ]);

      setGeneratedFeatures(existingFeatures || []);
      setGeneratedStories(existingStories || []);
      setGeneratedTasks(existingTasks || []);
    } catch (error) {
      console.error("Error loading hierarchy:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Mountain className="w-6 h-6 text-primary" />
              {epic?.name}
            </h1>
            <p className="text-sm text-muted-foreground">Hierarquia do Épico</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="w-5 h-5 text-blue-500" />
                Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{generatedFeatures.length}</div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="w-5 h-5 text-green-500" />
                Histórias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{generatedStories.length}</div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckSquare className="w-5 h-5 text-purple-500" />
                Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{generatedTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {generatedFeatures.map((feature: any) => (
                <div key={feature.id} className="p-3 rounded-lg bg-background">
                  <p className="font-medium">{feature.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Histórias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {generatedStories.map((story: any) => (
                <div key={story.id} className="p-3 rounded-lg bg-background">
                  <p className="font-medium">{story.title}</p>
                  {story.estimated_complexity > 0 && (
                    <Badge className="mt-1">{story.estimated_complexity} pts</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
