import { PersonaData, recordPersonaSignal } from "./persona";

export interface CommandRecord {
  id: string;
  command: string;
  action: string;
  topics: string[];
  result: string;
  status: "completed";
  createdAt: string;
}

export interface CommandResponse {
  record: CommandRecord;
  persona: PersonaData;
}

const history: CommandRecord[] = [];

const getTopics = (command: string): string[] => {
  const normalized = command.toLowerCase();
  const topics = new Set<string>();

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

const resolveAction = (command: string): string => {
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

const simulateResult = (action: string, command: string, topics: string[]): string => {
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

export const processCommand = (command: string): CommandResponse => {
  const trimmed = command.trim();

  if (!trimmed) {
    throw new Error("Command text is required.");
  }

  const topics = getTopics(trimmed);
  const action = resolveAction(trimmed);
  const result = simulateResult(action, trimmed, topics);

  const record: CommandRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    command: trimmed,
    action,
    topics,
    result,
    status: "completed",
    createdAt: new Date().toISOString()
  };

  history.unshift(record);
  const persona = recordPersonaSignal(trimmed, topics);

  return { record, persona };
};

export const getHistory = (): CommandRecord[] => history;
