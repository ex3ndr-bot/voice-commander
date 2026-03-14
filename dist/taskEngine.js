"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistory = exports.processCommand = void 0;
const persona_1 = require("./persona");
const history = [];
const getTopics = (command) => {
    const normalized = command.toLowerCase();
    const topics = new Set();
    if (normalized.match(/file|folder|desktop|workspace/)) {
        topics.add("files");
    }
    if (normalized.match(/document|pdf|report|invoice/)) {
        topics.add("documents");
    }
    if (normalized.match(/summary|summarize|brief|digest/)) {
        topics.add("summaries");
    }
    if (normalized.match(/email|message|slack/)) {
        topics.add("communication");
    }
    if (topics.size === 0) {
        topics.add("general");
    }
    return [...topics];
};
const resolveAction = (command) => {
    const normalized = command.toLowerCase();
    if (normalized.includes("organize files")) {
        return "organize-files";
    }
    if (normalized.includes("classify documents")) {
        return "classify-documents";
    }
    if (normalized.includes("summarize text")) {
        return "summarize-text";
    }
    if (normalized.includes("organize")) {
        return "organize";
    }
    if (normalized.includes("classify")) {
        return "classify";
    }
    if (normalized.includes("summarize")) {
        return "summarize";
    }
    return "general-assistant";
};
const simulateResult = (action, command, topics) => {
    switch (action) {
        case "organize-files":
        case "organize":
            return "Organized 24 workspace items into source, assets, docs, and archive groups. Generated a cleanup preview with safe rename suggestions.";
        case "classify-documents":
        case "classify":
            return "Classified 18 documents into contracts, specs, notes, and financial records. Flagged 3 ambiguous files for review.";
        case "summarize-text":
        case "summarize":
            return "Produced a concise summary with key decisions, action items, and unresolved questions. Readiness score: 92%.";
        default:
            return `Simulated local agent execution for "${command}" across ${topics.join(", ")} workflows. Prepared the next suggested step and command context.`;
    }
};
const processCommand = (command) => {
    const trimmed = command.trim();
    if (!trimmed) {
        throw new Error("Command text is required.");
    }
    const topics = getTopics(trimmed);
    const action = resolveAction(trimmed);
    const result = simulateResult(action, trimmed, topics);
    const record = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        command: trimmed,
        action,
        topics,
        result,
        status: "completed",
        createdAt: new Date().toISOString()
    };
    history.unshift(record);
    const persona = (0, persona_1.recordPersonaSignal)(trimmed, topics);
    return { record, persona };
};
exports.processCommand = processCommand;
const getHistory = () => history;
exports.getHistory = getHistory;
