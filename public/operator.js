const login = document.querySelector("#operator-login");
const panel = document.querySelector("#operator-panel");
const keyInput = document.querySelector("#operator-key");
let operatorKey = sessionStorage.getItem("obp-operator-key") || "";
let showMode = sessionStorage.getItem("obp-show-mode") === "true";
let recoveryOpen = sessionStorage.getItem("obp-recovery-open") === "true";
let lastState = null;
let lastSyncAt = null;
let connectionFailureSince = null;
let refreshInFlight = false;
keyInput.value = operatorKey;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function markConnected() {
  lastSyncAt = Date.now();
  connectionFailureSince = null;
}

function markDisconnected() {
  if (!connectionFailureSince) connectionFailureSince = Date.now();
  updateLiveStatus();
}

async function api(action = "state", body = null) {
  let response;
  try {
    response = await fetch(`/api/operator/${action}`, {
      method: action === "state" ? "GET" : "POST",
      headers: { "content-type": "application/json", "x-operator-key": operatorKey },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store"
    });
  } catch {
    markDisconnected();
    throw new Error("Connection lost. The last-known show state is still displayed.");
  }
  markConnected();
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed.");
  return result;
}

function updatePill(element, state, text) {
  if (!element) return;
  element.classList.remove("connected", "reconnecting", "offline", "unknown");
  element.classList.add(state);
  element.querySelector(".connection-label").textContent = text;
}

function updateLiveStatus() {
  if (panel.hidden) return;
  const operatorPill = panel.querySelector("#operator-connectivity");
  const stagePill = panel.querySelector("#operator-stage-connectivity");
  const failureAge = connectionFailureSince ? Date.now() - connectionFailureSince : 0;
  const syncAge = lastSyncAt ? Math.max(0, Math.floor((Date.now() - lastSyncAt) / 1000)) : null;

  if (!connectionFailureSince && lastSyncAt) {
    updatePill(operatorPill, "connected", syncAge <= 1 ? "Operator connected · just now" : `Operator connected · ${syncAge}s ago`);
  } else if (failureAge < 5000) {
    updatePill(operatorPill, "reconnecting", "Operator reconnecting…");
  } else {
    updatePill(operatorPill, "offline", syncAge === null ? "Operator offline" : `Operator offline · last update ${formatDuration(syncAge)} ago`);
  }

  if (connectionFailureSince) {
    updatePill(stagePill, "unknown", "Stage display status unknown");
  } else if (!lastState?.stageLastSeen) {
    updatePill(stagePill, "unknown", "Stage display not detected");
  } else {
    const estimatedServerNow = Number(lastState.serverTime || Date.now()) + (lastSyncAt ? Date.now() - lastSyncAt : 0);
    const stageAge = Math.max(0, Math.floor((estimatedServerNow - Number(lastState.stageLastSeen)) / 1000));
    if (stageAge < 5) updatePill(stagePill, "connected", "Stage display connected");
    else if (stageAge < 10) updatePill(stagePill, "reconnecting", `Stage display delayed · ${stageAge}s`);
    else updatePill(stagePill, "offline", `Stage display offline · ${formatDuration(stageAge)} ago`);
  }

  const timer = panel.querySelector("#vote-timer");
  if (timer && lastState?.status === "open") {
    timer.textContent = `Voting open · ${formatDuration((Date.now() - Number(lastState.statusSince || Date.now())) / 1000)}`;
  }

  if (connectionFailureSince) {
    panel.querySelectorAll("[data-action]").forEach((button) => { button.disabled = true; });
  }
}

function connectionMarkup() {
  return `<div class="connection-row" aria-label="Connection health">
    <div id="operator-connectivity" class="connection-pill" role="status"><span class="connection-dot" aria-hidden="true"></span><span class="connection-label">Checking operator…</span></div>
    <div id="operator-stage-connectivity" class="connection-pill" role="status"><span class="connection-dot" aria-hidden="true"></span><span class="connection-label">Checking stage display…</span></div>
  </div>`;
}

function renderPerformanceSetup(state) {
  const needsCleanup = state.history.length > 0 || !["ready", "complete"].includes(state.status);
  panel.className = "card operator-panel";
  panel.innerHTML = `
    <div class="operator-command-bar">
      <div><p class="eyebrow">Performance setup</p><div class="operator-state-line"><span class="status">Ready to begin</span></div></div>
    </div>
    ${connectionMarkup()}
    ${needsCleanup ? `<section class="performance-setup">
      <p class="eyebrow">Previous session found</p>
      <h2>Prepare the new performance setup.</h2>
      <p>${state.history.length ? "Archive the existing voting history" : "Clear the unfinished voting state"} before creating a labelled performance and audience code.</p>
      <button class="secondary" data-action="reset" type="button">${state.history.length ? "Archive previous session" : "Clear previous session"}</button>
    </section>` : `<section class="performance-setup">
      <p class="eyebrow">New performance</p>
      <h2>Start tonight’s voting</h2>
      <p>Enter the same reference the Stage Manager will use in the show report. The audience code and QR will be created automatically.</p>
      <label for="report-code">Show-report reference</label>
      <div class="inline-control">
        <input id="report-code" type="text" maxlength="80" placeholder="Example: OBP-SEP21-EVE" autocomplete="off" />
        <button data-action="start" type="button">Start performance</button>
      </div>
      <p class="fine-print">This reference labels the saved results and exports. It is not a password and the audience will not see it.</p>
    </section>`}
    <nav class="quick-links" aria-label="Show pages">
      <a href="${escapeHtml(state.resultsUrl)}" target="_blank" rel="noreferrer"><span>Results history</span><small>Review and export saved performances</small></a>
      <a href="${escapeHtml(state.stageUrl)}" target="_blank" rel="noreferrer"><span>Stage Direction</span><small>Cast and stage-manager direction</small></a>
    </nav>`;
  updateLiveStatus();
}

function render(state) {
  lastState = state;
  if (!state.performance?.started) {
    renderPerformanceSetup(state);
    return;
  }
  const prompt = state.prompt;
  const maxVotes = Math.max(1, ...Object.values(state.results || {}));
  const canLoadPrompt = ["ready", "complete"].includes(state.status);
  const canSkipPrompt = prompt && ["ready", "open", "closed"].includes(state.status);
  const selectedOutcome = prompt?.options.find((option) => option.id === state.winnerId) || null;
  const nextPrompt = state.prompts.find((item) => item.id === selectedOutcome?.nextPromptId) || null;
  const statusLabels = { ready: "Ready", open: "Voting open", closed: "Voting closed", revealed: "Revealed", complete: "Complete" };
  const promptOptions = state.prompts.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === prompt?.id ? "selected" : ""}>Poll ${escapeHtml(item.pollNumber)} — ${escapeHtml(item.operatorLabel)}${item.special ? " (conditional)" : ""}</option>`).join("");
  const results = prompt?.options.map((option) => {
    const count = state.results[option.id] || 0;
    const manual = state.manualOutcomeId === option.id;
    const winner = state.winnerId === option.id;
    return `<div class="result-row ${winner ? "selected" : ""}">
      <div><strong>${escapeHtml(option.label)}</strong><span>${count} vote${count === 1 ? "" : "s"}</span></div>
      <div class="bar"><i style="width:${Math.round((count / maxVotes) * 100)}%"></i></div>
      ${state.status === "closed" ? `<button class="secondary" data-action="override" data-option-id="${escapeHtml(option.id)}">${manual ? "Manual outcome ✓" : "Use this outcome"}</button>` : ""}
    </div>`;
  }).join("") || "";

  let primaryAction = "";
  if (state.status === "ready") primaryAction = `<button class="primary-cue" data-action="open">Open Poll ${escapeHtml(prompt?.pollNumber || "")}</button>`;
  if (state.status === "open") primaryAction = `<button class="primary-cue" data-action="close">Close Poll ${escapeHtml(prompt?.pollNumber || "")} — ${state.totalVotes} vote${state.totalVotes === 1 ? "" : "s"}</button>`;
  if (state.status === "closed") primaryAction = `<button class="primary-cue" data-action="reveal" ${selectedOutcome ? "" : "disabled"}>${selectedOutcome ? `Reveal: ${escapeHtml(selectedOutcome.stageLabel || selectedOutcome.label)}` : "Choose an outcome to reveal"}</button>`;
  if (state.status === "revealed") primaryAction = `<button class="primary-cue" data-action="advance">${nextPrompt ? `Advance to Poll ${escapeHtml(nextPrompt.pollNumber)}` : "Finish story"}</button>`;

  panel.className = `card operator-panel${showMode ? " show-mode" : ""}`;
  panel.innerHTML = `
    <div class="operator-command-bar">
      <div>
        <p class="eyebrow">${prompt ? `Poll ${escapeHtml(prompt.pollNumber)} · ${escapeHtml(prompt.operatorLabel)}` : "Performance"}</p>
        <div class="operator-state-line"><span class="status">${escapeHtml(statusLabels[state.status] || state.status)}</span><strong>${state.totalVotes} current vote${state.totalVotes === 1 ? "" : "s"}</strong></div>
      </div>
      <button class="secondary mode-toggle" data-ui-action="toggle-show-mode">${showMode ? "Exit Show Mode" : "Enter Show Mode"}</button>
    </div>
    ${connectionMarkup()}
    <section class="performance-strip">
      <div><span>Show report</span><strong>${escapeHtml(state.performance.reportCode)}</strong></div>
      <div><span>Audience code</span><strong class="audience-code">${escapeHtml(state.performance.audienceCode)}</strong></div>
      <div><span>Joined devices</span><strong>${Number(state.performance.audienceDevices || 0)}</strong></div>
      <div class="performance-strip-actions">
        <button class="secondary" type="button" data-ui-action="copy-audience-code">Copy code</button>
        <button class="secondary setup-only" type="button" data-ui-action="copy-audience-link">Copy join link</button>
      </div>
    </section>
    ${state.status === "open" ? `<p id="vote-timer" class="vote-timer">Voting open · ${formatDuration((Date.now() - Number(state.statusSince || Date.now())) / 1000)}</p>` : ""}
    <section class="cue-control setup-only">
      <label for="prompt-picker">Vote to load on audience phones</label>
      <div class="inline-control">
        <select id="prompt-picker" ${canLoadPrompt ? "" : "disabled"}>${promptOptions}</select>
        <button class="secondary" data-action="select" ${canLoadPrompt ? "" : "disabled"}>Load selected vote</button>
      </div>
      <p class="fine-print">Loading a vote puts audience phones on standby. Press <strong>Open vote</strong> at the stage cue.</p>
    </section>
    ${prompt ? `<h2>${escapeHtml(prompt.title)}</h2>${prompt.question ? `<p>${escapeHtml(prompt.question)}</p>` : ""}` : `<h2>Story complete</h2><p>Exit Show Mode to archive this performance or prepare another run.</p>`}
    <div class="results">${results}</div>
    ${state.status === "revealed" ? `<p class="reveal-note">Stage Direction has updated. Audience phones are showing only each person’s own choice.</p>` : ""}
    <div class="operator-actions">
      ${primaryAction}
      ${canSkipPrompt ? `<button class="secondary" data-action="skip">Skip Poll ${escapeHtml(prompt.pollNumber)}</button>` : ""}
      <button class="secondary setup-only" data-action="reset">${state.history.length ? "Archive & end performance" : "End performance"}</button>
    </div>
    <details class="recovery-panel" ${recoveryOpen ? "open" : ""}>
      <summary>Connection problem?</summary>
      <div class="recovery-content">
        <p><strong>Audience issue while the operator is connected:</strong> collect a show of hands, close the vote, use the chosen outcome, reveal, and continue.</p>
        <p><strong>Operator offline:</strong> call the path manually, keep the last Stage Direction visible, and reconnect. Exit Show Mode to jump to the correct poll when service returns.</p>
      </div>
    </details>
    <nav class="quick-links setup-only" aria-label="Show pages">
      <a href="${escapeHtml(state.joinUrl)}" target="_blank" rel="noreferrer"><span>Audience page</span><small>Voting and personal choice confirmation</small></a>
      <a href="${escapeHtml(state.stageUrl)}" target="_blank" rel="noreferrer"><span>Stage Direction</span><small>Cast and stage-manager direction</small></a>
      <a href="${escapeHtml(state.resultsUrl)}" target="_blank" rel="noreferrer"><span>Results history</span><small>Current and archived run totals</small></a>
    </nav>
    <aside class="join-panel setup-only">
      <div><span class="eyebrow">Audience code · ${escapeHtml(state.performance.audienceCode)}</span><a href="${escapeHtml(state.joinUrl)}">${escapeHtml(state.joinUrl)}</a></div>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(state.joinUrl)}" alt="QR code for the audience join link" />
      <p class="fine-print">If the QR service is unavailable, display or announce the join link.</p>
    </aside>`;
  updateLiveStatus();
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
  const uiButton = event.target.closest("[data-ui-action]");
  if (uiButton?.dataset.uiAction === "copy-audience-code" || uiButton?.dataset.uiAction === "copy-audience-link") {
    const value = uiButton.dataset.uiAction === "copy-audience-code" ? lastState?.performance?.audienceCode : lastState?.joinUrl;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      const original = uiButton.textContent;
      uiButton.textContent = "Copied ✓";
      setTimeout(() => { uiButton.textContent = original; }, 1400);
    } catch {
      alert(value);
    }
    return;
  }
  if (uiButton?.dataset.uiAction === "toggle-show-mode") {
    showMode = !showMode;
    sessionStorage.setItem("obp-show-mode", String(showMode));
    if (lastState) render(lastState);
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button || button.disabled) return;
  if (button.dataset.action === "reset") {
    const performanceLabel = lastState?.performance?.reportCode || "the previous session";
    const message = lastState?.history.length
      ? `Archive ${performanceLabel} and end this performance?`
      : `End ${performanceLabel} without saving an empty run?`;
    if (!confirm(message)) return;
  }
  if (button.dataset.action === "skip") {
    const confirmed = confirm(`Skip Poll ${lastState?.prompt?.pollNumber || ""} without recording a result?`);
    if (!confirmed) return;
  }
  try {
    button.disabled = true;
    let body = {};
    if (button.dataset.optionId) body = { optionId: button.dataset.optionId };
    if (button.dataset.action === "select") body = { promptId: panel.querySelector("#prompt-picker").value };
    if (button.dataset.action === "start") body = { reportCode: panel.querySelector("#report-code").value };
    render(await api(button.dataset.action, body));
  } catch (error) {
    alert(error.message);
    button.disabled = false;
  }
});

async function refreshState() {
  if (panel.hidden || refreshInFlight) return;
  refreshInFlight = true;
  try {
    const state = await api();
    if (["prompt-picker", "report-code"].includes(document.activeElement?.id)) {
      lastState = state;
      updateLiveStatus();
    } else {
      render(state);
    }
  } catch {
    markDisconnected();
  } finally {
    refreshInFlight = false;
  }
}

panel.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.id === "report-code") {
    event.preventDefault();
    panel.querySelector('[data-action="start"]')?.click();
  }
});

panel.addEventListener("toggle", (event) => {
  if (!event.target.matches(".recovery-panel")) return;
  recoveryOpen = event.target.open;
  sessionStorage.setItem("obp-recovery-open", String(recoveryOpen));
}, true);

if (operatorKey) connect();
setInterval(refreshState, 1000);
setInterval(updateLiveStatus, 1000);
