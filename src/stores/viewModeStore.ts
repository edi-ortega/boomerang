import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'list' | 'grid';

interface ViewModeStore {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

export const useViewModeStore = create<ViewModeStore>()(
  persist(
    (set) => ({
      viewMode: 'list',
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleViewMode: () =>
        set((state) => ({
          viewMode: state.viewMode === 'list' ? 'grid' : 'list',
        })),
    }),
    {
      name: 'view-mode-storage',
    }
  )
);
