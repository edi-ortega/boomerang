// Tenant Helper Functions
// Functions to help with multi-tenant data filtering and management

import { supabase } from "@/integrations/supabase/client";

let cachedClientId: string | null = null;

export const getCurrentTenantId = async (): Promise<string> => {
  if (cachedClientId) return cachedClientId;
  
  // Get BMR session from localStorage
  const storedSession = localStorage.getItem("bmr_session");
  if (!storedSession) throw new Error("Not authenticated");
  
  const parsedSession = JSON.parse(storedSession);
  const clientId = parsedSession.user?.client_id;
  
  if (!clientId) {
    throw new Error("User has no tenant assigned");
  }
  
  cachedClientId = clientId;
  return clientId;
};

export const addTenantFilter = async () => {
  const clientId = await getCurrentTenantId();
  return { client_id: clientId };
};

export const addTenantData = async (data: any) => {
  const clientId = await getCurrentTenantId();
  return { ...data, client_id: clientId };
};

export const clearTenantCache = () => {
  cachedClientId = null;
};

// Exportar como default também para compatibilidade
export default {
  getCurrentTenantId,
  addTenantFilter,
  addTenantData,
  clearTenantCache
};
