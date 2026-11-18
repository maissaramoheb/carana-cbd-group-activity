# Antigravity Project Context — CARANA E-Learning

**Prepared:** 18 November 2026
**Governance:** MAIDE-NATIVE-100 (`/Users/maissaraselim/Developer/maide-core/policies/STANDARDS.md`)
**Workspace Root:** `/Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD E Lap`
**Repository Root:** `/Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD E Lap/CARANA-CBD-E-Learning`
**Reviewed Commit:** `aff6ab0c003995a0b2382bb04c8083359ae81597` (`codex/carana-run03a-review` / `codex/cbd-instructional-run02`)

---

## 1. What CARANA E-Learning Is

**CARANA E-Learning** is an independent, self-paced digital learning and practical exercise platform adapted from United Nations Police (UNPOL) Job-Specific Training (JST) materials (2021/2023 editions). It is designed for adult police and peace-operations practitioners and trainers, combining:

1. **Self-paced instructional lessons** following the pedagogical loop **Discover → Explore → Understand → Decide → Practise → Reflect → Apply**.
2. **Interactive conceptual diagrams and applied learning tools** (parameter sensitivity explorers, structured drafting scaffolds, evidence classifiers, and risk matrices).
3. **Standalone practical workbenches (`module1.html`–`module6.html` and `CARANA_CBD_Group_Activity.html`)** built around the fictional CARANA / Galasi scenario for individual preparation and facilitated syndicate exercises.

The long-term platform architecture supports three UNPOL Job-Specific Training curricula:
- **CBD — Capacity-Building and Development** (Lesson 1 implemented; Lessons 2–6 developed as Run 02 review candidates; all 6 practical workbenches + 60-minute group exercise live).
- **MMA — Monitoring, Mentoring and Advising** (official 2023 sources inventoried and hashed; conversion-readiness entry only; separate `maissaramoheb/mma-activity-lab` repository inspected).
- **COP — Community-Oriented Policing** (official 2023 sources inventoried and hashed; conversion-readiness entry only; no digital course or separate COP workbench claimed).

**Explicit Boundary:** The platform is an independent instructional adaptation. It does not claim UN endorsement, formal certification, observed workplace competence, WCAG 2.2 AA certification from sampled automated checks alone, or empirical learning-effectiveness validation (the Phase 1 field pilot remains deliberately deferred).

---

## 2. What Has Been Developed Across Runs

| Phase / Run | Git Commit / Branch | Scope Completed | Verification Status |
|---|---|---|---|
| **Original CARANA CBD Lab** | `f59de58` (`backup/main-before-codex-release-2026-11-17`) | Portal hub (`index.html`), 6 phase workbenches (`module1.html`–`module6.html`), 60-minute group activity (`CARANA_CBD_Group_Activity.html`), local storage manager (`js/storage/lab-storage.js` with schema v1.0.0, JSON export/import, multi-tab merge, and dossier print). | 65 automated regression, curriculum, security, and state tests passing (`tests/run-tests.js`). |
| **Lesson 1 Comprehensive Enhancement** | `337246f` (`codex/cbd-comprehensive-enhancement`) / `7e25176` (`main`, tag `carana-cbd-v0.8.1-source`) | 18 instructional screens across 6 sections (`course/`), 18 locked English AI narration tracks (`tools/narration-lock.json`), 3 editorial cinematic illustrations, 18 interactive visual explorations (`course/visual-journey.js` + `course/lesson1-labs.js` including the 30-cell 5×6 CBD matrix), 18 formative decisions, 36 checkpoint questions (6 per section, 6/6 mastery with unlimited retries), and same-origin Module 1 completion handoff. | 32 smoke assertions (`course/tests/v05-smoke.cjs`), build-integrity lock (`course/tests/build-integrity.cjs`), 3 browser profiles (Chromium, desktop WebKit, mobile WebKit), 3 sampled Axe scans (0 violations). |
| **Run 01 — Multi-Curriculum Platform & CBD Expansion** | `44e9860` (`codex/carana-expansion-run01`) | Shared `platform/` catalog and data-driven renderer, source-mapped review lessons for CBD Lessons 2–6, verified 24-PDF source inventory (`docs/expansion/sources.json`), institutional readiness package (`docs/institutional/`), and isolated preview deployment. | Verified local backup (`2026-11-18_102432-Run01`) and browser verification. |
| **Run 02 — Instructional Depth & Applied Tools (Lessons 2–6)** | `c834f2b` (Lesson 2 benchmark) → `aff6ab0` (`codex/cbd-instructional-run02`) | Expanded Lessons 2–6 from 30 to **38 screens** (`8 / 10 / 7 / 6 / 7` screens across 14 sections), added **17 applied learning tools** (`platform/learning-tools.js`: 9 builders, 6 classifiers, 1 priority sensitivity lab, 1 3×3 risk matrix), **5 worked comparisons**, **42 revised checkpoint questions** with option-specific feedback, **38 trainer transcripts**, and **14 cinematic artwork specifications** (specification-only, unproduced). | All Node suites + Chromium, desktop WebKit, mobile WebKit full journeys, 22 sampled Axe scans (0 violations), 320px/768px LTR/RTL layout sweep, and verified restore from `2026-11-18_110834-Run02`. |

---

## 3. Approved Design Identity

The owner has approved and requires preservation of the visual and pedagogical identity:
- **Color Palette:** Deep navy (`#102d46` / `#10243b`), editorial teal (`#146981`), soft mint (`#def4e8`), warm paper surfaces (`#f5f9fa`), and high-contrast focus indicators (`3px solid #b66b11`).
- **Typography:** Editorial serif headings (`Source Serif 4`, Georgia, serif) paired with clean sans-serif body and UI controls (`DM Sans`, system-ui, sans-serif).
- **Visual Teaching:** Hybrid pairing of selective editorial cinematic scene-setting (~2–3 scenes per lesson where context matters) with interactive conceptual diagrams (diagnostic paths, PESTEL-S wheel, conflict tree, triangulation triangle, 5×6 CBD matrix, chains, comparisons, and cycles).
- **Pedagogical Principle:** *Preserve what is excellent. Enhance what is good. Correct what is weak. Add only what creates genuine educational or operational value.* No wholesale redesign.

---

## 4. Current Application Architecture

The repository builds a static-only distribution (`dist/` and `.vercel/output/static`) with zero external runtime framework dependencies:

1. **Multi-Curriculum Platform Shell (`platform/`):**
   - `platform/index.html`, `platform/catalog.js`, `platform/platform.js`, `platform/learning-tools.js`, `platform/platform.css`.
   - Reads `window.CARANA_CATALOG` (`cbd`, `mma`, `cop`) and fetches JSON lesson definitions from `curricula/cbd/lessons-2-3.json` and `curricula/cbd/lessons-4-6.json`.
   - Stores browser-local progress and tool drafts under `localStorage['carana_learning_v1']`.
   - Includes `platform/demo.html` for stakeholder demonstrations.
2. **Lesson 1 Standalone Course Shell (`course/`):**
   - `course/index.html`, `course/app.js`, `course/lesson1-data.js`, `course/lesson1-experience.js`, `course/lesson1-player.js`, `course/lesson1-labs.js`, `course/lesson1-illustrations.js`, `course/visual-journey.js`, `course/visual-gallery.html`, `course/voice-audition.html`.
   - Stores Lesson 1 progress under `localStorage['carana_cbd_course_v1']` and reads Module 1 confirmation from `localStorage['carana_cbd_lab_v1']`.
3. **Original CARANA Practical Workbenches (`/` root):**
   - `index.html` (original Learning Lab portal hub), `module1.html`–`module6.html`, `CARANA_CBD_Group_Activity.html`, `js/storage/lab-storage.js`, `js/modules/module1.js`–`module6.js`, `js/data/carana-scenario.js`, `js/data/curriculum-glossary.js`, `css/design-system.css`.
   - Stores workbench state under `localStorage['carana_cbd_lab_v1']` (and quick exercise under its own separate key).
4. **Build & Release Tooling (`tools/` & `tests/`):**
   - `tools/validate-content.cjs`: Validates catalog, Lesson 2–6 JSON schema, transcripts, visual nodes, decisions, labs, quizzes, and artwork specifications.
   - `tools/build-course.mjs`: Verifies all 18 Lesson 1 audio SHA-256 hashes and script hashes against `tools/narration-lock.json`, copies public assets to `dist/`, and writes fingerprinted `dist/course/lesson1-audio-manifest.js`.
   - `tools/release/prepare.cjs`: Runs validation, unit tests, and build from a clean commit, stages `.vercel/output/static` and `.vercel/output/config.json`, blocks non-public files (`.env`, `.git`, `docs`, `tests`, `tools`, `.pdf`), and generates `release-manifest.json` (70 asset SHA-256 hashes; 72 total uploaded files).

---

## 5. Available Lesson Materials & Official Sources

 Twenty-four official July/August 2023 UNPOL JST reference PDFs are hashed in `docs/expansion/sources.json` and stored privately in `Backups/CARANA-CBD-E-Learning/2026-11-18_110834-Run02/References/` (`CBD/`, `MMA/`, `COP/`). They are excluded from public builds because they contain facilitator-only expected outcomes:
- **CBD 0:** Introduction (`JSTC_CBD_L00_LP_Introduction_072023.pdf`, 21 pp.)
- **CBD 1:** Situational Analysis (`JSTC_CBD_L01_LP_Situational Analysis_072023.pdf`, 48 pp.; protected expected outcomes pp. 23–33 & Annex D p. 47)
- **CBD 2:** Objective Setting, Prioritisation and Performance Framework (`JSTC_CBD_L02_LP_Objective Setting_072023.pdf`, 32 pp.; protected expected matrix p. 24)
- **CBD 3:** Planning Activities (`JSTC_CBD_L03_LP_Planning_072023.pdf`, 40 pp.; protected expected outcomes pp. 23–29)
- **CBD 4:** Implementation (`JSTC_CBD_L04_LP_Implementation_072023.pdf`, 16 pp.; protected expected example p. 13)
- **CBD 5:** Evaluation and Adjustment (`JSTC_CBD_L05_LP_Evaluation and Adjustment_072023.pdf`, 17 pp.; protected expected outcomes p. 11)
- **CBD 6:** Transition (`JSTC_CBD_L06_LP_Transition_072023.pdf`, 18 pp.; protected expected outcome p. 14)

---

## 6. Existing Media vs. Unproduced Specifications

- **Produced & Verified Media (Lesson 1):**
  - **18 English AI-generated narration MP3s** (`course/audio/en/lesson1/01-01.mp3` through `06-03.mp3`, durations 35.5s–40.9s), cryptographically locked to their exact scripts in `tools/narration-lock.json`.
  - **3 Editorial Cinematic Illustrations** (`course/illustrations/lesson1/01-01-diagnose-first.jpg`, `03-03-counterpart-fatigue.jpg`, `04-02-triangulation.jpg`, 1672×941).
- **Unproduced Media Specifications (Lessons 2–6):**
  - **38 Trainer Narration Scripts** authored in `curricula/cbd/lessons-2-3.json` and `lessons-4-6.json` (accessible via `<details><summary>Read the trainer explanation</summary>`). No audio files have been generated or commissioned.
  - **14 Cinematic Illustration Specifications** across Lessons 2–6 (`3 / 3 / 3 / 2 / 3` scenes) with `status: "specification-only"`. No images have been generated or purchased.

---

## 7. Source-of-Truth Hierarchy

1. **Authoritative Curriculum Scope & Boundaries:** Hash-verified July 2023 UNPOL JST lesson plans (`docs/expansion/sources.json` and private backup `References/`), strictly excluding facilitator-only answer keys from learner-facing surfaces.
2. **Active Review Branch & Commit:** Local and remote branch `codex/cbd-instructional-run02` (and local review branch `codex/carana-run03a-review`) at commit `aff6ab0c003995a0b2382bb04c8083359ae81597`.
3. **Isolated Run 02 Preview Deployment:** `dpl_4RYabHEGcpVQAdcjrLPsAXMWrMQT` (`https://carana-cbd-elearning-a3ga1rbpn-delta4ce20-5830s-projects.vercel.app/platform/?course=cbd`), matching the 72-file artifact in `Backups/CARANA-CBD-E-Learning/2026-11-18_110834-Run02/preview-artifact.tar.gz`.
4. **Consolidated Main Branch:** `main` at `7e25176cf03a77e1bcc3ec8c3c0eb01dccd4bcc0` (tag `carana-cbd-v0.8.1-source`), which includes the `vercel.json` `git.deploymentEnabled: false` guard.
5. **Protected Production Aliases:**
   - `cbd.maissara.tech` → `dpl_HyNydzU4a988dwDfP247Wg8ec9de` (approved Lesson 1).
   - `e-learning.maissara.tech` → `dpl_C7p1i3UMcSk9e4Yp6H3WAC1fkYg7`.

---

## 8. Outstanding Limitations & Protected Boundaries (What Must Not Be Changed)

- **Protected Assets (Byte-Identical Guard in `course/tests/build-integrity.cjs`):**
  - Original practical workbenches (`index.html`, `CARANA_CBD_Group_Activity.html`, `module1.html`–`module6.html`, `css/design-system.css`, `js/**`).
  - Approved Lesson 1 content, audio, and illustrations (`course/lesson1-data.js`, `course/lesson1-experience.js`, `course/lesson1-illustrations.js`, `course/lesson1-labs.js`, `course/lesson1-player.js`, `course/visual-journey.js`, `course/audio/en/lesson1/*.mp3`, `course/illustrations/lesson1/*.jpg`).
  - Institutional concept note and budget model (`docs/institutional/CONCEPT_NOTE.md`, `docs/institutional/budget-model.json`, `docs/institutional/budget-scenarios.csv`).
- **Non-Negotiable Operational Limits for Run 03A:**
  - Do not modify application code, lesson JSON, assessments, or CSS during Run 03A discovery.
  - Do not generate paid audio or images or call external AI APIs.
  - Do not touch production deployments or domain aliases.
  - Do not overwrite or delete existing backups (`Backups/CARANA-CBD-E-Learning/2026-11-17_185535`, `2026-11-18_102432-Run01`, `2026-11-18_110834-Run02`).
  - Do not introduce user accounts, authentication, telemetry, or LMS/SCORM dependencies.
  - Do not initiate the deferred Phase 1 field pilot.
