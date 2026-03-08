/**
 * Normalizes phone numbers to a consistent E.164 format for storage and lookup.
 * 
 * Rules:
 * - Trims whitespace
 * - Removes spaces, dashes, parentheses
 * - If the number already starts with `+`, keeps it after cleanup
 * - If it is exactly 10 digits, converts to `+1XXXXXXXXXX`
 * - If it is 11 digits and starts with `1`, converts to `+XXXXXXXXXXX`
 * - Otherwise returns the cleaned value unchanged
 * 
 * Examples:
 * - "4157986793" -> "+14157986793"
 * - "+14157986793" -> "+14157986793"
 * - "14157986793" -> "+14157986793"
 * - "(415) 798-6793" -> "+14157986793"
 * - "+44 20 7946 0958" -> "+442079460958"
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Trim whitespace
  let cleaned = phoneNumber.trim();
  
  // Check if it starts with + before cleanup
  const hasPlus = cleaned.startsWith('+');
  
  // Remove spaces, dashes, parentheses, and + for processing
  cleaned = cleaned.replace(/[\s\-()]/g, '');
  
  // Remove + if present (we'll add it back as needed)
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Apply normalization rules
  if (!hasPlus) {
    // If exactly 10 digits, assume US number and add +1
    if (/^\d{10}$/.test(cleaned)) {
      return `+1${cleaned}`;
    }
    
    // If 11 digits starting with 1, add +
    if (/^1\d{10}$/.test(cleaned)) {
      return `+${cleaned}`;
    }
  }
  
  // For numbers that already had +, or don't match above rules, return with +
  return `+${cleaned}`;
}
