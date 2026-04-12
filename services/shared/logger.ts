/**
 * @module logger
 * @description Structured JSON logger factory for Cloud Run.
 * Cloud Logging picks up JSON on stdout and maps fields to log viewer columns.
 * All services must use this factory instead of bare console.* calls.
 *
 * @example
 * const logger = createLogger('crowd-density-service')
 * logger.info('ingestSensor', 'Reading processed', { zoneId, occupancy })
 * logger.error('flush', 'Batch write failed', { venue: venueId }, err)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  operation: string;
  message: string;
  context?: Record<string, unknown>;
  error?: string;
}

/**
 * @description Creates a structured logger bound to a named service.
 * Each log call emits a single-line JSON object to stdout, which Cloud
 * Logging ingests as a structured log entry with the correct severity.
 *
 * @param {string} serviceName - The Cloud Run service name (used as the
 *   `service` field in every log entry for filtering in Cloud Logging).
 * @returns {{ debug, info, warn, error }} Logger object with four severity methods.
 *
 * @example
 * const logger = createLogger('notifications-service')
 * logger.warn('sendMessage', 'Retry attempt 2', { messageId: '123' })
 */
export function createLogger(serviceName: string) {
  function log(
    level: LogLevel,
    operation: string,
    message: string,
    context?: Record<string, unknown>,
    error?: unknown
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: serviceName,
      operation,
      message,
      ...(context && { context }),
      ...(error !== undefined && {
        error: error instanceof Error ? error.message : String(error),
      }),
    };
    // Cloud Run captures stdout as structured logs.
    // Map 'debug' to console.log (no console.debug equivalent in Cloud Logging).
    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  return {
    /**
     * @description Emit a DEBUG-level log (verbose, development use only).
     * @param {string} op - Operation / function name for filtering.
     * @param {string} msg - Human-readable message.
     * @param {Record<string, unknown>} [ctx] - Optional structured context.
     */
    debug: (op: string, msg: string, ctx?: Record<string, unknown>) =>
      log('debug', op, msg, ctx),

    /**
     * @description Emit an INFO-level log (normal operational events).
     * @param {string} op - Operation / function name for filtering.
     * @param {string} msg - Human-readable message.
     * @param {Record<string, unknown>} [ctx] - Optional structured context.
     */
    info: (op: string, msg: string, ctx?: Record<string, unknown>) =>
      log('info', op, msg, ctx),

    /**
     * @description Emit a WARN-level log (recoverable anomaly).
     * @param {string} op - Operation / function name for filtering.
     * @param {string} msg - Human-readable message.
     * @param {Record<string, unknown>} [ctx] - Optional structured context.
     */
    warn: (op: string, msg: string, ctx?: Record<string, unknown>) =>
      log('warn', op, msg, ctx),

    /**
     * @description Emit an ERROR-level log (unrecoverable failure).
     * @param {string} op - Operation / function name for filtering.
     * @param {string} msg - Human-readable message.
     * @param {Record<string, unknown>} [ctx] - Optional structured context.
     * @param {unknown} [err] - The caught error (message extracted automatically).
     */
    error: (op: string, msg: string, ctx?: Record<string, unknown>, err?: unknown) =>
      log('error', op, msg, ctx, err),
  };
}
