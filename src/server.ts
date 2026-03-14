import express, { Request, Response } from "express";
import path from "path";
import { getPersona } from "./persona";
import { getHistory, processCommand } from "./taskEngine";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

app.post("/api/command", (req: Request, res: Response) => {
  const command = typeof req.body?.command === "string" ? req.body.command : "";

  try {
    const payload = processCommand(command);
    res.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process command.";
    res.status(400).json({ error: message });
  }
});

app.get("/api/history", (_req: Request, res: Response) => {
  res.json({ history: getHistory() });
});

app.get("/api/persona", (_req: Request, res: Response) => {
  res.json({ persona: getPersona() });
});

app.listen(port, () => {
  console.log(`Voice Commander running at http://localhost:${port}`);
});
