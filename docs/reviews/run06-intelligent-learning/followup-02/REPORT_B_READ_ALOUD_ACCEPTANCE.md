# Report B — Read Aloud Studio Independent Qualification & Release Readiness (Run 06 Follow-up 02)

## Final Recommendation: **READY FOR OWNER ACCEPTANCE (TTS-Only Release Candidate Prepared)**

Read Aloud Studio (`platform/learning-support.js` and `platform/learning-support.css`) has been refined, independently verified across all 56 instructional screens and 78 checkpoint questions in Chromium desktop, Safari/WebKit desktop, and Mobile WebKit emulation, and staged as a static **TTS-only release candidate** with zero unqualified AI backend activation. Production (`https://cbd.maissara.tech/`) remains completely untouched.

---

## 1. Functional Verification Results

All 14 functional requirements in Section B2 were verified through automated native-browser speech instrumentation (`tests/support/read-aloud-browser.cjs`, `tests/support/all-screen-extraction.cjs`, `tests/support/checkpoint-reading.cjs`, `tests/support/progressive-browser.cjs`):

| Requirement | Verification Result | Evidence |
|---|---|---|
| **Play (`#read-play`)** | **PASS** — Starts browser-native `SpeechSynthesisUtterance` sequence on explicit user click; never autoplays. | `evidence/read-aloud/native-playback.json` |
| **Pause (`#read-pause`)** | **PASS** — Calls `speechSynthesis.pause()`, sets `data-read-state="paused"`, updates badge to `PAUSED`, enables Resume. | `evidence/read-aloud/native-playback.json` |
| **Resume (`#read-resume`)** | **PASS** — Calls `speechSynthesis.resume()`, restores `data-read-state="playing"` and badge `READING`, continues active utterance. | `evidence/read-aloud/native-playback.json` |
| **Restart (`#read-play` while active)** | **PASS** — Button label updates to `Restart screen` during active reading and restarts cleanly from passage 1 with incremented generation ID. | `evidence/read-aloud/native-playback.json` |
| **Stop (`#read-stop`)** | **PASS** — Cancels speech synthesis, clears `[data-read-current]` passage highlight, disables Pause/Resume/Stop, resets badge to `READY`. | `evidence/read-aloud/native-playback.json` |
| **Reading-speed selection (`#read-speed`)** | **PASS** — Five speeds (`0.75×`, `1×`, `1.25×`, `1.5×`, `1.75×`). Changing speed while playing restarts from current passage at new rate; changing speed while paused preserves paused state and applies to the next passage (preventing WebKit cancel/restart defects). | `evidence/read-aloud/native-playback.json` |
| **Available voice selection (`#read-voice`)** | **PASS** — Filters English voices (`en` / `en-*`), excludes macOS novelty voices, sorts on-device voices first (`Samantha · en-US · on device`), and gates any non-local browser voice behind explicit user consent (`#read-service`). | `evidence/native-voice-inventory.json`, `evidence/progressive-enhancement.json` |
| **Reading correct visible lesson text** | **PASS** — Verified across all **56 mounted screens** (18 in Lesson 1 + 38 in Lessons 2–6). Extracts headings, leads, bullet points, takeaways, and visible diagram explanations in DOM order while excluding menus, controls, hidden nodes, facilitator keys, and learner drafts. | `evidence/all-screen-extraction.json` |
| **Appropriate paragraph/section selection (`#read-selection`)** | **PASS** — Reads user-selected lesson passage or deliberately selected private draft text; prompts clearly if no selection exists. | `evidence/read-aloud/native-playback.json` |
| **Optional checkpoint reading (`#read-questions`)** | **PASS** — Verified across all **78 checkpoint questions** (36 in Lesson 1 + 42 in Lessons 2–6). Excluded by default; included with answer options only when the learner checks `Include visible questions and answer choices`. Zero progress mutation. | `evidence/checkpoint-reading.json` |
| **Text highlighting & reliable fallback** | **PASS** — Highlights the active paragraph/list item with `[data-read-current="true"]` (`#e1f2f6` background, `2px solid #146981` outline), gently scrolls out-of-view passages into the viewport (`scrollIntoView({block:'nearest',behavior:'auto'})`), and displays a live excerpt preview in `#read-status`. Does not rely on inconsistent browser word-boundary events. | `evidence/read-aloud/chromium-desktop-reading.png` |
| **Playback termination on navigation** | **PASS** — Screen navigation, section switching, opening the assistant dialog, `pagehide`, and tab backgrounding (`visibilitychange`) immediately cancel speech and clear highlights. | `evidence/read-aloud/native-playback.json` |
| **Error recovery when speech unavailable** | **PASS** — Verified with `speechSynthesis === undefined`, empty `getVoices() === []`, `utterance.onerror`, and an 8-second start watchdog timer. Disables `#read-play` gracefully while keeping all written content and Lesson 1 recordings available. | `evidence/progressive-enhancement.json` |
| **Preservation of 18 Lesson 1 recordings & mutual exclusion** | **PASS** — All 18 original Lesson 1 MP3 files match their baseline SHA-256 hashes. Starting `Read Screen` pauses `<audio id="trainer-audio">`; starting `Trainer Narration` immediately stops `Read Screen` with status `"Trainer Narration is playing. Read Screen has stopped."` | `preservation.json`, `evidence/read-aloud/native-playback.json` |

---

## 2. UI/UX Refinements Implemented (Section B3)

Refinements in `platform/learning-support.js` and `platform/learning-support.css` within the approved CARANA design language:

1. **Discoverability of the Listen Control:**
   - Added a clear speaker icon (`🔊`) and active expansion state (`aria-expanded="true"` styling in `#edf6f8` with `#146981` border) on `Listen / Read screen`, plus explicit context text: *"Optional learning support · Read Screen uses your browser voice"*.
2. **Visual Relationship Between Spoken Text and Playback Controls:**
   - Added a header row inside `#support-reader` with a live state pill badge (`#read-state-badge`: `READY`, `READING 1/N`, `PAUSED`) and container state styling (`data-read-state="idle|playing|paused"`).
   - Styled `#read-play` as a distinct primary action button (`.support-primary` in CARANA teal `#146981`) and disabled `#read-stop` when idle so active vs. inactive controls are immediately legible.
   - Enhanced `#read-status` to include an inline preview snippet of the currently spoken passage (`Reading passage 1 of N · paragraph focus — “Imagine arriving in fictional Galasi…”`) alongside the visual `[data-read-current="true"]` outline on the spoken paragraph.
3. **Nonintrusive Controls While Scrolling & Diagram Safety:**
   - The Read Aloud Studio remains an inline, collapsible rail mounted directly beneath the screen title/lead. It introduces **no floating overlays or sticky bars** that could obscure interactive diagrams, the 5×6 CBD matrix, or applied learning tools.
   - When reading advances to a passage outside the current viewport, `scrollIntoView({block:'nearest',behavior:'auto'})` brings the highlighted paragraph into view smoothly without hijacking scroll when the passage is already visible.
4. **Mobile Behavior & Touch Ergonomics:**
   - All buttons, selects, and summary triggers enforce `min-height: 44px`. On mobile viewports (`<= 600px`), playback buttons arrange cleanly in a 2×2 grid (`flex: 1 0 38%`) with a full-width speed selector row and zero horizontal overflow (`scrollWidth <= innerWidth`).
5. **Clear Separation Between Trainer Narration and Read Screen:**
   - Lesson 1's recorded audio card is explicitly titled **Trainer narration** (`English · AI-generated narration · Optional`), while the expandable TTS panel is labeled **Read Screen · browser voice, separate from Trainer Narration**, with automatic mutual exclusion enforced in both directions.

---

## 3. Browser Compatibility, Accessibility & Visual Evidence (Section B4)

### Automated Browser & Accessibility Matrix
- **Browsers Tested:**
  - **Chromium Desktop** (`1600×1000` and `1440×950`) — **PASS**
  - **Safari / WebKit Desktop** (`1440×950`) — **PASS**
  - **Mobile WebKit Emulation** (`390×1000` and `390×950`) — **PASS**
  - **Tablet Chromium** (`768×1000`) — **PASS** (all 56 screens mounted and verified for zero horizontal overflow)
- **Axe WCAG 2.0 A/AA, 2.1 AA, 2.2 AA Scans (`evidence/ui/accessibility.json`):**
  - **18 full-page Axe scans** across 2 lesson architectures (`Lesson 1` and `Lesson 3`) × 3 UI states (`closed`, `reading`, `assistant`) × 3 viewports (`desktop 1600`, `tablet 768`, `mobile 390`): **0 violations returned**.
- **Keyboard, Focus, Reduced-Motion & RTL:**
  - Visible `:focus-visible` ring (`3px solid #146981`, `outline-offset: 3px`) on all buttons, selects, inputs, and `<summary>` elements.
  - Opening `Listen / Read screen` moves focus directly to `#read-play`; pressing `Escape` inside the assistant dialog closes it and restores focus to `#support-ask`.
  - `@media (prefers-reduced-motion: reduce)` disables all animations, transitions, and smooth scrolling.
  - `[dir="rtl"]` reflow verified with zero horizontal overflow.
- **Highlight Contrast & Readability:**
  - Highlighted passage text uses CARANA navy (`#102d46`) on light ice-teal (`#e1f2f6`), yielding a contrast ratio of **11.4 : 1** (exceeding WCAG AAA `7:1`), framed by a `2px solid #146981` outline (`outline-offset: 5px`).

### Desktop & Mobile Screenshots
- Chromium Desktop Active Reading & Highlight: [chromium-desktop-reading.png](../evidence/read-aloud/chromium-desktop-reading.png)
- WebKit Desktop Active Reading & Highlight: [webkit-desktop-reading.png](../evidence/read-aloud/webkit-desktop-reading.png)
- Mobile WebKit Active Reading & Highlight: [webkit-mobile-reading.png](../evidence/read-aloud/webkit-mobile-reading.png)
- Desktop Lesson 1 Read Screen Studio: [desktop-lesson1-settings.png](../evidence/ui/desktop-lesson1-settings.png)
- Mobile Lesson 3 Read Screen Studio: [mobile-lesson3-settings.png](../evidence/ui/mobile-lesson3-settings.png)

### Explicit Hardware & Assistive-Technology Limitations
- **Physical iPhone / iPad Safari & Released `Safari.app`:** **NOT VERIFIED** (verified via local macOS Playwright WebKit desktop and mobile WebKit emulation; emulation does not establish physical iOS hardware compatibility).
- **Native Screen Readers (macOS/iOS VoiceOver, NVDA, JAWS) & Human Audible Listening:** **NOT VERIFIED** (ARIA landmarks, `aria-expanded`, `aria-controls`, `role="status"`, `aria-live="polite"`, and Axe checks are verified programmatically, but live human listening for voice naturalness, acronym pronunciation, and native screen-reader interaction remains an owner acceptance step).

---

## 4. Release Separation & TTS-Only Release Candidate (Section B5)

Read Aloud Studio is completely independent of the AI Learning Assistant backend:

1. **Prepared TTS-Only Release Candidate (`.vercel/output/static` and `dist/`):**
   - Built via `node tools/release/prepare.cjs` into `.vercel/output/static` with `release-manifest.json` (82 static assets, each with verified byte counts and SHA-256 hashes).
   - **Zero AI backend files are included in the release candidate:** `tutor/gateway.cjs`, `tutor/provider.cjs`, `tutor/retrieval.cjs`, `tutor/knowledge.json`, `tutor/official-excerpts.json`, `tools/*`, and `tests/*` are excluded from `dist/` and `.vercel/output/static` (enforced by `prepare.cjs` and verified by file manifest inspection).
   - In the static release candidate, `/api/tutor/status` returns `404`, causing the assistant drawer to display the honest offline message (*"Not connected in this preview. You can continue the lesson and use Read Screen. Live AI is available only in the controlled local pilot."*) with `Send question` disabled (`disabled=true`) and **zero localhost or external inference requests**.
2. **Exact Source Changes Contained in the Static UI Candidate (vs. Run 05 Baseline `7615804`):**
   - `course/index.html` (+2 lines: loads `../platform/learning-support.css` and `../platform/learning-support.js`)
   - `course/app.js` (+2 lines: calls `window.CARANA_SUPPORT?.mount(...)` and `window.CARANA_SUPPORT?.dispose()`)
   - `course/lesson1-player.js` (3 lines: heading label `Trainer narration` and comment clarifying separation from `Read Screen`)
   - `platform/index.html` (+2 references: loads `./learning-support.css` and `./learning-support.js`)
   - `platform/platform.js` (+3 lines: calls `window.CARANA_SUPPORT?.mount(...)` and `window.CARANA_SUPPORT?.dispose()`)
   - `platform/learning-support.js` (42 lines: Read Aloud Studio + offline-safe support drawer)
   - `platform/learning-support.css` (15 lines: Read Aloud Studio + responsive/a11y/print rules)
3. **Production & Preview Status:**
   - **Production (`https://cbd.maissara.tech/`):** Verified **UNCHANGED** (serves deployment `dpl_DmQvvbazGm5LGjCHF8s981GqSxvR`, source commit `0a1031f9c63ebf81aa232c558b54d951a60504e3`).
   - **Protected Preview (`https://carana-cbd-elearning-5pcts99ds-delta4ce20-5830s-projects.vercel.app/`):** Verified active (`HTTP/2 302` to Vercel SSO authentication, `x-robots-tag: noindex`, deployment `dpl_9TzLLDKBR75bxEV9TszdFN1PCxh5`). No automatic production promotion or alias mutation was performed.
