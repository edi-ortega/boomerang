import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Info, Lightbulb, TrendingUp, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ContextStat {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface ContextInfo {
  title?: string;
  description?: string;
  items?: string[];
}

interface ContextAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

interface ContextData {
  title?: string;
  stats: ContextStat[];
  info?: ContextInfo;
  tips: (string | { icon?: React.ReactNode; text?: string })[];
  actions?: ContextAction[];
  quickActions?: ContextAction[];
}

interface ContextSidebarProps {
  contextData: ContextData;
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function ContextSidebar({ contextData, isCollapsed, onToggle }: ContextSidebarProps) {
  if (!contextData.title && contextData.stats.length === 0 && contextData.tips.length === 0) {
    return null;
  }

  return (
    <div
      className={`hidden md:block fixed right-0 top-0 h-full bg-card/50 backdrop-blur-xl border-l border-border z-40 sidebar-transition ${
        isCollapsed ? 'w-16' : 'w-80'
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border relative">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-foreground truncate">
                  {contextData.title || "Informações"}
                </h2>
                <p className="text-xs text-muted-foreground">Contexto da página</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5 text-primary" />
              </div>
            </div>
          )}

          <button
            onClick={onToggle}
            className="absolute -left-4 bottom-0 translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-50"
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4 text-primary-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-primary-foreground" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {!isCollapsed && (
              <>
                {/* Stats Section */}
                {contextData.stats && contextData.stats.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Card className="bg-accent/30 border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          Estatísticas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {contextData.stats.map((stat, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {stat.icon && (
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  {stat.icon}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground truncate">
                                  {stat.label}
                                </p>
                                <p className="text-lg font-bold text-foreground">
                                  {stat.value}
                                </p>
                              </div>
                            </div>
                            {stat.badge && (
                              <Badge className={stat.badgeColor || "bg-primary/20 text-primary"}>
                                {stat.badge}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Info Section */}
                {contextData.info && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="bg-blue-500/10 border-blue-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            {contextData.info.title && (
                              <p className="text-sm font-semibold text-foreground mb-1">
                                {contextData.info.title}
                              </p>
                            )}
                            {contextData.info.description && (
                              <p className="text-sm text-muted-foreground">
                                {contextData.info.description}
                              </p>
                            )}
                            {contextData.info.items && contextData.info.items.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {contextData.info.items.map((item, index) => (
                                  <li key={index} className="text-sm text-muted-foreground">
                                    • {item}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Tips Section */}
                {contextData.tips && contextData.tips.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="bg-accent/30 border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          Dicas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {contextData.tips.map((tip, index) => {
                          const tipText = typeof tip === 'string' ? tip : tip.text;
                          const tipIcon = typeof tip === 'string' ? null : tip.icon;
                          return (
                            <div key={index} className="flex items-start gap-2">
                              {tipIcon || <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
                              <p className="text-sm text-muted-foreground flex-1">
                                {tipText}
                              </p>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Actions Section */}
                {(contextData.actions || contextData.quickActions) && ((contextData.actions && contextData.actions.length > 0) || (contextData.quickActions && contextData.quickActions.length > 0)) && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="bg-accent/30 border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-foreground">
                          Ações Rápidas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {[...(contextData.actions || []), ...(contextData.quickActions || [])].map((action, index) => (
                          <Button
                            key={index}
                            onClick={action.onClick}
                            variant={action.variant || "outline"}
                            className="w-full justify-start text-sm"
                            size="sm"
                          >
                            {action.icon && <span className="mr-2">{action.icon}</span>}
                            {action.label}
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
