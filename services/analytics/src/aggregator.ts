// Service: analytics
// Layer: Intelligence Layer
import { db } from './shared/firestore-client';

export class RealtimeAggregator {
  
  async computeAggregates(venueId: string) {
    try {
      const snapZones = await db.collection('venues').doc(venueId).collection('zones').get();
      const zones: any[] = [];
      snapZones.forEach(doc => zones.push(doc.data()));
      
      const snapQueues = await db.collection('venues').doc(venueId).collection('queues').get();
      const queues: any[] = [];
      snapQueues.forEach(doc => queues.push(doc.data()));

      let totalAttendees = 0;
      let criticalZonesCount = 0;
      let maxQueueWait = 0;
      let sumQueueWait = 0;
      let openQueueCount = 0;

      for (const z of Object.values<any>(zones)) {
        totalAttendees += (z.rawCount || 0);
        if (z.densityLevel === 'CRITICAL') criticalZonesCount++;
      }

      for (const q of Object.values<any>(queues)) {
        if (q.isOpen) {
          openQueueCount++;
          sumQueueWait += (q.estimatedWaitMinutes || 0);
          if ((q.estimatedWaitMinutes || 0) > maxQueueWait) maxQueueWait = q.estimatedWaitMinutes;
        }
      }

      const venueCapacity = 50000; // Mocked

      const payload = {
        totalAttendees,
        percentCapacity: totalAttendees / venueCapacity,
        criticalZonesCount,
        avgQueueWaitMinutes: openQueueCount ? sumQueueWait / openQueueCount : 0,
        longestQueueMinutes: maxQueueWait,
        activeAlertsCount: 0, // Mocked 
        alertsResolvedLastHour: 0, // Mocked
        notificationsSentToday: 0, // Mocked
        peakOccupancyToday: totalAttendees / venueCapacity,
        peakOccupancyTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.collection('analytics').doc(venueId).collection('realtime').doc('current').set(payload);
      
    } catch (e) {
      console.error('Computation failed', e);
    }
  }

  start(venueId: string) {
    // Run every 30 seconds
    setInterval(() => this.computeAggregates(venueId), 30000);
  }
}
