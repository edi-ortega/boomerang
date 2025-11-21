import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

/**
 * Hook que fornece métodos helpers para queries Supabase com filtro automático de client_id
 * 
 * IMPORTANTE: A validação multi-tenant agora é feita no nível da aplicação, não no RLS.
 * Use os métodos deste hook para garantir que o filtro de client_id seja aplicado automaticamente.
 */
export function useSupabaseQuery() {
  const { currentTenantId } = useTenant();

  // Tabelas que não têm coluna client_id (tabelas globais/compartilhadas)
  const tablesWithoutClientId = [
    'bmr_plan',
    'bmr_system',
    'bmr_user', // user usa bmr_user_clients para multi-tenancy
  ];

  /**
   * Inicia uma query SELECT com filtro automático de client_id
   */
  const select = (table: string, columns = "*") => {
    let query = (supabase as any).from(table).select(columns);
    
    // Adicionar filtro de client_id se aplicável
    if (currentTenantId && !tablesWithoutClientId.includes(table)) {
      query = query.eq('client_id', currentTenantId);
    }
    
    return query;
  };

  /**
   * Inicia uma query INSERT com client_id automático
   */
  const insert = async (table: string, data: any | any[]) => {
    // Adicionar client_id aos dados se aplicável
    if (currentTenantId && !tablesWithoutClientId.includes(table)) {
      if (Array.isArray(data)) {
        data = data.map(item => ({ ...item, client_id: currentTenantId }));
      } else {
        data = { ...data, client_id: currentTenantId };
      }
    }
    
    return (supabase as any).from(table).insert(data);
  };

  /**
   * Inicia uma query UPDATE com filtro automático de client_id
   * IMPORTANTE: Você ainda precisa adicionar .eq() para especificar qual registro atualizar
   */
  const update = (table: string, data: any) => {
    let query = (supabase as any).from(table).update(data);
    
    // Adicionar filtro de client_id se aplicável
    if (currentTenantId && !tablesWithoutClientId.includes(table)) {
      query = query.eq('client_id', currentTenantId);
    }
    
    return query;
  };

  /**
   * Inicia uma query DELETE com filtro automático de client_id
   * IMPORTANTE: Você ainda precisa adicionar .eq() para especificar qual registro deletar
   */
  const deleteFrom = (table: string) => {
    let query = (supabase as any).from(table).delete();
    
    // Adicionar filtro de client_id se aplicável
    if (currentTenantId && !tablesWithoutClientId.includes(table)) {
      query = query.eq('client_id', currentTenantId);
    }
    
    return query;
  };

  /**
   * Acesso direto ao cliente Supabase (use apenas quando necessário)
   */
  const from = (table: string) => {
    return (supabase as any).from(table);
  };

  return {
    select,
    insert,
    update,
    delete: deleteFrom,
    from, // Para casos especiais
    supabase, // Acesso direto ao supabase
    currentTenantId,
  };
}
