# MVP architecture

## Decision

Use one edge-hosted web service that serves four browser views and owns a single database-backed performance session.

```text
Audience phones ──poll/submit──┐
Operator browser ──control────┼── Hosted worker ── D1 session + votes + archives
Backstage screen ──read-only──┘                   └── scripted choices + directions
```

This is intentionally a prototype architecture for the September 21 readthrough. It minimizes moving parts while keeping the active vote shared across audience and operator devices. A later production version can replace polling with realtime messaging without changing the audience workflow.

## Views

- `/`: audience view. Shows the current open choice, accepts one vote per browser per round, and displays the chosen result after the operator reveals it.
- `/operator.html`: operator view. Opens and closes voting, sees live totals, chooses a manual outcome when needed, reveals the result, advances the branch, and reviews current and archived runs.
- `/stage.html`: read-only backstage view. Keeps the latest approved script colour or direction visible for cast and stage management without exposing manual-override information.
- `/results.html`: protected results view. Loads current and archived totals on demand so archive accordions are not disrupted by live polling.

## Data and state

- Scripted prompts and branch links live in `src/story.js`.
- D1 holds one active performance session, its votes, completed-round history, and archived run summaries.
- Each audience browser creates a random local ID. The server accepts one vote from that ID in each round.
- Refreshing a browser preserves its vote; clearing browser storage creates a new ID. This is sufficient for a supervised readthrough, not a fraud-resistant election.
- Publishing or restarting the hosted worker does not discard the current session. **Archive & reset** preserves completed-round totals before starting again at Poll 1.

## Rehearsal safeguards

- A simple operator key protects control endpoints. It is shared rehearsal access, not an account system.
- The join URL is always visible beside the QR code.
- If voting, Wi-Fi, or the QR service fails, the operator can close the vote, gather a show-of-hands result, select the manual outcome, and continue.
- Ties and empty votes cannot be revealed until the operator explicitly selects an outcome.
- Audience and backstage screens change direction only when the operator deliberately presses **Reveal result**.

## Deployment shape

The app is published as a Cloudflare-compatible worker with an HTTPS audience URL. The operator QR code derives its join link from the live site address automatically.

## Deliberately out of scope

Accounts, durable audience identity, payments, ticketing, analytics beyond simple run totals, multiple simultaneous performances, script authoring UI, and production-grade security are not part of this milestone.
