import { Bell, CheckCheck, CheckCircle2, Clock3, ShieldAlert, Users } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import LiveIndicator from '../../components/common/LiveIndicator';
import MetricCard from '../../components/common/MetricCard';
import DensityBadge from '../../components/common/DensityBadge';
import WaitTimeBadge from '../../components/common/WaitTimeBadge';
import {
  mockAlerts,
  mockAnalytics,
  mockQueues,
  mockZones,
  MOCK_VENUE_ID,
  VENUE_CAPACITY,
  severityClasses,
  severityCodeFromAlert,
  zoneNameById,
  type VenueAlert,
  type VenueQueue,
  type VenueZone,
} from '../../config/mock-data';
import { subscribeToRealtimeAnalytics } from '../../services/firebase/analytics.firebase';
import { useAlertStore } from '../../store/alert.store';
import { useCrowdStore } from '../../store/crowd.store';
import { useQueueStore } from '../../store/queue.store';

function LoadingBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-800/70 ${className}`} />;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const storeZones = useCrowdStore(useShallow((state) => Object.values(state.zones)));
  const storeQueues = useQueueStore(useShallow((state) => Object.values(state.queues)));
  const storeAlerts = useAlertStore(useShallow((state) => Object.values(state.alerts)));
  const [useFallback, setUseFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(mockAnalytics);

  useEffect(() => {
    const analyticsUnsubscribe = subscribeToRealtimeAnalytics(MOCK_VENUE_ID, (payload) => {
      setAnalytics(payload);
      setLoading(false);
    });

    const timeout = window.setTimeout(() => {
      if (!storeZones.length && !storeQueues.length && !storeAlerts.length) {
        setUseFallback(true);
      }
      setLoading(false);
    }, 3000);

    return () => {
      analyticsUnsubscribe();
      window.clearTimeout(timeout);
    };
  }, [storeAlerts.length, storeQueues.length, storeZones.length]);

  const zones = storeZones.length ? (storeZones as VenueZone[]) : useFallback ? mockZones : [];
  const queues = storeQueues.length ? (storeQueues as VenueQueue[]) : useFallback ? mockQueues : [];
  const alerts = storeAlerts.length
    ? storeAlerts.filter((alert) => !alert.resolvedAt).map((alert) => ({ ...alert, severityCode: severityCodeFromAlert(alert) })) as VenueAlert[]
    : useFallback
      ? mockAlerts
      : [];

  const currentAnalytics = zones.length || queues.length || alerts.length
    ? {
        ...analytics,
        totalAttendees: zones.reduce((sum, zone) => sum + zone.rawCount, 0) || analytics.totalAttendees,
        percentCapacity:
          zones.reduce((sum, zone) => sum + zone.capacity, 0) > 0
            ? zones.reduce((sum, zone) => sum + zone.rawCount, 0) / zones.reduce((sum, zone) => sum + zone.capacity, 0)
            : analytics.percentCapacity,
        criticalZonesCount: zones.filter((zone) => zone.densityLevel === 'CRITICAL').length,
        avgQueueWaitMinutes:
          queues.filter((queue) => queue.isOpen).length > 0
            ? Math.round(queues.filter((queue) => queue.isOpen).reduce((sum, queue) => sum + queue.estimatedWaitMinutes, 0) / queues.filter((queue) => queue.isOpen).length)
            : analytics.avgQueueWaitMinutes,
        longestQueueMinutes: Math.max(...queues.map((queue) => queue.estimatedWaitMinutes), analytics.longestQueueMinutes),
        activeAlertsCount: alerts.length,
      }
    : analytics;

  const p0Count = alerts.filter((alert) => alert.severityCode === 'P0').length;
  const p1Count = alerts.filter((alert) => alert.severityCode === 'P1').length;
  const p2Count = alerts.filter((alert) => alert.severityCode === 'P2').length;
  const criticalCount = currentAnalytics.criticalZonesCount;
  const avgWait = currentAnalytics.avgQueueWaitMinutes;
  const attendancePercent = currentAnalytics.percentCapacity * 100;
  const recentAlerts = alerts.slice(0, 5);
  const topQueues = [...queues].sort((left, right) => right.estimatedWaitMinutes - left.estimatedWaitMinutes).slice(0, 8);

  return (
    <div className="flex min-h-[calc(100vh-104px)] flex-col gap-4">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }, (_, index) => <LoadingBlock key={index} className="h-48" />)
        ) : (
          <>
            <MetricCard
              label="Total Attendance"
              value={currentAnalytics.totalAttendees.toLocaleString()}
              subtitle={`of ${VENUE_CAPACITY.toLocaleString()} · ${attendancePercent.toFixed(1)}%`}
              icon={Users}
              color={attendancePercent > 90 ? 'red' : attendancePercent > 70 ? 'amber' : 'green'}
            />
            <MetricCard
              label="Critical Zones"
              value={`${criticalCount}`}
              subtitle={criticalCount === 0 ? 'All Clear' : 'zones need attention'}
              icon={ShieldAlert}
              color={criticalCount === 0 ? 'green' : 'red'}
              pulse={criticalCount > 0}
            />
            <MetricCard
              label="Avg Queue Wait"
              value={`${avgWait} min`}
              subtitle="across open stalls"
              icon={Clock3}
              color={avgWait > 15 ? 'red' : avgWait >= 5 ? 'amber' : 'green'}
            />
            <MetricCard
              label="Active Alerts"
              value={`${currentAnalytics.activeAlertsCount}`}
              subtitle={`${p0Count} P0 · ${p1Count} P1 · ${p2Count} P2`}
              icon={Bell}
              color={p0Count > 0 ? 'red' : p1Count > 0 ? 'amber' : 'blue'}
              pulse={p0Count > 0}
            />
          </>
        )}
      </section>

      <section className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel xl:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Live Zone Density</p>
              <p className="mt-1 text-lg font-semibold text-slate-50">Twelve-zone live preview</p>
            </div>
            <LiveIndicator />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 12 }, (_, index) => (
                <LoadingBlock key={index} className="h-28" />
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/heatmap')}
              className="grid w-full grid-cols-1 gap-3 text-left md:grid-cols-2 xl:grid-cols-3"
            >
              {zones.slice(0, 12).map((zone) => (
                <div
                  key={zone.zoneId}
                  className={`rounded-2xl border p-4 transition-all duration-150 ease-ops hover:-translate-y-0.5 hover:border-slate-500 ${
                    zone.densityLevel === 'CRITICAL'
                      ? 'animate-pulse border-red-500/30 bg-red-500/12 shadow-critical'
                      : zone.densityLevel === 'HIGH'
                        ? 'border-orange-500/20 bg-orange-500/10'
                        : zone.densityLevel === 'MEDIUM'
                          ? 'border-amber-500/20 bg-amber-500/10'
                          : 'border-green-500/20 bg-green-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-50">{zone.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{zone.rawCount.toLocaleString()} / {zone.capacity.toLocaleString()}</p>
                    </div>
                    <DensityBadge level={zone.densityLevel} compact />
                  </div>
                  <p className="mt-4 text-sm text-slate-400">Tap for full zone detail</p>
                </div>
              ))}
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Active Alerts</p>
              <p className="mt-1 text-lg font-semibold text-slate-50">Unresolved operational alerts</p>
            </div>
            <span className="inline-flex min-w-9 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-300 tabular-nums">
              {recentAlerts.length}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <LoadingBlock key={index} className="h-24" />
              ))}
            </div>
          ) : recentAlerts.length === 0 ? (
            <div className="flex h-[28rem] flex-col items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
              <p className="mt-4 text-lg font-semibold text-slate-50">All Clear</p>
              <p className="mt-2 max-w-xs text-sm text-slate-400">No unresolved alerts are active across the venue right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <article
                  key={alert.alertId}
                  className={`rounded-2xl border-l-4 border border-navy-border bg-navy-elevated p-4 ${
                    alert.severityCode === 'P0' ? 'border-l-red-500' : alert.severityCode === 'P1' ? 'border-l-amber-500' : 'border-l-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClasses[alert.severityCode]}`}>
                          {alert.severityCode}
                        </span>
                        <p className="truncate text-sm font-semibold text-slate-100">{zoneNameById(alert.zoneId)}</p>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-300">{alert.message}</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 text-slate-200"
                      aria-label="Resolve alert"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    {formatDistanceToNowStrict(new Date(alert.triggeredAt), { addSuffix: true })}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Queue Status</p>
            <p className="mt-1 text-lg font-semibold text-slate-50">Live F&B and concourse queue strip</p>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }, (_, index) => (
              <LoadingBlock key={index} className="h-32 min-w-[17rem]" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {topQueues.map((queue) => (
              <div key={queue.queueId} className="min-w-[17rem] rounded-2xl border border-navy-border bg-navy-elevated p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-50">{queue.stallName}</p>
                    <p className="mt-1 text-sm text-slate-400">{queue.isOpen ? 'Open' : 'Closed'}</p>
                  </div>
                  <WaitTimeBadge minutes={queue.estimatedWaitMinutes} isOpen={queue.isOpen} />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                  <span>Queue length</span>
                  <span className="font-semibold tabular-nums text-slate-200">{queue.currentLength}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
