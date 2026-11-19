# Approved follow-up 01 — qualification remains HOLD

The approved additional pass is complete. The dedicated instruction-tuned candidate improved transition conditionality, but it did not pass the teaching-quality gate. No model is selected for a learner pilot. No preview or production deployment/alias change was performed. The rebuilt static UI matches the existing preview.

## Scope and evidence

Candidate: `qwen3:4b-instruct-2507-q4_K_M`, approximately 2.5 GB downloaded, 3.2 GB observed loaded on GPU with context 4096. The download completed and verified on its single capped attempt. `ENVIRONMENT.json` records its exact digest. Provider settings stayed temperature 0, nonthinking, output budget 420 and deadline 45 seconds. The system prompt was unchanged.

One fixed matrix was evaluated, followed by verification of one discovered context-wiring defect using the same matrix. Both result sets are retained (`RESPONSES-initial.json`, `RESPONSES.json`); no individual model call was retried. Final results: **10 generated responses, 1 response blocked by source validation, 1 retrieval decline without inference**. Generated responses took about 2.0–3.4 seconds. These counts are transport/contract observations, not a teaching pass.

## Decisive findings

- **H1 — incorrect results-chain example:** the invented school example labels teachers as an activity and mixes actors, activities and outputs. It also ignores the requested policing domain.
- **H2 — correctly blocked, still unsuitable:** the model supplied nonexistent source ID `cbd-3:03-010`. Validation prevented delivery. Its undelivered example also proposes workshop counts as a measure of officers using a review routine, contradicting the source's deliberately flawed example.
- **H5 — unsupported evidence claim:** the response correctly rejects procurement evidence for routine use, but then claims the procurement register records workshop deliveries/attendance. The authorized passage does not establish that claim. A correct conclusion does not cure a fabricated premise.
- **Improvement:** C5 and H4 correctly distinguish contextual infeasibility from objective achievement and reject the false universal prerequisite for transition.
- **Coverage gap:** H6's natural wording about improved skills retrieves no passages. The model was not called and receives no credit for that case. The decline now accurately reports insufficient retrieval confidence and offers the current-screen action.

## Implemented context correction

The initial actual-screen actions exposed omitted context in provider input. The gateway now passes allowlisted, authoritative lesson/section/screen metadata to the provider. Generic screen actions retrieve only the actual current screen, avoiding distraction from adjacent passages. Explicit-question ranking, source text, system prompt and model settings are unchanged. Tests cover all 56 screens × 5 study actions, metadata serialization without arbitrary context/draft fields, gateway forwarding and safe decline without inference.

This fixes a real integration defect; it does not establish answer accuracy. The final matrix still fails on the explicit errors above. The rejected candidate was not added to the gateway's serving allowlist or made the default.

## Source-review correction

Reinspection of the supplied original Planning Lesson 3 pages 5–7, including the rendered hierarchy on page 7, confirms the activities → outputs → outcomes → goal hierarchy. That page alone does **not** assign a universal category to an isolated phrase such as improved officer skills. The earlier assessment treating that phrase alone as a decisive universal classification error was too broad and has been narrowed. Classification must identify the result level in the stated framework. This pass's HOLD rests on the clear hierarchy/evidence errors and invalid reference above, rather than that isolated phrase.

## Checks and limits

The full available build, content and automated regression commands passed. Nine support contract/security tests passed, including the new context/privacy checks. Actual loopback HTTPS access-control checks passed. Current static assets are compared against the existing deployed SHA256 manifest; backend-only changes require no new public preview. No deployment/alias mutation, course-content/media edit, progress-format change, dependency addition or shared-runtime setting change was performed. The attempted live alias recheck did not return during the review wait; PRODUCTION.json preserves that limit and the prior verified mappings.

Model-answer review here is a source-based engineering assessment. Human expert acceptance, physical Safari/iOS, native screen readers, voice listening and secure public AI connectivity remain separate outstanding gates. The prior backup and failed evaluations are preserved. A new final-source backup and independent restore receipt are referenced in the release report.

Backup location: `/Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD E Lap/Backups/CARANA-CBD-E-Learning/2026-11-19_081255Z-Run06-Followup01`. See its verification-receipt.json and SHA256SUMS for actual post-creation results and the final snapshot commit.
