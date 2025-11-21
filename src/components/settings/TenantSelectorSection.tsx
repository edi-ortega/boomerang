import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/useTenantId';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  description?: string;
}

export default function TenantSelectorSection() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenantId, setTenantId } = useTenantId();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);

      // Buscar o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Auth user:', user?.id);
      if (!user) return;

      // Buscar o user_id na tabela bmr_user
      const { data: bmrUser, error: userError } = await supabase
        .from('bmr_user')
        .select('user_id')
        .eq('auth_user_id', user.id)
        .single();

      console.log('BMR User:', bmrUser, 'Error:', userError);

      if (userError || !bmrUser) {
        console.error('Error loading user:', userError);
        return;
      }

      // Buscar os clientes através da view vbmr_user_clients
      const { data: userClients, error: clientsError } = await supabase
        .from('vbmr_user_clients')
        .select('*')
        .eq('user_id', bmrUser.user_id);

      console.log('User clients from view:', userClients, 'Error:', clientsError);

      if (clientsError) throw clientsError;

      // Mapear os dados da view para o formato esperado
      const tenantsData = userClients?.map(client => {
        console.log('Client data:', client);
        return {
          id: client.client_id || client.system_id,
          name: client.client_name || client.system_name,
          description: client.client_description || client.system_description
        };
      }).filter(t => t.id && t.name) || [];

      console.log('Tenants data mapped:', tenantsData);

      setTenants(tenantsData);
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast.error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTenant = (newTenantId: string) => {
    setTenantId(newTenantId);
    toast.success('Empresa selecionada com sucesso!');

    // Recarregar página para atualizar dados
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (loading) {
    return <p className="text-muted-foreground">Carregando empresas...</p>;
  }

  return (
    <div>
      {tenants.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma empresa encontrada.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map((tenant, index) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  tenantId === tenant.id
                    ? 'border-primary border-2 bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleSelectTenant(tenant.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-lg ${
                          tenantId === tenant.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tenant.name}</CardTitle>
                        {tenant.description && (
                          <CardDescription className="mt-1">
                            {tenant.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    {tenantId === tenant.id && (
                      <div className="p-1 rounded-full bg-primary">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                {tenantId === tenant.id && (
                  <CardContent className="pt-0">
                    <div className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium inline-block">
                      Selecionada
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
