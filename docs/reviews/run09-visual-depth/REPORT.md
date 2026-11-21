# Run 09 — visual refinement candidate

Review date: 22 November 2026. Baseline: `cfe96ab3675d5466a417a5475c171cb8a76a59e0`, production deployment `dpl_3Qjj9vcUBXFymq6HKizgdL7GDNkM`, tag `carana-cbd-run08-production-2026-11-21`. Work is isolated on `run09/visual-depth-workbench-refinement`; `main` and production remain unchanged.

## Implemented

- Retained the landing page's palette, display typography, composition, phase positions, content and navigation. Added restrained CSS perspective, a recessed orbit, layered core/phase surfaces, contact shadows and edge highlights. Selected phases have clearer emphasis. There is no constant animation, parallax loop, WebGL, new illustration or app dependency.
- Matched the workbench header to the approved 92px desktop header, kept the CARANA mark, improved wordmark/supporting text and navigation, and used the landing's dark language selector. Its inactive labels now have readable contrast. Mobile uses a deliberate two-row header instead of a crowded single row.
- Refined hero proportions, readable side-by-side statistics, larger supporting text/captions/statuses, balanced 3/2/1-column cards and consistent touch-friendly footers. Kept the central message and all translated content. Original pastel workbench distinctions and navy/teal/mint identity remain.
- Removed the global disclaimer function, all startup/render hooks and its CSS. No hidden spacer or replacement warning was added. Existing contextual source attribution and accurate unavailable-narration indicators remain.

## Verification

Full `npm test`, content validation, locale validation and build pass. Existing platform browser regressions, exploration/import-export/Notebook/draft/recovery checks and all three audio-safety browser profiles pass. The unpublished MMA fixture remains a fixture, not a released course.

The new real-browser suite passes 12 language/profile combinations: EN/FR/AR × Chromium desktop, WebKit desktop, Chromium tablet and mobile WebKit. It exercises all six cycle phases through keyboard, selected content/links, native mobile phase taps, all six workbench popups and the original group exercise, saved drafts and partial Run 08 learning progress, language switches and resume. Banner absence is checked through home/hub/lesson/workbench navigation and language changes. There are zero page errors. Six unrestricted Axe WCAG A/AA scans (selected cycle and full hub × three languages) report zero violations; no exclusions are used. This is not a WCAG certification.

All six additional 320px language/page checks pass without page overflow or clipped headings/phase names. Reduced-motion checks establish zero decorative transitions/animations and unchanged decorative transforms. A narrow phase-name clipping issue found during refinement was fixed with the ≤360px single-column fallback; its evidence is recorded in CORRECTIONS.json.

Performance: five alternating local runs per page on the same machine/browser and font fallback. Median navigation load: landing Run 08 20.5ms / Run 09 19.6ms; workbench hub 17.7ms / 17.7ms. These diagnostic localhost samples are not production Core Web Vitals. New refinement CSS is about 2.9KB gzip. Comparison images load only on the owner-review page, not the learner pages.

Protected canonical paths — curricula, translations, original group activity, six workbenches, backend/AI, storage/progress/Notebook engines, original narration and neural audio — are unchanged from Run 08. The 56 screens, 78 questions and 17 applied tools are preserved. No answers, scoring, source material, migrations or user data were modified.

## Visual evidence and owner review

`platform/review/run09/` provides the working language/page links and eight before/after pairs: landing, default cycle, selected phase, workbench hero, six cards, Arabic desktop, Arabic mobile and French tablet. Images are actual browser captures at matched widths and font fallback; component images include full rendered bounds. Complete PNG/JPEG evidence is retained in the local Run 09 review package. Rendered desktop/tablet/mobile layouts were visually inspected in addition to automated checks. The three screenshot files mentioned in the brief were not present in the attachment; the actual approved production application was used as the reference.

The isolated owner preview and final deployment verification will be recorded in the complete local handoff report. The preview uses the existing authenticated production AI gateway through deployment-scoped settings only. Production environment values, service/tunnel configuration and credentials are not changed. No temporary AI service or model download is introduced.

## Changed files and remaining acceptance

- `course/run09-refinements.css`: scoped cycle and workbench presentation.
- `course/index.html`: load the scoped stylesheet.
- `course/app.js`: use the established dark language-selector treatment on the hub.
- `platform/i18n.js`, `css/i18n-rtl.css`: remove the obsolete banner renderer/hooks/styles.
- `tests/i18n/run09-browser.cjs`: independent behavioral/accessibility checks.
- `platform/review/run09/`: compact owner comparison gallery.
- `tools/review/deploy-run09-preview.cjs`: preview-only deployment using existing AI service.
- This review folder: design decisions and engineering evidence.

Engineering: local gates pass; actual protected-deployment checks are required before handoff. Visual approval: pending owner review. No blocking visual defect is known from current checks. Long French/Arabic labels wrap naturally; the narrow cycle is a one-column list at ≤360px. Physical-device audible narration quality remains the previously accepted Run 08 follow-up, separate from the passing muted safety checks.

Rollback: `backup/run08-before-run09-2026-11-21`, the Run 08 production tag/commit above, and the verified existing Run 08 production backup are preserved. This run does not authorize production promotion. Next step: owner compares the paired evidence and accepts or identifies final visual adjustments; only a subsequent approved release may merge/deploy to production.
