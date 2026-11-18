# Run 04 preservation control

Baseline: `6637437f3be0cdab65e3623208550d598f62b034` (Run 03B main). Original approved pre-expansion source: annotated tag `carana-cbd-v0.8.1-source`, resolved commit `7e25176cf03a77e1bcc3ec8c3c0eb01dccd4bcc0`. Tag annotation identifies the approved Lesson 1 source `337246f` plus the production-deployment guard, with the production artifact unchanged.

## Scope and result

**Final source integrity: PASS.** Reverified after the parent reported application edits complete, at `2026-11-18T13:35:42.911632+00:00`, against the Run 04 working tree (HEAD `6637437f3be0cdab65e3623208550d598f62b034`; implementation changes uncommitted at this check). All baseline and final hashes are retained in JSON. This does not substitute for browser checks of media playback, diagrams, practical tools, imports, or saved progress.

- All **18 original MP3 recordings** and **3 cinematic JPG illustrations** match SHA-256 across the original approved tag, Run 03B main, and the final Run 04 working tree.
- All **54 protected source files** match Run 03B main after implementation. No protected files are missing or changed. The complete filename and hash list is in [preservation.json](preservation.json).
- Protected files cover the independent workbench landing, group exercise, six module pages, their `css/` and `js/` assets, expanded curriculum JSON, original Lesson 1 data/experience/player/labs/illustration scripts, `visual-journey.js`, narration lock and all source media, plus learning-tools, progress-core, handoff, and Notebook logic.
- Expanded curriculum source inventory: **5 lessons, 38 screens, 17 applied learning tools, 42 checkpoint questions**. These counts are computed from the actual lesson JSON, not documentation.
- Navigation shells (`course/app.js`, `platform/platform.js`, `platform/index.html`, Notebook/demo navigation) may receive targeted changes; their behavior is verified separately. No source instructional or workbench change is needed to restore the landing.

## Original landing provenance

The original design is available in the repository; it need not be reconstructed. `course/index.html` loads `course/app.js` and the approved CSS layers. `renderHome()` builds the navy/teal/mint landing with editorial headline, six-phase interactive cycle, six phase cards, practical-library teaser, and learning-model section.

Relevant history:

| Commit | Role |
|---|---|
| `72bb0dd` | Premium landing and independent activities hub |
| `ee352c5` | Six-phase curriculum landing narrative and interactive hero |
| `5a1f2bd` | Removed annotated hero micro-labels |
| `337246f` | Approved pre-expansion Lesson 1 progress/accessibility/media hardening |
| `7e25176` | Deployment guard over approved source; tagged pre-expansion baseline |
| `56fe042` | Run 03B Stage 1 introduced canonical catalog return links and backup/recovery |
| `d29b5b0` | Run 03B Stage 2 retained the expanded learning capabilities |
| `6637437` | Verified Run 03B merge baseline |

At baseline, `/` already temporarily redirects to `/course/` in `vercel.json`. The problem is not absence of the old home: it is that the home brand, prominent hero action, activities return and Lesson 1 return direct learners toward `/platform/?course=cbd`. The existing original page remains the preservation source. The phase-card links added for Lessons 2–6 can be retained and integrated while the canonical home is corrected.

Compared with the original tag, `course/index.html`, `premium.css` and `typography-spacing.css` are unchanged at Run 03B. `course/app.js` has 146 changed lines, `curriculum-home.css` 6, and `style.css` 5 (Git diff stat). Most app changes add recovery, expanded lesson links and catalog-oriented navigation; those recovery capabilities must not be reverted wholesale.

## Compatibility hazards to avoid

- `carana_cbd_course_v1`, `carana_learning_v1`, `carana_cbd_lab_v1`, and `carana_notebook_v1` remain separate state owners. A unified homepage does not justify merging or resetting these schemas.
- Keep the independent original root workbench `index.html` in source: the deployed root redirect must not lead to deletion of the original standalone activity. Keep `/module1`–`/module6`, `.html` bookmarks and `/quick-exercise` available.
- Preserve `/course/#lesson-1`, `#home`, and `#activities` behavior and browser history. Redirecting every platform URL would break Lesson 2–6 deep links.
- `course/app.js` contains Run 03B import/restore and option-specific checkpoint feedback. Restoring the old file wholesale would remove approved enhancements.
- Narration filenames are content-hashed by the build. Compare the generated deployment bytes against their original source hashes, rather than requiring the old unhashed filename in production.
- The Notebook remains an explicitly labeled supplementary prototype and the institutional demo a separate presentation resource. Neither should replace the learner home.

## Final file-boundary check

`git diff --numstat` against the verified baseline produced no changes for the complete protected instructional/media/workbench file set. The curriculum JSON, Lesson 1 data and media, narration lock, conceptual illustration/lab scripts, original module pages and workbench `js/`/`css/`, expanded learning-tool engine, handoff engine, progress/recovery core and Notebook state engine remain byte-identical.

The permitted changes to `course/app.js` and `platform/platform.js` were also inspected: they adjust home presentation, navigation and wiring to existing progress/backup controls. Existing storage keys, versions and validators remain in place; the Lesson 1 import diagnostic wording changes only to identify the new location of the existing restore control. No instructional, media, original-workbench or schema data file changed. Runtime compatibility remains the responsibility of the separate regression report.

## Media hashes

All original, Run 03B, initial and final reference hashes match for every row below. Full values and paths are retained in JSON.

| Source asset | SHA-256 (original = Run 03B = final working tree) |
|---|---|
| `course/audio/en/lesson1/01-01.mp3` | `935822edface8d83de68362687ce53c5604a351b4d29160e35e77ed058a8223d` |
| `course/audio/en/lesson1/01-02.mp3` | `a31943b20ed785e070e11786b2fa0bcea31beaa179fb70705a03fa46a7205f9b` |
| `course/audio/en/lesson1/01-03.mp3` | `7b653c173ae2d1cc1bd4a0af1528f86b7310ad648c875d563391d2bd0725c7b2` |
| `course/audio/en/lesson1/02-01.mp3` | `238b8a18d023b4812d2e4f86f7cf55fae6af9f243c76148f5e69595bb905433a` |
| `course/audio/en/lesson1/02-02.mp3` | `f003f0a3d339b00367ac21f70bcaf9947b2eeb2c54fa81c09e127f6a59b9b2e6` |
| `course/audio/en/lesson1/02-03.mp3` | `ee6fdf2a01ac127f65b4d6107d23c70ec03a6bedd0070ad20abc41040a74941b` |
| `course/audio/en/lesson1/03-01.mp3` | `aaa6df0af003192785cbf5b5a8360f46b7f5cccde5f2bc0df96e74d8ab507a30` |
| `course/audio/en/lesson1/03-02.mp3` | `8fffae96261d44c455d6e502a23c24de852cdd95358f956b8123eb066c3107a0` |
| `course/audio/en/lesson1/03-03.mp3` | `1dc15b98a4c7e45b8e0c84f98c112d977f75638f5560febc7e7ea9a715662513` |
| `course/audio/en/lesson1/04-01.mp3` | `a5110a30926a49a628b7d5bc899dbb7dfcdf18f12c604bd991dee0856d37d9fa` |
| `course/audio/en/lesson1/04-02.mp3` | `4bf2229b4288e78979c464ea361b5aae2f1bbf59ea8c44d9bab33eacdf2f80fb` |
| `course/audio/en/lesson1/04-03.mp3` | `e8bca1d063b002bf23d217d012b1eac4fcf23b4b75aa57863195d01e128214c2` |
| `course/audio/en/lesson1/05-01.mp3` | `daf3c9b41800fcaec92d864aa8e29bd9a8bfb6fc547ed6f07ef76a1a1533cdf3` |
| `course/audio/en/lesson1/05-02.mp3` | `3dbe584cda9c5ffac8c51ffcee861b392de25b1f4e89376df4c88770a9da619b` |
| `course/audio/en/lesson1/05-03.mp3` | `529aef7af5db12daf042fe786ca947d2548718826c8e5ff502e6535ea5c2844f` |
| `course/audio/en/lesson1/06-01.mp3` | `d56c21bf2db9ab9d1350c009a1bf7ecbe630ef2262fb2579833b0bd9f86b2ec0` |
| `course/audio/en/lesson1/06-02.mp3` | `b7bb7cc116da3da2b6db0f63e529febe8731b39a5c55b6ecc4f40fedfbdee16f` |
| `course/audio/en/lesson1/06-03.mp3` | `552205452ca938f1879e84cddc6fdf392bc812a11ffcc89eb60c0687aa2c1a9c` |
| `course/illustrations/lesson1/01-01-diagnose-first.jpg` | `27cb6f71b9f871ab39cf4c7049d4c5cb991b2bd159cb99d221eda49a48a12073` |
| `course/illustrations/lesson1/03-03-counterpart-fatigue.jpg` | `5e2dd3cb867af47d67802cd9f9d90d1a713039735a4c18a486b89292fe59099b` |
| `course/illustrations/lesson1/04-02-triangulation.jpg` | `fba1209fcc9fc8c2d2e54690e32e361b8647f6be6db1776bc9defbb559a3cb94` |
