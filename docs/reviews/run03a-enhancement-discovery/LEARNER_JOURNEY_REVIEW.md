# Learner Journey Review — CARANA E-Learning (Run 03A)

**Reviewed Target:** `aff6ab0c003995a0b2382bb04c8083359ae81597`
**Scope:** End-to-end learner experience across `/platform/`, `/course/`, `module1.html`–`module6.html`, and `/platform/demo.html` on desktop (`1440×950`, `1366×900`), tablet (`768×900`), and mobile (`390×900`, `320×640`).

---

## 1. Entry Experience & Three-Hub Topology (`E01`, `E04`, `E31`)

A learner or trainer can currently encounter three distinct entry surfaces within the same deployment:

| Surface | URL / Path | Intended Role | Observed Learner Experience |
|---|---|---|---|
| **1. Multi-Curriculum Platform Catalog** | `/platform/` and `/platform/?course=cbd` | Primary Run 01/02 entry point (`prepare.cjs` redirects `/` → `/platform/` on preview) | Clean 3-curriculum card grid (`CBD`, `MMA`, `COP`). However, on cold load, `#app` starts as a `27px` `<p>Loading learning catalog…</p>` and expands to `771px` when JS executes, causing a **lab CLS of `0.378`** (`VISUAL_EVIDENCE/probes/layout-shift-attribution.json`, `E31`). |
| **2. Legacy Lesson 1 Course Landing & Activities Hub** | `/course/` (`#home`, `#lesson-1`, `#activities`) | Production root on `cbd.maissara.tech`; linked from `/platform/?course=cbd` (`Open Lesson 1`) and header (`Practice library`) | High-craft 6-phase CBD orbit diagram (`course/app.js` lines 164–253). However, it hardcodes `01/06 SELF-PACED LESSONS LIVE` and labels Phases 02–06 as `LESSON IN DEVELOPMENT` / `Self-paced lesson coming later` (`probe-old-home.jpg`), with **zero links back to `/platform/`** (`E01`). |
| **3. Original CARANA Workbench Portal Hub** | `/index.html` (`module1.html`–`module6.html`, `CARANA_CBD_Group_Activity.html`) | Standalone 6-module practical workbench hub | Fully functional and faithful to the CARANA scenario, but its top navigation and module links operate independently of `/platform/`. |

### Specific Journey Friction at Entry & Return
1. **The Catalog → Lesson 1 → Course Home Trap (`E01`):**
   - A learner opens `/platform/?course=cbd`, sees all six lessons listed, and clicks **Open Lesson 1** (`../course/#lesson-1`).
   - Inside Lesson 1, the top-left button reads `← COURSE HOME` (`#back-home`, `course/app.js` line 276).
   - Clicking `← COURSE HOME` invokes `goHome()` (`course/app.js` line 75), which renders `/course/#home` instead of returning to `/platform/?course=cbd`. The learner is suddenly told that Lessons 2–6 are *"coming later"* and has no link to return to the platform catalog where Lessons 2–6 actually live.
2. **The Practice Library Return Trap (`E01`):**
   - In `/platform/index.html` (line 3), clicking **Practice library** navigates to `../course/#activities`.
   - On `/course/#activities`, clicking `Course home` (`#activities-home`) or `Back to course home` (`#hub-home`) also routes to `/course/#home` rather than `/platform/`.
3. **Imprecise Catalog Resume & Progress Status (`E04`):**
   - On `/platform/?course=cbd` (`platform/platform.js` line 53), Lesson 1's card always displays the static string `"Implemented · institutional validation pending"` and button `"Open Lesson 1"`, ignoring whether the learner has started or completed Lesson 1 in `localStorage['carana_cbd_course_v1']`.
   - For Lessons 2–6, as soon as a learner opens a lesson (creating `store.lessons[l.id]` with `completed: []`), the catalog card switches to `"0 checkpoints recorded · ..."` and button `"Resume / review lesson"`, without indicating which section/screen they reached or the total checkpoint denominator (e.g., `0 / 3`).

---

## 2. Orientation & Mobile Navigation (`E05`, `E25`)

- **Desktop Orientation:** Both shells orient desktop learners well. Lesson 1 uses a 3-column layout (`side-rail` + `learning-content` + `context-panel`); Lessons 2–6 use a 2-column layout (`245px` sticky `.rail.panel` + `minmax(0,1fr)` `.screen`).
- **Mobile & Tablet Lead-Distance Friction (`E05`):**
  - In `platform/platform.css` (line 4, `@media(max-width:900px)`), `.workspace` collapses to a single column (`grid-template-columns:1fr`) with `<aside class="rail panel">` rendered **above** `<article class="screen">`.
  - Consequently, on every single screen transition in Lessons 2–6 on mobile (`390px`) or tablet (`768px`), `focus()` scrolls to `top: 0` (`platform/platform.js` line 42), placing the learner at the top of the header and rail rather than the screen's `<h1>`.
  - Measured in `targeted-probes.json` (`probe-mobile-390.jpg`, `probe-mobile-768.jpg`), the vertical distance to `<h1>` on Screen `03-10` is **`785px` at `390px` width** and **`716px` at `768px` width**—nearly a full viewport of repeated navigation chrome before the first line of teaching copy.
- **Repetitive Version-Change Banner (`E25`):**
  - When `state.previousProgress.length > 0`, `platform/platform.js` (line 65) prepends `<p class="version-note">This lesson has been revised...</p>` above **every screen and checkpoint** indefinitely, without stating which screens changed or that prior drafts were not carried over.

---

## 3. Screen Progression, Content Density & Rhythm (`E10`, `E20`)

Using `review-runner.cjs`, we measured all 56 screens across desktop Chromium (`1440×950`), desktop WebKit, and mobile WebKit (`390×844`):

| Metric | Lesson 1 (`course/`, 18 screens) | Lessons 2–6 (`platform/`, 38 screens) | Assessment |
|---|---|---|---|
| **Words per screen (median / min–max)** | `224` words (`176–355`) | `270–282` words (`184–359`) | Well-bounded reading load across all lessons. |
| **Desktop main height (median / ratio)** | `1,737px` (`1.83×` viewport) | `1,880px` (`1.98×` viewport) | Comfortable 1.5–2 viewport scroll on desktop. |
| **Mobile main height (median / max ratio)** | `2,055px` (`3.09×` / max `4.76×`) | `2,641px` (`3.13×` / max `4.31×`) | High vertical stacking on mobile when a screen includes concept nodes + points + transcript + multi-field builder + decision + takeaway. |
| **Horizontal overflow (`scrollWidth > innerWidth + 2`)** | `0 / 54` profile screens | `0 / 114` profile screens | 100% clean responsive containment. |

### Screen-Level Rhythm & Redundancy Findings (`E10`, `E20`)
1. **Identical 8-Block Vertical Template Across All 38 Expanded Screens (`E10`):**
   - In `platform/platform.js` (lines 68–77), every screen renders in the exact same order:
     1. Status/version banner + progress bar
     2. `<h1>` title + `.lead` paragraph (plus `<details open>Learning orientation</details>` on screen `0` of section `0`)
     3. `.visual` (`Explore the relationship` + `<h2>` + node buttons + `#concept-feedback`)
     4. Optional `.worked-contrast` (`02-07`, `03-03`, `03-09`, `04-07`, `05-06`)
     5. `<ul class="points">` (3–5 bullet points)
     6. `<details><summary>Read the trainer explanation</summary>` (transcript)
     7. Optional `<section class="applied-lab">` (on 17 of 38 screens)
     8. `<section class="decision">` (`Decide · invented teaching example` + 3 option buttons)
     9. `<div class="banner"><strong>Carry this forward</strong>` + raw source footer + Back/Continue buttons.
2. **Duplicate `<h1>` and `.visual <h2>` Headings on 37 of 38 Screens (`E10`):**
   - In `curricula/cbd/lessons-2-3.json` and `lessons-4-6.json`, 37 out of 38 screens set `screen.visual.title` to the exact same string as `screen.title` (only `03-04` differs: `h1` is *"Census and vetting require a distinct mandate"* while `visual.title` is *"Distinguish the task from the authority to undertake it"*). Learners read the same heading twice within 150 pixels (`chromium-cbd-2.png`, `probe-mobile-390.jpg`).
3. **Dual Interactive Tasks on 17 Screens Without Task Hierarchy (`E10`):**
   - On the 17 screens that contain an `.applied-lab` (e.g., `02-04` SMART builder, `03-10` Logframe row builder, `04-02` Message repair), the learner is asked to complete a 3-to-5-field construction task **and** immediately below it answer a separate 3-option `.decision` MCQ on the same screen, after already clicking through 3–4 `.visual` reveal buttons above.
4. **Raw Source Filenames in Study Footers (`E20`):**
   - Every screen in Lessons 2–6 ends with `<p class="status">Source: JSTC_CBD_L03_LP_Planning_072023.pdf · printed pages 5–7.</p>`. While excellent for audit traceability, raw underscore-delimited PDF filenames look like developer debug strings during study; a human-readable citation (`Source: UNPOL CBD Lesson 3 (July 2023), pp. 5–7` with an expandable provenance detail) would be cleaner.

---

## 4. Checkpoints, Persistence, Recovery & Completion (`E02`, `E03`, `E07`, `E09`, `E19`)

1. **Checkpoint Progression & Retry Friction:**
   - Lesson 1 requires `6/6` correct per section across 6 sections (36 items); Lessons 2–6 require `3/3` correct per section across 14 sections (42 items).
   - Both shells preserve in-memory radio selections (`attempts` Map) when a learner clicks `Review learning screens` within the same tab, and `platform/platform.js` restores `view: 'quiz'` across page reloads.
   - However, because all items use 3- or 4-option radio buttons with immediate option-specific feedback and unlimited retries, a learner can converge on the passing combination in 2–3 clicks without articulating *why* the chosen option is stronger (`E16`).
2. **Optional Applied Tools Are Invisible in Completion State (`E19`):**
   - A learner can leave all 9 drafting scaffolds blank, skip all 6 classification tools, pass the 3-question section checkpoints, and reach the final completion screen (`Carry your work into practice`) with no indication that their practice drafts are still empty (`E19`).
3. **Draft Loss on Version Upgrade (`E02`) & Unrecoverable Exports (`E03`, `E07`):**
   - As verified in `CODEX_HANDOVER_RECOVERY.md`, bumping `lesson.version` wipes `state.drafts`, and exported JSON files cannot be re-imported into `/platform/` or `/course/` or printed as a readable study sheet.
4. **Abrupt Transition to Original Workbenches (`E09`):**
   - At the end of Lessons 2–6 (screens `02-06`, `03-07`, `04-06`, `05-05`, `06-06` and final quiz pass screens), clicking `Open original Lesson X activity ↗` opens `module2.html`–`module6.html` in a new tab. None of the drafts the learner just wrote in `carana_learning_v1` are displayed alongside or offered for transfer into the workbench (`carana_cbd_lab_v1`), forcing manual copy-pasting across tabs.
