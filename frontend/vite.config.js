import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// `npm run dev` and `npm run preview` proxy /api to the FastAPI server, so no CORS is needed.
export default defineConfig(({ mode }) => {
  // Load frontend/.env* (all keys, not just VITE_*). These are only used here in
  // the build/dev config and are never exposed to browser code.
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const proxy = { "/api": env.API_URL || "http://127.0.0.1:8000" };
  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  };
});
