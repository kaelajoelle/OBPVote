import test from "node:test";
import assert from "node:assert/strict";
import { story } from "../src/story.js";
import { VoteSession } from "../src/vote-session.js";

test("accepts one vote per audience browser in an open round", () => {
  const session = new VoteSession(story);
  session.open();
  session.castVote("browser-a", "enchantress");
  assert.equal(session.results().enchantress, 1);
  assert.throws(() => session.castVote("browser-a", "hag"), /already voted/);
});

test("advances through the winning branch", () => {
  const session = new VoteSession(story);
  session.open();
  session.castVote("a", "hag");
  session.castVote("b", "hag");
  session.castVote("c", "enchantress");
  session.close();
  session.reveal();
  session.advance();
  assert.equal(session.currentPromptId, "poll-2-song");
  assert.equal(session.status, "ready");
});

test("manual outcome resolves a tie and is recorded", () => {
  const session = new VoteSession(story);
  session.open();
  session.castVote("a", "hag");
  session.castVote("b", "enchantress");
  session.close();
  assert.equal(session.winnerId(), null);
  session.setManualOutcome("enchantress");
  session.reveal();
  session.advance();
  assert.equal(session.currentPromptId, "poll-2-song");
  assert.equal(session.history[0].manual, true);
});

test("audience sees the chosen result only after the operator reveals it", () => {
  const session = new VoteSession(story);
  session.open();
  session.castVote("a", "hag");
  session.close();
  assert.equal(session.publicState("a").revealedOutcome, null);
  session.reveal();
  assert.deepEqual(session.publicState("a").revealedOutcome, {
    id: "hag",
    label: "Flamespun Ruins — the Hag"
  });
});

test("contains the eight numbered script polls plus the conditional 4.5 vote", () => {
  assert.deepEqual(story.prompts.map((prompt) => prompt.pollNumber), ["1", "2", "3", "4", "4.5", "5", "6", "7", "8"]);
});

test("every outcome has a concise backstage label and outline colour", () => {
  for (const prompt of story.prompts) {
    for (const option of prompt.options) {
      assert.ok(option.stageLabel);
      assert.match(option.stageColor, /^#[0-9a-f]{6}$/i);
    }
  }
});

test("operator can load any scripted vote while voting is not open", () => {
  const session = new VoteSession(story);
  session.selectPrompt("poll-7-stories");
  assert.equal(session.currentPromptId, "poll-7-stories");
  assert.equal(session.status, "ready");
  session.open();
  assert.throws(() => session.selectPrompt("poll-8-song"), /Finish the current vote/);
});
