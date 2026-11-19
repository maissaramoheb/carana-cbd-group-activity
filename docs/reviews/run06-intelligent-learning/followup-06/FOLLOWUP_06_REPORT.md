# CARANA Run 06 Follow-up 06 — Verification & Completion Report

- **Branch:** `codex/carana-run06-followup-05-ai`
- **Public Production (Untouched):**
  - `https://e-learning.maissara.tech/` (`dpl_2SwYWQt4CTBTLBPsuWpFv49ADW4A`, static `404` on `/api/tutor/status` verified)
  - `https://cbd.maissara.tech/` (`dpl_2SwYWQt4CTBTLBPsuWpFv49ADW4A`, static `404` on `/api/tutor/status` verified)
- **Continuous Owner Pilot Preview (SSO-Protected):**
  - `https://carana-cbd-elearning-hap8ie07b-delta4ce20-5830s-projects.vercel.app`
  - **Persistent Upstream Tunnel:** `https://pseudosymptomatic-nicola-bibliopolical.ngrok-free.dev` -> `https://127.0.0.1:8766`
  - **Active Service:** macOS LaunchAgent `com.carana.cbd.ai` (`~/Library/LaunchAgents/com.carana.cbd.ai.plist` running from local APFS mirror `~/.local/share/carana-ai/runtime/`), model `gemma4:26b` (`idleUnloadMs: 240000`, `maxQueue: 4`), Apple Nora + Kokoro neural TTS.

## Summary of Delivered Workstreams

1. **Workstream A — Always-On Operations (`tools/carana-service.cjs`, `tools/service-supervisor.cjs`):**
   - Replaced ad-hoc terminal sessions with supervised macOS `launchd` service management (`npm run ai:enable | ai:disable | ai:status | ai:emergency-stop | ai:unload`).
   - Solved real macOS FileProvider / TCC stall on `OneDrive-Personal` by syncing a verified local APFS runtime mirror into `~/.local/share/carana-ai/runtime/`.
   - Persisted `proxy-secret` (`0600`) and `users.json` (`0600`) outside the repo and verified live crash self-healing (`SIGKILL` gateway & tunnel respawns, `launchctl kickstart -k`, and `emergency-stop` recovery) against the same deployed Vercel preview URL with zero Vercel rebuilds.
   - Detailed in [OPERATIONS_RUNBOOK.md](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/docs/reviews/run06-intelligent-learning/followup-06/OPERATIONS_RUNBOOK.md).

2. **Workstream B — Resource & Concurrency Management (`tutor/gateway.cjs`, `tutor/provider.cjs`, `tools/benchmark-concurrency.cjs`):**
   - Configured single-slot Ollama inference, bounded FIFO queue (`maxQueue=4`) with live NDJSON queue position updates & client cancellation, `4m` idle unload reclaiming `~17.55 GB` RAM, and calibrated macOS unified memory guard (`level >= 4` or `level >= 2 && reclaimable < 0.35 GB`) after catching `kern.memorystatus_vm_pressure_level = 2` (`WARN`) during normal 18 GB residency.
   - Detailed in [CONCURRENCY_AND_RESOURCE_REPORT.md](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/docs/reviews/run06-intelligent-learning/followup-06/CONCURRENCY_AND_RESOURCE_REPORT.md).

3. **Workstream C — Educational Acceptance & Review Workbench (`tools/qualify-tutor-followup06.cjs`, `review-workbench.html`):**
   - Executed an independent 28-case acceptance suite (`X1`–`X28`) across all 12 CBD domains (`28/28` contract passes, `26` live `gemma4:26b` answers + `1` decline + `1` policy intercept, `0` retries), preserved Follow-up 05's 42-case baseline (`42/42` retrieval re-verified), and built an interactive local Review Workbench awaiting SME/owner pedagogical ratings.
   - Detailed in [EXPERT_EVALUATION_REPORT.md](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/docs/reviews/run06-intelligent-learning/followup-06/EXPERT_EVALUATION_REPORT.md).

4. **Workstream D — Restricted Pilot Controls (`tutor/auth-store.cjs`, `tools/pilot-users.cjs`):**
   - Implemented out-of-repo salted `scrypt` credential registry, `POST /api/tutor/auth` sign-in verification, per-user rate limits, immediate individual revocation (`403 ACCESS_REVOKED`), and global reviewer pause switch (`503 PILOT_DISABLED`) without disturbing owner access. External reviewers remain uninvited (`activeReviewers: 0`).
   - Detailed in [RESTRICTED_PILOT_SECURITY.md](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/docs/reviews/run06-intelligent-learning/followup-06/RESTRICTED_PILOT_SECURITY.md).

5. **Workstream E — Assistant UX & Verification (`platform/learning-support.js`, `platform/learning-support.css`, `tests/support/followup06-browser.cjs`):**
   - Added named user identity display, `Sign out`, `Retry` on offline/paused states, live queue position status, safe DOM bold/bulleted formatting, and captured Desktop (`1440×950`) + Mobile (`390×844`) + Workbench screenshots under `screenshots/`.
   - All existing unit tests (`npm test`: 16/16 new/support tests + all 9 legacy suites + content/platform suites), `npm run check:content`, `npm run build`, 109 SHA-256 preservation checks (`88` files + `21` media, `0` mismatches), and all 6 Playwright Chromium/WebKit + WCAG 2.2 AA Axe regression suites passed after edits.
