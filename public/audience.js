const card = document.querySelector("#vote-card");
const storageKey = "obp-audience-id";
let audienceId = localStorage.getItem(storageKey);
if (!audienceId) {
  audienceId = crypto.randomUUID();
  localStorage.setItem(storageKey, audienceId);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
}

function percentage(count, total) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function render(state) {
  if (state.status === "revealed" && state.revealedOutcome) {
    const totalVotes = Number(state.totalVotes || 0);
    const winnerCount = Number(state.revealedResults?.[state.revealedOutcome.id] || 0);
    const matched = state.yourChoice?.id === state.revealedOutcome.id;
    card.innerHTML = `
      <p class="status success">The audience has chosen</p>
      <div class="choice-comparison">
        <div class="comparison-card">
          <span>Your choice</span>
          <h2>${escapeHtml(state.yourChoice?.label || "No vote recorded")}</h2>
        </div>
        <div class="comparison-card audience-winner">
          <span>Audience choice</span>
          <h2>${escapeHtml(state.revealedOutcome.label)}</h2>
          <strong>${percentage(winnerCount, totalVotes)}%</strong>
          <small>${winnerCount} of ${totalVotes} votes</small>
        </div>
      </div>
      ${state.yourChoice ? `<p class="match-note">${matched ? "Your choice matched the audience." : "The adventure follows the audience’s choice."}</p>` : ""}
      <p>Watch the stage as your choice becomes part of the story.</p>`;
    return;
  }
  if (state.status === "complete") {
    const journey = (state.journeyResults || []).map((entry) => `
      <article class="journey-item">
        <div class="journey-heading"><span>Poll ${escapeHtml(entry.pollNumber)}</span><strong>${escapeHtml(entry.promptLabel)}</strong></div>
        <dl>
          <div><dt>Your choice</dt><dd>${escapeHtml(entry.yourChoice?.label || "No vote recorded")}</dd></div>
          <div><dt>Audience choice</dt><dd>${escapeHtml(entry.audienceChoice?.label || "Not recorded")} <strong>${Number(entry.audiencePercentage || 0)}%</strong></dd></div>
        </dl>
      </article>`).join("");
    card.innerHTML = `<p class="status">The path is chosen.</p><h2>Now watch how your choices unfold, adventurer.</h2>${journey ? `<section class="journey-summary"><div class="breakdown-heading"><span>Tonight’s path</span><span>${state.journeyResults.length} choices</span></div>${journey}</section>` : ""}`;
    return;
  }
  if (!state.prompt || state.status === "ready") {
    card.innerHTML = `<p class="status">Stand by</p><h2>The next choice will appear here.</h2>`;
    return;
  }
  if (state.status === "closed") {
    card.innerHTML = `<p class="status">Voting closed</p><h2>The Companions’ path is being revealed…</h2>`;
    return;
  }
  if (state.hasVoted) {
    card.innerHTML = `<p class="status success">Choice received</p><h2>Your voice is part of the story.</h2>${state.yourChoice ? `<div class="your-choice"><span>Your choice</span><strong>${escapeHtml(state.yourChoice.label)}</strong></div>` : ""}<p>Watch the stage for what happens next.</p>`;
    return;
  }
  card.innerHTML = `
    <p class="status">Voting is open</p>
    <h2>${escapeHtml(state.prompt.title)}</h2>
    ${state.prompt.question ? `<p>${escapeHtml(state.prompt.question)}</p>` : ""}
    <div class="choice-list">
      ${state.prompt.options.map((option) => `<button class="choice" data-option-id="${escapeHtml(option.id)}">${escapeHtml(option.label)}</button>`).join("")}
    </div>`;
}

async function refresh() {
  try {
    const response = await fetch(`/api/state?audienceId=${encodeURIComponent(audienceId)}`, { cache: "no-store" });
    render(await response.json());
  } catch {
    card.innerHTML = `<p class="status warning">Connection lost</p><h2>Stay on this page.</h2><p>We’ll try again automatically.</p>`;
  }
}

card.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-option-id]");
  if (!button) return;
  card.querySelectorAll("button").forEach((item) => { item.disabled = true; });
  const response = await fetch("/api/vote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ audienceId, optionId: button.dataset.optionId })
  });
  const body = await response.json();
  if (!response.ok) card.innerHTML = `<p class="status warning">${escapeHtml(body.error)}</p>`;
  else render(body);
});

refresh();
setInterval(refresh, 1000);
