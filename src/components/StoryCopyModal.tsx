import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Copy, CheckSquare, Folder, Layers, Target } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTenant } from "@/contexts/TenantContext";
import { getCurrentTenantId } from "@/lib/tenant-helper";

interface StoryCopyModalProps {
  story: any;
  onClose: () => void;
  onCopied?: (story: any) => void;
}

export default function StoryCopyModal({ story, onClose, onCopied }: StoryCopyModalProps) {
  const { currentTenantId } = useTenant();
  const [isCopying, setIsCopying] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [epics, setEpics] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [copyOptions, setCopyOptions] = useState({
    includeDescription: true,
    includeTechnicalDetails: true,
    includeAcceptanceCriteria: true,
    includeAttachments: true,
    includeTags: true,
    taskOption: 'none', // 'none', 'open', 'all'
    targetProjectId: story.project_id,
    targetEpicId: story.epic_id || '',
    targetFeatureId: story.feature_id || ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (copyOptions.targetProjectId) {
      loadProjectRelatedData(copyOptions.targetProjectId);
    }
  }, [copyOptions.targetProjectId]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [{ data: storyTasks }, { data: allProjects }] = await Promise.all([
        supabase.from('prj_task' as any).select('*').eq('story_id', story.id) as any,
        supabase.from('prj_project' as any).select('*').eq('tenant_id', currentTenantId).eq('methodology', 'scrum') as any
      ]);

      setTasks(storyTasks || []);
      setProjects(allProjects || []);

      await loadProjectRelatedData(story.project_id);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Não foi possível carregar os dados necessários.");
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadProjectRelatedData = async (projectId: string) => {
    try {
      const [{ data: projectEpics }, { data: projectFeatures }] = await Promise.all([
        supabase.from('prj_epic' as any).select('*').eq('project_id', projectId).eq('tenant_id', currentTenantId) as any,
        supabase.from('prj_feature' as any).select('*').eq('project_id', projectId).eq('tenant_id', currentTenantId) as any
      ]);

      setEpics(projectEpics || []);
      setFeatures(projectFeatures || []);
    } catch (error) {
      console.error("Error loading project data:", error);
    }
  };

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      const newStoryData: any = {
        title: `[CÓPIA] ${story.title}`,
        project_id: copyOptions.targetProjectId,
        epic_id: copyOptions.targetEpicId || null,
        feature_id: copyOptions.targetFeatureId || null,
        story_type_id: story.story_type_id,
        priority: story.priority,
        story_points: story.story_points,
        status: 'backlog',
        sprint_id: null,
        tenant_id: currentTenantId
      };

      if (copyOptions.includeDescription && story.description) {
        newStoryData.description = story.description;
      }
      if (copyOptions.includeTechnicalDetails && story.technical_details) {
        newStoryData.technical_details = story.technical_details;
      }
      if (copyOptions.includeAcceptanceCriteria && story.acceptance_criteria) {
        newStoryData.acceptance_criteria = story.acceptance_criteria.map((ac: any) => ({
          text: ac.text,
          completed: false
        }));
      }
      if (copyOptions.includeAttachments && story.attachments) {
        newStoryData.attachments = story.attachments;
      }
      if (copyOptions.includeTags && story.tags) {
        newStoryData.tags = [...story.tags];
      }

      const { data: createdStory, error } = await supabase
        .from('prj_story' as any)
        .insert(newStoryData)
        .select()
        .maybeSingle() as any;

      if (error) throw error;

      if (copyOptions.taskOption !== 'none' && tasks.length > 0) {
        let tasksToCopy = tasks;

        if (copyOptions.taskOption === 'open') {
          tasksToCopy = tasks.filter(t => !['done', 'cancelled', 'completed'].includes(t.status));
        }

        const taskCopyPromises = tasksToCopy.map(async (task) => {
          const newTaskData = {
            title: task.title,
            description: task.description,
            project_id: copyOptions.targetProjectId,
            story_id: createdStory.id,
            feature_id: copyOptions.targetFeatureId || null,
            epic_id: copyOptions.targetEpicId || null,
            task_type_id: task.task_type_id,
            priority: task.priority,
            estimated_hours: task.estimated_hours,
            tags: task.tags ? [...task.tags] : [],
            checklist: task.checklist ? task.checklist.map((item: any) => ({
              text: item.text,
              completed: false
            })) : [],
            status: 'backlog',
            sprint_id: null,
            assigned_to_email: null,
            assigned_to_name: null,
            progress: 0,
            tenant_id: currentTenantId
          };

          return supabase.from('prj_task' as any).insert(newTaskData) as any;
        });

        await Promise.all(taskCopyPromises);
      }

      toast.success(`A história foi copiada com sucesso${copyOptions.taskOption !== 'none' ? ' incluindo as tarefas' : ''}.`);

      if (onCopied) {
        onCopied(createdStory);
      }

      onClose();
    } catch (error) {
      console.error("Error copying story:", error);
      toast.error("Não foi possível copiar a história.");
    } finally {
      setIsCopying(false);
    }
  };

  const openTasks = tasks.filter(t => !['done', 'cancelled', 'completed'].includes(t.status));

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl"
      >
        <Card className="border-2 border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="border-b border-border bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Copy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Copiar História</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Escolha o que deseja copiar e para onde
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={isCopying}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {isLoadingData ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-accent/30 border border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">História Original:</p>
                  <p className="font-semibold text-foreground">{story.title}</p>
                  {story.story_points && (
                    <Badge variant="outline" className="text-xs mt-2">
                      {story.story_points} pts
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Destino da Cópia
                  </h3>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Projeto *
                    </label>
                    <Select
                      value={copyOptions.targetProjectId}
                      onValueChange={(value) => {
                        setCopyOptions({
                          ...copyOptions,
                          targetProjectId: value,
                          targetEpicId: '',
                          targetFeatureId: ''
                        });
                      }}
                      disabled={isCopying}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Selecione o projeto" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Épico (Opcional)
                      </label>
                      <Select
                        value={copyOptions.targetEpicId || '__none__'}
                        onValueChange={(value) => setCopyOptions({
                          ...copyOptions,
                          targetEpicId: value === '__none__' ? '' : value
                        })}
                        disabled={isCopying || !copyOptions.targetProjectId}
                      >
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          <SelectItem value="__none__">Nenhum</SelectItem>
                          {epics.map(epic => (
                            <SelectItem key={epic.id} value={epic.id}>
                              {epic.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Funcionalidade (Opcional)
                      </label>
                      <Select
                        value={copyOptions.targetFeatureId || '__none__'}
                        onValueChange={(value) => setCopyOptions({
                          ...copyOptions,
                          targetFeatureId: value === '__none__' ? '' : value
                        })}
                        disabled={isCopying || !copyOptions.targetProjectId}
                      >
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Nenhuma" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          <SelectItem value="__none__">Nenhuma</SelectItem>
                          {features.map(feature => (
                            <SelectItem key={feature.id} value={feature.id}>
                              {feature.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    O que copiar?
                  </h3>

                  <div className="space-y-2">
                    {[
                      { key: 'includeDescription', label: 'Descrição' },
                      { key: 'includeTechnicalDetails', label: 'Detalhes Técnicos' },
                      { key: 'includeAcceptanceCriteria', label: 'Critérios de Aceitação' },
                      { key: 'includeAttachments', label: 'Anexos' },
                      { key: 'includeTags', label: 'Tags' }
                    ].map(option => (
                      <label key={option.key} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={copyOptions[option.key as keyof typeof copyOptions] as boolean}
                          onChange={(e) => setCopyOptions({...copyOptions, [option.key]: e.target.checked})}
                          disabled={isCopying}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-foreground">{option.label}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Copiar Tarefas
                    </label>
                    <Select
                      value={copyOptions.taskOption}
                      onValueChange={(value) => setCopyOptions({...copyOptions, taskOption: value})}
                      disabled={isCopying}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não copiar tarefas</SelectItem>
                        <SelectItem value="open">Copiar tarefas em aberto ({openTasks.length})</SelectItem>
                        <SelectItem value="all">Copiar todas as tarefas ({tasks.length})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 border-border"
                    disabled={isCopying}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCopy}
                    className="flex-1 bg-primary hover:bg-primary/80"
                    disabled={isCopying}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {isCopying ? "Copiando..." : "Copiar História"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
