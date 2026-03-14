window.TaskEngine = (function () {
  const commandLibrary = [
    {
      type: 'Search',
      intent: 'search',
      pattern: 'search for React Server Components docs',
      hint: 'Look up docs, bugs, APIs, repos, tickets',
      action: (q) => `> intent.search\n> query: ${q || 'general search'}\n> provider: web + local index\n\nSearching relevant sources…\n- ranked official docs\n- recent GitHub issues\n- internal notes cache\n\nDone. Opened top results in a compact side stack.`
    },
    {
      type: 'App',
      intent: 'open_app',
      pattern: 'open app Figma',
      hint: 'Launch local tools by product name',
      action: (q) => `> intent.open_app\n> target: ${q || 'requested app'}\n> resolver: desktop registry\n\nResolving installed application aliases…\nLaunch successful. Focus transferred and workspace restored.`
    },
    {
      type: 'Timer',
      intent: 'set_timer',
      pattern: 'set timer for 15 minutes',
      hint: 'Natural language timers, reminders, countdowns',
      action: (q) => `> intent.set_timer\n> payload: ${q || 'default timer'}\n\nParsing natural language duration…\nTimer armed. You’ll get sound + visual toast when it completes.`
    },
    {
      type: 'Note',
      intent: 'take_note',
      pattern: 'take note Ship glassmorphism iteration before standup',
      hint: 'Capture notes into scratchpad or knowledge base',
      action: (q) => `> intent.take_note\n> note: ${q || 'empty note'}\n\nSaving note to quick capture inbox…\nIndexed with tags: voice-command, desktop-agent, scratchpad.`
    },
    {
      type: 'Search',
      intent: 'search',
      pattern: 'search for the latest Electron security guidance',
      hint: 'Search security or engineering references',
      action: (q) => `> intent.search\n> query: ${q}\n\nPulled authoritative references and highlighted the newest guidance.`
    },
    {
      type: 'App',
      intent: 'open_app',
      pattern: 'open app Linear',
      hint: 'Open work tools fast',
      action: (q) => `> intent.open_app\n> target: ${q}\n\nBrought the app forward and restored previous window placement.`
    }
  ];

  const history = [
    {
      type: 'Search',
      command: 'search for terminal glassmorphism inspiration',
      time: '2 min ago',
      intent: 'search',
      confidence: '99%',
      action: 'Queried premium UI references and filtered noisy concepts.',
      result: 'Displayed design references optimized for desktop tooling.'
    },
    {
      type: 'Note',
      command: 'take note Need richer history cards for the demo',
      time: '11 min ago',
      intent: 'take_note',
      confidence: '97%',
      action: 'Saved note to project scratchpad with context tags.',
      result: 'Note captured and linked to session timeline.'
    },
    {
      type: 'Timer',
      command: 'set timer for 25 minutes',
      time: '18 min ago',
      intent: 'set_timer',
      confidence: '95%',
      action: 'Created focus timer with a completion notification.',
      result: 'Countdown running in the background.'
    }
  ];

  function getMatches(value) {
    const q = value.trim().toLowerCase();
    if (!q) return commandLibrary.slice(0, 4);
    return commandLibrary.filter((item) => {
      return item.pattern.toLowerCase().includes(q) || item.intent.includes(q.replace(/\s+/g, '_')) || item.hint.toLowerCase().includes(q);
    }).slice(0, 5);
  }

  function inferCommand(raw) {
    const input = raw.trim();
    const lower = input.toLowerCase();

    if (lower.startsWith('search for')) {
      const query = input.slice(10).trim();
      return { type: 'Search', intent: 'search', confidence: '99%', action: 'Issued multi-source search workflow.', result: commandLibrary[0].action(query) };
    }
    if (lower.startsWith('open app')) {
      const app = input.slice(8).trim();
      return { type: 'App', intent: 'open_app', confidence: '98%', action: 'Matched app name against installed app aliases.', result: commandLibrary[1].action(app) };
    }
    if (lower.startsWith('set timer')) {
      const timer = input.replace(/^set timer\s*(for)?/i, '').trim();
      return { type: 'Timer', intent: 'set_timer', confidence: '96%', action: 'Parsed timer duration and created a countdown.', result: commandLibrary[2].action(timer) };
    }
    if (lower.startsWith('take note')) {
      const note = input.slice(9).trim();
      return { type: 'Note', intent: 'take_note', confidence: '97%', action: 'Saved note into the quick-capture system.', result: commandLibrary[3].action(note) };
    }
    return {
      type: 'Generic',
      intent: 'fallback_parse',
      confidence: '81%',
      action: 'Classified a free-form command and proposed nearest actions.',
      result: `> intent.fallback_parse\n> input: ${input || '(empty)'}\n\nI can help with:\n- search for X\n- open app Y\n- set timer for Z\n- take note <text>\n\nTip: press Tab to autocomplete a suggestion.`
    };
  }

  return { commandLibrary, history, getMatches, inferCommand };
})();
