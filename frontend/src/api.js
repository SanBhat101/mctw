// Thin client for the FastAPI backend.
// VITE_API_BASE_URL is baked in at build time. Leave it empty to call the same
// origin (the Vite dev/preview proxy forwards /api to the backend); set it to the
// backend's URL (e.g. https://api.example.com) when the UI is hosted separately.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");

if (API_BASE && !/^https?:\/\//.test(API_BASE)) {
  console.error(
    `VITE_API_BASE_URL="${API_BASE}" must start with http:// or https://, otherwise it is treated as a path on this site.`,
  );
}

const HINT =
  "The request probably reached the static site instead of the backend. " +
  "Build the frontend with VITE_API_BASE_URL set to your backend URL, or proxy /api to it.";

async function post(path, text) {
  const url = `${API_BASE}${path}`;
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // Network failure, or the browser blocked the response due to CORS.
    throw new Error(`Could not reach the API at ${url}. Is the backend up, and is this site's origin in CORS_ORIGINS?`);
  }

  // Read as text first so an empty or HTML reply gives a useful error, not a JSON.parse crash.
  const raw = await res.text();
  let body = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    /* not JSON */
  }

  if (!res.ok) {
    const detail = body?.detail?.[0]?.msg ?? body?.detail ?? res.statusText;
    throw new Error(`Request to ${url} failed (${res.status})${detail ? `: ${detail}` : ""}. ${body ? "" : HINT}`.trim());
  }
  if (!body || typeof body.result !== "string") {
    throw new Error(`Got a non-API response from ${url} (status ${res.status}). ${HINT}`);
  }
  return body; // { result: string, invalid: string[] }
}

export const toMorse = (text) => post("/api/to-morse", text);
export const toEnglish = (text) => post("/api/to-english", text);
