import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { IconPicker } from "@/components/ui/icon-picker";
import { ViewToggle } from "@/components/ViewToggle";
import { useViewModeStore } from "@/stores/viewModeStore";
import { PaginationControls } from "@/components/ui/pagination-controls";
import * as Icons from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";

export default function StoryTypeManagementSection() {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const { viewMode } = useViewModeStore();
  const { select, insert, update, delete: deleteFrom, currentTenantId } = useSupabaseQuery();
  const [storyTypes, setStoryTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    color: "#3b82f6",
    icon: "BookOpen",
    is_active: true,
    order: 0
  });

  useEffect(() => {
    loadStoryTypes();
  }, [currentTenantId]);

  const loadStoryTypes = async () => {
    setIsLoading(true);
    try {
      if (!currentTenantId) {
        console.warn("⚠️ [StoryType] No client_id found");
        setStoryTypes([]);
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await select("prj_story_type", "*").order("order");
      
      if (error) throw error;
      
      console.log("📦 [StoryType] Loaded story types:", data?.length || 0, "items");
      
      setStoryTypes(data || []);
    } catch (error) {
      console.error("❌ [StoryType] Error loading story types:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os tipos de história.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e código são obrigatórios."
      });
      return;
    }

    try {
      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) {
        toast({
          title: "Erro de autenticação",
          description: "Sessão não encontrada.",
          variant: "destructive"
        });
        return;
      }
      const parsedSession = JSON.parse(storedSession);
      const userId = parsedSession.user?.user_id;

      if (editingType) {
        const { data, error } = await (await import("@/lib/supabase-client")).getSupabaseClient()
          .then(client => client.rpc('update_story_type', {
            p_user_id: userId,
            p_id: editingType.id,
            p_name: formData.name,
            p_code: formData.code,
            p_description: formData.description,
            p_icon: formData.icon,
            p_color: formData.color,
            p_is_active: formData.is_active,
            p_order: formData.order
          }));
        
        if (error) throw error;
        
        toast({
          title: "Tipo atualizado!",
          description: "O tipo de história foi atualizado com sucesso."
        });
      } else {
        const { data, error } = await (await import("@/lib/supabase-client")).getSupabaseClient()
          .then(client => client.rpc('insert_story_type', {
            p_user_id: userId,
            p_name: formData.name,
            p_code: formData.code,
            p_description: formData.description,
            p_icon: formData.icon,
            p_color: formData.color,
            p_is_active: formData.is_active,
            p_order: formData.order
          }));
        
        if (error) throw error;
        
        toast({
          title: "Tipo criado!",
          description: "O tipo de história foi criado com sucesso."
        });
      }
      
      resetForm();
      await loadStoryTypes();
    } catch (error) {
      console.error("Error saving story type:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o tipo de história.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      code: type.code,
      description: type.description || "",
      color: type.color || "#3b82f6",
      icon: type.icon || "BookOpen",
      is_active: type.is_active !== false,
      order: type.order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: "Confirmar exclusão",
      description: "Tem certeza que deseja excluir este tipo de história? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar"
    });

    if (!confirmed) return;
    
    try {
      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) {
        toast({
          title: "Erro de autenticação",
          description: "Sessão não encontrada.",
          variant: "destructive"
        });
        return;
      }
      const parsedSession = JSON.parse(storedSession);
      const userId = parsedSession.user?.user_id;

      const { data, error } = await (await import("@/lib/supabase-client")).getSupabaseClient()
        .then(client => client.rpc('delete_story_type', {
          p_user_id: userId,
          p_id: id
        }));
      
      if (error) throw error;
      
      toast({
        title: "Tipo excluído!",
        description: "O tipo de história foi excluído com sucesso."
      });
      await loadStoryTypes();
    } catch (error) {
      console.error("Error deleting story type:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o tipo de história.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      color: "#3b82f6",
      icon: "BookOpen",
      is_active: true,
      order: 0
    });
    setShowForm(false);
    setEditingType(null);
  };

  return (
    <>
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tipos de História</h2>
          <p className="text-muted-foreground">Gerencie os tipos de histórias do sistema</p>
        </div>
        <div className="flex gap-2">
          <ViewToggle />
          <Button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="bg-primary hover:bg-primary/80"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Tipo
          </Button>
        </div>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="glass-effect border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                {editingType ? "Editar Tipo de História" : "Novo Tipo de História"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Nome *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Feature"
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Código *</label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="Ex: FEATURE"
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Descrição</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descreva o tipo de história..."
                    className="bg-background border-border text-foreground h-20"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Cor</label>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="bg-background border-border h-10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Ordem</label>
                    <Input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({...formData, order: Number(e.target.value)})}
                      className="bg-background border-border text-foreground with-spinner"
                    />
                  </div>
                </div>

                <IconPicker
                  value={formData.icon}
                  onChange={(icon) => setFormData({...formData, icon})}
                />

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1 border-border hover:bg-accent">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/80">
                    {editingType ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="glass-effect border-border animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : storyTypes.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storyTypes.map((type, index) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-effect border-border hover:border-primary/50 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${type.color}20` }}
                        >
                          <BookOpen className="w-6 h-6" style={{ color: type.color }} />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-lg">{type.name}</h3>
                          <p className="text-sm text-muted-foreground">{type.code}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(type)}
                          className="border-border hover:bg-accent"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(type.id)}
                          className="border-red-500/50 hover:bg-red-500/10 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {type.description && (
                      <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge className={type.is_active ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-gray-500/20 text-gray-600 dark:text-gray-400"}>
                        {type.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        Ordem: {type.order}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {storyTypes.map((type, index) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-effect border-border hover:border-primary/50 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${type.color}20` }}
                        >
                          <BookOpen className="w-5 h-5" style={{ color: type.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-foreground">{type.name}</h3>
                            <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                              {type.code}
                            </Badge>
                            <Badge className={type.is_active ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-gray-500/20 text-gray-600 dark:text-gray-400"}>
                              {type.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                            <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                              Ordem: {type.order}
                            </Badge>
                          </div>
                          {type.description && (
                            <p className="text-sm text-muted-foreground truncate">{type.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(type)}
                          className="border-border hover:bg-accent"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(type.id)}
                          className="border-red-500/50 hover:bg-red-500/10 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <Card className="glass-effect border-border">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum tipo de história cadastrado</h3>
            <p className="text-muted-foreground mb-6">Crie seu primeiro tipo de história</p>
            <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/80">
              <Plus className="w-4 h-4 mr-2" />
              Criar Tipo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
    <ConfirmDialog />
  </>
  );
}