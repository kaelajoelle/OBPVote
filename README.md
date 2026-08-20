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
- reset and manual fallback.

Not included: accounts, payments, analytics, ticketing, durable results, simultaneous performances, or a script editor.

## Prototype surfaces

The initial repository plan is preserved in these three surfaces:

- **Audience:** waiting state, test vote, active vote, and vote confirmation.
- **Show Control:** current vote, open, close, results, and choosing the next vote.
- **Shared System:** current performance, vote definitions, vote submissions, and current voting state.

The current scaffold implements these as one audience page, one operator page, and one shared hosted voting session.

## Run locally

Requires Node.js 22.13 or newer.

```powershell
npm install
npm run dev
```

Open:

- Audience: `http://localhost:3000`
- Operator: `http://localhost:3000/operator.html`

If `OPERATOR_KEY` is omitted, local development uses `rehearsal`. The hosted deployment uses a configured rehearsal key. Always set a different value for a production show.

## Rehearsal flow

1. The operator connects with the rehearsal key and displays the join QR/link.
2. The operator loads the scripted poll needed for the next cue. Audience phones remain on standby.
3. The operator opens the current vote on the stage cue.
4. Audience members make one choice each.
5. The operator closes voting and reads the totals.
6. If there is a clear winner, advance. For a tie, empty vote, or manual fallback, choose an outcome first and then advance.
7. Repeat until the scripted path ends.

If the network fails, collect the choice in the room, close the vote, use **Choose outcome**, and continue. The visible join URL is the fallback if the external QR image service is unavailable.

## Configure choices

The app now contains Polls 1–8 from the September 21 script plus the script’s conditional **OBP TPK Poll 4.5**. The operator can load any poll directly, so a missed cue or rehearsal jump does not require replaying earlier votes.

The audience-facing wording is a concise adaptation of the supplied script. Tory supplies and approves final artistic/performance requirements and exact choice wording; Kaela facilitates and product-manages the prototype and readiness process. Technical ownership remains unassigned until explicitly decided.

To make an approved wording or routing change, edit `src/story.js`. Each prompt needs a stable `id`, audience-facing copy, and options. Each option’s `nextPromptId` points to another prompt or is `null` when that path ends.

## Verify

```powershell
npm test
```

See [MVP architecture](docs/architecture.md) and the [issue/milestone plan](docs/issue-plan.md).

## Repository

The MVP is developed in [`kaelajoelle/OBPVote`](https://github.com/kaelajoelle/OBPVote).
