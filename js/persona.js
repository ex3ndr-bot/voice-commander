const STORAGE_KEY = "voice-commander-persona";

const DEFAULT_PROFILE = {
  totalCommands: 0,
  intents: {},
  preferences: {
    tone: "Concise"
  },
  patterns: [],
  recentContexts: []
};

function readProfile() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(DEFAULT_PROFILE);
    }

    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_PROFILE),
      ...parsed,
      preferences: {
        ...DEFAULT_PROFILE.preferences,
        ...(parsed.preferences || {})
      },
      intents: parsed.intents || {},
      patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
      recentContexts: Array.isArray(parsed.recentContexts) ? parsed.recentContexts : []
    };
  } catch {
    return structuredClone(DEFAULT_PROFILE);
  }
}

function saveProfile(profile) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function inferPreferenceHints(command) {
  const lowered = command.toLowerCase();
  const updates = {};

  if (/(concise|brief|short)/.test(lowered)) {
    updates.tone = "Concise";
  } else if (/(detailed|expand|deep dive)/.test(lowered)) {
    updates.tone = "Detailed";
  }

  if (/(today|this week|recent)/.test(lowered)) {
    updates.timeBias = "Recent";
  }

  if (/(bullet|list)/.test(lowered)) {
    updates.outputShape = "Bullets";
  }

  return updates;
}

function extractPattern(command) {
  const cleaned = command
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join(" ");

  return cleaned || "general command";
}

export function getPersonaProfile() {
  return readProfile();
}

export function recordPersonaEvent(command, intent) {
  const profile = readProfile();
  const pattern = extractPattern(command);
  const nextPreferences = inferPreferenceHints(command);

  profile.totalCommands += 1;
  profile.intents[intent] = (profile.intents[intent] || 0) + 1;
  profile.preferences = {
    ...profile.preferences,
    ...nextPreferences
  };

  profile.patterns = [pattern, ...profile.patterns.filter((item) => item !== pattern)].slice(0, 6);
  profile.recentContexts = [command, ...profile.recentContexts.filter((item) => item !== command)].slice(0, 8);

  saveProfile(profile);
  return profile;
}

export function clearPersonaProfile() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function buildPersonaSummary(profile) {
  const topIntent = Object.entries(profile.intents).sort((a, b) => b[1] - a[1])[0];
  const intentLabel = topIntent ? topIntent[0] : "idle";
  const tone = profile.preferences.tone || "Concise";

  if (!profile.totalCommands) {
    return "No patterns learned yet. Run a few commands to shape the operator profile.";
  }

  return `Leaning toward ${intentLabel} workflows with a ${tone.toLowerCase()} output preference. Memory is stored locally in this browser only.`;
}

export function getTopIntent(profile) {
  const topIntent = Object.entries(profile.intents).sort((a, b) => b[1] - a[1])[0];
  return topIntent ? topIntent[0] : "Idle";
}
