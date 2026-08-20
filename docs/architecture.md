# MVP architecture

## Decision

Use one dependency-free Node.js service that serves two browser views and owns a single in-memory performance session.

```text
Audience phones ──poll/submit──┐
                              ├── Node service ── in-memory session + scripted choices
Operator browser ──control────┘
```

This is intentionally a prototype architecture for the September 21 readthrough. It minimizes setup, moving parts, and failure modes. A later production version can replace polling and in-memory state with realtime messaging and persistent storage without changing the audience workflow.

## Views

- `/`: audience view. Shows only the current open choice, accepts one vote per browser per round, and waits for the next choice.
- `/operator.html`: operator view. Opens and closes voting, sees live totals, chooses a manual outcome when needed, advances the branch, and can reset the story.

## Data and state

- Scripted prompts and branch links live in `src/story.js`.
- The server holds one active session in memory.
- Each audience browser creates a random local ID. The server accepts one vote from that ID in each round.
- Refreshing a browser preserves its vote; clearing browser storage creates a new ID. This is sufficient for a supervised readthrough, not a fraud-resistant election.
- Restarting the server resets the session. The operator reset button does the same intentionally.

## Rehearsal safeguards

- A simple operator key protects control endpoints. It is shared rehearsal access, not an account system.
- The join URL is always visible beside the QR code.
- If voting, Wi-Fi, or the QR service fails, the operator can close the vote, gather a show-of-hands result, select the manual outcome, and continue.
- Ties and empty votes cannot advance until the operator explicitly selects an outcome.

## Deployment shape

Run one Node 20+ process on a host reachable by audience phones. Set `PUBLIC_BASE_URL` to its HTTPS URL so the operator QR code points to the correct place. No database or build step is required.

## Deliberately out of scope

Accounts, durable audience identity, payments, ticketing, analytics, historical reporting, multiple simultaneous performances, script authoring UI, and production-grade security are not part of this milestone.
