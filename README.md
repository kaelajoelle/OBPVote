# Off the Beaten Path Vote

A lean web-based audience voting prototype for the **September 21 readthrough** of *Off the Beaten Path*. Audience members join from a browser or QR code, vote once on the current choice, and wait for the story to continue. A show operator opens and closes each vote, sees results, resolves ties or failures manually, and advances to the chosen branch.

## MVP scope

Included:

- browser/QR audience join;
- current-choice display and one vote per browser per round;
- operator controls to open and close voting;
- live result totals;
- branch advancement from the winning or manually selected outcome;
- reset and manual fallback.

Not included: accounts, payments, analytics, ticketing, durable results, simultaneous performances, or a script editor.

## Prototype surfaces

The initial repository plan is preserved in these three surfaces:

- **Audience:** waiting state, test vote, active vote, and vote confirmation.
- **Show Control:** current vote, open, close, results, and choosing the next vote.
- **Shared System:** current performance, vote definitions, vote submissions, and current voting state.

The current scaffold implements these as one audience page, one operator page, and one shared in-memory session.

## Run locally

Requires Node.js 20 or newer. There are no packages to install.

```powershell
$env:OPERATOR_KEY = "choose-a-rehearsal-key"
$env:PUBLIC_BASE_URL = "http://localhost:3000"
npm start
```

Open:

- Audience: `http://localhost:3000`
- Operator: `http://localhost:3000/operator.html`

If `OPERATOR_KEY` is omitted, local development uses `rehearsal`. Always set a different value on a shared deployment.

## Rehearsal flow

1. The operator connects with the rehearsal key and displays the join QR/link.
2. The operator opens the current vote on the stage cue.
3. Audience members make one choice each.
4. The operator closes voting and reads the totals.
5. If there is a clear winner, advance. For a tie, empty vote, or manual fallback, choose an outcome first and then advance.
6. Repeat until the scripted path ends.

If the network fails, collect the choice in the room, close the vote, use **Choose outcome**, and continue. The visible join URL is the fallback if the external QR image service is unavailable.

## Configure choices

Edit `src/story.js`. Each prompt needs a stable `id`, audience-facing copy, and options. Each option’s `nextPromptId` points to another prompt or is `null` when that path ends.

The sample story is placeholder content only. Tory supplies and approves artistic/performance requirements and exact choice wording. Kaela facilitates/product-manages the prototype and readiness process. Technical ownership remains unassigned until explicitly decided.

## Verify

```powershell
npm test
```

See [MVP architecture](docs/architecture.md) and the [issue/milestone plan](docs/issue-plan.md).

## Repository

The MVP is developed in [`kaelajoelle/OBPVote`](https://github.com/kaelajoelle/OBPVote).
