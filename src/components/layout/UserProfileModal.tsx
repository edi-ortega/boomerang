import { useState, useEffect } from "react";
import { bmr } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, Save, User, Mail, Phone, Building2, Upload, Palette, Briefcase, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { useConfirm } from "@/hooks/use-confirm";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onUpdate?: () => Promise<void>;
}

export default function UserProfileModal({ isOpen, onClose, currentUser, onUpdate }: UserProfileModalProps) {
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    department: "",
    team_role: "",
    avatar_url: "",
    avatar_color: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const predefinedColors = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", 
    "#10b981", "#06b6d4", "#6366f1", "#84cc16",
    "#f97316", "#14b8a6", "#a855f7", "#ef4444"
  ];

  const commonTeamRoles = [
    "Product Owner",
    "Scrum Master",
    "Desenvolvedor",
    "Tech Lead",
    "Designer",
    "QA/Tester",
    "DevOps",
    "Analista",
    "Arquiteto",
    "Stakeholder"
  ];

  useEffect(() => {
    if (currentUser) {
      setFormData({
        full_name: currentUser.full_name || "",
        phone: currentUser.phone || "",
        department: currentUser.department || "",
        team_role: currentUser.team_role || "",
        avatar_url: currentUser.avatar_url || "",
        avatar_color: currentUser.avatar_color || predefinedColors[0]
      });
    }
  }, [currentUser]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O avatar deve ter no máximo 5MB.",
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await bmr.integrations.Core.UploadFile({ file });
      
      setFormData(prev => ({
        ...prev,
        avatar_url: result.file_url
      }));

      toast({
        title: "Avatar enviado!",
        description: "Seu avatar foi atualizado com sucesso."
      });
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Erro ao enviar avatar",
        description: "Não foi possível fazer upload do avatar.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await bmr.auth.updateMe(formData);

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });

      if (onUpdate) {
        await onUpdate();
      }

      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar suas informações.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: "Sair do Sistema",
      description: "Deseja realmente sair do sistema?",
    });
    
    if (!confirmed) return;
    
    try {
      await bmr.auth.logout();
      window.location.reload();
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Erro ao sair",
        description: "Não foi possível sair da conta.",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  const initial = ((formData.full_name || currentUser?.email || 'U').charAt(0)).toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-2 border-border bg-card">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground text-2xl">Meu Perfil</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-accent/30">
              <div className="relative">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-border"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-primary-foreground border-4 border-border"
                    style={{ backgroundColor: formData.avatar_color }}
                  >
                    {initial}
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors shadow-lg"
                >
                  {isUploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 text-primary-foreground" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
              </div>

              {!formData.avatar_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2 text-center">Cor do Avatar</p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormData(prev => ({ ...prev, avatar_color: color }))}
                        className={`w-8 h-8 rounded-full transition-all ${
                          formData.avatar_color === color
                            ? 'ring-4 ring-primary scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">{formData.full_name || currentUser?.email}</h3>
                <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <User className="w-4 h-4" />
                  Nome Completo
                </label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Seu nome completo"
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="bg-background border-border text-foreground"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Building2 className="w-4 h-4" />
                    Departamento
                  </label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Seu departamento"
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Briefcase className="w-4 h-4" />
                  Papel na Equipe
                </label>
                <select
                  value={formData.team_role}
                  onChange={(e) => setFormData({ ...formData, team_role: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  <option value="">Selecione um papel</option>
                  {commonTeamRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-border hover:bg-accent"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-primary hover:bg-primary/80"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar Perfil"}
              </Button>
            </div>

            {/* Logout Button */}
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair do Sistema
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
