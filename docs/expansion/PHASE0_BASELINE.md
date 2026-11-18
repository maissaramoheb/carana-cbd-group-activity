# Run 01 technical baseline — 18 November 2026

The custom domain now maps to dpl_HyNydzU4a988dwDfP247Wg8ec9de, the previously reviewed static candidate. All 62 static file IDs in the Vercel API match SHA-1 of the local reproducible build at 337246f3b8731029ed3498fe33d0f19841bb687b. The 63rd file is the static routing configuration retained in the previous backup. The previous backup passes its SHA-256 manifest.

GitHub main is f59de58030e48f72222e49259be653409631ea7d, an ancestor of the approved candidate. No conflict resolution is required. Remote backup/main-before-codex-release-2026-11-17 already preserves it. Current source candidate is clean and its 65 workbench tests, 32 course assertions and negative build test pass.

Important deployment boundary: original carana-cbd-group-activity Vercel project follows main automatically; carana-cbd-elearning has no Git connection and automatic deployments disabled. A repository git.deploymentEnabled=false guard prevents source consolidation from changing the original project's public entrypoint. Both course and original workbenches remain in source. Releases use explicit inspected static previews; no production alias changes are part of this run.

Source boundaries: original root exercise files and js/css preserved byte-for-byte; course/ is approved Lesson 1; platform/ holds new catalog and generic lesson runtime; curricula/ holds source-mapped adaptations; docs/institutional/ holds review materials; tools/ owns validation and release packaging. Official PDFs are local references and must not enter website artifacts. Phase1 field validation remains deferred.
