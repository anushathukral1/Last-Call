import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { healthRouter } from './routes/health.js';
import { dynamicVariablesRouter } from './routes/dynamicVariables.js';
import { mcpRouter } from './routes/mcp.js';
import { telnyxToolsRouter } from "./routes/telnyxTools.js";

const app = express();

app.use(cors());
app.use(express.json());

// Root route - must be defined before other routes
app.get("/", (_, res) => {
  res.status(200).json({ 
    message: "Last Call backend running",
    status: "ok",
    endpoints: {
      health: "GET /health",
      dynamicVariables: "POST /telnyx/dynamic-variables",
      telnyxTools: "POST /telnyx/tools/{getUserProfile,createUser,getListings,createReservation}",
      mcpTools: "POST /mcp/tools"
    }
  });
});

app.use(healthRouter);
app.use(dynamicVariablesRouter);
app.use(mcpRouter);
app.use(telnyxToolsRouter);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Server running on :${port}`));