import { Outlet } from "react-router-dom";
import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import ContextSidebar from "@/components/layout/ContextSidebar";
import { ContextSidebarProvider, useContextSidebar } from "@/contexts/ContextSidebarContext";

interface LayoutProps {
  children?: React.ReactNode;
  currentPageName?: string;
}

function LayoutContent({ children }: { children?: React.ReactNode }) {
  const [contextSidebarCollapsed, setContextSidebarCollapsed] = useState(false);
  const { contextData } = useContextSidebar();

  return (
    <>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main 
          className="flex-1 transition-all duration-300"
          style={{
            marginRight: contextData.title || contextData.stats.length > 0 || contextData.tips.length > 0
              ? contextSidebarCollapsed ? '64px' : '320px'
              : '0'
          }}
        >
          {children || <Outlet />}
        </main>
      </div>
      <ContextSidebar
        contextData={contextData}
        isCollapsed={contextSidebarCollapsed}
        onToggle={() => setContextSidebarCollapsed(!contextSidebarCollapsed)}
      />
    </>
  );
}

export default function Layout({ children, currentPageName }: LayoutProps) {
  return (
    <ContextSidebarProvider>
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </ContextSidebarProvider>
  );
}
