const login = document.querySelector("#results-login");
const page = document.querySelector("#results-page");
const content = document.querySelector("#results-content");
const keyInput = document.querySelector("#results-key");
const refreshed = document.querySelector("#last-refreshed");
let showKey = sessionStorage.getItem("obp-operator-key") || sessionStorage.getItem("obp-results-key") || "";
let lastResultsState = null;
const openArchiveIds = new Set();
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
  if (!timestamp) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));
}

function renderEntries(entries) {
  if (!entries.length) return `<p class="empty-note">No completed votes in this performance yet.</p>`;
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

function exportActions(kind, id, disabled = false) {
  const idAttribute = id === null ? "" : ` data-record-id="${escapeHtml(id)}"`;
  return `<div class="report-actions">
    <button class="secondary" type="button" data-export="copy" data-record-kind="${kind}"${idAttribute} ${disabled ? "disabled" : ""}>Copy show report summary</button>
    <button class="secondary" type="button" data-export="csv" data-record-kind="${kind}"${idAttribute} ${disabled ? "disabled" : ""}>Download CSV</button>
  </div>`;
}

function activeRecord(state) {
  return {
    id: "active",
    reportCode: state.performance?.reportCode,
    audienceCode: state.performance?.audienceCode,
    startedAt: state.performance?.startedAt,
    endedAt: null,
    audienceDevices: Number(state.performance?.audienceDevices || 0),
    totalVotes: state.history.reduce((sum, entry) => sum + entry.totalVotes, 0),
    history: state.history
  };
}

function recordForButton(button) {
  if (button.dataset.recordKind === "active") return activeRecord(lastResultsState);
  return lastResultsState.archives.find((archive) => String(archive.id) === button.dataset.recordId) || null;
}

function resultPercentage(count, total) {
  return total > 0 ? Math.round((Number(count || 0) / total) * 100) : 0;
}

function showReportSummary(record) {
  const lines = [
    "OFF THE BEATEN PATH — AUDIENCE VOTING SUMMARY",
    `Performance: ${record.reportCode || "Legacy / unlabelled performance"}`,
    `Audience code: ${record.audienceCode || "Not recorded"}`,
    `Started: ${formatDate(record.startedAt)}`,
    `Ended: ${record.endedAt ? formatDate(record.endedAt) : "Active performance"}`,
    `Participating devices: ${Number(record.audienceDevices || 0)}`,
    `Total votes cast: ${Number(record.totalVotes || 0)}`,
    ""
  ];
  for (const entry of record.history) {
    lines.push(`Poll ${entry.pollNumber} — ${entry.promptLabel}`);
    lines.push(`Selected: ${entry.winnerLabel}${entry.manual ? " (manual outcome)" : ""}`);
    for (const vote of entry.voteRows) {
      lines.push(`• ${vote.label}: ${vote.count} (${resultPercentage(vote.count, entry.totalVotes)}%)`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function showReportCsv(record) {
  const headings = ["performance_reference", "audience_code", "started_at", "ended_at", "participating_devices", "poll_number", "poll", "option", "votes", "percentage", "selected", "manual_outcome"];
  const rows = [headings.map(csvCell).join(",")];
  for (const entry of record.history) {
    for (const vote of entry.voteRows) {
      rows.push([
        record.reportCode || "",
        record.audienceCode || "",
        record.startedAt ? new Date(record.startedAt).toISOString() : "",
        record.endedAt ? new Date(record.endedAt).toISOString() : "",
        Number(record.audienceDevices || 0),
        entry.pollNumber,
        entry.promptLabel,
        vote.label,
        vote.count,
        resultPercentage(vote.count, entry.totalVotes),
        vote.id === entry.winnerId ? "yes" : "no",
        entry.manual ? "yes" : "no"
      ].map(csvCell).join(","));
    }
  }
  return `\uFEFF${rows.join("\r\n")}`;
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function downloadCsv(record) {
  const blob = new Blob([showReportCsv(record)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeReference = String(record.reportCode || `performance-${record.id}`).replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
  link.href = url;
  link.download = `${safeReference || "obp-performance"}-voting.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function render(state) {
  lastResultsState = state;
  const current = activeRecord(state);
  const archives = state.archives.length ? state.archives.map((archive) => `
    <details class="archive-run" data-archive-id="${escapeHtml(archive.id)}" ${openArchiveIds.has(String(archive.id)) ? "open" : ""}>
      <summary><strong>${escapeHtml(archive.reportCode || "Legacy run")}</strong> · ${escapeHtml(formatDate(archive.endedAt))} · ${archive.totalVotes} total votes</summary>
      <div class="performance-meta"><span>${Number(archive.audienceDevices || 0)} participating devices</span><span>Audience code ${escapeHtml(archive.audienceCode || "not recorded")}</span></div>
      ${exportActions("archive", archive.id, !archive.history.length)}
      ${renderEntries(archive.history)}
    </details>`).join("") : `<p class="empty-note">Past performances will appear after you use Archive &amp; end performance on the operator page.</p>`;

  content.innerHTML = `
    <section class="results-section">
      <div class="section-heading"><div><p class="eyebrow">Active performance</p><h2>${escapeHtml(current.reportCode || "Not started")}</h2></div><strong>${current.totalVotes} recorded votes</strong></div>
      ${state.performance?.started ? `<div class="performance-meta"><span>${current.audienceDevices} participating devices</span><span>Audience code ${escapeHtml(current.audienceCode)}</span><span>Started ${escapeHtml(formatDate(current.startedAt))}</span></div>${exportActions("active", null, !current.history.length)}` : `<p class="empty-note">Start a performance on the operator page to create its show-report record and audience code.</p>`}
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

content.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-export]");
  if (!button || button.disabled) return;
  const record = recordForButton(button);
  if (!record) return;
  const original = button.textContent;
  try {
    button.disabled = true;
    if (button.dataset.export === "copy") {
      await copyText(showReportSummary(record));
      button.textContent = "Summary copied ✓";
    } else {
      downloadCsv(record);
      button.textContent = "CSV downloaded ✓";
    }
  } catch (error) {
    alert(error.message || "The export could not be created.");
  } finally {
    setTimeout(() => {
      button.disabled = false;
      button.textContent = original;
    }, 1500);
  }
});

content.addEventListener("toggle", (event) => {
  const archive = event.target.closest(".archive-run[data-archive-id]");
  if (!archive) return;
  if (archive.open) openArchiveIds.add(archive.dataset.archiveId);
  else openArchiveIds.delete(archive.dataset.archiveId);
}, true);

if (showKey) connect();
