import { Router } from "express";
import { getUserProfile } from "../tools/getUserProfile.js";
import { createUser } from "../tools/createUser.js";
import { getListings } from "../tools/getListings.js";
import { createReservation } from "../tools/createReservation.js";
import { cancelReservation } from "../tools/cancelReservation.js";

export const telnyxToolsRouter = Router();

// helper log formatter
function logToolStart(path: string, body: any) {
  console.log("--------------------------------------------------");
  console.log("TELNYX TOOL HIT:", path);
  console.log("REQUEST BODY:", JSON.stringify(body, null, 2));
}

function logToolSuccess(path: string, result: any) {
  console.log("TOOL SUCCESS:", path);
  console.log("RESPONSE:", JSON.stringify(result, null, 2));
  console.log("--------------------------------------------------");
}

function logToolError(path: string, error: any) {
  console.error("TOOL ERROR:", path);
  console.error(error);
  console.log("--------------------------------------------------");
}

telnyxToolsRouter.post("/telnyx/tools/getUserProfile", async (req, res) => {
  const path = "/telnyx/tools/getUserProfile";
  logToolStart(path, req.body);

  try {
    const result = await getUserProfile(req.body);
    logToolSuccess(path, result);
    return res.json(result);
  } catch (e) {
    logToolError(path, e);
    return res.status(500).json({ error: "getUserProfile failed" });
  }
});

telnyxToolsRouter.post("/telnyx/tools/createUser", async (req, res) => {
  const path = "/telnyx/tools/createUser";
  logToolStart(path, req.body);

  try {
    const result = await createUser(req.body);
    logToolSuccess(path, result);
    return res.json(result);
  } catch (e) {
    logToolError(path, e);
    return res.status(500).json({ error: "createUser failed" });
  }
});

telnyxToolsRouter.post("/telnyx/tools/getListings", async (req, res) => {
  const path = "/telnyx/tools/getListings";
  logToolStart(path, req.body);

  try {
    const result = await getListings(req.body);
    logToolSuccess(path, result);
    return res.json(result);
  } catch (e) {
    logToolError(path, e);
    return res.status(500).json({ error: "getListings failed" });
  }
});

telnyxToolsRouter.post("/telnyx/tools/createReservation", async (req, res) => {
  const path = "/telnyx/tools/createReservation";
  logToolStart(path, req.body);

  try {
    const result = await createReservation(req.body);
    logToolSuccess(path, result);
    return res.json(result);
  } catch (e) {
    logToolError(path, e);
    return res.status(500).json({ error: "createReservation failed" });
  }
});

telnyxToolsRouter.post("/telnyx/tools/cancelReservation", async (req, res) => {
  const path = "/telnyx/tools/cancelReservation";
  logToolStart(path, req.body);

  try {
    const result = await cancelReservation(req.body);
    logToolSuccess(path, result);
    return res.json(result);
  } catch (e) {
    logToolError(path, e);
    return res.status(500).json({ error: "cancelReservation failed" });
  }
});
