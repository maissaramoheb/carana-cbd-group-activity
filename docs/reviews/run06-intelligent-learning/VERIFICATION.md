# Verification and acceptance limits

| Check | Result and boundary |
|---|---|
| npm run build | PASS;18 local recordings checked, no generation/network |
| npm run check:content | PASS;38 expanded screens/42 questions; L1 suite separately checks18screens/36questions |
| npm test | PASS; original exercise smoke/build/content/tools/progress/recovery/handoff/Notebook/exploration suites plus gateway/provider negatives |
| Syntax and whitespace | node --check on new/changed scripts and git diff --check; no lint script defined |
| Original Lesson1 browser journey | PASS Chromium, desktop WebKit and mobile WebKit;18screens,36items, all narration playback, keyboard/gallery, practical confirmation/resume, malformed storage/media failure cases |
| Expanded browser journey | PASS Chromium full38screens/42questions/17tools and selected desktop/mobile WebKit journeys; diagrams, practice decisions, checkpoints, applied tools, practical links, Notebook/handoff/recovery negatives |
| All56 screen reading extraction | PASS actual mounted DOM at tablet width; title/lead/order scope and reflow, synthetic fresh browser progression only; no claim of learner mastery |
| Native Read Aloud | PASS Chromium and desktop/mobile WebKit; genuine speech start, pause/resume flags, stop, rate, highlight, navigation stop, MP3 mutual exclusion, complete progress/exploration unchanged before navigation |
| Voice inventory | Actual available native voices recorded in evidence/native-voice-inventory.json; browser/headed Chrome inventory separate from audible human evaluation |
| Assistant transport/UI | PASS real screen context, ephemeral conversation, sources, explicit simulated fixture label, errors/unavailable, focus return and no progress/draft payload in Chromium/mobile WebKit |
| Genuine inference | Actual authenticated loopback HTTPS→retrieval→Ollama→browser; no route mocks. Evidence distinguishes service integration from semantic model quality |
| Security negatives | Wrong token/origin/Host, size/context/content type, rate limits, no private-file access/CORS, one-inference concurrency, cancellation, deadline/provider failure and protected checkpoint/key guard PASS |
| Provider negative contract | Invalid source IDs, invented references/numbers, empty/malformed replies rejected; synthetic unit tests, not proof of inference or comprehensive semantic safety |
| New UI accessibility |18 Axe scans across2lesson types×3states×3viewports at1600/768/390; zero returned WCAG2A/AA,2.1AA,2.2AA violations. Focus/Escape, native dialog, keyboard, reduced-motion and RTL reflow checked |
| Preservation |88 protected file SHA256 checks plus unchanged landing renderer and18visual/lab structures PASS; see preservation.json |

Browser automation uses the existing locally installed Playwright/axe modules, not new project dependencies. Headless WebKit on this Mac is not released Safari.app or a physical iPhone/iPad. Human listening, pronunciation, VoiceOver/NVDA interactions, physical Safari/iOS, broader multilingual use, institutional load and owner visual/content acceptance are NOT VERIFIED. Automated Axe is evidence for tested criteria, not WCAG certification.

The static protected preview is separately verified after upload in RELEASE_AND_BACKUP.md and evidence/preview-assets.json. The local self-signed HTTPS certificate is scoped to local review; no global TLS bypass is configured. Temporary pilot/browser credentials are excluded from source, evidence and backup. Model evaluation retains initial failures and separates source-metadata validity from factual correctness. Do not infer model acceptance from a green browser/network test.
