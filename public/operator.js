const login = document.querySelector("#operator-login");
const panel = document.querySelector("#operator-panel");
const keyInput = document.querySelector("#operator-key");
let operatorKey = sessionStorage.getItem("obp-operator-key") || "";
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

function render(state) {
  const prompt = state.prompt;
  const maxVotes = Math.max(1, ...Object.values(state.results || {}));
  const results = prompt?.options.map((option) => {
    const count = state.results[option.id] || 0;
    const selected = state.manualOutcomeId === option.id;
    return `<div class="result-row ${selected ? "selected" : ""}">
      <div><strong>${escapeHtml(option.label)}</strong><span>${count} vote${count === 1 ? "" : "s"}</span></div>
      <div class="bar"><i style="width:${Math.round((count / maxVotes) * 100)}%"></i></div>
      ${state.status === "closed" ? `<button class="secondary" data-action="override" data-option-id="${escapeHtml(option.id)}">${selected ? "Manual outcome ✓" : "Choose outcome"}</button>` : ""}
    </div>`;
  }).join("") || "";

  panel.innerHTML = `
    <div class="operator-topline"><span class="status">${escapeHtml(state.status)}</span><strong>${state.totalVotes} total votes</strong></div>
    ${prompt ? `<h2>${escapeHtml(prompt.title)}</h2><p>${escapeHtml(prompt.question)}</p>` : `<h2>Story complete</h2>`}
    <div class="results">${results}</div>
    <div class="operator-actions">
      ${state.status === "ready" ? `<button data-action="open">Open vote</button>` : ""}
      ${state.status === "open" ? `<button data-action="close">Close vote</button>` : ""}
      ${state.status === "closed" ? `<button data-action="advance" ${state.winnerId ? "" : "disabled"}>Advance with outcome</button>` : ""}
      <button class="secondary" data-action="reset">Reset story</button>
    </div>
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
  try {
    button.disabled = true;
    render(await api(button.dataset.action, button.dataset.optionId ? { optionId: button.dataset.optionId } : {}));
  } catch (error) {
    alert(error.message);
    button.disabled = false;
  }
});

if (operatorKey) connect();
setInterval(async () => {
  if (!panel.hidden) {
    try { render(await api()); } catch { /* keep last-known state visible */ }
  }
}, 1000);
