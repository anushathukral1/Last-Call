import { Router } from "express";
import { z } from "zod";
import { supabase } from "../db/supabase.js";

export const dynamicVariablesRouter = Router();

const TelnyxInitSchema = z.object({
  data: z.object({
    payload: z.object({
      telnyx_end_user_target: z.string().optional(), // caller number (E.164)
      // call_control_id: z.string().optional(), // useful later, optional
    }).passthrough(),
  }).passthrough(),
}).passthrough();

dynamicVariablesRouter.post("/telnyx/dynamic-variables", async (req, res) => {
  const parsed = TelnyxInitSchema.safeParse(req.body);
  if (!parsed.success) {
    // Telnyx will fail the init if you 400; but better to return *something*
    return res.status(200).json({
      dynamic_variables: {
        is_new_user: true,
        caller_phone: null,
      },
    });
  }

  const callerPhone = parsed.data.data.payload.telnyx_end_user_target || null;

  if (!callerPhone) {
    return res.status(200).json({
      dynamic_variables: {
        is_new_user: true,
        caller_phone: null,
      },
    });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id,name,home_zip")
    .eq("phone_number", callerPhone)
    .maybeSingle();

  if (error) {
    // don’t 500 — better to still let the call proceed
    return res.status(200).json({
      dynamic_variables: {
        caller_phone: callerPhone,
        is_new_user: true,
        db_error: true,
      },
    });
  }

  if (!data) {
    return res.status(200).json({
      dynamic_variables: {
        caller_phone: callerPhone,
        is_new_user: true,
      },
    });
  }

  return res.status(200).json({
    dynamic_variables: {
      caller_phone: callerPhone,
      is_new_user: false,
      user_id: data.id,
      user_name: data.name,
      home_zip: data.home_zip,
    },
  });
});