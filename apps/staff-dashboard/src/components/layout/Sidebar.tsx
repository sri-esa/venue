import {
  BarChart3,
  Bell,
  LayoutDashboard,
  Map,
  Menu,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { mockAlerts, mockQueues, mockZones } from '../../config/mock-data';
import { useAlertStore } from '../../store/alert.store';
import { useCrowdStore } from '../../store/crowd.store';
import { useQueueStore } from '../../store/queue.store';
import { useUIStore } from '../../store/ui.store';

interface SidebarProps {
  systemHealthLabel: string;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  badgeTone?: 'red' | 'amber' | 'blue';
}

const badgeTones = {
  red: 'border-red-500/30 bg-red-500/20 text-red-300',
  amber: 'border-amber-500/30 bg-amber-500/20 text-amber-300',
  blue: 'border-venue-blue/30 bg-venue-blue/20 text-blue-200',
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-3 rounded-r-2xl border-l-[3px] px-4 py-3 text-sm font-medium tracking-[0.04em] transition-all duration-150 ease-ops ${
    isActive
      ? 'border-venue-blue bg-venue-blue/20 text-venue-blue'
      : 'border-transparent text-slate-400 hover:border-venue-blue/40 hover:bg-slate-800/50 hover:text-slate-200'
  }`;

function SidebarContent({ systemHealthLabel }: SidebarProps) {
  const crowdZones = useCrowdStore(useShallow((state) => Object.values(state.zones)));
  const queues = useQueueStore(useShallow((state) => Object.values(state.queues)));
  const alerts = useAlertStore(useShallow((state) => Object.values(state.alerts)));

  const zoneData = crowdZones.length ? crowdZones : mockZones;
  const queueData = queues.length ? queues : mockQueues;
  const alertData = alerts.length ? alerts : mockAlerts;

  const criticalZones = zoneData.filter((zone) => zone.densityLevel === 'CRITICAL').length;
  const longQueues = queueData.filter((queue) => queue.isOpen && queue.estimatedWaitMinutes > 15).length;
  const unreadAlerts = alertData.filter((alert) => !alert.resolvedAt).length;
  const hasP0 = alertData.some((alert) => !alert.resolvedAt && alert.severity === 'CRITICAL');

  const items: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/heatmap', label: 'Heat Map', icon: Map, badge: criticalZones, badgeTone: 'red' },
    { to: '/queues', label: 'Queues', icon: UtensilsCrossed, badge: longQueues, badgeTone: 'amber' },
    { to: '/alerts', label: 'Alerts', icon: Bell, badge: unreadAlerts, badgeTone: hasP0 ? 'red' : 'blue' },
    { to: '/staff-map', label: 'Staff Map', icon: Users },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="flex h-full flex-col bg-navy-deep">
      <div className="border-b border-navy-border px-6 py-6">
        <p className="text-2xl font-bold tracking-tight text-venue-blue">Crowgy</p>
        <p className="mt-1 text-sm text-slate-400">Stadium operations command</p>
      </div>

      <nav className="flex-1 space-y-1 px-0 py-4">
        {items.map(({ to, label, icon: Icon, badge, badgeTone = 'blue' }) => (
          <NavLink key={to} to={to} className={navLinkClass}>
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge && badge > 0 ? (
              <span className={`inline-flex min-w-7 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums ${badgeTones[badgeTone]}`}>
                {badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-navy-border px-6 py-5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-navy-card px-4 py-3">
          <span className={`h-2.5 w-2.5 rounded-full ${systemHealthLabel === 'Critical' ? 'bg-red-400' : systemHealthLabel === 'Degraded' ? 'bg-amber-400' : 'bg-green-400'}`} />
          <div>
            <p className="text-sm font-medium text-slate-100">System health</p>
            <p className="text-sm text-slate-400">{systemHealthLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ systemHealthLabel }: SidebarProps) {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

  return (
    <>
      <aside className="hidden h-screen w-60 shrink-0 border-r border-navy-border lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        <SidebarContent systemHealthLabel={systemHealthLabel} />
      </aside>

      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-navy-border bg-navy-card text-slate-100 shadow-panel lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-y-0 left-0 w-60 border-r border-navy-border">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-navy-border bg-navy-card text-slate-100"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent systemHealthLabel={systemHealthLabel} />
          </div>
        </div>
      ) : null}
    </>
  );
}
