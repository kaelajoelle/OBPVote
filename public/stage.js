const login = document.querySelector("#stage-login");
const display = document.querySelector("#stage-display");
const keyInput = document.querySelector("#stage-key");
let showKey = sessionStorage.getItem("obp-stage-key") || "";
keyInput.value = showKey;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
}

async function getState() {
  const response = await fetch("/api/stage/state", {
    headers: { "x-operator-key": showKey },
    cache: "no-store"
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed.");
  return result;
}

function activityMessage(state) {
  if (state.status === "open") return "Audience vote in progress";
  if (state.status === "closed") return "Vote closed — awaiting reveal";
  if (state.status === "revealed") return "New direction revealed";
  if (state.status === "complete") return "Performance path complete";
  if (state.currentPoll) return `Next vote: Poll ${escapeHtml(state.currentPoll.pollNumber)} — ${escapeHtml(state.currentPoll.label)}`;
  return "Stand by";
}

function render(state) {
  const direction = state.direction;
  display.innerHTML = direction ? `
    <section class="stage-direction" style="--stage-accent:${escapeHtml(direction.stageColor)}">
      <p class="status">Current script direction</p>
      ${direction.scriptColor ? `<p class="script-colour">${escapeHtml(direction.scriptColor)}</p>` : ""}
      <h2>${escapeHtml(direction.stageDirection)}</h2>
      <p class="stage-outcome">Audience choice: <strong>${escapeHtml(direction.outcomeLabel)}</strong></p>
      <div class="stage-activity">${activityMessage(state)}</div>
    </section>` : `
    <section class="stage-direction waiting">
      <p class="status">Stand by</p>
      <h2>No direction has been revealed yet.</h2>
      <div class="stage-activity">${activityMessage(state)}</div>
    </section>`;
}

async function connect() {
  showKey = keyInput.value;
  try {
    const state = await getState();
    sessionStorage.setItem("obp-stage-key", showKey);
    login.hidden = true;
    display.hidden = false;
    render(state);
  } catch (error) {
    keyInput.setCustomValidity(error.message);
    keyInput.reportValidity();
  }
}

document.querySelector("#stage-connect").addEventListener("click", connect);
keyInput.addEventListener("input", () => keyInput.setCustomValidity(""));
if (showKey) connect();
setInterval(async () => {
  if (!display.hidden) {
    try { render(await getState()); } catch { /* keep last-known direction visible */ }
  }
}, 1000);
