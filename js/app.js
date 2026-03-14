import { processTask } from "./taskEngine.js";
import { buildPersonaSummary, getPersonaProfile, getTopIntent, recordPersonaEvent } from "./persona.js";

const state = {
  history: [],
  recognition: null,
  speechSupported: false,
  listening: false
};

const elements = {
  commandInput: document.querySelector("#command-input"),
  commandHint: document.querySelector("#command-hint"),
  runButton: document.querySelector("#run-command"),
  voiceToggle: document.querySelector("#voice-toggle"),
  historyList: document.querySelector("#history-list"),
  terminalLog: document.querySelector("#terminal-log"),
  systemMode: document.querySelector("#system-mode"),
  speechSupport: document.querySelector("#speech-support"),
  seedDemo: document.querySelector("#seed-demo"),
  clearLog: document.querySelector("#clear-log"),
  preferenceList: document.querySelector("#preference-list"),
  patternList: document.querySelector("#pattern-list"),
  personaSummary: document.querySelector("#persona-summary"),
  personaMode: document.querySelector("#persona-mode"),
  statCommands: document.querySelector("#stat-commands"),
  statIntent: document.querySelector("#stat-intent"),
  statTone: document.querySelector("#stat-tone"),
  statContext: document.querySelector("#stat-context")
};

function appendLog(prefix, message) {
  const line = document.createElement("div");
  line.className = "log-line";
  line.innerHTML = `
    <span class="log-prefix">${prefix}</span>
    <span>${message}</span>
  `;
  elements.terminalLog.prepend(line);
}

function renderHistory() {
  if (!state.history.length) {
    elements.historyList.innerHTML = `
      <div class="history-card">
        <div class="history-card-header">
          <strong>No tasks yet</strong>
          <span class="history-state">Idle</span>
        </div>
        <div class="history-card-meta">
          <span>Submit a voice or keyboard command to populate the queue.</span>
          <span>--:--</span>
        </div>
      </div>
    `;
    return;
  }

  elements.historyList.innerHTML = state.history
    .map(
      (task) => `
        <article class="history-card">
          <div class="history-card-header">
            <strong>${task.intent}</strong>
            <span class="history-state">${task.state}</span>
          </div>
          <div class="history-card-command">$ ${task.command}</div>
          <p>${task.summary}</p>
          <div class="history-card-meta">
            <span>${task.preview[0]}</span>
            <span>${task.timestamp}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderPersona(profile = getPersonaProfile()) {
  elements.personaSummary.textContent = buildPersonaSummary(profile);
  elements.personaMode.textContent = profile.totalCommands
    ? "Adapting to operator behavior"
    : "Listening for workflow preferences";
  elements.statCommands.textContent = String(profile.totalCommands);
  elements.statIntent.textContent = getTopIntent(profile);
  elements.statTone.textContent = profile.preferences.tone || "Concise";
  elements.statContext.textContent = String(profile.recentContexts.length);

  const preferences = Object.entries(profile.preferences);
  elements.preferenceList.innerHTML = preferences.length
    ? preferences
        .map(([key, value]) => `<li class="token">${key}: ${value}</li>`)
        .join("")
    : `<li class="token">No preferences yet</li>`;

  elements.patternList.innerHTML = profile.patterns.length
    ? profile.patterns.map((pattern) => `<li class="pattern-item">${pattern}</li>`).join("")
    : `<li class="pattern-item pattern-empty">Awaiting command traffic.</li>`;
}

function updateListeningUI(isListening) {
  state.listening = isListening;
  elements.voiceToggle.classList.toggle("is-listening", isListening);
  elements.voiceToggle.setAttribute("aria-pressed", String(isListening));
  elements.systemMode.textContent = isListening ? "Listening" : "Standby";
  elements.commandHint.textContent = isListening
    ? "Listening... speak naturally."
    : state.speechSupported
      ? "Voice and keyboard input available."
      : "Speech API unavailable. Keyboard command mode active.";
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    elements.speechSupport.textContent = "Fallback";
    state.speechSupported = false;
    updateListeningUI(false);
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    updateListeningUI(true);
    appendLog("audio", "Speech recognition activated.");
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join(" ")
      .trim();

    elements.commandInput.value = transcript;

    if (event.results[event.results.length - 1].isFinal && transcript) {
      void executeCommand(transcript, "voice");
    }
  };

  recognition.onerror = (event) => {
    updateListeningUI(false);
    appendLog("error", `Voice input unavailable: ${event.error}.`);
  };

  recognition.onend = () => {
    updateListeningUI(false);
  };

  state.recognition = recognition;
  state.speechSupported = true;
  elements.speechSupport.textContent = "Native";
  updateListeningUI(false);
}

async function executeCommand(rawCommand, source = "manual") {
  const command = rawCommand.trim();

  if (!command) {
    appendLog("system", "Ignored empty command.");
    return;
  }

  elements.commandInput.value = "";
  elements.systemMode.textContent = "Processing";
  appendLog(source, `Received command: "${command}"`);

  const task = await processTask(command);
  state.history = [task, ...state.history].slice(0, 8);
  renderHistory();

  const profile = recordPersonaEvent(command, task.intent);
  renderPersona(profile);

  appendLog("agent", task.summary);
  task.preview.forEach((line) => appendLog("preview", line));
  elements.systemMode.textContent = "Standby";
}

function bindEvents() {
  elements.runButton.addEventListener("click", () => {
    void executeCommand(elements.commandInput.value, "manual");
  });

  elements.commandInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void executeCommand(elements.commandInput.value, "manual");
    }
  });

  elements.voiceToggle.addEventListener("click", () => {
    if (!state.speechSupported || !state.recognition) {
      appendLog("system", "SpeechRecognition API not available. Use typed commands instead.");
      elements.commandInput.focus();
      return;
    }

    if (state.listening) {
      state.recognition.stop();
      return;
    }

    state.recognition.start();
  });

  elements.seedDemo.addEventListener("click", async () => {
    const demoCommands = [
      "Organize my downloads by file type",
      "Classify these notes as product, ops, or personal",
      "Summarize today's standup updates in concise bullets"
    ];

    for (const command of demoCommands) {
      // Sequential playback keeps the terminal output readable.
      // eslint-disable-next-line no-await-in-loop
      await executeCommand(command, "demo");
    }
  });

  elements.clearLog.addEventListener("click", () => {
    elements.terminalLog.innerHTML = `
      <div class="log-line">
        <span class="log-prefix">system</span>
        <span>Terminal cleared. Awaiting operator command.</span>
      </div>
    `;
  });

  document.querySelectorAll(".suggestion-chip").forEach((button) => {
    button.addEventListener("click", () => {
      const { command } = button.dataset;
      if (command) {
        elements.commandInput.value = command;
        void executeCommand(command, "shortcut");
      }
    });
  });
}

function init() {
  renderHistory();
  renderPersona();
  setupSpeechRecognition();
  bindEvents();
  appendLog("system", "Local persona memory loaded from browser storage.");
}

init();
