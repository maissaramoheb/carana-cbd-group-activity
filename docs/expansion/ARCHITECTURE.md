# Shared learning architecture

The approved Lesson 1 remains in course/ with its 18 locked recordings and separate v1 progress key. Its runtime, CSS, content, media and original CARANA exercises remain byte-identical to 337246f. The only edit within course/ is expanding the build test fixture to include the new public directories.

platform/ contains a shared catalog and data-driven preview renderer; curricula/cbd/ contains versioned review adaptations for Lessons 2–6. Original root activities remain standalone and use their existing storage and validation rules. Development documentation, source inventory and institutional materials are excluded from dist. Public output contains only platform, curriculum lesson JSON, the course and original activity assets. Node built-ins handle release verification; no dependency was added.

## Lesson contract

A lesson defines id, version, title, source, digital objectives, variable sections, per-screen teaching/visual/decision/transcript data, section quiz arrays and a practical link. New media remains explicit specification-only. There is no requirement for six sections, three screens or six questions. The new lessons contain 30 screens and 42 questions across fourteen sections in total. The new mastery rule is correct-all with feedback and unlimited retries per variable-size section; it is an authored formative study standard, not an official pass requirement.

The shared narration alternative is the readable transcript. New recorded playback is not claimed. A future approved recording can reuse Lesson 1's joint script/audio hash validation and fingerprinted URLs once per-track assets exist. Do not claim the present template records or synthesises speech.

The generic concept renderer shows named components and their explanatory relationship. These reveal controls are not full construction tools for SMART objectives, logframes or transition plans. The original practical activities provide the construction context; facilitated review remains needed for judging those products.

## State and compatibility

The new key carana_learning_v1 isolates catalog progress from legacy course/lab keys. Each lesson has its own contentVersion, completed contiguous section indices and last section/screen. Stored indices are normalised; changing the lesson version resets that lesson's study state without changing other records. Completion is browser-local, editable and exportable; it cannot serve as credentialing. Same-tab quiz choices are held in memory during screen review. A reload starts a new attempt but retains passed sections and reading position.

A missing lesson resource produces a recoverable catalog link and preserves saved data. Failed writes remain visible and progress can be exported. No authentication, telemetry, analytics or personal data capture is introduced. The platform's current learner content is English; logical CSS supports RTL reflow, but no Arabic translation or fully validated Arabic course is claimed.

## Second curriculum rehearsal

tests/platform/mma-orientation.json is an unpublished source-based orientation fixture using MMA Introduction pp. 2–4. Browser tests inject a catalog definition and intercept its JSON request; the same renderer, progress isolation, reveal control and checkpoint work without an application-code change. The public MMA and COP catalogs remain readiness entries with no digital lessons. This proves schema addability for a second source-defined curriculum, not complete MMA conversion or operational curriculum acceptance.

## Release controls

npm test runs original activity checks, Lesson 1 guards, build-integrity negatives and new content/budget checks. npm run release:prepare runs validation, tests and an offline build from a clean tracked commit, then stages a static-only Vercel output with a SHA-256 release manifest. The preview root opens platform/; course/ and every original activity remain available. The repository Git deployment guard protects existing aliases. Source synchronization, preview deployment and production acceptance remain separate steps.
