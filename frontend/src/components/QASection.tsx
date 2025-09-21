"use client";

import { FormEvent, useState } from "react";
import { CopyButton } from "./CopyButton";

export interface QAHistoryItem {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}

interface QASectionProps {
  summaryId?: string;
  qaHistory: QAHistoryItem[];
  onAsk: (question: string) => Promise<void> | void;
  isAsking: boolean;
}

export function QASection({ summaryId, qaHistory, onAsk, isAsking }: QASectionProps) {
  const [question, setQuestion] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    try {
      await onAsk(trimmed);
      setQuestion("");
    } catch (error) {
      // Intentionally leave the question for the user to revise.
    }
  };

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Q&A</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question about the summary..."
          disabled={!summaryId || isAsking}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!summaryId || !question.trim() || isAsking}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isAsking && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Ask
          </button>
        </div>
      </form>

      <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
        {qaHistory.length === 0 ? (
          <p className="text-sm text-slate-500">
            Ask a question about the generated summary. Answers will appear here.
          </p>
        ) : (
          qaHistory.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <header className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
                <CopyButton text={item.answer} ariaLabel="Copy answer" />
              </header>
              <p className="mb-2 text-sm font-semibold text-slate-700">Q: {item.question}</p>
              <p className="text-sm leading-relaxed text-slate-700">A: {item.answer}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
