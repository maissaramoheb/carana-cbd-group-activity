# Run 04 — owner acceptance & production release status

**Status: APPROVED and PROMOTED to production (`https://cbd.maissara.tech/`).**

The owner approved the corrected Run 04 preview (`dpl_DmQvvbazGm5LGjCHF8s981GqSxvR`), which has now been promoted directly to production and consolidated into GitHub `main`.

- Production URL: `https://cbd.maissara.tech/` (default project alias `https://carana-cbd-elearning.vercel.app` aligned to the same approved artifact)
- Live production deployment: `dpl_DmQvvbazGm5LGjCHF8s981GqSxvR`, built from `0a1031f9c63ebf81aa232c558b54d951a60504e3` and promoted without rebuilding. (`release-manifest.json` inside the immutable artifact retains `target: "isolated-preview"` and `sourceCommit: "0a1031f9c63ebf81aa232c558b54d951a60504e3"` as built-time metadata.)
- Approved Run 04 branch (`codex/carana-run04-landing-navigation` at `32760a3e88dcf755946ea2300c56ede7f02acb2c`) merged into `main` (`72f6a6ecf402d8ebdca0c98f9b3069b4067f79c0` merge commit; plus release documentation updates on `main`) and tagged `carana-cbd-v0.11.0-run04`.
- Pre-Run04 `main` baseline (`6637437f3be0cdab65e3623208550d598f62b034`) preserved on branch `backup/main-before-run04-2026-11-18` and Run 03B release tag `carana-cbd-v0.10.0-run03b`.
- Previous production rollback target preserved: `dpl_FKmppXAgkJATUktzaGntRSi6c968`.
- Unrelated `e-learning.maissara.tech` (`dpl_C7p1i3UMcSk9e4Yp6H3WAC1fkYg7`) left untouched and verified unchanged.

## Acceptance checklist

- [x] The familiar navy/mint hero, editorial presentation and six-phase cycle are live and verified on desktop and phone at `https://cbd.maissara.tech/`.
- [x] Lesson 1 and Lessons 2–6 are clear in the original six cards; entering, returning and resuming work without redirect loops.
- [x] Original activities remain independent and accessible (`/module1`–`/module6`, `/quick-exercise`, `/index.html`).
- [x] Notebook, backups, study summaries and the institutional demo are accessible without dominating the homepage.
- [x] Production promotion, GitHub `main` consolidation, preservation audit, and release backup completed.

Open `index.html` for side-by-side original/current/corrected comparisons, `PRODUCTION_RELEASE_REPORT.md` for live verification details, `REGRESSION_REPORT.md` and `PRESERVATION.md` for regression/preservation logs, and `BACKUP_AND_ROLLBACK.md` for restoration instructions.

**Recorded verification scope boundary:** Physical iOS/Android hardware testing and native screen-reader listening tests (macOS/iOS VoiceOver, NVDA, JAWS) were not executed inside automated headless runs and remain recommended for field usability review.
