import { z } from "zod";
import { supabase } from "../db/supabase.js";

const CancelReservationSchema = z.object({
  reservation_id: z.string().uuid(),
  phone_number: z.string(),
});

export async function cancelReservation(args: unknown) {
  const validated = CancelReservationSchema.parse(args);
  const { reservation_id, phone_number } = validated;

  const { data, error } = await supabase.rpc("cancel_reservation", {
    p_reservation_id: reservation_id,
    p_phone_number: phone_number,
  });

  if (error) {
    return {
      success: false,
      error: "Cancellation failed",
    };
  }

  const row = Array.isArray(data) ? data[0] : data;

  return row;
}