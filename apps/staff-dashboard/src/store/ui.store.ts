import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface UIState {
  sidebarOpen: boolean;
  selectedZoneId: string | null;
  selectedQueueId: string | null;
}

interface UIActions {
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSelectedZoneId: (id: string | null) => void;
  setSelectedQueueId: (id: string | null) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  immer((set) => ({
    sidebarOpen: true,
    selectedZoneId: null,
    selectedQueueId: null,

    setSidebarOpen: (open) => set((state) => { state.sidebarOpen = open; }),
    toggleSidebar: () => set((state) => { state.sidebarOpen = !state.sidebarOpen; }),
    setSelectedZoneId: (id) => set((state) => { state.selectedZoneId = id; }),
    setSelectedQueueId: (id) => set((state) => { state.selectedQueueId = id; }),
  }))
);
