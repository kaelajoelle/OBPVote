const card = document.querySelector("#vote-card");
const pageHeading = document.querySelector(".audience-shell .brand h1");
const storageKey = "obp-audience-id";
const performanceCodeStorageKey = "obp-performance-code";
const approvedQuotes = [
  { text: "Magic isn’t to be feared. It’s to be marvelled at.", speaker: "Anaax" },
  { text: "My friend, I love how you look at the world.", speaker: "Anaax" },
  { text: "I hope somewhere where the path is bright.", speaker: "Anaax" },
  { text: "We take the road less travelled. We go off the beaten path.", speaker: "Kytius" },
  { text: "Seeing the Seer gave him hope. So… that gave me hope.", speaker: "Khulgar" },
  { text: "Always lead with love.", speaker: "Khulgar" },
  { text: "I see what kind of audience we have this night… not that I’m judging you… much.", speaker: "The Bard’s College" }
];
const welcomeLore = [
  "No two performances of Off the Beaten Path follow exactly the same path.",
  "Tonight’s adventure will be shaped by the choices made in this room.",
  "The greatest adventures often begin with a single choice."
];
let lastState = null;
let pendingOptionId = null;
let pendingPromptId = null;
let voteSubmitting = false;
let lastRenderSignature = "";
let lastLoreTick = -1;
const codeFromLink = new URLSearchParams(location.search).get("code");
let performanceCode = codeFromLink || localStorage.getItem(performanceCodeStorageKey) || "";
let audienceId = localStorage.getItem(storageKey);
if (!audienceId) {
  audienceId = crypto.randomUUID();
  localStorage.setItem(storageKey, audienceId);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
}

function setExperience(stateName, heading, content) {
  document.body.dataset.audienceState = stateName;
  card.dataset.state = stateName;
  pageHeading.textContent = heading;
  card.innerHTML = `<span class="compass-ornament" aria-hidden="true"></span><span class="corner-flourish" aria-hidden="true"></span>${content}`;
}

function formatPerformanceDate(timestamp) {
  if (!timestamp) return "Tonight’s performance";
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", day: "numeric" }).format(new Date(timestamp));
}

function hashText(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function quoteForJourney(state) {
  const path = (state?.journeyResults || []).map((entry) => entry.yourChoice?.id || "none").join("|");
  const seed = `${state?.performance?.audienceCode || performanceCode}|${audienceId}|${path}`;
  return approvedQuotes[hashText(seed) % approvedQuotes.length];
}

function wrapCanvasText(context, value, maxWidth) {
  const words = String(value).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function drawCanvasLines(context, lines, x, y, lineHeight) {
  lines.forEach((line, index) => context.fillText(line, x, y + (index * lineHeight)));
  return y + (lines.length * lineHeight);
}

function loadJourneyLogo() {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = "/obp-logo.png";
  });
}

function drawCompass(context, x, y, radius) {
  context.save();
  context.translate(x, y);
  context.strokeStyle = "rgba(218, 176, 93, .62)";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.arc(0, 0, radius * .72, 0, Math.PI * 2);
  context.stroke();
  for (let index = 0; index < 16; index += 1) {
    const angle = (Math.PI * 2 * index) / 16;
    const inner = index % 4 === 0 ? radius * .56 : radius * .76;
    context.beginPath();
    context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    context.stroke();
  }
  context.fillStyle = "rgba(218, 176, 93, .82)";
  context.beginPath();
  context.moveTo(0, -radius * .68);
  context.lineTo(radius * .13, radius * .18);
  context.lineTo(0, radius * .08);
  context.lineTo(-radius * .13, radius * .18);
  context.closePath();
  context.fill();
  context.restore();
}

function drawFiligreeCorner(context, x, y, size, flip = 1) {
  context.save();
  context.translate(x, y);
  context.scale(flip, 1);
  context.strokeStyle = "rgba(218, 176, 93, .48)";
  context.lineWidth = 3;
  for (let offset = 0; offset < 3; offset += 1) {
    context.beginPath();
    context.moveTo(0, offset * 18);
    context.bezierCurveTo(size * .36, offset * 18, size * .16, size * .42, size * .62, size * .5);
    context.bezierCurveTo(size * .82, size * .54, size * .76, size * .82, size, size);
    context.stroke();
  }
  context.restore();
}

async function downloadJourney(state) {
  const entries = state?.journeyResults || [];
  if (!state?.recapReleased || !entries.length) throw new Error("Tonight’s path has not been released yet.");

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot create the journey image.");
  canvas.width = 1080;
  canvas.height = 1920;

  const background = context.createLinearGradient(0, 0, 1080, 1920);
  background.addColorStop(0, "#2b2118");
  background.addColorStop(.38, "#151711");
  background.addColorStop(1, "#080d0d");
  context.fillStyle = background;
  context.fillRect(0, 0, 1080, 1920);
  const glow = context.createRadialGradient(230, 170, 0, 230, 170, 650);
  glow.addColorStop(0, "rgba(188, 104, 35, .26)");
  glow.addColorStop(1, "rgba(188, 104, 35, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 1080, 900);

  context.strokeStyle = "rgba(218, 176, 93, .72)";
  context.lineWidth = 5;
  context.strokeRect(36, 36, 1008, 1848);
  context.strokeStyle = "rgba(218, 176, 93, .18)";
  context.lineWidth = 2;
  context.strokeRect(54, 54, 972, 1812);
  drawFiligreeCorner(context, 54, 54, 190, 1);
  drawFiligreeCorner(context, 1026, 1660, 190, -1);
  drawCompass(context, 900, 190, 92);

  const logo = await loadJourneyLogo();
  if (logo) context.drawImage(logo, 74, 78, 180, 180);
  context.textAlign = "left";
  context.fillStyle = "#d9b56d";
  context.font = "800 28px Arial, sans-serif";
  context.fillText("OFF THE BEATEN PATH", 292, 118);
  context.fillStyle = "#f2e5cb";
  context.font = "700 66px Georgia, serif";
  context.fillText("The Path I Forged", 292, 190);
  context.fillStyle = "rgba(242, 229, 203, .74)";
  context.font = "600 25px Arial, sans-serif";
  const performanceDate = formatPerformanceDate(state.performance?.startedAt);
  const audienceCode = state.performance?.audienceCode || performanceCode;
  context.fillText(`${performanceDate}  ·  ${audienceCode}`, 292, 238);

  const quote = quoteForJourney(state);
  context.fillStyle = "rgba(7, 10, 9, .62)";
  context.fillRect(76, 304, 928, 236);
  context.strokeStyle = "rgba(218, 176, 93, .34)";
  context.strokeRect(76, 304, 928, 236);
  context.fillStyle = "#f2e5cb";
  context.font = "italic 37px Georgia, serif";
  const quoteLines = wrapCanvasText(context, `“${quote.text}”`, 820).slice(0, 3);
  drawCanvasLines(context, quoteLines, 122, 370, 50);
  context.fillStyle = "#d9b56d";
  context.font = "800 22px Arial, sans-serif";
  context.fillText(`— ${quote.speaker.toUpperCase()}`, 122, 500);

  const definingPolls = new Set(["3", "4", "5", "6"]);
  let featured = entries.filter((entry) => definingPolls.has(String(entry.pollNumber)));
  if (featured.length < 4) featured = entries.filter((entry) => entry.yourChoice).slice(0, 4);
  featured = featured.slice(0, 4);
  let y = 586;
  for (const entry of featured) {
    const cardHeight = 252;
    context.fillStyle = "rgba(8, 12, 11, .7)";
    context.fillRect(76, y, 928, cardHeight);
    context.strokeStyle = "rgba(218, 176, 93, .26)";
    context.strokeRect(76, y, 928, cardHeight);
    context.fillStyle = "#d9b56d";
    context.font = "800 20px Arial, sans-serif";
    context.fillText(`PATH ${entry.pollNumber}`, 108, y + 38);
    context.fillStyle = "#f2e5cb";
    context.font = "700 29px Georgia, serif";
    const choiceLines = wrapCanvasText(context, entry.yourChoice?.label || "No choice recorded", 710).slice(0, 2);
    drawCanvasLines(context, choiceLines, 108, y + 78, 35);
    const percentage = Number(entry.yourPercentage || 0);
    context.textAlign = "right";
    context.fillStyle = "#f2d28a";
    context.font = "800 34px Arial, sans-serif";
    context.fillText(`${percentage}%`, 958, y + 91);
    context.textAlign = "left";
    context.fillStyle = "rgba(242, 229, 203, .16)";
    context.fillRect(108, y + 164, 850, 16);
    context.fillStyle = "#d9b56d";
    context.fillRect(108, y + 164, 850 * Math.max(0, Math.min(100, percentage)) / 100, 16);
    context.fillStyle = "rgba(242, 229, 203, .68)";
    context.font = "600 21px Arial, sans-serif";
    context.fillText(`${percentage}% of tonight’s Adventurers walked this path with you.`, 108, y + 220);
    y += cardHeight + 22;
  }

  context.textAlign = "center";
  context.fillStyle = "#f2e5cb";
  context.font = "700 38px Georgia, serif";
  context.fillText("What path will you choose?", 540, 1748);
  context.fillStyle = "#d9b56d";
  context.font = "800 27px Arial, sans-serif";
  context.fillText("OBPMUSICAL.COM", 540, 1800);
  context.fillStyle = "rgba(242, 229, 203, .52)";
  context.font = "600 18px Arial, sans-serif";
  context.fillText("A different adventure awaits at every performance.", 540, 1840);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("The journey image could not be created.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `obp-path-${audienceCode.toLowerCase()}-${new Date(state.performance?.startedAt || Date.now()).toISOString().slice(0, 10)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderSealedChoice(state, status = "Path confirmed") {
  setExperience("sealed", "Their fate is sealed.", state.yourChoice ? `
    <p class="status success">${escapeHtml(status)}</p>
    <div class="result-reveal path-confirmation"><span>You chose</span><h2>${escapeHtml(state.yourChoice.label)}</h2></div>
    <p class="return-to-stage">Return your attention to the stage, Adventurer.<br />The path continues there.</p>` : `
    <p class="status">The path is chosen</p><h2>Return your attention to the stage.</h2>`);
}

function journeyMarkup(state) {
  return (state.journeyResults || []).map((entry) => {
    const options = (entry.options || []).map((option) => {
      const yourPath = option.id === entry.yourChoice?.id;
      const audiencePath = option.id === entry.audienceChoice?.id;
      return `<div class="comparison-row ${yourPath ? "your-path" : ""}">
        <div class="comparison-label"><span>${escapeHtml(option.label)}</span><strong>${Number(option.percentage || 0)}%</strong></div>
        <div class="comparison-bar"><i style="width:${Math.max(0, Math.min(100, Number(option.percentage || 0)))}%"></i></div>
        <div class="comparison-tags">${yourPath ? "<span>Your choice</span>" : ""}${audiencePath ? "<span>Audience path</span>" : ""}</div>
      </div>`;
    }).join("");
    const personalMessage = entry.yourChoice
      ? `${Number(entry.yourPercentage || 0)}% of tonight’s Adventurers chose this path with you.`
      : "No choice was recorded from this device.";
    return `<article class="journey-item telltale-result">
      <div class="journey-heading"><span>Path ${escapeHtml(entry.pollNumber)}</span><strong>${escapeHtml(entry.promptLabel)}</strong></div>
      <div class="personal-path"><span>You chose</span><strong>${escapeHtml(entry.yourChoice?.label || "No choice recorded")}</strong></div>
      <div class="audience-comparison">${options}</div>
      <p class="journey-insight">${escapeHtml(personalMessage)}</p>
    </article>`;
  }).join("");
}

function render(state) {
  lastState = state;
  if (pendingPromptId !== state.prompt?.id || state.status !== "open" || state.hasVoted) {
    pendingOptionId = null;
    pendingPromptId = null;
  }

  if (state.status === "join") {
    if (state.joinStatus === "waiting") {
      setExperience("waiting", "Your path awaits.", `<p class="status">The path is quiet</p><h2>Tonight’s adventure has not opened yet.</h2><p>Keep this magical item close. The performance code will be revealed in the theatre.</p>`);
      return;
    }
    const invalid = state.joinStatus === "invalid";
    setExperience("join", "Enter the path.", `
      <p class="status ${invalid ? "warning" : ""}">${invalid ? "That code didn’t match" : "Tonight’s adventure"}</p>
      <h2>Enter your performance code.</h2><p>The code binds this device to the path unfolding in the theatre.</p>
      <form class="join-code-form" data-join-form>
        <label for="performance-code">Performance code</label>
        <input id="performance-code" name="performance-code" type="text" maxlength="20" autocomplete="one-time-code" autocapitalize="characters" placeholder="Example: RUNE-A3F7" value="${escapeHtml(invalid ? "" : performanceCode)}" required />
        <button type="submit">Begin the adventure</button>
      </form>`);
    return;
  }

  if (state.status === "complete") {
    if (!state.recapReleased || !state.journeyResults) {
      setExperience("bows", "The final path awaits.", `
        <p class="status">The adventure continues onstage</p><h2>Your complete path remains veiled.</h2>
        <p class="return-to-stage">Set this device aside and enjoy the final moments. Your journey will be revealed after the bows.</p>`);
      return;
    }
    const journey = journeyMarkup(state);
    const quote = quoteForJourney(state);
    setExperience("complete", "The path you forged.", `
      <p class="status">Tonight’s adventure</p><h2>Your choices have left their mark on Arlyrus.</h2>
      <div class="performance-keepsake-meta"><span>${escapeHtml(formatPerformanceDate(state.performance?.startedAt))}</span><span>${escapeHtml(state.performance?.audienceCode || performanceCode)}</span></div>
      <blockquote class="journey-quote"><p>“${escapeHtml(quote.text)}”</p><cite>— ${escapeHtml(quote.speaker)}</cite></blockquote>
      ${journey ? `<section class="journey-summary"><div class="breakdown-heading"><span>Your complete path</span><span>${state.journeyResults.length} choices</span></div>${journey}</section>` : ""}
      <button class="save-journey" type="button" data-save-journey>Save my path</button>
      <p class="save-note">Downloads a polished Instagram Story-sized PNG with your defining choices.</p>`);
    return;
  }

  if (state.status === "revealed") {
    renderSealedChoice(state, "Your choice");
    return;
  }
  if (state.hasVoted) {
    renderSealedChoice(state);
    return;
  }
  if (!state.prompt || state.status === "ready") {
    const isOpening = Number(state.historyCount || 0) === 0 && state.prompt?.pollNumber === "1";
    if (isOpening) {
      const lore = welcomeLore[Math.floor(Date.now() / 8000) % welcomeLore.length];
      setExperience("waiting", "Your path awaits.", `
        <p class="status">A message from the Bard’s College</p><h2>Good morrow, Adventurer.</h2>
        <p>Do not be alarmed—this is simply a minor illusion bringing our voice directly to your mind.</p>
        <p>Keep this magical item close. When The Architect calls upon you, your choice will appear here.</p>
        <p class="lore-whisper">${escapeHtml(lore)}</p>`);
    } else {
      setExperience("waiting", "The path continues.", `<p class="status">Stand by, Adventurer</p><h2>The next choice will appear when the path divides.</h2><p>Until then, return your attention to the stage.</p>`);
    }
    return;
  }
  if (state.status === "closed") {
    setExperience("closed", "The path is sealed.", `<p class="status">Voting closed</p><h2>The Companions’ path is being revealed.</h2><p>Return your attention to the stage, Adventurer.</p>`);
    return;
  }

  const choices = state.prompt.options.map((option) => {
    const selected = pendingOptionId === option.id;
    return `<button class="choice ${selected ? "selected" : ""}" data-option-id="${escapeHtml(option.id)}" aria-pressed="${selected}">${escapeHtml(option.label)}</button>`;
  }).join("");
  setExperience("open", "Choose your path.", `
    <p class="status">The path divides</p><h2>${escapeHtml(state.prompt.title)}</h2>
    ${state.prompt.question ? `<p>${escapeHtml(state.prompt.question)}</p>` : ""}
    <div class="choice-list">${choices}</div>
    <button class="confirm-path" type="button" data-confirm-path ${pendingOptionId && !voteSubmitting ? "" : "disabled"}>${voteSubmitting ? "Sealing your choice…" : "Confirm this path"}</button>
    <p class="selection-note">You may change your mind until you confirm.</p>`);
}

async function refresh() {
  try {
    const response = await fetch(`/api/state?audienceId=${encodeURIComponent(audienceId)}&code=${encodeURIComponent(performanceCode)}`, { cache: "no-store" });
    const state = await response.json();
    if (state.codeAccepted && performanceCode) {
      localStorage.setItem(performanceCodeStorageKey, performanceCode);
      if (codeFromLink) history.replaceState({}, "", location.pathname);
    }
    const renderSignature = JSON.stringify(state);
    const loreTick = state.status === "ready" && Number(state.historyCount || 0) === 0 ? Math.floor(Date.now() / 8000) : -1;
    if (document.activeElement?.id === "performance-code") {
      lastState = state;
    } else if (renderSignature !== lastRenderSignature || loreTick !== lastLoreTick) {
      render(state);
      lastRenderSignature = renderSignature;
      lastLoreTick = loreTick;
    } else {
      lastState = state;
    }
  } catch {
    setExperience("offline", "Hold fast, Adventurer.", `<p class="status warning">The connection falters</p><h2>Stay on this page.</h2><p>The path will return as soon as the magic steadies.</p>`);
  }
}

card.addEventListener("click", async (event) => {
  const saveButton = event.target.closest("[data-save-journey]");
  if (saveButton) {
    const originalLabel = saveButton.textContent;
    try {
      saveButton.disabled = true;
      saveButton.textContent = "Illuminating your path…";
      await downloadJourney(lastState);
    } catch (error) {
      alert(error.message);
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = originalLabel;
    }
    return;
  }
  const optionButton = event.target.closest("[data-option-id]");
  if (optionButton) {
    pendingOptionId = optionButton.dataset.optionId;
    pendingPromptId = lastState?.prompt?.id || null;
    render(lastState);
    return;
  }
  const confirmButton = event.target.closest("[data-confirm-path]");
  if (!confirmButton || !pendingOptionId || voteSubmitting) return;
  voteSubmitting = true;
  render(lastState);
  try {
    const response = await fetch("/api/vote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ audienceId, optionId: pendingOptionId, performanceCode })
    });
    const body = await response.json();
    if (response.status === 403) {
      performanceCode = "";
      localStorage.removeItem(performanceCodeStorageKey);
      render({ status: "join", joinStatus: "invalid", codeAccepted: false });
    } else if (!response.ok) {
      setExperience("error", "The path faltered.", `<p class="status warning">Choice not received</p><h2>${escapeHtml(body.error)}</h2><p>Wait for the next cue from the stage.</p>`);
    } else {
      pendingOptionId = null;
      pendingPromptId = null;
      render(body);
    }
  } catch {
    setExperience("offline", "Hold fast, Adventurer.", `<p class="status warning">Choice not received</p><h2>The connection faltered.</h2><p>Stay on this page and follow the stage cue.</p>`);
  } finally {
    voteSubmitting = false;
  }
});

card.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-join-form]");
  if (!form) return;
  event.preventDefault();
  const input = form.querySelector("#performance-code");
  const button = form.querySelector("button");
  performanceCode = input.value.trim();
  try {
    button.disabled = true;
    const response = await fetch(`/api/state?audienceId=${encodeURIComponent(audienceId)}&code=${encodeURIComponent(performanceCode)}`, { cache: "no-store" });
    const state = await response.json();
    if (state.codeAccepted) {
      localStorage.setItem(performanceCodeStorageKey, performanceCode);
      history.replaceState({}, "", location.pathname);
    }
    render(state);
  } catch {
    setExperience("offline", "Hold fast, Adventurer.", `<p class="status warning">The connection falters</p><h2>Stay on this page.</h2><p>The path will return as soon as the magic steadies.</p>`);
  }
});

refresh();
setInterval(refresh, 1000);
