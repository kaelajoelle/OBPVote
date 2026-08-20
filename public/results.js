const login = document.querySelector("#results-login");
const page = document.querySelector("#results-page");
const content = document.querySelector("#results-content");
const keyInput = document.querySelector("#results-key");
const refreshed = document.querySelector("#last-refreshed");
let showKey = sessionStorage.getItem("obp-operator-key") || sessionStorage.getItem("obp-results-key") || "";
keyInput.value = showKey;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
}

async function getResults() {
  const response = await fetch("/api/operator/state", {
    headers: { "x-operator-key": showKey },
    cache: "no-store"
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed.");
  return result;
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));
}

function renderEntries(entries) {
  if (!entries.length) return `<p class="empty-note">No completed votes in this run yet.</p>`;
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

function render(state) {
  const archives = state.archives.length ? state.archives.map((archive) => `
    <details class="archive-run">
      <summary>${escapeHtml(formatDate(archive.endedAt))} — ${archive.totalVotes} total votes</summary>
      ${renderEntries(archive.history)}
    </details>`).join("") : `<p class="empty-note">Past runs will appear after you use Archive &amp; reset on the operator page.</p>`;

  content.innerHTML = `
    <section class="results-section">
      <div class="section-heading"><div><p class="eyebrow">Active performance</p><h2>Current run</h2></div><strong>${state.history.reduce((sum, entry) => sum + entry.totalVotes, 0)} recorded votes</strong></div>
      ${renderEntries(state.history)}
    </section>
    <section class="results-section">
      <div class="section-heading"><div><p class="eyebrow">Saved performances</p><h2>Past runs</h2></div><strong>${state.archives.length} archived</strong></div>
      ${archives}
    </section>`;
  refreshed.textContent = `Loaded ${new Intl.DateTimeFormat(undefined, { timeStyle: "medium" }).format(new Date())}`;
}

async function load() {
  const state = await getResults();
  sessionStorage.setItem("obp-results-key", showKey);
  login.hidden = true;
  page.hidden = false;
  render(state);
}

async function connect() {
  showKey = keyInput.value;
  try {
    await load();
  } catch (error) {
    keyInput.setCustomValidity(error.message);
    keyInput.reportValidity();
  }
}

document.querySelector("#results-connect").addEventListener("click", connect);
keyInput.addEventListener("input", () => keyInput.setCustomValidity(""));
document.querySelector("#refresh-results").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  try {
    button.disabled = true;
    render(await getResults());
  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
  }
});

if (showKey) connect();
