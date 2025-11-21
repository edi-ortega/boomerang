import { useTenant } from "@/contexts/TenantContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function TenantSwitcher() {
  const { currentTenant, setCurrentTenant, tenants, loading } = useTenant();
  const queryClient = useQueryClient();

  if (loading || tenants.length === 0) {
    return null;
  }

  const handleTenantChange = async (value: string) => {
    const tenant = tenants.find((t) => t.id === value);
    if (tenant) {
      console.log('🏢 TenantSwitcher: Mudando para', tenant.name);
      await setCurrentTenant(tenant);
      
      // Esperar um pouco para garantir que a atualização do banco foi feita
      setTimeout(() => {
        console.log('♻️ Invalidando todas as queries...');
        // Invalidar todas as queries para recarregar com o novo tenant
        queryClient.invalidateQueries();
        toast.success(`Alterado para: ${tenant.name}`);
      }, 500);
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
        <Building2 className="h-4 w-4 text-primary" />
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-primary/20">
          <Check className="h-3 w-3 mr-0.5" />
          Ativa
        </Badge>
        <Select
          value={currentTenant?.id}
          onValueChange={handleTenantChange}
        >
          <SelectTrigger className="h-8 w-[200px] border-primary/30 bg-background/50 hover:bg-background hover:border-primary/50 transition-colors font-semibold">
            <SelectValue placeholder="Selecione empresa" />
          </SelectTrigger>
          <SelectContent className="z-50">
            {tenants.map((tenant) => (
              <SelectItem 
                key={tenant.id} 
                value={tenant.id}
                className="font-medium"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  {tenant.name}
                  {tenant.id === currentTenant?.id && (
                    <Check className="h-4 w-4 ml-auto text-primary" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
