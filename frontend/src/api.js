// Thin client for the FastAPI backend.
// VITE_API_BASE_URL is baked in at build time. Leave it empty to call the same
// origin (the Vite dev/preview proxy forwards /api to the backend); set it to the
// backend's URL (e.g. https://api.example.com) when the UI is hosted separately.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

async function post(path, text) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail?.[0]?.msg ?? res.statusText;
    throw new Error(`Request failed (${res.status}): ${detail}`);
  }
  return res.json(); // { result: string, invalid: string[] }
}

export const toMorse = (text) => post("/api/to-morse", text);
export const toEnglish = (text) => post("/api/to-english", text);
