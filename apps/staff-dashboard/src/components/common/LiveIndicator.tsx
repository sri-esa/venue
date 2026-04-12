interface LiveIndicatorProps {
  label?: string;
}

export default function LiveIndicator({ label = 'LIVE' }: LiveIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-sm font-semibold tracking-[0.14em] text-green-400">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
      </span>
      {label}
    </span>
  );
}
