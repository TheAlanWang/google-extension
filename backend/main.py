from __future__ import annotations

import os
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Dict
from uuid import uuid4

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.params import File

from models import QARequest, QAResponse, SummaryMeta, SummaryRequest, SummaryResponse, UploadResponse
from services.nlp import nlp_service


@dataclass
class SummaryCacheEntry:
    summary_id: str
    source_text: str
    summary_text: str
    created_at: datetime


SUMMARY_CACHE: Dict[str, SummaryCacheEntry] = {}

app = FastAPI(title="Summary Assistant API")

allowed_origins = os.getenv("FRONTEND_ORIGIN", "*")
origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/summary", response_model=SummaryResponse)
async def create_summary(payload: SummaryRequest) -> SummaryResponse:
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Source text must not be empty.")

    started = time.perf_counter()
    mock_summary = nlp_service.summarize(text, ratio=payload.ratio or 0.3, style=payload.style)
    elapsed_ms = int((time.perf_counter() - started) * 1000)

    summary_id = str(uuid4())
    SUMMARY_CACHE[summary_id] = SummaryCacheEntry(
        summary_id=summary_id,
        source_text=text,
        summary_text=mock_summary.text,
        created_at=datetime.utcnow(),
    )

    meta = SummaryMeta(tokens=len(_rough_tokenize(text)), duration_ms=elapsed_ms)

    return SummaryResponse(summary=mock_summary.text, summary_id=summary_id, meta=meta)


@app.post("/api/qa", response_model=QAResponse)
async def ask_question(payload: QARequest) -> QAResponse:
    summary_id = payload.summary_id.strip()
    question = payload.question.strip()

    if not summary_id or not question:
        raise HTTPException(status_code=400, detail="Both summary_id and question are required.")

    entry = SUMMARY_CACHE.get(summary_id)
    if not entry:
        raise HTTPException(status_code=400, detail="Summary not found. Generate a summary before asking questions.")

    answer, raw_citations = nlp_service.answer(question, entry.summary_text, entry.source_text)
    citations = [
        {"from": origin, "span": span} for origin, span in raw_citations
    ] or None

    return QAResponse(answer=answer, citations=citations)


@app.post("/api/upload", response_model=UploadResponse)
async def upload_text(file: UploadFile = File(...)) -> UploadResponse:
    filename = file.filename or ""
    if not filename.lower().endswith((".txt", ".md")):
        raise HTTPException(status_code=400, detail="Only .txt or .md files are supported.")

    data = await file.read()
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as exc:  # pragma: no cover - depends on input
        raise HTTPException(status_code=400, detail="Unable to decode the uploaded file as UTF-8.") from exc

    if not text.strip():
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    return UploadResponse(text=text)


def _rough_tokenize(text: str) -> list[str]:
    return text.split()


@app.get("/api/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
