# Morse Code Translator

English ⇄ Morse translator web app.

- **Frontend:** React + Vite (`frontend/`)
- **Backend:** FastAPI (`backend/`). Translation logic lives in `backend/app/translator.py`, separate from the API in `backend/app/main.py`.

## Requirements

- Python 3.10+
- Node.js 18+

## Development

Run the backend and frontend in two terminals.

```bash
# Terminal 1: API on http://127.0.0.1:8000  (docs at /docs)
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements-dev.txt
cd backend && uvicorn app.main:app --reload
```

```bash
# Terminal 2: UI on http://localhost:5173 (proxies /api to the backend)
cd frontend && npm install && npm run dev
```

## Production

The backend is API-only and does not serve the UI. Run the two parts separately:

```bash
# API
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000

# UI: build static files into frontend/dist
cd frontend && npm install && npm run build
```

Host `frontend/dist` with any static host (Nginx, Netlify, etc.). It can reach the API in one of two ways:

- **Same origin (recommended):** leave `VITE_API_BASE_URL` empty and have your web server
  proxy `/api` to the backend. `npm run preview` does this locally using `API_URL`.
- **Different origin:** build with `VITE_API_BASE_URL=https://your-api.example.com` and add the
  UI's origin to `CORS_ORIGINS` in `backend/.env`.

Opening the backend URL (`/`) returns JSON with links to the API docs (`/docs`) and health check.

## API

| Method | Path              | Body               | Response                               |
|--------|-------------------|--------------------|----------------------------------------|
| POST   | `/api/to-morse`   | `{"text": "SOS"}`  | `{"result": "... --- ...", "invalid": []}` |
| POST   | `/api/to-english` | `{"text": "... --- ..."}` | `{"result": "SOS", "invalid": []}` |
| GET    | `/api/health`     |                    | `{"status": "ok"}`                     |
| GET    | `/`               |                    | API name, version and links to docs    |

Morse format: letters are separated by a space, words by ` / ` (two or more spaces also work).
Unsupported characters or codes come back as `?` and are listed in `invalid`.

## Tests

```bash
cd backend && pytest
```

## Configuration

Settings are read from `.env` files. Templates are committed as `.env.example`; the real
`.env` files are git-ignored, so copy the templates on a fresh clone:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

| File            | Variable       | Purpose |
|-----------------|----------------|---------|
| `backend/.env`  | `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API cross-origin. Leave empty (default) when the UI is served by FastAPI or via the Vite dev proxy. |
| `frontend/.env` | `API_URL`      | Backend that `npm run dev` / `npm run preview` proxy `/api` to (default `http://127.0.0.1:8000`). Never sent to the browser. |
| `frontend/.env` | `VITE_API_BASE_URL` | Backend URL the built UI calls directly. Empty (default) means same-origin `/api`. Baked into the build, so it is public. |

Real environment variables override values in `.env` files.

## Theme

The UI is a comic "opening night of a guaranteed flop" stage, animated with
[anime.js](https://animejs.com) (`frontend/src/components/Stage.jsx`): a ranting,
tomato-pelted cartoon dictator, a chorus line, spotlights and a blinking marquee.
It is satire with the dictator as the butt of the joke. No Nazi insignia or salutes are drawn.

Audio is synthesized in the browser (`frontend/src/audio.js`), so the repo has no audio files:
an original WW2-style military march ("Strike up the band" button) and Morse beeps
("Tap it out"). Animations are skipped when the OS "reduce motion" setting is on.
