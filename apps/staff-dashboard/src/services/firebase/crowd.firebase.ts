import { collection, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useCrowdStore } from '../../store/crowd.store';
import { ZoneDensity } from '../../types/crowd.types';

export function subscribeToCrowdDensity(venueId: string): Unsubscribe {
  const store = useCrowdStore.getState();
  store.setLoading(true);

  // Note: Listens to: /venues/{venueId}/zones/
  const zonesRef = collection(firestore, 'venues', venueId, 'zones');
  
  // Custom throttle implementation is typically handled in store, but we can do it here if needed.
  // The React application doesn't have RxJS distinct so we trust the Firestore client side cache / hook dedup.
  const unsubscribe = onSnapshot(zonesRef, (snapshot) => {
    store.setLoading(false);
    if (snapshot.empty) return;
    
    // Parse all zone children
    const zones: ZoneDensity[] = [];
    snapshot.forEach(doc => {
      zones.push({ zoneId: doc.id, ...doc.data() } as ZoneDensity);
    });
    
    store.setAllZones(zones);
  }, (error) => {
    console.error(`[Firebase] Error fetching crowd density for ${venueId}:`, error);
    store.setLoading(false);
    store.setError(error.message);
  });

  return unsubscribe;
}
