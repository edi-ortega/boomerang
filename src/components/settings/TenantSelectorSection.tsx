import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  description?: string;
  isPrimary?: boolean;
}

export default function TenantSelectorSection() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTenantId, setCurrentTenant } = useTenant();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);

      // Buscar user_id da sessão BMR no localStorage
      const storedSession = localStorage.getItem('bmr_session');
      console.log('Stored session:', storedSession);

      if (!storedSession) {
        console.warn('No BMR session found');
        return;
      }

      const parsedSession = JSON.parse(storedSession);
      const userId = parsedSession.user?.user_id;
      console.log('User ID from session:', userId);

      if (!userId) {
        console.warn('No user_id in session');
        return;
      }

      // Buscar os clientes através da view vbmr_user_clients
      const { data: userClients, error: clientsError } = await supabase
        .from('vbmr_user_clients')
        .select('*')
        .eq('user_id', userId);

      console.log('User clients from view:', userClients, 'Error:', clientsError);

      if (clientsError) throw clientsError;

      // Mapear os dados da view para o formato esperado
      const tenantsData = userClients?.map(client => {
        console.log('Client data:', client);
        return {
          id: client.client_id || client.system_id,
          name: client.client_name || client.system_name,
          description: client.client_description || client.system_description,
          isPrimary: client.is_primary_client || false
        };
      }).filter(t => t.id && t.name) || [];

      console.log('Tenants data mapped:', tenantsData);

      setTenants(tenantsData);

      // Selecionar automaticamente o cliente primário se não houver um selecionado
      const primaryClient = tenantsData.find(t => t.isPrimary);
      if (primaryClient && !currentTenantId) {
        console.log('Setting primary client as selected:', primaryClient);
        await setCurrentTenant({
          id: primaryClient.id,
          name: primaryClient.name,
          slug: primaryClient.name.toLowerCase().replace(/\s+/g, '-'),
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast.error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTenant = async (tenant: Tenant) => {
    await setCurrentTenant({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.name.toLowerCase().replace(/\s+/g, '-'),
      is_active: true
    });

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
              className="h-full"
            >
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg h-full flex flex-col ${
                  currentTenantId === tenant.id
                    ? 'border-primary border-2 bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleSelectTenant(tenant)}
              >
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between gap-3 min-h-[80px]">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`p-3 rounded-lg flex-shrink-0 ${
                          currentTenantId === tenant.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-2 line-clamp-2">{tenant.name}</CardTitle>
                        {tenant.description && (
                          <CardDescription className="line-clamp-2">
                            {tenant.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    {currentTenantId === tenant.id && (
                      <div className="p-1 rounded-full bg-primary flex-shrink-0">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                {currentTenantId === tenant.id && (
                  <CardContent className="pt-0 pb-4">
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
