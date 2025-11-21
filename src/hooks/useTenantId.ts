import { useTenant } from "@/contexts/TenantContext";

/**
 * Hook simplificado para obter o tenant_id atual
 * Usa o client_id do usuário logado como tenant_id
 */
export function useTenantId(): string | null {
  const { currentTenantId } = useTenant();
  
  // Fallback para localStorage se o context ainda não carregou
  if (!currentTenantId) {
    return localStorage.getItem("current_tenant_id");
  }
  
  return currentTenantId;
}
