# Project plan

## Goal

Build a straightforward business workflow assistant that turns a plain-language request into an understandable sequence of steps, with the user in control.

## MVP delivered

- Responsive HTML, CSS, and JavaScript workflow-builder interface.
- Example prompts and a reviewable workflow preview.
- Gemini API integration through a Node.js server-side proxy; the API key stays out of the browser.
- Input checks, bounded workflow output, visible API errors, and a health endpoint.
- Clearly labeled simulated run so the prototype does not imply that external work was performed.

## Next milestones

1. **Choose integrations:** confirm the first spreadsheet, database/CRM, and communication providers and the required actions.
2. **Add accounts safely:** implement OAuth, encrypted token storage, tenant isolation, and permission management.
3. **Define executable actions:** create typed connector contracts, validate plans against an allowlist, and require human approval before writes or messages.
4. **Build execution:** implement durable, observable step execution with retries, idempotency, cancellation, and audit history.
5. **Harden and release:** add authentication, rate limiting, privacy controls, monitoring, integration tests, and deployment-specific secret management.

## MVP acceptance checks

- A user can enter a task or select an example and request a Gemini-generated plan.
- The plan renders as separate steps with an app, action, and useful detail.
- Missing configuration and Gemini/API failures are communicated rather than shown as successful plans.
- The demo runner labels its progress as a simulation and makes no external changes.
- The interface works on narrow screens as well as desktop.

## Not in MVP

Real integrations, account sign-in, persistent workflow history, scheduled triggers, and real execution. These require provider selection, authentication, and approval policies before implementation.
