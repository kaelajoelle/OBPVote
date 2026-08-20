import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { story } from "./story.js";
import { VoteSession } from "./vote-session.js";

const root = fileURLToPath(new URL("../public/", import.meta.url));
const port = Number(process.env.PORT || 3000);
const operatorKey = process.env.OPERATOR_KEY || "rehearsal";
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;
const session = new VoteSession(story);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 10_000) throw new Error("Request is too large.");
  }
  return body ? JSON.parse(body) : {};
}

function requireOperator(request) {
  return request.headers["x-operator-key"] === operatorKey;
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/state") {
    return sendJson(response, 200, session.publicState(url.searchParams.get("audienceId")));
  }
  if (request.method === "POST" && url.pathname === "/api/vote") {
    const body = await readJson(request);
    session.castVote(body.audienceId, body.optionId);
    return sendJson(response, 201, session.publicState(body.audienceId));
  }
  if (url.pathname.startsWith("/api/operator/")) {
    if (!requireOperator(request)) return sendJson(response, 401, { error: "Operator key is incorrect." });
    if (request.method === "GET" && url.pathname === "/api/operator/state") {
      return sendJson(response, 200, session.operatorState(publicBaseUrl));
    }
    if (request.method === "POST") {
      const action = url.pathname.split("/").at(-1);
      const body = await readJson(request);
      if (action === "open") session.open();
      else if (action === "close") session.close();
      else if (action === "override") session.setManualOutcome(body.optionId);
      else if (action === "advance") session.advance();
      else if (action === "reset") session.reset();
      else return sendJson(response, 404, { error: "Unknown operator action." });
      return sendJson(response, 200, session.operatorState(publicBaseUrl));
    }
  }
  return sendJson(response, 404, { error: "Not found." });
}

async function serveStatic(request, response, url) {
  const requested = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const filePath = normalize(join(root, requested));
  if (!filePath.startsWith(normalize(root))) return sendJson(response, 403, { error: "Forbidden." });
  try {
    const file = await readFile(filePath);
    response.writeHead(200, { "content-type": mimeTypes[extname(filePath)] || "application/octet-stream" });
    response.end(file);
  } catch {
    sendJson(response, 404, { error: "Not found." });
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) await handleApi(request, response, url);
    else await serveStatic(request, response, url);
  } catch (error) {
    sendJson(response, 400, { error: error.message || "Request failed." });
  }
});

server.listen(port, () => {
  console.log(`OBP Vote audience view: ${publicBaseUrl}`);
  console.log(`Operator view: ${publicBaseUrl}/operator.html`);
});
