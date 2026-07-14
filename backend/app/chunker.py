"""
Recursive text splitter that preserves page_number metadata per chunk.

Strategy:
  - Count tokens with tiktoken (cl100k_base — same encoder used by OpenAI embedding models).
  - Target chunk size: 600 tokens.
  - Overlap: 100 tokens (carried from the end of the previous chunk).
  - Split hierarchy: paragraph boundary (\n\n) → line boundary (\n) → sentence (. ) → word ( ).
  - Each output Chunk carries page_number and chunk_index.
"""
from __future__ import annotations

import re
import logging
from dataclasses import dataclass
from typing import List

import tiktoken

from app.parsers.base import ParsedPage

logger = logging.getLogger(__name__)

# Shared encoder — cl100k_base is used by text-embedding-3-small
_ENCODER = tiktoken.get_encoding("cl100k_base")

# Split priority: try each separator in order until pieces are small enough
_SEPARATORS = ["\n\n", "\n", ". ", " "]


@dataclass
class Chunk:
    """A single text chunk with provenance metadata."""
    text: str
    page_number: int
    chunk_index: int


def _token_count(text: str) -> int:
    return len(_ENCODER.encode(text))


def _split_text(text: str, max_tokens: int) -> List[str]:
    """
    Recursively split text into pieces no larger than max_tokens using the
    separator hierarchy. Returns a flat list of text segments.
    """
    if _token_count(text) <= max_tokens:
        return [text]

    for sep in _SEPARATORS:
        if sep in text:
            parts = text.split(sep)
            segments: List[str] = []
            for part in parts:
                if _token_count(part) <= max_tokens:
                    segments.append(part)
                else:
                    # Recurse for parts still too large
                    segments.extend(_split_text(part, max_tokens))
            return segments

    # Last resort: hard-cut by words if no separator found
    words = text.split()
    result: List[str] = []
    current: List[str] = []
    current_tokens = 0
    for word in words:
        wt = _token_count(word + " ")
        if current_tokens + wt > max_tokens and current:
            result.append(" ".join(current))
            current = [word]
            current_tokens = wt
        else:
            current.append(word)
            current_tokens += wt
    if current:
        result.append(" ".join(current))
    return result


def _merge_with_overlap(
    segments: List[str],
    target_tokens: int,
    overlap_tokens: int,
) -> List[str]:
    """
    Merge small segments into chunks of ~target_tokens, carrying an overlap
    of ~overlap_tokens from the end of the previous chunk into the next.
    """
    chunks: List[str] = []
    current_parts: List[str] = []
    current_tokens = 0

    for seg in segments:
        seg_tokens = _token_count(seg)
        if current_tokens + seg_tokens > target_tokens and current_parts:
            # Emit current chunk
            chunk_text = "\n\n".join(current_parts)
            chunks.append(chunk_text)

            # Build overlap from the tail of the current chunk
            overlap_parts: List[str] = []
            overlap_count = 0
            for part in reversed(current_parts):
                pt = _token_count(part)
                if overlap_count + pt <= overlap_tokens:
                    overlap_parts.insert(0, part)
                    overlap_count += pt
                else:
                    break

            current_parts = overlap_parts + [seg]
            current_tokens = overlap_count + seg_tokens
        else:
            current_parts.append(seg)
            current_tokens += seg_tokens

    if current_parts:
        chunks.append("\n\n".join(current_parts))

    return chunks


class RecursiveTextSplitter:
    """
    Splits ParsedPage objects into Chunks of approximately target_tokens size
    with overlap_tokens carried between consecutive chunks.
    """

    def __init__(self, target_tokens: int = 600, overlap_tokens: int = 100) -> None:
        self.target_tokens = target_tokens
        self.overlap_tokens = overlap_tokens

    def split_pages(self, pages: List[ParsedPage]) -> List[Chunk]:
        """
        Process all pages and return a flat, globally indexed list of Chunks.
        """
        all_chunks: List[Chunk] = []
        global_index = 0

        for page in pages:
            text = page.raw_text.strip()
            if not text:
                continue

            # Step 1: split into segments no larger than target
            segments = _split_text(text, self.target_tokens)

            # Step 2: merge small segments with overlap
            merged = _merge_with_overlap(segments, self.target_tokens, self.overlap_tokens)

            for chunk_text in merged:
                chunk_text = chunk_text.strip()
                if not chunk_text:
                    continue
                all_chunks.append(
                    Chunk(
                        text=chunk_text,
                        page_number=page.page_number,
                        chunk_index=global_index,
                    )
                )
                global_index += 1

        logger.info(
            "RecursiveTextSplitter: %d pages → %d chunks (target=%d tokens, overlap=%d tokens)",
            len(pages),
            len(all_chunks),
            self.target_tokens,
            self.overlap_tokens,
        )
        return all_chunks
