# CARANA Follow-up 06 — Restricted Pilot Security & Deployment Boundaries

## 1. Three-State Deployment Boundary

| State | Environment | AI & Auth Status | External Reachability | Verification Status |
| --- | --- | --- | --- | --- |
| **State A: Public Production** | `https://e-learning.maissara.tech/` & `https://cbd.maissara.tech/` (`dpl_2SwYWQt4CTBTLBPsuWpFv49ADW4A`) | **Strictly static.** `/api/tutor/status` -> `404` | Public | **Verified untouched** (`404` on both domains) |
| **State B: Continuous Owner Pilot** | `https://carana-cbd-elearning-hap8ie07b-delta4ce20-5830s-projects.vercel.app` | Active against persistent tunnel (`https://pseudosymptomatic-nicola-bibliopolical.ngrok-free.dev`) | Protected by **Vercel Team SSO** (`302` unauthenticated) + **Named Owner Token** (`owner-maissara`) | **Verified end-to-end** (`auth`, `gemma4:26b` Q&A, `apple:nora` WAV `119,052 B`, crash recovery) |
| **State C: Restricted Reviewer Pilot** | Built into gateway, proxy, user store & UI (`role: reviewer`) | **Ready but unpopulated / uninvited** (`activeReviewers: 0` at closeout; no external invitations sent) | Requires owner authorization before issuing reviewer codes or disabling Vercel SSO | Architecture, revocation, per-user limits & kill-switch **verified end-to-end** using temporary test account (removed after verification) |

## 2. Authentication & Credential Architecture (`tutor/auth-store.cjs`)

1. **Out-of-Repo Scrypt User Registry:** Credentials are stored exclusively at `~/.local/share/carana-ai/users.json` (directory mode `0700`, file mode `0600`, atomic temp-file rename writes) using per-user salted `scrypt` hashes (`N: 4096, r: 8, p: 1`) and `crypto.timingSafeEqual()`. Plaintext codes are never written to the repository, Vercel environment variables, or gateway logs.
2. **Server-Enforced Sign-In (`POST /api/tutor/auth`):** Unlike Follow-up 05's lazy Connect button (which checked the token only when submitting the first question), `platform/learning-support.js` now validates access codes immediately on Connect against `POST /api/tutor/auth`. Wrong codes return `401 AUTH_INVALID` and keep **Send** disabled; valid codes display the signed-in identity (`Display Name (role)`), expose a **Sign out** control (`#assistant-signout`), and clear on revocation/expiry (`401`/`403`) or Retry (`#assistant-retry-status`).
3. **Tunnel Proxy Shared Secret (`X-CARANA-Proxy-Secret`):** Stored in `~/.local/share/carana-ai/proxy-secret` (`0600`) and Vercel Preview-only `CARANA_PROXY_SECRET`. Direct requests to `pseudosymptomatic-nicola-bibliopolical.ngrok-free.dev` without this server-side secret fail closed with `HTTP 403 Host is not permitted.`
4. **No Learner Data Storage:** Conversations stay ephemeral in browser memory, checkpoints and user workbook drafts (`carana_learning_v1`, `carana_cbd_course_v1`, `.restore-preview`) are never transmitted in `/api/tutor` requests, and operational telemetry excludes prompts, answers, and tokens.

## 3. Verified Access Control & Kill-Switch Tests

Tested both in automated unit/integration suites (`tests/support/pilot-ops.cjs`, `tests/support/service-supervisor.cjs`) and **live across the deployed Vercel Preview proxy**:

| Check | Mechanism Tested | Observed Live Result |
| --- | --- | --- |
| Direct public preview bypass attempt | Request preview URL without Vercel session | `HTTP 302` (Vercel SSO redirect) |
| Direct tunnel access without Vercel secret | `GET https://pseudosymptomatic-nicola-bibliopolical.ngrok-free.dev/api/tutor/status` | `HTTP 403` (blocked) |
| Wrong / forged access code | `POST /api/tutor/auth` (`Bearer invalid-code`) via Vercel preview | `HTTP 401` |
| Owner access validation | `POST /api/tutor/auth` (`owner-maissara`) via Vercel preview | `HTTP 200` (`authenticated: true, role: owner, ratePerMin: 20`) |
| Per-user reviewer rate limit | Temporary `pilot-smoke-rev` (`rateLimitPerMin=2`), 3 consecutive `/api/tutor` requests | **`200, 200, 429`** (`USER_RATE_LIMIT`) |
| Instant individual revocation | `node tools/pilot-users.cjs revoke pilot-smoke-rev` -> immediate `POST /api/tutor/auth` | **`HTTP 403 ACCESS_REVOKED`** |
| Global reviewer pilot kill switch | `node tools/pilot-users.cjs disable-reviewers` (while owner remains active) | Reviewer -> **`HTTP 503 PILOT_DISABLED`**; Owner -> **`HTTP 200`** |
| Vercel edge kill switch (`CARANA_PILOT_DISABLED=true`) | `tests/support/pilot-ops.cjs` proxy test | `/api/tutor/status` reports `pilotDisabled: true`; `POST /api/tutor/auth` -> **`HTTP 503 PILOT_DISABLED`** before hitting upstream |
| Host emergency shutdown | `npm run ai:emergency-stop` | LaunchAgent removed, processes stopped, Ollama unloaded, Vercel preview -> `connected: false` |

After finishing live State C verification, `pilot-smoke-rev` was removed via `node tools/pilot-users.cjs remove pilot-smoke-rev`, leaving `activeReviewers: 0` and zero external reviewer accounts issued.
