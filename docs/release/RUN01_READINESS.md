# Run 01 release readiness

Status: controlled review candidate. Production promotion and the deferred field pilot are not part of this release.

## Source consolidation

Remote main was safely fast-forwarded from f59de58 to 7e25176 (approved Lesson 1 plus automatic-deployment guard). Original remote main is retained at backup/main-before-codex-release-2026-11-17. Approved 337246f is published at codex/cbd-comprehensive-enhancement. Tag carana-cbd-v0.8.1-source identifies the consolidated source release. Expansion remains on codex/carana-expansion-run01 pending owner review.

## Domains and rollback

- cbd.maissara.tech remains assigned to dpl_HyNydzU4a988dwDfP247Wg8ec9de (approved Lesson 1).
- e-learning.maissara.tech already exists; it is assigned to the older dpl_C7p1i3UMcSk9e4Yp6H3WAC1fkYg7 in the same e-learning project and currently redirects root to course/. It was not reassigned.
- The original activity Vercel project follows main, so git.deploymentEnabled=false prevents main reconciliation from deploying the course redirect over the original activity. Explicit CLI static preview creation remains permitted. Publishing the approved branch triggered only an isolated preview, not a production change.
- After owner acceptance, assign only the exact umbrella domain to the verified expansion preview through the existing project alias mechanism. Preserve cbd.maissara.tech and original activity aliases. Existing DNS works; no speculative DNS rewrite is needed. Recheck alias state at execution time.
- To reverse an authorised future umbrella cutover, restore e-learning.maissara.tech to dpl_C7p1i3UMcSk9e4Yp6H3WAC1fkYg7 and verify course, gallery, media and activity links. Preserve the approved CBD alias as a separate rollback point.

## Candidate release process

Use Node 22+, npm ci --offline, npm test, npm run release:prepare from the clean reviewed commit. The last command stages .vercel/output/static and version-3 routing, with a source-SHA and SHA-256 asset manifest. Review the exact payload before deploying --prebuilt to carana-cbd-elearning with target preview. No source PDFs, internal documents, tests, tools, environment files or credentials belong in the upload. Normal builds cannot purchase media.

An owner approval for source reconciliation does not constitute acceptance of the new CBD content or a production alias change. Human curriculum/rights acceptance, new media decisions and institutional adoption remain separate gates. See the backup manifest and final implementation report for exact preview and recovery identifiers.
