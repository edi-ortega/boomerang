import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant) => Promise<void>;
  tenants: Tenant[];
  loading: boolean;
  currentTenantId: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Recarregar tenants quando o usuário fizer login
  useEffect(() => {
    if (user) {
      console.log("🏢 [TenantContext] Usuário detectado, carregando tenants...");
      loadUserTenant();
    } else {
      console.log("⚠️ [TenantContext] Sem usuário, resetando tenant");
      setCurrentTenant(null);
      setTenants([]);
      setLoading(false);
      localStorage.removeItem("current_tenant_id");
    }
  }, [user]);

  const loadUserTenant = async () => {
    try {
      // Verificar sessão do localStorage primeiro (sistema customizado bmr_user)
      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) {
        console.log("⚠️ Nenhuma sessão encontrada, pulando carregamento de tenant");
        setLoading(false);
        return;
      }

      const parsedSession = JSON.parse(storedSession);
      const userId = parsedSession.user?.user_id;

      if (userId) {
        console.log("🔍 Definindo user_id na sessão:", userId);
        
        // CRÍTICO: Definir user_id na sessão ANTES de buscar dados
        try {
          await supabase.rpc('set_session_user_id', {
            p_user_id: userId
          });
          console.log("✅ user_id definido na sessão");
        } catch (rpcError) {
          console.error("❌ Erro ao definir user_id na sessão:", rpcError);
        }
        
        // Buscar clientes do usuário na tabela bmr_user_clients
        console.log("🔍 Buscando clientes para user_id:", userId);
        
        const { data: userClientsData, error: userClientsError } = await supabase
          .from("bmr_user_clients")
          .select("client_id, is_primary")
          .eq("user_id", userId)
          .order("is_primary", { ascending: false });

        console.log("📊 Resultado bmr_user_clients:", { 
          data: userClientsData, 
          error: userClientsError,
          count: userClientsData?.length 
        });

        if (userClientsError) {
          console.error("❌ Erro ao buscar clientes:", userClientsError);
          throw userClientsError;
        }

        // Se não tiver clientes associados, mostrar erro e fazer logout
        if (!userClientsData || userClientsData.length === 0) {
          console.error("❌ Usuário sem clientes associados na tabela bmr_user_clients");
          console.error("ℹ️ Verifique se existe um registro em bmr_user_clients para user_id:", userId);
          
          toast.error("Usuário sem cliente associado. Entre em contato com o administrador.");
          
          setLoading(false);
          
          // Fazer logout após 2 segundos
          setTimeout(() => {
            localStorage.removeItem("bmr_session");
            localStorage.removeItem("current_tenant_id");
            window.location.href = "/auth";
          }, 2000);
          
          return;
        }

        // Pegar o client_id primário ou o primeiro
        const primaryClient = userClientsData.find(uc => uc.is_primary) || userClientsData[0];
        const userClientId = primaryClient.client_id;

        // Carregar lista de tenants (clientes) aos quais o usuário tem acesso
        const clientIds = userClientsData.map(uc => uc.client_id);
        const { data: tenantsData, error } = await supabase
          .from("bmr_client")
          .select("client_id, name, is_demo")
          .in("client_id", clientIds)
          .order("name");

        if (error) throw error;

        // Mapear para o formato esperado
        const mappedTenants = (tenantsData || []).map((client) => ({
          id: client.client_id,
          name: client.name,
          slug: client.name.toLowerCase().replace(/\s+/g, '-'),
          is_active: true,
        }));

        setTenants(mappedTenants);

        // Definir tenant atual baseado no client_id primário
        const userTenant = mappedTenants.find((t) => t.id === userClientId);
        if (userTenant) {
          // Definir client_id na sessão (user_id já foi definido antes)
          await supabase.rpc('set_session_client_id', {
            p_client_id: userTenant.id
          });
          
          setCurrentTenant(userTenant);
          localStorage.setItem("current_tenant_id", userTenant.id);
          console.log("✅ [TenantContext] Tenant carregado:", { 
            tenantId: userTenant.id, 
            tenantName: userTenant.name,
            userId 
          });
        } else if (mappedTenants && mappedTenants.length > 0) {
          // Fallback para primeiro tenant se não encontrar
          const defaultTenant = mappedTenants[0];
          
          // Definir variáveis de sessão para RLS
          await supabase.rpc('set_session_user_id', {
            p_user_id: userId
          });
          await supabase.rpc('set_session_client_id', {
            p_client_id: defaultTenant.id
          });
          
          setCurrentTenant(defaultTenant);
          localStorage.setItem("current_tenant_id", defaultTenant.id);
          console.log("✅ [TenantContext] Tenant padrão carregado:", { 
            tenantId: defaultTenant.id, 
            tenantName: defaultTenant.name,
            userId 
          });
        }
      }
    } catch (error) {
      console.error("❌ [TenantContext] Erro ao carregar tenant:", error);
      // Limpar tenant inválido
      setCurrentTenant(null);
      localStorage.removeItem("current_tenant_id");
    } finally {
      setLoading(false);
    }
  };

  const handleSetCurrentTenant = async (tenant: Tenant) => {
    console.log("🔄 Trocando para tenant:", tenant.name, tenant.id);
    
    // Obter user_id da sessão
    const storedSession = localStorage.getItem("bmr_session");
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      const userId = parsedSession.user?.user_id;
      
      if (userId) {
        // Definir variáveis de sessão para RLS
        await supabase.rpc('set_session_user_id', {
          p_user_id: userId
        });
        await supabase.rpc('set_session_client_id', {
          p_client_id: tenant.id
        });
      }
    }
    
    setCurrentTenant(tenant);
    localStorage.setItem("current_tenant_id", tenant.id);
    
    // Limpar cache do tenant helper
    const { clearTenantCache } = await import("@/lib/tenant-helper");
    clearTenantCache();
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant: handleSetCurrentTenant,
        tenants,
        loading,
        currentTenantId: currentTenant?.id || null,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

// Hook helper para pegar apenas o tenant_id
export function useTenantId(): string | null {
  const { currentTenantId } = useTenant();
  return currentTenantId;
}
