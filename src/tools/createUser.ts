import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { normalizePhoneNumber } from '../utils/normalizePhoneNumber.js';

// Input validation schema (for raw input)
const CreateUserInputSchema = z.object({
  phone_number: z.string().min(1, 'Phone number is required'),
  name: z.string().min(1).max(100),
  home_zip: z.string().regex(/^\d{5}$/, 'Invalid ZIP code format (must be 5 digits)'),
  dietary_restrictions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
});

// Validation schema for normalized phone number
const NormalizedPhoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid E.164 phone number format');

// Output schema
export interface CreateUserOutput {
  user_id: string;
  name: string;
  home_zip: string;
  dietary_restrictions: string[];
  allergies: string[];
  success: boolean;
}

export async function createUser(args: any): Promise<CreateUserOutput> {
  // Validate input
  const { phone_number, name, home_zip, dietary_restrictions, allergies } = CreateUserInputSchema.parse(args);
  
  // Normalize phone number to ensure consistent format
  const normalizedPhoneNumber = normalizePhoneNumber(phone_number);
  
  // Validate the normalized phone number
  NormalizedPhoneSchema.parse(normalizedPhoneNumber);

  // Insert user with normalized phone number
  const { data, error } = await supabase
    .from('users')
    .insert({
      phone_number: normalizedPhoneNumber,
      name,
      home_zip,
      dietary_restrictions,
      allergies,
    })
    .select('id, name, home_zip, dietary_restrictions, allergies')
    .single();

  if (error) {
    // Handle duplicate phone number
    if (error.code === '23505') {
      throw new Error('DUPLICATE_KEY: User with this phone number already exists');
    }
    throw new Error(`Database error: ${error.message}`);
  }

  // Return formatted response
  return {
    user_id: data.id,
    name: data.name,
    home_zip: data.home_zip,
    dietary_restrictions: data.dietary_restrictions || [],
    allergies: data.allergies || [],
    success: true,
  };
}
