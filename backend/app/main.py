"""FastAPI app exposing the Morse translator.

API only: the React frontend is built and served separately.

Run:  uvicorn app.main:app --reload          (from backend/)
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import translator

# Load backend/.env if present. Real environment variables take precedence.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

MAX_INPUT_LEN = 10_000

app = FastAPI(title="Morse Code Translator API", version="1.0.0")

# Only needed if the frontend is served from a different origin than the API.
# The Vite dev server proxies /api, so by default nothing is allowed.

#_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
# Browsers send an Origin header like "https://site.example" (no trailing slash),
# so strip any trailing slash from the configured values.
_origins = [o.strip().rstrip("/") for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
if _origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_origins,
        allow_methods=["POST", "GET"],
        allow_headers=["Content-Type"],
    )


class TranslateRequest(BaseModel):
    text: str = Field(..., max_length=MAX_INPUT_LEN)


class TranslateResponse(BaseModel):
    result: str
    invalid: list[str]


@app.get("/")
def root() -> dict[str, str]:
    """API landing info. The UI is a separate app and is not served here."""
    return {"name": app.title, "version": app.version, "docs": "/docs", "health": "/api/health"}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/to-morse", response_model=TranslateResponse)
def to_morse(req: TranslateRequest) -> TranslateResponse:
    t = translator.to_morse(req.text)
    return TranslateResponse(result=t.result, invalid=t.invalid)


@app.post("/api/to-english", response_model=TranslateResponse)
def to_english(req: TranslateRequest) -> TranslateResponse:
    t = translator.to_english(req.text)
    return TranslateResponse(result=t.result, invalid=t.invalid)

