# Voice Commander

Static GitHub Pages demo for a desktop-style voice agent. The app is pure HTML, CSS, and JavaScript with no backend services.

## Features

- Floating command dock with keyboard and Web Speech API input
- Glassmorphism desktop UI with cyan/teal terminal styling
- Simulated task engine for `organize`, `classify`, and `summarize` workflows
- Local persona tracking with `localStorage` for command habits and output preferences
- GitHub Pages friendly build with `.nojekyll`

## File Structure

- `index.html` - main application shell
- `style.css` - visual system, layout, and animations
- `js/app.js` - UI wiring, command handling, and speech recognition
- `js/taskEngine.js` - simulated workflow processor
- `js/persona.js` - persona memory and local preference tracking
- `.nojekyll` - disables Jekyll processing on GitHub Pages

## Running Locally

Open `index.html` directly in a browser, or serve the repo with a static file server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Notes

- Voice input depends on browser support for `SpeechRecognition` or `webkitSpeechRecognition`.
- If voice recognition is unavailable, the demo automatically falls back to typed commands.
- All persona data stays in the browser via `localStorage`.
