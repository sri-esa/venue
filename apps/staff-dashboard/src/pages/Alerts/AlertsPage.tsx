import { CheckCheck, Radio, UserPlus } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { mockAlerts, severityClasses, severityCodeFromAlert, zoneNameById, type VenueAlert } from '../../config/mock-data';
import { useAlertStore } from '../../store/alert.store';

type AlertTab = 'ALL' | 'P0' | 'P1' | 'P2' | 'RESOLVED';
const tabs: AlertTab[] = ['ALL', 'P0', 'P1', 'P2', 'RESOLVED'];

export default function AlertsPage() {
  const storeAlerts = useAlertStore(useShallow((state) => Object.values(state.alerts)));
  const resolveAlert = useAlertStore((state) => state.resolveAlert);
  const acknowledgeAlert = useAlertStore((state) => state.acknowledgeAlert);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [activeTab, setActiveTab] = useState<AlertTab>('ALL');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!storeAlerts.length) setUseFallback(true);
      setLoading(false);
    }, 3000);

    if (storeAlerts.length) setLoading(false);
    return () => window.clearTimeout(timeout);
  }, [storeAlerts.length]);

  const alerts = storeAlerts.length
    ? (storeAlerts.map((alert) => ({ ...alert, severityCode: severityCodeFromAlert(alert) })) as VenueAlert[])
    : useFallback
      ? mockAlerts
      : [];

  let filteredAlerts = [...alerts];
  if (activeTab !== 'ALL') {
    filteredAlerts = filteredAlerts.filter((alert) => {
      if (activeTab === 'RESOLVED') return Boolean(alert.resolvedAt);
      return !alert.resolvedAt && alert.severityCode === activeTab;
    });
  }

  return (
    <div className="space-y-4">
      <section aria-labelledby="alerts-filter-heading" className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Alert Management</p>
        <h2 id="alerts-filter-heading" className="mt-1 text-lg font-semibold text-slate-50">
          Operational incidents and crowd safety notifications
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const label = tab === 'P0' ? 'P0 CRITICAL' : tab === 'P1' ? 'P1 HIGH' : tab === 'P2' ? 'P2 MEDIUM' : tab;
            return (
              // ACCESSIBILITY: Names each alert filter tab and exposes whether it is selected.
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeTab === tab ? 'border-venue-blue/40 bg-venue-blue/20 text-blue-200' : 'border-navy-border bg-navy-elevated text-slate-400'
                }`}
                aria-label={`Show ${label.toLowerCase()} alerts`}
                aria-pressed={activeTab === tab}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="alerts-list-heading" className="space-y-3">
        <h2 id="alerts-list-heading" className="sr-only">
          Alerts list
        </h2>
        {loading
          ? Array.from({ length: 5 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-800/70" />)
          : filteredAlerts.map((alert) => {
              const alertAgeMinutes = Math.round((Date.now() - new Date(alert.triggeredAt).getTime()) / 60_000);
              const isEscalating = !alert.resolvedAt && alert.severityCode === 'P0' && alertAgeMinutes > 5;
              const zoneName = zoneNameById(alert.zoneId);

              return (
                // ACCESSIBILITY: Identifies P0 cards as urgent alerts for assistive technology.
                <article
                  key={alert.alertId}
                  role={alert.severityCode === 'P0' ? 'alert' : undefined}
                  aria-live={alert.severityCode === 'P0' ? 'assertive' : 'polite'}
                  className={`rounded-2xl border-l-4 border bg-navy-card p-5 shadow-panel ${
                    alert.severityCode === 'P0'
                      ? 'border-l-red-500 bg-gradient-to-r from-red-500/10 to-navy-card'
                      : alert.severityCode === 'P1'
                        ? 'border-l-amber-500'
                        : 'border-l-yellow-500'
                  } ${isEscalating ? 'animate-pulse border-red-500/40' : 'border-navy-border'}`}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClasses[alert.severityCode]}`}>
                          {alert.severityCode}
                        </span>
                        <span className="text-sm font-medium text-slate-200">{alert.type.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-slate-500" aria-hidden="true">
                          •
                        </span>
                        <span className="text-sm text-slate-400">{zoneName}</span>
                        <span className="text-sm text-slate-500" aria-hidden="true">
                          •
                        </span>
                        <span className="text-sm text-slate-400">{formatDistanceToNowStrict(new Date(alert.triggeredAt), { addSuffix: true })}</span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-200">{alert.message}</p>
                    </div>
                    <div className="rounded-2xl border border-navy-border bg-navy-elevated px-4 py-3 text-sm">
                      <p className="text-slate-400">Assigned staff</p>
                      <p className="mt-1 font-medium text-slate-100">
                        {alert.resolvedAt ? 'Resolved by current shift' : alert.severityCode === 'P0' ? 'North Response Team' : 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {/* ACCESSIBILITY: Names the acknowledge action with alert context. */}
                    <button
                      type="button"
                      onClick={() => acknowledgeAlert(alert.alertId)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-navy-elevated px-3 py-2 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Acknowledge alert for ${zoneName}`}
                    >
                      <Radio className="h-4 w-4" />
                      Acknowledge
                    </button>
                    {/* ACCESSIBILITY: Names the assignment action with alert context. */}
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-2 text-sm font-medium text-amber-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Assign staff to alert for ${zoneName}`}
                    >
                      <UserPlus className="h-4 w-4" />
                      Assign
                    </button>
                    {/* ACCESSIBILITY: Names the resolve action with alert context. */}
                    <button
                      type="button"
                      onClick={() => resolveAlert(alert.alertId, 'CurrentStaffUser', new Date().toISOString())}
                      className="inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/15 px-3 py-2 text-sm font-medium text-green-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Resolve alert for ${zoneName}`}
                    >
                      <CheckCheck className="h-4 w-4" />
                      Resolve
                    </button>
                  </div>
                </article>
              );
            })}

        {!loading && filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-8 text-center text-sm text-green-200">
            No alerts in this view right now.
          </div>
        ) : null}
      </section>
    </div>
  );
}
