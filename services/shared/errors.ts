/**
 * @module errors
 * @description Typed error hierarchy for the Smart Venue Management System.
 * All service errors must extend VenueSystemError so upstream handlers can
 * map error codes to HTTP status codes consistently.
 */

/**
 * @description Base error class for all venue system errors. Carries a
 * machine-readable code and an HTTP status code so Fastify route handlers
 * can map errors to responses without string matching.
 */
export class VenueSystemError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'VenueSystemError';
    // Restore prototype chain (required when extending built-in Error in TS)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * @description Thrown when a request payload fails schema or business-rule
 * validation before any processing occurs. Maps to HTTP 400.
 * @example throw new ValidationError('Missing zoneId', { body: raw })
 */
export class ValidationError extends VenueSystemError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

/**
 * @description Thrown when a Firestore read or write operation fails.
 * Maps to HTTP 503 (downstream service unavailable).
 * @example throw new FirestoreError('Write failed', { collection: 'zones' })
 */
export class FirestoreError extends VenueSystemError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'FIRESTORE_ERROR', 503, context);
    this.name = 'FirestoreError';
  }
}

/**
 * @description Thrown when an IoT sensor reading is outside acceptable
 * operating parameters. Maps to HTTP 422 (semantically invalid).
 * @example throw new SensorError('Occupancy out of range', { occupancy: 2.5 })
 */
export class SensorError extends VenueSystemError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'SENSOR_ERROR', 422, context);
    this.name = 'SensorError';
  }
}

/**
 * @description Thrown when an FCM delivery or token-refresh operation fails.
 * Maps to HTTP 502 (bad gateway — upstream FCM API error).
 * @example throw new NotificationError('FCM returned 401', { projectId })
 */
export class NotificationError extends VenueSystemError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NOTIFICATION_ERROR', 502, context);
    this.name = 'NotificationError';
  }
}
