export class VoteSession {
  constructor(story) {
    this.story = story;
    this.reset();
  }

  reset() {
    this.currentPromptId = this.story.startPromptId;
    this.status = "ready";
    this.votes = new Map();
    this.audienceHistory = new Map();
    this.manualOutcomeId = null;
    this.history = [];
    this.recapReleased = false;
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
    this.recapReleased = false;
    this.votes.clear();
    this.manualOutcomeId = null;
  }

  skip() {
    if (!this.prompt) throw new Error("There is no current vote to skip.");
    if (this.status === "revealed") throw new Error("Advance the revealed result instead of skipping it.");
    const promptIndex = this.story.prompts.findIndex((prompt) => prompt.id === this.currentPromptId);
    const nextPrompt = this.story.prompts[promptIndex + 1] ?? null;
    this.currentPromptId = nextPrompt?.id ?? null;
    this.status = nextPrompt ? "ready" : "complete";
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
    for (const [audienceId, optionId] of this.votes) {
      this.audienceHistory.set(`${this.prompt.id}:${audienceId}`, optionId);
    }
    this.history.push({ promptId: this.prompt.id, winnerId, votes: this.results(), manual: Boolean(this.manualOutcomeId) });
    this.currentPromptId = option.nextPromptId;
    this.status = option.nextPromptId ? "ready" : "complete";
    this.votes.clear();
    this.manualOutcomeId = null;
  }

  releaseRecap() {
    if (this.status !== "complete") throw new Error("Finish the story before releasing the post-show journey.");
    if (!this.history.length) throw new Error("There are no completed choices to release.");
    this.recapReleased = true;
  }

  publicState(audienceId = null) {
    const yourChoiceId = audienceId ? this.votes.get(audienceId) : null;
    const yourChoice = yourChoiceId ? this.prompt?.options.find((option) => option.id === yourChoiceId) : null;
    const journeyResults = this.status === "complete" && this.recapReleased ? this.history.map((entry) => {
      const prompt = this.story.prompts.find((item) => item.id === entry.promptId);
      const audienceChoice = prompt?.options.find((option) => option.id === entry.winnerId);
      const completedChoiceId = audienceId ? this.audienceHistory.get(`${entry.promptId}:${audienceId}`) : null;
      const completedChoice = prompt?.options.find((option) => option.id === completedChoiceId);
      const totalVotes = Object.values(entry.votes).reduce((total, count) => total + count, 0);
      const winnerVotes = entry.votes[entry.winnerId] || 0;
      const yourVotes = entry.votes[completedChoice?.id] || 0;
      return {
        pollNumber: prompt?.pollNumber ?? "?",
        promptLabel: prompt?.title ?? entry.promptId,
        yourChoice: completedChoice ? { id: completedChoice.id, label: completedChoice.label } : null,
        audienceChoice: audienceChoice ? { id: audienceChoice.id, label: audienceChoice.label } : null,
        audiencePercentage: totalVotes > 0 ? Math.round((winnerVotes / totalVotes) * 100) : 0,
        yourPercentage: totalVotes > 0 ? Math.round((yourVotes / totalVotes) * 100) : 0,
        options: prompt?.options.map((option) => ({
          id: option.id,
          label: option.label,
          count: Number(entry.votes[option.id] || 0),
          percentage: totalVotes > 0 ? Math.round((Number(entry.votes[option.id] || 0) / totalVotes) * 100) : 0
        })) ?? []
      };
    }) : null;
    return {
      status: this.status,
      prompt: this.prompt,
      hasVoted: Boolean(yourChoice),
      yourChoice: yourChoice ? { id: yourChoice.id, label: yourChoice.label } : null,
      journeyResults,
      recapReleased: this.recapReleased
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
