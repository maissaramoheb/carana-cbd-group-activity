# CARANA Run 06 — Follow-up 04: Natural Voice, Dynamic Explanation Reading & Contextual Companion UX

## 1. Executive Summary & Deployment Identifiers

- **Isolated Vercel Preview URL:** `https://carana-cbd-elearning-64h2ot1qn-delta4ce20-5830s-projects.vercel.app`
- **Voice Audition Showcase (Live on Preview):** `https://carana-cbd-elearning-64h2ot1qn-delta4ce20-5830s-projects.vercel.app/course/voice-comparison`
- **Vercel Deployment ID:** `dpl_2SwYWQt4CTBTLBPsuWpFv49ADW4A` (`READY`, `target: preview`, SSO-protected)
- **Application Source Commit:** `282735a0dec237d29a42a8817932aa49adfdc968` on branch `codex/carana-run06-followup-04`
- **Production Status (`https://cbd.maissara.tech/`):** **UNCHANGED** (`dpl_DmQvvbazGm5LGjCHF8s981GqSxvR`). Secondary alias `https://e-learning.maissara.tech/` also **UNCHANGED** (`dpl_C7p1i3UMcSk9e4Yp6H3WAC1fkYg7`).
- **Track A AI Teaching Qualification:** **HOLD** — AI Assistant remains strictly disabled (`HTTP/2 404` on `/api/tutor/status` and `/api/tts`; zero backend/knowledge files staged) on the public Vercel preview. Controlled local Ollama demonstration runs exclusively via loopback HTTPS on the owner's Mac (`npm run tutor:local`).

---

## 2. Workstream A — Natural, High-Quality Neural Speech

### Audit of Native Device Voices
Auditing macOS (`Mac17,9`, arm64, 24 GiB RAM) via `AVSpeechSynthesisVoice.speechVoices()`, `say -v '?'`, and Playwright Chromium/WebKit `speechSynthesis.getVoices()` revealed why previous previews sounded robotic:
1. Browsers on macOS expose only `quality=1` compact/super-compact concatenative voices (`Samantha`, `Daniel`, `Karen`, `Moira`, `Rishi`, `Tessa`, `Aman`, `Tara`) and legacy 1990s formant Eloquence voices (`Eddy`, `Flo`, `Grandma`, `Grandpa`, `Reed`, `Rocko`, `Sandy`, `Shelley`).
2. `AVSpeechSynthesisVoice` includes local neural `quality=2` Apple Siri `Voice 4` (`Nora`, `com.apple.ttsbundle.gryphon-neural_Nora_en-US_premium`), which is hidden from browser `speechSynthesis.getVoices()` and falls back to `Samantha` under `say -v "Voice 4"`.
3. `Voice 4 / Nora` also mispronounced fictional `"Galasi"` as `"Galaxy"` during ASR verification of synthesized output, and Apple EULAs prohibit redistributing system-voice recordings inside web assets.

### Selected Neural TTS Architecture (`Kokoro-82M` + Pronunciation Lexicon + Local Loopback `/api/tts`)
- **Model & License:** Open-weight **Kokoro-82M** (`kokoro-v1.0.int8.onnx`, `109 MiB` offline model weights, **Apache-2.0** license; zero ongoing subscription, zero external cloud APIs or network egress).
- **Performance on Owner Mac mini (`arm64`):** `0.35s` load time; `RTF = 0.063`–`0.087` (~11–16× faster than real-time on CPU).
- **Universal Browser Delivery (`1,185` Content-Addressed Clips):** Pre-rendered all extracted screen headings, paragraphs, lists, worked contrasts, transcripts, interactive diagram explanations (including every `01-01` branch, `05-02` 5×6 matrix cell, micro-cases, and classification feedback), and Lessons 2–6 diagrams into `course/audio/en/readaloud/clips/<sha256_16>.mp3` (`24 kHz`, mono, `24 kbps`, `33 MB` total across `1,185` clips; `release-manifest` verifies `1,280` public static assets total at `47 MB`).
- **Controlled Local Live Synthesis (`tutor/tts.cjs` & `POST /api/tts`):** Strictly loopback `127.0.0.1`, same-origin, Bearer-token authenticated (`0o600` ephemeral secret) endpoint supporting live Kokoro-82M (`af_heart`, `bf_emma`, `am_michael`) with macOS Swift `AVSpeechSynthesizer` `Voice 4 / Nora` built-in fallback for unseen arbitrary selections and AI companion replies.
- **UNPOL/CARANA Pronunciation Normalization:** Dedicated lexicon (`CARANA`, `Galasi`, `UNPOL`, `PESTEL-S`, `UNSCR 2151`, `CBD`, `MMA`, `CPOC`, `SGBV`, `OHCHR`, `DPO`, `KPI`, `COP`, `5×6`, `Q1`–`Q6`) verified across synthesized audio inspections.
- **Fallback Browser Filtering & Preservation:** Filters out robotic Eloquence and novelty voices, prioritizes neural/enhanced OS voices if installed, gates remote browser voice services behind explicit consent, preserves `0.75×`–`1.75×` playback speed, pause/resume/stop, paragraph highlighting, navigation interruption, and leaves all **18 approved Lesson 1 Trainer Narration MP3s untouched** (`preservation.json` 88/88 exact SHA-256 matches).

### Comparative Audio Samples (`/course/voice-comparison`)
Ten identical comparative MP3 clips (`course/audio/en/comparison/p1-*.mp3` and `p2-*.mp3`) render **Passage A** (Diagnostic Decision Path + `"Possible causes"`) and **Passage B** (UNPOL acronyms & frameworks) across:
1. Browser Compact Baseline (`Samantha`)
2. macOS Native Neural (`Apple Voice 4 / Nora`)
3. Kokoro-82M Neural `af_heart` (**Selected Studio Default**)
4. Kokoro-82M Neural `bf_emma` (UK English option)
5. Kokoro-82M Neural `am_michael` (US Male baritone option)

---

## 3. Workstream B — Complete Interactive Dynamic Reading

### Root Causes Fixed
1. Previously, `CARANA_SUPPORT.blocks()` skipped `#concept-feedback` and `#vj-mini-feedback` (`<div>` elements omitted from selectors), excluded the entire `.applied-lab` container (blocking opened `.worked-example`, `#lab-feedback`, `#priority-result`, `#risk-result`), skipped `button` children awkwardly, and had no dynamic update integration when selecting diagram nodes.
2. Selecting **`Possible causes`** in Lesson 1's `01-01` Diagnostic Decision Path previously omitted the selected branch context (`data-read-title`), offered no inline **`Read this explanation`** button, and left active playback stale when changing nodes.

### Implemented Dynamic Integration
- **Component Hooks (`course/visual-journey.js`, `course/lesson1-labs.js`, `platform/exploration.js`, `platform/platform.js`, `course/lesson1-player.js`):** Active revealed explanation regions receive `data-read-explanation="true"`, semantic `data-read-title`, and emit `carana:explanation-updated` events (`restored: true` on initial reload restore so playback never auto-starts unexpectedly). `platform/learning-tools.js` (protected in `preservation.json`) remains 100% unmodified; `platform/learning-support.js` attaches observers safely via DOM contracts.
- **Unobtrusive Inline `"Read this explanation"` Control:** `.support-inline-bar > button.support-inline-read` is inserted as a sibling adjacent to active revealed explanation boxes (`#vj-result`, `#vj-mini-feedback`, `#lab-response`, `#concept-feedback`, `#decision-feedback`, `#lab-feedback`, `#priority-result`, `#priority-compare`, `#risk-result`, expanded `.worked-example` / trainer transcripts). Its label sits inside `.support-ui` / outside `#concept-feedback` so existing assertions and spoken extraction never include `"Read this explanation"` text.
- **Dynamic Sync & Zero Overlap:** Switching from one node to another (e.g., to **`Possible causes`**) during playback atomically cancels old audio (`speechGeneration++`, detached `Audio` release, `speechSynthesis.cancel()`), switches cleanly without overlapping playback, updates spoken queue blocks in logical reading order, and guards `pause`/`resume` concurrency cleanly.
- **Strict Scope Privacy:** Private learner drafts (`<textarea>`, `<input>`, `<select>`, `[data-learner-content]`) and unchecked quiz answers remain completely excluded.

---

## 4. Workstream C — Contextual Learning Companion UX & Owner Local Demo

### UI/UX Redesign (`platform/learning-support.js` & `platform/learning-support.css`)
- **Desktop (`>= 1400px` / `>= 769px`):** Native CARANA Deep-Navy (`#10213A`), UNPOL Teal (`#0F5C6E`), and Mint (`#D7F3EC`) right-hand companion drawer leaving active screen/diagram content visible beside it, with header **`Clear`**, **`Expand`/`Compact`**, and **`Return to lesson`** actions.
- **Context & Governance:** Context bar displays active Lesson / Section / Screen plus active diagram focus (e.g., `Focus: Possible causes`). Disconnected previews display clear `Public Preview` offline status with disabled composer and zero localhost calls; connected local sessions display an amber `Experimental · HOLD` badge and collapsible access-code box.
- **Scannable Structured Messages:** Prompt pill bar (`Explain this screen`, `Practical example`, `What to remember`, `Compare concepts`, `Check my reasoning`, plus contextual `Ask about selected passage`), structured response cards with visually separated **Invented teaching example** and **Evidence limits** callouts, collapsible **`Review source references`**, optional **`Listen`** button per assistant message, smooth thread scrolling, and sticky composer.
- **Mobile (`<= 768px`):** Full-height (`100dvh`) responsive mobile sheet with single-row horizontally scrollable prompt pills and above-the-fold sticky composer & **`Send`** button (`safe-area-inset-bottom` aware).

### Running the Controlled Owner-Only Local AI + Live Neural Studio Demo
```bash
cd "CARANA-CBD-E-Learning"
npm run tutor:local
```
- Starts loopback HTTPS on `https://127.0.0.1:8766` (default model `qwen3:4b-instruct-2507-q4_K_M`, status `not-qualified / Track A HOLD`).
- Copies ephemeral Bearer access code using the printed `pbcopy < <tokenFile>` command for local testing of genuine Ollama inference and live `/api/tts` synthesis.

---

## 5. Verification Summary & Remaining Physical Limits

| Check | Outcome | Evidence |
|---|---|---|
| `npm run check:content`, `npm run build`, `npm test` | **PASS** (0 failures across all unit/integration suites) | [deployed-identifiers-verified.json](deployed-identifiers-verified.json) |
| Workstream B Dynamic Reading (`dynamic-reading-browser.cjs`) | **PASS** Chromium `1440` & WebKit `390` (`Possible causes`, all `01-01` nodes, `05-02` 5×6 matrix, `05-03`, Lessons 2–6 diagrams & transcript, `02-04` `.worked-example` + draft privacy) | [evidence/dynamic-reading-verification.json](evidence/dynamic-reading-verification.json) |
| Read Aloud Studio (`read-aloud-browser.cjs`) | **PASS** Chromium `1440`, WebKit `1440`, WebKit `390` (Kokoro MP3 default, pause/resume/speed, trainer exclusion, browser fallback, progress intact) | [../READ_ALOUD.md](../READ_ALOUD.md) |
| Progressive Enhancement, All 56 Screens, 78 Checkpoint Opt-in | **PASS** (`speechSynthesis` absent resilience, all 56 screens, 78 checkpoint questions excluded by default) | [../evidence/all-screen-extraction.json](../evidence/all-screen-extraction.json) |
| WCAG 2.2 AA Accessibility (`layout-browser.cjs`) | **PASS** 18/18 Axe scans (`0` violations) across desktop/tablet/mobile, RTL reflow & Escape focus return | [../evidence/ui/accessibility.json](../evidence/ui/accessibility.json) |
| Security Negatives (`https-pilot.cjs`) & Local Ollama Demo (`local-ai-browser.cjs`) | **PASS** TLSv1.2, Host/Origin/Bearer/429/413/WAV checks on `/api/tutor` & `/api/tts`; live `qwen3:4b-instruct-2507-q4_K_M` desktop & mobile sheets | [../evidence/genuine-local-ai.json](../evidence/genuine-local-ai.json) |
| Lesson 1 & Lessons 2–6 Full Journeys (`course/tests/browser.cjs`, `tests/platform/browser.cjs`, `exploration-browser.cjs`) | **PASS** Chromium & WebKit desktop/mobile | Verified post-final edit |
| Run 05 Preservation (`preservation.json`) | **PASS** 88 / 88 protected files match baseline SHA-256 | Verified post-final edit |
| Vercel Preview Upload Integrity | **PASS** 1,282 / 1,282 remote file SHA-1 UID matches + 8 live SHA-256 bodies + 5 `/tutor` & `/api` `404` checks; production unchanged | [deployed-identifiers-verified.json](deployed-identifiers-verified.json), [production-unchanged.json](production-unchanged.json) |

**Explicit Acceptance Boundaries (Still Pending Owner Verification):**
Automated Playwright/WebKit checks and ASR inspection of synthesized samples do not replace physical Apple hardware or human qualitative judgment. Physical **iPhone/iPad Safari & desktop `Safari.app` playback**, native **VoiceOver / NVDA** interaction, and the owner's **subjective listening acceptance** via `/course/voice-comparison` and `/course/#lesson-1` remain to be confirmed by the owner before any promotion decision.

---

## 6. Owner Preview & Acceptance Guide

1. **Judge Voice Naturalness First:** Open `https://carana-cbd-elearning-64h2ot1qn-delta4ce20-5830s-projects.vercel.app/course/voice-comparison` (after Vercel sign-in) and compare `Samantha` vs `Apple Neural Nora` vs `Kokoro-82M Heart / Emma / Michael` on Passages A & B.
2. **Test Dynamic `"Possible causes"` & Interactive Diagram Reading:** Open `/course/#lesson-1`, select **`Possible causes`** in the Diagnostic Decision Path, click the revealed **`Read this explanation`** button underneath `#vj-result`, then click **`Verify evidence`** while listening to confirm zero overlap and live switching. Try **`Listen / Read screen`** -> **`Read screen`** (`0.75×`–`1.75×`, Pause/Resume/Stop) and verify Lesson 1 **`▶ Play explanation`** Trainer Narration stops Read Screen automatically.
3. **Test Lessons 2–6 Diagrams & Worked Examples:** Open `/platform/?course=cbd&lesson=cbd-2`, explore diagram nodes, expand `Read the trainer explanation` or `Compare with an illustrative approach` in interactive labs, and use **`Read this explanation`**.
4. **Inspect Redesigned AI Companion UI:** Click **`? Ask a question`** on desktop and mobile. Confirm the CARANA-integrated drawer styling, context focus badge (`Focus: Possible causes`), crisp offline preview notice (`Send` disabled), and keyboard `Escape` focus return.
5. **Optional — Experience Live Local Conversation on Owner Mac:** Run `npm run tutor:local` locally, open the printed `https://localhost:8766/course/#lesson-1` URL, copy the access token via the printed `pbcopy` command, unlock the companion, and test live grounded replies (`Experimental · HOLD`).
