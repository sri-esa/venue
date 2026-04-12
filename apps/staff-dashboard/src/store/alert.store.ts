import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { SystemAlert } from '../types/alert.types';

interface AlertState {
  alerts: Record<string, SystemAlert>;
  unreadCount: number;
  isLoading: boolean;
}

interface AlertActions {
  addAlert: (alert: SystemAlert) => void;
  resolveAlert: (alertId: string, resolvedBy: string, resolvedAt: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  markAllRead: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAlertStore = create<AlertState & AlertActions>()(
  subscribeWithSelector(
    immer((set) => ({
      alerts: {},
      unreadCount: 0,
      isLoading: false,

      addAlert: (alert) => set((state) => {
        if (!state.alerts[alert.alertId] && !alert.resolvedAt) {
          state.unreadCount += 1;
        }
        state.alerts[alert.alertId] = alert;
      }),
      resolveAlert: (alertId, resolvedBy, resolvedAt) => set((state) => {
        if (state.alerts[alertId]) {
          state.alerts[alertId].resolvedBy = resolvedBy;
          state.alerts[alertId].resolvedAt = resolvedAt;
          if (state.unreadCount > 0) state.unreadCount -= 1;
        }
      }),
      acknowledgeAlert: (_alertId) => set((state) => {
        // Simple mock of unread decrement 
        if (state.unreadCount > 0) state.unreadCount -= 1;
      }),
      markAllRead: () => set((state) => { state.unreadCount = 0; }),
      setLoading: (loading) => set((state) => { state.isLoading = loading; }),
    }))
  )
);

const rankSeverity = (s: string) => {
  if (s === 'CRITICAL') return 4;
  if (s === 'HIGH') return 3;
  if (s === 'MEDIUM') return 2;
  return 1;
};

// Selectors — useShallow prevents new array refs causing infinite re-renders
export const useActiveAlerts = () => useAlertStore(useShallow(state =>
  Object.values(state.alerts)
    .filter(a => !a.resolvedAt)
    .sort((a, b) => {
       const ra = rankSeverity(a.severity);
       const rb = rankSeverity(b.severity);
       if (ra !== rb) return rb - ra;
       return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
    })
));

export const useP0Alerts = () => useAlertStore(useShallow(state => Object.values(state.alerts).filter(a => !a.resolvedAt && a.severity === 'CRITICAL')));
export const useAlertsByZone = (id: string) => useAlertStore(useShallow(state => Object.values(state.alerts).filter(a => a.zoneId === id)));
export const useUnreadCount = () => useAlertStore(state => state.unreadCount);
