import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'amber' | 'orange' | 'red';
  trend?: string;
  pulse?: boolean;
  children?: ReactNode;
}

const accents = {
  blue: 'border-venue-blue/35 from-venue-blue/15 text-venue-blue',
  green: 'border-green-500/35 from-green-500/15 text-green-400',
  amber: 'border-amber-500/35 from-amber-500/15 text-amber-400',
  orange: 'border-orange-500/35 from-orange-500/15 text-orange-400',
  red: 'border-red-500/35 from-red-500/15 text-red-400',
};

export default function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  pulse = false,
  children,
}: MetricCardProps) {
  return (
    <section
      className={`rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel transition-all duration-150 ease-ops ${
        pulse ? 'animate-pulse border-red-500/35' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <div className="space-y-1">
            <p className="text-[2rem] font-bold leading-none text-slate-50 tabular-nums">{value}</p>
            <p className="text-sm text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br to-transparent ${accents[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend ? <p className="mt-4 text-sm font-medium text-slate-300">{trend}</p> : null}
      {children}
      <div className={`mt-4 h-1 rounded-full bg-gradient-to-r to-transparent ${accents[color]}`} />
    </section>
  );
}
