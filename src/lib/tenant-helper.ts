/**
 * TenantHelper - Gerenciamento de Multi-Tenancy
 * Adaptado para Supabase com tabelas prj_*
 */

import { supabase } from "@/integrations/supabase/client";
import { SYSTEM_CONFIG } from "@/config/system";

let cachedClientId: string | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 600000; // 10 minutos

/**
 * Retorna o client_id atual do usuário logado
 */
export const getCurrentTenantId = async (): Promise<string> => {
  try {
    const now = Date.now();

    // Check cache
    if (cachedClientId && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log("🏢 getCurrentTenantId (cached):", cachedClientId);
      return cachedClientId;
    }

    // Get BMR session from localStorage (sistema customizado)
    const storedSession = localStorage.getItem("bmr_session");
    console.log("🏢 bmr_session encontrado:", !!storedSession);
    
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      const clientId = parsedSession.user?.client_id;
      
      console.log("🏢 client_id do usuário:", clientId);
      
      if (clientId) {
        cachedClientId = clientId;
        cacheTimestamp = Date.now();
        return cachedClientId;
      }
    }

    // Fallback: tentar localStorage direto
    const fallbackClientId = localStorage.getItem("current_tenant_id");
    console.log("🏢 current_tenant_id (fallback):", fallbackClientId);
    
    if (fallbackClientId) {
      cachedClientId = fallbackClientId;
      cacheTimestamp = Date.now();
      return cachedClientId;
    }

    throw new Error("No tenant found. Please login again.");
  } catch (error) {
    console.error('❌ [TenantHelper] Error getting client_id:', error);
    throw error;
  }
};

/**
 * Adiciona client_id aos filtros
 */
export const addTenantFilter = async <T extends Record<string, any>>(filter: T): Promise<T & { client_id: string }> => {
  const clientId = await getCurrentTenantId();
  return { ...filter, client_id: clientId };
};

/**
 * Adiciona client_id aos dados antes de inserir
 */
export const addTenantData = async <T extends Record<string, any>>(data: T): Promise<T & { client_id: string }> => {
  const clientId = await getCurrentTenantId();
  return { ...data, client_id: clientId };
};

/**
 * Limpa cache do tenant
 */
export const clearTenantCache = () => {
  cachedClientId = null;
  cacheTimestamp = null;
};

/**
 * Retrieves the current system_id from configuration
 * Always returns the defined SYSTEM_ID to avoid inconsistencies
 */
export const getCurrentSystemId = (): string => {
  // Always use the system_id from config to ensure consistency
  return SYSTEM_CONFIG.SYSTEM_ID;
};
