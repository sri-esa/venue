import { collection, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useQueueStore } from '../../store/queue.store';
import { QueueStatus } from '../../types/queue.types';

export function subscribeToQueueStatus(venueId: string): Unsubscribe {
  const store = useQueueStore.getState();
  store.setLoading(true);

  // Note: Listens to: /venues/{venueId}/queues/
  const queuesRef = collection(firestore, 'venues', venueId, 'queues');
  
  const unsubscribe = onSnapshot(queuesRef, (snapshot) => {
    store.setLoading(false);
    if (snapshot.empty) return;
    
    // Parse all queue children
    const queues: QueueStatus[] = [];
    snapshot.forEach(doc => {
      queues.push({ queueId: doc.id, ...doc.data() } as QueueStatus);
    });
    
    store.setAllQueues(queues);
  }, (error) => {
    console.error(`[Firebase] Error fetching queues for ${venueId}:`, error);
    store.setLoading(false);
  });

  return unsubscribe;
}
