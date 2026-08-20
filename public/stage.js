const login = document.querySelector("#stage-login");
const display = document.querySelector("#stage-display");
const keyInput = document.querySelector("#stage-key");
const stageBrand = document.querySelector(".stage-brand");
const connectivity = document.querySelector("#stage-connectivity");
let showKey = sessionStorage.getItem("obp-stage-key") || "";
let lastConnectedAt = null;
let connectionFailureSince = null;
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

function connectionAge() {
  return lastConnectedAt ? Math.max(0, Math.floor((Date.now() - lastConnectedAt) / 1000)) : null;
}

function updateConnectivity() {
  const label = connectivity.querySelector(".connection-label");
  const failureAge = connectionFailureSince ? Date.now() - connectionFailureSince : 0;
  connectivity.classList.remove("connected", "reconnecting", "offline");
  if (!connectionFailureSince && lastConnectedAt) {
    connectivity.classList.add("connected");
    label.textContent = "Connected";
  } else if (failureAge < 5000) {
    connectivity.classList.add("reconnecting");
    label.textContent = "Reconnecting…";
  } else {
    connectivity.classList.add("offline");
    const age = connectionAge();
    label.textContent = age === null ? "Offline" : `Offline · last update ${age}s ago`;
  }
}

function markConnected() {
  lastConnectedAt = Date.now();
  connectionFailureSince = null;
  updateConnectivity();
}

function markDisconnected() {
  if (!connectionFailureSince) connectionFailureSince = Date.now();
  updateConnectivity();
}

function render(state) {
  if (state.status === "complete" && state.journey?.length) {
    display.innerHTML = `
      <section class="stage-direction stage-summary">
        <p class="stage-screen-header">Stage Direction</p>
        <h2 class="stage-summary-title">Tonight’s Path</h2>
        <div class="stage-summary-grid">
          ${state.journey.map((direction) => `
            <article class="stage-summary-item" style="--stage-accent:${escapeHtml(direction.stageColor)}">
              <span class="stage-summary-poll">Poll ${escapeHtml(direction.pollNumber)}</span>
              <h3>${escapeHtml(direction.stageLabel)}</h3>
              ${direction.scriptColor ? `<p class="stage-summary-colour">${escapeHtml(direction.scriptColor)}</p>` : ""}
              <p class="stage-summary-page">Page ${escapeHtml(direction.pageNumber)}</p>
            </article>`).join("")}
        </div>
      </section>`;
    return;
  }

  const direction = state.direction;
  display.innerHTML = direction ? `
    <section class="stage-direction" style="--stage-accent:${escapeHtml(direction.stageColor)}">
      <p class="stage-screen-header">Stage Direction</p>
      <h2 class="stage-choice">${escapeHtml(direction.stageLabel)}</h2>
      ${direction.scriptColor ? `<p class="script-colour">${escapeHtml(direction.scriptColor)}</p>` : ""}
      <p class="script-page">Page ${escapeHtml(direction.pageNumber)}</p>
    </section>` : `
    <section class="stage-direction waiting">
      <p class="stage-screen-header">Stage Direction</p>
      <p class="status">Stand by</p>
      <h2 class="stage-choice">Waiting for result</h2>
    </section>`;
}

async function connect() {
  showKey = keyInput.value;
  try {
    const state = await getState();
    sessionStorage.setItem("obp-stage-key", showKey);
    login.hidden = true;
    stageBrand.hidden = true;
    display.hidden = false;
    connectivity.hidden = false;
    render(state);
    markConnected();
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
    try {
      render(await getState());
      markConnected();
    } catch {
      markDisconnected();
    }
  }
}, 1000);
setInterval(updateConnectivity, 1000);
