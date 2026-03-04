import { Router } from 'express';

import { getUserProfile } from '../tools/getUserProfile.js';
import { createUser } from '../tools/createUser.js';
import { getListings } from '../tools/getListings.js';
import { createReservation } from '../tools/createReservation.js';

export const mcpRouter = Router();

// Optional: makes browser visits clearer
mcpRouter.get('/mcp/tools', (_req, res) => {
  res.json({ ok: true, message: 'Use POST /mcp/tools' });
});

mcpRouter.post('/mcp/tools', async (req, res) => {
  console.log('MCP HIT', req.body);

  const { tool, args } = req.body;

  try {
    switch (tool) {
      case 'getUserProfile':
        return res.json(await getUserProfile(args));

      case 'createUser':
        return res.json(await createUser(args));

      case 'getListings':
        return res.json(await getListings(args));

      case 'createReservation':
        return res.json(await createReservation(args));

      default:
        return res.status(400).json({ error: 'Unknown tool' });
    }
  } catch (err) {
    console.error('MCP ERROR', err);
    return res.status(500).json({ error: 'Tool execution failed' });
  }
});