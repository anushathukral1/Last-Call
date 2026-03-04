import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';

export const dynamicVariablesRouter = Router();

const BodySchema = z.object({
  phone_number: z.string().min(3),
});

dynamicVariablesRouter.post('/webhook/dynamic-variables', async (req, res) => {
  const parsed = BodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body' });
  }

  const { phone_number } = parsed.data;

  const { data, error } = await supabase
    .from('users')
    .select('id,name,home_zip')
    .eq('phone_number', phone_number)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: 'Database error' });
  }

  if (!data) {
    return res.json({ is_new_user: true });
  }

  return res.json({
    is_new_user: false,
    user_id: data.id,
    user_name: data.name,
    home_zip: data.home_zip,
  });
});