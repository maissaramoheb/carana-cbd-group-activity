# CARANA CBD E-Learning — Lesson 1 Pilot

**Status:** Independent development-branch pilot, pending live end-to-end browser acceptance and formal content/rights review.

## Governance and preservation

- **Source repository:** `maissaramoheb/carana-cbd-group-activity`
- **Development branch:** `course/lesson1-v0`
- **Production baseline:** `main`, unchanged.
- **New course entrypoint:** `/course/` on an isolated *preview* deployment. The development branch has a root redirect to `/course/` only on that branch.
- **Original workbench:** `/module1.html` and all original `js/modules/`, `js/storage/`, `js/data/`, `css/` assets are unchanged in this branch. The original 60-minute quick exercise is unchanged.
- The course is presently **a separate sub-application on a preview branch, not yet a separate repository or production Vercel project**. A new repository, dedicated production domain, and independent release pipeline are recommended before institutional release.
- Never merge changes to `main` or deploy to the original production domain without explicit approval.

## Official curricular source

Primary file: `JSTC_CBD_L01_LP_Situational Analysis_072023.pdf` (Job-Specific Training for UN Police 2021, file dated July 2023). It is not the separate UNPOL STM Lesson 1.

The learner course paraphrases and adapts **Lesson 1 lesson-plan content**, not the presentation slides. Each screen in `lesson1-data.js` has a `sourcePage` traceability field (printed page numbers). Do not expose Annex D (facilitator-only expected outcome) in learner screens.

## Learning journey

| Section | Instructional content | Page references | Assessment |
| --- | --- | --- | --- |
| 1. Start with the situation | Diagnose first; distinguish three analytical lenses; purpose of a baseline | 1–5, 9, 11, 19 | 6 MCQs; all correct |
| 2. Read the conflict environment | PESTEL-S; PIN/actor mapping and other conflict tools; legal context | 2, 6–8 | 6 MCQs; all correct |
| 3. Understand existing responses | Already-active actors; interests and needs; coordination and counterpart fatigue | 9–10 | 6 MCQs; all correct |
| 4. Diagnose the counterpart | CBD analysis; evidence triangulation; stakeholder interest and influence | 11–13 | 6 MCQs; all correct |
| 5. Use the CBD matrix | 5 institutional areas; 6 cross-cutting dimensions; issue classification | 14–18, 20–21 | 6 MCQs; all correct |
| 6. Synthesize and establish a baseline | Evidence-based SWOT; qualitative/quantitative baseline; transfer to practice | 18–21, Annexes A–E | 6 MCQs; all correct |

**Total:** 6 sections, 18 instructional screens and 36 multiple-choice questions. Question formats, prompts and answer options are newly authored and must undergo subject-matter review before official use. Incorrect answers generate a retry prompt without revealing the facilitator-only annex answer key. Short free-text responses are intentionally deferred: fully automated scoring of complex policing judgements is not reliable enough for strict progression gates.

## Preserved original exercise

After all 6 checkpoints pass, the course loads the **unmodified `../module1.html`** in an iframe and provides a full-window link. Learner content and practice application are co-located on the same origin for existing local state to work.

- Course progression state key: `carana_cbd_course_v1`.
- Original learning lab state key: `carana_cbd_lab_v1`.
- Existing Module 1 participant confirmation (the saved `module1.confirmed` flag) is used for *self-reported* course completion. This is not a machine-graded practical assessment and is not a United Nations certificate.
- The original official classroom activity includes syndicate presentation and group discussion; an individual self-paced online version cannot claim to replicate all instructor-led assessment components. Those will require instructional redesign and formal approval before institutional deployment.

## Technical choices

- Vanilla HTML/CSS/JavaScript, no new runtime dependencies. Reuses the original lab as is; no separate auth, database or cloud account required.
- Modular data: `course/lesson1-data.js`; reusable navigation and assessment shell: `course/app.js`; visual system: `course/style.css`.
- The browser persists course progress locally and exports a JSON record. It may be lost if browser data is cleared; another browser/device does not share it. This is **not** tamper-proof credentialing.
- Accessibility includes semantic headings, labeled quiz fieldsets, visible focus, skip link, responsive layouts and reduced motion. Full WCAG testing with assistive technologies is outstanding.
- Future audio/video can be described by optional lesson-data fields and mounted in a future media component; no media loading/hosting yet.

## Required release verification

- [x] Branch isolated from the original production branch.
- [x] Official Lesson 1 lesson plan located and page mapping performed.
- [x] Six sections × three screens × six quiz questions, all schema-valid.
- [x] Course JavaScript passes basic syntax validation.
- [x] Separate local course progress key.
- [x] Original Module 1 referenced without source modifications.
- [ ] End-to-end browser testing on the deployment preview (desktop/mobile, accessibility and keyboard).
- [ ] Validate quiz failure/retry/refresh/restore and verify per-section unlocks.
- [ ] Confirm original workbench can save, export and self-confirm inside same-origin iframe.
- [ ] Check rights to reproduce the UN scenario/curriculum and any commercial distribution.
- [ ] Expert instructional and legal/doctrinal review of the screens, answers and materials.
- [ ] Set up **independent** repository/project/domain with reproducible deployment/rollback process before any public release.
- [ ] Resolve future LMS interoperability (SCORM/xAPI), identity/assessment policy, internationalization and media requirements with a prospective institutional stakeholder.

## IP / institutional attribution

Software adaptation by Lt. Col. Maissara Selim. Original scenario and training material attributed to UN DPO/Police Division/ITS. This independently prepared pilot **must not be described as officially approved or endorsed by the United Nations**. Existing repository `docs/LICENSING_AND_CREDITS.md` explicitly limits commercial exploitation. Obtain appropriate permissions and confirm branding and licensing conditions before an offer, sale or redistribution.

## Developer review URLs

- Development source: `https://github.com/maissaramoheb/carana-cbd-group-activity/tree/course/lesson1-v0/course`
- Preview URLs are generated per branch commit by the existing Vercel Git integration, and must be verified before sharing as publicly accessible. Production is unchanged.


## v0.2 — Premium UX and Activities Hub (2026-11-17)

### Implemented interface changes

- New editorial landing experience: refined navigation, interactive course dashboard, illustrated mission analysis visual, distinctive lesson card, six-phase pathway and responsive activity teaser.
- Dedicated, bookmarkable Activities Hub at /course/#activities, showing all six original module workbenches and the original 60-minute group exercise.
- Quick access from course home (header, hero, dashboard strip, teaser), learner header and learner sidebar.
- A prominent, direct full-window Launch Lesson 1 Activity link after the sixth knowledge checkpoint.
- In the practical step, a primary direct activity link, optional collapsible embedded workbench and All activities shortcut.
- On the completed-lesson screen, Reopen Lesson 1 Activity and All activities controls.
- New premium.css overrides and extends the visual language, without changing the original materials. Responsive states, visible focus styles and reduced-motion handling are supported.
- Shareable view fragments: #activities, #home and #lesson-1.

### Governance

- The existing source module1.html–module6.html, CARANA_CBD_Group_Activity.html, their JavaScript, storage engine and scenario were not edited.
- Module activities can be opened freely for practice; direct activity access never marks course checkpoint completion.
- The six structured checkpoints are still required in the guided course before guided activity completion.
- Lesson 2–6 courses remain marked Coming later even though their original practical workbenches are available.
- No sign-in system, analytics tracking or UN endorsement/branding was added.
- The current branch remains a development pilot. A truly standalone repository, Vercel project and production domain are still required before independent production release.
- Legal and copyright permissions to distribute UN curriculum and scenario materials require verification before institutional or commercial use.

### v0.2 verification log

- [x] All six module workbench links and the 60-minute original quick exercise link included.
- [x] Quick access is reachable from the course home and learning interface.
- [x] End-of-lesson direct workbench link present.
- [x] Original workbench can be embedded without altering its files.
- [x] Activities hub does not bypass formal learning checkpoints.
- [x] Course progress uses a separate local-storage key.
- [x] JavaScript syntax and simulated end-to-end functional tests passed.
- [ ] Independent live-browser desktop/mobile visual acceptance and full accessibility audit.
- [ ] UN curriculum, legal rights, IP and institutional adoption reviews.
- [ ] Independent repository/project/domain before production release.


## v0.3 — Curriculum-wide landing experience (2026-11-17)

**Design decision:** CARANA CBD E-Learning is positioned as a six-phase CBD curriculum learning environment, not a Situational Analysis microsite. The v0.2 editorial navy, mint, teal, spacious typography, visual cards and professional application remain the foundation.

- Hero tells the complete Capacity Building and Development story, from situational analysis through transition and handover.
- Replaced the previous large Lesson 1-only illustration with a single interactive six-phase CBD process diagram. Each of six selectable phases displays a concise definition and a relevant action.
- Primary hero action now says **Explore the CBD cycle** and navigates to the entire six-phase pathway; the separate Resume/Start Lesson 01 action remains immediately available.
- All six curriculum phases now use **equal-sized cards**, with a concise learning purpose, guiding question, and original practical workbench link. Only the first card offers a self-paced lesson entry; five others explicitly indicate that their self-paced lessons remain in development.
- Dashboard explicitly separates six curriculum phases, one published self-paced lesson, and progress through Lesson 1 checkpoints; it does not imply total course completion metrics for unpublished lessons.
- Added a visual curriculum sequence ending in a loop to convey continuous improvement, plus a narrative about review and learning feeding back into situational analysis.
- Activities Hub navigation and every original workbench remain intact and independently accessible.
- Updated HTML title and meta description to identify the full curriculum rather than Lesson 1 alone.
- Implemented styles in the new course/curriculum-home.css, imported after the established stylesheet. No existing activity files were modified.
- Mobile presentation changes the circular desktop phase diagram into a readable, accessible two-column phase selector. Phase buttons report selection with aria-pressed, offer focus styles and respect reduced motion.
- Existing browser local storage remains separate from original activity records.

### Verification

- [x] Six selectable cycle phases correspond to six curriculum cards and all six original workbenches.
- [x] One active self-paced lesson vs five explicitly planned self-paced lessons.
- [x] Landing-page links, Activities Hub, lesson entry, six gated checkpoints and workbench confirmation regression checks.
- [x] 38 automated behavioural assertions passed on initial v0.3 code.
- [ ] Real-browser desktop/mobile visual review, assistive-technology acceptance, and human curricular copy review.
- [ ] Independent GitHub repository and local Mac OneDrive workspace migration postponed by the project owner.
