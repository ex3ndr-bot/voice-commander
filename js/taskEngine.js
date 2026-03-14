const TASK_TEMPLATES = {
  organize: [
    "Scanned the target set and grouped items by file type.",
    "Built folders for Images, Documents, Archives, and Scratch.",
    "Flagged duplicate candidates for review before moving anything."
  ],
  classify: [
    "Detected likely categories from keywords and message structure.",
    "Assigned priority labels and confidence scores to each item.",
    "Set aside low-confidence entries for manual inspection."
  ],
  summarize: [
    "Compressed the source into short bullet points with clear actions.",
    "Highlighted blockers, owners, and next milestones.",
    "Preserved dates and named entities to avoid losing context."
  ],
  fallback: [
    "Parsed the request and routed it through the general task simulator.",
    "Generated a safe preview instead of executing a real system action.",
    "Returned a terminal-style result for the demo interface."
  ]
};

const EXAMPLE_PAYLOADS = {
  organize: ["screenshots", "voice memos", "downloads", "project files"],
  classify: ["notes", "tickets", "messages", "research snippets"],
  summarize: ["standup updates", "meeting notes", "release brief", "incident log"],
  fallback: ["workspace context", "operator request", "demo data", "history items"]
};

function inferIntent(command) {
  const normalized = command.toLowerCase();

  if (/(organize|sort|clean up|arrange|group)/.test(normalized)) {
    return "organize";
  }

  if (/(classify|tag|categorize|label|triage)/.test(normalized)) {
    return "classify";
  }

  if (/(summarize|recap|digest|brief|condense)/.test(normalized)) {
    return "summarize";
  }

  return "fallback";
}

function extractTarget(command, intent) {
  const lowered = command.toLowerCase();
  const markers = [" by ", " into ", " from ", " as ", " in "];

  for (const marker of markers) {
    const index = lowered.indexOf(marker);
    if (index !== -1) {
      return command.slice(0, index).trim();
    }
  }

  return command.trim() || `demo ${intent} task`;
}

function buildChecklist(intent, command) {
  const templates = TASK_TEMPLATES[intent] || TASK_TEMPLATES.fallback;
  const payloads = EXAMPLE_PAYLOADS[intent] || EXAMPLE_PAYLOADS.fallback;
  const noun = payloads[Math.floor(Math.random() * payloads.length)];
  const target = extractTarget(command, intent);

  return templates.map((step, index) => ({
    id: `${intent}-${Date.now()}-${index}`,
    label: step.replace("target set", `${target} set`).replace("source", `${noun} source`),
    done: true
  }));
}

function buildResult(intent, command) {
  const now = new Date();
  const checklist = buildChecklist(intent, command);
  const previewLines = {
    organize: [
      "Images/ 14 items",
      "Documents/ 9 items",
      "Archives/ 3 items"
    ],
    classify: [
      "product -> 6 items (0.93 confidence)",
      "ops -> 4 items (0.88 confidence)",
      "personal -> 2 items (0.74 confidence)"
    ],
    summarize: [
      "1. Release blocked by final QA sign-off.",
      "2. Design handoff lands at 15:00 UTC.",
      "3. Follow-up needed on migration rollback plan."
    ],
    fallback: [
      "Preview mode only. No live machine actions were taken.",
      "Intent confidence below direct-execution threshold."
    ]
  };

  return {
    id: `task-${now.getTime()}`,
    intent,
    command,
    state: "Completed",
    timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    summary: `Simulated ${intent} workflow completed for: ${command}`,
    checklist,
    preview: previewLines[intent] || previewLines.fallback
  };
}

export async function processTask(command) {
  const intent = inferIntent(command);
  const result = buildResult(intent, command);

  await new Promise((resolve) => window.setTimeout(resolve, 520));

  return result;
}
