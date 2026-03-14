"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordPersonaSignal = exports.getPersona = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const personaPath = path_1.default.join(process.cwd(), "persona.json");
const defaultPersona = () => ({
    preferences: [
        "Prefers voice-first task execution",
        "Uses concise command phrasing",
        "Works across organization, document, and summarization flows"
    ],
    frequentCommands: [],
    topics: [],
    totalCommands: 0,
    lastUpdated: null
});
const ensurePersonaFile = () => {
    if (!fs_1.default.existsSync(personaPath)) {
        fs_1.default.writeFileSync(personaPath, JSON.stringify(defaultPersona(), null, 2), "utf-8");
    }
};
const getPersona = () => {
    ensurePersonaFile();
    try {
        const content = fs_1.default.readFileSync(personaPath, "utf-8");
        return JSON.parse(content);
    }
    catch {
        const persona = defaultPersona();
        fs_1.default.writeFileSync(personaPath, JSON.stringify(persona, null, 2), "utf-8");
        return persona;
    }
};
exports.getPersona = getPersona;
const updateRankedList = (items, matcher, factory) => {
    const next = [...items];
    const match = next.find(matcher);
    if (match) {
        match.count += 1;
    }
    else {
        next.push(factory());
    }
    return next.sort((a, b) => b.count - a.count).slice(0, 8);
};
const inferPreferences = (command, topics) => {
    const preferences = new Set();
    const normalized = command.toLowerCase();
    if (normalized.includes("organize")) {
        preferences.add("Often asks for workspace cleanup and organization");
    }
    if (normalized.includes("classify")) {
        preferences.add("Values structured document categorization");
    }
    if (normalized.includes("summarize")) {
        preferences.add("Frequently distills information into summaries");
    }
    if (command.split(/\s+/).length <= 4) {
        preferences.add("Prefers short, direct commands");
    }
    if (topics.includes("files") || topics.includes("documents")) {
        preferences.add("Works heavily with file and document operations");
    }
    return [...preferences];
};
const recordPersonaSignal = (command, topics) => {
    const persona = (0, exports.getPersona)();
    const normalizedCommand = command.trim().toLowerCase();
    const inferredPreferences = inferPreferences(command, topics);
    persona.totalCommands += 1;
    persona.lastUpdated = new Date().toISOString();
    persona.frequentCommands = updateRankedList(persona.frequentCommands, (item) => item.command === normalizedCommand, () => ({ command: normalizedCommand, count: 1 }));
    for (const topic of topics) {
        persona.topics = updateRankedList(persona.topics, (item) => item.topic === topic, () => ({ topic, count: 1 }));
    }
    persona.preferences = [...new Set([...persona.preferences, ...inferredPreferences])].slice(0, 8);
    fs_1.default.writeFileSync(personaPath, JSON.stringify(persona, null, 2), "utf-8");
    return persona;
};
exports.recordPersonaSignal = recordPersonaSignal;
