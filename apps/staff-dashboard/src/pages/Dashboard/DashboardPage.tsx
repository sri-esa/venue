import { Bell, CheckCheck, CheckCircle2, Clock3, ShieldAlert, Users } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
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
  const zoneButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

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
    ? (storeAlerts
        .filter((alert) => !alert.resolvedAt)
        .map((alert) => ({ ...alert, severityCode: severityCodeFromAlert(alert) })) as VenueAlert[])
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
            ? Math.round(
                queues.filter((queue) => queue.isOpen).reduce((sum, queue) => sum + queue.estimatedWaitMinutes, 0) /
                  queues.filter((queue) => queue.isOpen).length,
              )
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
  const visibleZones = zones.slice(0, 12);

  const getGridColumns = () => {
    if (window.innerWidth >= 1280) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  };

  const handleZoneGridKeyDown = (index: number, event: React.KeyboardEvent<HTMLButtonElement>) => {
    const columns = getGridColumns();
    const lastIndex = Math.min(visibleZones.length - 1, zoneButtonRefs.current.length - 1);
    let nextIndex = index;

    if (event.key === 'ArrowRight') nextIndex = Math.min(index + 1, lastIndex);
    if (event.key === 'ArrowLeft') nextIndex = Math.max(index - 1, 0);
    if (event.key === 'ArrowDown') nextIndex = Math.min(index + columns, lastIndex);
    if (event.key === 'ArrowUp') nextIndex = Math.max(index - columns, 0);

    if (nextIndex !== index) {
      event.preventDefault();
      zoneButtonRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-104px)] flex-col gap-4">
      <section aria-labelledby="dashboard-metrics-heading" className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <h2 id="dashboard-metrics-heading" className="sr-only">
          Dashboard metrics
        </h2>
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

      <section aria-labelledby="dashboard-live-ops-heading" className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-5">
        <h2 id="dashboard-live-ops-heading" className="sr-only">
          Live operations overview
        </h2>
        <section aria-labelledby="zone-density-heading" className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel xl:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Live Zone Density</p>
              <h2 id="zone-density-heading" className="mt-1 text-lg font-semibold text-slate-50">
                Twelve-zone live preview
              </h2>
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
            <>
              {/* ACCESSIBILITY: Exposes the zone layout as a navigable grid of live density cells. */}
              <div role="grid" aria-label="Live zone density" className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleZones.map((zone, index) => (
                  // ACCESSIBILITY: Identifies each focusable zone card as a grid cell within the live density grid.
                  <button
                    key={zone.zoneId}
                    ref={(element) => {
                      zoneButtonRefs.current[index] = element;
                    }}
                    type="button"
                    onClick={() => navigate('/heatmap')}
                    onKeyDown={(event) => handleZoneGridKeyDown(index, event)}
                    role="gridcell"
                    aria-label={`${zone.name}, ${zone.densityLevel} density, ${zone.rawCount.toLocaleString()} of ${zone.capacity.toLocaleString()} occupants. Open full zone detail.`}
                    className={`rounded-2xl border p-4 text-left transition-all duration-150 ease-ops hover:-translate-y-0.5 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                        <p className="mt-1 text-sm text-slate-400">
                          {zone.rawCount.toLocaleString()} / {zone.capacity.toLocaleString()}
                        </p>
                      </div>
                      <DensityBadge level={zone.densityLevel} compact />
                    </div>
                    <p className="mt-4 text-sm text-slate-400">Tap for full zone detail</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <section aria-labelledby="active-alerts-heading" className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Active Alerts</p>
              <h2 id="active-alerts-heading" className="mt-1 text-lg font-semibold text-slate-50">
                Unresolved operational alerts
              </h2>
            </div>
            <>
              {/* ACCESSIBILITY: Announces the active alert count with context. */}
              <span
                aria-label={`${recentAlerts.length} active alerts`}
                className="inline-flex min-w-9 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-300 tabular-nums"
              >
                {recentAlerts.length}
              </span>
            </>
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
                // ACCESSIBILITY: Promotes P0 alerts as assertive live alerts.
                <article
                  key={alert.alertId}
                  role={alert.severityCode === 'P0' ? 'alert' : undefined}
                  aria-live={alert.severityCode === 'P0' ? 'assertive' : 'polite'}
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
                    <>
                      {/* ACCESSIBILITY: Names the alert resolution action with the alert location context. */}
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Resolve alert for ${zoneNameById(alert.zoneId)}`}
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    </>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    {formatDistanceToNowStrict(new Date(alert.triggeredAt), { addSuffix: true })}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <section aria-labelledby="queue-status-heading" className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Queue Status</p>
            <h2 id="queue-status-heading" className="mt-1 text-lg font-semibold text-slate-50">
              Live F&amp;B and concourse queue strip
            </h2>
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
