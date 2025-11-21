import { useState, useEffect } from "react";
import { bmr } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Edit, Save, X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useTenantId } from "@/contexts/TenantContext";
import PermissionsManager from "@/components/users/PermissionsManager";

export default function PermissionsManagementSection() {
  const { toast } = useToast();
  const tenantId = useTenantId();
  const [userTypes, setUserTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingType, setEditingType] = useState<any | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    loadUserTypes();
  }, [tenantId]);

  const loadUserTypes = async () => {
    setIsLoading(true);
    try {
      const allTypes = await bmr.entities.UserType.list("name");
      const tenantTypes = allTypes.filter((t: any) => t.client_id === tenantId);
      setUserTypes(tenantTypes);
    } catch (error) {
      console.error("Error loading user types:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os tipos de usuário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (userType: any) => {
    setEditingType(userType);
    setSelectedPermissions(userType.permissions || []);
  };

  const handleSave = async () => {
    if (!editingType) return;

    try {
      await bmr.entities.UserType.update(editingType.id, {
        permissions: selectedPermissions
      });

      toast({
        title: "Permissões atualizadas!",
        description: `As permissões de ${editingType.name} foram atualizadas com sucesso.`
      });

      setEditingType(null);
      await loadUserTypes();
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as permissões.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditingType(null);
    setSelectedPermissions([]);
  };

  if (isLoading) {
    return (
      <Card className="glass-effect border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-foreground">Gerenciamento de Permissões</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {editingType ? (
        <Card className="glass-effect border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-foreground">
                  Editando Permissões: {editingType.name}
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PermissionsManager
              selectedPermissions={selectedPermissions}
              onChange={setSelectedPermissions}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-effect border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-foreground">Gerenciamento de Permissões</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Gerencie as permissões de acesso às telas e funcionalidades do sistema para cada tipo de usuário.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userTypes.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum tipo de usuário encontrado. Crie tipos de usuário em Cadastros &gt; Tipos de Usuário.
                </div>
              ) : (
                <div className="grid gap-4">
                  {userTypes.map((userType) => (
                    <motion.div
                      key={userType.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-border rounded-lg p-4 bg-accent/30 hover:bg-accent/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium text-foreground">{userType.name}</h3>
                            {userType.is_admin && (
                              <Badge variant="secondary">Admin</Badge>
                            )}
                          </div>
                          {userType.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {userType.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {userType.permissions?.length || 0} permissões configuradas
                            </span>
                            {userType.permissions && userType.permissions.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {userType.permissions.slice(0, 3).map((perm: string) => (
                                  <Badge key={perm} variant="outline" className="text-xs">
                                    {perm.split('.')[0]}
                                  </Badge>
                                ))}
                                {userType.permissions.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{userType.permissions.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(userType)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
