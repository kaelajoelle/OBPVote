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

- `/`: audience view. Requires the active performance code, then shows the current open choice, accepts one vote per browser per round, confirms only that browser’s own choice after reveal, and shows the larger Tonight’s Path summary when the story completes. The show QR carries the code automatically. The final summary can be rendered locally into a downloadable PNG keepsake without uploading new personal data.
- `/operator.html`: operator view. The operator starts a performance by entering the Stage Manager’s show-report reference; the service creates a short audience code and matching QR. Setup Mode exposes cue selection, links, QR, and end/archive tools. Show Mode keeps the current state, audience code, joined-device count, totals, timer, connection health, explicit next action, skip, manual outcome, and recovery guidance prominent.
- `/stage.html`: read-only Stage Direction view. Fills the display with the latest concise branch label, script colour, and page number inside a matching outline, without exposing manual-override information. When the story completes, it switches to a full-screen Tonight’s Path grid containing the selected cast cues, colours, and page numbers for the four main story decisions: Polls 3, 4, 5, and 6. A corner indicator reports its connection to the service.
- `/results.html`: protected results view. Loads current and archived totals on demand so archive accordions are not disrupted by live polling. Each labelled performance provides a copy-ready show-report summary and detailed CSV export.

## Data and state

- Scripted prompts and branch links live in `src/story.js`.
- D1 holds one active performance session, its show-report reference, generated audience code, votes, completed-round history, and archived run summaries.
- Each audience browser creates a random local ID and retains the last accepted performance code locally. The server accepts one vote from that ID in each round only when the active performance code matches.
- Refreshing a browser preserves its vote; clearing browser storage creates a new ID. This is sufficient for a supervised readthrough, not a fraud-resistant election.
- Publishing or restarting the hosted worker does not discard the current session. **Archive & end performance** preserves completed-round totals, the report reference, audience code, participating-device count, and manual outcomes before expiring that audience code.

## Rehearsal safeguards

- A simple operator key protects control endpoints. It is shared rehearsal access, not an account system.
- The ordinary public URL does not expose active voting without the current performance code. The code is an audience gate, not production-grade authentication, and can still be shared by someone in the theatre.
- The coded join URL and human-readable code are always visible beside the QR code.
- If voting, Wi-Fi, or the QR service fails, the operator can close the vote, gather a show-of-hands result, select the manual outcome, and continue.
- Ties and empty votes cannot be revealed until the operator explicitly selects an outcome.
- Audience phones confirm their own choices and Stage Direction changes only when the operator deliberately presses the outcome-specific **Reveal** button.
- The operator reports its own service connection separately from the Stage Direction heartbeat; it does not claim that every audience phone is online.
- On connection loss, the operator and Stage Direction pages retain their last-known state instead of clearing the show information.
- Skipping a poll discards that poll’s unrecorded votes and moves to the next scripted poll without adding a result to show history.

## Deployment shape

The app is published as a Cloudflare-compatible worker with an HTTPS audience URL. The operator QR code derives its join link from the live site address automatically.

## Deliberately out of scope

Accounts, durable audience identity, payments, ticketing, a full show-report authoring system, automated report email/integrations, multiple simultaneous performances, script authoring UI, and production-grade security are not part of this milestone.
