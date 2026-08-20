const login = document.querySelector("#operator-login");
const panel = document.querySelector("#operator-panel");
const keyInput = document.querySelector("#operator-key");
let operatorKey = sessionStorage.getItem("obp-operator-key") || "";
let lastState = null;
keyInput.value = operatorKey;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
}

async function api(action = "state", body = null) {
  const response = await fetch(`/api/operator/${action}`, {
    method: action === "state" ? "GET" : "POST",
    headers: { "content-type": "application/json", "x-operator-key": operatorKey },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed.");
  return result;
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));
}

function renderHistoryEntries(entries) {
  if (!entries.length) return `<p class="empty-note">Completed votes will appear here after you reveal and advance them.</p>`;
  return entries.map((entry) => `
    <article class="history-item">
      <div class="history-heading">
        <strong>Poll ${escapeHtml(entry.pollNumber)} — ${escapeHtml(entry.promptLabel)}</strong>
        <span>${entry.totalVotes} vote${entry.totalVotes === 1 ? "" : "s"}</span>
      </div>
      <p>Chosen: <strong>${escapeHtml(entry.winnerLabel)}</strong>${entry.manual ? ` <span class="badge">Manual outcome</span>` : ""}</p>
      <ul>${entry.voteRows.map((vote) => `<li><span>${escapeHtml(vote.label)}</span><strong>${vote.count}</strong></li>`).join("")}</ul>
    </article>`).join("");
}

function renderArchives(archives) {
  if (!archives.length) return `<p class="empty-note">Past runs will appear after you use Archive &amp; reset.</p>`;
  return archives.map((archive) => `
    <details class="archive-run">
      <summary>${escapeHtml(formatDate(archive.endedAt))} — ${archive.totalVotes} total votes</summary>
      ${renderHistoryEntries(archive.history)}
    </details>`).join("");
}

function render(state) {
  lastState = state;
  const prompt = state.prompt;
  const historyWasOpen = panel.querySelector("#history-panel")?.open;
  const maxVotes = Math.max(1, ...Object.values(state.results || {}));
  const canLoadPrompt = ["ready", "complete"].includes(state.status);
  const promptOptions = state.prompts.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === prompt?.id ? "selected" : ""}>Poll ${escapeHtml(item.pollNumber)} — ${escapeHtml(item.operatorLabel)}${item.special ? " (conditional)" : ""}</option>`).join("");
  const results = prompt?.options.map((option) => {
    const count = state.results[option.id] || 0;
    const manual = state.manualOutcomeId === option.id;
    const winner = state.winnerId === option.id;
    return `<div class="result-row ${winner ? "selected" : ""}">
      <div><strong>${escapeHtml(option.label)}</strong><span>${count} vote${count === 1 ? "" : "s"}</span></div>
      <div class="bar"><i style="width:${Math.round((count / maxVotes) * 100)}%"></i></div>
      ${state.status === "closed" ? `<button class="secondary" data-action="override" data-option-id="${escapeHtml(option.id)}">${manual ? "Manual outcome ✓" : "Choose outcome"}</button>` : ""}
    </div>`;
  }).join("") || "";

  panel.innerHTML = `
    <div class="operator-topline"><span class="status">${escapeHtml(state.status)}</span><strong>${state.totalVotes} current votes</strong></div>
    <section class="cue-control">
      <label for="prompt-picker">Vote to load on audience phones</label>
      <div class="inline-control">
        <select id="prompt-picker" ${canLoadPrompt ? "" : "disabled"}>${promptOptions}</select>
        <button class="secondary" data-action="select" ${canLoadPrompt ? "" : "disabled"}>Load selected vote</button>
      </div>
      <p class="fine-print">Loading a vote puts audience phones on standby. Press <strong>Open vote</strong> at the stage cue.</p>
    </section>
    ${prompt ? `<h2>${escapeHtml(prompt.title)}</h2><p>${escapeHtml(prompt.question)}</p>` : `<h2>Story complete</h2>`}
    <div class="results">${results}</div>
    ${state.status === "revealed" && state.winnerId ? `<p class="reveal-note">The result is now visible on audience phones and the backstage display.</p>` : ""}
    <div class="operator-actions">
      ${state.status === "ready" ? `<button data-action="open">Open vote</button>` : ""}
      ${state.status === "open" ? `<button data-action="close">Close vote</button>` : ""}
      ${state.status === "closed" ? `<button data-action="reveal" ${state.winnerId ? "" : "disabled"}>Reveal result</button>` : ""}
      ${state.status === "revealed" ? `<button data-action="advance">Advance to next vote</button>` : ""}
      <button class="secondary" data-action="reset">${state.history.length ? "Archive & reset" : "Reset story"}</button>
    </div>
    <nav class="quick-links" aria-label="Show pages">
      <a href="${escapeHtml(state.joinUrl)}" target="_blank" rel="noreferrer"><span>Audience page</span><small>Voting and result reveal</small></a>
      <a href="${escapeHtml(state.stageUrl)}" target="_blank" rel="noreferrer"><span>Backstage display</span><small>Cast and stage-manager direction</small></a>
    </nav>
    <details id="history-panel" class="history-panel" ${historyWasOpen ? "open" : ""}>
      <summary>Results history</summary>
      <h3>Current run</h3>
      ${renderHistoryEntries(state.history)}
      <h3>Past runs</h3>
      ${renderArchives(state.archives)}
    </details>
    <aside class="join-panel">
      <div><span class="eyebrow">Audience join link</span><a href="${escapeHtml(state.joinUrl)}">${escapeHtml(state.joinUrl)}</a></div>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(state.joinUrl)}" alt="QR code for the audience join link" />
      <p class="fine-print">If the QR service is unavailable, display or announce the join link.</p>
    </aside>`;
}

async function connect() {
  operatorKey = keyInput.value;
  try {
    const state = await api();
    sessionStorage.setItem("obp-operator-key", operatorKey);
    login.hidden = true;
    panel.hidden = false;
    render(state);
  } catch (error) {
    keyInput.setCustomValidity(error.message);
    keyInput.reportValidity();
  }
}

document.querySelector("#connect").addEventListener("click", connect);
keyInput.addEventListener("input", () => keyInput.setCustomValidity(""));
panel.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || button.disabled) return;
  if (button.dataset.action === "reset" && lastState?.history.length) {
    const confirmed = confirm("Archive this run’s completed results and reset to Poll 1?");
    if (!confirmed) return;
  }
  try {
    button.disabled = true;
    let body = {};
    if (button.dataset.optionId) body = { optionId: button.dataset.optionId };
    if (button.dataset.action === "select") body = { promptId: panel.querySelector("#prompt-picker").value };
    render(await api(button.dataset.action, body));
  } catch (error) {
    alert(error.message);
    button.disabled = false;
  }
});

if (operatorKey) connect();
setInterval(async () => {
  if (!panel.hidden && document.activeElement?.id !== "prompt-picker") {
    try { render(await api()); } catch { /* keep last-known state visible */ }
  }
}, 1000);
