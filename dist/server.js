"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const persona_1 = require("./persona");
const taskEngine_1 = require("./taskEngine");
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(process.cwd(), "public")));
app.post("/api/command", (req, res) => {
    const command = typeof req.body?.command === "string" ? req.body.command : "";
    try {
        const payload = (0, taskEngine_1.processCommand)(command);
        res.json(payload);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to process command.";
        res.status(400).json({ error: message });
    }
});
app.get("/api/history", (_req, res) => {
    res.json({ history: (0, taskEngine_1.getHistory)() });
});
app.get("/api/persona", (_req, res) => {
    res.json({ persona: (0, persona_1.getPersona)() });
});
app.listen(port, () => {
    console.log(`Voice Commander running at http://localhost:${port}`);
});
