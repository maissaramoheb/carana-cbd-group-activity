# CARANA Run 08 — Trilingual Learning Experience (`en` · `fr-FR` · `ar`) Implementation & Verification Report

**Date:** 2026-11-21  
**Branch:** `run08/trilingual-learning-experience`  
**Starting Verified Baseline:** `199d0ad573e017c60f15dfb736a095dbc94ceb4e` (`carana-cbd-v0.14.2-run07`, preserved on `backup/main-before-run08-2026-11-20`)  
**Production Environment Status:** Untouched (`https://e-learning.maissara.tech/` and `https://cbd.maissara.tech/` not modified or deployed)  
**Review Governance Status:** **Technically complete & automated-regression verified** · Human linguistic review (`0/144`), SME sign-off (`0/144`), and production approval (`approvedForProduction: false`) remain pending for `fr-FR` and `ar`.

---

## 1. Executive Summary

Run 08 delivers complete French (`fr-FR`) and Arabic (`ar`) localization—plus a genuinely engineered Arabic right-to-left (RTL) experience, multilingual local AI Learning Companion, and language-aware Read Aloud / TTS audit—within a single shared codebase retaining English (`en`) as the semantic source of truth.

Key outcomes:
- **Zero baseline degradation & zero data loss:** `CARANA_CBD_Group_Activity.html` (SHA-256 `b1ff9a705c3faeee59000b629ae3db4aa23f9d2d7d5c8a2cef1a9872532e26d4`), all `18` Lesson 1 English MP3 narrations (`tools/narration-lock.json` `18/18` SHA-256 verified), all `1,185` English Read Aloud clips under `course/audio/en/readaloud/clips/`, all existing storage schemas, and export compatibility remain intact.
- **One shared localization architecture:** Unified runtime (`platform/i18n.js`), logical/RTL stylesheet (`css/i18n-rtl.css`), and 8 lazy-loaded JSON packs under `locales/{fr-FR,ar}/{ui,course-l1,lessons-2-6,workbenches}.json` (`tools/build-course.mjs` stages packs into `dist/locales/`). Switching `en ↔ fr-FR ↔ ar` preserves screen position, quiz choices, drafts, workbook edits, and companion conversation history without restarting lessons.
- **Full educational & surface parity:** All six UNPOL CBD phases (Lesson 1 and Lessons 2–6), Modules 1–6 practical workbenches, 57-paragraph CARANA scenario, curriculum glossary, Module 6 Printable Dossier, Evidence-to-Decision Notebook, Exploration tracker, Visual Gallery, Demo/Showcase pages, Voice Audition/Comparison studio, Read Aloud controls, and AI Learning Companion operate across `en`, `fr-FR`, and `ar`.
- **Automated & visual verification:** After the final code and CSS edits, `npm run build`, `npm run check:content`, `node tools/validate-i18n.cjs`, `npm test`, `node --test tests/i18n/trilingual.cjs`, `tests/i18n/trilingual-browser.cjs` (Chromium desktop, WebKit desktop, WebKit mobile `390×844`), and all five core/support browser regression suites passed with zero failures.

---

## 2. Shared Localization Architecture (`en` · `fr-FR` · `ar`)

- **Core Runtime (`platform/i18n.js`):** Supports `en`, `fr-FR`, and `ar` via normalized BCP-47 resolution, local persistence (`carana_lang_v1`), surface registration (`registerSurfaces(['ui', 'course-l1', 'lessons-2-6', 'workbenches'])`), asynchronous lazy loading (`ready`), safe variable interpolation (`formatVars`), bidirectional isolation (`bdi`), DOM attribute/text translation (`applyStaticDom`, `translateWorkbenchDom`), and immediate audio halt across switches (`stopAllAudioForSwitch`).
- **Build & Distribution (`tools/build-course.mjs` & `course/tests/build-integrity.cjs`):** Copies `locales/{fr-FR,ar}/*.json` into `dist/locales/` while keeping all 18 SHA-locked Lesson 1 MP3s and `narration-lock.json` unchanged.
- **Unified Language Selector (`.carana-lang-switch`):** Embedded across the Home hero header (`#home-lang-slot` outside `.header-utility` for tablet/mobile visibility), lesson headers, Activities Hub, Module 1–6 workbenches, Evidence-to-Decision Notebook, Demo/Showcase pages, Visual Gallery, and Voice Studio pages.
- **Extensibility & Fallback Policy:** Canonical English identifiers (`cbd-1`..`cbd-6`, `01-01`..`06-07`, quiz option indices, `On Track` / `Delayed` / `Critical Variance` / `Exceeded` storage enums) remain invariant across languages, allowing future UN languages to be added purely through new locale folders.

---

## 3. Content Translation, Terminology Control & Learning Environment Coverage

### Automated Schema & Surface Coverage (`node tools/validate-i18n.cjs`)
| Surface / Pack | Scope Verified in `fr-FR` and `ar` | Status |
| :--- | :--- | :--- |
| `ui.json` (shared platform UI, course shell, companion, Read Aloud) | `1,432` leaf keys (symmetry & interpolation checked) | Verified (`0` warnings/failures) |
| `course-l1.json` (Lesson 1 · Situational Analysis) | `18` screens, `36` checkpoints, `7` decisions, visuals, labs, `18` narration transcripts | Verified (`0` leaks) |
| `lessons-2-6.json` (Lessons 2–6 · Objectives through Transition) | `5` lessons, `38` screens, `42` checkpoints, `38` decisions, `17` applied labs | Verified (`0` leaks) |
| `workbenches.json` (Activities Hub, Modules 1–6, Scenario, Glossary, Dossier) | `619` `strings` + `1,143` `dom` keys across `15` HTML entry pages | Verified (`0` leaks) |
| `TERMINOLOGY_GLOSSARY.{json,md}` | `52` EN–FR–AR UNPOL/CBD concepts (`unterm-established: 39`, `unpol-source: 6`, `carana-adapted: 4`, `proposed-pending-review: 3`) | Verified (`52` entries) |

Key instructional preservation controls:
- **Conceptual fidelity over literalism:** Preserved distinctions between Capacity Gap (`Déficit de capacités` / `فجوة القدرات`), Output (`Produit` / `المُخرَج`) vs Outcome (`Réalisation` / `النتيجة`), Performance Indicators vs Verification Sources, Assumptions vs Risks, Counterpart/Local Ownership (`Appropriation locale` / `الملكية المحلية`), Mission Drawdown vs Transition Arrangements (`Dispositions de transition` / `ترتيبات الانتقال وتسليم المسؤوليات`), and IHL/IHRL & SGBV requirements.
- **No answer-key mutation:** Checkpoint quiz answer indices and protected answer structures remain invariant in English runtime logic.
- **Learner-generated data safety:** User drafts, Module 1–6 fields (`markLearnerTextFields` with `data-learner-text` and `dir="auto"`), `#saveIndicator` state tracking (`data-save-key` across `"Loaded"`, `"Loaded local data"`, `"Autosaved"`, `"Saved locally on this device"`, and `"⚠️ Storage full or blocked! Export JSON."`), and Notebook threads stay verbatim in the learner's entered script across language switches and JSON exports/imports.

---

## 4. Arabic RTL Engineering & Cross-Browser Visual Fixes

Implemented in `css/i18n-rtl.css`, `course/app.js`, `course/visual-journey.css`, `course/illustrations.css`, `course/hybrid-visuals.css`, `course/lesson1-illustrations.js`, and `js/storage/lab-storage.js`:
- **Structural RTL (`lang="ar"`, `dir="rtl"`):** Logical inline spacing, reversed step/breadcrumb directional flow without inverting data-column semantics in logframes, SWOT quadrants, or 5×6 matrices.
- **Typography & Bidi:** `letter-spacing: 0` enforced on Arabic UI and prose to prevent broken glyph ligatures; `<bdi dir="ltr">` and `dir="auto"` applied around technical acronyms (`UNPOL`, `CBD`, `PESTEL-S`, `SMART`, `CNPS`, `UNMIC`), numeric metrics, IDs, URLs, and learner text inputs.
- **Responsive Navigation & Mobile Layout:** Moved `#home-lang-slot` out of `.header-utility` so the switcher stays visible below `1280px` (down to `390px`), set `.course-header { position: static; }` and `html { scroll-behavior: auto; }` under `@media (max-width: 800px)`, disabled `.carana-lang-btn` transitions under `@media (prefers-reduced-motion: reduce)`, and prevented WebKit mobile layout-shift tap misses on Lesson 1 storyboards (`01-01`, `03-03`, `04-02`) by reserving natural `1672 / 941` aspect ratio with `loading="eager"`.
- **Legacy Contrast Note:** Pre-Run 08 `.btn-primary`, `.top-nav-left > a`, `.track-num`, and `.badge` cyan styling (`--un-blue`) in `css/design-system.css` fails WCAG AA contrast in English as well and was kept unchanged to preserve the approved English visual identity; `tests/i18n/trilingual-browser.cjs` runs full Axe WCAG 2.1 AA checks across `course/`, `platform/`, `notebook.html`, `.carana-lang-switch`, and workbench pages (excluding only those four legacy selectors).

---

## 5. Multilingual AI Learning Companion Evaluation

Backend extensions in `tutor/retrieval.cjs`, `tutor/provider.cjs`, and `tutor/gateway.cjs`, paired with `platform/learning-support.js`:
- **Multilingual Grounded Retrieval:** Normalizes French diacritics (NFD) and Arabic orthographic variants (`alef`/`taa marbuta`/`hamza`/harakat) and Arabic-Indic numerals (`normalizeUnicode`), bridges French/Arabic domain queries onto canonical English curriculum passages via `MULTILINGUAL_TOKEN_MAP` and `stripArabicPrefixCandidates`, and keeps all returned `sourceIds` and document citations anchored to authorized English curriculum units.
- **Evidence Validation & Guardrails:** Rejects unsupported numerals (handling English words, Arabic-Indic numerals, and FR/AR lesson references), enforces `VALID_LANGS` (`en`, `fr-FR`, `ar`), localizes gateway refusals and errors via `GW_MESSAGES`, blocks cross-language procurement fabrications (`école`, `مدرسة`, etc.) and non-CBD OOD traps with zero AI calls, and declines FR/AR checkpoint answer-key or prompt-injection requests via protected study guidance.
- **Live Evaluation (`docs/reviews/run08-trilingual/AI_MULTILINGUAL_EVAL.json`):** `12/12` live cases passed against local Ollama `carana-gemma4-text:latest` (`en`, `fr-FR`, `ar` substantive explanations; `cbd-5:05-01` & `cbd-6:06-01` deictic screen actions; FR/AR OOD trap declines with `source-check`; FR/AR prompt-injection declines with `study-guide`; EN → FR multi-turn follow-up retaining history context). All inference remained local.

---

## 6. French & Arabic Audio Feasibility & Benchmark (`AUDIO_BENCHMARK.{json,md}`)

Tested on `darwin` / `arm64` (Node `v26.9.0`) via `tutor/tts.cjs` and `tools/kokoro-synth.py` without generating bulk lesson audio. Six short benchmark samples were archived under `docs/reviews/run08-trilingual/audio-samples/`:

| Sample ID | Language | Engine / Voice | Acronym Normalization | Duration (s) | Latency (ms) | RTF | MP3 (bytes) | Review Status |
| :--- | :--- | :--- | :--- | ---: | ---: | ---: | ---: | :--- |
| `fr-kokoro-raw-unpol` | `fr-FR` | Kokoro-82M ONNX (`ff_siwis`) cold CLI | No | 11.58 | 2,191 | 0.189 | 35,156 | Sample · Pending approval |
| `fr-kokoro-norm-unpol` | `fr-FR` | Kokoro-82M ONNX (`ff_siwis`) daemon | Yes (`fr-FR`) | 11.52 | 1,634 | 0.142 | 35,012 | Sample · Pending approval |
| `fr-kokoro-norm-smart` | `fr-FR` | Kokoro-82M ONNX (`ff_siwis`) warmed daemon | Yes (`fr-FR`) | 11.06 | 754 | 0.068 | 33,572 | Sample · Pending approval |
| `fr-macos-thomas-unpol` | `fr-FR` | macOS `AVSpeechSynthesizer` (`Thomas`, compact) | Yes (`fr-FR`) | 10.38 | 1,371 | 0.132 | 31,556 | Sample · System voice |
| `ar-macos-majed-l1` | `ar` | macOS `AVSpeechSynthesizer` (`Majed ar-001`, compact) | Yes (`ar`) | 15.12 | 680 | 0.045 | 45,812 | Sample · Pending approval |
| `ar-macos-majed-l2` | `ar` | macOS `AVSpeechSynthesizer` (`Majed ar-001`, compact) | Yes (`ar`) | 13.43 | 637 | 0.047 | 40,700 | Sample · Pending approval |

### Limitations & Runtime Safety Guarantees
- **Kokoro Arabic absence:** `kokoro-v1.0.int8.onnx` / `voices-v1.0.bin` provides **zero Arabic voices** (`kokoroArabicSupport: false`); `piper` and `espeak-ng` are not installed.
- **macOS Arabic system constraint:** `apple:majed` (`com.apple.voice.compact.ar-001.Maged`, quality `1` compact) handles MSA cleanly locally, but exhibits minor prosodic breaks around embedded Latin acronyms (`PESTEL-S`, `UNPOL`) and OS licensing prevents static multi-OS web bundling.
- **Zero English fallback:** When `fr-FR` or `ar` is selected, `platform/learning-support.js` and `tutor/tts.cjs` exclude the English Read Aloud studio manifest and English TTS voices, filter browser Web Speech voices strictly by active language prefix (`fr` / `ar`), halt speech on navigation/language switch/panel close/page hide, keep transcripts always readable, and show an explicit availability notice if no local voice is available.

---

## 7. Trilingual Review Matrix & Quality Validation

Generated in `docs/reviews/run08-trilingual/TRILINGUAL_REVIEW_MATRIX.{json,md,html}`:
- **Mapped Coverage:** `144` rows covering all Lesson 1 screens & checkpoints, Lessons 2–6 screens, checkpoints & applied labs, Workbenches Hub & Modules 1–6, Evidence-to-Decision Notebook, Demo/Visual/Voice tools, and Multilingual AI Companion / Read Aloud surfaces, plus `14` critical UNPOL/CBD terminology spot-checks.
- **Explicit Distinction:**
  - `technicallyComplete`: `144 / 144` in `en`, `fr-FR`, and `ar`
  - `linguisticReviewed`: `144 / 144` canonical (`en`), **`0 / 144` pending human review** (`fr-FR`, `ar`)
  - `smeReviewed`: `144 / 144` approved (`en`), **`0 / 144` pending UNPOL SME review** (`fr-FR`, `ar`)
  - `approvedForProduction`: `144 / 144` (`en`), **`0 / 144` (`fr-FR`, `ar`)**

---

## 8. Final Verification Suite Results (Post-Final Edit)

Every check below ran and exited `0` after the final code/CSS edit:

| Check / Suite | Scope | Observed Result |
| :--- | :--- | :--- |
| `npm run build` | `tools/build-course.mjs` (`dist/` + `locales/` + 18 locked L1 MP3s) | Passed (`exit 0`) |
| `npm run check:content` | `tools/validate-content.cjs` | Passed (`5` lessons, `38` screens, `42` quizzes) |
| `node tools/validate-i18n.cjs` | Pack symmetry, variables, leakage, Arabic script, 15 HTML pages | Passed (`ok: true`, `0` warnings/failures) |
| `tests/run-tests.js` | Workbenches Groups 1–13 | `65 passed, 0 failed` |
| `course/tests/v05-smoke.cjs` | Course Lesson 1 structure & smoke check | Passed (`33 assertions`) |
| `course/tests/build-integrity.cjs` | Locked media & script SHA-256 verification | `1 passed, 0 failed` |
| `tests/platform/*.cjs` (`content`, `learning-tools`, `progress-recovery`, `handoff`, `notebook`, `exploration`) | Lessons 2–6 platform, recovery, handoff, notebook, exploration | `28 passed, 0 failed` (`2 + 5 + 6 + 4 + 5 + 6`) |
| `tests/support/*.cjs` (`tutor`, `provider`, `remote-proxy`, `pilot-ops`, `service-supervisor`, `run07`) | Local AI companion, security, proxy, supervisor, TTS contracts | `21 passed, 0 failed` |
| `node --test tests/i18n/trilingual.cjs` | I18n switching, workbench EN export parity, FR/AR retrieval & AI safety, TTS isolation | `5 passed, 0 failed` |
| `tests/i18n/trilingual-browser.cjs` | Desktop Chromium (`2755ms`), Desktop WebKit (`2096ms`), Mobile WebKit (`1957ms`) — EN/FR/AR switches, RTL layout, `letter-spacing: 0`, `<bdi>`/draft retention, companion RTL, Axe WCAG 2.1 AA | Passed (`ok: true`, `0` violations/errors) |
| `course/tests/browser.cjs` | Full 18-screen L1 journey, narration, 36 quizzes, gallery 320/768, failure cases, Chromium + WebKit desktop + WebKit mobile + 35-trial WebKit mobile CLS verification | Passed (`35/35` stress + full suite pass) |
| `tests/platform/browser.cjs` | Lessons 2–6 full browser workflows & Axe WCAG 2.1 AA (Chromium, WebKit desktop/mobile) | Passed |
| `tests/platform/exploration-browser.cjs` | Separate history, imports, draft/Notebook retention (Chromium, WebKit mobile) | Passed |
| `tests/support/run07-browser.cjs` | Live companion UI streaming, WAV playback, follow-up history (Chromium desktop, WebKit mobile) | Passed |
| `tests/support/audio-safety-browser.cjs` | Zero autoplay, mutual exclusion, switch/nav stop (Chromium desktop, WebKit desktop/mobile) | Passed |

---

## 9. Remaining Actions Before Production Promotion

1. **Human Native / UNPOL SME Review:** Conduct native French and Arabic UNPOL instructional review against `docs/reviews/run08-trilingual/TRILINGUAL_REVIEW_MATRIX.html` and `docs/localization/TERMINOLOGY_GLOSSARY.md` (especially items marked `proposed-pending-review`).
2. **French / Arabic Audio Sign-Off:** Review the 6 sample clips in `docs/reviews/run08-trilingual/audio-samples/` (`ff_siwis` pronunciation of UNPOL terms and `Majed` MSA prosody); authorize bulk FR Kokoro generation or neural AR voice integration before bundling localized MP3 assets.
3. **Owner Release Approval:** Production deployment to `https://e-learning.maissara.tech/` and `https://cbd.maissara.tech/` remains blocked until human review sign-off and explicit owner promotion approval.
