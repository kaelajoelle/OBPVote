# Off the Beaten Path Vote

A lean web-based audience voting prototype for the **September 21 readthrough** of *Off the Beaten Path*. Audience members join from a browser or QR code, vote once on the current choice, and wait for the story to continue. A show operator opens and closes each vote, sees results, resolves ties or failures manually, and advances to the chosen branch.

## MVP scope

Included:

- show-specific browser/QR audience join using a short performance code;
- current-choice display, changeable selection before confirmation, and one confirmed vote per browser per round;
- operator controls to open and close voting;
- live result totals;
- branch advancement from the winning or manually selected outcome;
- operator selection of any scripted poll for rehearsal recovery or cueing;
- a deliberate **Confirm this path** step followed by a quiet personal-choice screen;
- a Stage Manager-controlled post-bows release of the complete audience journey, percentages, and comparison bars;
- a downloadable 1080 × 1920 Instagram Story PNG with the performance date, inactive show code, defining choices, audience comparisons, and a stable spoiler-safe quote from the script;
- a read-only, auto-updating Stage Direction display with connection health and a final recap of the four main story decisions;
- an operator Show Mode with connection health, a vote timer, explicit cue actions, and fallback guidance;
- a Stage Manager-entered show-report reference attached to each performance;
- archived vote totals, participating-device counts, and manual-outcome tracking after each run;
- copy-ready show-report summaries and downloadable CSV exports;
- reset and manual fallback.

Not included: accounts, payments, analytics beyond show voting summaries, ticketing, a full show-report authoring system, simultaneous performances, or a script editor.

## Prototype surfaces

The initial repository plan is preserved in these three surfaces:

- **Audience:** waiting state, test vote, active vote, and vote confirmation.
- **Show Control:** current vote, open, close, results, and choosing the next vote.
- **Shared System:** current performance, vote definitions, vote submissions, and current voting state.

The current scaffold implements these as audience, operator, Stage Direction, and results pages backed by one shared hosted voting session.

## Handy page list

| Page | Purpose | Access |
| --- | --- | --- |
| `/` | Candlelit audience welcome, performance-code entry, confirmed voting, post-bows Telltale-style journey comparison, and Instagram Story keepsake | Public / show QR |
| `/operator.html` | Performance setup plus simplified Show Mode for loading, opening, closing, resolving, revealing, advancing, and recovery | Show key |
| `/stage.html` | Full-screen Stage Direction, script colour, page number, matching outline, connection health, and a final recap of Polls 3–6 | Show key |
| `/results.html` | Current and archived totals with copy-ready summaries and CSV exports | Show key |

The operator page links to **Results history** in a new tab. Its archived-run accordions stay open because the results page refreshes only when **Refresh results** is pressed. **Archive & end performance** stores the completed run, expires its audience code, and returns the operator to performance setup.

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

1. The operator connects with the rehearsal key and enters the Stage Manager’s show-report reference.
2. The app starts the performance and creates its audience code, QR, and join link.
3. Audience members scan the QR or enter the announced performance code once.
4. The operator loads the scripted poll needed for the next cue. Audience phones remain on standby.
5. The operator opens the current vote on the stage cue.
6. Audience members select a path, may change their selection, then press **Confirm this path**. Only the confirmed choice is submitted.
   - If the poll is not needed, the operator can press **Skip this poll** and confirm. No result is recorded.
7. The operator closes voting and reads the totals.
8. For a tie, empty vote, or manual fallback, choose an outcome.
9. Press the outcome-specific **Reveal** button to update Stage Direction while each audience phone confirms only its own choice.
10. Press the poll-specific **Advance** button when the performance is ready to continue.
11. At story end, confirm Stage Direction changes to a full-screen **Tonight’s Path** showing the selected cast cues, script colours, and page numbers for Polls 3, 4, 5, and 6. Audience phones remain on the final-bows screen.
12. After the final bows, press **Release post-show journey**. Audience phones then reveal personal-versus-audience percentages, comparison bars, and the Story-sized download.
13. Leave the performance active briefly so Adventurers can review and save their paths. Then use **Archive & end performance**, which ends audience access, and copy the show-report summary or download the CSV from Results history.

If audience voting fails while the operator remains connected, collect the choice in the room, close the vote, use **Use this outcome**, reveal, and continue. If the operator loses its connection, call the path manually, keep the last Stage Direction visible, and reconnect. The operator’s **Connection problem?** panel keeps these steps on screen. The visible join URL is the fallback if the external QR image service is unavailable.

## Configure choices

The app now contains Polls 1–8 from the September 21 script plus the script’s conditional **OBP TPK Poll 4.5**. The operator can load any poll directly, so a missed cue or rehearsal jump does not require replaying earlier votes.

The audience-facing wording is a concise adaptation of the supplied script. Tory supplies and approves final artistic/performance requirements and exact choice wording; Kaela facilitates and product-manages the prototype and readiness process. Technical ownership remains unassigned until explicitly decided.

The backstage page intentionally does not identify whether an outcome was manually selected. It shows only a concise branch label, the matching script colour where specified, and the current script page. That operational detail is recorded only on the protected results page. The audience page uses a dark, candlelit parchment treatment with restrained compass and filigree movement; voting remains high-contrast and calm after confirmation.

To make an approved wording or routing change, edit `src/story.js`. Each prompt needs a stable `id`, audience-facing copy, and options. Each option’s `nextPromptId` points to another prompt or is `null` when that path ends.

## Verify

```powershell
npm test
```

See [MVP architecture](docs/architecture.md) and the [issue/milestone plan](docs/issue-plan.md).
Use the [rehearsal test checklist](docs/rehearsal-test-checklist.md) for the first multi-phone run-through.

## Repository

The MVP is developed in [`kaelajoelle/OBPVote`](https://github.com/kaelajoelle/OBPVote).
