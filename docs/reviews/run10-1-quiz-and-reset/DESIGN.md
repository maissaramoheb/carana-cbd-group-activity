# CARANA Run 10.1 — Design Note

## Scope

1. **Checkpoint → Quiz terminology alignment** across English (`Quiz` / `quiz`), French (`Quiz` / `quiz`), and Arabic (`اختبار` / `الاختبار` / `اختبارات`) in Lesson 1 (`course/`), Lessons 2–6 (`platform/`), Activities Hub, Visual Gallery, Demo page, Notebook summary pulls, study support companion, tutor policy study-guide responses, and locale packs (`locales/fr-FR/`, `locales/ar/`).
   - Preserves all internal data schemas, progress storage keys, URL hashes, analytics event names (`checkpoint_completed`), tutor context mode (`mode: 'checkpoint'`), CSS class hooks (`.curriculum-checkpoints`), questions, options, answers, and scoring logic.
   - Institutional UNPOL oversight phrases in French/Arabic (`contrôle interne`, `contrôle démocratique`, `الرقابة الداخلية`) inside curriculum content and workbenches remain unchanged.
2. **Complete CBD Course Reset** (`platform/course-reset.js` UMD module + integration in `course/index.html`, `course/app.js`, `platform/index.html`, `platform/platform.js`, CSS, and EN/FR/AR i18n packs).
   - Triggered from Study Support (`#home-backup-controls` on `/course/#home` and catalog backup panel in `platform/platform.js`).
   - Native `<dialog id="cbd-reset-dialog">` opened via `showModal()` (no redundant `role="dialog"` or `aria-modal`, `autofocus` on `Cancel`, `overscroll-behavior: contain` on modal & backdrop without modifying `html`/`body` overflow/position).
   - Offers pre-reset Lesson 1 JSON and Lessons 2–6 JSON exports inside the dialog and explicitly discloses that neither export includes Practical Workbenches (`Modules 1–6`, `carana_cbd_lab_v1`) or Evidence-to-Decision Notebook (`carana_notebook_v1`), which export separately inside those tools.
   - Selectively deletes only `cbd-[1-6]` entries in `carana_learning_v1` / `carana_learning_v1_pre_restore` and `cbd-[1-6]/*` records in `carana_exploration_v1` so non-CBD curricula remain intact; deletes standalone CBD keys (`carana_cbd_course_v1*`, `carana_cbd_lab_v1*`, `carana_notebook_v1*`, `carana_cbd_group_activity_v1`); broadcasts reset notification cleanly for any open workbench tabs; preserves `carana_lang_v1`, unrelated local/session keys, AI config, and monitoring config.
   - Verifies post-operation storage state and accurately reports any key failure inside an accessible `role="alert"` box without closing on false success.
   - Clears in-memory Lesson 1 + platform state, returns to the top of `#home`, and displays a persistent dismissible `role="status"` confirmation banner.
