/**
 * @module constants
 * @description Single source of truth for every numeric threshold, limit, and
 * configuration value across all Smart Venue Management System services.
 * Import named constants instead of using magic literals in business logic.
 *
 * @example
 * import { DENSITY_THRESHOLDS, QUEUE_RULES } from '../../shared/constants'
 * if (occupancy >= DENSITY_THRESHOLDS.HIGH) { ... }
 */

// ─── Crowd density classification ────────────────────────────────────────────

/**
 * Occupancy ratio thresholds (0.0 – 2.0) used by CrowdDensityProcessor
 * to classify a zone into one of four density levels.
 */
export const DENSITY_THRESHOLDS = {
  /** Zone is operating normally — below 50 % capacity. */
  LOW: 0.50,
  /** Zone is moderately busy — 50–75 % capacity. */
  MEDIUM: 0.75,
  /** Zone is very busy — 75–90 % capacity. */
  HIGH: 0.90,
  /** Zone is at or above capacity — triggers an alert. */
  OVERFLOW: 1.0,
} as const;

// ─── Alert hysteresis & deduplication ────────────────────────────────────────

/**
 * Rules governing when density alerts are raised, sustained, or cleared.
 * Hysteresis prevents alert flapping when occupancy hovers near a threshold.
 */
export const ALERT_RULES = {
  /** Consecutive readings at a higher level required to upgrade classification. */
  HYSTERESIS_UPGRADE_READINGS: 3,
  /** Consecutive readings at a lower level required to downgrade classification. */
  HYSTERESIS_DOWNGRADE_READINGS: 5,
  /** Readings at HIGH level required to fire a sustained-high alert. */
  HIGH_SUSTAINED_READINGS: 10,
  /** Minimum seconds between duplicate alerts for the same zone. */
  DEDUP_WINDOW_SECONDS: 3,
  /** Seconds since last sensor reading before a sensor is deemed stale. */
  STALE_SENSOR_SECONDS: 30,
  /** Milliseconds between health-check cycles. */
  HEALTH_CHECK_INTERVAL_MS: 10_000,
} as const;

// ─── Queue management ─────────────────────────────────────────────────────────

/**
 * Service-rate and surge-modifier constants used by QueueProcessor to
 * estimate queue wait times.
 */
export const QUEUE_RULES = {
  /** Average seconds to serve one customer at a food stall. */
  FOOD_SERVICE_RATE_SECONDS: 45,
  /** Average seconds to serve one customer at a drinks stall. */
  DRINKS_SERVICE_RATE_SECONDS: 30,
  /** Average seconds to serve one customer at a merchandise stall. */
  MERCHANDISE_SERVICE_RATE_SECONDS: 120,
  /** Average seconds to serve one customer at a restroom. */
  RESTROOM_SERVICE_RATE_SECONDS: 90,
  /** Wait-time multiplier when nearby zone density is CRITICAL. */
  CRITICAL_SURGE_MODIFIER: 1.4,
  /** Wait-time multiplier during half-time / high-demand windows. */
  HALFTIME_MODIFIER: 1.6,
  /** Flat minutes added when queue length exceeds LARGE_QUEUE_THRESHOLD. */
  LARGE_QUEUE_FLAT_MINUTES: 2,
  /** Queue length above which operational slowdown penalty is applied. */
  LARGE_QUEUE_THRESHOLD: 20,
  /** Minutes after which a manual staff override automatically expires. */
  OVERRIDE_EXPIRY_MINUTES: 10,
  /** Minutes without an update before a queue entry is marked stale. */
  STALE_QUEUE_MINUTES: 5,
  /** Arbitrary wait-time threshold (minutes) that triggers a surge alert. */
  SURGE_ALERT_THRESHOLD_MINUTES: 20,
} as const;

// ─── GCP free-tier limits ─────────────────────────────────────────────────────

/**
 * GCP free-tier limits used for capacity planning, batch sizing, and
 * usage dashboards. All values sourced from the GCP free-tier documentation.
 */
export const FREE_TIER_LIMITS = {
  /** Maximum Firestore document reads per day on the free tier. */
  FIRESTORE_DAILY_READS: 50_000,
  /** Maximum Firestore document writes per day on the free tier. */
  FIRESTORE_DAILY_WRITES: 20_000,
  /** Maximum documents per Firestore batch write. */
  BATCH_SIZE: 12,
  /** Milliseconds between batch flush cycles. */
  BATCH_INTERVAL_MS: 500,
  /** Maximum Cloud Run requests per month on the free tier. */
  CLOUD_RUN_MONTHLY_REQUESTS: 2_000_000,
} as const;

// ─── Cache TTL configuration ──────────────────────────────────────────────────

/**
 * In-memory cache expiry values (milliseconds) used across services.
 * Tuned to balance data freshness against GCP API quota consumption.
 */
export const CACHE_CONFIG = {
  /** Gemini response TTL for non-personalized queries. */
  GEMINI_MEMORY_TTL_MS: 30_000,
  /** Gemini response TTL for personalized attendee queries. */
  GEMINI_PERSONALIZED_TTL_MS: 15_000,
  /** Maximum number of entries in the Gemini in-memory LRU cache. */
  GEMINI_MAX_ENTRIES: 100,
  /** Zone density read cache TTL (avoids redundant Firestore reads). */
  ZONE_DENSITY_CACHE_MS: 2_000,
  /** Heat-map aggregation cache TTL. */
  HEATMAP_CACHE_MS: 5_000,
} as const;

// ─── Health monitor thresholds ────────────────────────────────────────────────

/**
 * Sensor drop-rate and Firestore RTT thresholds used by HealthMonitor to
 * compute the current system health state.
 */
export const HEALTH_THRESHOLDS = {
  /** Number of sensors expected to be active at full health. */
  EXPECTED_SENSOR_COUNT: 12,
  /** Sensor drop rate (0–1) above which state is CRITICAL. */
  DROP_RATE_CRITICAL: 0.8,
  /** Sensor drop rate (0–1) above which state is PARTIAL. */
  DROP_RATE_PARTIAL: 0.5,
  /** Sensor drop rate (0–1) above which state is DEGRADED. */
  DROP_RATE_DEGRADED: 0.2,
  /** Firestore RTT (ms) above which state is CRITICAL. */
  RTT_CRITICAL_MS: 5_000,
  /** Firestore RTT (ms) above which state is DEGRADED. */
  RTT_DEGRADED_MS: 2_000,
  /** Milliseconds a sensor can be silent before it is counted as inactive. */
  SENSOR_ACTIVE_WINDOW_MS: 30_000,
} as const;
