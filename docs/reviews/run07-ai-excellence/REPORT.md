# CARANA CBD E-Learning — Run 07: AI Performance, Educational Intelligence & Production Excellence

## 1. Executive Summary

Run 07 upgrades the production CARANA AI Learning Assistant from a high-latency, spill-prone multimodal baseline (`gemma4:26b` with unused vision projector, `15%/85% CPU/GPU` layer split, `18,679 ms` warm median / `25,393 ms` p90 / `33,604 ms` cold total latency) to an optimized text-only **`carana-gemma4-text`** (`100% GPU` execution, zero mid-run reloads, **`5,126 ms`** warm verified-answer median, **`6,230 ms`** warm total median), backed by upgraded retrieval (`0/135` false refusals across Follow-up 05, Follow-up 06, and Run 07 paraphrase regressions), progressive NDJSON stage and early-answer streaming, a persistent local Kokoro-82M neural TTS worker, and restored Vercel Clean URL routing for `/quick-exercise`.

All automated technical, grounding, contract, accessibility, and cross-browser suites pass cleanly after the final code changes. **Human pedagogical / Subject Matter Expert (SME) judgement remains cleanly separated and ungraded (`0` pre-filled ratings)** in the companion [review-workbench.html](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/docs/reviews/run07-ai-excellence/review-workbench.html).

## 2. Host Reality & Preserved Baseline

- **Measured Host Hardware:** `Mac17,9`, Apple M5 Pro, `24 GB` Unified Memory (`25,769,803,776` bytes), active service label `com.carana.cbd.ai`. (While earlier operational docs referenced a dedicated Mac mini host label, all Run 07 execution, benchmarking, and tunnel supervision ran on `Mac17,9`; laptop sleep and shared hotel Wi-Fi connectivity limits are documented in Section 8.)
- **Git Baseline Preserved:** `main` before Run 07 anchored at `fa228bed63a07a894a44a2843693695bce9ef2ed` (preserved via `backup/main-before-run07-2026-11-20`, previous Vercel deployment `dpl_H8ri3tno6gSPDGZNULcjkUhXxur7`).
- **OneDrive Dataless File Remediation:** Before running builds or benchmarks, `1,208` non-`docs` working-tree files and `4` `docs/institutional/*` assets were materialized from SHA1-verified local runtime/git objects so local builds and tests operate without cloud-placeholder stalls.
- **Asset Preservation Verified:** All `109` entries in [preservation.json](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/docs/reviews/run06-intelligent-learning/preservation.json) (`18` audio files + `91` curriculum/course/platform files) hash-check with **`0` mismatches** (`109/109`). Follow-up 01–06 review artifacts remain unmodified.
- **Authorized Pilot Roster Preserved:** Strictly 3 active users (`owner-maissara`, `denis-tikhomirov`, `ahmed-hosny`) via `npm run ai:users -- list`. No credentials rotated or printed; no automatic invitations sent.

## 3. Root-Cause Diagnosis (Phase B Baseline)

Measured in [phase-b-baseline.json](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/docs/reviews/run07-ai-excellence/phase-b-baseline.json) and Ollama logs:

1. **Vision Projector (`mmproj`) Memory Spill & Evictions:** Stock `gemma4:26b` loaded a `~1.3 GiB` multimodal vision projector alongside the `16 GiB` LLM weights (`18 GB` total in `ollama ps`), forcing `llama-server` to spill layers to `CPU_REPACK` (`15%/85% CPU/GPU`) and triggering mid-run `sched.go` reloads when unified memory dipped near `14.9 GiB`. Result: `12,571 ms` cold load, `33,604 ms` cold total, `18,679 ms` warm median, `25,393 ms` warm p90 (`25.7 tok/s`).
2. **Lexical-Only Retrieval False Refusals:** Short novice queries, paraphrases (e.g., `"what is 7 cs for talk with local police chief"`), British/US spelling differences, typos, and follow-up turns previously failed exact token matching.
3. **Full-Buffer Turn Wait & Numeric/Reference Strictness:** Responses buffered the full structured JSON (`answer` + `example` + `uncertainty`) before rendering anything in the UI, and word numerals (`"six"`, `"seven"`), verified `"Lesson N"` / `"Module N"` labels, markdown ordered lists (`1. ...`), or bounded prompt counts (`"2 bullets"`) could trigger unnecessary repair loops.
4. **Cold Kokoro TTS Latency & Route Regression:** Spawning per-request Python Kokoro processes added cold startup overhead during simultaneous AI load, and `/quick-exercise` returned HTTP `404` on the pre-Run 07 production deployment while `/CARANA_CBD_Group_Activity` returned `200`.

## 4. Engineering Upgrades Implemented

- **Retrieval & Context Upgrade ([tutor/retrieval.cjs](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/tutor/retrieval.cjs)):** Expanded synonym/acronym normalization (`PESTEL-S`, `LOGFRAME`, `7 Cs`, `5 Whys`, `UNPOL`, `KPI`), light stemming, British/US spelling canonicalization, typo tolerance (`edit distance <= 1`), lesson-scoped soft boost + multi-turn history expansion (`<= 4` prior turns), and strict out-of-scope rejection thresholds (`0/135` false refusals).
- **Text-Only Model Configuration & Self-Healing Service ([tools/carana-service.cjs](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/tools/carana-service.cjs), [tutor/gateway.cjs](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/tutor/gateway.cjs)):** `carana-gemma4-text` reuses the verified primary `gemma4:26b` model blob without the unused vision `mmproj` (`TEMPLATE {{ .Prompt }}`, `RENDERER gemma4`, `PARSER gemma4`, `PARAMETER temperature 0`, `PARAMETER num_ctx 3072`), moving execution to **`100% GPU`** with **`0`** mid-run reloads across 135 consecutive turns. `ensureTextOnlyModel()` auto-creates `carana-gemma4-text` idempotently from the local `gemma4:26b` blob on service enable and unloads stale `gemma4:26b`.
- **Lean Contract, Progressive Verified Streaming & Self-Repair ([tutor/provider.cjs](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/tutor/provider.cjs), [platform/learning-support.js](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/platform/learning-support.js)):**
  - Compact ordered JSON schema (`sourceIds`, `answer`, `example`, `uncertainty`) with strict grounding and non-echo rules (`UNSCR NNNN` / fake IDs never repeated in `answer` or `example`).
  - `validateEvidence()` supports verified word numerals (`1..20`), passage-matched `Lesson N` / `Module N` labels, markdown ordered lists, and bounded request-matched list counts while preserving strict guards against ungrounded digits, fake URLs, non-policing analogies, and procurement-register hallucinations.
  - Emits NDJSON progress stages (`preparing`, `generating`, `checking`, `repairing`) and streams verified `segment: "answer"` immediately upon JSON-field completion before trailing `example` / `uncertainty` finish, deduplicated cleanly in the Assistant UI with bounded `history` continuity (`<= 4` turns in UI, `<= 6` enforced by gateway).
- **Persistent Kokoro-82M Neural Worker & Clean URL Fix ([tutor/tts.cjs](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/tutor/tts.cjs), [tools/kokoro-synth.py](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/tools/kokoro-synth.py), [tutor/remote-proxy.cjs](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/tutor/remote-proxy.cjs), [tools/release/prepare-ai-preview.cjs](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/tools/release/prepare-ai-preview.cjs)):** Keeps ONNX + misaki/espeak warm in memory (with Apple Neural fallback when unavailable) and bumps proxy `/api/tts` timeout to `48,000 ms` (`45,000 ms` gateway abort) so cold Kokoro under active LLM load reliably returns HTTP `200 audio/wav`. Fixed `.vercel/output/config.json` rewrite destination to `/CARANA_CBD_Group_Activity` with `cleanUrls: true` for `/quick-exercise`.

## 5. 135-Case Model & Concurrency Benchmark Matrix

Evaluated identically across **135 cases** (Follow-up 05: `42`, Follow-up 06: `28`, Run 07: `65`) plus 5-scenario gateway concurrency + Kokoro stress (`tools/run07-evaluate.cjs`, `tools/run07-concurrency.cjs`, [EVALUATION_MATRIX.json](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/docs/reviews/run07-ai-excellence/EVALUATION_MATRIX.json)):

| Model | 1st-Pass | Final Pass | False Refusals | Mid-Run Reloads | Warm AnsReady Med / p90 | Warm Total Med / p90 | 2-Conc / Burst6 (`5+1`) | Max Mem Pressure / Min Avail | Selection |
|---|---|---|---|---|---|---|---|---|---|
| `gemma4:26b` (Phase B baseline, 8 warm) | n/a | n/a | Yes (pre-Run07) | Frequent (`sched.go`) | 3,374 / 4,325 ms (TTFT) | 18,679 / 25,393 ms (cold 33,604 ms) | Baseline (`11,493 ms` seq5 med) | `2` / `0.89–0.96 GB` | Superseded (`mmproj` spill) |
| **`carana-gemma4-text`** | **134/135 (99.3%)** | **135/135 (100.0%)** | **0** | **0** | **5,126 / 6,692 ms** | **6,230 / 7,713 ms** | **2/2 OK (`3,451`/`8,241 ms`) · 5/5 + 1 `503`** | **`2` / `0.71 GB` (`overloaded: false`)** | **SELECTED WINNER** |
| `gemma4:12b` (`mlx` runner, `16 GB` in `ps`) | 134/135 (99.3%) | 135/135 (100.0%) | 0 | 0 | 4,243 / 4,780 ms | 5,479 / 6,361 ms | **FAILED** `H5` (`2-Conc` 1/2 OK · `Burst6` 4/5 OK) | **`4` (Critical)** / `1.70 GB` | Rejected (conflates procurement & workshop; pressure spike) |
| `qwen3:14b` (`llamacpp`, `8.8 GB`) | 132/135 (97.8%) | 133/135 (98.5%) | 0 | 0 | 7,284 / 8,345 ms | 9,970 / 11,177 ms | 2/2 OK · 5/5 + 1 `503` | `2` / `2.18 GB` | Rejected (`R28`/`R29` failed; 60% slower) |
| `qwen3:4b-instruct-2507-q4_K_M` (`3.0 GB`) | 127/135 (94.1%) | 132/135 (97.8%) | 0 | 0 | 3,086 / 3,530 ms | 3,153 / 3,599 ms | 2/2 OK · 5/5 + 1 `503` | `2` / `3.84 GB` | Disqualified (`H5`/`X12`/`X15` failed) |

### Why `carana-gemma4-text` Was Selected Over `gemma4:12b`
Although `gemma4:12b` (`mlx` runner) was `~750 ms` faster on warm total median (`5,479 ms` vs `6,230 ms`), two empirical disqualifiers surfaced under real testing:
1. **Substantive CBD Hallucination Under Live Gateway Concurrency:** On `PROMPTS[3]` (`Can a procurement register verify whether officers actually use a review routine?`), `gemma4:12b` repeatedly asserted `"a procurement register might record the delivery of a workshop"` / `"might serve as an evidence source for a delivered workshop"`, failing `validateEvidence` on both initial generation and repair in `2-Concurrent` (`14,983 ms`, `kind: "source-check"`) and `Burst6` (`21,074 ms`), leaving `concurrent2` `1/2 OK` and `Burst6` `4/5 OK`. `carana-gemma4-text` passed the identical test on the **first pass (`100%`)**.
2. **Memory Footprint Parity & Pressure Spike:** Under Ollama `mlx`, `gemma4:12b` still occupied `16 GB` in `ollama ps` and triggered OS `maxPressureLevel: 4` during the 135-case sweep, whereas `carana-gemma4-text` (`100% GPU` via `llamacpp`) stayed bounded at `maxPressureLevel: 2` (`overloaded: false`) across both the 135-case evaluation and concurrent `Burst6` + Kokoro stress (`cold TTS 2,963 ms`, `warm TTS 386 ms`, `simultaneous AI 4,243 ms + TTS 472 ms` returning `200 audio/wav RIFF`).

## 6. Automated Pre-Release Test Verification

Executed cleanly after all final edits (`carana-service.cjs`, `service-supervisor.cjs`, `provider.cjs`, `gateway.cjs`, `remote-proxy.cjs`, `start-remote-tutor.cjs`, `learning-support.js`, `kokoro-synth.py`, `prepare-ai-preview.cjs`, `package.json`, `run07-report.cjs`):

- `npm run check:content`: **PASS** (`lessons: 5, screens: 38, quizzes: 42`)
- `npm run build`: **PASS** (`18 verified local recordings`)
- `npm test`: **PASS** (all platform, course, storage, smoke, and **`20/20`** AI support unit/integration tests including `tests/support/run07.cjs`)
- `preservation.json` integrity check: **PASS** (`109` total, **`0` mismatched**)
- `tests/support/run07-browser.cjs` (`Chromium 1440px` + `WebKit 390px`): **PASS**
- `tests/support/followup06-browser.cjs`: **PASS**
- `tests/support/assistant-browser.cjs` (`Chromium 1440px` + `WebKit 390px`): **PASS**
- `tests/support/read-aloud-browser.cjs`: **PASS**
- `tests/support/dynamic-reading-browser.cjs` (`Chromium` + `WebKit 390px`): **PASS**
- `course/tests/browser.cjs` (`Chromium` + `WebKit desktop/mobile` + **0 Axe violations**): **PASS**
- `tests/platform/browser.cjs` (`Chromium` + `WebKit desktop/mobile` + **0 Axe WCAG 2.1 AA violations**): **PASS**

## 7. Security, Privacy & Operational Integrity

- Fail-closed Vercel proxy (`404` when `CARANA_AI_ENABLED` unset), HTTPS tunnel verification, shared `X-CARANA-Proxy-Secret`, scrypt per-user access code hashing (`~/.local/share/carana-ai/users.json`), strict same-origin enforcement (`e-learning.maissara.tech`, `cbd.maissara.tech`, approved preview URL), bounded request queue (`maxQueue: 4`), HTTP `503 OVERLOAD` protection, deterministic policy intercepts (`checkpoint`, answer-key, prompt-injection requests answered locally without LLM calls), and privacy-clean `health.jsonl` logging (never logging tokens, prompts, or response prose).

## 8. Known Boundaries & Honest Limitations

- **Active Development/Host Environment:** Production inference runs locally on `Mac17,9` (`Apple M5 Pro`, `24 GB`) supervised by `com.carana.cbd.ai`. Because a mobile laptop over shared Wi-Fi is subject to lid-close sleep and transient Wi-Fi/tunnel drops (observed earlier as transient `ngrok` heartbeat reconnects recovered automatically by `service-supervisor.cjs`), sustained unattended multi-reviewer uptime still depends on keeping the host AC-powered, awake, and on reliable network connectivity (ideally relocated to an always-on wired Mac mini for continuous multi-reviewer cohorts).
- **Cold Page-Cache Variance:** After cold OS boot (empty OS mmap page cache), `carana-gemma4-text` first-turn load measured `8,875 ms` load / `12,890 ms` total (`10,795 ms` cold concurrency total) versus `1,329 ms` load / `5,474 ms` total with warm OS page cache — both dramatically faster than stock `gemma4:26b`'s `33,604 ms` cold baseline.
- **Automated Validation vs. Human Pedagogical Review:** All `135/135` figures above reflect automated retrieval, grounded-evidence validation, contract, and latency verification. Human SME review remains `0` pre-filled ratings (`review-workbench.html`).

## 9. Isolated Candidate Preview Verification

- **Candidate URL (SSO-Protected):** `https://carana-cbd-elearning-mlgaqa1x9-delta4ce20-5830s-projects.vercel.app` (built cleanly from `53af28c87ce866200d269eb4206b46e85076b375` with `1,280` hashed static assets + `5` fail-closed proxy functions; Vercel Inspect ID `HtxGgqW4MCAkzts84JRXjhV1udrx`).
- **Route & Fail-Closed Checks (`vercel curl`):** `/quick-exercise` -> **`200`**, `/CARANA_CBD_Group_Activity` -> **`200`**, `/course/` -> **`200`**, `/platform/` -> **`200`**, `/api/tutor/status` -> **`200`** (`model: "carana-gemma4-text"`, `connected: true`, `tts.available: true`, `reviewerPilotEnabled: true`); unauthenticated missing-origin POST -> `403`, invalid bearer -> `401`.
- **Cold-to-Warm Remote End-to-End Check (`owner-maissara`):**
  - Unloaded idle model prior to test (`npm run ai:unload` -> `loadedModels: []`).
  - Cold Turn 1 (`POST /api/tutor` on `cbd-3:03-10`): **`13,006 ms`** total end-to-end via Vercel + ngrok tunnel, emitted progressive stages `["preparing", "generating", "checking"]` and early `segment: "answer"` (`hasEarlyAnswerSegment: true`, `985` chars, cited `cbd-3:03-10` & `cbd-2:02-05`).
  - Cold Kokoro TTS immediately following (`POST /api/tts`, `kokoro:af_heart`): **`10,573 ms`** (`240,172` bytes `RIFF` WAV, HTTP `200`). Warm Kokoro voice swap (`kokoro:bf_emma`): **`7,557 ms`** (`252,076` bytes `RIFF` WAV, HTTP `200`).
  - Turn 2 follow-up with history: **`6,425 ms`** end-to-end (`kind: "ai"`).
  - Checkpoint policy intercept (`mode: "checkpoint"`): **`2,679 ms`** (`provider: "curriculum-policy"`, `kind: "study-guide"`, zero LLM inference).

## 10. Production Release & Dual-Domain Verification

- **Production Domains:** Primary `https://e-learning.maissara.tech/` and Continuity `https://cbd.maissara.tech/` promoted identically on the same single Vercel deployment (previous production baseline `fa228bed63a07a894a44a2843693695bce9ef2ed` / `dpl_H8ri3tno6gSPDGZNULcjkUhXxur7` preserved on `backup/main-before-run07-2026-11-20`).
- **LaunchAgent QoS Fix Discovered During Live Cold Check:** Live Playwright testing on `https://e-learning.maissara.tech/` caught that `<key>ProcessType</key><string>Background</string>` in `tools/carana-service.cjs` forced `kokoro-synth.py` ONNX synthesis onto Efficiency cores (`>45s` `503` timeout on full replies vs `2.45s` normally). Switching `ProcessType` to `Interactive` restored full P-core scheduling (`3.5s` gateway-measured cold Kokoro synthesis on `970`-char replies; `10,002 ms` end-to-end over public HTTPS -> tunnel; `484–502 ms` warm Kokoro TTS).
- **Verified Multi-Role Production Matrix (Playwright Real Browsers):**
  - `owner-maissara` (`https://e-learning.maissara.tech/`, Desktop Chromium `1440×900`, cold-start unload before test): `/quick-exercise`, `/CARANA_CBD_Group_Activity`, `/course/`, `/platform/`, `/api/tutor/status` all `200`; unauthenticated `/api/tutor` & `/api/tts` fail `401`; Turn 1 `13,998 ms` (`970` chars, progressive stage + early-answer indicators), cold Kokoro Listen `200 audio/wav` (`10,002 ms` client RTT), Turn 2 `5,497 ms` (`864` chars).
  - `denis-tikhomirov` (`https://e-learning.maissara.tech/`, Desktop Chromium `1440×900`): Turn 1 `8,118 ms` (`5,686 ms` gateway), Kokoro WAV `1,625 ms` (`484 ms` gateway), Turn 2 `6,457 ms`.
  - `ahmed-hosny` (`https://cbd.maissara.tech/`, Mobile WebKit `390×844`): Turn 1 `4,212 ms` (`3,724 ms` gateway), Kokoro WAV `2,368 ms` (`502 ms` gateway), Turn 2 `5,089 ms`.
  - **Privacy Audit:** `health.jsonl` (`324` lines) verified with **`0`** bearer tokens, access codes, questions, or response prose leaked.



## 11. Unexpected Audio Investigation, Explicit Initiation & Test Isolation

- **Root causes identified**:
  1. **Unmuted browser test automation (`tests/`, `course/tests/`, `tools/`)**: Playwright Chromium (launched without `--mute-audio`) and WebKit (routing `<audio>` and `speechSynthesis` directly to macOS CoreAudio) previously played real `.mp3`, `.wav`, and `1.75×` OS speech through the host speakers during automated verification runs and stopped abruptly on page transitions or `browser.close()`. Note: backend neural speech synthesis (`tutor/tts.cjs`) renders offline via Kokoro / `AVSpeechSynthesizer.write` into WAV buffers and does not write directly to host audio hardware.
  2. **Stale async cleanup & silent `speechSynthesis` fallback (`platform/learning-support.js`)**: Prior `playAudioUrl()` `finish(false)` did not pause or clear `<audio>` elements on `8s` timeout or `.play().catch()`, and failed/blocked/timed-out neural clips or AI `/api/tts` calls fell back silently to browser `speechSynthesis.speak()`.
  3. **Diagram interaction & lifecycle coordination (`platform/learning-support.js`, `course/lesson1-player.js`)**: `handleExplanationUpdate()` lacked a `reader.paused` guard and could start `readList(...)` unexpectedly; closing/clearing/signing out of the AI dialog did not cancel active/in-flight assistant TTS; `course/lesson1-player.js` lacked `AbortController` teardown, `CARANA_SUPPORT?.stop` pre-start exclusion, `pagehide`/`hashchange`/`visibilitychange` pause hooks, and safe non-destructive button label updates during `timeupdate`.
- **Remediation & verification**:
  - **Explicit initiation & single-source mutual exclusion**: Audio never auto-starts on page load, progress restoration, lesson/screen navigation, diagram node interaction, AI dialog open, or AI answer streaming. Active narration, Read Aloud clips, and AI `Listen` remain strictly mutually exclusive and stop cleanly on navigation, tab backgrounding, AI dialog close/clear/sign-out/new question, or control disposals. Failed neural clips or blocked playback show explicit controls without falling back to robotic `speechSynthesis`.
  - **Muted browser test harness (`tests/helpers/mute-browser.cjs`)**: All 17 Playwright scripts default to muted execution (`--mute-audio` plus `HTMLMediaElement` & offline-event `SpeechSynthesis` silencing) unless explicitly opted into via `CARANA_AUDIBLE_TEST=1`.
  - **Automated regression coverage (`tests/support/audio-safety-browser.cjs`, `tests/support/run07.cjs`)**: Verified zero autoplay, stale async `/api/tts` cancellation, blocked/`503` no-fallback behavior, paused-diagram safety, Clear/Sign-out cancellation, trainer <-> Read Aloud mutual exclusion, backgrounding, and Lesson 1–6 navigation stops across `chromium-desktop`, `webkit-desktop`, and `webkit-mobile`, alongside all 9 Playwright + Axe suites, unit suites, and preservation checks (`18` Lesson 1 `.mp3` recordings and `1,185` Read Aloud neural `.mp3` clips preserved untouched).
