# Run05 verification

Baseline: main4b255cb27ba65bd3544366bc9f6a884e231d8e78, approved Run04. Reference screen was implemented and checked first; reference preview `https://carana-cbd-elearning-euadohy9g-delta4ce20-5830s-projects.vercel.app` identifies6a5f48c. Combined candidate identifiers are recorded in OWNER_ACCEPTANCE.md.

| Gate | Result and scope |
|---|---|
| Build/content | PASS: npm run build; npm run check:content;18locked recordings verified by existing builder |
| Available unit suite | PASS: npm test, including original activity/data/storage tests, L1smoke/build-integrity, expanded content/tools, recovery, handoff, Notebook and6new exploration tests. No configured lint command; changed JS syntax and git diff --check passed |
| Reference | PASS: actual1440/768/390px before/after captures, optional review/skip, persistence, reminder dismissal, keyboard, context visibility and final live breakpoint resize |
| Full L1 journeys | PASS:18screens,36checkpoint items, all18tracks played,3images decoded, conceptual controls,30-cell matrix, same-origin practical confirmation and resume in Chromium, desktop WebKit and touch mobile WebKit |
| Expanded journeys | PASS:38screens,42checkpoint items,17tools, conceptual controls, source/transcript views, checkpoint gates, revision history, restore, printable summaries, handoff/rollback, demo and Notebook isolation across Chromium, desktop/mobile WebKit |
| New progress/recovery browser checks | PASS: both engines; explanatory opening does not write legacy progress; review/skip/reload; no checkpoint unlock; optional backup field round trips; old-file restore; malformed auxiliary rejection before mutation; changed explanation resets only its auxiliary revision; draft preservation; unrelated storage domains unchanged; failed auxiliary writes retain exportable memory and show warnings including home |
| Screen inventory | PASS: all56screens at1440/768/390px,112diagram screenshots and reflow checks; selected/explored semantics verified through actual accessible snapshots |
| Accessibility | PASS within scope: zero Axe findings across56mobile screen states with WCAG2A/AA,2.1A/AA and2.2AA tags; additional L1home/checkpoint/matrix and expanded tool scans clean. Natural button names expose visible state text; matrix cells retain semantic names; scroll tables have keyboard focus |
| Narrow/RTL | PASS: all38expanded screens at320/768px in LTR/RTL; Notebook and demo reflow. English course content retained; no Arabic localization claim |
| Run04 navigation | PASS: original home, all6entry/return/resume paths, supplementary Notebook, backup and independent activity/gallery/demo/readiness URLs |
| Preservation | PASS:89protected files identical SHA-256;18MP3+3cinematic images, instructional data, original diagrams, workbenches, Notebook, recovery/handoff and institutional/routing assets preserved. Original home renderer and all18teaching visual/lab HTML structures are identical before runtime enhancement |
| Reduced motion/layout stability | PASS scoped behavior: reduced-motion node transitions0s; exploration-bar transition disabled. Fresh-context local Chromium lab: desktop initial CLS0.04232, mobile0 in3trials each, fonts blocked, no throttle,400ms observation after loaded content. These are synthetic local observations, not field CWV or a measured performance gain |

Logs: evidence/logs/. Full56-screen inventory and raw zero-finding scan: evidence/survey/. State migration details: PACKAGE_B_PROGRESS_SPECIFICATION.md. Preservation hashes: preservation.json.

## Findings corrected during implementation

- Small labels/counters needed stronger contrast; corrected actual failing selectors.
- The earlier explicit accessible-name override omitted visible node markers/state text. Replaced it with native button naming and exposed state badges; matrix context is retained in a visually hidden cell label. Native accessible snapshots and the complete Axe run now pass.
- Matrix hidden labels needed an in-cell containing block to preserve internal scrolling; fixed without changing the5×6structure.
- Some existing scroll-table wrappers lacked keyboard focus; added scoped regions.
- Tablet heading moved2px beyond the existing first-heading guard; tightened rhythm-tag spacing and retained the original under350px assertion.
- Browser fixtures must reload after installing saved positions. A mutable build directory also caused transient missing-script errors during an overlapping rebuild; final checks used a frozen artifact and a quiet local server. No application assertion or checkpoint criterion was removed to hide these failures. Initial scan findings are retained in evidence/logs/survey-initial-findings.json; revision history retains the reference refinements.

## Limits and approval boundary

Native VoiceOver/NVDA listening, physical iOS/Android operation and human learner comprehension are NOT VERIFIED. Automated scans do not certify full accessibility or professional competence. The source-based English learning content and formative assessment requirements remain unchanged. Engineering evidence supports owner review; owner visual acceptance is pending. No production alias, release tag, main branch or original learner data was changed by this run. Preview deployment hashes/route checks and local backup restore receipt are recorded separately.

## Deployed verification

Combined candidate `dpl_2CJJUz91K7sedJ9emDbMgK6kfrrE` is READY and identifies8ddb482. All80published asset bodies match their release-manifest SHA-256, including18recordings and3cinematic images. Root307to/course/, slashless lesson query, original L1adapter and activity bookmark are preserved. New progress/recovery and Run04navigation suites were repeated against the deployed URL in Chromium and mobile WebKit using a temporary authenticated review session. Only Vercel's separate injected review-toolbar script was blocked for these browser checks, consistent with the documented Run04hosting-toolbar limitation; application resources/assertions were not excluded. Access protection and both production aliases remain unchanged. Logs and screenshots are under evidence/preview-progress, preview-navigation and logs/.
