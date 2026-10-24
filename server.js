const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

loadEnvFile();

const port = Number(process.env.PORT || 3000);
const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const publicFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]]
]);

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && url.pathname === "/api/health") {
    return sendJson(response, 200, {
      ok: true,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
  }

  if (request.method === "POST" && url.pathname === "/api/plan") {
    return createPlan(request, response);
  }

  if (request.method === "GET" && publicFiles.has(url.pathname)) {
    const [fileName, contentType] = publicFiles.get(url.pathname);
    const filePath = path.join(__dirname, fileName);
    return fs.readFile(filePath, (error, contents) => {
      if (error) {
        console.error(`Unable to read ${fileName}:`, error);
        return sendJson(response, 500, { error: "Unable to load the app." });
      }
      response.writeHead(200, { "Content-Type": contentType });
      response.end(contents);
    });
  }

  sendJson(response, 404, { error: "Not found." });
});

server.listen(port, () => {
  console.log(`Relay is running at http://localhost:${port}`);
});

async function createPlan(request, response) {
  if (!process.env.GEMINI_API_KEY) {
    return sendJson(response, 503, {
      error: "Gemini is not configured. Add GEMINI_API_KEY to your .env file and restart the server."
    });
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    return sendJson(response, error.statusCode || 400, { error: error.message });
  }

  const task = body && typeof body.task === "string" ? body.task.trim() : "";
  if (!task || task.length > 3000) {
    return sendJson(response, 400, {
      error: "Enter a task between 1 and 3000 characters."
    });
  }

  const prompt = [
    "Turn the user's business request into a practical, reviewable workflow plan.",
    "Do not claim that actions have been performed. Do not invent access to accounts or data.",
    "Return only JSON with this exact shape:",
    '{"summary":"short outcome","steps":[{"title":"short action","app":"tool or system","action":"what to do","details":"specific useful detail"}]}',
    "Return between 2 and 6 steps. Use plain text strings for every field.",
    `User request: ${task}`
  ].join("\n");

  let apiResponse;
  try {
    apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
        signal: AbortSignal.timeout(30000)
      }
    );
  } catch (error) {
    console.error("Gemini request failed:", error);
    return sendJson(response, 502, {
      error: "Could not reach Gemini. Check your connection and try again."
    });
  }

  if (!apiResponse.ok) {
    const detail = await apiResponse.text();
    console.error(`Gemini returned ${apiResponse.status}: ${detail.slice(0, 500)}`);
    return sendJson(response, 502, {
      error: `Gemini could not create a plan (HTTP ${apiResponse.status}). Check your API key, model, and quota.`
    });
  }

  let plan;
  try {
    const result = await apiResponse.json();
    const text = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();
    plan = validatePlan(JSON.parse(text));
  } catch (error) {
    console.error("Gemini returned an invalid plan:", error);
    return sendJson(response, 502, {
      error: "Gemini returned a response that could not be used as a workflow plan. Please try again."
    });
  }

  sendJson(response, 200, plan);
}

function validatePlan(value) {
  if (!value || typeof value.summary !== "string" || !Array.isArray(value.steps)) {
    throw new Error("The plan is missing a summary or steps.");
  }

  const steps = value.steps
    .filter((step) => step && ["title", "app", "action", "details"].every(
      (field) => typeof step[field] === "string"
    ))
    .slice(0, 6)
    .map((step) => ({
      title: step.title.slice(0, 120),
      app: step.app.slice(0, 80),
      action: step.action.slice(0, 240),
      details: step.details.slice(0, 400)
    }));

  if (steps.length < 2) {
    throw new Error("The plan did not include enough valid steps.");
  }

  return { summary: value.summary.slice(0, 300), steps };
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let tooLarge = false;
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      if (tooLarge) return;
      raw += chunk;
      if (raw.length > 10000) {
        const error = new Error("Request body is too large.");
        error.statusCode = 413;
        tooLarge = true;
        raw = "";
        reject(error);
      }
    });
    request.on("end", () => {
      if (tooLarge) return;
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || Object.hasOwn(process.env, match[1])) continue;
    process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
}
