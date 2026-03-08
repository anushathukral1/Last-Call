import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { healthRouter } from './routes/health.js';
import { dynamicVariablesRouter } from './routes/dynamicVariables.js';
import { mcpRouter } from './routes/mcp.js';
import { telnyxToolsRouter } from "./routes/telnyxTools.js";

import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(cors());
app.use(express.json());

// Needed to resolve directory when using ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../public")));

// Root route (loads landing page)
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// API routes
app.use(healthRouter);
app.use(dynamicVariablesRouter);
app.use(mcpRouter);
app.use(telnyxToolsRouter);

// Start server
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Server running on :${port}`));