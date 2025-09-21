from __future__ import annotations

from typing import List, Literal, Optional, Tuple

from pydantic import BaseModel, Field

SummaryStyle = Literal["bullets", "paragraph"]


class SummaryMeta(BaseModel):
    tokens: int = Field(..., ge=0)
    duration_ms: int = Field(..., ge=0)


class SummaryRequest(BaseModel):
    text: str = Field(..., min_length=1)
    ratio: Optional[float] = Field(default=0.3, ge=0.0, le=1.0)
    style: SummaryStyle = Field(default="bullets")


class SummaryResponse(BaseModel):
    summary: str
    summary_id: str = Field(..., alias="summary_id")
    meta: SummaryMeta

    class Config:
        allow_population_by_field_name = True


class QARequest(BaseModel):
    summary_id: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)


class Citation(BaseModel):
    from_: Literal["summary", "source"] = Field(..., alias="from")
    span: Optional[Tuple[int, int]] = None

    class Config:
        allow_population_by_field_name = True


class QAResponse(BaseModel):
    answer: str
    citations: Optional[List[Citation]] = None


class UploadResponse(BaseModel):
    text: str
