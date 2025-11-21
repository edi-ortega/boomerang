import { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { getCurrentTenantId } from "@/lib/tenant-helper";

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  is_active?: boolean;
  tenant_id: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const tenantId = await getCurrentTenantId();
      const allUsers = await base44.entities.User.list();
      const tenantUsers = allUsers.filter((u: any) => u.tenant_id === tenantId);
      setUsers(tenantUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Gestão de Usuários
            </h1>
            <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{user.name || user.email}</CardTitle>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.is_active ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-600">
                        Inativo
                      </Badge>
                    )}
                    <Badge variant="outline">{user.role || 'Usuário'}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
