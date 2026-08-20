export class VoteSession {
  constructor(story) {
    this.story = story;
    this.reset();
  }

  reset() {
    this.currentPromptId = this.story.startPromptId;
    this.status = "ready";
    this.votes = new Map();
    this.manualOutcomeId = null;
    this.history = [];
  }

  get prompt() {
    return this.story.prompts.find((item) => item.id === this.currentPromptId) ?? null;
  }

  open() {
    if (!this.prompt) throw new Error("There is no current choice to open.");
    this.status = "open";
    this.votes.clear();
    this.manualOutcomeId = null;
  }

  close() {
    if (this.status !== "open") throw new Error("The vote is not open.");
    this.status = "closed";
  }

  castVote(audienceId, optionId) {
    if (this.status !== "open") throw new Error("Voting is closed.");
    if (!audienceId || audienceId.length > 100) throw new Error("A valid audience ID is required.");
    if (!this.prompt.options.some((option) => option.id === optionId)) throw new Error("That choice is not available.");
    if (this.votes.has(audienceId)) throw new Error("This browser has already voted in this round.");
    this.votes.set(audienceId, optionId);
  }

  setManualOutcome(optionId) {
    if (this.status !== "closed") throw new Error("Close the vote before choosing an outcome.");
    if (!this.prompt.options.some((option) => option.id === optionId)) throw new Error("That outcome is not available.");
    this.manualOutcomeId = optionId;
  }

  reveal() {
    if (this.status !== "closed") throw new Error("Close the vote before revealing the result.");
    if (!this.winnerId()) throw new Error("Choose a manual outcome to resolve a tie or empty vote.");
    this.status = "revealed";
  }

  selectPrompt(promptId) {
    if (!["ready", "complete"].includes(this.status)) throw new Error("Finish the current vote before loading another one.");
    if (!this.story.prompts.some((prompt) => prompt.id === promptId)) throw new Error("That vote is not available.");
    this.currentPromptId = promptId;
    this.status = "ready";
    this.votes.clear();
    this.manualOutcomeId = null;
  }

  results() {
    const counts = Object.fromEntries(this.prompt?.options.map((option) => [option.id, 0]) ?? []);
    for (const optionId of this.votes.values()) counts[optionId] += 1;
    return counts;
  }

  winnerId() {
    if (this.manualOutcomeId) return this.manualOutcomeId;
    const counts = this.results();
    const highest = Math.max(...Object.values(counts));
    if (highest === 0) return null;
    const winners = Object.entries(counts).filter(([, count]) => count === highest);
    return winners.length === 1 ? winners[0][0] : null;
  }

  advance() {
    if (this.status !== "revealed") throw new Error("Reveal the result before advancing.");
    const winnerId = this.winnerId();
    if (!winnerId) throw new Error("Choose a manual outcome to resolve a tie or empty vote.");
    const option = this.prompt.options.find((item) => item.id === winnerId);
    this.history.push({ promptId: this.prompt.id, winnerId, votes: this.results(), manual: Boolean(this.manualOutcomeId) });
    this.currentPromptId = option.nextPromptId;
    this.status = option.nextPromptId ? "ready" : "complete";
    this.votes.clear();
    this.manualOutcomeId = null;
  }

  publicState(audienceId = null) {
    const winnerId = this.status === "revealed" ? this.winnerId() : null;
    const revealedOutcome = winnerId ? this.prompt.options.find((option) => option.id === winnerId) : null;
    return {
      status: this.status,
      prompt: this.prompt,
      hasVoted: audienceId ? this.votes.has(audienceId) : false,
      revealedOutcome: revealedOutcome ? { id: revealedOutcome.id, label: revealedOutcome.label } : null
    };
  }

  operatorState(publicBaseUrl) {
    return {
      ...this.publicState(),
      results: this.results(),
      totalVotes: this.votes.size,
      winnerId: this.winnerId(),
      manualOutcomeId: this.manualOutcomeId,
      joinUrl: publicBaseUrl,
      history: this.history
    };
  }
}
