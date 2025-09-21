"use client";

import { CopyButton } from "./CopyButton";

interface SummaryCardProps {
  summary: string;
  tokens: number;
  durationMs: number;
}

export function SummaryCard({ summary, tokens, durationMs }: SummaryCardProps) {
  const hasSummary = summary.trim().length > 0;
  const lines = summary.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const looksLikeBulletList = lines.every((line) => /^[-•]\s+/.test(line.trim()));
  const items = looksLikeBulletList
    ? lines.map((line) => line.replace(/^[-•]\s*/, "").trim())
    : [];

  return (
    <section className="relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800">Summarized Key Points</h2>
        <CopyButton text={summary} ariaLabel="Copy summary" />
      </div>

      {hasSummary ? (
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {items.length > 0 ? (
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
              {items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Generate a summary to see the key points highlighted here.
        </p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-4 text-xs text-slate-500">
        <div>
          <dt className="font-medium text-slate-600">Tokens</dt>
          <dd>{hasSummary ? tokens : "--"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Duration</dt>
          <dd>{hasSummary ? `${durationMs} ms` : "--"}</dd>
        </div>
      </dl>
    </section>
  );
}
