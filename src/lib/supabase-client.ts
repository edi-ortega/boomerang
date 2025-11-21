import { supabase } from "@/integrations/supabase/client";

/**
 * Wrapper do cliente Supabase que automaticamente define o user_id na sessão
 * antes de cada requisição para que as políticas RLS funcionem corretamente
 */
export const getSupabaseClient = async () => {
  // Recuperar sessão do localStorage
  const storedSession = localStorage.getItem("bmr_session");
  
  if (storedSession) {
    try {
      const parsedSession = JSON.parse(storedSession);
      const userId = parsedSession.user?.user_id;
      const clientId = localStorage.getItem("current_tenant_id");
      
      console.log("🔑 getSupabaseClient - user_id:", userId);
      console.log("🔑 getSupabaseClient - client_id:", clientId);
      
      if (userId) {
        // Definir user_id na sessão do PostgreSQL antes de cada operação
        await supabase.rpc("set_session_user_id", {
          p_user_id: userId,
        });
      }
      
      if (clientId) {
        // Definir client_id diretamente na sessão
        await supabase.rpc("set_session_client_id", {
          p_client_id: clientId,
        });
      }
    } catch (error) {
      console.error("❌ Erro ao configurar sessão:", error);
    }
  } else {
    console.warn("⚠️ Nenhuma sessão BMR encontrada no localStorage");
  }
  
  return supabase;
};

// Helper para operações que precisam de autenticação
export const withAuth = async <T>(
  operation: (client: typeof supabase) => Promise<T>
): Promise<T> => {
  const client = await getSupabaseClient();
  return operation(client);
};
