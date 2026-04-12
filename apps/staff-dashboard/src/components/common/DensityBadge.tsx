import type { DensityLevel } from '../../types/crowd.types';

interface DensityBadgeProps {
  level: DensityLevel;
  compact?: boolean;
}

const classes: Record<DensityLevel, string> = {
  LOW: 'border-green-500/30 bg-green-500/20 text-green-400',
  MEDIUM: 'border-amber-500/30 bg-amber-500/20 text-amber-400',
  HIGH: 'border-orange-500/30 bg-orange-500/20 text-orange-400',
  CRITICAL: 'animate-pulse border-red-500/30 bg-red-500/20 text-red-400',
};

export default function DensityBadge({ level, compact = false }: DensityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium uppercase tracking-[0.12em] ${
        compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${classes[level]}`}
    >
      {level}
    </span>
  );
}
