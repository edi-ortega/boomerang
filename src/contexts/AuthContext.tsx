import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Session, User } from "@supabase/supabase-js";

// ID fixo do sistema IT Manager
const SYSTEM_ID = "9be384e5-7e97-43e0-82a2-dd1fb4756abb";

interface BmrUser {
  user_id: string;
  email: string;
  name: string;
  is_active: boolean;
  is_super_admin?: boolean;
}

interface AuthContextType {
  user: BmrUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BmrUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedSession = localStorage.getItem("bmr_session");
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        setUser(parsedSession.user);
        setSession(parsedSession.session);
        
        // O client_id agora vem de bmr_user_clients via TenantContext
        
        // Restaurar user_id na sessão do PostgreSQL
        supabase.rpc("set_session_user_id", {
          p_user_id: parsedSession.user.user_id,
        });
      } catch (error) {
        console.error("Erro ao recuperar sessão:", error);
        localStorage.removeItem("bmr_session");
        localStorage.removeItem("current_tenant_id");
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    // Cadastro não disponível - apenas administrador pode criar usuários
    const error = { message: "Cadastro não disponível. Entre em contato com o administrador." };
    toast.error(error.message);
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Validar credenciais na tabela bmr_user
      const { data: bmrUsers, error: rpcError } = await supabase.rpc("authenticate_user", {
        p_email: email,
        p_password: password,
      });

      if (rpcError) {
        toast.error("Erro ao autenticar: " + rpcError.message);
        return { error: rpcError };
      }

      if (!bmrUsers || (Array.isArray(bmrUsers) && bmrUsers.length === 0)) {
        const authError = { message: "Usuário ou senha incorretos" };
        toast.error(authError.message);
        return { error: authError };
      }

      const bmrUser: BmrUser = Array.isArray(bmrUsers) ? bmrUsers[0] : bmrUsers;

      // Definir user_id na sessão do PostgreSQL ANTES de verificar acesso (para RLS funcionar)
      const { error: sessionError } = await supabase.rpc("set_session_user_id", {
        p_user_id: bmrUser.user_id,
      });

      if (sessionError) {
        toast.error("Erro ao criar sessão: " + sessionError.message);
        return { error: sessionError };
      }

      // Verificar se o usuário tem acesso ao sistema IT Manager
      const { data: systemAccess, error: accessError } = await supabase
        .from("bmr_user_system_access")
        .select("*")
        .eq("user_id", bmrUser.user_id)
        .eq("system_id", SYSTEM_ID)
        .maybeSingle();

      if (accessError) {
        console.error("Erro ao verificar acesso:", accessError);
        const authError = { message: "Erro ao verificar acesso ao sistema" };
        toast.error(authError.message);
        return { error: authError };
      }

      if (!systemAccess) {
        const authError = { 
          message: `Usuário sem acesso ao sistema IT Manager. Entre em contato com o administrador para liberar o acesso.` 
        };
        toast.error(authError.message);
        return { error: authError };
      }

      // O TenantContext será responsável por verificar e carregar os clientes do usuário
      console.log("✅ Acesso ao sistema validado:", systemAccess.profile);

      setUser(bmrUser);
      
      // Criar sessão mock para compatibilidade
      const mockSession: Session = {
        access_token: btoa(JSON.stringify(bmrUser)),
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        refresh_token: "",
        user: {
          id: bmrUser.user_id,
          email: bmrUser.email,
          aud: "authenticated",
          role: "authenticated",
          app_metadata: {},
          user_metadata: { name: bmrUser.name },
          created_at: new Date().toISOString(),
        },
      } as Session;

      setSession(mockSession);
      localStorage.setItem("bmr_session", JSON.stringify({ 
        user: bmrUser, 
        session: mockSession,
        system_id: SYSTEM_ID 
      }));

      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");

      return { error: null };
    } catch (error: any) {
      toast.error("Erro ao fazer login: " + error.message);
      return { error };
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem("bmr_session");
    localStorage.removeItem("current_tenant_id");
    
    // Limpar cache de tenant
    const { clearTenantCache } = await import("@/lib/tenant-helper");
    clearTenantCache();
    
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
