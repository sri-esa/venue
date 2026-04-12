import { Send, Siren } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useShallow } from 'zustand/react/shallow';
import DensityBadge from '../../components/common/DensityBadge';
import { buildDensityHistory, mockAlerts, mockZones, severityClasses, severityCodeFromAlert, zoneNameById, type VenueAlert, type VenueZone } from '../../config/mock-data';
import { useAlertStore } from '../../store/alert.store';
import { useCrowdStore } from '../../store/crowd.store';
import { useUIStore } from '../../store/ui.store';

function LoadingZoneCard() {
  return <div className="h-40 animate-pulse rounded-2xl bg-slate-800/70" />;
}

export default function HeatMapPage() {
  const storeZones = useCrowdStore(useShallow((state) => Object.values(state.zones)));
  const storeAlerts = useAlertStore(useShallow((state) => Object.values(state.alerts)));
  const selectedZoneId = useUIStore((state) => state.selectedZoneId);
  const setSelectedZoneId = useUIStore((state) => state.setSelectedZoneId);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!storeZones.length) {
        setUseFallback(true);
      }
      setLoading(false);
    }, 3000);

    if (storeZones.length) {
      setLoading(false);
    }

    return () => window.clearTimeout(timeout);
  }, [storeZones.length]);

  const zones = storeZones.length ? (storeZones as VenueZone[]) : useFallback ? mockZones : [];
  const alerts = storeAlerts.length
    ? storeAlerts.filter((alert) => !alert.resolvedAt).map((alert) => ({ ...alert, severityCode: severityCodeFromAlert(alert) })) as VenueAlert[]
    : useFallback
      ? mockAlerts
      : [];

  const selectedZone = zones.find((zone) => zone.zoneId === selectedZoneId) ?? zones[0];
  const zoneAlerts = alerts.filter((alert) => alert.zoneId === selectedZone?.zoneId);
  const history = selectedZone ? buildDensityHistory(selectedZone) : [];

  return (
    <div className="grid min-h-[calc(100vh-104px)] grid-cols-1 gap-4 xl:grid-cols-10">
      <section className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Venue Heat Map</p>
            <p className="mt-1 text-lg font-semibold text-slate-50">All 12 monitored zones</p>
          </div>
          <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-300">
            {zones.filter((zone) => zone.densityLevel === 'CRITICAL').length} critical
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 12 }, (_, index) => (
              <LoadingZoneCard key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {zones.map((zone) => (
              <button
                type="button"
                key={zone.zoneId}
                onClick={() => setSelectedZoneId(zone.zoneId)}
                className={`rounded-2xl border p-4 text-left transition-all duration-150 ease-ops hover:-translate-y-0.5 hover:border-slate-400 ${
                  selectedZone?.zoneId === zone.zoneId ? 'border-venue-blue bg-venue-blue/10' : ''
                } ${
                  zone.densityLevel === 'CRITICAL'
                    ? 'animate-pulse border-red-500/30 bg-red-500/15 shadow-critical'
                    : zone.densityLevel === 'HIGH'
                      ? 'border-orange-500/25 bg-orange-500/10'
                      : zone.densityLevel === 'MEDIUM'
                        ? 'border-amber-500/25 bg-amber-500/10'
                        : 'border-green-500/25 bg-green-500/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-50">{zone.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{zone.type}</p>
                  </div>
                  <DensityBadge level={zone.densityLevel} compact />
                </div>
                <p className="mt-6 text-2xl font-bold text-slate-50 tabular-nums">{zone.rawCount.toLocaleString()} / {zone.capacity.toLocaleString()}</p>
                <p className="mt-3 text-sm text-slate-400">{Math.round(zone.occupancy * 100)}% occupancy</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <aside className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel xl:col-span-3">
        {selectedZone ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-semibold text-slate-50">{selectedZone.name}</p>
                <p className="mt-1 text-sm text-slate-400">{selectedZone.type}</p>
              </div>
              <DensityBadge level={selectedZone.densityLevel} />
            </div>

            <div className="mt-6 rounded-2xl border border-navy-border bg-navy-elevated p-4">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-slate-400">Current Occupancy</p>
              <p className="mt-3 text-3xl font-bold text-slate-50 tabular-nums">{selectedZone.rawCount.toLocaleString()}</p>
              <p className="mt-1 text-sm text-slate-400">of {selectedZone.capacity.toLocaleString()} capacity</p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-slate-400">Last 30 readings</p>
              <div className="mt-3 h-56 rounded-2xl border border-navy-border bg-navy-elevated p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid stroke="#2A3050" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E2438', border: '1px solid #2A3050', borderRadius: 16, color: '#F8FAFC' }} labelStyle={{ color: '#94A3B8' }} />
                    <Line type="monotone" dataKey="occupancy" stroke="#2563EB" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2">
                <Siren className="h-4 w-4 text-red-400" />
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-slate-400">Active Alerts</p>
              </div>
              <div className="mt-3 space-y-3">
                {zoneAlerts.length === 0 ? (
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-200">
                    No active alerts for {selectedZone.name}.
                  </div>
                ) : (
                  zoneAlerts.map((alert) => (
                    <div key={alert.alertId} className="rounded-2xl border border-navy-border bg-navy-elevated p-4">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClasses[alert.severityCode]}`}>
                          {alert.severityCode}
                        </span>
                        <span className="text-sm text-slate-400">{zoneNameById(alert.zoneId)}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-200">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-venue-blue/40 bg-venue-blue px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              <Send className="h-4 w-4" />
              Send Staff Here
            </button>
          </>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-navy-border bg-navy-elevated text-sm text-slate-400">
            Select a zone to inspect live density.
          </div>
        )}
      </aside>
    </div>
  );
}
