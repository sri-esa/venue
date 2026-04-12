import { APIProvider, AdvancedMarker, InfoWindow, Map } from '@vis.gl/react-google-maps';
import { Clock3, MapPinned, Shield, Stethoscope, UserRoundCog, UtensilsCrossed } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { MOCK_VENUE_ID, VENUE_CENTER, mockStaff, zoneNameById, type VenueStaffMember } from '../../config/mock-data';
import { useStaffStore } from '../../store/staff.store';

const mapsApiKey = import.meta.env.VITE_MAPS_API_KEY ?? import.meta.env.VITE_GCP_API_KEY ?? '';

const roleStyles = {
  GUARD: 'border-blue-500/30 bg-blue-500/15 text-blue-200',
  EMT: 'border-red-500/30 bg-red-500/15 text-red-200',
  MANAGER: 'border-amber-500/30 bg-amber-500/15 text-amber-200',
  VENDOR: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200',
};

const roleIcons = {
  GUARD: Shield,
  EMT: Stethoscope,
  MANAGER: UserRoundCog,
  VENDOR: UtensilsCrossed,
};

function LoadingPanel() {
  return <div className="h-[34rem] animate-pulse rounded-2xl bg-slate-800/70" />;
}

function StaffMarker({ staff, selected, onSelect }: { staff: VenueStaffMember; selected: boolean; onSelect: () => void }) {
  const Icon = roleIcons[staff.role];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-panel ${
        selected ? 'border-white bg-venue-blue text-white' : 'border-navy-border bg-navy-card text-slate-100'
      }`}
      aria-label={staff.name}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export default function StaffMapPage() {
  const liveStaff = useStaffStore(useShallow((state) => Object.values(state.staff)));
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!liveStaff.length) {
        setUseFallback(true);
      }
      setLoading(false);
    }, 3000);

    if (liveStaff.length) {
      setLoading(false);
    }

    return () => window.clearTimeout(timeout);
  }, [liveStaff.length]);

  const staff = liveStaff.length ? (liveStaff as VenueStaffMember[]) : useFallback ? mockStaff : [];

  const activeStaff = useMemo(
    () => staff.filter((member) => member.active && member.location),
    [staff],
  );

  const selectedStaff =
    activeStaff.find((member) => member.staffId === selectedStaffId) ?? activeStaff[0] ?? null;

  const onDutyCount = activeStaff.length;
  const assignedCount = activeStaff.filter((member) => member.assignedZone).length;
  const unassignedCount = activeStaff.filter((member) => !member.assignedZone).length;

  return (
    <div className="grid min-h-[calc(100vh-104px)] grid-cols-1 gap-4 xl:grid-cols-10">
      <section className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel xl:col-span-7">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Staff Map</p>
            <p className="mt-1 text-lg font-semibold text-slate-50">Live field coverage over venue perimeter</p>
          </div>
          <div className="rounded-2xl border border-navy-border bg-navy-elevated px-4 py-3 text-right">
            <p className="text-sm text-slate-400">Venue</p>
            <p className="text-sm font-semibold text-slate-100">{MOCK_VENUE_ID}</p>
          </div>
        </div>

        {loading ? (
          <LoadingPanel />
        ) : !mapsApiKey ? (
          <div className="flex h-[34rem] flex-col items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-center">
            <MapPinned className="h-10 w-10 text-amber-300" />
            <p className="mt-4 text-lg font-semibold text-slate-50">Google Maps overlay ready</p>
            <p className="mt-2 max-w-md text-sm text-slate-300">
              Add a Maps browser key as `VITE_MAPS_API_KEY` during the frontend build to render the live overlay in this panel.
            </p>
          </div>
        ) : (
          <div className="h-[34rem] overflow-hidden rounded-2xl border border-navy-border">
            <APIProvider apiKey={mapsApiKey}>
              <Map
                defaultCenter={VENUE_CENTER}
                defaultZoom={17}
                gestureHandling="greedy"
                disableDefaultUI
                mapId="crowgy-staff-map"
              >
                {activeStaff.map((member) =>
                  member.location ? (
                    <AdvancedMarker
                      key={member.staffId}
                      position={member.location}
                      onClick={() => setSelectedStaffId(member.staffId)}
                    >
                      <StaffMarker
                        staff={member}
                        selected={selectedStaffId === member.staffId}
                        onSelect={() => setSelectedStaffId(member.staffId)}
                      />
                    </AdvancedMarker>
                  ) : null,
                )}

                {selectedStaff?.location ? (
                  <InfoWindow
                    position={selectedStaff.location}
                    onCloseClick={() => setSelectedStaffId(null)}
                  >
                    <div className="min-w-52 text-slate-900">
                      <p className="font-semibold">{selectedStaff.name}</p>
                      <p className="mt-1 text-sm">{selectedStaff.role}</p>
                      <p className="mt-2 text-sm">Zone: {zoneNameById(selectedStaff.assignedZone)}</p>
                    </div>
                  </InfoWindow>
                ) : null}
              </Map>
            </APIProvider>
          </div>
        )}
      </section>

      <aside className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel xl:col-span-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-navy-border bg-navy-elevated p-4">
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-slate-400">On Duty</p>
            <p className="mt-3 text-3xl font-bold text-slate-50 tabular-nums">{onDutyCount}</p>
          </div>
          <div className="rounded-2xl border border-navy-border bg-navy-elevated p-4">
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-slate-400">Assigned</p>
            <p className="mt-3 text-3xl font-bold text-slate-50 tabular-nums">{assignedCount}</p>
          </div>
          <div className="rounded-2xl border border-navy-border bg-navy-elevated p-4">
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-slate-400">Reserve</p>
            <p className="mt-3 text-3xl font-bold text-slate-50 tabular-nums">{unassignedCount}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-slate-400">Live Staff Roster</p>
          <div className="mt-3 space-y-3">
            {loading
              ? Array.from({ length: 5 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-800/70" />)
              : activeStaff.map((member) => {
                  const Icon = roleIcons[member.role];
                  return (
                    <button
                      type="button"
                      key={member.staffId}
                      onClick={() => setSelectedStaffId(member.staffId)}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                        selectedStaff?.staffId === member.staffId
                          ? 'border-venue-blue bg-venue-blue/10'
                          : 'border-navy-border bg-navy-elevated'
                      }`}
                    >
                      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${roleStyles[member.role]}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-50">{member.name}</span>
                        <span className="mt-1 block text-sm text-slate-400">{member.role}</span>
                        <span className="mt-2 block text-sm text-slate-300">{zoneNameById(member.assignedZone)}</span>
                        <span className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                          <Clock3 className="h-4 w-4" />
                          {formatDistanceToNowStrict(new Date(member.lastUpdated), { addSuffix: true })}
                        </span>
                      </span>
                    </button>
                  );
                })}
          </div>
        </div>
      </aside>
    </div>
  );
}
