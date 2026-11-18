# Run 04 — owner acceptance

**Status: corrected isolated preview READY; production approval pending.**

[Open corrected preview](https://carana-cbd-elearning-8v34bnlfu-delta4ce20-5830s-projects.vercel.app/). Existing Vercel access protection remains enabled; the owner can sign in with the project account. Automated deployed checks used a temporary authenticated review session, not a production-domain change.

- Deployment: `dpl_DmQvvbazGm5LGjCHF8s981GqSxvR`, preview target (`target: null`), READY.
- Deployed implementation: `0a1031f9c63ebf81aa232c558b54d951a60504e3`.
- Branch: `codex/carana-run04-landing-navigation`. Subsequent commit contains verification evidence/documentation and optional test-session support only; deployed application files are identical.
- Main: `6637437f3be0cdab65e3623208550d598f62b034`, unchanged. Existing `carana-cbd-v0.10.0-run03b` retained.
- Production `cbd.maissara.tech`: still `dpl_FKmppXAgkJATUktzaGntRSi6c968`. `e-learning.maissara.tech`: still `dpl_C7p1i3UMcSk9e4Yp6H3WAC1fkYg7`.

## Acceptance checklist

- [ ] The familiar navy/mint hero, editorial presentation and six-phase cycle are correct on desktop and phone.
- [ ] Lesson 1 and Lessons 2–6 are clear in the original six cards; entering, returning and resuming feel coherent.
- [ ] Original activities remain independent and accessible.
- [ ] Notebook, backups, study summaries and the institutional demo are accessible without dominating the homepage.
- [ ] Approve this corrected preview for a separately controlled production release, or identify specific adjustments.

Open `index.html` for side-by-side original/current/corrected screenshots and the complete navigation journey. `REGRESSION_REPORT.md` and `PRESERVATION.md` document checks and limits; `BACKUP_AND_ROLLBACK.md` identifies the versioned local backup and independent restore receipt.

**Next authorized boundary:** owner review only. No merge, production deployment, alias reassignment or release-tag replacement has occurred. After explicit acceptance, back up the accepted merge, rerun the release gates and deploy through the controlled release process. Physical-device and native screen-reader acceptance remain unverified.
