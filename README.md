# Summary Assistant

A minimal full-stack demo that offers text summarisation and follow-up Q&A. The project ships with a FastAPI backend and a Next.js (App Router) frontend using TypeScript and Tailwind CSS.

## Project Structure

- `backend/` – FastAPI app exposing `/api/summary`, `/api/qa`, and `/api/upload`
- `frontend/` – Next.js single-page UI with React Query for data fetching
- `manifest.json`, `popup.html`, `popup.js`, `README.txt` – Existing extension artifacts (untouched)

## Prerequisites

- Python 3.10+
- Node.js 18+

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # optional; defaults fall back to permissive CORS
uvicorn main:app --reload --port 8000
```

## Frontend Setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The frontend expects the backend on `http://localhost:8000` by default; adjust the `.env.local` if you bind to another host or port.

## Running Tests

Backend tests (FastAPI endpoints):

```bash
cd backend
pytest
```

## Usage Notes

1. Paste text or upload a `.txt`/`.md` file on the left.
2. Click **Summarize** to generate bullet-point highlights.
3. Ask questions in the Q&A panel; answers leverage both the summary and the source text.
4. Copy buttons are available on the summary and each answer. The latest summary is cached in `localStorage` to survive page refreshes.

The NLP layer is a mock heuristic service. Swap in a real LLM by implementing the adapters in `backend/services/nlp.py`.
