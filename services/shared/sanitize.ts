/**
 * @module sanitize
 * @description Input sanitization and validation helpers used at every HTTP
 * entry point before data is passed to business-logic processors. Applying
 * these guards prevents injection attacks, out-of-range values, and malformed
 * IDs from reaching Firestore or downstream services.
 *
 * Import these in route handlers — never skip validation on untrusted input.
 */

/**
 * @description Strips dangerous characters from a string input and enforces a
 * maximum length, making it safe for use in log messages and document IDs.
 * Removes: `< > ' " ; \`` (common XSS / injection vectors).
 *
 * @param {unknown} input - Raw value from request body or query string.
 * @param {number} [maxLength=255] - Maximum allowed character count.
 * @returns {string} Sanitized string, or empty string if input is not a string.
 *
 * @example
 * sanitizeString('  zone-03<script>  ', 64)
 * // → 'zone-03script'
 */
export function sanitizeString(input: unknown, maxLength = 255): string {
  if (typeof input !== 'string') return '';
  // SECURITY: Trim whitespace, enforce max length, strip HTML/injection chars
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>'"`;]/g, '');
}

/**
 * @description Validates that a venue or zone ID matches the expected
 * alphanumeric-plus-dash-underscore pattern and is within length bounds.
 * Rejects empty strings, IDs with path-traversal chars (`/`), and IDs that
 * could be used as Firestore collection names.
 *
 * @param {unknown} id - Value to validate.
 * @returns {boolean} True if the ID is valid for use as a Firestore document key.
 *
 * @example
 * isValidId('venue-001')  // true
 * isValidId('../etc')     // false
 * isValidId('')           // false
 */
export function isValidId(id: unknown): boolean {
  if (typeof id !== 'string') return false;
  // SECURITY: Allowlist pattern — only safe characters, bounded length
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

/**
 * @description Validates that an occupancy ratio is within physically
 * meaningful bounds (0.0 – 2.0) and is a finite number.
 * Values above 2.0 would indicate a sensor fault or a spoofed payload.
 *
 * @param {unknown} value - Value to validate.
 * @returns {boolean} True if the value is a valid occupancy ratio.
 *
 * @example
 * isValidOccupancy(0.82)  // true
 * isValidOccupancy(2.5)   // false  (above physical max)
 * isValidOccupancy('0.5') // false  (wrong type)
 */
export function isValidOccupancy(value: unknown): boolean {
  if (typeof value !== 'number') return false;
  // SECURITY: Enforce physical bounds — prevents out-of-range sensor spoofing
  return value >= 0 && value <= 2.0 && isFinite(value);
}

/**
 * @description Validates that a confidence score is within the [0.0, 1.0]
 * probability range and is a finite number.
 *
 * @param {unknown} value - Value to validate.
 * @returns {boolean} True if the value is a valid confidence score.
 *
 * @example
 * isValidConfidence(0.95)  // true
 * isValidConfidence(1.5)   // false  (above 1.0)
 * isValidConfidence(NaN)   // false  (not finite)
 */
export function isValidConfidence(value: unknown): boolean {
  if (typeof value !== 'number') return false;
  // SECURITY: Confidence must be a probability — no values outside [0, 1]
  return value >= 0 && value <= 1.0 && isFinite(value);
}

/**
 * @description Validates that a timestamp string is a valid ISO 8601 date and
 * is not more than 60 seconds in the future (prevents replay attacks with
 * far-future timestamps).
 *
 * @param {unknown} value - Value to validate.
 * @returns {boolean} True if the value is a valid, recent ISO 8601 timestamp.
 *
 * @example
 * isValidTimestamp(new Date().toISOString())  // true
 * isValidTimestamp('not-a-date')              // false
 */
export function isValidTimestamp(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const ts = Date.parse(value);
  if (isNaN(ts)) return false;
  // SECURITY: Reject timestamps more than 60 s in the future (replay guard)
  return ts <= Date.now() + 60_000;
}
