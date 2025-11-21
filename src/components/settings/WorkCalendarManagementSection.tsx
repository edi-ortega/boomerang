import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Clock, Save, Edit, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkCalendar {
  id: string;
  name: string;
  work_days: number[];
  work_start_time: string;
  work_end_time: string;
  hours_per_day: number;
  is_active: boolean;
  is_default: boolean;
}

export default function WorkCalendarManagementSection() {
  const { toast } = useToast();
  const [calendar, setCalendar] = useState<WorkCalendar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "Calendário Padrão",
    work_days: [1, 2, 3, 4, 5], // Segunda a Sexta
    work_start_time: "08:00",
    work_end_time: "18:00",
    hours_per_day: 8,
    is_active: true,
    is_default: true
  });

  const daysOfWeek = [
    { value: 0, label: "Domingo", short: "Dom" },
    { value: 1, label: "Segunda-feira", short: "Seg" },
    { value: 2, label: "Terça-feira", short: "Ter" },
    { value: 3, label: "Quarta-feira", short: "Qua" },
    { value: 4, label: "Quinta-feira", short: "Qui" },
    { value: 5, label: "Sexta-feira", short: "Sex" },
    { value: 6, label: "Sábado", short: "Sáb" }
  ];

  useEffect(() => {
    loadCalendar();
  }, []);

  const loadCalendar = async () => {
    setIsLoading(true);
    try {
      const clientId = localStorage.getItem("current_tenant_id");
      
      const { data, error } = await supabase
        .from("prj_work_calendar")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_default", true)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        const calendarData = {
          ...data,
          work_days: Array.isArray(data.work_days) ? data.work_days as number[] : [1, 2, 3, 4, 5]
        };
        setCalendar(calendarData as WorkCalendar);
        setFormData({
          name: data.name,
          work_days: Array.isArray(data.work_days) ? data.work_days as number[] : [1, 2, 3, 4, 5],
          work_start_time: data.work_start_time || "08:00",
          work_end_time: data.work_end_time || "18:00",
          hours_per_day: data.hours_per_day || 8,
          is_active: data.is_active !== false,
          is_default: true
        });
      } else {
        await createDefaultCalendar();
      }
    } catch (error) {
      console.error("Error loading work calendar:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar o calendário de trabalho.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultCalendar = async () => {
    try {
      const clientId = localStorage.getItem("current_tenant_id");
      
      const { data, error } = await supabase
        .from("prj_work_calendar")
        .insert({
          client_id: clientId,
          name: "Calendário Padrão",
          work_days: [1, 2, 3, 4, 5],
          work_start_time: "08:00",
          work_end_time: "18:00",
          hours_per_day: 8,
          is_active: true,
          is_default: true
        })
        .select()
        .single();

      if (error) throw error;

      const calendarData = {
        ...data,
        work_days: data.work_days as number[]
      };
      setCalendar(calendarData as WorkCalendar);
      toast({
        title: "Calendário criado!",
        description: "Calendário padrão de trabalho foi criado."
      });
    } catch (error) {
      console.error("Error creating default calendar:", error);
      toast({
        title: "Erro ao criar",
        description: "Não foi possível criar o calendário padrão.",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (formData.work_days.length === 0) {
      toast({
        title: "Dias de trabalho obrigatórios",
        description: "Selecione pelo menos um dia de trabalho.",
        variant: "destructive"
      });
      return;
    }

    if (formData.hours_per_day <= 0) {
      toast({
        title: "Horas por dia inválidas",
        description: "As horas por dia devem ser maiores que zero.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const clientId = localStorage.getItem("current_tenant_id");

      if (calendar) {
        const { error } = await supabase
          .from("prj_work_calendar")
          .update({
            name: formData.name,
            work_days: formData.work_days,
            work_start_time: formData.work_start_time,
            work_end_time: formData.work_end_time,
            hours_per_day: formData.hours_per_day,
            is_active: formData.is_active
          })
          .eq("id", calendar.id)
          .eq("client_id", clientId);

        if (error) throw error;

        toast({
          title: "Calendário atualizado!",
          description: "As configurações foram salvas com sucesso."
        });
      }

      setIsEditing(false);
      await loadCalendar();
    } catch (error) {
      console.error("Error saving calendar:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o calendário.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWorkDay = (day: number) => {
    if (formData.work_days.includes(day)) {
      setFormData({
        ...formData,
        work_days: formData.work_days.filter(d => d !== day)
      });
    } else {
      setFormData({
        ...formData,
        work_days: [...formData.work_days, day].sort((a, b) => a - b)
      });
    }
  };

  const calculateTotalWeeklyHours = () => {
    return formData.work_days.length * formData.hours_per_day;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Trabalho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-bold">Calendário de Trabalho</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Configure os dias e horários de trabalho padrão
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="text-sm font-medium mb-2 block">Dias de Trabalho</label>
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => (
                  <div
                    key={day.value}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.work_days.includes(day.value)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => toggleWorkDay(day.value)}
                  >
                    <span className="text-xs font-medium">{day.short}</span>
                    <CheckCircle
                      className={`h-4 w-4 mt-1 ${
                        formData.work_days.includes(day.value)
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Início
                </label>
                <Input
                  type="time"
                  value={formData.work_start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, work_start_time: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Término
                </label>
                <Input
                  type="time"
                  value={formData.work_end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, work_end_time: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Horas/Dia
                </label>
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.hours_per_day}
                  onChange={(e) =>
                    setFormData({ ...formData, hours_per_day: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setIsEditing(false);
                  if (calendar) {
                    setFormData({
                      name: calendar.name,
                      work_days: calendar.work_days,
                      work_start_time: calendar.work_start_time,
                      work_end_time: calendar.work_end_time,
                      hours_per_day: calendar.hours_per_day,
                      is_active: calendar.is_active,
                      is_default: calendar.is_default
                    });
                  }
                }}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar Calendário"}
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Dias de Trabalho</h3>
              <div className="flex flex-wrap gap-2">
                {formData.work_days.map((dayValue) => {
                  const day = daysOfWeek.find(d => d.value === dayValue);
                  return day ? (
                    <Badge key={dayValue} variant="secondary">
                      {day.label}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Horário de Início</p>
                <p className="text-lg font-semibold">{formData.work_start_time}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Horário de Término</p>
                <p className="text-lg font-semibold">{formData.work_end_time}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Horas por Dia</p>
                <p className="text-lg font-semibold">{formData.hours_per_day}h</p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total de horas semanais</p>
              <p className="text-2xl font-bold text-primary">{calculateTotalWeeklyHours()}h</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
