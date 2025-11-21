import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.user_id],
    queryFn: async () => {
      if (!user) return null;

      // Buscar dados completos do usuário incluindo avatar
      const { data, error } = await supabase
        .from("bmr_user")
        .select("user_id, name, email, avatar_url")
        .eq("user_id", user.user_id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return {
          id: user.user_id,
          full_name: user.name,
          avatar_url: null,
          email: user.email,
        } as Profile;
      }

      return {
        id: data.user_id,
        full_name: data.name,
        avatar_url: data.avatar_url,
        email: data.email,
      } as Profile;
    },
    enabled: !!user,
  });
}
