import { Activity, Bell, Clock3, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useShallow } from 'zustand/react/shallow';
import MetricCard from '../../components/common/MetricCard';
import { buildAttendanceTrend, mockAnalytics, mockQueues, mockZones, MOCK_VENUE_ID, stallTypeLabel, type VenueQueue, type VenueZone } from '../../config/mock-data';
import { subscribeToRealtimeAnalytics } from '../../services/firebase/analytics.firebase';
import { useCrowdStore } from '../../store/crowd.store';
import { useQueueStore } from '../../store/queue.store';

export default function AnalyticsPage() {
  const storeZones = useCrowdStore(useShallow((state) => Object.values(state.zones)));
  const storeQueues = useQueueStore(useShallow((state) => Object.values(state.queues)));
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [analytics, setAnalytics] = useState(mockAnalytics);

  useEffect(() => {
    const unsubscribe = subscribeToRealtimeAnalytics(MOCK_VENUE_ID, (payload) => {
      setAnalytics(payload);
      setLoading(false);
    });

    const timeout = window.setTimeout(() => {
      if (!storeZones.length && !storeQueues.length) setUseFallback(true);
      setLoading(false);
    }, 3000);

    return () => {
      unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [storeQueues.length, storeZones.length]);

  const zones = storeZones.length ? (storeZones as VenueZone[]) : useFallback ? mockZones : [];
  const queues = storeQueues.length ? (storeQueues as VenueQueue[]) : useFallback ? mockQueues : [];
  const attendanceTrend = buildAttendanceTrend();

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <MetricCard label="Peak Attendance" value={analytics.peakOccupancyToday.toLocaleString()} subtitle={`at ${analytics.peakOccupancyTime}`} icon={Users} color="blue" />
        <MetricCard label="Resolved Last Hour" value={analytics.alertsResolvedLastHour.toString()} subtitle="active interventions closed" icon={Bell} color="green" />
        <MetricCard label="Longest Queue" value={`${analytics.longestQueueMinutes} min`} subtitle="highest wait observed" icon={Clock3} color="amber" />
        <MetricCard label="Notifications Sent" value={analytics.notificationsSentToday.toString()} subtitle="push alerts delivered today" icon={Activity} color="red" />
      </section>

      <section className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Attendance Trend</p>
        <p className="mt-1 text-lg font-semibold text-slate-50">Event ingress and in-bowl dwell curve</p>
        <div className="mt-4 h-80 rounded-2xl border border-navy-border bg-navy-elevated p-3">
          {loading ? (
            <div className="h-full animate-pulse rounded-2xl bg-slate-800/70" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend}>
                <defs>
                  <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2A3050" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1E2438', border: '1px solid #2A3050', borderRadius: 16, color: '#F8FAFC' }} labelStyle={{ color: '#94A3B8' }} />
                <Area type="monotone" dataKey="attendance" stroke="#2563EB" fill="url(#attendanceFill)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Zone Performance</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-navy-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-navy-elevated text-slate-400"><tr><th className="px-4 py-3">Zone</th><th className="px-4 py-3">Occupancy</th><th className="px-4 py-3">Capacity</th><th className="px-4 py-3">State</th></tr></thead>
              <tbody>
                {(zones.length ? zones : mockZones).map((zone) => (
                  <tr key={zone.zoneId} className="border-t border-navy-border">
                    <td className="px-4 py-3 font-medium text-slate-100">{zone.name}</td>
                    <td className="px-4 py-3 text-slate-300 tabular-nums">{Math.round(zone.occupancy * 100)}%</td>
                    <td className="px-4 py-3 text-slate-400 tabular-nums">{zone.rawCount.toLocaleString()} / {zone.capacity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-300">{zone.densityLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Queue Performance</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-navy-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-navy-elevated text-slate-400"><tr><th className="px-4 py-3">Stall</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Wait</th><th className="px-4 py-3">Length</th></tr></thead>
              <tbody>
                {(queues.length ? queues : mockQueues).map((queue) => (
                  <tr key={queue.queueId} className="border-t border-navy-border">
                    <td className="px-4 py-3 font-medium text-slate-100">{queue.stallName}</td>
                    <td className="px-4 py-3 text-slate-400">{stallTypeLabel(queue.stallType)}</td>
                    <td className="px-4 py-3 text-slate-300 tabular-nums">{queue.estimatedWaitMinutes} min</td>
                    <td className="px-4 py-3 text-slate-300 tabular-nums">{queue.currentLength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
