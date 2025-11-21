import { useEffect, useState } from "react";

/**
 * Hook to detect the current theme (dark or light mode)
 * @returns true if dark mode is active, false otherwise
 */
export function useTheme(): boolean {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    const handleThemeChange = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    window.addEventListener('themeChanged', handleThemeChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  return isDark;
}

/**
 * Theme color tokens organized by category
 */
export const themeColors = {
  bg: {
    primary: { light: '#ffffff', dark: '#0f172a' },
    secondary: { light: '#f8fafc', dark: '#1e293b' },
    card: { light: '#ffffff', dark: '#1e293b' },
    muted: { light: '#f1f5f9', dark: '#1e293b' }
  },
  text: {
    primary: { light: '#0f172a', dark: '#f1f5f9' },
    secondary: { light: '#64748b', dark: '#94a3b8' },
    muted: { light: '#94a3b8', dark: '#64748b' }
  },
  border: {
    primary: { light: '#e2e8f0', dark: '#334155' },
    secondary: { light: '#cbd5e1', dark: '#475569' }
  }
};

/**
 * Get a theme color based on the current mode
 * @param path - The color path (e.g., 'bg.primary', 'text.secondary')
 * @param isDark - Whether dark mode is active
 * @returns The color value
 */
export function getThemeColor(path: string, isDark: boolean): string {
  const parts = path.split('.');
  let current: any = themeColors;
  
  for (const part of parts) {
    if (current[part]) {
      current = current[part];
    } else {
      return isDark ? '#1e293b' : '#ffffff'; // fallback
    }
  }
  
  return isDark ? current.dark : current.light;
}
