import { ArrowDownWideNarrow, ChevronDown, Flame, Sandwich, ShoppingBag, TimerReset, Toilet, Wine } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import WaitTimeBadge from '../../components/common/WaitTimeBadge';
import { mockQueues, stallTypeLabel, type VenueQueue } from '../../config/mock-data';
import { useQueueStore } from '../../store/queue.store';
import type { QueueSortField, StallType } from '../../types/queue.types';

type QueueFilterValue = 'ALL' | StallType | 'MERCH';

const filterChips: QueueFilterValue[] = ['ALL', 'FOOD', 'DRINKS', 'MERCH', 'RESTROOM'];
const stallIcons = { FOOD: Sandwich, DRINKS: Wine, MERCHANDISE: ShoppingBag, RESTROOM: Toilet };

export default function QueuesPage() {
  const storeQueues = useQueueStore(useShallow((state) => Object.values(state.queues)));
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [filter, setFilter] = useState<QueueFilterValue>('ALL');
  const [sortBy, setSortBy] = useState<QueueSortField>('wait');
  const [flashRows, setFlashRows] = useState<Record<string, boolean>>({});
  const previousQueueRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!storeQueues.length) setUseFallback(true);
      setLoading(false);
    }, 3000);

    if (storeQueues.length) setLoading(false);
    return () => window.clearTimeout(timeout);
  }, [storeQueues.length]);

  const queues = storeQueues.length ? (storeQueues as VenueQueue[]) : useFallback ? mockQueues : [];

  useEffect(() => {
    if (!queues.length) return;
    const nextFlashRows: Record<string, boolean> = {};
    queues.forEach((queue) => {
      const previous = previousQueueRef.current[queue.queueId];
      if (previous !== undefined && previous !== queue.estimatedWaitMinutes) {
        nextFlashRows[queue.queueId] = true;
      }
      previousQueueRef.current[queue.queueId] = queue.estimatedWaitMinutes;
    });
    if (Object.keys(nextFlashRows).length) {
      setFlashRows(nextFlashRows);
      const timeout = window.setTimeout(() => setFlashRows({}), 1200);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [queues]);

  let filteredQueues = [...queues];
  if (filter !== 'ALL') {
    filteredQueues = filteredQueues.filter((queue) => (filter === 'MERCH' ? queue.stallType === 'MERCHANDISE' : queue.stallType === filter));
  }

  filteredQueues.sort((left, right) => {
    if (sortBy === 'length') return right.currentLength - left.currentLength;
    if (sortBy === 'name') return left.stallName.localeCompare(right.stallName);
    if (sortBy === 'status') return Number(right.isOpen) - Number(left.isOpen);
    return right.estimatedWaitMinutes - left.estimatedWaitMinutes;
  });

  const longestQueueWait = Math.max(...filteredQueues.map((item) => item.estimatedWaitMinutes), 0);
  const longestQueue = filteredQueues.find((queue) => queue.isOpen && queue.estimatedWaitMinutes === longestQueueWait);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-navy-border bg-navy-card p-5 shadow-panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Queue Monitoring</p>
            <p className="mt-1 text-lg font-semibold text-slate-50">Real-time stall throughput and service pressure</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setFilter(chip)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  filter === chip ? 'border-venue-blue/40 bg-venue-blue/20 text-blue-200' : 'border-navy-border bg-navy-elevated text-slate-400 hover:text-slate-200'
                }`}
              >
                {chip === 'MERCH' ? 'MERCH' : chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-navy-border bg-navy-card shadow-panel">
        {longestQueue ? (
          <div className="flex items-center gap-3 border-b border-amber-500/20 bg-amber-500/10 px-5 py-3 text-sm text-amber-200">
            <Flame className="h-4 w-4" />
            Longest queue pinned: {longestQueue.stallName} at {longestQueue.estimatedWaitMinutes} min
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-navy-border bg-navy-elevated/70">
              <tr className="text-sm uppercase tracking-[0.14em] text-slate-400">
                <th className="px-5 py-4"><button type="button" onClick={() => setSortBy('name')} className="inline-flex items-center gap-2">Stall<ChevronDown className="h-4 w-4" /></button></th>
                <th className="px-5 py-4"><button type="button" onClick={() => setSortBy('length')} className="inline-flex items-center gap-2">Queue Length<ArrowDownWideNarrow className="h-4 w-4" /></button></th>
                <th className="px-5 py-4"><button type="button" onClick={() => setSortBy('wait')} className="inline-flex items-center gap-2">Wait Time<ArrowDownWideNarrow className="h-4 w-4" /></button></th>
                <th className="px-5 py-4"><button type="button" onClick={() => setSortBy('status')} className="inline-flex items-center gap-2">Status<ArrowDownWideNarrow className="h-4 w-4" /></button></th>
                <th className="px-5 py-4">Capacity</th>
                <th className="px-5 py-4">Last Updated</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }, (_, index) => (
                    <tr key={index} className="border-b border-navy-border">
                      <td className="px-5 py-4" colSpan={7}><div className="h-14 animate-pulse rounded-2xl bg-slate-800/70" /></td>
                    </tr>
                  ))
                : filteredQueues.map((queue) => {
                    const Icon = stallIcons[queue.stallType];
                    const normalizedLoad = Math.min(100, Math.max(8, queue.estimatedWaitMinutes * 4));
                    return (
                      <tr key={queue.queueId} className={`border-b border-navy-border text-sm transition-colors duration-700 ${flashRows[queue.queueId] ? 'bg-amber-500/12' : 'bg-transparent'}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-navy-border bg-navy-elevated text-slate-200"><Icon className="h-4 w-4" /></span>
                            <div>
                              <p className="font-semibold text-slate-50">{queue.stallName}</p>
                              <p className="text-slate-400">{stallTypeLabel(queue.stallType)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-200 tabular-nums">{queue.currentLength}</td>
                        <td className="px-5 py-4"><WaitTimeBadge minutes={queue.estimatedWaitMinutes} isOpen={queue.isOpen} /></td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${queue.isOpen ? 'border-green-500/30 bg-green-500/15 text-green-300' : 'border-slate-600 bg-slate-700/30 text-slate-400'}`}>
                            {queue.isOpen ? 'OPEN' : 'CLOSED'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-300 tabular-nums">{normalizedLoad}%</td>
                        <td className="px-5 py-4 text-slate-400">{formatDistanceToNowStrict(new Date(queue.lastUpdated), { addSuffix: true })}</td>
                        <td className="px-5 py-4">
                          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-venue-blue/40 bg-venue-blue/15 px-3 py-2 text-sm font-medium text-blue-200">
                            <TimerReset className="h-4 w-4" />
                            Override
                          </button>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
