import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { normalizePhoneNumber } from '../utils/normalizePhoneNumber.js';

// Input validation schema
const GetUserProfileSchema = z.object({
  phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid E.164 phone number format'),
});

// Output schema (for documentation)
export interface UserProfileOutput {
  user_id: string;
  name: string;
  home_zip: string;
  dietary_restrictions: string[];
  allergies: string[];
}

export async function getUserProfile(args: any): Promise<UserProfileOutput | null> {
  // Validate input
  const validated = GetUserProfileSchema.parse(args);
  
  // Normalize phone number to ensure consistent format
  const normalizedPhoneNumber = normalizePhoneNumber(validated.phone_number);

  // Query database with normalized phone number
  const { data, error } = await supabase
    .from('users')
    .select('id, name, home_zip, dietary_restrictions, allergies')
    .eq('phone_number', normalizedPhoneNumber)
    .maybeSingle();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  // Return null if user not found (first-time caller)
  if (!data) {
    return null;
  }

  // Map database fields to expected output format
  return {
    user_id: data.id,
    name: data.name,
    home_zip: data.home_zip,
    dietary_restrictions: data.dietary_restrictions || [],
    allergies: data.allergies || [],
  };
}
