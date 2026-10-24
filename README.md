# Relay — AI Workflow Agent

Relay is a small prototype for turning business requests into reviewable workflow plans with Gemini. Its HTML/CSS/JavaScript frontend shows the workflow and offers a **simulation** of execution. It does not connect to or change external business tools.

## Requirements

- Node.js 18 or later
- A Gemini API key from Google AI Studio

## Run locally

1. Copy `.env.example` to `.env`.
2. Set `GEMINI_API_KEY` in `.env`. Keep the key private.
3. Optionally change `GEMINI_MODEL` or `PORT`.
4. Run `npm start`.
5. Open `http://localhost:3000`.

The server also reads environment variables set by the shell or hosting platform. Check `http://localhost:3000/api/health` for service and key-configuration status.

If you have not configured a key, the UI still loads, but generating a Gemini plan returns an explicit configuration message.

## Project files

- `index.html`, `styles.css`, `app.js` — browser experience
- `server.js` — static server and Gemini API proxy
- `cloud.md` — deployment notes and production considerations
- `plan.md` — scope, milestones, and acceptance checks

## Safety boundary

Only workflow planning uses Gemini. “Simulate run” is a timed visual preview; no spreadsheet, database, API, email, or chat action is executed. See [cloud.md](./cloud.md) for requirements before adding real connectors.
