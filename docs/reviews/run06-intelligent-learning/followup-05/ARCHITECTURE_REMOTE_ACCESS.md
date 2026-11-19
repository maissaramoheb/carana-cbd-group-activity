# CARANA Run 06 Follow-up 05 — Remote Access & Security Architecture

## 1. Domain & Production Separation

- **Primary Domain:** `https://e-learning.maissara.tech/` (aliased cleanly to `dpl_2SwYWQt4CTBTLBPsuWpFv49ADW4A`, `target: Production` static build).
- **Continuity Domain:** `https://cbd.maissara.tech/` (preserved active on the exact same `dpl_2SwYWQt4CTBTLBPsuWpFv49ADW4A` without cross-domain redirects).
- **Zero Production Impact Verified:**
  - Live checks on both `https://e-learning.maissara.tech/` and `https://cbd.maissara.tech/` confirm `/release-manifest.json` remains on baseline commit `282735a0dec237d29a42a8817932aa49adfdc968` and `/api/tutor/status` returns **`HTTP 404`**.
  - Protected `tools/release/prepare.cjs` remains SHA-256 unchanged (`preservation.json`) and deploys zero serverless functions.
  - Note on `live-release-manifest.json` metadata discrepancy: both production domains intentionally retain `"target": "isolated-preview"` and `"sourceCommit": "282735a0dec237d29a42a8817932aa49adfdc968"` inside `/release-manifest.json` from Run 06 Follow-up 04's promoted build without mutating live production assets (`baseline-housekeeping-receipt.json` + annotated tag `carana-cbd-v0.12.0-run06` on `e7d537f6a846e7ec5181bb6f35d1aa5cd3819d3f`).

## 2. Isolated Remote Owner-Only AI Preview Topology

```text
Owner Browser (Vercel SSO + Owner Access Code)
  └── HTTPS POST /api/tutor, /api/tts | GET /api/tutor/status, /api/health
        └── Vercel Isolated Preview Node 22 Functions (tutor/remote-proxy.cjs)
              ├── Requires Vercel Deployment Protection (SSO -> 302 for public)
              ├── Fail-closed 404 unless CARANA_AI_ENABLED === "true" + secrets exist
              ├── Validates Host + Origin allowlist (^https://carana-cbd-elearning*.vercel.app)
              ├── No CORS headers, no secrets or tunnel URLs exposed to client
              └── Adds server-side X-CARANA-Proxy-Secret + X-CARANA-Forwarded-Origin
                    └── Outbound-only Cloudflare HTTP/2 TLS Tunnel (*.trycloudflare.com -> 127.0.0.1:8766)
                          └── Local HTTPS Gateway (tutor/gateway.cjs on 127.0.0.1:8766)
                                ├── Constant-time verification of X-CARANA-Proxy-Secret & Bearer Owner Code
                                ├── Retrieval + Policy Checkpoints (tutor/retrieval.cjs)
                                ├── Ollama 127.0.0.1:11434 (gemma4:26b, zero external calls)
                                └── Local Neural TTS (Kokoro-82M + Apple Nora Enhanced)
```

## 3. Defense-in-Depth Controls Verified

1. **No Direct Internet Exposure of Ollama or Local Gateway:** Ollama remains bound strictly to `127.0.0.1:11434`; `tutor/gateway.cjs` listens strictly on `127.0.0.1:8766`. Remote connectivity uses outbound-only `cloudflared` tunnel (`--protocol http2`) started only by the owner via `npm run tutor:remote`.
2. **Vercel Deployment Protection + Fail-Closed Edge:** Unauthenticated requests to `https://carana-cbd-elearning-cl8pydgbt-delta4ce20-5830s-projects.vercel.app/api/tutor/status` are blocked by Vercel SSO (`302`). Even inside the Node proxy (`tutor/remote-proxy.cjs`), missing `CARANA_AI_ENABLED=true` fails closed with `HTTP 404`, and unit tests (`tests/support/remote-proxy.cjs`) verify rejection of non-HTTPS upstream URLs, wrong `Host`, wrong `Origin`, `OPTIONS`, unauthenticated POST (`401`), and oversized payloads (`413`).
3. **Ephemeral Owner Access Code & Server Secret:** `tools/start-remote-tutor.cjs` generates a fresh CSPRNG owner code (`0600` file in `os.tmpdir()`) and a separate 32-byte server `CARANA_PROXY_SECRET` piped via `stdin` to Vercel `preview` env vars only (`vercel env add ... preview`). Client JavaScript (`platform/learning-support.js`) never embeds any credential, tunnel URL, or bypass key, and keeps the owner code in page memory only (never `localStorage` or `sessionStorage`).
4. **Honest Offline & Validation Handling:** Stopping the Mac tunnel or gateway causes `/api/tutor/status` on the Vercel preview to degrade cleanly to `200 { connected: false }` (`remote-preview-offline.json`), and `POST /api/tutor` to return clean `503` JSON (`Owner local AI service is offline or unreachable right now...`) rather than leaking Cloudflare `502`/`530` HTML. Gateway server-side evidence validation failures return `200` `kind: 'source-check'` safe-decline guidance rather than unverified AI prose.
5. **Privacy & Learner Data Boundaries:** Operational telemetry logs `{ ts, route, status, kind, lessonId, screenId, model, elapsedMs }` only—never learner questions, model answers, progress, drafts, or notebooks. Detailed gateway `stats` on `/api/health` are omitted from unauthenticated proxied callers (`stats === undefined`).
