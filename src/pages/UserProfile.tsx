import { useState, useEffect } from "react";
import { bmr } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Lock, Upload, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido"),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function UserProfile() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    avatar_url: "",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    console.log("🔍 UserProfile montado");
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const user = await bmr.auth.me();
      console.log("👤 User loaded:", user);
      setCurrentUser(user);
      setFormData({
        name: user.name || "",
        email: user.email || "",
        avatar_url: user.avatar_url || "",
      });
      console.log("📋 Form data set:", {
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      });
    } catch (error) {
      console.error("Error loading user profile:", error);
      toast.error("Erro ao carregar perfil do usuário");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("📸 Starting avatar upload, file:", file.name);

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB");
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas");
      e.target.value = "";
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentUser.user_id}/${Date.now()}.${fileExt}`;

      console.log("📤 Uploading to user-avatars:", fileName);

      const { error: uploadError } = await supabase.storage
        .from("user-avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("❌ Upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("user-avatars")
        .getPublicUrl(fileName);

      console.log("✅ Avatar uploaded, URL:", publicUrl);

      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Avatar enviado com sucesso! Clique em Salvar para confirmar.");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao enviar avatar");
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSaveProfile = async () => {
    setErrors({});

    console.log("💾 Saving profile with data:", formData);

    // Validar dados do perfil
    try {
      profileSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error("Corrija os erros no formulário");
        return;
      }
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        name: formData.name,
      };
      
      // Só incluir avatar_url se não estiver vazio
      if (formData.avatar_url && formData.avatar_url.trim() !== "") {
        updateData.avatar_url = formData.avatar_url;
      }
      
      console.log("📡 Sending update:", updateData);
      
      const result = await bmr.auth.updateMe(updateData);
      
      console.log("✅ Update successful, result:", result);

      toast.success("Perfil atualizado com sucesso!");
      await loadUserProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setErrors({});

    // Validar senha
    try {
      passwordSchema.parse(passwordData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error("Corrija os erros no formulário de senha");
        return;
      }
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.rpc("update_user_password", {
        p_user_id: currentUser.user_id,
        p_new_password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Erro ao alterar senha");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>

        {/* Avatar e Informações Básicas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Foto de Perfil</CardTitle>
              <CardDescription>
                Adicione ou altere sua foto de perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={formData.avatar_url} alt={formData.name} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(formData.name || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                    className="hidden"
                  />
                  <Label htmlFor="avatar-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploadingAvatar}
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                      className="cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploadingAvatar ? "Enviando..." : "Escolher Arquivo"}
                    </Button>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG ou GIF. Máximo 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Informações do Perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações básicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Digite seu nome"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-sm text-muted-foreground">
                  O e-mail não pode ser alterado
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alterar Senha */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Alterar Senha</CardTitle>
              <CardDescription>
                Defina uma nova senha para sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    placeholder="Digite a nova senha"
                    className={errors.newPassword ? "border-destructive pr-10" : "pr-10"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirmar Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    placeholder="Digite a senha novamente"
                    className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleChangePassword} disabled={isSaving} variant="default">
                  <Lock className="w-4 h-4 mr-2" />
                  {isSaving ? "Alterando..." : "Alterar Senha"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
