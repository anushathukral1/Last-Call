import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { normalizePhoneNumber } from '../utils/normalizePhoneNumber.js';

// Input validation schema
const CreateUserSchema = z.object({
  phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid E.164 phone number format'),
  name: z.string().min(1).max(100),
  home_zip: z.string().regex(/^\d{5}$/, 'Invalid ZIP code format (must be 5 digits)'),
  dietary_restrictions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
});

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
  const validated = CreateUserSchema.parse(args);
  const { name, home_zip, dietary_restrictions, allergies } = validated;
  
  // Normalize phone number to ensure consistent format
  const normalizedPhoneNumber = normalizePhoneNumber(validated.phone_number);

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
