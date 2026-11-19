# CARANA Run 06 Follow-up 05 — Consolidated Verification & Readiness Report

## 1. Executive Decision Summary

| Workstream / Environment | Status | Basis |
| --- | --- | --- |
| **Primary Public Domain (`https://e-learning.maissara.tech/`)** | **LIVE / VERIFIED** | Aliased to `dpl_2SwYWQt4CTBTLBPsuWpFv49ADW4A`; `/api/tutor/status -> 404`; 1,280 hashed static assets & full Playwright E2E verified (`task-683`) |
| **Continuity Domain (`https://cbd.maissara.tech/`)** | **LIVE / UNCHANGED** | Kept active alongside primary domain with zero cross-domain redirect; identical SHA-256 across all static assets (`dpl_2SwYWQt4CTBTLBPsuWpFv49ADW4A`) |
| **AI Assistant — Public Learner Use** | **HOLD (Static Only)** | Public domains remain purely static (`HTTP 404` on `/api/*`); public AI requires formal UNPOL SME review and dedicated multi-user inference hosting |
| **AI Assistant — Owner-Only Remote Pilot (`gemma4:26b`)** | **READY FOR OWNER PILOT** | 42/42 evaluation cases handled cleanly (37/37 zero-retry generations, 0 validation blocks, 3/3 declines, 2/2 checkpoint intercepts) + remote Vercel -> Cloudflare tunnel -> Mac gateway E2E verified (`dpl_HZycUT2L76GensfL7tdZPgFEPcwQ`) |

---

## 2. Primary Domain Migration & Baseline Reconciliation

- Consolidated repository `main` matches `origin/main` at `e7d537f6a846e7ec5181bb6f35d1aa5cd3819d3f`, tagged `carana-cbd-v0.12.0-run06`, with rollback branch `backup/main-before-run06-approved-2026-11-19` preserved at `4b255cb27ba65bd3544366bc9f6a884e231d8e78`.
- Baseline archive `Backups/CARANA-CBD-E-Learning/2026-11-19_150625Z-Run06-Approved-Main` (`SHA256SUMS` clean) records the `release-manifest.json` metadata discrepancy (`"target": "isolated-preview"`, `"sourceCommit": "282735a0dec237d29a42a8817932aa49adfdc968"`) left untouched on live production (`baseline-housekeeping-receipt.json`).

---

## 3. AI Model Selection & Educational Pipeline Improvements

1. **Retrieval (`tutor/retrieval.cjs`):** 42-query evaluation ([RETRIEVAL-EVALUATION.json](RETRIEVAL-EVALUATION.json)) achieved **39/39 (100%) recall**, **38/39 (97.44%) Top-1 accuracy**, and **3/3 (100%) insufficient-evidence declines** with zero false positives.
2. **Structured Grounding & Validation (`tutor/provider.cjs`, `tutor/gateway.cjs`):**
   - Schema-enforced generation places `groundedFacts` before `answer` (avoiding negative-lead distortion on core explanations) and defers `evidenceGapCheck`/`uncertainty` until after the curriculum answer, preventing empty meta-boilerplate when passages cleanly answer the question.
   - Strict numeric/source-ID/URL/procurement-register/domain validation paired with deterministic gateway `source-check` safe declines and `clip()` sentence-boundary checkpoint excerpts.
3. **3-Model Zero-Retry Benchmark ([MODEL_COMPARISON.md](MODEL_COMPARISON.md)):**
   - `qwen3:4b-instruct-2507-q4_K_M`: `30/37` generations, **7 validation failures** (`C4`, `H5`, `E3`, `E11`, `F6`, `F10`, `F15`), median `~4.9s–5.4s`.
   - `qwen3:14b`: `33/37` generations, **4 validation failures** (`E3`, `E11`, `F6`, `F10`), median `~15.6s–16.3s` (`9.0 GB` `100% GPU`).
   - `gemma4:26b`: **`37/37` generations (0 failures)**, `42/42` total cases handled cleanly, median `~10.1s–12.5s` (active footprint reaches `18 GB` unified memory in `ollama ps`, automatically released on idle or via `ollama stop gemma4:26b`).

---

## 4. Isolated Remote Owner-Only Preview Verification

Verified live against isolated Vercel deployment `dpl_HZycUT2L76GensfL7tdZPgFEPcwQ` (`https://carana-cbd-elearning-cl8pydgbt-delta4ce20-5830s-projects.vercel.app`) ([remote-preview-live.json](evidence/remote-preview-live.json), [remote-preview-offline.json](evidence/remote-preview-offline.json), [vercel-preview-inspect.txt](evidence/vercel-preview-inspect.txt)):
- **SSO & Access Control:** Anonymous unauthenticated requests hit Vercel SSO (`302`); wrong `Origin` rejected `403`; wrong owner access code rejected `401`; zero secret or tunnel hostname leakage; zero CORS wildcards.
- **End-to-End Remote Inference & Speech:** Remote `/api/tutor` streamed real `gemma4:26b` answer on Lesson 1 *Possible Causes* (`HTTP 200`, `provider: "genuine-local-ollama"`); remote checkpoint returned deterministic `study-guide`; remote `/api/tts` returned real `audio/wav` via `apple-neural-nora` (`200`); `e-learning.maissara.tech` and `cbd.maissara.tech` remained static (`404` on `/api/tutor/status`, baseline commit `282735a0dec237d29a42a8817932aa49adfdc968`).
- **Offline Transition & Project Cleanliness:** Closing the local tunnel transitioned remote `/api/tutor/status` cleanly to `{ connected: false }` (`503` honest message on `POST /api/tutor`); transient preview environment variables were cleared (`No Environment Variables found`), and no background daemon processes remain running.

---

## 5. Regression, Preservation & UI Verification Ledger

| Verification Suite | Scope & Outcome |
| --- | --- |
| `npm run check:content` | **PASS** — 5 lessons, 38 platform screens, 42 platform quizzes verified |
| `npm test` (including `tests/support/remote-proxy.cjs`) | **PASS** — all core/platform suites + 11 support/provider/tutor/remote-proxy tests pass |
| `node tests/support/https-pilot.cjs` | **PASS** — loopback TLS, Origin/Host/Bearer checks, 413/400/429, real local `/api/tts` WAV |
| Preservation Check (`preservation.json`) | **PASS** — 88 protected files + 21 media assets match baseline SHA-256 (`0` mismatches) |
| Accessibility (`axe-wcag22-18scans.json`) | **PASS** — 18 WCAG 2.2 AA scans across desktop/tablet/mobile (`closed`/`reading`/`assistant`, LTR & RTL, Escape focus return): `0` violations, `0` horizontal overflow |
| Browser Suites (`course/tests/browser.cjs`, `tests/platform/browser.cjs`, `assistant-browser.cjs`) | **PASS** after final CSS/gateway edit (`task-1070`, `ollama stop gemma4:26b` freed 18 GB unified memory) |
| Browser Audio/Dynamic Suites (`read-aloud-browser.cjs`, `dynamic-reading-browser.cjs`) | **PASS** after final edit (verified standalone cleanly in follow-up run after stream interruption in `task-1070`) |
| Live Browser + Tunnel + Neural TTS E2E (`browser-live-ai.json`) | **PASS** — Desktop Chromium (`1440×950`) & Mobile WebKit (`390×844`) with `gemma4:26b`, Lesson 1 *Possible causes* focus badge, `Listen` Kokoro/Apple Neural playback, checkpoint guard, `Enter` connect, fixed high-contrast mobile `Send` button ([f05-desktop-ai-grounded.png](evidence/f05-desktop-ai-grounded.png), [f05-desktop-checkpoint-guard.png](evidence/f05-desktop-checkpoint-guard.png), [f05-mobile-ai-grounded.png](evidence/f05-mobile-ai-grounded.png)) |
