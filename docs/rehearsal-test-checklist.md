# OBP voting rehearsal checklist

## Join and devices

- Start a performance with the exact show-report reference the Stage Manager expects to use.
- Confirm the operator displays a generated audience code, coded join link, QR, and joined-device count.
- Scan the QR code on at least one iPhone and one Android phone.
- Open the plain public URL and confirm it asks for the performance code instead of exposing the vote.
- Enter a wrong code and an old performance code; confirm neither phone can see or submit the active vote.
- Enter the correct code manually and confirm it is accepted without needing to re-enter it between polls.
- Join once on venue Wi-Fi and once using cellular data.
- Confirm the printed/spoken audience URL works if the QR code does not.
- Let a phone sleep between polls, wake it, and confirm it reconnects.
- Refresh during standby, during an open vote, and after voting.

## Normal show flow

- Load the intended poll and confirm audience phones remain on standby.
- Open the vote and confirm the correct wording and choices appear.
- Submit one choice per phone and confirm totals increase for the operator.
- Close the vote and confirm phones do not reveal the result early.
- Confirm the non-automatic timer increases while voting remains open.
- Reveal the result and confirm each phone shows only its own choice while Stage Direction updates.
- Advance and confirm the next vote is ready while backstage retains the latest direction.
- Complete the story and confirm Stage Direction replaces the last cue with a full-screen Tonight’s Path containing only the selected cues, script colours, and page numbers for Polls 3, 4, 5, and 6.
- Complete the story, press **Save this page** on an iPhone and Android phone, and confirm the downloaded PNG contains the full Tonight’s Path summary.

## Recovery and edge cases

- Close a vote with no responses and choose a manual outcome.
- Create a tie, resolve it manually, reveal it, and advance.
- Disconnect and reconnect the operator page without changing the active state.
- Disconnect the operator network and confirm the indicator changes from reconnecting to offline, controls stop accepting actions, and the last-known state remains visible.
- Open Stage Direction and confirm the operator reports it connected; close that page and confirm the operator reports it delayed and then offline.
- Disconnect Stage Direction and confirm its own indicator changes while the last direction remains visible.
- Enter Show Mode and confirm cue selection, QR, links, and reset tools are hidden while the primary cue action, timer, totals, skip, and recovery panel remain available.
- Open the operator recovery accordion and a Results-history archive, refresh their page data, and confirm each remains open until deliberately closed.
- Load a later poll from standby to simulate jumping ahead in rehearsal.
- Skip a ready poll and an open poll; confirm no result is recorded and the next poll is ready.
- Confirm the backstage screen never displays whether an outcome was manual.
- Archive and end the performance, then confirm its old audience code expires and the completed run appears under Results history with the correct show-report reference and participating-device count.
- Copy the show-report summary and verify the chosen paths, manual markers, totals, and percentages.
- Download the CSV, open it in a spreadsheet, and confirm the performance reference, audience code, poll options, vote totals, percentages, selected outcomes, and manual markers.

## MVP limitations to remember

- One vote is enforced per browser, not per person. Private browsing, another browser, or cleared storage can create another vote.
- The performance code makes casual remote voting less likely but can still be shared; it is not identity verification or a ticket credential.
- The backstage colour labels and page numbers should be checked against Tory’s approved performance script before use.
- The external QR image has a visible join-link fallback if that service is unavailable.
- Connection health confirms the operator/service and Stage Direction heartbeat only; it does not prove that every audience phone is online.
