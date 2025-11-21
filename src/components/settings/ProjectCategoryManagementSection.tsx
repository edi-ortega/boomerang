import React, { useState, useEffect, useMemo } from "react";
import { bmr } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Folder } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { addTenantData, addTenantFilter } from "@/lib/tenant-helper";
import { IconPicker } from "@/components/ui/icon-picker";
import { ViewToggle } from "@/components/ViewToggle";
import { useViewModeStore } from "@/stores/viewModeStore";
import { PaginationControls } from "@/components/ui/pagination-controls";
import * as Icons from "lucide-react";

const ICONS = [
  "Folder", "FolderOpen", "Briefcase", "Package", "Layers", 
  "Box", "Archive", "Inbox", "BookOpen", "FileText",
  "Code", "Database", "Server", "Cloud", "Globe"
];

export default function ProjectCategoryManagementSection() {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const { viewMode } = useViewModeStore();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    icon: "Folder",
    color: "#3b82f6",
    is_active: true,
    order: 0
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const tenantFilter = await addTenantFilter({});
      console.log("🔍 [ProjectCategory] Loading with tenant filter:", tenantFilter);
      
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { data, error } = await supabase
        .from("prj_project_category")
        .select("*")
        .eq("client_id", tenantFilter.client_id)
        .order("order");
      
      if (error) throw error;
      
      console.log("📦 [ProjectCategory] Loaded categories:", data?.length || 0, "items");
      console.log("📦 [ProjectCategory] Categories data:", data);
      
      setCategories(data || []);
    } catch (error) {
      console.error("❌ [ProjectCategory] Error loading categories:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive"
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
        description: "Nome e código são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get user_id from session
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

      if (editingCategory) {
        // Use RPC function for update
        const { data, error } = await (await import("@/lib/supabase-client")).getSupabaseClient()
          .then(client => client.rpc('update_project_category', {
            p_user_id: userId,
            p_id: editingCategory.id,
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
          title: "Categoria atualizada!",
          description: `A categoria "${formData.name}" foi atualizada.`
        });
      } else {
        const categoryData = await addTenantData(formData);
        
        // Use RPC function for insert
        const { data, error } = await (await import("@/lib/supabase-client")).getSupabaseClient()
          .then(client => client.rpc('insert_project_category', {
            p_user_id: userId,
            p_name: categoryData.name,
            p_code: categoryData.code,
            p_description: categoryData.description,
            p_icon: categoryData.icon,
            p_color: categoryData.color,
            p_is_active: categoryData.is_active,
            p_order: categoryData.order,
            p_client_id: categoryData.client_id
          }));
        
        if (error) throw error;
        
        toast({
          title: "Categoria criada!",
          description: `A categoria "${formData.name}" foi criada.`
        });
      }

      await loadCategories();
      resetForm();
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a categoria.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || "",
      icon: category.icon || "Folder",
      color: category.color || "#3b82f6",
      is_active: category.is_active !== false,
      order: category.order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (category) => {
    const confirmed = await confirm({
      title: "Confirmar exclusão",
      description: `Tem certeza que deseja excluir a categoria "${category.name}"? Esta ação não pode ser desfeita.`,
      confirmText: "Excluir",
      cancelText: "Cancelar"
    });

    if (!confirmed) return;

    try {
      // Get user_id from session
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

      // Use RPC function for delete
      const { data, error } = await (await import("@/lib/supabase-client")).getSupabaseClient()
        .then(client => client.rpc('delete_project_category', {
          p_user_id: userId,
          p_id: category.id
        }));
      
      if (error) throw error;
      
      toast({
        title: "Categoria excluída!",
        description: `A categoria "${category.name}" foi excluída.`
      });
      await loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a categoria.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      icon: "Folder",
      color: "#3b82f6",
      is_active: true,
      order: 0
    });
    setShowForm(false);
    setEditingCategory(null);
  };

  const generateCode = () => {
    const name = formData.name.trim();
    if (!name) return;

    const code = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20);

    setFormData(prev => ({ ...prev, code }));
  };

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return categories.slice(startIndex, endIndex);
  }, [categories, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(categories.length / itemsPerPage);

  // Helper to render icon component safely
  const renderIcon = (iconName: string, props: any = {}) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<any>;
    if (!IconComponent || typeof IconComponent !== 'function') {
      return <Icons.Folder {...props} />;
    }
    return <IconComponent {...props} />;
  };

  return (
    <>
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Categorias de Projeto</h2>
          <p className="text-muted-foreground">Gerencie as categorias disponíveis para classificação de projetos</p>
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
            Nova Categoria
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
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
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
                      onBlur={generateCode}
                      placeholder="Ex: Desenvolvimento"
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Código *</label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="Ex: DEV"
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
                    placeholder="Descreva a categoria..."
                    className="bg-background border-border text-foreground h-20"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <IconPicker
                    value={formData.icon}
                    onChange={(icon) => setFormData({...formData, icon})}
                  />
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

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1 border-border hover:bg-accent">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/80">
                    {editingCategory ? "Atualizar" : "Criar"}
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
      ) : categories.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCategories.map((category, index) => (
              <motion.div
                key={category.id}
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
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          {renderIcon(category.icon, { className: "w-6 h-6", style: { color: category.color } })}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-lg">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">{category.code}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(category)}
                          className="border-border hover:bg-accent"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(category)}
                          className="border-red-500/50 hover:bg-red-500/10 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {category.description && (
                      <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge className={category.is_active ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-gray-500/20 text-gray-600 dark:text-gray-400"}>
                        {category.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        Ordem: {category.order}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          ) : (
            <div className="space-y-2">
              {paginatedCategories.map((category, index) => (
                <motion.div
                  key={category.id}
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
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            {renderIcon(category.icon, { className: "w-5 h-5", style: { color: category.color } })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-foreground">{category.name}</h3>
                              <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                                {category.code}
                              </Badge>
                              <Badge className={category.is_active ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-gray-500/20 text-gray-600 dark:text-gray-400"}>
                                {category.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                              <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                                Ordem: {category.order}
                              </Badge>
                            </div>
                            {category.description && (
                              <p className="text-sm text-muted-foreground truncate">{category.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(category)}
                            className="border-border hover:bg-accent"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(category)}
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
          )}
          {totalPages > 1 && (
            <div className="mt-6">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={categories.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      ) : (
        <Card className="glass-effect border-border">
          <CardContent className="p-12 text-center">
            <Icons.Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma categoria cadastrada</h3>
            <p className="text-muted-foreground mb-6">Crie sua primeira categoria de projeto</p>
            <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/80">
              <Plus className="w-4 h-4 mr-2" />
              Criar Categoria
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
    <ConfirmDialog />
  </>
  );
}