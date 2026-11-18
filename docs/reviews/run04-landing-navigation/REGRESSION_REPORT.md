# Run 04 regression and preservation report

Baseline main: `6637437f3be0cdab65e3623208550d598f62b034`. Branch: `codex/carana-run04-landing-navigation`. Review date: 18 November 2026. Preview deployment and final backup evidence are recorded separately in OWNER_ACCEPTANCE.md and BACKUP_AND_ROLLBACK.md.

## Implemented

- Original `/course/` landing source and its approved stylesheet stack retained. Original hero cycle action restored; competing catalog action/navigation removed.
- Six original phase cards now show the existing Run03B progress descriptions and resume links. Accurate distinction remains: narrated Lesson 1; Lessons 2–6 review adaptations with transcripts and expert/media validation pending.
- All CBD lesson returns, Notebook home and presentation home lead to the original home. `/platform/` and catalog-only CBD bookmarks adapt to it; explicit Lesson 1 adapter opens the original lesson; L2–6 query routes remain intact. `?view=curricula` preserves MMA/COP institutional inventory independently.
- Root release redirect corrected in `tools/release/prepare.cjs`: the prebuilt generator previously sent `/` to `/platform/`, contrary to `vercel.json`.
- Existing import/export/study-summary logic reused in a subordinate study-support section. No schema, storage key, validation engine, checkpoint criterion or instructional content changed. Both L1 and L2–6 backups retain their respective formats. Notebook remains a separate supplementary prototype and storage domain.
- One keyboard correction: the existing horizontally scrolling cycle label strip can receive focus on narrow screens. No appearance change.

## Executed checks — PASS

| Check | Evidence and boundary |
|---|---|
| Build and content validation | `npm run build`, `npm run check:content`; all18 narration locks verified |
| Available automated suite | `npm test`: original data/storage/matrix regression; L1 smoke/build integrity; expanded content/tools; recovery; workbench handoff; Notebook core |
| L1 complete browser journeys | `course/tests/browser.cjs`: Chromium, desktop WebKit, mobile WebKit;18screens,36questions,18tracks actually played,3images decoded,30-cell matrix, conceptual controls, practical confirmation and resume |
| Expanded complete journeys | `tests/platform/browser.cjs`: Chromium, desktop WebKit, touch mobile WebKit;38screens,42questions,17tools, conceptual controls, practical links, all checkpoint gates, prior-version draft recovery/export/restore, summary, handoff/rollback, Notebook isolation, demo switching |
| Home and route integration | `tests/platform/navigation.cjs`: Chromium and mobile WebKit; root/course/platform bookmarks, all6entry/return/resume paths, incorrect backup rejection without mutation, JSON dry runs, Notebook persistence/export, independent module/group/gallery/demo/readiness routes |
| Narrow and tablet layouts | `tests/platform/layout.cjs`: all38expanded screens at320/768px in LTR/RTL; demo and Notebook reflow. English content only; no Arabic translation claimed |
| Home layouts and keyboard |320/390/768/1440px; no horizontal page overflow. Keyboard Enter entry, Escape summary dismissal/focus return, focusable scrolling cycle strip. Existing gallery keyboard controls exercised at320/768 |
| Accessibility scans | Home at4widths, L1 home/checkpoint/matrix and expanded firstscreens/tools: zero reported Axe violations in tested states. This is scoped automation, not full WCAG certification or native screen-reader acceptance |
| Explicit preservation | All54protected files unchanged; all18MP3+3cinematic image SHA-256 hashes identical to approved original and Run03B; see preservation.json |
| Source hygiene | `git diff --check`, changed JavaScript syntax checks; no configured lint command, no dependencies added, no secrets/environment files read or changed |

Full logs and screenshot states are under `evidence/`. Tests use synthetic local state; no real learner data was accessed or changed. Root behavior is separately checked on the deployed preview, because a local static server does not prove Vercel routing.

## Issues found during verification

The independent code review found the new home summary needed `learning-tools.js` before `progress-core.js` to retain illustrative priority totals. Fixed script order and added a real-browser assertion using saved weights. The narrow home Axe scan exposed the existing non-focusable scrolling cycle strip; added keyboard focusability and retained the scan. Initial navigation-harness failures were asynchronous file-read timing, bypassing the real L1 picker button, and counting the separate group exercise as a module card. Corrected the harness to exercise the actual UI; no assertions were suppressed. These failures were test-harness assumptions, except the separately documented summary dependency and scroll-focus fixes.

## Boundaries

No production deployment, alias reassignment, main merge, release-tag replacement, new media generation or instructional redesign. Native VoiceOver/NVDA listening and physical iOS/Android testing remain unverified. Local browser progress is origin-specific: preview starts with a separate record; production records remain on the production origin. Tested export/import is the deliberate transfer path.

## Deployed verification

Deployment `dpl_DmQvvbazGm5LGjCHF8s981GqSxvR` is READY and identifies implementation commit `0a1031f9c63ebf81aa232c558b54d951a60504e3`. All78deployed asset bodies match their release-manifest SHA-256, including18recordings and3images. Root returns307to`/course/`; slashless platform lesson query, original L1 adapter and activity hash adapter passed. The navigation suite was repeated against this deployed URL with a temporary authenticated review session. Initial unauthenticated requests reached Vercel Authentication; application behavior was evaluated only after establishing that session. Existing project access protection was retained. Both production aliases were inspected after preview deployment and remain on their prior deployment IDs.

The first deployed run completed all functional assertions in both engines, but the final mobile WebKit zero-page-errors assertion failed on Vercel's injected review toolbar. A separate trace attributes the failed fetches to `https://vercel.live/_next-live/feedback/feedback.js` (raw logs retained). The scoped deployed rerun blocks only that hosting review script via `CBD_TEST_DISABLE_HOST_TOOLBAR=1`; application assertions, routes, storage and error checks remain unchanged. No site code or project hosting settings were changed to hide the issue. The standard preview may still emit these toolbar errors in mobile WebKit; no related learner-flow failure was observed.

Scoped authenticated deployed rerun: **PASS** in Chromium and mobile WebKit, including all six entry/return/resume routes, recovery dry runs, Notebook isolation and home reflow. All 78 published asset SHA-256 hashes match the candidate manifest. Production domain mappings were rechecked and remain unchanged. The temporary review cookie is kept outside the repository and backup.

Changed application files: `course/app.js`, `course/index.html`, new `course/home-support.css`; `platform/platform.js`, `platform/index.html`, `platform/notebook.html`, `platform/demo.html`. Release/guard changes: `tools/release/prepare.cjs`, `tools/validate-content.cjs`. Verification: adapted `tests/platform/browser.cjs`, new `tests/platform/navigation.cjs`. All other new/changed files are evidence and documentation in this review folder.
