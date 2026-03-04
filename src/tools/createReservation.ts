import { z } from 'zod';
import { supabase } from '../db/supabase.js';

/**
 * Input validation schema
 */
const CreateReservationSchema = z.object({
  listing_id: z.string().uuid('Invalid listing ID format'),
  user_id: z.string().uuid('Invalid user ID format'),
  quantity: z.coerce.number().int().min(1, 'Minimum 1 item').max(10, 'Maximum 10 items per reservation'),
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;

/**
 * RPC row shape (because reserve_listing RETURNS TABLE)
 * Supabase returns data as an array of rows: ReserveListingRow[]
 */
type ReserveListingRow = {
  success: boolean;
  reason: string | null;

  reservation_id: string | null;
  pickup_code: string | null;

  restaurant_name: string | null;
  restaurant_address: string | null;

  item_name: string | null;
  quantity: number | null;
  total_price: string | number | null; // numeric may come back as string
  pickup_deadline: string | null;

  quantity_remaining: number | null;
};

export interface CreateReservationOutput {
  success: boolean;

  // Present on success
  reservation_id?: string;
  pickup_code?: string;
  restaurant_name?: string;
  restaurant_address?: string;
  item_name?: string;
  quantity?: number;
  total_price?: number;
  pickup_deadline?: string;
  quantity_remaining?: number;

  // Present on failure
  error?: {
    code:
      | 'INVALID_INPUT'
      | 'INVALID_QUANTITY'
      | 'LISTING_NOT_FOUND'
      | 'LISTING_EXPIRED'
      | 'INSUFFICIENT_QUANTITY'
      | 'RESTAURANT_NOT_FOUND'
      | 'PICKUP_CODE_GENERATION_FAILED'
      | 'INTERNAL_ERROR';
    message: string; // voice-friendly
    available_quantity?: number;
  };
}

function mapReasonToError(reason: string, row?: ReserveListingRow): CreateReservationOutput['error'] {
  switch (reason) {
    case 'INVALID_INPUT':
      return { code: 'INVALID_INPUT', message: 'Something went wrong with the reservation details. Please try again.' };

    case 'INVALID_QUANTITY':
      return { code: 'INVALID_QUANTITY', message: 'You can reserve between 1 and 10 items.' };

    case 'LISTING_NOT_FOUND':
      return { code: 'LISTING_NOT_FOUND', message: 'That option is no longer available. Want to pick a different one?' };

    case 'LISTING_EXPIRED':
      return { code: 'LISTING_EXPIRED', message: 'That listing has just expired. Want to hear the other options?' };

    case 'INSUFFICIENT_QUANTITY':
      return {
        code: 'INSUFFICIENT_QUANTITY',
        message: row?.quantity_remaining != null
          ? `Only ${row.quantity_remaining} left for that item. Would you like that amount instead, or a different option?`
          : 'There isn’t enough quantity left for that item. Want a different option?',
        available_quantity: row?.quantity_remaining ?? undefined,
      };

    case 'RESTAURANT_NOT_FOUND':
      return { code: 'RESTAURANT_NOT_FOUND', message: 'I couldn’t find the restaurant for that listing. Want to try another option?' };

    case 'PICKUP_CODE_GENERATION_FAILED':
      return { code: 'PICKUP_CODE_GENERATION_FAILED', message: 'I had trouble generating a pickup code. Please try again.' };

    default:
      return { code: 'INTERNAL_ERROR', message: 'Sorry — something went wrong while placing that reservation. Please try again.' };
  }
}

export async function createReservation(args: unknown): Promise<CreateReservationOutput> {
  const validated = CreateReservationSchema.parse(args);
  const { listing_id, user_id, quantity } = validated;

  // Call RPC
  const { data, error } = await supabase.rpc('reserve_listing', {
    p_listing_id: listing_id,
    p_user_id: user_id,
    p_quantity: quantity,
  });

  console.error('[createReservation] rpc result', { data, error });

  // Hard RPC error (DB error, function missing, permission, etc.)
  if (error) {
    // Keep the message useful for logs, but return a safe voice-friendly error
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Sorry — I ran into a technical issue creating that reservation. Please try again.',
      },
    };
  }

  // reserve_listing RETURNS TABLE => data is typically an array with 1 row
  const row = Array.isArray(data) ? (data[0] as ReserveListingRow | undefined) : (data as ReserveListingRow | undefined);

  if (!row) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Sorry — I didn’t get a response from the reservation system. Please try again.',
      },
    };
  }

  // Soft failure: function returned success=false + reason
  if (!row.success) {
    const reason = row.reason ?? 'INTERNAL_ERROR';
    return {
      success: false,
      error: mapReasonToError(reason, row),
    };
  }

  // Success: ensure required fields exist
  if (!row.reservation_id || !row.pickup_code || !row.restaurant_name || !row.restaurant_address || !row.item_name || row.quantity == null || row.total_price == null || !row.pickup_deadline) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Sorry — the reservation was created but the confirmation details were incomplete. Please try again.',
      },
    };
  }

  return {
    success: true,
    reservation_id: row.reservation_id,
    pickup_code: row.pickup_code,
    restaurant_name: row.restaurant_name,
    restaurant_address: row.restaurant_address,
    item_name: row.item_name,
    quantity: row.quantity,
    total_price: Number(row.total_price),
    pickup_deadline: row.pickup_deadline,
    quantity_remaining: row.quantity_remaining ?? undefined,
  };
}