// Service: analytics
// Layer: Intelligence Layer
// Implements: Req 10 (Historical Analytics)
import { BigQuery } from '@google-cloud/bigquery';

class BigQueryBuffer {
  private buffers: Map<string, any[]> = new Map();
  private readonly FLUSH_SIZE = parseInt(process.env.FLUSH_SIZE || '500');
  private readonly FLUSH_INTERVAL = parseInt(process.env.FLUSH_INTERVAL || '10000');
  
  constructor(private bq: BigQuery) {
    setInterval(() => {
      for (const tableName of this.buffers.keys()) {
        this.flush(tableName);
      }
    }, this.FLUSH_INTERVAL);
  }

  insert(tableName: string, row: any): void {
    if (!this.buffers.has(tableName)) {
      this.buffers.set(tableName, []);
    }
    this.buffers.get(tableName)!.push(row);
    
    if (this.buffers.get(tableName)!.length >= this.FLUSH_SIZE) {
      // Async flush without awaiting
      this.flush(tableName);
    }
  }

  private async flush(tableName: string): Promise<void> {
    const rows = this.buffers.get(tableName) ?? [];
    if (rows.length === 0) return;
    this.buffers.set(tableName, []); // Clear before async write
    
    try {
      await this.bq.dataset('venue_analytics').table(tableName).insert(rows);
    } catch (e) {
      console.error(`[BQ Buffer] Flush failed for ${tableName}`, e);
    }
  }
}

export class BigQueryService {
  private bq: BigQuery;
  private buffer: BigQueryBuffer;

  constructor() {
    this.bq = new BigQuery({ projectId: process.env.PROJECT_ID || 'smart-venue-dev' });
    this.buffer = new BigQueryBuffer(this.bq);
  }

  async initSchemas() {
    const datasetId = 'venue_analytics';
    const dataset = this.bq.dataset(datasetId);
    
    try {
      const [exists] = await dataset.exists();
      if (!exists) {
        await dataset.create();
        console.log(`Created dataset ${datasetId}`);
      }
      console.log('Ensure tables: crowd_density_log, queue_events_log are created.');
    } catch (e) {
      console.error('BigQuery Init Failed. Ignored for local emulators unless configured.', e);
    }
  }

  async insertDensityLog(payload: any) {
    this.buffer.insert('crowd_density_log', payload);
  }

  async insertQueueLog(payload: any) {
    this.buffer.insert('queue_events_log', payload);
  }
}
