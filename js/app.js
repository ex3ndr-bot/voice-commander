const commandInput = document.getElementById('commandInput');
const runBtn = document.getElementById('runBtn');
const resultOutput = document.getElementById('resultOutput');
const suggestionsEl = document.getElementById('suggestions');
const historyList = document.getElementById('historyList');
const historyTemplate = document.getElementById('historyTemplate');
const tutorialBtn = document.getElementById('tutorialBtn');
const tutorialStatus = document.getElementById('tutorialStatus');
const tutorialStepsEl = document.getElementById('tutorialSteps');
const soundToggle = document.getElementById('soundToggle');

const state = window.Persona.init();
const engine = window.TaskEngine;
let selectedSuggestion = -1;
let tutorialRunning = false;
let tutorialStep = 0;
let audioCtx;

function ensureAudio() {
  if (!soundToggle.checked) return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

function beep(freq = 720, duration = 0.06, gainValue = 0.025) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.value = gainValue;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function renderHistory() {
  historyList.innerHTML = '';
  engine.history.forEach((item, index) => {
    const node = historyTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector('.history-type').textContent = item.type;
    node.querySelector('.history-command').textContent = item.command;
    node.querySelector('.history-time').textContent = item.time;
    node.querySelector('.detail-intent').textContent = item.intent;
    node.querySelector('.detail-confidence').textContent = item.confidence;
    node.querySelector('.detail-action').textContent = item.action;
    node.querySelector('.detail-result').textContent = item.result;
    node.querySelector('.history-summary').addEventListener('click', () => {
      node.classList.toggle('open');
      beep(node.classList.contains('open') ? 840 : 640, 0.04, 0.02);
    });
    if (index === 0) node.classList.add('open');
    historyList.appendChild(node);
  });
}

function renderSuggestions() {
  const matches = engine.getMatches(commandInput.value);
  suggestionsEl.innerHTML = '';
  if (!matches.length || document.activeElement !== commandInput) {
    suggestionsEl.classList.remove('visible');
    selectedSuggestion = -1;
    return matches;
  }
  matches.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'suggestion-item' + (idx === selectedSuggestion ? ' active' : '');
    div.innerHTML = `${item.pattern}<small>${item.hint}</small>`;
    div.addEventListener('mousedown', (e) => {
      e.preventDefault();
      applySuggestion(idx, matches);
    });
    suggestionsEl.appendChild(div);
  });
  suggestionsEl.classList.add('visible');
  return matches;
}

function applySuggestion(idx, matches = engine.getMatches(commandInput.value)) {
  if (!matches[idx]) return;
  commandInput.value = matches[idx].pattern;
  selectedSuggestion = idx;
  renderSuggestions();
  beep(920, 0.04, 0.018);
}

function typeText(text) {
  resultOutput.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    resultOutput.textContent += text[i] || '';
    if (i % 12 === 0) beep(420 + (i % 5) * 50, 0.012, 0.006);
    i += 1;
    if (i >= text.length) clearInterval(interval);
  }, 10);
}

function runCommand(value) {
  const parsed = engine.inferCommand(value);
  typeText(parsed.result);
  engine.history.unshift({
    type: parsed.type,
    command: value,
    time: 'Just now',
    intent: parsed.intent,
    confidence: parsed.confidence,
    action: parsed.action,
    result: parsed.result.split('\n').slice(-1)[0] || 'Completed.'
  });
  renderHistory();
  renderSuggestions();
  beep(760, 0.05, 0.028);
}

function setTutorialStep(nextStep) {
  [...tutorialStepsEl.querySelectorAll('li')].forEach((li, idx) => {
    li.classList.toggle('active', idx === nextStep);
  });
}

function startTutorial() {
  tutorialRunning = true;
  tutorialStep = 0;
  tutorialStatus.textContent = 'Running';
  const sequence = [
    'search for neon glass desktop ui inspiration',
    'open app Figma',
    'set timer for 15 minutes',
    'take note Add onboarding overlay and richer history cards'
  ];

  function advance() {
    if (tutorialStep >= sequence.length) {
      tutorialStatus.textContent = 'Complete';
      tutorialRunning = false;
      commandInput.value = '';
      renderSuggestions();
      return;
    }
    setTutorialStep(tutorialStep);
    commandInput.value = sequence[tutorialStep];
    renderSuggestions();
    setTimeout(() => runCommand(sequence[tutorialStep]), 260);
    tutorialStep += 1;
    setTimeout(advance, 1900);
  }

  advance();
}

runBtn.addEventListener('click', () => runCommand(commandInput.value));
commandInput.addEventListener('input', () => {
  selectedSuggestion = -1;
  renderSuggestions();
});
commandInput.addEventListener('focus', renderSuggestions);
commandInput.addEventListener('blur', () => setTimeout(() => suggestionsEl.classList.remove('visible'), 120));

document.querySelectorAll('.example-chip').forEach((button) => {
  button.addEventListener('click', () => {
    commandInput.value = button.dataset.example;
    renderSuggestions();
    runCommand(commandInput.value);
  });
});

tutorialBtn.addEventListener('click', () => {
  if (!tutorialRunning) startTutorial();
});

document.addEventListener('keydown', (event) => {
  if (event.key === '/') {
    if (document.activeElement !== commandInput) {
      event.preventDefault();
      commandInput.focus();
      beep(880, 0.04, 0.018);
    }
  }

  if (event.key === '?' && event.shiftKey) {
    event.preventDefault();
    if (!tutorialRunning) startTutorial();
  }

  if (document.activeElement === commandInput) {
    const matches = engine.getMatches(commandInput.value);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedSuggestion = Math.min(selectedSuggestion + 1, matches.length - 1);
      renderSuggestions();
      beep(620, 0.03, 0.014);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedSuggestion = Math.max(selectedSuggestion - 1, 0);
      renderSuggestions();
      beep(560, 0.03, 0.014);
    }

    if (event.key === 'Tab' && matches.length) {
      event.preventDefault();
      applySuggestion(selectedSuggestion >= 0 ? selectedSuggestion : 0, matches);
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedSuggestion >= 0 && matches[selectedSuggestion]) {
        applySuggestion(selectedSuggestion, matches);
      }
      runCommand(commandInput.value);
    }
  }
});

renderHistory();
renderSuggestions();
setTutorialStep(-1);
void state;
