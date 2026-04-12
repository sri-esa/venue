import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { DataGrid } from '@mui/x-data-grid'; // E2
import throttle from 'lodash/throttle'; // E1
import debounce from 'lodash/debounce'; // E4
import { create } from 'zustand'; // E3
// import { LineChart, Line } from 'recharts'; // E5

// ---------------------------------------------------------
// E3: Zustand Selector Memoization
// ---------------------------------------------------------
export const useStore = create((set) => ({
  zones: [],
  alerts: [],
  setZones: (zones: any) => set({ zones }),
  addAlert: (alert: any) => set((state: any) => ({ alerts: [...state.alerts, alert] }))
}));

// BAD: useStore(state => state.zones.filter(z => z.isCritical)) -> calculates on every render
// GOOD: E3 Memoized Selector
export const useCriticalZones = () => {
  const zones = useStore((state: any) => state.zones);
  return useMemo(() => zones.filter((z: any) => z.densityLevel === 'CRITICAL'), [zones]);
};

// ---------------------------------------------------------
// E1: Google Maps Overlay Redraw Throttling
// ---------------------------------------------------------
export const HeatmapOverlay: React.FC<{ rawData: any[] }> = ({ rawData }) => {
  const [renderData, setRenderData] = useState<any[]>([]);

  // Throttle updates to Max 2 redraws per second (500ms)
  const throttledUpdate = useMemo(
    () => throttle((data) => setRenderData(data), 500),
    []
  );

  useEffect(() => {
    throttledUpdate(rawData);
  }, [rawData, throttledUpdate]);

  return <div id="map-overlay">Rendering {renderData.length} points</div>;
};

// ---------------------------------------------------------
// E2: MUI DataGrid Virtualization
// ---------------------------------------------------------
export const EventLogTable: React.FC<{ rows: any[] }> = ({ rows }) => {
  // MUI DataGrid natively supports virtualization. We ensure rowHeight is fixed 
  // and we don't disable virtualization.
  return (
    <div style={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={[{ field: 'id' }, { field: 'message' }]}
        rowHeight={50}
        disableVirtualization={false} // ALWAYS FALSE FOR E2 
        hideFooterPagination={true}
      />
    </div>
  );
};

// ---------------------------------------------------------
// E4: Alert Sound & Notification Batching
// ---------------------------------------------------------
export const useBatchedAlerts = () => {
  const queue = useRef<any[]>([]);
  
  const flushAlerts = useCallback(
    debounce(() => {
      if (queue.current.length > 0) {
        // Play one sound for N alerts instead of overlapping 5 audios
        new Audio('/sounds/critical_alert.mp3').play().catch(() => {});
        console.log(`Flushed ${queue.current.length} alerts to UI notification toast.`);
        queue.current = [];
      }
    }, 2000), // Batch rapid alerts inside 2-second windows
    []
  );

  const handleNewAlert = useCallback((alert: any) => {
    queue.current.push(alert);
    flushAlerts();
  }, [flushAlerts]);

  return { handleNewAlert };
};

// ---------------------------------------------------------
// E5: Recharts Real-Time Update Optimization
// ---------------------------------------------------------
export const OptimizedChart = React.memo(({ data }: { data: any[] }) => {
  // Instead of re-rendering the whole tree, React.memo ensures we only
  // redraw when the reference to `data` changes.
  return (
    <div>
      {/* <LineChart data={data}> ... </LineChart> */}
      Optimized Chart Points: {data.length}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom equality: only redraw if the LAST point value fundamentally changed
  if (prevProps.data.length === 0 || nextProps.data.length === 0) return false;
  const prevLast = prevProps.data[prevProps.data.length - 1];
  const nextLast = nextProps.data[nextProps.data.length - 1];
  return prevLast.value === nextLast.value && prevProps.data.length === nextProps.data.length;
});
