import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Target, TrendingUp, Trophy, Sparkles, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from 'canvas-confetti';
import { useEffect } from "react";

interface Story {
  id: string;
  title: string;
  story_points?: string | number;
  priority?: string;
  status?: string;
}

interface PokerSummaryModalProps {
  stories: Story[];
  onClose: () => void;
  onDelete?: () => void;
  projectName?: string;
  sprintName?: string;
  complexityType?: string;
}

export default function PokerSummaryModal({
  stories,
  onClose,
  onDelete,
  projectName,
  sprintName,
  complexityType = 'fibonacci'
}: PokerSummaryModalProps) {
  
  const estimatedCount = stories.filter(s => s.story_points).length;
  
  const isNumeric = complexityType === 'fibonacci' || complexityType === 'numeric';
  
  let totalPoints = 0;
  if (isNumeric) {
    totalPoints = stories.reduce((sum, s) => {
      if (!s.story_points) return sum;
      const points = typeof s.story_points === 'string' 
        ? parseInt(s.story_points, 10) 
        : s.story_points;
      return sum + (isNaN(points) ? 0 : points);
    }, 0);
  }

  // Confetti effect on mount
  useEffect(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const priorityColors: Record<string, string> = {
    low: "bg-blue-500/20 text-blue-600 dark:bg-blue-500/30 dark:text-blue-400",
    medium: "bg-yellow-500/20 text-yellow-600 dark:bg-yellow-500/30 dark:text-yellow-400",
    high: "bg-orange-500/20 text-orange-600 dark:bg-orange-500/30 dark:text-orange-400",
    critical: "bg-red-500/20 text-red-600 dark:bg-red-500/30 dark:text-red-400"
  };

  const priorityLabels: Record<string, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    critical: "Crítica"
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotateX: -15 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ 
          type: "spring", 
          duration: 0.7,
          bounce: 0.3
        }}
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-2 border-primary bg-gradient-to-br from-card via-card to-primary/5 shadow-2xl">
          {/* Header com animação */}
          <CardHeader className="border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
              className="absolute top-4 right-4"
            >
              <Trophy className="w-16 h-16 text-primary opacity-20" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-start justify-between relative z-10"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <PartyPopper className="w-8 h-8 text-primary" />
                  </motion.div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Sessão Concluída! 🎉
                  </CardTitle>
                </div>
                {projectName && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {projectName} {sprintName && `• ${sprintName}`}
                  </p>
                )}
              </div>
            </motion.div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Stats com animação */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex items-center gap-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="p-3 rounded-full bg-primary/10"
                    >
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </motion.div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">{estimatedCount}</p>
                      <p className="text-sm text-muted-foreground">Histórias Estimadas</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-accent to-accent/50 border-accent hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex items-center gap-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
                      className="p-3 rounded-full bg-accent-foreground/10"
                    >
                      <Target className="w-8 h-8 text-accent-foreground" />
                    </motion.div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">{stories.length}</p>
                      <p className="text-sm text-muted-foreground">Total de Histórias</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {isNumeric && (
                <motion.div variants={itemVariants}>
                  <Card className="bg-gradient-to-br from-secondary to-secondary/50 border-secondary hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 flex items-center gap-4">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
                        className="p-3 rounded-full bg-secondary-foreground/10"
                      >
                        <TrendingUp className="w-8 h-8 text-secondary-foreground" />
                      </motion.div>
                      <div>
                        <p className="text-3xl font-bold text-foreground">{totalPoints}</p>
                        <p className="text-sm text-muted-foreground">Pontos Totais</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>

            {/* Lista de histórias com animação */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Resultados da Votação
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {stories.map((story, index) => (
                    <motion.div
                      key={story.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                    >
                      <Card className="bg-card hover:bg-accent/5 transition-colors border-border hover:border-primary/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate mb-2">
                                {story.title}
                              </h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                {story.priority && (
                                  <Badge 
                                    variant="outline" 
                                    className={priorityColors[story.priority] || ""}
                                  >
                                    {priorityLabels[story.priority] || story.priority}
                                  </Badge>
                                )}
                                {story.status && (
                                  <Badge variant="secondary">
                                    {story.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.7 + index * 0.05, type: "spring" }}
                              className="flex-shrink-0"
                            >
                              {story.story_points ? (
                                <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold text-xl shadow-lg">
                                  {story.story_points}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-muted text-muted-foreground text-sm">
                                  N/A
                                </div>
                              )}
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Botões de ação */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex gap-3 pt-4 border-t border-border"
            >
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-border hover:bg-accent"
              >
                Fechar
              </Button>
              {onDelete && (
                <Button
                  onClick={onDelete}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Finalizar e Salvar no Histórico
                </Button>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
