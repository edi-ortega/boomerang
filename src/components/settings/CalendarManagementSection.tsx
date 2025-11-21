import { useState, useEffect } from "react";
import { bmr } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { useTenantId } from "@/contexts/TenantContext";

export default function CalendarManagementSection() {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const tenantId = useTenantId();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    description: "",
    type: "national",
    is_recurring: false
  });

  useEffect(() => {
    loadHolidays();
  }, [tenantId]);

  const loadHolidays = async () => {
    setIsLoading(true);
    try {
      const allHolidays = await bmr.entities.Holiday.list("-date");
      const tenantHolidays = allHolidays.filter((h: any) => h.client_id === tenantId);
      setHolidays(tenantHolidays);
    } catch (error) {
      console.error("Error loading holidays:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os feriados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.date) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e data são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const holidayData = {
        ...formData,
        client_id: tenantId
      };

      if (editingHoliday) {
        await bmr.entities.Holiday.update(editingHoliday.id, holidayData);
        toast({
          title: "Feriado atualizado!",
          description: "O feriado foi atualizado com sucesso."
        });
      } else {
        await bmr.entities.Holiday.create(holidayData);
        toast({
          title: "Feriado criado!",
          description: "O feriado foi criado com sucesso."
        });
      }
      
      resetForm();
      await loadHolidays();
    } catch (error) {
      console.error("Error saving holiday:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o feriado.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (holiday: any) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date,
      description: holiday.description || "",
      type: holiday.type || "national",
      is_recurring: holiday.is_recurring || false
    });
    setShowForm(true);
  };

  const handleDelete = async (holiday: any) => {
    const confirmed = await confirm({
      title: "Excluir Feriado",
      description: `Tem certeza que deseja excluir o feriado "${holiday.name}"?`
    });

    if (!confirmed) return;
    
    try {
      await bmr.entities.Holiday.delete(holiday.id);
      toast({
        title: "Feriado excluído!",
        description: "O feriado foi removido com sucesso."
      });
      await loadHolidays();
    } catch (error) {
      console.error("Error deleting holiday:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o feriado.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      date: "",
      description: "",
      type: "national",
      is_recurring: false
    });
    setEditingHoliday(null);
    setShowForm(false);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      national: "bg-blue-500",
      regional: "bg-green-500",
      religious: "bg-purple-500",
      corporate: "bg-orange-500"
    };
    return colors[type] || "bg-gray-500";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Calendário de Feriados
            </CardTitle>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Feriado
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit}
              className="mb-6 p-4 border border-border rounded-lg bg-accent/20"
            >
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Natal"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data *</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national">Nacional</SelectItem>
                      <SelectItem value="regional">Regional</SelectItem>
                      <SelectItem value="religious">Religioso</SelectItem>
                      <SelectItem value="corporate">Corporativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_recurring" className="text-sm">
                    Feriado Recorrente (todo ano)
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingHoliday ? "Atualizar" : "Criar"} Feriado
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </motion.form>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum feriado cadastrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {holidays.map((holiday) => (
                <motion.div
                  key={holiday.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 ${getTypeColor(holiday.type)} rounded`} />
                    <div>
                      <h4 className="font-medium">{holiday.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(holiday.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        {holiday.is_recurring && " (Recorrente)"}
                      </p>
                      {holiday.description && (
                        <p className="text-sm text-muted-foreground mt-1">{holiday.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{holiday.type}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(holiday)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(holiday)}
                      className="border-red-500/50 hover:bg-red-500/10 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog />
    </>
  );
}
