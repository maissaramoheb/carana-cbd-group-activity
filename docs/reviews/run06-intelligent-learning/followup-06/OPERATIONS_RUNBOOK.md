# CARANA Follow-up 06 — Always-On Local AI Operations Runbook

## 1. Architecture Summary

The owner-controlled CARANA AI service runs locally on the Mac mini under macOS `launchd` (`com.carana.cbd.ai`), exposing **zero** raw ports on public interfaces and keeping all secrets outside the Git repository under mode `0700` / `0600` paths in `~/.local/share/carana-ai/`.

| Component | Binding / Location | Supervision / Persistence |
| --- | --- | --- |
| macOS LaunchAgent | `~/Library/LaunchAgents/com.carana.cbd.ai.plist` | `RunAtLoad = true`, `KeepAlive = true`, `ThrottleInterval = 15`, `ExitTimeOut = 20`, `ProcessType = Background` |
| APFS Runtime Mirror | `~/.local/share/carana-ai/runtime/` | Synced on `enable` from the repository (`tutor/`, `dist/`, `tools/`) so `launchd` never stalls on macOS OneDrive `FileProvider`/TCC locks at boot |
| Process Supervisor | `tools/service-supervisor.cjs` | Single-instance `supervisor.pid` lock; exponential respawn (`1s`, `2s`, `5s`, `10s`, `30s`); active health probes every `20s` (2 consecutive failures after `15s` grace triggers kill & respawn) |
| Local AI & TTS Gateway | `tutor/gateway.cjs` (`https://127.0.0.1:8766`) | Loopback TLS 1.2+ only; single Ollama inference slot (`gemma4:26b`), bounded queue (`CARANA_MAX_QUEUE=4`), idle unload (`CARANA_IDLE_UNLOAD_MS=240000`) |
| Persistent Authenticated Tunnel | `ngrok` v3.32.0 -> `https://pseudosymptomatic-nicola-bibliopolical.ngrok-free.dev` | Deterministic static domain pointed at `https://127.0.0.1:8766`; direct unauthenticated hits fail closed (`403`) at the gateway |
| Isolated Vercel Proxy Preview | `tutor/remote-proxy.cjs` -> `https://carana-cbd-elearning-hap8ie07b-delta4ce20-5830s-projects.vercel.app` | Vercel Preview-only env vars (`CARANA_AI_ENABLED`, `CARANA_UPSTREAM_URL`, `CARANA_PROXY_SECRET`, `CARANA_MODEL`, `CARANA_QUALIFICATION`), protected by Vercel Team SSO |
| Ollama Runtime | `com.ollama.ollama` (`127.0.0.1:11434`) | Loopback only; automatically unloaded after 4 minutes idle (`keep_alive: '4m'` + supervisor timer) |

> [!IMPORTANT]
> **Discovery during macOS LaunchAgent qualification:** Launching Node directly from `~/Library/CloudStorage/OneDrive-Personal/...` caused the `launchd` background job to block indefinitely inside `uv_fs_open -> __open` under macOS FileProvider / TCC restrictions (`PID 55890`). Syncing a clean local APFS runtime mirror into `~/.local/share/carana-ai/runtime/` on `npm run ai:enable` resolved this completely and allows reliable startup on reboot before OneDrive mounts.

## 2. Owner Operational Commands

All commands run from `/Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD E Lap/CARANA-CBD-E-Learning`:

| Task | Command | Behavior |
| --- | --- | --- |
| Enable & start at login/reboot | `npm run ai:enable` | Syncs APFS runtime mirror, removes any `emergency-stop` guard, ensures `0600` secrets/owner credential, installs & bootstraps `com.carana.cbd.ai`, and verifies loopback + persistent tunnel health |
| Disable & unschedule auto-start | `npm run ai:disable` | Runs `launchctl bootout` / `disable`, removes `~/Library/LaunchAgents/com.carana.cbd.ai.plist`, and terminates supervisor/gateway/ngrok while preserving credentials & logs |
| **Manual emergency shutdown** | `npm run ai:emergency-stop` | Creates `~/.local/share/carana-ai/emergency-stop` guard, boots out and removes LaunchAgent, terminates all supervisor/gateway/tunnel processes, and runs `ollama stop gemma4:26b` immediately |
| Check live service status | `npm run ai:status` | Reports LaunchAgent state, PIDs, loopback `/api/health`, authenticated remote tunnel check, `ollama ps`, macOS VM memory pressure, and active user counts (never outputs secrets) |
| Restart via launchd | `node tools/carana-service.cjs restart` | Executes `launchctl kickstart -k gui/$(id -u)/com.carana.cbd.ai` and awaits healthy local + tunnel readiness |
| Free GPU/RAM immediately | `npm run ai:unload` | Unloads `gemma4:26b` from Ollama (`~18 GB` freed immediately) while keeping the gateway & tunnel online |
| Inspect health logs | `node tools/carana-service.cjs logs --lines 40` | Prints recent JSONL entries from `~/.local/share/carana-ai/logs/health.jsonl` |
| Deploy / refresh Owner Preview | `node tools/carana-service.cjs deploy-owner-pilot` | Syncs Preview-only Vercel env vars to the static `ngrok` URL (Production untouched) and deploys an isolated SSO-protected preview |

## 3. Privacy-Safe Operational Logging

Operational logs are written to `~/.local/share/carana-ai/logs/health.jsonl` (`0600`, auto-rotated at `5 MB` retaining `.1` and `.2`). `createHealthLogger()` explicitly strips `token`, `secret`, `authorization`, `question`, `answer`, `prompt`, `text`, `inviteToken`, and `proxySecret`. Recorded events include only timestamps, event types (`supervisor_starting`, `child_started`, `child_exited`, `unhealthy_kill`, `health_heartbeat`, `supervisor_stopped`), HTTP routes/status codes, lesson/screen IDs, latency metrics, user IDs, and memory pressure levels. Verified post-run across 41 logged lines (`5,635` bytes): zero owner tokens, invite tokens, proxy secrets, or learner question texts appear anywhere in logs.

## 4. Verified Fault-Recovery Evidence (No Vercel Redeploy Required)

All recovery checks were executed end-to-end against the persistent deployed Owner Pilot preview (`https://carana-cbd-elearning-hap8ie07b-delta4ce20-5830s-projects.vercel.app`) without redeploying Vercel:

1. **Gateway Process Crash (`SIGKILL`):** Killing gateway PID `56208` triggered automatic respawn to PID `57689` (`gateway.restarts: 1`); Vercel preview `/api/tutor/status` immediately recovered to `connected: true`.
2. **Persistent Tunnel Crash (`SIGKILL`):** Killing `ngrok` PID `56209` triggered automatic respawn to PID `57712` (`tunnel.restarts: 1`) rebinding `https://pseudosymptomatic-nicola-bibliopolical.ngrok-free.dev`; Vercel preview `/api/tutor/status` immediately recovered to `connected: true`.
3. **LaunchAgent Restart (`launchctl kickstart -k`):** Replaced supervisor PID `56207` cleanly with PID `57802`; preview recovered to `connected: true`.
4. **Emergency Stop & Re-Enable:** Running `npm run ai:emergency-stop` immediately switched Vercel preview `/api/tutor/status` to `{ connected: false }` and unloaded Ollama; running `npm run ai:enable` restored `connected: true` automatically without touching Vercel configuration or deployments.
5. **Unit-Level Health Probe Recovery:** Verified in `tests/support/service-supervisor.cjs` that 2 consecutive failed active health probes terminate an unresponsive child and respawn a healthy replacement.
