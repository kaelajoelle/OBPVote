# Off the Beaten Path Vote

A lean web-based audience voting prototype for the **September 21 readthrough** of *Off the Beaten Path*. Audience members join from a browser or QR code, vote once on the current choice, and wait for the story to continue. A show operator opens and closes each vote, sees results, resolves ties or failures manually, and advances to the chosen branch.

## MVP scope

Included:

- browser/QR audience join;
- current-choice display and one vote per browser per round;
- operator controls to open and close voting;
- live result totals;
- branch advancement from the winning or manually selected outcome;
- operator selection of any scripted poll for rehearsal recovery or cueing;
- a deliberate result reveal on audience phones;
- a read-only, auto-updating backstage direction display;
- archived vote totals and manual-outcome tracking after each run;
- reset and manual fallback.

Not included: accounts, payments, analytics, ticketing, durable results, simultaneous performances, or a script editor.

## Prototype surfaces

The initial repository plan is preserved in these three surfaces:

- **Audience:** waiting state, test vote, active vote, and vote confirmation.
- **Show Control:** current vote, open, close, results, and choosing the next vote.
- **Shared System:** current performance, vote definitions, vote submissions, and current voting state.

The current scaffold implements these as audience, operator, backstage, and results pages backed by one shared hosted voting session.

## Handy page list

| Page | Purpose | Access |
| --- | --- | --- |
| `/` | Audience voting, vote confirmation, and revealed result | Public / QR |
| `/operator.html` | Load, open, close, resolve, reveal, advance, and review results | Show key |
| `/stage.html` | Large auto-updating branch name and script colour with a matching outline | Show key |
| `/results.html` | Current and archived run totals that refresh only on request | Show key |

The operator page links to **Results history** in a new tab. Its archived-run accordions stay open because the results page refreshes only when **Refresh results** is pressed. **Archive & reset** stores the completed run before returning the show to Poll 1.

## Run locally

Requires Node.js 22.13 or newer.

```powershell
npm install
npm run dev
```

Open:

- Audience: `http://localhost:5173`
- Operator: `http://localhost:5173/operator.html`
- Backstage: `http://localhost:5173/stage.html`
- Results: `http://localhost:5173/results.html`

If `OPERATOR_KEY` is omitted, local development uses `rehearsal`. The hosted deployment uses a configured rehearsal key. Always set a different value for a production show.

## Rehearsal flow

1. The operator connects with the rehearsal key and displays the join QR/link.
2. The operator loads the scripted poll needed for the next cue. Audience phones remain on standby.
3. The operator opens the current vote on the stage cue.
4. Audience members make one choice each.
5. The operator closes voting and reads the totals.
6. For a tie, empty vote, or manual fallback, choose an outcome.
7. Press **Reveal result** to update audience phones and the backstage direction display.
8. Press **Advance to next vote** when the performance is ready to continue.
9. At the end of a rehearsal or show, use **Archive & reset** to preserve the totals and manual-outcome record.

If the network fails, collect the choice in the room, close the vote, use **Choose outcome**, and continue. The visible join URL is the fallback if the external QR image service is unavailable.

## Configure choices

The app now contains Polls 1–8 from the September 21 script plus the script’s conditional **OBP TPK Poll 4.5**. The operator can load any poll directly, so a missed cue or rehearsal jump does not require replaying earlier votes.

The audience-facing wording is a concise adaptation of the supplied script. Tory supplies and approves final artistic/performance requirements and exact choice wording; Kaela facilitates and product-manages the prototype and readiness process. Technical ownership remains unassigned until explicitly decided.

The backstage page intentionally does not identify whether an outcome was manually selected. It shows only a concise branch label and, where the script specifies one, the script colour in a matching outline. That operational detail is recorded only on the protected results page. The audience page uses the gold, burgundy, teal, green, purple, blue, and steel palette drawn from the OBP shield.

To make an approved wording or routing change, edit `src/story.js`. Each prompt needs a stable `id`, audience-facing copy, and options. Each option’s `nextPromptId` points to another prompt or is `null` when that path ends.

## Verify

```powershell
npm test
```

See [MVP architecture](docs/architecture.md) and the [issue/milestone plan](docs/issue-plan.md).
Use the [rehearsal test checklist](docs/rehearsal-test-checklist.md) for the first multi-phone run-through.

## Repository

The MVP is developed in [`kaelajoelle/OBPVote`](https://github.com/kaelajoelle/OBPVote).
