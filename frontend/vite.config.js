import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// `npm run dev` and `npm run preview` proxy /api to the FastAPI server, so no CORS is needed.
export default defineConfig(({ mode }) => {
  // Load frontend/.env* (all keys, not just VITE_*). These are only used here in
  // the build/dev config and are never exposed to browser code.
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const proxy = { "/api": env.API_URL || "http://127.0.0.1:8000" };

  // Production builds bake in VITE_API_BASE_URL. Warn loudly if it is missing,
  // and point out look-alike variables (e.g. a misspelled name).
  if (mode === "production" && env.VITE_API_BASE_URL?.trim()) {
    console.log(`\n[config] Building with API base URL: ${env.VITE_API_BASE_URL.trim()}\n`);
  } else if (mode === "production") {
    const lookalikes = Object.keys(env).filter(
      (k) => k !== "VITE_API_BASE_URL" && /^VITE_.*(API|BASE|URL)/i.test(k),
    );
    console.warn(
      "\n[config] VITE_API_BASE_URL is empty: the app will call /api on its own origin." +
        "\n         That only works if the static host proxies /api to the backend." +
        (lookalikes.length ? `\n         Found similar variable(s): ${lookalikes.join(", ")} (typo?)` : "") +
        "\n",
    );
  }
  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  };
});
