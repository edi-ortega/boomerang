import React, { useState, useEffect } from "react";
import { bmr as base44 } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Bell,
  Settings as SettingsIcon,
  CheckCircle,
  Users,
  Palette,
  Upload,
  Trash2,
  Sun,
  Moon,
  Target,
  Save,
  Sparkles,
  Database,
  Calendar,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import UserTypeManagementSection from "@/components/settings/UserTypeManagementSection";
import WorkCalendarManagementSection from "@/components/settings/WorkCalendarManagementSection";
import CalendarManagementSection from "@/components/settings/CalendarManagementSection";
import DataImportSection from "@/components/settings/DataImportSection";
import PermissionsManagementSection from "@/components/settings/PermissionsManagementSection";
import TenantSelectorSection from "@/components/settings/TenantSelectorSection";
import ThemeSelectorSection from "@/components/settings/ThemeSelectorSection";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/hooks/use-confirm";

interface Setting {
  key: string;
  value: string;
  type: string;
  category: string;
  description: string;
  label: string;
  icon: any;
}

interface ComplexityValue {
  value: string;
  label: string;
}

interface ComplexityType {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultValues: ComplexityValue[];
}

interface SystemSetting {
  id?: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  description: string;
  category: string;
}

interface CustomComplexitySetting {
  id: string;
  complexity_type_id: string;
  setting_value: string;
}

export default function Settings() {
  const { confirm, ConfirmDialog } = useConfirm();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("general");
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoCompleteParent, setAutoCompleteParent] = useState(true);
  const [aiGenerateStoryPoints, setAiGenerateStoryPoints] = useState(true);

  const [settings, setSettings] = useState<Record<string, SystemSetting>>({});
  const [logoUrl, setLogoUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentTheme, setCurrentTheme] = useState("dark");

  const defaultSettings: Setting[] = [
    {
      key: "app_name",
      value: "Orchestra Project Management",
      type: "string",
      category: "branding",
      description: "Nome do aplicativo",
      label: "Nome do Aplicativo",
      icon: SettingsIcon,
    },
    {
      key: "logo_url",
      value: "",
      type: "string",
      category: "branding",
      description: "URL do logotipo do sistema",
      label: "URL do Logotipo",
      icon: Palette,
    },
    {
      key: "ai_generate_story_points",
      value: "true",
      type: "boolean",
      category: "sprint",
      description: "IA deve gerar estimativas de story points ao criar hierarquia",
      label: "IA Gera Story Points na Hierarquia",
      icon: Sparkles,
    },
    {
      key: "theme",
      value: "dark",
      type: "string",
      category: "appearance",
      description: "Tema visual do sistema",
      label: "Tema do Sistema",
      icon: Palette,
    },
    {
      key: "auto_complete_parent_items",
      value: "true",
      type: "boolean",
      category: "sprint",
      description: "Completar automaticamente itens pai quando todos os filhos forem concluídos",
      label: "Auto-conclusão de Itens Pai",
      icon: CheckCircle,
    },
    {
      key: "email_enabled",
      value: "true",
      type: "boolean",
      category: "email",
      description: "Ativar envio de e-mails do sistema",
      label: "Envio de E-mails",
      icon: Mail,
    },
    {
      key: "email_on_task_assigned",
      value: "true",
      type: "boolean",
      category: "email",
      description: "Enviar e-mail quando tarefa é atribuída",
      label: "E-mail em Atribuição de Tarefa",
      icon: Mail,
    },
    {
      key: "email_on_task_status_change",
      value: "true",
      type: "boolean",
      category: "email",
      description: "Enviar e-mail quando status da tarefa muda",
      label: "E-mail em Mudança de Status",
      icon: Mail,
    },
    {
      key: "email_on_task_comment",
      value: "true",
      type: "boolean",
      category: "email",
      description: "Enviar e-mail quando há comentário em tarefa",
      label: "E-mail em Comentários",
      icon: Mail,
    },
    {
      key: "email_on_mention",
      value: "true",
      type: "boolean",
      category: "email",
      description: "Enviar e-mail quando usuário é mencionado",
      label: "E-mail em Menções",
      icon: Mail,
    },
    {
      key: "email_on_sprint_start",
      value: "true",
      type: "boolean",
      category: "email",
      description: "Enviar e-mail quando sprint inicia",
      label: "E-mail ao Iniciar Sprint",
      icon: Mail,
    },
    {
      key: "email_on_sprint_end",
      value: "true",
      type: "boolean",
      category: "email",
      description: "Enviar e-mail quando sprint termina",
      label: "E-mail ao Finalizar Sprint",
      icon: Mail,
    },
    {
      key: "email_on_deadline_approaching",
      value: "true",
      type: "boolean",
      category: "email",
      description: "Enviar e-mail quando prazo está próximo (2 dias)",
      label: "E-mail de Lembrete de Prazo",
      icon: Mail,
    },
    {
      key: "notification_sound",
      value: "true",
      type: "boolean",
      category: "notifications",
      description: "Reproduzir som em notificações",
      label: "Som de Notificação",
      icon: Bell,
    },
  ];

  const complexityTypes: ComplexityType[] = [
    {
      id: "fibonacci",
      name: "Fibonacci",
      description: "Escala padrão de Fibonacci (1, 2, 3, 5, 8, 13, 21).",
      icon: "🔢",
      defaultValues: [
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "5", label: "5" },
        { value: "8", label: "8" },
        { value: "13", label: "13" },
        { value: "21", label: "21" },
        { value: "?", label: "?" },
        { value: "∞", label: "∞" },
      ],
    },
    {
      id: "tshirt",
      name: "T-Shirt Sizing",
      description: "Escala baseada em tamanhos de camisetas (XS, S, M, L, XL).",
      icon: "👕",
      defaultValues: [
        { value: "XS", label: "Extra Small" },
        { value: "S", label: "Small" },
        { value: "M", label: "Medium" },
        { value: "L", label: "Large" },
        { value: "XL", label: "Extra Large" },
        { value: "XXL", label: "Extra Extra Large" },
        { value: "?", label: "?" },
      ],
    },
    {
      id: "power_of_2",
      name: "Potências de 2",
      description: "Escala exponencial baseada em potências de 2 (1, 2, 4, 8, 16, 32).",
      icon: "⚡",
      defaultValues: [
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "4", label: "4" },
        { value: "8", label: "8" },
        { value: "16", label: "16" },
        { value: "32", label: "32" },
        { value: "?", label: "?" },
        { value: "∞", label: "∞" },
      ],
    },
    {
      id: "linear",
      name: "Linear/Sequência",
      description: "Escala linear simples de 1 a 10.",
      icon: "📈",
      defaultValues: [
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
        { value: "5", label: "5" },
        { value: "6", label: "6" },
        { value: "7", label: "7" },
        { value: "8", label: "8" },
        { value: "9", label: "9" },
        { value: "10", label: "10" },
        { value: "?", label: "?" },
      ],
    },
    {
      id: "custom",
      name: "Personalizado",
      description: "Defina seus próprios valores de complexidade.",
      icon: "✏️",
      defaultValues: [
        { value: "1", label: "Muito Simples" },
        { value: "2", label: "Simples" },
        { value: "3", label: "Médio" },
        { value: "4", label: "Complexo" },
        { value: "5", label: "Muito Complexo" },
        { value: "?", label: "?" },
      ],
    },
  ];

  useEffect(() => {
    loadSettings();
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error checking access:", error);
    }
  };

  const getCustomComplexityValues = (typeId: string): ComplexityValue[] => {
    return complexityTypes.find((t) => t.id === typeId)?.defaultValues || [];
  };

  const handleToggle = async (key: string, checkedOverride?: boolean) => {
    const newValue = checkedOverride !== undefined ? checkedOverride : !isSettingEnabled(key);
    const defaultSetting = defaultSettings.find((s) => s.key === key);

    if (key === "email_enabled") {
      setEmailNotifications(newValue);
    } else if (key === "auto_complete_parent_items") {
      setAutoCompleteParent(newValue);
    } else if (key === "ai_generate_story_points") {
      setAiGenerateStoryPoints(newValue);
    } else if (key === "theme") {
      setCurrentTheme(newValue ? "dark" : "light");
    }

    if (defaultSetting) {
      await updateOrCreateSetting(
        key,
        newValue ? "true" : "false",
        defaultSetting.type,
        defaultSetting.description,
        defaultSetting.category,
      );
    }
  };

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const allSettings = await base44.entities.SystemSettings.list();
      const settingsMap: Record<string, SystemSetting> = {};

      allSettings.forEach((setting: any) => {
        settingsMap[setting.setting_key] = setting;
      });

      setSettings(settingsMap);

      setEmailNotifications(settingsMap["email_enabled"]?.setting_value !== "false");
      setAutoCompleteParent(settingsMap["auto_complete_parent_items"]?.setting_value !== "false");
      setAiGenerateStoryPoints(settingsMap["ai_generate_story_points"]?.setting_value !== "false");
      setLogoUrl(settingsMap["logo_url"]?.setting_value || "");
      setCurrentTheme(settingsMap["theme"]?.setting_value || "dark");

      // Complexity settings placeholder - to be implemented
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações do sistema.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const updateOrCreateSetting = async (
    key: string,
    value: string,
    type: string,
    description: string,
    category: string,
  ) => {
    const existingSettings = await base44.entities.SystemSettings.filter({ setting_key: key });
    if (existingSettings && existingSettings.length > 0) {
      await base44.entities.SystemSettings.update(existingSettings[0].id, {
        setting_value: String(value),
      });
    } else {
      await base44.entities.SystemSettings.create({
        setting_key: key,
        setting_value: String(value),
        setting_type: type,
        description: description,
        category: category,
      });
    }
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        setting_key: key,
        setting_value: String(value),
        setting_type: type,
        description: description,
        category: category,
      },
    }));
  };

  const handleSaveGeneralSettings = async () => {
    setIsSaving(true);
    try {
      toast({
        title: "Configurações salvas!",
        description: "As configurações gerais foram salvas com sucesso.",
      });

      await loadSettings();
    } catch (error) {
      console.error("Error saving general settings:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações gerais.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      // Logo upload placeholder - implement file upload logic
      const file_url = URL.createObjectURL(file);

      await handleSaveLogoSetting(file_url);
      setLogoUrl(file_url);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast({
        title: "Logotipo enviado!",
        description: "O logotipo foi atualizado com sucesso.",
      });

      if (window.location.reload) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar o logotipo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveLogoSetting = async (url: string) => {
    const defaultLogoSetting = defaultSettings.find((s) => s.key === "logo_url");
    if (defaultLogoSetting) {
      await updateOrCreateSetting(
        "logo_url",
        url,
        defaultLogoSetting.type,
        defaultLogoSetting.description,
        defaultLogoSetting.category,
      );
    }
  };

  const removeLogo = async () => {
    const confirmed = await confirm({
      title: "Remover Logotipo",
      description: "Tem certeza que deseja remover o logotipo do sistema?",
    });

    if (!confirmed) return;

    try {
      await handleSaveLogoSetting("");
      setLogoUrl("");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      toast({
        title: "Logotipo removido",
        description: "O logotipo foi removido com sucesso.",
      });

      if (window.location.reload) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error removing logo:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o logotipo.",
        variant: "destructive",
      });
    }
  };

  const getSettingValue = (key: string): string => {
    if (key === "logo_url") return logoUrl;
    if (key === "email_enabled") return emailNotifications ? "true" : "false";
    if (key === "auto_complete_parent_items") return autoCompleteParent ? "true" : "false";
    if (key === "ai_generate_story_points") return aiGenerateStoryPoints ? "true" : "false";

    return settings[key]?.setting_value || defaultSettings.find((s) => s.key === key)?.value || "";
  };

  const isSettingEnabled = (key: string): boolean => {
    if (key === "email_enabled") return emailNotifications;
    if (key === "auto_complete_parent_items") return autoCompleteParent;
    if (key === "ai_generate_story_points") return aiGenerateStoryPoints;

    return getSettingValue(key) === "true";
  };

  const groupedSettings = {
    email: defaultSettings.filter((s) => s.category === "email" && s.key !== "email_enabled"),
    notifications: defaultSettings.filter((s) => s.category === "notifications"),
  };

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-foreground text-lg">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="border-border hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4 mr-2 text-foreground" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Configurações do Sistema</h1>
              <p className="text-muted-foreground">Gerencie as configurações da plataforma de gestão de projetos</p>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-card border border-border">
            <TabsTrigger value="general">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="sprint">
              <Target className="w-4 h-4 mr-2" />
              Sprint
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Shield className="w-4 h-4 mr-2" />
              Permissionamento
            </TabsTrigger>
            <TabsTrigger value="system">
              <Database className="w-4 h-4 mr-2" />
              Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="glass-effect border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Palette className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-foreground">Identidade Visual</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">Logotipo do Sistema</label>

                  {logoUrl ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={logoUrl}
                        alt="Logo atual"
                        className="h-16 w-auto object-contain bg-muted rounded-lg p-2"
                      />
                      <div className="flex gap-2">
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          <div className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Alterar Logo
                          </div>
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            disabled={isUploadingLogo}
                          />
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removeLogo}
                          className="border-red-500 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors">
                        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-foreground font-medium mb-1">Clique para fazer upload</p>
                        <p className="text-sm text-muted-foreground">PNG, JPG ou SVG (máx. 2MB)</p>
                      </div>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={isUploadingLogo}
                      />
                    </label>
                  )}

                  {isUploadingLogo && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground">Enviando...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                  <div className="flex-1">
                    <p className="font-medium text-foreground mb-1">Auto-conclusão de Itens Pai</p>
                    <p className="text-sm text-muted-foreground">
                      Completar automaticamente itens pai quando todos os filhos forem concluídos
                    </p>
                  </div>
                  <Switch
                    checked={autoCompleteParent}
                    onCheckedChange={(checked) => handleToggle("auto_complete_parent_items", checked)}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveGeneralSettings}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/80"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Seção de Seleção de Empresa */}
            <Card className="glass-effect border-border mt-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">Empresa</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Selecione a empresa que deseja visualizar</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TenantSelectorSection />
              </CardContent>
            </Card>

            {/* Seção de Seleção de Tema */}
            <Card className="glass-effect border-border mt-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Palette className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">Aparência</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Personalize o tema de cores do sistema</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ThemeSelectorSection />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sprint">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <Card className="glass-effect border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-foreground">Configurações de Sprint</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Escalas de Complexidade
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Customize os valores de cada escala. Essas escalas estarão disponíveis para todos os projetos.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {complexityTypes.map((type) => {
                        const customValues = getCustomComplexityValues(type.id);

                        return (
                          <div
                            key={type.id}
                            className="p-4 rounded-xl border-2 transition-all bg-accent/30 border-border hover:border-primary/50 relative"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{type.icon}</span>
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1 text-foreground">{type.name}</h4>
                                <p className="text-sm text-muted-foreground">{type.description}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Valores: {customValues.map((v) => v.value || v).join(", ")}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <div className="flex-1">
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        IA Gera Story Points na Hierarquia
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Quando ativado, a IA irá gerar estimativas de story points automaticamente ao criar histórias na
                        hierarquia
                      </p>
                    </div>
                    <Switch
                      checked={aiGenerateStoryPoints}
                      onCheckedChange={(checked) => handleToggle("ai_generate_story_points", checked)}
                    />
                  </div>

                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">📊 Como Funciona</p>
                        <p className="text-sm text-muted-foreground">
                          Cada projeto pode escolher qual escala usar (Fibonacci, T-Shirt, etc). Os valores customizados
                          que você definir aqui serão aplicados em todos os projetos que usarem aquela escala.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <Card className="glass-effect border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-foreground">Notificações por E-mail</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Configure quando o sistema deve enviar notificações por e-mail aos membros da equipe
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">Ativar Notificações por E-mail</p>
                      <p className="text-sm text-muted-foreground">
                        Controle principal para habilitar/desabilitar TODOS os e-mails do sistema
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={(checked) => handleToggle("email_enabled", checked)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  {groupedSettings.email.map((setting) => {
                    const SettingIcon = setting.icon;

                    return (
                      <div
                        key={setting.key}
                        className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-all"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <SettingIcon className="w-5 h-5 text-muted-foreground" />
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">{setting.label}</h4>
                            <p className="text-sm text-muted-foreground">{setting.description}</p>
                          </div>
                        </div>

                        <div className="ml-4">
                          <Switch
                            checked={isSettingEnabled(setting.key)}
                            onCheckedChange={() => handleToggle(setting.key)}
                            className="data-[state=checked]:bg-primary"
                            disabled={!emailNotifications}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="glass-effect border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-foreground">Outras Notificações</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupedSettings.notifications.map((setting) => {
                    const SettingIcon = setting.icon;

                    return (
                      <div
                        key={setting.key}
                        className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-all"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <SettingIcon className="w-5 h-5 text-muted-foreground" />
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">{setting.label}</h4>
                            <p className="text-sm text-muted-foreground">{setting.description}</p>
                          </div>
                        </div>

                        <div className="ml-4">
                          <Switch
                            checked={isSettingEnabled(setting.key)}
                            onCheckedChange={() => handleToggle(setting.key)}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="permissions">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <PermissionsManagementSection />
            </motion.div>
          </TabsContent>

          <TabsContent value="system">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="space-y-6"
            >
              <WorkCalendarManagementSection />
              <CalendarManagementSection />
              <DataImportSection />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
