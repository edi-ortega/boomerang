
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, User } from "lucide-react";
import { motion } from "framer-motion";
import { useConfirm } from "@/hooks/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import { IconPicker } from "@/components/ui/icon-picker";
import { ViewToggle } from "@/components/ViewToggle";
import { useViewModeStore } from "@/stores/viewModeStore";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";

export default function UserTypeManagementSection() {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const { viewMode } = useViewModeStore();
  const { select, insert, update, delete: deleteFrom, currentTenantId } = useSupabaseQuery();
  const [userTypes, setUserTypes] = useState([]);
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
    icon: "User",
    is_active: true,
    order: 0
  });

  useEffect(() => {
    loadUserTypes();
  }, [currentTenantId]);

  const loadUserTypes = async () => {
    setIsLoading(true);
    try {
      if (!currentTenantId) {
        console.warn("⚠️ [UserType] No client_id found");
        setUserTypes([]);
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await select("prj_user_type", "*").order("order");
      
      if (error) throw error;
      
      console.log("📦 [UserType] Loaded user types:", data?.length || 0, "items");
      
      setUserTypes(data || []);
    } catch (error) {
      console.error("❌ [UserType] Error loading user types:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os tipos de usuário.",
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
      if (!currentTenantId) {
        toast({
          title: "Erro de sessão",
          description: "Não foi possível identificar o tenant.",
          variant: "destructive"
        });
        return;
      }

      if (editingType) {
        const { error } = await update("prj_user_type", formData)
          .eq("id", editingType.id);
        
        if (error) throw error;
        
        toast({
          title: "Tipo atualizado!",
          description: "O tipo de usuário foi atualizado com sucesso."
        });
      } else {
        const { error } = await insert("prj_user_type", formData);
        
        if (error) throw error;
        
        toast({
          title: "Tipo criado!",
          description: "O tipo de usuário foi criado com sucesso."
        });
      }
      
      resetForm();
      await loadUserTypes();
    } catch (error) {
      console.error("Error saving user type:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o tipo de usuário.",
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
      icon: type.icon || "User",
      is_active: type.is_active !== false,
      order: type.order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: "Confirmar exclusão",
      description: "Tem certeza que deseja excluir este tipo de usuário? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar"
    });

    if (!confirmed) return;
    
    try {
      if (!currentTenantId) {
        toast({
          title: "Erro de sessão",
          description: "Não foi possível identificar o tenant.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await deleteFrom("prj_user_type").eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Tipo excluído!",
        description: "O tipo de usuário foi excluído com sucesso."
      });
      await loadUserTypes();
    } catch (error) {
      console.error("Error deleting user type:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o tipo de usuário.",
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
      icon: "User",
      is_active: true,
      order: 0
    });
    setShowForm(false);
    setEditingType(null);
  };

  const paginatedUserTypes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return userTypes.slice(startIndex, endIndex);
  }, [userTypes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(userTypes.length / itemsPerPage);

  return (
    <>
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tipos de Usuário</h2>
          <p className="text-muted-foreground">Gerencie os tipos de usuário do sistema</p>
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
                {editingType ? "Editar Tipo de Usuário" : "Novo Tipo de Usuário"}
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
                      placeholder="Ex: Gerente"
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Código *</label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toLowerCase().replace(/\s/g, '_')})}
                      placeholder="Ex: manager"
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
                    placeholder="Descreva as responsabilidades deste tipo de usuário"
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
      ) : userTypes.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedUserTypes.map((type, index) => (
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
                        <User className="w-6 h-6" style={{ color: type.color }} />
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
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={type.is_active ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-gray-500/20 text-gray-600 dark:text-gray-400"}>
                      {type.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      Ordem: {type.order}
                    </Badge>
                  </div>

                  {type.permissions && type.permissions.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {type.permissions.length} permissões configuradas
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {type.permissions.slice(0, 3).map((perm, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {perm.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                        {type.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{type.permissions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={userTypes.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </>
      ) : (
        <Card className="glass-effect border-border">
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum tipo de usuário cadastrado</h3>
            <p className="text-muted-foreground mb-6">Crie seu primeiro tipo de usuário</p>
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
