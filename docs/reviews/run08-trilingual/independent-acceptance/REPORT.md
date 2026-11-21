# Run 08 — independent owner acceptance

Review date: 21 November 2026. Recovered source: `4541162be795df5cf3e123553200283787d0ff4a`, branch `run08/trilingual-learning-experience`. Protected Run 07 baseline: `199d0ad573e017c60f15dfb736a095dbc94ceb4e`.

## Decision

Release candidate for professional French/Arabic linguistic and UNPOL subject-matter review. **Production promotion is not approved.** The translations are adaptations, not institutionally validated translations. Keep `main`, release references, production domains and the existing AI service unchanged.

Preview details, reviewed commit and final publication verification are recorded in `PUBLICATION.json` after deployment. Open `/platform/review/run08/` on the protected preview for direct language/lesson/workbench links, the matrix, glossary, screenshots and six audio samples.

## Independently verified coverage

- 56 instructional screens: 18 in Lesson 1 and 38 across Lessons 2–6.
- 78 checkpoint questions: 36 in Lesson 1 and 42 across Lessons 2–6; canonical option values preserved.
- 17 expanded applied tools; English practical interaction regression retained.
- All six workbenches, 1,432 UI leaves, 619 workbench strings and 1,143 DOM translation entries pass the independent locale validator.
- Full browser sweep: **504 screen records, 702 question records, 54 actual workbench draft language roundtrips**, across English/French/Arabic × desktop Chromium/desktop WebKit/mobile WebKit. Zero page errors. Every screenshot/title, checkpoint option and whole-page reflow assertion passed. Synthetic initialized progress opens each screen independently; this is coverage, not a claim that a learner earned those completions.
- Existing platform browser regressions exercise decisions, tools, checkpoints, resume, revision notices, practical links and an unpublished MMA fixture. The fixture is not a released MMA course.
- Existing exploration regressions pass Chromium/mobile WebKit: separate history, skip/review, gating, import/export, malformed auxiliary input rejection, revised-content isolation, drafts/notebook/workbench preservation, reduced motion and denied storage.
- Original backup: checksum verification, complete Git bundle verification, independent clone/extraction, all **2,447 tracked files identical**, restored build and full restored regression suite pass.
- English preservation: all **1,214 English audio files identical** to Run 07, including 18 narration MP3s and 1,185 Read Aloud clips. Original group activity also identical.

See `evidence/full-browser/coverage.json`, `english-preservation.json`, `original-backup-restore.json` and `evidence/check-logs/` for exact evidence. The standard `npm test` release gate now includes the trilingual and race regressions. There is no configured lint command or added dependency.

## Confirmed repairs

1. **Rapid language-switch race.** A delayed French load overrode a later Arabic or English choice in both Chromium and WebKit (4/4 reproduced failures). A request revision now prevents stale commits, including a return to the active language. Superseded failures cannot contaminate the active fallback notice; one failed locale surface cannot be hidden by another successful surface. Four new focused unit tests and 4/4 browser rechecks pass. Original failing evidence is retained.
2. **Workbench contrast.** Primary actions, phase numbers, small white labels/emblems and a blue text shade failed unrestricted contrast checks. Reused the existing dark-blue/navy palette without changing layouts or instructional content. The small unavailable-narration label also now meets contrast requirements.
3. **French scrolling context panel.** Added keyboard focus to the overflowing supplementary panel. Final unrestricted Axe scan: **30 language/page combinations, zero WCAG A/AA violations** (Chromium; key course, expanded lesson, all workbenches and notebook; no exclusions). This does not constitute full WCAG certification.
4. **Mixed-language AI policy guidance.** French/Arabic checkpoint protection used translated introductions around English learner excerpts. It now uses the translated screen title/lead/points while preserving English source identities and avoiding checkpoint answers. Streamed teaching-example/evidence-limit labels follow the requested language. Unchanged existing assertions plus new French/Arabic excerpt checks pass.

The protected owner review page is an added acceptance surface, not a redesign of the approved learning experience. Only two JSON reports and six explicitly named samples are staged from documentation; the docs tree and private operational files are excluded by the build. Build-integrity checks retain original transcript/media drift and missing-file negative assertions and verify the new explicit asset allowlist.

5. **Deployed HTML aliases.** The deployed preview exposed clean URLs while legacy `.html` links returned 404. Added an isolated-preview internal rewrite for the known HTML routes, preserving query parameters and existing lesson/workbench links. Actual-deployment browser checks cover those links.

## AI, security and privacy

Six serial genuine local-model requests (two topics × three languages) completed with allowed source references via the isolated Run 08 gateway. Two further genuine French/Arabic requests and all three checkpoint-policy checks verify the correction. Unauthenticated tutor requests return 401. `live-ai*.json` contains synthetic review prompts and actual responses, not owner conversations. These are technical/source-protocol checks and reviewer observations, not a human linguistic or comprehensive teaching-quality qualification.

The owner preview uses a **separate loopback gateway on port 8788 and a free outbound encrypted tunnel**, with generated private review credentials. Idle model unload is disabled, shutdown explicitly avoids unloading the shared model, and the production supervisor/runtime/roster is not synchronized or restarted. Deployments use deployment-scoped proxy values; project environment variables and production credentials are not edited. Only the already installed text model is used, with serial inference rather than a load test. No paid service or model download was introduced.

The gateway remains available only while this Mac and the review process/tunnel are running. Generated access details are in the private local review-runtime file referenced by the handoff, never in browser assets or Git. Protection remains enabled; no public or production alias is assigned.

## Audio and browser limits

Existing muted audio-safety tests pass desktop Chromium, desktop WebKit and mobile WebKit: zero autoplay, stale async cancellation, failures, mutual exclusion and navigation/visibility stops. AI UI streaming/history/Listen checks pass Chromium/mobile WebKit with explicit test fixtures; those fixtures are not counted as genuine inference.

All six French/Arabic sample MP3s independently decode with valid durations (10.38–15.12 seconds). No listening-quality approval is claimed. French has the installed Kokoro/macOS options; Arabic uses the available macOS Modern Standard Arabic compact voice. No Arabic Kokoro voice is available. Translated trainer narration is not a complete pre-recorded library; text and transcripts remain available, language-specific Read Aloud is offered where supported, and missing narration is disclosed without silently playing English. System-voice samples are restricted owner-review comparisons; redistribution/licensing clearance remains separate.

The original full narration journey passes Chromium and desktop WebKit against a range-capable isolated server. The iPhone-emulated WebKit journey reached readyState 4, no media error, and `paused=false`, but its audio clock stayed at zero. The assertion has not been weakened. Physical iPhone/Safari audible playback remains **NOT VERIFIED**; the muted safety/interaction checks are separate and pass. The initial non-range-capable local review server was corrected before the desktop WebKit recheck.

## Actual protected deployment acceptance

Protected owner review: [Open Run 08 review](https://carana-cbd-elearning-rq45l3gtm-delta4ce20-5830s-projects.vercel.app/platform/review/run08/). Sign in using the existing owner Vercel account. AI additionally requires the generated private owner-review access code supplied in the local handoff; the code is not committed or embedded in the page.

Deployment `dpl_BJ83bUUTFqgh7pkADrW49MKddidz` is READY and its source metadata matches `31e0c32752a47e35dacc985bf5b41502d5ee290d`. Subsequent branch commits contain acceptance evidence only. The actual protected deployment passes **115 records**: authentication protection, the review page/matrix/media, all six lessons and workbenches in all three languages across Chromium/desktop WebKit/mobile WebKit, and three genuine AI requests through the learner interface (English/French/Arabic). Zero page errors. All **1,214 deployed English audio files** are available with verified size; all **18 original narration recordings** match their expected SHA-256 values. The compressed Read Aloud JSON manifest was independently downloaded and hashed because its HEAD response omitted Content-Length.

Both production aliases still resolve to Run 07 deployment `dpl_HWD2kUZ1SsaNjeUx7w7aH8Rp5irQ`; the original supervisor/gateway PIDs remain 25719/25745. No deployment aliases were assigned to the review candidate. `PUBLICATION.json` records the exact URL, deployment, source, checks, production hold and final backup location.

The final source archive/Git bundle and their independent restore receipt are stored at `../Backups/CARANA-CBD-E-Learning/2026-11-21_Run08-Independent-Acceptance/`. Read `verification-receipt.json` there for the final verified commit and restore result.

## Human acceptance still required

The supplied matrix contains 144 review items; French and Arabic linguistic/SME decisions remain pending, with no decisions prefilled by this review. The 52 glossary entries include reported classifications such as `unterm-established`; term-specific authoritative records were not supplied and those classifications are **not independently verified UNTERM provenance**.

Professional reviewers should check: institutional/capacity-development terminology, local/national ownership, results chains and assumptions, indicators/baselines, SMART wording, transition/handover, French idiom and Arabic fluency/RTL/mixed acronyms, source fidelity and narration pronunciation/naturalness. English source identity and instructional adaptation labels remain visible. No current UN mandate/policy claims were added or inferred from historical teaching references.

**Next bounded assignment:** owner-led bilingual linguistic and UNPOL instructional review using the protected review page and matrix, plus physical iPhone/Safari narration acceptance. Record corrections and approval decisions before considering production promotion. This report does not authorize a merge, production deployment or service cutover.

## Changed implementation files

| Files | Purpose |
| --- | --- |
| `platform/i18n.js` | Latest language choice wins; stable fallback reporting. |
| `css/design-system.css`, `course/experience.css`, `course/app.js` | Targeted contrast corrections and keyboard access to the scrolling context panel. |
| `tutor/gateway.cjs` | Language-correct protected guidance and teaching-example/evidence labels. |
| `platform/review/run08/`, `tools/build-course.mjs` | Owner review interface, compact screenshots and closed public-asset allowlist. |
| `tools/release/prepare-ai-preview.cjs` | Preview-only compatibility for existing HTML links, preserving language queries. |
| `package.json`, `course/tests/build-integrity.cjs`, `tests/i18n/` | Mandatory trilingual/race release checks, public-asset integrity and independent real-browser coverage. |
| `tools/review/` | Separate review gateway/tunnel and deployment-scoped preview configuration. |
| `docs/reviews/run08-trilingual/independent-acceptance/` | Independent evidence, publication receipt and acceptance report. |

No dependency was added. Original English lesson content, original group-activity bytes, persistent storage keys, answer semantics and production references were preserved.
