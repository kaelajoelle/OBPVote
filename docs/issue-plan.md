# September 21 readthrough plan

## Milestone: Readthrough voting prototype

Target: September 21. Exit condition: the company completes a timed rehearsal using audience phones and the operator fallback without losing the branch state.

### P0 — required for the readthrough

1. **Confirm the readthrough choice map and exact audience copy**
   - Owner: Tory for artistic/performance requirements; Kaela facilitates capture and acceptance.
   - Done when every rehearsed choice has approved wording, options, and next-choice links.
2. **Load the approved readthrough choices into the app**
   - Owner: technical owner unassigned.
   - Done when the operator can traverse every intended readthrough branch.
3. **Deploy one HTTPS rehearsal environment**
   - Owner: technical owner unassigned.
   - Done when five unrelated phones can join from the QR code on venue Wi-Fi/cellular.
4. **Run an end-to-end operator rehearsal**
   - Owner: Kaela facilitates; Tory validates show timing; technical owner supports.
   - Done when open, vote, close, manual fallback, reveal, backstage direction, advance, archive, and reset are exercised.
5. **Write and print the fallback runbook**
   - Owner: Kaela facilitates; Tory confirms the in-room cueing.
   - Done when the operator can continue by show of hands/manual override after disconnecting the network.

### P1 — hardening if time permits

6. Add a connection-health indicator to the operator view.
7. Add a one-click export of the configured story map for rehearsal review.
8. Test legibility on the oldest/smallest audience phone available.
9. Add a deployment smoke test and a short pre-show checklist.

## Milestone: Post-readthrough decisions

Do not start before collecting readthrough observations.

1. Decide technical ownership and hosting responsibility.
2. Review whether the simple archived result summaries are sufficient or need export/multiple simultaneous performances.
3. Decide whether realtime push is worth replacing one-second polling.
4. Convert validated needs into a production roadmap.

## Role boundaries

- **Tory — artistic/performance requirements:** what choices mean, exact on-stage wording, cue timing, acceptable fallback, and artistic acceptance.
- **Kaela — facilitator/product manager:** keeps scope and decisions clear, coordinates rehearsal, captures issues, and confirms readiness. This does not imply sole technical ownership.
- **Technical owner — unassigned:** implementation, deployment, reliability, security decisions, and technical runbook. Assign explicitly when the team decides.
