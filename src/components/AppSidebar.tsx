import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LayoutDashboard, Database, Folder, CheckSquare, Calendar, FolderKanban, Kanban, Clock, BarChart3, Settings, Users, Bell, Info } from "lucide-react";
import NotificationsPanel from "@/components/layout/NotificationsPanel";
import { bmr } from "@/api/boomerangClient";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useAlertCount } from "@/hooks/useAlertCount";
import { useTenant } from "@/contexts/TenantContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase-client";
import { getCurrentSystemId } from "@/lib/tenant-helper";
import { TenantSwitcher } from "@/components/TenantSwitcher";
const menuItems = [{
  title: "Dashboard",
  url: "/dashboard",
  icon: LayoutDashboard
}, {
  title: "Cadastros",
  url: "/generalsettings",
  icon: Database
}, {
  title: "Projetos",
  url: "/projetos",
  icon: Folder
}, {
  title: "Backlog",
  url: "/backlog",
  icon: CheckSquare
}, {
  title: "Sprints",
  url: "/sprints",
  icon: Calendar
}, {
  title: "Boards",
  url: "/boards",
  icon: FolderKanban
}, {
  title: "Quadro Kanban",
  url: "/quadro-kanban",
  icon: Kanban
}, {
  title: "Timesheet",
  url: "/timesheet",
  icon: Clock
}, {
  title: "Métricas de Equipe",
  url: "/team-metrics",
  icon: Users
}, {
  title: "Relatórios",
  url: "/relatorios",
  icon: BarChart3
}, {
  title: "Configurações",
  url: "/configuracoes",
  icon: Settings
}];
export function AppSidebar() {
  const { open, setOpen } = useSidebar();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: alertCount = 0 } = useAlertCount();
  const { currentTenant } = useTenant();
  const navigate = useNavigate();
  const [systemInfo, setSystemInfo] = useState<{ name: string; description: string; logo_url: string | null } | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadSystemInfo = async () => {
      try {
        const systemId = getCurrentSystemId();
        
        console.log("🔍 Loading system info for system_id:", systemId);
        
        const supabase = await getSupabaseClient();
        
        // Buscar informações do sistema diretamente
        const { data: systemData, error: systemError } = await (supabase as any)
          .from('bmr_system')
          .select('name, description, logo_url')
          .eq('system_id', systemId)
          .maybeSingle();
        
        console.log("🖥️ System data:", systemData, "Error:", systemError);
        
        if (systemError) {
          console.error('Error loading system:', systemError);
          return;
        }
        
        if (systemData) {
          setSystemInfo({
            name: systemData.name,
            description: systemData.description || '',
            logo_url: systemData.logo_url
          });
          console.log("✅ System info loaded:", systemData.name);
        }
      } catch (error) {
        console.error('❌ Error loading system info:', error);
      }
    };
    
    loadSystemInfo();
  }, [user]);

  // Load unread notifications count
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!user?.email) return;
      
      try {
        const notifications = await bmr.entities.Notification.filter(
          { user_email: user.email, is_read: false },
          "-created_at"
        );
        setUnreadCount(notifications?.length || 0);
      } catch (error) {
        console.error("Error loading unread notifications:", error);
      }
    };

    loadUnreadCount();
    
    // Reload every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.email]);
  
  const getInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.split(" ");
      return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : names[0].substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };
  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-border">
      <TooltipProvider delayDuration={0}>
        <SidebarHeader className="border-b border-border p-0">
          <div className={cn("flex items-center gap-3 px-3 py-4 relative", !open && "justify-center px-2")}>
              {!open ? <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 flex-shrink-0">
                    {systemInfo?.logo_url ? (
                      <img src={systemInfo.logo_url} alt={systemInfo.name} className="h-8 w-8 object-contain" />
                    ) : (
                      <LayoutDashboard className="h-6 w-6 text-primary" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  <div className="text-sm">
                    <p className="font-semibold">{systemInfo?.name || 'Sistema'}</p>
                    <p className="text-xs text-muted-foreground">{systemInfo?.description || 'Carregando...'}</p>
                  </div>
                </TooltipContent>
              </Tooltip> : <>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 flex-shrink-0">
                  {systemInfo?.logo_url ? (
                    <img src={systemInfo.logo_url} alt={systemInfo.name} className="h-8 w-8 object-contain" />
                  ) : (
                    <LayoutDashboard className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate">{systemInfo?.name || 'Sistema'}</span>
                  <span className="text-xs text-muted-foreground truncate">{systemInfo?.description || 'Carregando...'}</span>
                </div>
              </>}
            <button 
              onClick={() => setOpen(!open)}
              className="absolute -right-4 bottom-0 translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-50"
            >
              {open ? (
                <ChevronLeft className="w-4 h-4 text-primary-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-primary-foreground" />
              )}
            </button>
          </div>
        </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {open && (
          <div className="px-1 mb-4">
            <TenantSwitcher />
          </div>
        )}
        <SidebarMenu>
          {menuItems.map(item => {
            const isAlerts = item.url === "/alerts";
            const showBadge = isAlerts && alertCount > 0;
            return <SidebarMenuItem key={item.title}>
                {!open ? <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end={item.url === "/"} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground transition-colors justify-center px-2 relative")} activeClassName="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30">
                          <item.icon className="h-5 w-5 shrink-0" />
                          {showBadge && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                              {alertCount > 99 ? "99+" : alertCount}
                            </Badge>}
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.title}
                        {showBadge && <Badge variant="destructive" className="h-5 px-1.5">
                            {alertCount}
                          </Badge>}
                      </div>
                    </TooltipContent>
                  </Tooltip> : <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground transition-colors")} activeClassName="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30">
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-medium flex-1">{item.title}</span>
                      {showBadge && <Badge variant="destructive" className="h-5 px-2">
                          {alertCount > 99 ? "99+" : alertCount}
                        </Badge>}
                    </NavLink>
                  </SidebarMenuButton>}
              </SidebarMenuItem>;
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-0">
        {user && (
          <div className="px-2 py-2">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(true)}
                className="absolute top-2 right-2 z-10 p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors"
                title="Notificações"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </button>
              
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {!open ? <Tooltip>
                    <TooltipTrigger asChild>
                      <button className={cn("flex items-center gap-3 px-3 py-4 w-full hover:bg-muted transition-colors justify-center px-2")}>
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                          <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      <div className="text-sm">
                        <p className="font-semibold">{profile?.full_name || "Minha Conta"}</p>
                        {currentTenant && (
                          <p className="text-xs text-muted-foreground font-medium">
                            {currentTenant.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {(profile as any)?.position || user.email}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip> : <button className={cn("flex items-center gap-3 px-3 py-4 w-full hover:bg-muted transition-colors pr-10")}>
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                      <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0 text-left">
                      <span className="text-sm font-medium text-foreground truncate">
                        {profile?.full_name || user.email?.split("@")[0]}
                      </span>
                      {currentTenant && (
                        <span className="text-xs font-medium text-primary truncate">
                          {currentTenant.name}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground truncate">
                        {(profile as any)?.position || user.email}
                      </span>
                    </div>
                    <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>}
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name || "Minha Conta"}
                    </p>
                    {currentTenant && (
                      <p className="text-xs font-medium text-primary leading-none">
                        {currentTenant.name}
                      </p>
                    )}
                    <p className="text-xs leading-none text-muted-foreground">
                      {(profile as any)?.position || user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  console.log("🎯 Navegando para /profile");
                  navigate("/profile");
                }}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        )}
      </SidebarFooter>
      </TooltipProvider>
    </Sidebar>
    
    <NotificationsPanel
      isOpen={notificationsOpen}
      onClose={() => {
        setNotificationsOpen(false);
        // Reload count when closing
        if (user?.email) {
          bmr.entities.Notification.filter(
            { user_email: user.email, is_read: false },
            "-created_at"
          ).then(notifications => {
            setUnreadCount(notifications?.length || 0);
          });
        }
      }}
      currentUser={user}
    />
  </>
  );
}