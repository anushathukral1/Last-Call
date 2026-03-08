import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { normalizePhoneNumber } from '../utils/normalizePhoneNumber.js';

// Input validation schema (for raw input)
const GetUserProfileInputSchema = z.object({
  phone_number: z.string().min(1, 'Phone number is required'),
});

// Validation schema for normalized phone number
const NormalizedPhoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid E.164 phone number format');

// Output schema (for documentation)
export interface UserProfileOutput {
  user_id: string;
  name: string;
  home_zip: string;
  dietary_restrictions: string[];
  allergies: string[];
}

export async function getUserProfile(args: any): Promise<UserProfileOutput | null> {
  // Validate that we have a phone_number string
  const { phone_number } = GetUserProfileInputSchema.parse(args);
  
  // Normalize phone number to ensure consistent format
  const normalizedPhoneNumber = normalizePhoneNumber(phone_number);
  
  // Validate the normalized phone number
  NormalizedPhoneSchema.parse(normalizedPhoneNumber);

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
