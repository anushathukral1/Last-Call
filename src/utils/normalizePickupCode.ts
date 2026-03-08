/**
 * Normalizes pickup codes to a consistent format for lookup.
 * 
 * Rules:
 * - Trims whitespace
 * - Removes spaces, dashes, and other common separators
 * - Converts to uppercase for case-insensitive matching
 * 
 * Examples:
 * - "ABC-123" -> "ABC123"
 * - "abc 123" -> "ABC123"
 * - "  abc123  " -> "ABC123"
 */
export function normalizePickupCode(pickupCode: string): string {
  return pickupCode
    .trim()
    .replace(/[\s\-_]/g, '')
    .toUpperCase();
}
