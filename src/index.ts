import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { dynamicVariablesRouter } from './routes/dynamicVariables.js';
import { mcpRouter } from './routes/mcp.js';


const app = express();
app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(dynamicVariablesRouter);
app.use(mcpRouter);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Server running on :${port}`));
app.get("/health", (_, res) => res.status(200).send("ok"));