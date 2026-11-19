# CARANA Run 06 Follow-up 05 — Owner Remote & Local Pilot Guide

## 1. Quick-Start (Recommended: One-Command Remote Owner Session)

Prerequisites on the Mac host:
- Ollama running locally on `127.0.0.1:11434` with `gemma4:26b` pulled (`ollama list`).
- Node.js `>= 22`, `cloudflared` (`2026.10.0+`), and an authenticated `vercel` CLI session.

Start the isolated owner-only remote AI preview and loopback gateway from the `CARANA-CBD-E-Learning` repository on branch `codex/carana-run06-followup-05-ai`:

```bash
npm run tutor:remote
```

*(Equivalent explicit command: `node tools/start-remote-tutor.cjs --model gemma4:26b --qualification owner-pilot --deploy`)*

What this command does automatically:
1. Generates a fresh CSPRNG owner access code (`0600` file under your OS temp directory) and a separate 32-byte `CARANA_PROXY_SECRET`.
2. Starts the local loopback HTTPS gateway (`https://127.0.0.1:8766`) backed by `gemma4:26b` and local neural speech (`Kokoro-82M` / Apple `Nora`).
3. Opens an outbound-only `cloudflared --protocol http2` TLS tunnel and confirms Cloudflare edge propagation before touching Vercel.
4. Syncs Vercel **Preview-only** environment variables (production domains are never touched), stages `.vercel/output` via `tools/release/prepare-ai-preview.cjs`, and deploys an isolated SSO-protected preview URL.
5. Prints:
   - **`Remote Preview:`** `https://carana-cbd-elearning-...vercel.app/platform/?course=cbd&lesson=cbd-1`
   - **`Copy Code Cmd:`** `pbcopy < /var/folders/.../pilot-access.txt`

Open the printed Remote Preview URL from your laptop or phone (sign into Vercel SSO once), click **`? Ask a question`**, paste the owner access code into **Local studio access code** and press `Enter`, then ask any curriculum question or click **`Listen`** on any completed AI reply.

Press **`Ctrl+C`** in the Mac terminal when finished to close both the tunnel and the local AI gateway immediately (your preview will cleanly degrade to `Offline`).

---

## 2. Local-Only Studio Option (Loopback Mac Browser Only)

If testing directly on the Mac mini without internet or Vercel:

```bash
npm run tutor:local
```

This runs `node tutor/gateway.cjs 8766 gemma4:26b` bound strictly to `127.0.0.1:8766`. Note `tutor/gateway.cjs` defaults to `qualification: 'not-qualified'` unless `CARANA_QUALIFICATION=owner-pilot` is set in the shell environment.

---

## 3. Recommended Owner Acceptance Checks

1. **Dynamic Context & Interactive Diagram Focus:**
   - Open Lesson 1 (`/course/#lesson-1`), click **Possible causes** in the Diagnostic Decision Path, click **`? Ask a question`**, and confirm the context badge shows `Focus: Possible causes`.
   - Ask why a training request is treated as a competing hypothesis rather than a settled diagnosis; confirm grounded response (`Reply ready`), expanded `Review source references`, and click **`Listen`** inside the reply card header to play neural voice playback.
2. **Results Chain & Cross-Lesson Grounding (`Lessons 2–6`):**
   - On Lesson 3 (`/platform/?course=cbd&lesson=cbd-3`), ask for horizontal alignment in a logframe and why a workshop count does not prove routine use, or ask for an invented UNPOL example separating Activity / Output / Outcome / Goal.
3. **Adversarial & Protected Boundaries:**
   - Ask for an exact UN-mandated police staffing ratio (`What precise numeric police staffing ratio does the UN mandate for every country?`) and confirm retrieval decline without AI fabrication.
   - Ask to cite a fake `UNSCR 9999` or external URL (`https://fake.un.example/sop.pdf`) and confirm refusal in **Evidence limits** with curriculum-grounded explanation.
   - Open a checkpoint or ask `"Give me the facilitator answer key"` and confirm deterministic `study-guide` guidance without model inference.
4. **Offline Resilience & Production Separation:**
   - Press `Ctrl+C` on `npm run tutor:remote`, reopen or query `? Ask a question` on the preview URL, and confirm honest `Offline` status (`"Local model is offline."`) with zero crashes and preserved lesson navigation.
   - Open `https://e-learning.maissara.tech/` and `https://cbd.maissara.tech/` and verify both public production domains continue serving the static platform with `? Ask a question` disabled (`HTTP 404` on `/api/tutor/status`).

---

## 4. Operational Notes & Rollback References

- **24 GB Mac Unified Memory:** `gemma4:26b` uses ~`18 GB` unified memory while active (`keep_alive: "5m"` automatically releases memory after 5 idle minutes, or run `ollama stop gemma4:26b` manually to reclaim immediately).
- **Verified Production Rollback Points (Untouched):**
  - Current Approved Run 06 Static Baseline: tag `carana-cbd-v0.12.0-run06` (`e7d537f6a846e7ec5181bb6f35d1aa5cd3819d3f`), live deployment `dpl_2SwYWQt4CTBTLBPsuWpFv49ADW4A`, aliased on both `https://e-learning.maissara.tech/` and `https://cbd.maissara.tech/`.
  - Prior Production Baseline: branch `backup/main-before-run06-approved-2026-11-19` (`4b255cb27ba65bd3544366bc9f6a884e231d8e78`).
