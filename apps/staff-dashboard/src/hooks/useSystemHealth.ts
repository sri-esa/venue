import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { HealthState, SystemHealth } from '../types/venue.types';

export function useSystemHealth(venueId: string) {
  const [healthState, setHealthState] = useState<HealthState>('HEALTHY');
  
  const isHealthy = healthState === 'HEALTHY';
  const isDegraded = healthState === 'DEGRADED';
  const isCritical = healthState === 'CRITICAL';

  useEffect(() => {
    if (!venueId) return;
    const healthRef = doc(firestore, 'venues', venueId, 'system_health', 'current');
    
    const unsubscribe = onSnapshot(healthRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SystemHealth;
        setHealthState(data.state || 'HEALTHY');
      }
    }, (error) => {
       console.error('[Firebase] Failure on health monitor:', error);
       setHealthState('CRITICAL');
    });

    return () => unsubscribe();
  }, [venueId]);

  return { healthState, isHealthy, isDegraded, isCritical };
}
