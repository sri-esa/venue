interface WaitTimeBadgeProps {
  minutes: number;
  isOpen: boolean;
}

const getClasses = (minutes: number, isOpen: boolean) => {
  if (!isOpen) return 'border-slate-600 bg-slate-700/40 text-slate-400';
  if (minutes < 5) return 'border-green-500/30 bg-green-500/20 text-green-400';
  if (minutes <= 15) return 'border-amber-500/30 bg-amber-500/20 text-amber-400';
  return 'border-red-500/30 bg-red-500/20 text-red-400';
};

export default function WaitTimeBadge({ minutes, isOpen }: WaitTimeBadgeProps) {
  return (
    <span
      className={`inline-flex min-w-16 items-center justify-center rounded-full border px-2.5 py-1 text-sm font-semibold tabular-nums ${getClasses(minutes, isOpen)}`}
    >
      {isOpen ? `${minutes} min` : 'Closed'}
    </span>
  );
}
