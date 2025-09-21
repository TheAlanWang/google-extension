"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { askQuestion, summarize, uploadFile } from "../lib/api";
import { SummaryCard } from "../components/SummaryCard";
import { TextInputPanel } from "../components/TextInputPanel";
import { QAHistoryItem, QASection } from "../components/QASection";

const SUMMARY_STORAGE_KEY = "summary-assistant:last-summary";

type SummaryState = {
  summary: string;
  summaryId: string;
  tokens: number;
  durationMs: number;
};

const EMPTY_SUMMARY: SummaryState = {
  summary: "",
  summaryId: "",
  tokens: 0,
  durationMs: 0,
};

export default function Page() {
  const [sourceText, setSourceText] = useState("");
  const [summaryState, setSummaryState] = useState<SummaryState>(EMPTY_SUMMARY);
  const [qaHistory, setQaHistory] = useState<QAHistoryItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(SUMMARY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SummaryState & { sourceText?: string };
        setSummaryState({
          summary: parsed.summary ?? "",
          summaryId: parsed.summaryId ?? "",
          tokens: parsed.tokens ?? 0,
          durationMs: parsed.durationMs ?? 0,
        });
        if (parsed.sourceText) {
          setSourceText(parsed.sourceText);
        }
      }
    } catch (error) {
      console.warn("Failed to hydrate summary from storage", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    if (summaryState.summaryId) {
      const payload = {
        ...summaryState,
        sourceText,
      };
      window.localStorage.setItem(SUMMARY_STORAGE_KEY, JSON.stringify(payload));
    } else {
      window.localStorage.removeItem(SUMMARY_STORAGE_KEY);
    }
  }, [summaryState, sourceText, isHydrated]);

  const summarizeMutation = useMutation({
    mutationFn: summarize,
    onSuccess: (data) => {
      setSummaryState({
        summary: data.summary,
        summaryId: data.summary_id,
        tokens: data.meta.tokens,
        durationMs: data.meta.duration_ms,
      });
      setQaHistory([]);
      toast.success("Summary generated");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to summarize";
      toast.error(message);
    },
  });

  const askMutation = useMutation({
    mutationFn: askQuestion,
  });

  const handleSummarize = () => {
    if (!sourceText.trim()) {
      toast.error("Please provide text to summarize");
      return;
    }
    summarizeMutation.mutate({ text: sourceText, style: "bullets" });
  };

  const handleClear = () => {
    setSourceText("");
    setSummaryState(EMPTY_SUMMARY);
    setQaHistory([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SUMMARY_STORAGE_KEY);
    }
  };

  const handleFileLoaded = async (file: File) => {
    try {
      const { text } = await uploadFile(file);
      setSourceText(text);
      toast.success("File loaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    }
  };

  const handleAsk = async (question: string) => {
    if (!summaryState.summaryId) {
      const message = "Generate a summary before asking questions.";
      toast.error(message);
      throw new Error(message);
    }
    try {
      const response = await askMutation.mutateAsync({
        summary_id: summaryState.summaryId,
        question,
      });
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      const historyItem: QAHistoryItem = {
        id,
        question,
        answer: response.answer,
        timestamp: new Date().toISOString(),
      };
      setQaHistory((prev) => [historyItem, ...prev]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to answer question";
      toast.error(message);
      throw error;
    }
  };

  const isSummarizing = summarizeMutation.isPending;
  const isAsking = askMutation.isPending;

  const disabledSummarize = useMemo(() => {
    return isSummarizing || !sourceText.trim();
  }, [isSummarizing, sourceText]);

  return (
    <main className="min-h-screen py-10">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Summary Assistant</h1>
          <p className="text-sm text-slate-600">
            Upload or paste your source text to generate summarized key points, then ask follow-up questions with the built-in assistant.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <TextInputPanel
            value={sourceText}
            onChange={setSourceText}
            onSummarize={handleSummarize}
            onClear={handleClear}
            onFileLoaded={handleFileLoaded}
            disabledSummarize={disabledSummarize}
            isSummarizing={isSummarizing}
          />

          <div className="flex flex-col gap-6">
            <SummaryCard
              summary={summaryState.summary}
              tokens={summaryState.tokens}
              durationMs={summaryState.durationMs}
            />
            <QASection
              summaryId={summaryState.summaryId}
              qaHistory={qaHistory}
              onAsk={handleAsk}
              isAsking={isAsking}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
