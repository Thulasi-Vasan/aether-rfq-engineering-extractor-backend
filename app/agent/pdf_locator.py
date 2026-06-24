"""Locate drawing evidence on the PDF and attach coordinates (pdfplumber).

The LLM supplies hints (`verbatim_text`, `match_terms`); THIS module is the
authority for coordinates. For each evidence item it finds the printed tokens on
the cited sheet, disambiguates repeats spatially, and returns both a tight
`anchor_bbox` and an expanded `region_bbox` for context.

Design (per codex review):
  - `pdf_anchor` is ALWAYS returned (even on failure) so the frontend keeps
    page/status/confidence and can fall back to opening the page.
  - Matching is narrow: exact (case-insensitive) + a normalised retry that strips
    diameter symbols. No broad regex on words (avoids false positives).
  - Repeated tokens (e.g. 'GAUGE' x3) are only resolved when a unique anchor term
    (a distinctive dimension/spec value) exists nearby; otherwise -> 'ambiguous'.
  - Region expansion is RELATIVE to page size so it works across sheet scales.

Coordinates are PDF points, top-left origin: [x0, top, x1, bottom].
"""
from __future__ import annotations

import logging
import re
from io import BytesIO

import pdfplumber

from ..schemas import AnchorCandidate, DrawingEvidence, LLMOperation, PdfAnchor

log = logging.getLogger(__name__)

_MAX_TERMS = 5
# A "distinctive" term is a dimension value or a spec/drawing code — these are
# (near) unique on a sheet and so can anchor the disambiguation of common words.
_DIM_RE = re.compile(r"^\d+(\.\d+)?$")
_SPEC_RE = re.compile(r"^[A-Z]{1,4}[-\d][A-Z0-9-]*\d$")  # E4-05-047, 16061-style, CES codes
_DIA_CHARS = "Ø⌀∅ "


def _is_distinctive(term: str) -> bool:
    t = term.strip(_DIA_CHARS)
    return bool(_DIM_RE.match(t) or _SPEC_RE.match(t))


def _clean_terms(match_terms: list[str], verbatim_text: str | None) -> list[str]:
    """Dedupe, drop blanks, keep order (distinctive first), cap at _MAX_TERMS."""
    seen: set[str] = set()
    ordered: list[str] = []
    for t in [verbatim_text, *match_terms]:
        if not t:
            continue
        key = t.strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        ordered.append(t.strip())
    # distinctive terms first so they anchor disambiguation
    ordered.sort(key=lambda t: 0 if _is_distinctive(t) else 1)
    return ordered[:_MAX_TERMS]


def _page_for_sheet(sheet: str | None, num_pages: int) -> int | None:
    """Map 'Sheet 1' -> page index 0. Returns None if unparseable / out of range."""
    if not sheet:
        return None
    m = re.search(r"\d+", sheet)
    if not m:
        return None
    idx = int(m.group()) - 1
    return idx if 0 <= idx < num_pages else None


def _round(box: list[float]) -> list[float]:
    return [round(v, 1) for v in box]


def _box(match: dict) -> list[float]:
    return [match["x0"], match["top"], match["x1"], match["bottom"]]


def _centroid(b: list[float]) -> tuple[float, float]:
    return ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2)


def _dist(a: list[float], b: list[float]) -> float:
    (ax, ay), (bx, by) = _centroid(a), _centroid(b)
    return ((ax - bx) ** 2 + (ay - by) ** 2) ** 0.5


def _union(boxes: list[list[float]]) -> list[float]:
    return [
        min(b[0] for b in boxes),
        min(b[1] for b in boxes),
        max(b[2] for b in boxes),
        max(b[3] for b in boxes),
    ]


def _search(page, term: str) -> list[list[float]]:
    """Exact (case-insensitive) search, with a diameter-symbol-stripped retry."""
    try:
        hits = page.search(term, case=False)
        if not hits:
            norm = term.strip(_DIA_CHARS)
            if norm and norm != term:
                hits = page.search(norm, case=False)
        return [_box(h) for h in hits]
    except Exception:  # noqa: BLE001 - never let one term break the request
        return []


def _expand_region(
    base_boxes: list[float], words: list[dict], page_w: float, page_h: float
) -> list[float]:
    """Grow the union of matched boxes to include nearby tokens, then pad — all
    relative to page size so it scales across sheets."""
    pad = max(12.0, 0.005 * page_w)
    rx = 0.04 * page_w
    ry = 0.025 * page_h
    region = _union(base_boxes)
    rcx, rcy = _centroid(region)
    for w in words:
        wb = [w["x0"], w["top"], w["x1"], w["bottom"]]
        wcx, wcy = _centroid(wb)
        if abs(wcx - rcx) <= rx and abs(wcy - rcy) <= ry:
            region = _union([region, wb])
    region = [region[0] - pad, region[1] - pad, region[2] + pad, region[3] + pad]
    return _round([
        max(0.0, region[0]),
        max(0.0, region[1]),
        min(page_w, region[2]),
        min(page_h, region[3]),
    ])


def _locate_on_page(page, words: list[dict], page_w: float, page_h: float, terms: list[str]) -> PdfAnchor | None:
    """Try to resolve `terms` on a single page. Returns None if nothing matched."""
    hits: dict[str, list[list[float]]] = {t: _search(page, t) for t in terms}
    resolved = {t: bs for t, bs in hits.items() if bs}
    if not resolved:
        return None

    # Anchor = a term with a single, unambiguous occurrence (distinctive preferred).
    anchor_term = next(
        (t for t in terms if t in resolved and _is_distinctive(t) and len(resolved[t]) == 1),
        None,
    ) or next(
        (t for t in terms if t in resolved and len(resolved[t]) == 1),
        None,
    )

    if anchor_term is None:
        # Every resolved term repeats -> genuinely ambiguous. Offer candidates so the
        # frontend can still open the page / let the user choose.
        first = next(t for t in terms if t in resolved)
        candidates = [
            AnchorCandidate(
                anchor_text=first,
                anchor_bbox=_round(b),
                region_bbox=_expand_region([b], words, page_w, page_h),
            )
            for b in resolved[first][:5]
        ]
        return PdfAnchor(
            anchor_text=first,
            page_size=[round(page_w, 1), round(page_h, 1)],
            match_status="ambiguous",
            confidence=round(0.3 * len(resolved) / len(terms), 2),
            candidates=candidates,
        )

    anchor_bbox = resolved[anchor_term][0]
    # Region grows from the anchor + nearby tokens (relative radius). Far-away repeats
    # of supplementary terms (e.g. an unrelated 'GAUGE') are intentionally excluded.
    region = _expand_region([anchor_bbox], words, page_w, page_h)
    confidence = round(0.6 + 0.4 * (len(resolved) / len(terms)), 2)
    return PdfAnchor(
        anchor_text=anchor_term,
        anchor_bbox=_round(anchor_bbox),
        region_bbox=region,
        page_size=[round(page_w, 1), round(page_h, 1)],
        match_status="matched",
        confidence=confidence,
    )


def _locate(pages, words_by_page, sizes, ev: DrawingEvidence) -> PdfAnchor:
    page_idx = _page_for_sheet(ev.sheet, len(pages))
    fallback_page = (page_idx + 1) if page_idx is not None else None
    fallback_size = list(sizes[page_idx]) if page_idx is not None else None

    terms = _clean_terms(ev.match_terms, ev.verbatim_text)
    if not terms:
        return PdfAnchor(page=fallback_page, page_size=fallback_size, match_status="not_found")

    candidate_pages = [page_idx] if page_idx is not None else list(range(len(pages)))
    best: PdfAnchor | None = None
    for pidx in candidate_pages:
        pw, ph = sizes[pidx]
        result = _locate_on_page(pages[pidx], words_by_page[pidx], pw, ph, terms)
        if result is None:
            continue
        result.page = pidx + 1
        if result.match_status == "matched":
            return result
        best = best or result  # keep first ambiguous as fallback

    if best is not None:
        return best
    return PdfAnchor(page=fallback_page, page_size=fallback_size, match_status="not_found")


def resolve_anchors(pdf_bytes: bytes, operations: list[LLMOperation]) -> list[LLMOperation]:
    """Fill `pdf_anchor` on every evidence item. Mutates and returns operations.

    Failure-isolated: any error yields a not_found anchor rather than breaking the
    request."""
    try:
        with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
            pages = pdf.pages
            words_by_page = {i: p.extract_words() for i, p in enumerate(pages)}
            sizes = {i: (float(p.width), float(p.height)) for i, p in enumerate(pages)}
            matched = 0
            total = 0
            for op in operations:
                for ev in op.source_of_truth:
                    total += 1
                    try:
                        ev.pdf_anchor = _locate(pages, words_by_page, sizes, ev)
                    except Exception:  # noqa: BLE001
                        ev.pdf_anchor = PdfAnchor(match_status="not_found")
                    if ev.pdf_anchor.match_status == "matched":
                        matched += 1
            log.info("pdf_locator: matched %d/%d evidence items", matched, total)
    except Exception as exc:  # noqa: BLE001 - whole-PDF failure shouldn't break extraction
        log.warning("pdf_locator: failed to open/parse PDF (%s); anchors left empty", exc)
        for op in operations:
            for ev in op.source_of_truth:
                if ev.pdf_anchor is None:
                    ev.pdf_anchor = PdfAnchor(match_status="not_found")
    return operations
