import { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle, Clock, Flag } from "lucide-react";
import { motion } from "framer-motion";
import { getCurrentTenantId } from "@/lib/tenant-helper";

interface Task {
  id: string;
  title: string;
  due_date?: string;
  status: string;
  priority?: string;
  is_milestone?: boolean;
  client_id: string;
}

interface Project {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  color?: string;
  client_id: string;
}

interface DayEvents {
  tasks: Task[];
  milestoneTasks: Task[];
  projects: Project[];
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const tenantId = await getCurrentTenantId();
      console.log('[Calendar] Loading data for tenant:', tenantId);

      const [allTasks, allProjects] = await Promise.all([
        base44.entities.Task.list(),
        base44.entities.Project.list()
      ]);

      const tenantTasks = allTasks.filter((t: any) => t.client_id === tenantId);
      const tenantProjects = allProjects.filter((p: any) => p.client_id === tenantId);

      setTasks(tenantTasks);
      setProjects(tenantProjects);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDay = (day: number): DayEvents => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];

    const dayTasks = tasks.filter(t => !t.is_milestone && t.due_date && t.due_date.startsWith(dateStr));
    const dayMilestoneTasks = tasks.filter(t => t.is_milestone && t.due_date && t.due_date.startsWith(dateStr));

    const dayProjects = projects.filter(p =>
      (p.start_date && p.start_date.startsWith(dateStr)) ||
      (p.end_date && p.end_date.startsWith(dateStr))
    );

    return { tasks: dayTasks, milestoneTasks: dayMilestoneTasks, projects: dayProjects };
  };

  const hasEvents = (day: number) => {
    const events = getEventsForDay(day);
    return events.tasks.length > 0 || events.milestoneTasks.length > 0 || events.projects.length > 0;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-background">
        <p className="text-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-primary" />
            Calendário
          </h1>
          <p className="text-muted-foreground">Visualize tarefas, marcos e projetos</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={previousMonth}
                    className="hover:bg-accent"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-xl font-semibold text-foreground capitalize">
                    {monthName}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextMonth}
                    className="hover:bg-accent"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                  ))}
                  
                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const isSelected = selectedDay === day;
                    const today = isToday(day);
                    const events = hasEvents(day);

                    return (
                      <motion.div
                        key={day}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={isSelected ? "default" : "ghost"}
                          className={`
                            w-full aspect-square p-1 flex flex-col items-center justify-center
                            ${today ? 'ring-2 ring-primary' : ''}
                            ${events ? 'font-semibold' : ''}
                          `}
                          onClick={() => setSelectedDay(day)}
                        >
                          <span className="text-sm">{day}</span>
                          {events && (
                            <div className="w-1 h-1 rounded-full bg-primary mt-1" />
                          )}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {selectedDay ? `Eventos - Dia ${selectedDay}` : 'Selecione um dia'}
                </h3>

                {selectedEvents ? (
                  <div className="space-y-4">
                    {selectedEvents.tasks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Tarefas
                        </h4>
                        <div className="space-y-2">
                          {selectedEvents.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="p-2 rounded bg-accent/50 text-sm"
                            >
                              <div className="font-medium">{task.title}</div>
                              <Badge variant="outline" className="mt-1">
                                {task.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEvents.milestoneTasks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <Flag className="w-4 h-4" />
                          Marcos
                        </h4>
                        <div className="space-y-2">
                          {selectedEvents.milestoneTasks.map((milestone) => (
                            <div
                              key={milestone.id}
                              className="p-2 rounded bg-accent/50 text-sm"
                            >
                              <div className="font-medium">{milestone.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEvents.projects.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Projetos
                        </h4>
                        <div className="space-y-2">
                          {selectedEvents.projects.map((project) => (
                            <div
                              key={project.id}
                              className="p-2 rounded bg-accent/50 text-sm"
                            >
                              <div className="font-medium">{project.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEvents.tasks.length === 0 &&
                     selectedEvents.milestoneTasks.length === 0 &&
                     selectedEvents.projects.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Nenhum evento neste dia
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Clique em um dia para ver os eventos
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
