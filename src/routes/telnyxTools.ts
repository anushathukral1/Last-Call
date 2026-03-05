import { Router } from "express";
import { getUserProfile } from "../tools/getUserProfile.js";
import { createUser } from "../tools/createUser.js";
import { getListings } from "../tools/getListings.js";
import { createReservation } from "../tools/createReservation.js";

export const telnyxToolsRouter = Router();

telnyxToolsRouter.post("/telnyx/tools/getUserProfile", async (req, res) => {
  try { return res.json(await getUserProfile(req.body)); }
  catch (e) { return res.status(500).json({ error: "getUserProfile failed" }); }
});

telnyxToolsRouter.post("/telnyx/tools/createUser", async (req, res) => {
  try { return res.json(await createUser(req.body)); }
  catch (e) { return res.status(500).json({ error: "createUser failed" }); }
});

telnyxToolsRouter.post("/telnyx/tools/getListings", async (req, res) => {
  try { return res.json(await getListings(req.body)); }
  catch (e) { return res.status(500).json({ error: "getListings failed" }); }
});

telnyxToolsRouter.post("/telnyx/tools/createReservation", async (req, res) => {
  try { return res.json(await createReservation(req.body)); }
  catch (e) { return res.status(500).json({ error: "createReservation failed" }); }
});