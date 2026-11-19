# CARANA Run 06 Follow-up 03 — Read Aloud Studio (TTS-Only) Owner Acceptance Package

## 1. Release Summary & Status

- **Isolated Vercel Preview URL:** `https://carana-cbd-elearning-hnh5wj352-delta4ce20-5830s-projects.vercel.app`
- **Vercel Deployment ID:** `dpl_BLJ4n1qWjcaMoayggYhWdEiDym4G` (`target: preview`, `status: READY`, SSO-protected `HTTP/2 302`)
- **Application Source Commit:** `804e7f97d28abcfe4b19141e48c15b11826bdbff` (on branch `codex/carana-run06-followup-02`, pushed and verified on GitHub)
- **Track B (Read Aloud Studio):** **READY FOR OWNER ACCEPTANCE**
- **Track A (AI Learning Assistant):** **HOLD — No model approved for learner use.** Zero AI backend, retrieval index, or provider files are included in the deployed preview (`/tutor/knowledge.json`, `/tutor/gateway.cjs`, and `/api/tutor/status` all return `HTTP/2 404`). Opening `Ask a question` displays the honest offline notice and keeps `Send question` disabled.
- **Production Status (`https://cbd.maissara.tech/`):** **UNCHANGED** (`dpl_DmQvvbazGm5LGjCHF8s981GqSxvR`, source commit `0a1031f9c63ebf81aa232c558b54d951a60504e3`). Secondary alias `https://e-learning.maissara.tech/` also **UNCHANGED** (`dpl_C7p1i3UMcSk9e4Yp6H3WAC1fkYg7`).

---

## 2. Deployed Artifact & Run 05 Preservation Verification

1. **Complete 84-File Deployed Tree Verification ([deployed-identifiers-verified.json](deployed-identifiers-verified.json)):**
   - All **84 remote file identifiers** on `dpl_BLJ4n1qWjcaMoayggYhWdEiDym4G` match the exact SHA-1 of the locally staged `.vercel/output` bytes (82 static assets + `release-manifest.json` + `.vercel/output/config.json`).
   - Live downloaded bodies from `https://carana-cbd-elearning-hnh5wj352-delta4ce20-5830s-projects.vercel.app` for `release-manifest.json`, `platform/learning-support.js`, `platform/learning-support.css`, `platform/exploration.js`, `course/app.js`, and `platform/platform.js` match their exact local SHA-256 hashes.
2. **Run 05 & Core Platform Preservation:**
   - All **88 protected files** and **21 media assets** (18 Lesson 1 MP3 recordings + 3 cinematic illustrations) match their exact Run 05 baseline (`7615804f7d19233586f6ee77b35b0d8cdcdb4b2f`) SHA-256 hashes.
   - Run 05 bounded exploration tracking (`platform/exploration.js`, `platform/learning-refinements.css`), Lesson 1–6 checkpoints (78 questions), 56 screens, 17 applied learning tools, Evidence-to-Decision Notebook (`platform/notebook.html`), and original CARANA practical workbenches (`module1.html`–`module6.html`, `CARANA_CBD_Group_Activity.html`) are verified intact.

---

## 3. Concise Owner Test Guide

Open the protected preview (`https://carana-cbd-elearning-hnh5wj352-delta4ce20-5830s-projects.vercel.app`) after Vercel sign-in and verify the following 6 workflows:

1. **Voice Selection & Privacy Consent:**
   - Open **Lesson 01** (`/course/#lesson-1`) or **Lesson 03** (`/platform/?course=cbd&lesson=cbd-3`).
   - Click **`🔊 Listen / Read screen`** below the screen title/lead, then expand **`Voice and reading options`**.
   - Confirm that **`English voice`** lists available English voices with on-device voices sorted first (e.g., `Samantha · en-US · on device`). If a non-local browser-service voice is selected, confirm that speech is blocked until the explicit consent checkbox (*"Allow this browser voice service; displayed text may leave this device"*) is checked.
2. **Playback Controls (Play, Pause, Resume, Restart, Stop):**
   - Click **`Read screen`**. Confirm the badge changes from `READY` to `READING 1/N`, the primary button label becomes **`Restart screen`**, and **`Pause`** and **`Stop`** become enabled.
   - Click **`Pause`** (badge updates to `PAUSED`, **`Resume`** enables), then click **`Resume`** to continue the passage.
   - Click **`Restart screen`** to restart from passage 1, then click **`Stop`** to cancel playback and reset the badge to `READY`.
3. **Reading Speed Selection (`0.75×` to `1.75×`):**
   - While reading is active, change **`Speed`** (e.g., from `1×` to `1.25×` or `1.5×`) and confirm the current passage restarts immediately at the new speed.
   - While reading is **paused**, change **`Speed`** and confirm playback remains paused (`"Paused · new speed applies to the next passage; Resume continues this passage"`) and applies the new rate on the next passage after resuming.
4. **Paragraph Highlighting & Passage Selection:**
   - Confirm that the currently spoken heading, paragraph, or bullet item is highlighted with a high-contrast teal outline (`[data-read-current="true"]`), scrolls gently into view if off-screen, and displays a live text snippet in the status bar.
   - Select any paragraph on the screen with your cursor/touch, open **`Voice and reading options`**, and click **`Read selected passage`** to read only that selection.
   - Advance to a **Knowledge Checkpoint** screen, open **`Voice and reading options`**, and verify that checkpoint questions/options are skipped by default and read aloud only when **`Include visible questions and answer choices`** is checked.
5. **Navigation Interruption:**
   - Start **`Read screen`**, then click **`Continue →`**, switch sections in the left rail, or open **`? Ask a question`**. Confirm that speech stops immediately and all paragraph highlights clear.
6. **Existing Lesson 1 Recordings & Audio Mutual Exclusion:**
   - On any **Lesson 01** screen, start **`Read screen`**, then click **`▶ Play explanation`** in the **Trainer narration** card. Confirm that `Read Screen` stops immediately (`"Trainer Narration is playing. Read Screen has stopped."`) while the recorded MP3 plays.
   - Conversely, while **Trainer narration** is playing, click **`Read screen`** and confirm the MP3 recording automatically pauses so two audio streams never conflict.

---

## 4. Desktop & Mobile Visual Evidence

- **Desktop (Chromium 1440×950) — Active Reading & Paragraph Highlight:**
  [preview-chromium-desktop-reading.png](preview-chromium-desktop-reading.png)
- **Mobile (WebKit 390×950) — Active Reading & Paragraph Highlight:**
  [preview-webkit-mobile-reading.png](preview-webkit-mobile-reading.png)
- **Desktop (Chromium 1440×950) — Unqualified AI Honesty State (Send Disabled):**
  [preview-chromium-desktop-ai-disabled.png](preview-chromium-desktop-ai-disabled.png)
- **Mobile (WebKit 390×950) — Unqualified AI Honesty State (Send Disabled):**
  [preview-webkit-mobile-ai-disabled.png](preview-webkit-mobile-ai-disabled.png)

---

## 5. Outstanding Owner & Hardware Checks

Automated Playwright (Chromium desktop, WebKit desktop, Mobile WebKit emulation) and 18 Axe WCAG 2.2 AA scans passed with zero violations, **but emulation does not substitute for physical hardware or human listening**. The following checks remain explicitly **NOT VERIFIED** pending owner inspection:

1. **Physical iPhone / iPad Safari & Released macOS `Safari.app`:** Verify real iOS/macOS WebKit voice list population, pause/resume responsiveness, and touch selection behavior on physical Apple hardware.
2. **Native Assistive Screen Readers (macOS/iOS VoiceOver, NVDA, JAWS):** Verify that polite live status announcements (`role="status"`, `aria-live="polite"`) and keyboard focus transitions do not collide with native screen-reader speech output.
3. **Human Audible Listening Acceptance:** Listen to actual spoken pacing, sentence chunking, and pronunciation of CBD/UNPOL terms (`PESTEL-S`, `UNSCR 2151`, `Logframe`, `MMA`, `CARANA`, `Galasi`) across available device voices.
