import { collection, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useAlertStore } from '../../store/alert.store';
import { SystemAlert } from '../../types/alert.types';

export function subscribeToAlerts(venueId: string): Unsubscribe {
  const store = useAlertStore.getState();
  store.setLoading(true);

  const alertsRef = collection(firestore, 'venues', venueId, 'alerts');

  const unsubscribe = onSnapshot(alertsRef, (snapshot) => {
    store.setLoading(false);
    
    snapshot.docChanges().forEach((change) => {
      const alert = { alertId: change.doc.id, ...change.doc.data() } as SystemAlert;
      
      if (change.type === 'added') {
        store.addAlert(alert);
        if (alert.severity === 'CRITICAL' && !alert.resolvedAt && typeof Notification !== 'undefined') {
          if (Notification.permission === 'granted') {
            new Notification(`CRITICAL ALERT: ${alert.type}`, { body: alert.message });
          }
        }
      } else if (change.type === 'modified') {
        if (alert.resolvedAt) {
          store.resolveAlert(change.doc.id, alert.resolvedBy || 'System', alert.resolvedAt);
        }
      }
    });
  }, (error) => {
    console.error(`[Firebase] Error fetching alerts for ${venueId}:`, error);
    store.setLoading(false);
  });

  return unsubscribe;
}
