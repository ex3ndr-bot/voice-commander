const state = {
  history: [],
  persona: null,
  recognition: null,
  listening: false
};

const elements = {
  commandForm: document.getElementById("command-form"),
  commandInput: document.getElementById("command-input"),
  voiceButton: document.getElementById("voice-button"),
  historyList: document.getElementById("history-list"),
  historyCount: document.getElementById("history-count"),
  voiceSupportChip: document.getElementById("voice-support-chip"),
  totalCommands: document.getElementById("total-commands"),
  preferencesList: document.getElementById("preferences-list"),
  frequentCommandsList: document.getElementById("frequent-commands-list"),
  topicsList: document.getElementById("topics-list"),
  personaUpdated: document.getElementById("persona-updated"),
  historyTemplate: document.getElementById("history-item-template")
};

const formatRelativeTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const renderMetricList = (target, items, key, labelFormatter = (value) => value) => {
  target.innerHTML = "";

  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No signals yet";
    li.style.color = "#88aeb6";
    target.appendChild(li);
    return;
  }

  for (const item of items) {
    const li = document.createElement("li");
    const label = document.createElement(key === "command" ? "code" : "span");
    const count = document.createElement("strong");

    label.textContent = labelFormatter(item[key]);
    count.textContent = `${item.count}x`;

    li.append(label, count);
    target.appendChild(li);
  }
};

const renderPersona = (persona) => {
  state.persona = persona;
  elements.totalCommands.textContent = String(persona.totalCommands || 0);
  elements.personaUpdated.textContent = persona.lastUpdated
    ? `Updated ${new Date(persona.lastUpdated).toLocaleString()}`
    : "Awaiting signals";

  elements.preferencesList.innerHTML = "";
  const preferences = persona.preferences?.length ? persona.preferences : ["No learned preferences yet"];

  for (const preference of preferences) {
    const li = document.createElement("li");
    li.textContent = preference;
    elements.preferencesList.appendChild(li);
  }

  renderMetricList(elements.frequentCommandsList, persona.frequentCommands, "command");
  renderMetricList(elements.topicsList, persona.topics, "topic", (topic) => topic);
};

const createHistoryItem = (entry) => {
  const fragment = elements.historyTemplate.content.cloneNode(true);
  fragment.querySelector(".command-text").textContent = entry.command;
  fragment.querySelector(".timeline-time").textContent = formatRelativeTime(entry.createdAt);
  fragment.querySelector(".result-text").textContent = entry.result;

  const topicTags = fragment.querySelector(".topic-tags");
  for (const topic of entry.topics) {
    const tag = document.createElement("span");
    tag.className = "topic-tag";
    tag.textContent = topic;
    topicTags.appendChild(tag);
  }

  return fragment;
};

const renderHistory = (history) => {
  state.history = history;
  elements.historyCount.textContent = `${history.length} command${history.length === 1 ? "" : "s"}`;

  if (!history.length) {
    elements.historyList.className = "timeline empty-state";
    elements.historyList.innerHTML = `
      <div class="empty-card">
        <h3>No commands yet</h3>
        <p>The timeline will populate as soon as you run a task.</p>
      </div>
    `;
    return;
  }

  elements.historyList.className = "timeline";
  elements.historyList.innerHTML = "";

  for (const entry of history) {
    elements.historyList.appendChild(createHistoryItem(entry));
  }
};

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
};

const loadInitialData = async () => {
  try {
    const [historyPayload, personaPayload] = await Promise.all([
      fetchJson("/api/history"),
      fetchJson("/api/persona")
    ]);

    renderHistory(historyPayload.history || []);
    renderPersona(personaPayload.persona);
  } catch (error) {
    console.error(error);
  }
};

const submitCommand = async (command) => {
  const trimmed = command.trim();
  if (!trimmed) {
    return;
  }

  elements.commandInput.value = trimmed;
  elements.commandInput.disabled = true;
  elements.voiceButton.disabled = true;

  try {
    const payload = await fetchJson("/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: trimmed })
    });

    renderHistory([payload.record, ...state.history]);
    renderPersona(payload.persona);
    elements.commandInput.value = "";
  } catch (error) {
    window.alert(error.message);
  } finally {
    elements.commandInput.disabled = false;
    elements.voiceButton.disabled = false;
    elements.commandInput.focus();
  }
};

const setListeningState = (listening) => {
  state.listening = listening;
  elements.voiceButton.classList.toggle("listening", listening);
  elements.voiceButton.querySelector(".voice-label").textContent = listening ? "Listening" : "Voice";
};

const setupVoiceRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    elements.voiceSupportChip.textContent = "Voice input unsupported in this browser";
    elements.voiceButton.disabled = true;
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    setListeningState(true);
    elements.voiceSupportChip.textContent = "Microphone active";
  };

  recognition.onend = () => {
    setListeningState(false);
    elements.voiceSupportChip.textContent = "Voice input ready";
  };

  recognition.onerror = (event) => {
    setListeningState(false);
    elements.voiceSupportChip.textContent = `Voice error: ${event.error}`;
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    elements.commandInput.value = transcript;
    submitCommand(transcript);
  };

  state.recognition = recognition;
  elements.voiceSupportChip.textContent = "Voice input ready";
};

elements.commandForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitCommand(elements.commandInput.value);
});

elements.voiceButton.addEventListener("click", () => {
  if (!state.recognition) {
    return;
  }

  if (state.listening) {
    state.recognition.stop();
    return;
  }

  state.recognition.start();
});

setupVoiceRecognition();
loadInitialData();
