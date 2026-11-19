# Owner acceptance brief

**Read Aloud/interface review is available. New tutor teaching qualification is HOLD; no tested model passed. Production is unchanged.** The public candidate honestly disables live AI. Local inference is a labelled, authenticated engineering prototype, not an approved learner pilot.

1. Open the protected preview linked in RELEASE_AND_BACKUP.md. Compare the unchanged landing/studio and before/after gallery. In Lesson1 choose Listen / Read screen, a device voice, pause/resume, speed, stop and navigation. Verify passage focus and Trainer narration exclusion. A speed change while paused preserves the current utterance and applies to the next passage. Select a teaching paragraph to read it. Judge voice quality/pronunciation by listening.
2. Open Lessons2–6. Ask a question opens the contextual panel. Public preview says not connected; Send is disabled. Escape returns focus. Diagrams, checkpoints, practicals and Notebook remain independent of support use.
3. Review genuine local inference evidence and all failed model evaluations. If inspecting the engineering prototype on the owner Mac, follow the private HTTPS/access-file procedure in ARCHITECTURE_AND_SECURITY.md. Its status explicitly says NOT QUALIFIED. It can demonstrate genuine responses, sources, cancellation and protected/unknown-question handling; those demonstrations are not teaching-quality acceptance.
4. Human expert content review, audible voices, native screen readers, physical Safari/iOS and owner visual acceptance remain pending. Automated WebKit/Axe is not physical-device or institutional certification.

Decisions: accept/refine the reading UI; keep AI on HOLD. A further bounded local model-qualification pass requires explicit approval under the project retry limit. Any future public service also requires approved private connectivity, trusted HTTPS, server-side credentials/identity, operating controls and independent security/quality acceptance. No merge, production release, public tunnel or paid inference is authorized by a green test result.

## Follow-up 03 — TTS-Only Isolated Preview for Owner Acceptance

New isolated Vercel preview deployed from Follow-up 02 application commit `804e7f97d28abcfe4b19141e48c15b11826bdbff`:
- **Preview URL:** `https://carana-cbd-elearning-hnh5wj352-delta4ce20-5830s-projects.vercel.app`
- **Deployment ID:** `dpl_BLJ4n1qWjcaMoayggYhWdEiDym4G` (`READY`, `target: preview`)
- **Full Owner Test Guide & Verification Evidence:** [followup-03/OWNER_ACCEPTANCE_TTS_RELEASE.md](followup-03/OWNER_ACCEPTANCE_TTS_RELEASE.md) and [followup-03/deployed-identifiers-verified.json](followup-03/deployed-identifiers-verified.json).
- Track A (AI Tutor) remains on **HOLD** and is completely excluded/disabled in the preview. Production (`https://cbd.maissara.tech/`) remains unchanged.

## Follow-up 04 — Natural Neural Speech, Complete Dynamic Reading & Contextual Companion UX

New isolated Vercel preview deployed from verified Follow-up 04 application commit `282735a0dec237d29a42a8817932aa49adfdc968` on branch `codex/carana-run06-followup-04`:
- **Preview URL:** `https://carana-cbd-elearning-64h2ot1qn-delta4ce20-5830s-projects.vercel.app`
- **Voice Audition Showcase:** `https://carana-cbd-elearning-64h2ot1qn-delta4ce20-5830s-projects.vercel.app/course/voice-comparison`
- **Deployment ID:** `dpl_2SwYWQt4CTBTLBPsuWpFv49ADW4A` (`READY`, `target: preview`)
- **Full Technical Report & Owner Acceptance Guide:** [followup-04/REPORT_FOLLOWUP04.md](followup-04/REPORT_FOLLOWUP04.md) and [followup-04/deployed-identifiers-verified.json](followup-04/deployed-identifiers-verified.json).
- **Highlights:** Open-weight **Kokoro-82M** (Apache-2.0) pre-rendered studio narration across 1,185 instructional/diagram blocks + UNPOL terminology pronunciation normalization + dynamic explanation reading (`"Possible causes"`, `"Read this explanation"`, all 56 screens & `.applied-lab` worked examples) + native CARANA Learning Companion drawer UX (with `npm run tutor:local` owner-only local Ollama & live `/api/tts` studio demo; public preview remains offline/404 and Track A qualification remains **HOLD**). Production (`https://cbd.maissara.tech/`) remains unchanged.
