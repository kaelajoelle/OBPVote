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

test("audience sees only their own choice after the operator reveals it", () => {
  const session = new VoteSession(story);
  session.open();
  session.castVote("a", "hag");
  session.close();
  assert.deepEqual(session.publicState("a").yourChoice, {
    id: "hag",
    label: "Flamespun Ruins — The Hag"
  });
  session.reveal();
  const revealedState = session.publicState("a");
  assert.deepEqual(revealedState.yourChoice, {
    id: "hag",
    label: "Flamespun Ruins — The Hag"
  });
  assert.equal("revealedOutcome" in revealedState, false);
  assert.equal("revealedResults" in revealedState, false);
  assert.equal("totalVotes" in revealedState, false);
});

test("contains the eight numbered script polls plus the conditional 4.5 vote", () => {
  assert.deepEqual(story.prompts.map((prompt) => prompt.pollNumber), ["1", "2", "3", "4", "4.5", "5", "6", "7", "8"]);
});

test("every outcome has a concise backstage label, outline colour, and script page", () => {
  for (const prompt of story.prompts) {
    for (const option of prompt.options) {
      assert.ok(option.stageLabel);
      assert.match(option.stageColor, /^#[0-9a-f]{6}$/i);
      assert.ok(Number.isInteger(option.pageNumber) && option.pageNumber > 0);
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

test("operator can skip an unused or in-progress poll without recording a result", () => {
  const session = new VoteSession(story);
  session.open();
  session.castVote("browser-a", "enchantress");
  session.skip();
  assert.equal(session.currentPromptId, "poll-2-song");
  assert.equal(session.status, "ready");
  assert.equal(session.history.length, 0);
  assert.equal(session.votes.size, 0);
});

test("skipping the final poll completes the story", () => {
  const session = new VoteSession(story);
  session.selectPrompt("poll-8-song");
  session.skip();
  assert.equal(session.currentPromptId, null);
  assert.equal(session.status, "complete");
});

test("audience journey stays hidden until the operator releases it after completion", () => {
  const session = new VoteSession(story);
  session.selectPrompt("poll-8-song");
  session.open();
  session.castVote("a", "love-and-loss");
  session.castVote("b", "love-and-loss");
  session.castVote("c", "loss-and-love");
  session.close();
  session.reveal();
  session.advance();
  assert.equal(session.publicState("c").journeyResults, null);
  assert.equal(session.publicState("c").recapReleased, false);

  session.releaseRecap();
  const state = session.publicState("c");
  assert.equal(state.recapReleased, true);
  assert.equal(state.journeyResults.length, 1);
  assert.deepEqual(state.journeyResults[0].yourChoice, { id: "loss-and-love", label: "“Loss and Love”" });
  assert.deepEqual(state.journeyResults[0].audienceChoice, { id: "love-and-loss", label: "“Love and Loss”" });
  assert.equal(state.journeyResults[0].audiencePercentage, 67);
  assert.equal(state.journeyResults[0].yourPercentage, 33);
  assert.deepEqual(state.journeyResults[0].options.map(({ id, count, percentage }) => ({ id, count, percentage })), [
    { id: "loss-and-love", count: 1, percentage: 33 },
    { id: "love-and-loss", count: 2, percentage: 67 }
  ]);
});

test("operator cannot release the post-show journey before the story is complete", () => {
  const session = new VoteSession(story);
  assert.throws(() => session.releaseRecap(), /Finish the story/);
});
