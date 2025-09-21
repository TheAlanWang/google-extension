from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Iterable, List, Sequence, Tuple

STOPWORDS = {
    "the",
    "and",
    "is",
    "in",
    "to",
    "of",
    "a",
    "on",
    "for",
    "with",
    "that",
    "as",
    "by",
    "it",
    "an",
    "be",
    "are",
    "this",
    "or",
    "from",
}


_sentence_splitter = re.compile(r"(?<=[.!?])\s+")
_word_pattern = re.compile(r"[\w']+")


def _tokenize(text: str) -> List[str]:
    return _word_pattern.findall(text.lower())


def _split_sentences(text: str) -> List[str]:
    raw = re.split(r"(?<=[.!?])\s+", text.strip())
    sentences = [s.strip() for s in raw if s.strip()]
    return sentences or [text.strip()]


def _sentence_scores(sentences: Sequence[str]) -> List[Tuple[str, float]]:
    freq = {}
    for sentence in sentences:
        for token in _tokenize(sentence):
            if token in STOPWORDS:
                continue
            freq[token] = freq.get(token, 0) + 1
    if not freq:
        return [(sentence, 0.0) for sentence in sentences]

    max_freq = max(freq.values()) or 1
    normalized = {token: count / max_freq for token, count in freq.items()}

    scores: List[Tuple[str, float]] = []
    for sentence in sentences:
        sentence_tokens = [t for t in _tokenize(sentence) if t not in STOPWORDS]
        if not sentence_tokens:
            scores.append((sentence, 0.0))
            continue
        score = sum(normalized.get(token, 0) for token in sentence_tokens)
        scores.append((sentence, score / len(sentence_tokens)))
    return scores


@dataclass
class MockSummary:
    text: str
    sentences: List[str]


class MockNLPService:
    """Lightweight heuristics to simulate summarization and Q&A."""

    def summarize(self, text: str, ratio: float = 0.3, style: str = "bullets") -> MockSummary:
        sentences = _split_sentences(text)
        scored = sorted(_sentence_scores(sentences), key=lambda pair: pair[1], reverse=True)
        sentence_count = max(3, int(math.ceil(len(sentences) * max(ratio, 0.1))))
        sentence_count = min(len(sentences), sentence_count)
        top_sentences = [sentence for sentence, _ in scored[:sentence_count]]
        top_sentences = sorted(
            top_sentences,
            key=lambda s: sentences.index(s),  # preserve original order
        )

        if style == "paragraph":
            summary_text = " ".join(top_sentences)
        else:
            bullet_lines = [f"- {sentence}" for sentence in top_sentences]
            summary_text = "\n".join(bullet_lines)

        return MockSummary(text=summary_text, sentences=top_sentences)

    def answer(self, question: str, summary: str, source: str) -> Tuple[str, List[Tuple[str, Tuple[int, int] | None]]]:
        keywords = [token for token in _tokenize(question) if token not in STOPWORDS]
        summary_sentences = [line.lstrip("- ") for line in summary.splitlines() if line.strip()]
        source_sentences = _split_sentences(source)

        def score_sentence(sentence: str) -> float:
            if not keywords:
                return 0.0
            tokens = _tokenize(sentence)
            if not tokens:
                return 0.0
            hits = sum(1 for token in tokens if token in keywords)
            if hits == 0:
                return 0.0
            return hits / len(tokens)

        ranked_summary = sorted(summary_sentences, key=score_sentence, reverse=True)
        ranked_source = sorted(source_sentences, key=score_sentence, reverse=True)

        answer_parts: List[Tuple[str, str]] = []  # (sentence, origin)
        citations: List[Tuple[str, Tuple[int, int] | None]] = []

        if ranked_summary and score_sentence(ranked_summary[0]) > 0:
            sentence = ranked_summary[0]
            answer_parts.append((sentence, "summary"))
            span_start = summary.find(sentence)
            span = (span_start, span_start + len(sentence)) if span_start >= 0 else None
            citations.append(("summary", span))

        if ranked_source and score_sentence(ranked_source[0]) > 0:
            sentence = ranked_source[0]
            if sentence not in {part for part, _ in answer_parts}:
                answer_parts.append((sentence, "source"))
            span_start = source.find(sentence)
            span = (span_start, span_start + len(sentence)) if span_start >= 0 else None
            citations.append(("source", span))

        if not answer_parts:
            fallback = (
                "I could not locate a direct answer in the current summary. "
                "Consider refining the summary or asking a more specific question."
            )
            return fallback, []

        answer = " ".join(sentence for sentence, _ in answer_parts)
        return answer.strip(), citations


class LLMAdapter:
    """Placeholder interface for integrating a real language model provider."""

    def generate_summary(self, text: str, ratio: float, style: str) -> str:  # pragma: no cover - placeholder
        raise NotImplementedError("Integrate with your preferred LLM provider here.")

    def answer_question(self, summary: str, source: str, question: str) -> str:  # pragma: no cover - placeholder
        raise NotImplementedError("Integrate with your preferred LLM provider here.")


nlp_service = MockNLPService()
