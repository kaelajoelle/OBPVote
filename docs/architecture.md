# MVP architecture

## Decision

Use one edge-hosted web service that serves two browser views and owns a single database-backed performance session.

```text
Audience phones ──poll/submit──┐
                              ├── Hosted worker ── D1 session + votes
Operator browser ──control────┘                   └── scripted choices
```

This is intentionally a prototype architecture for the September 21 readthrough. It minimizes moving parts while keeping the active vote shared across audience and operator devices. A later production version can replace polling with realtime messaging without changing the audience workflow.

## Views

- `/`: audience view. Shows only the current open choice, accepts one vote per browser per round, and waits for the next choice.
- `/operator.html`: operator view. Opens and closes voting, sees live totals, chooses a manual outcome when needed, advances the branch, and can reset the story.

## Data and state

- Scripted prompts and branch links live in `src/story.js`.
- D1 holds one active performance session, its votes, and completed-round history.
- Each audience browser creates a random local ID. The server accepts one vote from that ID in each round.
- Refreshing a browser preserves its vote; clearing browser storage creates a new ID. This is sufficient for a supervised readthrough, not a fraud-resistant election.
- Publishing or restarting the hosted worker does not discard the current session. The operator reset button resets it intentionally.

## Rehearsal safeguards

- A simple operator key protects control endpoints. It is shared rehearsal access, not an account system.
- The join URL is always visible beside the QR code.
- If voting, Wi-Fi, or the QR service fails, the operator can close the vote, gather a show-of-hands result, select the manual outcome, and continue.
- Ties and empty votes cannot advance until the operator explicitly selects an outcome.

## Deployment shape

The app is published as a Cloudflare-compatible worker with an HTTPS audience URL. The operator QR code derives its join link from the live site address automatically.

## Deliberately out of scope

Accounts, durable audience identity, payments, ticketing, analytics, historical reporting, multiple simultaneous performances, script authoring UI, and production-grade security are not part of this milestone.
