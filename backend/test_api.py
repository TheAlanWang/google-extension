from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from main import SUMMARY_CACHE, app

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_cache() -> None:
    SUMMARY_CACHE.clear()


def test_summary_success() -> None:
    payload = {
        "text": "Lorem ipsum dolor sit amet. Pellentesque habitant morbi tristique senectus." * 3,
        "ratio": 0.3,
        "style": "bullets",
    }
    response = client.post("/api/summary", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]
    assert data["summary_id"] in SUMMARY_CACHE
    assert data["meta"]["tokens"] > 0


def test_summary_bad_request() -> None:
    response = client.post("/api/summary", json={"text": "   "})
    assert response.status_code == 400


def test_qa_success() -> None:
    summary_response = client.post(
        "/api/summary",
        json={"text": "FastAPI is a modern, fast web framework for building APIs with Python." * 2},
    )
    summary_data = summary_response.json()

    qa_response = client.post(
        "/api/qa",
        json={
            "summary_id": summary_data["summary_id"],
            "question": "What is FastAPI used for?",
        },
    )

    assert qa_response.status_code == 200
    data = qa_response.json()
    assert "FastAPI" in data["answer"]


def test_qa_missing_summary() -> None:
    response = client.post(
        "/api/qa",
        json={"summary_id": "missing", "question": "What is the topic?"},
    )
    assert response.status_code == 400
    assert response.json()["detail"].startswith("Summary not found")
