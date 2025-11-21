import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Calendar, Target, Zap, CheckCircle2, Clock } from "lucide-react";
import { bmr as boomerangClient } from "@/api/boomerangClient";
import { motion, AnimatePresence } from "framer-motion";

interface Epic {
  id: string;
  title: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  progress?: number;
  status?: string;
  priority?: string;
  features?: Feature[];
}

interface Feature {
  id: string;
  title: string;
  description?: string;
  progress?: number;
  status?: string;
  priority?: string;
  stories?: Story[];
}

interface Story {
  id: string;
  title: string;
  description?: string;
  progress?: number;
  status?: string;
  story_points?: number;
}

interface EpicHierarchyViewProps {
  epics: Epic[];
}

export default function EpicHierarchyView({ epics }: EpicHierarchyViewProps) {
  const [expandedEpics, setExpandedEpics] = useState<Record<string, boolean>>({});
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  const [epicFeatures, setEpicFeatures] = useState<Record<string, Feature[]>>({});
  const [featureStories, setFeatureStories] = useState<Record<string, Story[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const toggleEpic = async (epicId: string) => {
    const isExpanding = !expandedEpics[epicId];
    setExpandedEpics(prev => ({ ...prev, [epicId]: isExpanding }));
    
    // Always use pre-loaded features from epic
    if (isExpanding && !epicFeatures[epicId]) {
      const epic = epics.find(e => e.id === epicId);
      if (epic?.features) {
        setEpicFeatures(prev => ({ ...prev, [epicId]: epic.features || [] }));
      }
    }
  };

  const toggleFeature = async (featureId: string) => {
    const isExpanding = !expandedFeatures[featureId];
    setExpandedFeatures(prev => ({ ...prev, [featureId]: isExpanding }));
    
    // Always use pre-loaded stories from feature
    if (isExpanding && !featureStories[featureId]) {
      const feature = Object.values(epicFeatures)
        .flat()
        .find(f => f.id === featureId);
      
      if (feature?.stories) {
        setFeatureStories(prev => ({ ...prev, [featureId]: feature.stories || [] }));
      }
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'done':
      case 'completed':
        return 'from-emerald-500/20 to-green-500/20 border-emerald-500/50';
      case 'in_progress':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/50';
      case 'blocked':
        return 'from-red-500/20 to-orange-500/20 border-red-500/50';
      default:
        return 'from-accent/30 to-accent/10 border-border';
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">Alta</Badge>;
      case 'medium':
        return <Badge variant="default" className="text-xs bg-amber-500">Média</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs">Baixa</Badge>;
      default:
        return null;
    }
  };

  const calculateFeatureProgress = (featureId: string) => {
    const stories = featureStories[featureId] || [];
    if (stories.length === 0) return 0;
    
    const totalProgress = stories.reduce((sum, story) => sum + (story.progress || 0), 0);
    return Math.round(totalProgress / stories.length);
  };

  const calculateEpicProgress = (epicId: string) => {
    const features = epicFeatures[epicId] || [];
    if (features.length === 0) return 0;
    
    const totalProgress = features.reduce((sum, feature) => {
      const featureProgress = calculateFeatureProgress(feature.id);
      return sum + featureProgress;
    }, 0);
    return Math.round(totalProgress / features.length);
  };

  const renderCircularProgress = (progress: number, size: number) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    const center = size / 2;
    const fontSize = size < 70 ? 10 : size < 100 ? 14 : 18;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
          <defs>
            <linearGradient id={`gradient-${progress}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            </linearGradient>
          </defs>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="hsl(var(--muted))"
            strokeWidth="6"
            opacity="0.3"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={`url(#gradient-${progress}-${size})`}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent"
            style={{ fontSize: `${fontSize}px` }}
          >
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    );
  };

  if (epics.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <Target className="w-20 h-20 mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-lg text-muted-foreground">Nenhum épico encontrado</p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-6 max-w-7xl mx-auto">
      {epics.map((epic, index) => {
        const progress = epic.progress || 0;
        const isExpanded = expandedEpics[epic.id];

        return (
          <motion.div
            key={epic.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="group w-full lg:w-[calc(50%-0.75rem)] xl:w-[calc(33.333%-1rem)]"
          >
            {/* Epic Card */}
            <Card 
              className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] bg-gradient-to-br ${getStatusColor(epic.status)} backdrop-blur-sm`}
              onClick={() => toggleEpic(epic.id)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
              
              <div className="relative p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-lg line-clamp-1">{epic.title}</h3>
                    </div>
                    {getPriorityBadge(epic.priority)}
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </div>

                {/* Progress Circle */}
                <div className="flex justify-center py-4">
                  {renderCircularProgress(progress, 120)}
                </div>

                {/* Description */}
                {epic.description && (
                  <div 
                    className="text-sm text-muted-foreground line-clamp-2 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: epic.description }}
                  />
                )}

                {/* Dates */}
                <div className="flex flex-wrap gap-3 text-xs">
                  {epic.start_date && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(epic.start_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  {epic.due_date && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(epic.due_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Features - Expandable */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 space-y-4 flex flex-col items-center"
                >
                  {loading[epic.id] ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    </div>
                  ) : epicFeatures[epic.id]?.length === 0 ? (
                    <Card className="p-6 text-center bg-muted/50">
                      <p className="text-sm text-muted-foreground">Nenhuma funcionalidade cadastrada</p>
                    </Card>
                  ) : (
                    epicFeatures[epic.id]?.map((feature, fIndex) => {
                      const featureProgress = feature.progress || 0;
                      const isFeatureExpanded = expandedFeatures[feature.id];

                      return (
                        <motion.div
                          key={feature.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: fIndex * 0.05 }}
                          className="w-[90%]"
                        >
                          {/* Feature Card */}
                          <Card 
                            className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01] bg-gradient-to-br ${getStatusColor(feature.status)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFeature(feature.id);
                            }}
                          >
                            <div className="p-5 space-y-3">
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                  {renderCircularProgress(featureProgress, 80)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Target className="w-4 h-4 text-primary flex-shrink-0" />
                                    <h4 className="font-semibold text-base line-clamp-1">{feature.title}</h4>
                                    <motion.div
                                      animate={{ rotate: isFeatureExpanded ? 180 : 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="ml-auto"
                                    >
                                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </motion.div>
                                  </div>
                                  {getPriorityBadge(feature.priority)}
                                  {feature.description && (
                                    <div 
                                      className="text-xs text-muted-foreground mt-2 line-clamp-2 prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{ __html: feature.description }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>

                          {/* Stories - Expandable */}
                          <AnimatePresence>
                            {isFeatureExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-3 space-y-3 flex flex-col items-center"
                              >
                                {loading[feature.id] ? (
                                  <div className="text-center py-6">
                                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                                  </div>
                                ) : featureStories[feature.id]?.length === 0 ? (
                                  <Card className="p-4 text-center bg-muted/50">
                                    <p className="text-xs text-muted-foreground">Nenhuma história cadastrada</p>
                                  </Card>
                                ) : (
                                  featureStories[feature.id]?.map((story, sIndex) => {
                                    const storyProgress = story.progress || 0;

                                    return (
                                      <motion.div
                                        key={story.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: sIndex * 0.05 }}
                                        className="w-[80%]"
                                      >
                                        <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${getStatusColor(story.status)}`}>
                                          <div className="p-4">
                                            <div className="flex items-start gap-3">
                                              <div className="flex-shrink-0">
                                                {renderCircularProgress(storyProgress, 60)}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                                  <h5 className="font-medium text-sm line-clamp-1">{story.title}</h5>
                                                </div>
                                                {story.story_points && (
                                                  <Badge variant="outline" className="text-xs mb-2">
                                                    {story.story_points} pts
                                                  </Badge>
                                                )}
                                                {story.description && (
                                                  <div 
                                                    className="text-xs text-muted-foreground line-clamp-2 prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: story.description }}
                                                  />
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </Card>
                                      </motion.div>
                                    );
                                  })
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
