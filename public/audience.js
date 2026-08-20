const card = document.querySelector("#vote-card");
const storageKey = "obp-audience-id";
let lastState = null;
let audienceId = localStorage.getItem(storageKey);
if (!audienceId) {
  audienceId = crypto.randomUUID();
  localStorage.setItem(storageKey, audienceId);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
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

async function downloadJourney(state) {
  const entries = state?.journeyResults || [];
  if (!entries.length) throw new Error("There are no completed choices to save yet.");

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot create the journey image.");
  const width = 1200;
  const margin = 80;
  const contentWidth = width - (margin * 2);
  canvas.width = width;

  const prepared = entries.map((entry) => {
    context.font = "700 36px Georgia, serif";
    const promptLines = wrapCanvasText(context, `Poll ${entry.pollNumber} — ${entry.promptLabel}`, contentWidth - 80);
    context.font = "700 34px Arial, sans-serif";
    const personalLines = wrapCanvasText(context, entry.yourChoice?.label || "No vote recorded", contentWidth - 80);
    context.font = "700 30px Arial, sans-serif";
    const audienceLines = wrapCanvasText(context, `${entry.audienceChoice?.label || "Not recorded"} · ${Number(entry.audiencePercentage || 0)}%`, contentWidth - 80);
    const height = 210 + (promptLines.length * 44) + (personalLines.length * 42) + (audienceLines.length * 38);
    return { entry, promptLines, personalLines, audienceLines, height: Math.max(340, height) };
  });

  const headerHeight = 390;
  const footerHeight = 150;
  const gap = 28;
  canvas.height = headerHeight + footerHeight + prepared.reduce((total, item) => total + item.height + gap, 0);

  const background = context.createLinearGradient(0, 0, width, canvas.height);
  background.addColorStop(0, "#112f29");
  background.addColorStop(.55, "#101b35");
  background.addColorStop(1, "#0e1719");
  context.fillStyle = background;
  context.fillRect(0, 0, width, canvas.height);
  context.strokeStyle = "#d5aa58";
  context.lineWidth = 10;
  context.strokeRect(24, 24, width - 48, canvas.height - 48);

  const logo = await loadJourneyLogo();
  if (logo) context.drawImage(logo, (width - 170) / 2, 58, 170, 170);
  context.textAlign = "center";
  context.fillStyle = "#d5aa58";
  context.font = "800 26px Arial, sans-serif";
  context.fillText("OFF THE BEATEN PATH", width / 2, 272);
  context.fillStyle = "#f3ead8";
  context.font = "700 58px Georgia, serif";
  context.fillText("Tonight’s Path", width / 2, 340);
  context.textAlign = "left";

  let y = headerHeight;
  for (const item of prepared) {
    context.fillStyle = "rgba(8, 14, 16, .72)";
    context.fillRect(margin, y, contentWidth, item.height);
    context.strokeStyle = "rgba(213, 170, 88, .58)";
    context.lineWidth = 3;
    context.strokeRect(margin, y, contentWidth, item.height);

    let textY = y + 58;
    context.fillStyle = "#d5aa58";
    context.font = "700 36px Georgia, serif";
    textY = drawCanvasLines(context, item.promptLines, margin + 40, textY, 44) + 24;

    context.fillStyle = "rgba(243, 234, 216, .7)";
    context.font = "800 20px Arial, sans-serif";
    context.fillText("YOUR CHOICE", margin + 40, textY);
    textY += 42;
    context.fillStyle = "#f3ead8";
    context.font = "700 34px Arial, sans-serif";
    textY = drawCanvasLines(context, item.personalLines, margin + 40, textY, 42) + 18;

    context.fillStyle = "rgba(243, 234, 216, .7)";
    context.font = "800 20px Arial, sans-serif";
    context.fillText("AUDIENCE PATH", margin + 40, textY);
    textY += 38;
    context.fillStyle = "#f2d89f";
    context.font = "700 30px Arial, sans-serif";
    drawCanvasLines(context, item.audienceLines, margin + 40, textY, 38);
    y += item.height + gap;
  }

  context.textAlign = "center";
  context.fillStyle = "rgba(243, 234, 216, .72)";
  context.font = "600 22px Arial, sans-serif";
  context.fillText("Your choices shaped tonight’s adventure through Arlyrus.", width / 2, canvas.height - 82);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("The journey image could not be created.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `off-the-beaten-path-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function render(state) {
  lastState = state;
  if (state.status === "revealed") {
    card.innerHTML = state.yourChoice ? `
      <p class="status success">Your choice</p>
      <div class="result-reveal">
        <span>You chose</span>
        <h2>${escapeHtml(state.yourChoice.label)}</h2>
      </div>
      <p>Eyes back to the stage—the path continues now.</p>` : `
      <p class="status">The path is chosen</p>
      <h2>Eyes back to the stage.</h2>`;
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
    card.innerHTML = `<p class="status">The path is chosen.</p><h2>Now watch how your choices unfold, adventurer.</h2>${journey ? `<section class="journey-summary"><div class="breakdown-heading"><span>Tonight’s path</span><span>${state.journeyResults.length} choices</span></div>${journey}</section><button class="save-journey" type="button" data-save-journey>Save this page</button><p class="save-note">Downloads your Tonight’s Path keepsake as a PNG image.</p>` : ""}`;
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
  const saveButton = event.target.closest("[data-save-journey]");
  if (saveButton) {
    const originalLabel = saveButton.textContent;
    try {
      saveButton.disabled = true;
      saveButton.textContent = "Preparing image…";
      await downloadJourney(lastState);
    } catch (error) {
      alert(error.message);
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = originalLabel;
    }
    return;
  }
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
