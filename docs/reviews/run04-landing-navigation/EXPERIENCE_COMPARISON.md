# Run 04 — comparison before implementation

Baseline: main `6637437f3be0cdab65e3623208550d598f62b034`, release `carana-cbd-v0.10.0-run03b`. Original source: annotated `carana-cbd-v0.8.1-source^{commit}` (`7e25176cf03a77e1bcc3ec8c3c0eb01dccd4bcc0`), including `course/app.js`, `course/index.html`, and its original style stack. Inspected source history and fresh browser renders before application edits. Evidence: `evidence/original.png`, `before-course.png`, `before-platform.png` (1440×1000, full page, Chromium, fallback fonts).

| Element | Original approved experience | Current Run 03B | Targeted correction |
|---|---|---|---|
| Identity | Navy gradient, mint editorial headline, interactive six-phase orbit | Original still exists; catalog is a simpler separate row-based page | Retain original source and style stack |
| Hero | Explore the CBD cycle; Start Lesson 01 | Primary action opens catalog | Restore original cycle action and direct L1 entry |
| Curriculum | Six phase cards, contextual questions, practical links | Five lessons added but competing catalog promoted | Integrate progress/resume into existing six cards |
| Return | Course home in the original shell | L1 and newer lesson returns go to catalog | All CBD returns go to `/course/#home` |
| Progress/recovery | L1 device-local progress | Run03B adds versioned drafts, import/export, summaries | Reuse existing recovery logic in subordinate home support section |
| Supplementary work | Practical library and learning-method sections | Notebook and demo on separate platform pages | Keep supplementary links below curriculum; keep independent routes |

Canonical learner home: `/course/`; `vercel.json` redirects `/` there, but the actual prebuilt release generator (`tools/release/prepare.cjs`) overrides this with `/platform/`. Correct both release paths to agree. Preserve `/course/#lesson-1`, `#activities`, `#course-map`, `#about`, all `/platform/?course=cbd&lesson=cbd-N` links, notebook/demo routes and all standalone workbench/module routes. Catalog-only CBD bookmarks should resolve to this same home without looping. MMA/COP readiness views remain accessible as institutional curriculum inventory, not another CBD homepage.

No new visual direction, instructional content, media, assessment rules or storage schemas are required. Owner approval is required on the corrected isolated preview before production changes.
