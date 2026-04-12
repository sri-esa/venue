import { Bell, ChevronDown, Menu } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { MOCK_VENUE_ID, VENUE_NAME } from '../../config/mock-data';
import { useSystemHealth } from '../../hooks/useSystemHealth';
import { useUnreadCount } from '../../store/alert.store';
import { useUIStore } from '../../store/ui.store';
import LiveIndicator from '../common/LiveIndicator';
import Sidebar from './Sidebar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/heatmap': 'Heat Map',
  '/queues': 'Queues',
  '/alerts': 'Alerts',
  '/staff-map': 'Staff Map',
  '/analytics': 'Analytics',
};

export default function AppShell() {
  const location = useLocation();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const unreadCount = useUnreadCount();
  const { healthState } = useSystemHealth(MOCK_VENUE_ID);

  const pageTitle = pageTitles[location.pathname] ?? 'Crowgy';
  const systemHealthLabel = healthState === 'CRITICAL' ? 'Critical' : healthState === 'DEGRADED' ? 'Degraded' : 'Healthy';

  return (
    <div className="min-h-screen bg-navy-deep text-slate-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <Sidebar systemHealthLabel={systemHealthLabel} />
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-navy-border bg-navy-card/95 px-5 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            {/* ACCESSIBILITY: Names the topbar navigation toggle. */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-navy-border bg-navy-elevated text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-50">{pageTitle}</h1>
              <p className="text-sm text-slate-400">Stadium operations dashboard</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 rounded-2xl border border-navy-border bg-navy-elevated px-4 py-2 md:flex">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-100">{VENUE_NAME}</p>
              <p className="text-sm text-slate-400">Smart sports venue</p>
            </div>
            <LiveIndicator />
          </div>

          <div className="flex items-center gap-3">
            {/* ACCESSIBILITY: Names the notifications button with the unread count context. */}
            <button
              type="button"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-navy-border bg-navy-elevated text-slate-100 transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                // ACCESSIBILITY: Announces the unread notification count.
                <span
                  aria-label={`${unreadCount} active alerts`}
                  className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white tabular-nums"
                >
                  {unreadCount}
                </span>
              ) : null}
            </button>

            {/* ACCESSIBILITY: Names the user menu trigger with role and location context. */}
            <button
              type="button"
              className="inline-flex items-center gap-3 rounded-2xl border border-navy-border bg-navy-elevated px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open profile menu for Shift Lead, North Ops"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-venue-blue/20 text-sm font-bold text-blue-200">
                ST
              </span>
              <span className="hidden md:block">
                <span className="block text-sm font-medium text-slate-100">Shift Lead</span>
                <span className="block text-sm text-slate-400">North Ops</span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
            </button>
          </div>
        </header>

        <main id="main-content" className="min-h-[calc(100vh-64px)] animate-fade-in px-4 py-4 md:px-6 md:py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
