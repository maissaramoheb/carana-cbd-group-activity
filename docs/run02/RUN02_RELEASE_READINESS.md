# Run02 release readiness

Status: isolated instructional review candidate. Do not promote unfinished lessons or reassign production aliases. The work meets the run's technical/source-based authoring gates; it does not establish learning effectiveness, official approval or institutional acceptance.

## Preserved baseline

Run01 source 44e98601fe299369cba84c8adb0b4733b08654be and complete-history backup remain recoverable. Lesson1, its 18 recordings and three illustrations, original practical HTML/JS/CSS, concept note and budget assumptions are preserved. GitHub main remains the consolidated Lesson1 source 7e25176. Run02 stays on its own branch.

Production rollback points remain:
- cbd.maissara.tech: dpl_HyNydzU4a988dwDfP247Wg8ec9de.
- e-learning.maissara.tech: dpl_C7p1i3UMcSk9e4Yp6H3WAC1fkYg7.
- Run01 preview: dpl_9n6mfzY6vo3yJXJpWA3SfFhPMSgN.

## Release procedure

From a clean reviewed commit use Node22+, npm ci --offline, npm test and npm run release:prepare. Inspect the static-only output and SHA-256 release manifest before an explicit --prebuilt preview upload. The Git deployment guard remains; no API keys or provider audio requests belong in the build.

The versioned backup manifest records the exact candidate SHA/deployment URL and independent restore comparison. To review an earlier candidate, restore its source bundle or open its immutable preview; do not overwrite the current working tree or move a production alias merely for comparison.

## Remaining gates

- Human curriculum/source-owner and rights review, including the quality of learner-created work.
- Human review and separately authorised production of new narration and fourteen cinematic specifications. New artwork/audio is unproduced.
- Complete assistive-technology and physical-device acceptance; sampled automation is not compliance certification.
- Owner acceptance before any production alias change.
- Phase1 field pilot remains deliberately deferred. No pilot participant data or effectiveness claim exists.

Changed content versions retain old checkpoint metadata in progress export and restart current-version checks. Do not silently equate Run01 completion with mastery of the enhanced material. Local records and drafts are not tamper-proof credentialing.
