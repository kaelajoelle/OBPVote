import test from "node:test";
import assert from "node:assert/strict";
import { story } from "../src/story.js";
import { VoteSession } from "../src/vote-session.js";

test("accepts one vote per audience browser in an open round", () => {
  const session = new VoteSession(story);
  session.open();
  session.castVote("browser-a", "lanterns");
  assert.equal(session.results().lanterns, 1);
  assert.throws(() => session.castVote("browser-a", "river"), /already voted/);
});

test("advances through the winning branch", () => {
  const session = new VoteSession(story);
  session.open();
  session.castVote("a", "river");
  session.castVote("b", "river");
  session.castVote("c", "lanterns");
  session.close();
  session.advance();
  assert.equal(session.currentPromptId, "bridge-choice");
  assert.equal(session.status, "ready");
});

test("manual outcome resolves a tie and is recorded", () => {
  const session = new VoteSession(story);
  session.open();
  session.castVote("a", "river");
  session.castVote("b", "lanterns");
  session.close();
  assert.equal(session.winnerId(), null);
  session.setManualOutcome("lanterns");
  session.advance();
  assert.equal(session.currentPromptId, "gate-choice");
  assert.equal(session.history[0].manual, true);
});
