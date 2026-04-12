import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { QueueStatus, QueueFilter, QueueSortField } from '../types/queue.types';

interface QueueState {
  queues: Record<string, QueueStatus>;
  filter: QueueFilter;
  sortBy: QueueSortField;
  isLoading: boolean;
}

interface QueueActions {
  setQueueStatus: (queue: QueueStatus) => void;
  setAllQueues: (queues: QueueStatus[]) => void;
  setFilter: (filter: Partial<QueueFilter>) => void;
  setSortBy: (sortBy: QueueSortField) => void;
  setLoading: (loading: boolean) => void;
}

export const useQueueStore = create<QueueState & QueueActions>()(
  subscribeWithSelector(
    immer((set) => ({
      queues: {},
      filter: { type: 'ALL', status: 'ALL', wait: 'ALL' },
      sortBy: 'wait',
      isLoading: false,

      setQueueStatus: (queue) => set((state) => {
        state.queues[queue.queueId] = queue;
      }),
      setAllQueues: (queues) => set((state) => {
        queues.forEach(q => { state.queues[q.queueId] = q; });
      }),
      setFilter: (filter) => set((state) => {
        state.filter = { ...state.filter, ...filter };
      }),
      setSortBy: (sortBy) => set((state) => { state.sortBy = sortBy; }),
      setLoading: (loading) => set((state) => { state.isLoading = loading; }),
    }))
  )
);

export const useFilteredQueues = () => useQueueStore(state => {
  let list = Object.values(state.queues);
  
  if (state.filter.type !== 'ALL') {
    list = list.filter(q => q.stallType === state.filter.type);
  }
  if (state.filter.status === 'OPEN ONLY') {
    list = list.filter(q => q.isOpen);
  } else if (state.filter.status === 'CLOSED ONLY') {
    list = list.filter(q => !q.isOpen);
  }
  if (state.filter.wait !== 'ALL') {
    list = list.filter(q => {
      if (state.filter.wait === '<5 MIN') return q.estimatedWaitMinutes < 5;
      if (state.filter.wait === '5-15 MIN') return q.estimatedWaitMinutes >= 5 && q.estimatedWaitMinutes <= 15;
      if (state.filter.wait === '>15 MIN') return q.estimatedWaitMinutes > 15;
      return true;
    });
  }

  list.sort((a, b) => {
    switch (state.sortBy) {
      case 'wait': return b.estimatedWaitMinutes - a.estimatedWaitMinutes;
      case 'length': return b.currentLength - a.currentLength;
      case 'name': return a.stallName.localeCompare(b.stallName);
      case 'status': return (a.isOpen === b.isOpen) ? 0 : a.isOpen ? -1 : 1;
      default: return 0;
    }
  });

  return list;
});

export const useLongestQueue = () => useQueueStore(state => {
  const open = Object.values(state.queues).filter(q => q.isOpen);
  if (!open.length) return undefined;
  return open.reduce((prev, curr) => (prev.estimatedWaitMinutes > curr.estimatedWaitMinutes) ? prev : curr);
});

export const useClosedQueues = () => useQueueStore(state => Object.values(state.queues).filter(q => !q.isOpen));
export const useQueueById = (id: string) => useQueueStore(state => state.queues[id]);
