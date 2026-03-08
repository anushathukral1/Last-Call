import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { normalizePhoneNumber } from '../utils/normalizePhoneNumber.js';
import { normalizePickupCode } from '../utils/normalizePickupCode.js';

// Input validation schema (for raw input)
const CancelReservationInputSchema = z.object({
  pickup_code: z.string().min(1, 'Pickup code is required'),
  phone_number: z.string().min(1, 'Phone number is required'),
});

// Validation schema for normalized phone number
const NormalizedPhoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid E.164 phone number format');

export interface CancelReservationOutput {
  success: boolean;
  restaurant_name?: string;
  item_name?: string;
  message?: string;
  error?: {
    code: 
      | 'INVALID_INPUT'
      | 'USER_NOT_FOUND' 
      | 'RESERVATION_NOT_FOUND'
      | 'ALREADY_CANCELLED'
      | 'INTERNAL_ERROR';
    message: string;
  };
}

export async function cancelReservation(args: unknown): Promise<CancelReservationOutput> {
  try {
    // Validate input
    const { pickup_code, phone_number } = CancelReservationInputSchema.parse(args);
    
    // Normalize phone number and pickup code
    const normalizedPhoneNumber = normalizePhoneNumber(phone_number);
    const normalizedPickupCode = normalizePickupCode(pickup_code);
    
    // Validate the normalized phone number
    NormalizedPhoneSchema.parse(normalizedPhoneNumber);

    // 1. Look up the user by phone number
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', normalizedPhoneNumber)
      .maybeSingle();

    if (userError) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Sorry — I had trouble looking up your account. Please try again.',
        },
      };
    }

    if (!user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'I could not find your account with that phone number.',
        },
      };
    }

    // 2. Find the reservation by pickup_code and user_id
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        id,
        listing_id,
        quantity,
        pickup_code,
        listings (
          id,
          item_name,
          quantity,
          restaurants (
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('pickup_code', normalizedPickupCode)
      .maybeSingle();

    if (reservationError) {
      console.error('[cancelReservation] Database error looking up reservation:', reservationError);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Sorry — I had trouble finding that reservation. Please try again.',
        },
      };
    }

    if (!reservation) {
      return {
        success: false,
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: `I couldn't find a reservation with pickup code ${pickup_code.toUpperCase()} for your account. Please check the code and try again.`,
        },
      };
    }

    // Extract nested data
    const listing = Array.isArray(reservation.listings) 
      ? reservation.listings[0] 
      : reservation.listings;
    
    const restaurant = listing?.restaurants 
      ? (Array.isArray(listing.restaurants) ? listing.restaurants[0] : listing.restaurants)
      : null;

    const restaurantName = restaurant?.name || 'the restaurant';
    const itemName = listing?.item_name || 'your items';

    // 3. Restore listing quantity
    if (reservation.listing_id && listing) {
      const newQuantity = (listing.quantity || 0) + reservation.quantity;
      const { error: updateError } = await supabase
        .from('listings')
        .update({ quantity: newQuantity })
        .eq('id', reservation.listing_id);

      if (updateError) {
        console.error('[cancelReservation] Failed to restore listing quantity:', updateError);
        // Continue with cancellation even if quantity update fails
      }
    }

    // 4. Delete the reservation
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservation.id);

    if (deleteError) {
      console.error('[cancelReservation] Failed to delete reservation:', deleteError);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Sorry — I had trouble cancelling that reservation. Please try again.',
        },
      };
    }

    // 5. Return success with voice-friendly message
    return {
      success: true,
      restaurant_name: restaurantName,
      item_name: itemName,
      message: `Your reservation for ${itemName} at ${restaurantName} has been cancelled.`,
    };

  } catch (error) {
    console.error('[cancelReservation] Unexpected error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Please provide both your pickup code and phone number.',
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Sorry — something went wrong while cancelling your reservation. Please try again.',
      },
    };
  }
}
