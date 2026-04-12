import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { RealtimeAnalytics } from '../../types/venue.types';

export function subscribeToRealtimeAnalytics(
  venueId: string,
  callback: (data: RealtimeAnalytics) => void
): Unsubscribe {
  
  // Listens to Firestore: /venues/{venueId}/analytics/realtime
  const analyticsDocRef = doc(firestore, 'venues', venueId, 'analytics', 'realtime');

  const unsubscribe = onSnapshot(analyticsDocRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as RealtimeAnalytics);
    }
  }, (error) => {
    console.error(`[Firebase] Error fetching realtime analytics for ${venueId}:`, error);
  });

  return unsubscribe;
}
