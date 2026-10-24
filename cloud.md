# Cloud deployment

## Current architecture

- `index.html`, `styles.css`, and `app.js` provide the browser UI.
- `server.js` serves those assets and proxies workflow-planning requests to the Gemini API.
- The Gemini key is read from the server environment or a local `.env` file; it is never sent to the browser.
- The current runner is a visual simulation. It does not read or change spreadsheets, databases, APIs, or communication accounts.

## Deploying the prototype

1. Deploy the project to a Node.js host with Node 18 or later.
2. Set `GEMINI_API_KEY` in the host's secret/environment-variable settings. Optionally set `GEMINI_MODEL` and `PORT`.
3. Start the service with `npm start` and expose it behind HTTPS.
4. Check `/api/health` to confirm the service is up. Its response indicates whether a Gemini key is configured without exposing the key.
5. Configure usage limits and monitoring in the hosting and Google AI projects.

Do not commit `.env` or put the Gemini key in frontend code. The bundled Node server is a prototype, not a production-grade deployment boundary: before exposing it to multiple users, add authentication, per-user authorization, request rate limits, audit logging, and operational monitoring.

## Before enabling real actions

- Pick and implement the required connectors (for example, Google Sheets, a CRM, Slack, or email) using their official APIs and OAuth.
- Store user credentials as encrypted secrets and enforce least-privilege scopes.
- Require users to review and explicitly approve a workflow before any consequential action; define which operations always need confirmation.
- Validate every model-generated action against a typed, allowlisted schema. Never execute arbitrary model-produced code or URLs.
- Add retries, idempotency, timeouts, safe cancellation, and clear per-step results.
- Test with sandbox accounts and provide an audit trail and a way to revoke connected accounts.
