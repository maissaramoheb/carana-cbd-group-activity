# Run05 technical change log

Baseline4b255cb / approved Run04. Dedicated branch: `codex/carana-run05-learning-refinement`. No production change, main merge, dependency addition or environment-file edit.

- `platform/exploration.js`: independent bounded local history, semantic identifiers/content fingerprints, optional reminder, native accessible state labels, practice-attempt flag and validated scoped import/export. Does not write legacy progress/draft/Notebook/workbench stores.
- `platform/learning-refinements.css`: scoped study-view hierarchy, contrast, state treatments, normal-flow navigation, responsive context and reduced motion. Landing styles are unaffected.
- `course/app.js`: responsive section disclosure, truthful checkpoint title, optional history export/restore and guarded Continue integration. Approved home renderer is identical to Run04.
- `course/visual-journey.js`: explanatory history adapter; original scene/exercise/micro-case data and rendered teaching HTML remain identical. Classification remains separate.
- `course/lesson1-labs.js`: optional matrix cell history and named cells; no30-click reminder or completion award.
- `platform/platform.js`: expanded visual adapter, draft-save label, scoped backup envelope handling and focusable scroll-table regions. Existing learning-tool, recovery, handoff and Notebook engines remain unchanged.
- `course/index.html`, `platform/index.html`: load the shared enhancement assets. Release build staging already supports these locations; routing and deployment guards are unchanged.
- `package.json`: add exploration unit checks to the existing test command; dependencies and lockfile remain unchanged.
- Tests: new exploration unit/browser tests, full responsive/accessibility survey and explicit optional-reminder helper; existing journeys retain their checkpoint and negative-case assertions. Checkpoint success wording assertion follows the truthful label change.

New auxiliary history is additive. Existing envelopes stay version1 with optional exploration data. Import handling rejects malformed auxiliary data before applying course progress and preserves legacy-file compatibility. Full schema/limits and failure behavior: PACKAGE_B_PROGRESS_SPECIFICATION.md.
