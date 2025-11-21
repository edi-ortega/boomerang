import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export function useAlertCount() {
  const { currentTenant } = useTenant();

  return useQuery({
    queryKey: ["alert-count", currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant) return 0;

      // TODO: Implementar consulta quando a tabela de alertas for criada
      // const { count } = await supabase
      //   .from("alerts")
      //   .select("*", { count: "exact", head: true })
      //   .eq("tenant_id", currentTenant.id);
      
      return 0;
    },
    enabled: !!currentTenant,
  });
}
