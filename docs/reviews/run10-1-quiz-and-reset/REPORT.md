# CARANA Run 10.1 — Verification & Preview Report

## Branch & Release Control

- **Production Baseline (Untouched):** Commit `3b1d8e88c84e122639d060782be23829348b5dce`, Deployment `dpl_9JVwprsyBhjGrCH4j3kukMTH7Dcr` (`https://e-learning.maissara.tech/`, `https://cbd.maissara.tech/`).
- **Maintenance Branch:** `maintenance/run10.1-quiz-and-reset` (isolated Vercel preview only; production unchanged).

## Storage Audit Summary

| Key | Action on Reset | Rationale |
|---|---|---|
| `carana_cbd_course_v1`, `_pre_restore` | Removed (local + session) | Lesson 1 screens, quizzes, and completion state |
| `carana_learning_v1`, `_pre_restore` | Delete `cbd-[1-6]`; remove key if empty | Lessons 2–6 progress, quiz completion, activity drafts, preserving non-CBD courses (`mma-*`) |
| `carana_cbd_lab_v1`, `_corrupted_backup`, `_pre_handoff` | Removed + reset broadcast | Practical Workbenches Modules 1–6 |
| `carana_notebook_v1`, `_pre_restore` | Removed | Evidence-to-Decision Notebook records |
| `carana_exploration_v1` | Clear `cbd-[1-6]/*`; remove if empty | Interactive diagram exploration history & in-memory store (`exploration.resetFor`) |
| `carana_cbd_group_activity_v1` | Removed (local + session) | 60-minute CBD Group Exercise state |
| `carana_lang_v1` | **Preserved** | Learner UI language selection (`en` / `fr-FR` / `ar`) |
| AI, monitoring & unrelated keys | **Preserved** | Service config, billing/monitoring config, unrelated settings |

## Automated & Browser Verification Results

All checks executed after final source edits:

- `npm test` (legacy lab suite, `v05-smoke`, `build-integrity`, `content`, `learning-tools`, `progress-recovery`, `handoff`, `notebook`, `exploration`, new `tests/platform/course-reset.cjs`, `support/*`, `trilingual`, `language-race`): **0 failures**
- `npm run test:monitoring`: **6 / 6 passed** (`webAnalytics` disabled, privacy guarantees intact)
- `npm run check:content`: **5 lessons, 38 screens, 42 quizzes verified**
- `node tools/validate-i18n.cjs`: **0 failures, 0 warnings, 1454 UI leaves verified across FR & AR with 0 English leaks**
- `node tests/i18n/run10-1-browser.cjs`: **10 checks passed** across Chromium desktop, WebKit desktop, WebKit/Chromium mobile (`390px`, `320px`), EN/FR/AR RTL:
  - Zero leaked `"Checkpoint"` / `"Point de contrôle"` / `"نقطة التحقق"` / `"نقاط التحقق"` text across Home, L1–L6, Activities Hub, Visual Gallery, Demo, and Notebook.
  - Native `<dialog>` autofocus (`#cbd-reset-cancel`), `Esc` cancel, scroll containment, pre-reset JSON exports, partial storage failure error alert accuracy, full course reset + reload persistence, non-CBD `mma-1` & `carana_lang_v1` preservation, and 0 Axe WCAG 2.2 AA violations.
- Regression browser suites against built `dist/`:
  - `tests/i18n/run10-browser.cjs`: **PASS** (hover stability & 3D orbit preserved)
  - `tests/i18n/trilingual-browser.cjs`: **PASS** (chromium + webkit desktop + webkit mobile)
  - `tests/support/audio-safety-browser.cjs`: **PASS**
  - `course/tests/browser.cjs`: **PASS** (chromium, webkit desktop, webkit mobile + Axe)
  - `tests/platform/navigation.cjs`: **PASS** (chromium + webkit mobile)
  - `tests/platform/exploration-browser.cjs`: **PASS** (chromium + webkit mobile)
  - `tests/platform/browser.cjs`: **PASS** (webkit desktop, chromium, webkit mobile + Axe)
