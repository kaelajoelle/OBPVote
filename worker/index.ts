import { story } from "../src/story.js";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  OPERATOR_KEY?: string;
}

type SessionStatus = "ready" | "open" | "closed" | "revealed" | "complete";

interface SessionRow {
  id: number;
  current_prompt_id: string | null;
  status: SessionStatus;
  manual_outcome_id: string | null;
  history_json: string;
}

interface HistoryEntry {
  promptId: string;
  winnerId: string;
  votes: Record<string, number>;
  manual: boolean;
  recordedAt?: number;
}

interface ArchiveRow {
  id: number;
  ended_at: number;
  total_votes: number;
  history_json: string;
}

const sessionSchema = `CREATE TABLE IF NOT EXISTS performance_session (
  id INTEGER PRIMARY KEY,
  current_prompt_id TEXT,
  status TEXT NOT NULL,
  manual_outcome_id TEXT,
  history_json TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL
)`;

const voteSchema = `CREATE TABLE IF NOT EXISTS votes (
  prompt_id TEXT NOT NULL,
  audience_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  PRIMARY KEY (prompt_id, audience_id)
)`;

const archiveSchema = `CREATE TABLE IF NOT EXISTS performance_archive (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ended_at INTEGER NOT NULL,
  total_votes INTEGER NOT NULL,
  history_json TEXT NOT NULL
)`;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

function promptById(promptId: string | null | undefined) {
  return story.prompts.find((prompt) => prompt.id === promptId) ?? null;
}

function parseHistory(value: string): HistoryEntry[] {
  try {
    return JSON.parse(value || "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

function outcomeDetails(promptId: string, winnerId: string) {
  const prompt = promptById(promptId);
  const option = prompt?.options.find((item) => item.id === winnerId) ?? null;
  if (!prompt || !option) return null;
  return {
    promptId: prompt.id,
    pollNumber: prompt.pollNumber,
    promptLabel: prompt.operatorLabel,
    outcomeId: option.id,
    outcomeLabel: option.label,
    scriptColor: option.scriptColor,
    stageColor: option.stageColor,
    stageDirection: option.stageDirection
  };
}

function enrichHistory(history: HistoryEntry[]) {
  return history.map((entry) => {
    const prompt = promptById(entry.promptId);
    const outcome = outcomeDetails(entry.promptId, entry.winnerId);
    const voteRows = prompt?.options.map((option) => ({
      id: option.id,
      label: option.label,
      count: Number(entry.votes?.[option.id] || 0)
    })) ?? [];
    return {
      ...entry,
      pollNumber: prompt?.pollNumber ?? "?",
      promptLabel: prompt?.operatorLabel ?? entry.promptId,
      winnerLabel: outcome?.outcomeLabel ?? entry.winnerId,
      totalVotes: voteRows.reduce((total, item) => total + item.count, 0),
      voteRows
    };
  });
}

function historyVoteTotal(history: HistoryEntry[]) {
  return history.reduce(
    (total, entry) => total + Object.values(entry.votes || {}).reduce((sum, count) => sum + Number(count), 0),
    0
  );
}

async function ensureDatabase(env: Env) {
  await env.DB.batch([
    env.DB.prepare(sessionSchema),
    env.DB.prepare(voteSchema),
    env.DB.prepare(archiveSchema),
    env.DB.prepare(`INSERT OR IGNORE INTO performance_session
      (id, current_prompt_id, status, manual_outcome_id, history_json, updated_at)
      VALUES (1, ?, 'ready', NULL, '[]', ?)`).bind(story.startPromptId, Date.now())
  ]);
}

async function getSession(env: Env) {
  const row = await env.DB.prepare("SELECT * FROM performance_session WHERE id = 1").first<SessionRow>();
  if (!row) throw new Error("The performance session is unavailable.");
  const needsPromptRepair = row.status !== "complete" && (!row.current_prompt_id || !promptById(row.current_prompt_id));
  if (needsPromptRepair) {
    await env.DB.prepare(`UPDATE performance_session
      SET current_prompt_id = ?, status = 'ready', manual_outcome_id = NULL, updated_at = ? WHERE id = 1`)
      .bind(story.startPromptId, Date.now()).run();
    row.current_prompt_id = story.startPromptId;
    row.status = "ready";
    row.manual_outcome_id = null;
  }
  return row;
}

async function getResults(env: Env, promptId: string | null) {
  const prompt = promptById(promptId);
  const counts = Object.fromEntries(prompt?.options.map((option) => [option.id, 0]) ?? []);
  if (!promptId) return counts;
  const rows = await env.DB.prepare(
    "SELECT option_id, COUNT(*) AS total FROM votes WHERE prompt_id = ? GROUP BY option_id"
  ).bind(promptId).all<{ option_id: string; total: number }>();
  for (const row of rows.results) if (row.option_id in counts) counts[row.option_id] = Number(row.total);
  return counts;
}

function winnerId(results: Record<string, number>, manualOutcomeId: string | null) {
  if (manualOutcomeId) return manualOutcomeId;
  const highest = Math.max(0, ...Object.values(results));
  if (highest === 0) return null;
  const winners = Object.entries(results).filter(([, count]) => count === highest);
  return winners.length === 1 ? winners[0][0] : null;
}

async function getArchives(env: Env) {
  const rows = await env.DB.prepare(
    "SELECT id, ended_at, total_votes, history_json FROM performance_archive ORDER BY id DESC LIMIT 20"
  ).all<ArchiveRow>();
  return rows.results.map((row) => ({
    id: row.id,
    endedAt: row.ended_at,
    totalVotes: row.total_votes,
    history: enrichHistory(parseHistory(row.history_json))
  }));
}

async function publicState(env: Env, audienceId: string | null) {
  const session = await getSession(env);
  const prompt = promptById(session.current_prompt_id);
  let hasVoted = false;
  if (audienceId && session.current_prompt_id) {
    hasVoted = Boolean(await env.DB.prepare(
      "SELECT 1 AS voted FROM votes WHERE prompt_id = ? AND audience_id = ?"
    ).bind(session.current_prompt_id, audienceId).first());
  }

  let revealedOutcome = null;
  if (session.status === "revealed" && prompt) {
    const results = await getResults(env, prompt.id);
    const selectedId = winnerId(results, session.manual_outcome_id);
    const selected = prompt.options.find((option) => option.id === selectedId);
    if (selected) revealedOutcome = { id: selected.id, label: selected.label };
  }

  return { status: session.status, prompt, hasVoted, revealedOutcome };
}

async function stageState(env: Env) {
  const session = await getSession(env);
  const prompt = promptById(session.current_prompt_id);
  const history = parseHistory(session.history_json);
  let direction = null;

  if (session.status === "revealed" && prompt) {
    const results = await getResults(env, prompt.id);
    const selectedId = winnerId(results, session.manual_outcome_id);
    if (selectedId) direction = outcomeDetails(prompt.id, selectedId);
  } else if (history.length) {
    const last = history.at(-1)!;
    direction = outcomeDetails(last.promptId, last.winnerId);
  }

  return {
    status: session.status,
    direction,
    currentPoll: prompt ? {
      id: prompt.id,
      pollNumber: prompt.pollNumber,
      label: prompt.operatorLabel
    } : null
  };
}

async function operatorState(env: Env, origin: string) {
  const session = await getSession(env);
  const prompt = promptById(session.current_prompt_id);
  const results = await getResults(env, session.current_prompt_id);
  const history = parseHistory(session.history_json);
  return {
    status: session.status,
    prompt,
    hasVoted: false,
    results,
    totalVotes: Object.values(results).reduce((total, count) => total + count, 0),
    winnerId: winnerId(results, session.manual_outcome_id),
    manualOutcomeId: session.manual_outcome_id,
    joinUrl: origin,
    stageUrl: `${origin}/stage.html`,
    resultsUrl: `${origin}/results.html`,
    history: enrichHistory(history),
    archives: await getArchives(env),
    prompts: story.prompts.map((item) => ({
      id: item.id,
      pollNumber: item.pollNumber,
      operatorLabel: item.operatorLabel,
      special: Boolean("special" in item && item.special)
    }))
  };
}

async function readBody(request: Request) {
  const text = await request.text();
  if (text.length > 10_000) throw new Error("Request is too large.");
  return text ? JSON.parse(text) as Record<string, string> : {};
}

function operatorIsAuthorized(request: Request, env: Env) {
  return request.headers.get("x-operator-key") === (env.OPERATOR_KEY || "rehearsal");
}

async function handleApi(request: Request, env: Env) {
  await ensureDatabase(env);
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/state") {
    return json(await publicState(env, url.searchParams.get("audienceId")));
  }

  if (request.method === "GET" && url.pathname === "/api/stage/state") {
    if (!operatorIsAuthorized(request, env)) return json({ error: "Show key is incorrect." }, 401);
    return json(await stageState(env));
  }

  if (request.method === "POST" && url.pathname === "/api/vote") {
    const body = await readBody(request);
    const session = await getSession(env);
    const prompt = promptById(session.current_prompt_id);
    if (session.status !== "open" || !prompt) return json({ error: "Voting is closed." }, 400);
    if (!body.audienceId || body.audienceId.length > 100) return json({ error: "A valid audience ID is required." }, 400);
    if (!prompt.options.some((option) => option.id === body.optionId)) return json({ error: "That choice is not available." }, 400);
    try {
      await env.DB.prepare("INSERT INTO votes (prompt_id, audience_id, option_id) VALUES (?, ?, ?)")
        .bind(prompt.id, body.audienceId, body.optionId).run();
    } catch (error) {
      if (String(error).includes("UNIQUE") || String(error).includes("constraint")) {
        return json({ error: "This browser has already voted in this round." }, 400);
      }
      throw error;
    }
    return json(await publicState(env, body.audienceId), 201);
  }

  if (!url.pathname.startsWith("/api/operator/")) return json({ error: "Not found." }, 404);
  if (!operatorIsAuthorized(request, env)) return json({ error: "Operator key is incorrect." }, 401);
  if (request.method === "GET" && url.pathname === "/api/operator/state") return json(await operatorState(env, url.origin));
  if (request.method !== "POST") return json({ error: "Not found." }, 404);

  const action = url.pathname.split("/").at(-1);
  const body = await readBody(request);
  const session = await getSession(env);
  const prompt = promptById(session.current_prompt_id);
  const now = Date.now();

  if (action === "open") {
    if (!prompt) return json({ error: "There is no current choice to open." }, 400);
    await env.DB.batch([
      env.DB.prepare("DELETE FROM votes WHERE prompt_id = ?").bind(prompt.id),
      env.DB.prepare("UPDATE performance_session SET status = 'open', manual_outcome_id = NULL, updated_at = ? WHERE id = 1").bind(now)
    ]);
  } else if (action === "close") {
    if (session.status !== "open") return json({ error: "The vote is not open." }, 400);
    await env.DB.prepare("UPDATE performance_session SET status = 'closed', updated_at = ? WHERE id = 1").bind(now).run();
  } else if (action === "override") {
    if (session.status !== "closed" || !prompt) return json({ error: "Close the vote before choosing an outcome." }, 400);
    if (!prompt.options.some((option) => option.id === body.optionId)) return json({ error: "That outcome is not available." }, 400);
    await env.DB.prepare("UPDATE performance_session SET manual_outcome_id = ?, updated_at = ? WHERE id = 1")
      .bind(body.optionId, now).run();
  } else if (action === "reveal") {
    if (session.status !== "closed" || !prompt) return json({ error: "Close the vote before revealing the result." }, 400);
    const results = await getResults(env, prompt.id);
    if (!winnerId(results, session.manual_outcome_id)) {
      return json({ error: "Choose a manual outcome to resolve a tie or empty vote." }, 400);
    }
    await env.DB.prepare("UPDATE performance_session SET status = 'revealed', updated_at = ? WHERE id = 1").bind(now).run();
  } else if (action === "advance") {
    if (session.status !== "revealed" || !prompt) return json({ error: "Reveal the result before advancing." }, 400);
    const results = await getResults(env, prompt.id);
    const selectedId = winnerId(results, session.manual_outcome_id);
    if (!selectedId) return json({ error: "Choose a manual outcome to resolve a tie or empty vote." }, 400);
    const option = prompt.options.find((item) => item.id === selectedId)!;
    const history = parseHistory(session.history_json);
    history.push({
      promptId: prompt.id,
      winnerId: selectedId,
      votes: results,
      manual: Boolean(session.manual_outcome_id),
      recordedAt: now
    });
    await env.DB.prepare(`UPDATE performance_session
      SET current_prompt_id = ?, status = ?, manual_outcome_id = NULL, history_json = ?, updated_at = ? WHERE id = 1`)
      .bind(option.nextPromptId, option.nextPromptId ? "ready" : "complete", JSON.stringify(history), now).run();
  } else if (action === "select") {
    if (!["ready", "complete"].includes(session.status)) {
      return json({ error: "Finish the current vote before loading another one." }, 400);
    }
    if (!story.prompts.some((item) => item.id === body.promptId)) return json({ error: "That vote is not available." }, 400);
    await env.DB.prepare(`UPDATE performance_session
      SET current_prompt_id = ?, status = 'ready', manual_outcome_id = NULL, updated_at = ? WHERE id = 1`)
      .bind(body.promptId, now).run();
  } else if (action === "reset") {
    const history = parseHistory(session.history_json);
    const statements = [];
    if (history.length) {
      statements.push(env.DB.prepare(
        "INSERT INTO performance_archive (ended_at, total_votes, history_json) VALUES (?, ?, ?)"
      ).bind(now, historyVoteTotal(history), JSON.stringify(history)));
    }
    statements.push(
      env.DB.prepare("DELETE FROM votes"),
      env.DB.prepare(`UPDATE performance_session
        SET current_prompt_id = ?, status = 'ready', manual_outcome_id = NULL, history_json = '[]', updated_at = ? WHERE id = 1`)
        .bind(story.startPromptId, now)
    );
    await env.DB.batch(statements);
  } else {
    return json({ error: "Unknown operator action." }, 404);
  }

  return json(await operatorState(env, url.origin));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env);
      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Request failed." }, 500);
    }
  }
};
