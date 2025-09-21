"use client";

import { ChangeEvent } from "react";

interface TextInputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onSummarize: () => void;
  onClear: () => void;
  onFileLoaded: (file: File) => Promise<void> | void;
  disabledSummarize: boolean;
  isSummarizing: boolean;
}

export function TextInputPanel({
  value,
  onChange,
  onSummarize,
  onClear,
  onFileLoaded,
  disabledSummarize,
  isSummarizing,
}: TextInputPanelProps) {
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await onFileLoaded(file);
    event.target.value = "";
  };

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Source Text</h2>
        <label className="inline-flex cursor-pointer items-center rounded-md border border-dashed border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
          Upload .txt / .md
          <input
            type="file"
            accept=".txt,.md,text/plain, text/markdown"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste source text here or upload a .txt/.md file"
        className="flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onSummarize}
          disabled={disabledSummarize}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSummarizing && (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          Summarize
        </button>
      </div>
    </section>
  );
}
