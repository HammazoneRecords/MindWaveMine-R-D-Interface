# New Concept Dump — Workflow Reference (as it should look now)

Use this when you add the next doc dump to **MW_CONCEPT_DUMP.md**. Compare what actually was added and how it actually flowed against this reference. Source: [PROTOCOLS.md §9](PROTOCOLS.md) plus workflow concepts mw_92, mw_99, mw_65, mw_102, mw_11, mw_72.

**Latest comparison (actual vs reference):** [COMPARISON_actual_vs_reference_mw115.md](COMPARISON_actual_vs_reference_mw115.md) — mw_115 run 2026-02-03; flow matched reference.

---

## Trigger

- You added or changed content in **MW_CONCEPT_DUMP.md**.
- You want each unique concept to get a doc and full traceability without breaking coherence.

---

## Decision (before any edits)

| Situation | What should happen |
|-----------|--------------------|
| **New unique concept** | Assign next `mw_XX` (e.g. mw_115, mw_116). One concept = one doc. Run full flow below (Phase A → B → C) for each. |
| **Concept already exists** | Do not create a new doc. Run the **Enhancement flow** (E1–E8) below; then re-run Phase C (checks + project_minutes). |

Rule: **One concept = one doc.** No duplicate numbers. If the dump describes something already covered, update that doc (and its invariants), do not create a second doc.

---

## Flow (what should happen, in order)

### Phase A: Create doc and register (for each NEW concept)

| Step | What should happen | Compare: did we? |
|------|--------------------|------------------|
| A1 | Create `mindwave/mw_XX_snake_case_name.md` (XX zero-padded, snake_case). | |
| A2 | Add one row to `mindwave/00_INDEX.md`: `\| NN \| [mw_NN_name](mw_NN_name.md) \| description \|`. | |
| A3 | Add **Related:** in the new doc (links to relevant mw_YY). In each linked doc, add this mw_XX to its Related line (bidirectional). | |
| A4 | In `mindwave/03_INVARIANTS.md` add `## From mw_NN -- Title` (placeholder or full invariant blocks). | |
| A5 | In `MW_SERVICE_DOCS/INVARIANTS_INDEX_template.md` add the concept block and table (Invariant \| Code \| Link to 03). Line numbers can be refreshed when checks run. | |
| A6 | In the new concept doc, add link to INVARIANTS_INDEX_template and/or "Invariants for this concept" (§5). | |

### Phase B: Extract invariants and traceability (for each NEW concept)

| Step | What should happen | Compare: did we? |
|------|--------------------|------------------|
| B7 | Read the concept doc. Derive invariants only from this document (no generic templates). | |
| B8 | Apply extraction checklist (§4): definitions, formulas, laws, contrasts, stages, dimensions, measures, practices, metaphors, tables, key mechanics, one-line maxims. For each: **Source Code (verbatim)** + Solobic Logic + Implementation. Quote format: single-line; period or semicolon—no ellipsis (mw_65: witnessing not summary). Tri-Lens (mw_102): Source Code = English, Implementation = Code; add Math lens when concept has a formula. | |
| B9 | Write invariants in `03_INVARIANTS.md` under `## From mw_NN -- Title`. Each: `### Invariant N: … (INV:MWNN_…)` with Source Code, Solobic Logic, Implementation. Anchors: `{#inv-mwNN-…}`. | |
| B10 | Update `INVARIANTS_INDEX_template.md`: table rows Invariant \| Code \| Link to 03 (`../03_INVARIANTS.md#L<line>`). Line numbers refreshed by checker. | |
| B11 | In the concept doc, add section "Canonical invariant quotes (Source Code, for traceability)". Every Source Code phrase used in 03 for this concept must appear here (substring after normalizing whitespace). Receipt chain (mw_92): concept doc → canonical quotes → 03 Source Code → validator; truth continued not edited. | |

### Phase C: Validate and record (once per batch)

| Step | What should happen | Compare: did we? |
|------|--------------------|------------------|
| C12 | Run from repo root: `python mindwave/MW_SCRIPTS/run_mindwave_checks.py`. Fix any failures (naming, index, Related, 03 anchors, index↔03 row count, concept→index/03 links, **source-quote traceability**). **E check (mw_99):** No invariant is canonical until it survives E—every Source Code quote must be traceable to the concept doc; batch not complete until E passes. | |
| C13 | Update `project_minutes.md`: Last Updated date; batch summary (e.g. "Batch N (mw_XX–mw_YY): …"); current invariant coverage; next batch range if applicable. | |

### Enhancement flow (existing concept — PROTOCOLS §9.4)

When the dump enhances an **existing** concept, do not create a new doc. Follow this flow for each enhanced concept.

| Step | What should happen | Compare: did we? |
|------|--------------------|------------------|
| E1 | **Decide:** Enhancement adds clarity. If it would add confusion, make no changes and skip the rest. | |
| E2 | **Update concept doc:** Edit `mindwave/mw_XX_*.md` with new content from the dump. Only clarity-preserving edits; do not remove or contradict existing invariants. | |
| E3 | **Re-scan with extraction checklist (§4):** Read the updated doc; identify genuinely new rules only. | |
| E4 | **Add new invariants in 03:** Under existing `## From mw_NN -- Title`, add **new** invariant blocks only (Source Code verbatim + Solobic Logic + Implementation). Anchors `{#inv-mwNN-…}`. Do not alter existing invariant definitions for this concept. | |
| E5 | **Update INVARIANTS_INDEX_template.md:** Add new table rows (Invariant \| Code \| Link to 03) for new invariants; use anchor links so line-link updater can rewrite. | |
| E6 | **Update canonical quotes in concept doc:** Section "Canonical invariant quotes (Source Code, for traceability)" must contain every Source Code phrase from 03 for this concept (including new ones). | |
| E7 | **Run coherence checker:** `python mindwave/MW_SCRIPTS/run_mindwave_checks.py` from repo root; fix failures; E check must pass. | |
| E8 | **Update project_minutes.md:** Last Updated date; summary (e.g. "Enhancement: mw_113, mw_114"); coverage; next batch or "check dump for new content." | |

If multiple concepts are enhanced from one dump: do E1–E6 for each, then E7 once, then E8.

---

## Batch and boundary rules (what should govern)

- **Batch:** Process new concepts as a batch (e.g. mw_115–mw_119). Do Phase A for all, then Phase B for all, then Phase C once.
- **Frame (mw_11):** Treat each batch as a frame worth stabilizing: stable goal = this batch's concepts; boundary = do not alter invariants outside the batch; governing intent = coherence and traceability. Run Phase C before considering the frame closed.
- **TrueWill (mw_72):** Preserve traceability and coherence; do not alter invariant definitions outside the batch; if a request would break the receipt chain or canonical gate (E), refuse with explanation.
- **No edits outside batch:** Do not change invariant definitions for concepts outside the batch (e.g. do not alter mw_01–mw_114 when adding mw_115+).

---

## Compare checklist (after the next dump)

Use this to compare "what should happen" vs "what actually happened". For mw_115 (2026-02-03) all items passed — see [COMPARISON_actual_vs_reference_mw115.md](COMPARISON_actual_vs_reference_mw115.md).

- [ ] Every new unique concept from the dump got exactly one `mw_XX_*.md` and one row in 00_INDEX.
- [ ] Related links are bidirectional for every new concept.
- [ ] Every new concept has a `## From mw_NN` section in 03_INVARIANTS.md and a block/table in INVARIANTS_INDEX_template.md.
- [ ] Every new concept doc links to the invariants index (and/or "Invariants for this concept").
- [ ] Invariants were derived from the concept doc only (verbatim Source Code; no ellipsis).
- [ ] Every new concept has "Canonical invariant quotes (Source Code, for traceability)" with every 03 Source Code phrase present.
- [ ] `run_mindwave_checks.py` was run and exited 0 (E check passed).
- [ ] project_minutes.md was updated with batch summary and coverage.
- [ ] No invariant definitions were changed for concepts outside the batch.
- [ ] If the dump enhanced an existing concept: we followed Enhancement flow E1–E8 (PROTOCOLS §9.4); we only updated that doc (and linked elements) when it added clarity; we did not create a duplicate concept doc.

---

## One-line summary

**New concept:** Phase A (create doc, register, Related, 03 section, index stub, link from doc) → Phase B (read doc, extract invariants, write in 03, update index, canonical quotes in doc) → Phase C (run `run_mindwave_checks.py`, fix failures, update project_minutes). **Existing concept (enhancement):** Enhancement flow E1–E8 (§9.4): decide clarity → update concept doc → re-scan checklist → add new invariants in 03 → update index and canonical quotes → run checks → update project_minutes. **Governed by:** receipt chain (mw_92), E/canonical gate (mw_99), witnessing not summary (mw_65), Tri-Lens (mw_102), frame stabilization (mw_11), TrueWill (mw_72).
