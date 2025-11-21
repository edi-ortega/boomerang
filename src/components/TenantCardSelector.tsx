import { useTenant } from "@/contexts/TenantContext";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";

export function TenantCardSelector() {
  const { currentTenant, setCurrentTenant, tenants, loading } = useTenant();
  const queryClient = useQueryClient();
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma empresa disponível</p>
        </CardContent>
      </Card>
    );
  }

  const handleTenantChange = async (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (!tenant || tenant.id === currentTenant?.id) return;

    setSwitchingTo(tenantId);
    console.log('🏢 TenantCardSelector: Mudando para', tenant.name);
    
    await setCurrentTenant(tenant);
    
    setTimeout(() => {
      console.log('♻️ Invalidando todas as queries...');
      queryClient.invalidateQueries();
      toast.success(`Alterado para: ${tenant.name}`);
      setSwitchingTo(null);
    }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Selecione a empresa que deseja gerenciar
        </p>
        <Badge variant="secondary" className="text-xs">
          {tenants.length} {tenants.length === 1 ? 'empresa' : 'empresas'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map((tenant, index) => {
          const isActive = tenant.id === currentTenant?.id;
          const isSwitching = switchingTo === tenant.id;

          return (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  isActive
                    ? 'border-primary shadow-glow-primary bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5'
                    : 'hover:border-primary/50'
                } ${isSwitching ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => handleTenantChange(tenant.id)}
              >
                <CardContent className="p-6 space-y-4">
                  {/* Header com ícone */}
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-primary/20 border border-primary/30' 
                        : 'bg-muted'
                    }`}>
                      <Building2 className={`h-6 w-6 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    
                    {isActive && (
                      <Badge 
                        variant="default" 
                        className="bg-primary/90 text-primary-foreground animate-fade-in"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Ativa
                      </Badge>
                    )}
                  </div>

                  {/* Informações da empresa */}
                  <div className="space-y-2 min-h-[60px]">
                    <h3 className={`font-semibold text-lg leading-tight ${
                      isActive ? 'text-primary' : 'text-foreground'
                    }`}>
                      {tenant.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      ID: {tenant.id.substring(0, 8)}...
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {isSwitching ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Alternando...</span>
                      </div>
                    ) : (
                      <>
                        <Badge variant="secondary" className="text-xs">
                          Disponível
                        </Badge>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
