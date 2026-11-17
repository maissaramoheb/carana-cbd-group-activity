# Verification report

- Baseline: 32 course smoke assertions passed; original workbench suite failed to start under the inherited root module setting.
- Candidate: original workbench suite 65 passed; course smoke 32 passed; build-integrity test passed with expected failures for script drift, corrupt audio and missing audio. Build produces 18 fingerprinted MP3s without network or synthesis. All 18 source MP3s decoded end-to-end with FFmpeg. Three JPEGs measured at 1672 × 941.
- Playwright Chromium desktop, desktop WebKit and iPhone 13 WebKit emulation executed every lesson screen, each checkpoint, every narration, same-origin Module 1 participant confirmation and completion. At 320px and 768px Chromium checked reflow and keyboard activation for all gallery visuals. Tested blocked media, malformed progress and failed saves in Chromium.
- Axe sampled course home, checkpoint and matrix. First pass identified contrast and accessible-name findings; final sampled run reported zero. This is not comprehensive WCAG conformance or native Safari/VoiceOver acceptance.
- Original workbench preservation: compare baseline and candidate on index, module1–6, quick-exercise page, css/ and js/; browser assertions exercise the Module 1 handoff, not all activities or independent multiplayer workflows.
- Evidence files (screenshots, automation logs, axe JSON, comparison and deployment evidence) are stored with the versioned backup. Browser screenshots used system font fallbacks; approved fonts were not replaced.
- Unverified: human audio/script agreement for all files, full assistive technology and native Safari, live learner effectiveness, real-device constraints and field performance. No Lighthouse or field Core Web Vitals claim.
