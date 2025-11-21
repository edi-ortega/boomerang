/**
 * ContextSidebarContext - Context para sidebar dinâmica
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarStat {
  label: string;
  value: string | number;
  icon?: ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface SidebarTip {
  icon?: ReactNode;
  text?: string;
}

interface SidebarAction {
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

interface SidebarInfo {
  title?: string;
  description?: string;
  items?: string[];
}

interface ContextData {
  title: string;
  stats: SidebarStat[];
  tips: (SidebarTip | string)[];
  info?: SidebarInfo;
  quickActions?: SidebarAction[];
  actions?: SidebarAction[];
}

interface ContextSidebarContextType {
  contextData: ContextData;
  updateContext: (data: Partial<ContextData>) => void;
  clearContext: () => void;
}

const ContextSidebarContext = createContext<ContextSidebarContextType | undefined>(undefined);

const initialContextData: ContextData = {
  title: '',
  stats: [],
  tips: [],
  info: undefined,
  quickActions: []
};

export function ContextSidebarProvider({ children }: { children: ReactNode }) {
  const [contextData, setContextData] = useState<ContextData>(initialContextData);

  const updateContext = (data: Partial<ContextData>) => {
    setContextData(prev => {
      // Evitar atualizações desnecessárias se os dados forem os mesmos
      const hasChanges = Object.keys(data).some(key => {
        const k = key as keyof ContextData;
        return JSON.stringify(prev[k]) !== JSON.stringify(data[k]);
      });
      
      if (!hasChanges) return prev;
      
      return {
        ...prev,
        ...data
      };
    });
  };

  const clearContext = () => {
    setContextData(initialContextData);
  };

  return (
    <ContextSidebarContext.Provider value={{ contextData, updateContext, clearContext }}>
      {children}
    </ContextSidebarContext.Provider>
  );
}

export function useContextSidebar() {
  const context = useContext(ContextSidebarContext);
  if (!context) {
    throw new Error('useContextSidebar must be used within ContextSidebarProvider');
  }
  return context;
}
