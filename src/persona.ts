import fs from "fs";
import path from "path";

export interface PersonaData {
  preferences: string[];
  frequentCommands: Array<{ command: string; count: number }>;
  topics: Array<{ topic: string; count: number }>;
  totalCommands: number;
  lastUpdated: string | null;
}

const personaPath = path.join(process.cwd(), "persona.json");

const defaultPersona = (): PersonaData => ({
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

const ensurePersonaFile = (): void => {
  if (!fs.existsSync(personaPath)) {
    fs.writeFileSync(personaPath, JSON.stringify(defaultPersona(), null, 2), "utf-8");
  }
};

export const getPersona = (): PersonaData => {
  ensurePersonaFile();

  try {
    const content = fs.readFileSync(personaPath, "utf-8");
    return JSON.parse(content) as PersonaData;
  } catch {
    const persona = defaultPersona();
    fs.writeFileSync(personaPath, JSON.stringify(persona, null, 2), "utf-8");
    return persona;
  }
};

const updateRankedList = <T extends { count: number }>(
  items: T[],
  matcher: (item: T) => boolean,
  factory: () => T
): T[] => {
  const next = [...items];
  const match = next.find(matcher);

  if (match) {
    match.count += 1;
  } else {
    next.push(factory());
  }

  return next.sort((a, b) => b.count - a.count).slice(0, 8);
};

const inferPreferences = (command: string, topics: string[]): string[] => {
  const preferences = new Set<string>();
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

export const recordPersonaSignal = (command: string, topics: string[]): PersonaData => {
  const persona = getPersona();
  const normalizedCommand = command.trim().toLowerCase();
  const inferredPreferences = inferPreferences(command, topics);

  persona.totalCommands += 1;
  persona.lastUpdated = new Date().toISOString();
  persona.frequentCommands = updateRankedList(
    persona.frequentCommands,
    (item) => item.command === normalizedCommand,
    () => ({ command: normalizedCommand, count: 1 })
  );

  for (const topic of topics) {
    persona.topics = updateRankedList(
      persona.topics,
      (item) => item.topic === topic,
      () => ({ topic, count: 1 })
    );
  }

  persona.preferences = [...new Set([...persona.preferences, ...inferredPreferences])].slice(0, 8);

  fs.writeFileSync(personaPath, JSON.stringify(persona, null, 2), "utf-8");
  return persona;
};
