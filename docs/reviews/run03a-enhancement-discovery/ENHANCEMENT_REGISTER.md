# Enhancement register

Reviewed target: aff6ab0. Evidence IDs map to VISUAL_EVIDENCE/INDEX.md. All proposals are unimplemented. Scores are transparent reviewer estimates: educational impact30%, learner experience25%, institutional value15%, feasibility/effort15%, risk/maintainability15%. Each uses1–5 (5 is most valuable, easiest or safest); total = sum(weight × score /5). Essential correctness/data-safety findings take precedence over the preference score. Effort is combined engineering workdays unless roles are specified, not a supplier quotation.

| ID | Category / severity | Enhancement | Score /100 | Estimate |
|---|---|---|---|---|
| E01 | Essential correction / High | One course-home route | 94.0 | 1–2 days |
| E02 | Essential correction / High | Preserve draft work across content revisions | 91.0 | 3–5 days |
| E03 | Essential correction / High | Make an export actually recoverable by learners | 82.0 | 5–8 days |
| E09 | High-value improvement / High | A reviewable handoff to the existing workbench | 88.0 | 6–10 days |
| E10 | High-value improvement / High | Vary the learning rhythm by cognitive task | 88.0 | 6–9 days |
| E22 | High-value improvement / High | Independent assisted-user acceptance | 88.0 | 4–7 QA/accessibility days plus participants by approval |
| E06 | High-value improvement / Medium | Name draft feedback honestly and make it usable | 86.0 | 0.5–1.5 days |
| E11 | High-value improvement / High | Give frameworks their actual relational structure | 86.0 | 8–12 days |
| E08 | Transformative opportunity / High | A connected evidence-to-decision notebook | 85.0 | 20–30 development days +8–12 design/expert days +6–10 QA days |
| E12 | Transformative opportunity / High | Transparent review of learner reasoning | 85.0 | 12–18 development days +8–12 expert/design days +5–8 QA days |
| E07 | High-value improvement / Medium | Create a readable study-work export | 83.0 | 2–3 days |
| E16 | High-value improvement / High | Use checkpoints for retrieval and justification | 83.0 | 5–8 days plus item-expert review |
| E18 | High-value improvement / Medium | A bounded institutional demo, not a course inside a course | 83.0 | 3–5 days |
| E04 | High-value improvement / Medium | Make resume and completion precise | 82.0 | 1–2 days |
| E05 | High-value improvement / Medium | Put mobile learning before the full navigation rail | 82.0 | 1–3 days |
| E13 | Transformative opportunity / High | An evolving, bounded professional case | 82.0 | 15–25 development days +10–15 expert/design days +6–10 QA days |
| E14 | Meaningful creative enhancement / Medium | Teach ties and sensitivity explicitly | 80.0 | 2–4 days |
| E15 | Meaningful creative enhancement / Medium | Turn risk rating into response reasoning | 80.0 | 4–6 days |
| E17 | Meaningful creative enhancement / Medium | Storyboard before producing the14 new scenes | 80.0 | 3–5 design/expert days; production separately authorised |
| E23 | Meaningful creative enhancement / Medium | Bring construction back into Lesson1 selectively | 80.0 | 4–7 days |
| E26 | Optional refinement / Medium | Expose local drafting limits and intent | 80.0 | 1–2 days |
| E19 | High-value improvement / Medium | Separate reading, practice and practical review | 77.0 | 4–6 days |
| E24 | High-value improvement / Medium | Versioned content contract and factual build checks | 77.0 | 3–5 days |
| E25 | Optional refinement / Medium | Explain revisions once with useful differences | 74.0 | 2–3 days |
| E30 | Defer / Low | Do not commission every media opportunity at once | 72.0 | Quote only after scripts/storyboards accepted |
| E20 | Optional refinement / Low | Readable source information on demand | 66.0 | 1–2 days |
| E21 | Defer pending operational requirement / Medium | Define a deliberate offline distribution profile | 65.0 | 6–10 days for a bounded pack; caching12–20 days |
| E27 | Optional refinement / Low | Motion only for meaningful state change | 57.0 | 1–2 days after instrument redesign |
| E28 | Reject / High | Do not auto-grade policing judgement with a new AI service | 28.0 | Not estimated as an authorised build |
| E29 | Reject/defer / Medium | Do not migrate frameworks or require accounts now | 28.0 | Not part of next run |
| E31 | Essential correction / High | Stabilise the initial catalog layout | 82.0 | 1–2 days |

## E01 — One course-home route

**Where:** Catalog → Lesson1 → Course home. **Disposition:** Essential correction; High.
**Observed evidence:** Native Safari and probe: five “coming later” notices, zero platform return links on old home.
**Proposal and benefit:** Keep Lesson1 teaching untouched; add a consistent return-to-CBD catalog and reconcile review availability labels. Learners retain orientation and discover the actual next lessons.
**Interaction/design:** Header return restores catalog with focus on Lesson1 card; distinguish lesson home from curriculum home.
**Complexity / regression:** 1–2 days; Low risk. Dependencies: Owner agrees navigation labels; preserve old root/activity routes.
**Acceptance:** Catalog→L1→home→L2 works on keyboard/mobile; old exercise routes and progress keys unchanged.
**Scores:** educational/learner/institutional/feasibility/risk = [4, 5, 5, 5, 5]; weighted 94.0/100.

## E02 — Preserve draft work across content revisions

**Where:** All nine builder screens; safeProgress version change. **Disposition:** Essential correction; High.
**Observed evidence:** Synthetic prior-version draft missing from downloaded export; only checkpoint metadata survived.
**Proposal and benefit:** Archive bounded prior-version drafts before resetting current mastery; show a version-difference notice and offer export before transition. Avoid loss of learner-created work without awarding new mastery.
**Interaction/design:** A previous-work panel keeps text read-only until explicitly copied into a revised scaffold.
**Complexity / regression:** 3–5 days; Medium risk. Dependencies: Version schema, archived text bounds, recovery tests.
**Acceptance:** Two version upgrades preserve all old text; current checkpoints reset; hostile/oversized input rejected; no silent overwrite.
**Scores:** educational/learner/institutional/feasibility/risk = [5, 5, 5, 4, 3]; weighted 91.0/100.

## E03 — Make an export actually recoverable by learners

**Where:** Platform export and save-error path. **Disposition:** Essential correction; High.
**Observed evidence:** Probe found no import control; exported JSON is a record, not an in-app restoration path.
**Proposal and benefit:** Provide local validated import with preview, merge/replace choice and a pre-import export; preserve original lab key separately. A browser-local product has a usable recovery route.
**Interaction/design:** Choose file→validate→show lesson/version/draft differences→confirm local merge.
**Complexity / regression:** 5–8 days; Medium risk. Dependencies: E02; published data contract and negative fixtures.
**Acceptance:** Restore on a clean origin; mixed versions and duplicate drafts previewed; wrong files/corrupt JSON fail without losing existing work.
**Scores:** educational/learner/institutional/feasibility/risk = [4, 5, 5, 3, 3]; weighted 82.0/100.

## E04 — Make resume and completion precise

**Where:** CBD catalog and both learning shells. **Disposition:** High-value improvement; Medium.
**Observed evidence:** Live catalog shows “0 checkpoints recorded” with “Resume / review”; L1 has a separate progress system.
**Proposal and benefit:** Show last meaningful position, checkpoint denominator and current-version state; label Start, Resume, Review completed checkpoint explicitly. Reduce uncertainty without pretending there is one certified course score.
**Interaction/design:** Card says “Resume: Objective briefing · 1/3 checks”; L1 progress adapter reads its existing key.
**Complexity / regression:** 1–2 days; Low risk. Dependencies: Read-only adapters; no storage migration.
**Acceptance:** Fresh/reading/partial/passed/migrated states have distinct labels; records remain separate and accurately described.
**Scores:** educational/learner/institutional/feasibility/risk = [3, 5, 4, 5, 4]; weighted 82.0/100.

## E05 — Put mobile learning before the full navigation rail

**Where:** L2–6 mobile/tablet shell. **Disposition:** High-value improvement; Medium.
**Observed evidence:** Probe puts L3 first teaching heading at785px on390px viewport and716px at768px; full rail precedes it.
**Proposal and benefit:** Collapse the rail to a compact section selector and keep progress/export available behind a labelled disclosure. Learners see the problem before repeated navigation.
**Interaction/design:** One lesson/section line above content; expand path on demand; retain focus and aria-current.
**Complexity / regression:** 1–3 days; Low risk. Dependencies: Existing approved layout/tokens.
**Acceptance:** At390px first heading appears within first viewport; all path/export controls remain keyboard/touch reachable; 320px reflow.
**Scores:** educational/learner/institutional/feasibility/risk = [3, 5, 4, 5, 4]; weighted 82.0/100.

## E06 — Name draft feedback honestly and make it usable

**Where:** Nine builders; especially02-04,03-10. **Disposition:** High-value improvement; Medium.
**Observed evidence:** All fields containing “x” receive the same self-review prompt; text explicitly says not automatically approved.
**Proposal and benefit:** Rename action “Open self-review prompts”; display criteria beside each field, not as one generic paragraph. Sets accurate expectations and helps learners inspect their own reasoning.
**Interaction/design:** Missing fields receive linked prompts; completed fields show a concise self-check list and optional illustrative approach.
**Complexity / regression:** 0.5–1.5 days; Low risk. Dependencies: Expert-approved prompts; preserve no automatic quality grade.
**Acceptance:** Labels never imply semantic assessment; x/blank/strong drafts receive the appropriate completeness state and same transparent human rubric.
**Scores:** educational/learner/institutional/feasibility/risk = [4, 4, 4, 5, 5]; weighted 86.0/100.

## E07 — Create a readable study-work export

**Where:** All builder outputs and course export. **Disposition:** High-value improvement; Medium.
**Observed evidence:** Current export is raw JSON; no learner-facing review sheet connects the nine drafts.
**Proposal and benefit:** Add a printable/local HTML summary containing lesson, source, drafted fields, uncertainty and next practical task; retain JSON for recovery. Learners and trainers can use the outputs in discussion.
**Interaction/design:** Preview a print sheet; select lessons; retain pending/unvalidated labels; no upload or account.
**Complexity / regression:** 2–3 days; Low risk. Dependencies: Stable draft labels; E02 must precede cross-version inclusion.
**Acceptance:** Readable A4/PDF print output; long/Arabic text safe; HTML escaped; JSON unchanged; no facilitator solution included.
**Scores:** educational/learner/institutional/feasibility/risk = [4, 4, 5, 4, 4]; weighted 83.0/100.

## E08 — A connected evidence-to-decision notebook

**Where:** L1 matrix→L2 objective→L3 logframe→L5 evaluation→L6 handover. **Disposition:** Transformative opportunity; High.
**Observed evidence:** Repeated invented review-routine context has no linked learner artifact; each scaffold begins independently.
**Proposal and benefit:** Introduce a bounded local evidence notebook linking a finding, its uncertainty, a chosen objective, plan, review and transfer responsibility. Develops traceable reasoning across the CBD cycle.
**Interaction/design:** Reuse a learner-selected finding with explicit provenance; flag unsupported links; preserve alternative interpretations.
**Complexity / regression:** 20–30 development days +8–12 design/expert days +6–10 QA days; Medium–High risk. Dependencies: E02/E03; stable IDs; learner/facilitator evidence boundary.
**Acceptance:** Follow one invented evidence item end to end, revise it and see downstream review flags; preserve alternate drafts and export; no AI correctness verdict.
**Scores:** educational/learner/institutional/feasibility/risk = [5, 5, 5, 2, 3]; weighted 85.0/100.

## E09 — A reviewable handoff to the existing workbench

**Where:** 02-06→Module2;03-07→Module3;05-05→Module5;06-06→Module6. **Disposition:** High-value improvement; High.
**Observed evidence:** Practical links work, but drafts are not mapped into workbench fields; learner must re-enter context.
**Proposal and benefit:** Begin with a labelled handoff sheet and field mapping; later add explicit user-approved local copy with merge preview. Reduces transcription effort while preserving original exercises and ownership.
**Interaction/design:** Show “what you have / what the activity asks / what remains”; never write to lab storage on opening a link.
**Complexity / regression:** 6–10 days; Medium risk. Dependencies: E07 then E02/E03; original activity schemas and consent.
**Acceptance:** Handoff previews exact fields; cancel leaves lab bytes/state unchanged; copied values remain learner-authored; all standalone modules still function.
**Scores:** educational/learner/institutional/feasibility/risk = [5, 5, 5, 3, 3]; weighted 88.0/100.

## E10 — Vary the learning rhythm by cognitive task

**Where:** All38 expanded screens. **Disposition:** High-value improvement; High.
**Observed evidence:** All38 repeat concept reveal→points→transcript→optional tool→decision→takeaway; mobile median main height3.1 viewports.
**Proposal and benefit:** Use three deliberate patterns: explain/compare, investigate/decide, construct/reflect; remove duplicate headings and redundant prompts. Variety follows the task and reduces avoidable scrolling.
**Interaction/design:** A short orientation names the task; tools can lead a construction screen; keep optional explanations adjacent.
**Complexity / regression:** 6–9 days; Medium risk. Dependencies: Screen-purpose inventory; retain all source content/transcripts.
**Acceptance:** Every screen retains objective/source/feedback; no hidden required content; comparative screenshots and scroll/task tests at390/768/1440.
**Scores:** educational/learner/institutional/feasibility/risk = [5, 5, 4, 3, 4]; weighted 88.0/100.

## E11 — Give frameworks their actual relational structure

**Where:** 02-01 alignment;03-10 logframe;04-05 SARA;06-03 principles. **Disposition:** High-value improvement; High.
**Observed evidence:** New “chain/compare/cycle” styling still uses similar text buttons; columns and feedback loops remain mostly prose.
**Proposal and benefit:** Build specific system, row/column and iteration representations using current semantic HTML/SVG conventions. A learner sees which relationships matter rather than a list of terms.
**Interaction/design:** Logframe shows result/measure/source/assumption across one row; SARA allows returning with new evidence; accessible text equivalents.
**Complexity / regression:** 8–12 days; Medium risk. Dependencies: E10; source-expert review of each relationship.
**Acceptance:** User can explain a relationship without opening every definition; keyboard/touch equivalents and no color-only/drag-only meaning.
**Scores:** educational/learner/institutional/feasibility/risk = [5, 4, 5, 3, 4]; weighted 86.0/100.

## E12 — Transparent review of learner reasoning

**Where:** 02-04 SMART;03-10 logframe;04-02 message;05-04 response;06-05 handover. **Disposition:** Transformative opportunity; High.
**Observed evidence:** Completeness feedback is accurate but cannot identify a weak result/measure link or unsupported claim.
**Proposal and benefit:** Add transparent self/peer/facilitator rubrics and revision comparison. Start with authored checks, not an AI grade. Turns drafted text into an inspectable learning product.
**Interaction/design:** Learner marks evidence for each criterion, requests a peer challenge and records a reasoned revision; reviewer identity optional/local.
**Complexity / regression:** 12–18 development days +8–12 expert/design days +5–8 QA days; Medium risk. Dependencies: E07/E08; permissions for any future sharing; agreed rubric.
**Acceptance:** No machine semantic pass; show criteria and unresolved judgements; blank/x drafts cannot be represented as externally reviewed; offline local mode preserved.
**Scores:** educational/learner/institutional/feasibility/risk = [5, 5, 5, 2, 3]; weighted 85.0/100.

## E13 — An evolving, bounded professional case

**Where:** 1.1 diagnosis→2.3 priorities→4.7 revision→5.6 interpretation→6.7 dialogue. **Disposition:** Transformative opportunity; High.
**Observed evidence:** Examples recur but choices do not change later information or demand revisiting an earlier judgement.
**Proposal and benefit:** Use a small expert-authored invented case with two evidence updates and two defensible paths; keep it separate from official scenario solutions. Practises adapting professional judgement under uncertainty.
**Interaction/design:** Record initial hypothesis, reveal contradictory information, revise plan with reasons and compare consequences.
**Complexity / regression:** 15–25 development days +10–15 expert/design days +6–10 QA days; Medium–High risk. Dependencies: E11/E12; case authorship and review; no procedural fiction represented as doctrine.
**Acceptance:** At least two reasoned paths, no simplistic optimal score; state/reset/accessibility tests; debrief exposes assumptions without revealing facilitator keys.
**Scores:** educational/learner/institutional/feasibility/risk = [5, 5, 5, 2, 2]; weighted 82.0/100.

## E14 — Teach ties and sensitivity explicitly

**Where:** 02-03 priority lab. **Disposition:** Meaningful creative enhancement; Medium.
**Observed evidence:** All-zero weights produce two0 totals presented as an ordered list; ties have no explicit interpretation.
**Proposal and benefit:** Label ties and zero-information weighting; let learners compare two weighting sets and state a reason for preference. Prevents arithmetic from appearing to settle professional priority.
**Interaction/design:** Disable rank language when all weights are zero; show constraints and before/after rank movement.
**Complexity / regression:** 2–4 days; Low risk. Dependencies: Source separation from official participant chart.
**Acceptance:** Zero/all-equal/tied values have explicit feedback; constraint cannot disappear behind a total; same result via keyboard.
**Scores:** educational/learner/institutional/feasibility/risk = [4, 4, 4, 4, 4]; weighted 80.0/100.

## E15 — Turn risk rating into response reasoning

**Where:** 03-06 matrix and03-07 contingency. **Disposition:** Meaningful creative enhancement; Medium.
**Observed evidence:** Changing likelihood/impact updates a product and generic paragraph; no prevention/impact response is represented in the grid.
**Proposal and benefit:** Add one invented risk and compare prevention, mitigation and contingency effects with rationale and owner. Connects classification with action rather than color/score.
**Interaction/design:** Keep source-defined3×3 axes; show selected current/residual assumptions and a review trigger, never automatic acceptance.
**Complexity / regression:** 4–6 days; Medium risk. Dependencies: Expert ratings; E11; safeguards against false precision.
**Acceptance:** Low-likelihood/severe event still prompts action; no universal acceptance threshold; accessible table alternative.
**Scores:** educational/learner/institutional/feasibility/risk = [5, 4, 4, 3, 3]; weighted 80.0/100.

## E16 — Use checkpoints for retrieval and justification

**Where:** All78 checkpoint items across six lessons. **Disposition:** High-value improvement; High.
**Observed evidence:** Fresh journeys pass; retries can converge by feedback, while reasons are not retained; L1 and later feedback differ.
**Proposal and benefit:** Retain mastery thresholds; add a short rationale/retrieval prompt for selected applied items and delayed return after a meaningful error. Distinguishes remembered reasoning from answer-position convergence.
**Interaction/design:** After a relevant wrong choice, link to a precise concept and ask for a brief reason before another attempt; no essay auto-score.
**Complexity / regression:** 5–8 days plus item-expert review; Medium risk. Dependencies: Item blueprint; E12; maintain saved completion compatibility.
**Acceptance:** No reduction in standard; unknown/incorrect/correct/review/refresh paths pass; expert maps each item to an objective and judges ambiguity.
**Scores:** educational/learner/institutional/feasibility/risk = [5, 4, 5, 3, 3]; weighted 83.0/100.

## E17 — Storyboard before producing the14 new scenes

**Where:** All cinematic specifications; especially03-04,04-01 and06-06. **Disposition:** Meaningful creative enhancement; Medium.
**Observed evidence:** Three existing scenes pair context and concept; new briefs repeat meetings/blank documents and some teaching prompts are generic per lesson.
**Proposal and benefit:** Produce small non-final storyboards after the interaction design; make each scene pose a different observable dilemma; stage optional scenes. Preserves cinematic quality while avoiding repetitive costly imagery.
**Interaction/design:** Place an observation prompt before the image and a return question after the concept; retain around2–3 useful opportunities per lesson.
**Complexity / regression:** 3–5 design/expert days; production separately authorised; Low risk. Dependencies: E10/E13; image rights and cost authorization.
**Acceptance:** Owner compares storyboard purposes, alt text and placement; no scene ships merely to meet a quota; files/rights/alt audited.
**Scores:** educational/learner/institutional/feasibility/risk = [4, 4, 5, 3, 4]; weighted 80.0/100.

## E18 — A bounded institutional demo, not a course inside a course

**Where:** platform/demo.html and nested gallery/course iframe. **Disposition:** High-value improvement; Medium.
**Observed evidence:** Selector can open the entire gated Lesson2 inside a750px iframe; long page mixes evidence and funding.
**Proposal and benefit:** Create a three-minute guide: problem→one evidence contradiction→one learner output→honest readiness/partnership ask. Stakeholders see the product’s educational value without becoming lost in navigation.
**Interaction/design:** Use actual isolated components or fixed steps; offer full course separately; evidence/status legend stays visible.
**Complexity / regression:** 3–5 days; Low–Medium risk. Dependencies: E07/E11; agree stakeholder audience.
**Acceptance:** All demo paths finish without checkpoint gating or nested-scroll traps; claims match evidence; budgets unchanged unless scoped.
**Scores:** educational/learner/institutional/feasibility/risk = [4, 4, 5, 4, 4]; weighted 83.0/100.

## E19 — Separate reading, practice and practical review

**Where:** Catalog, rails and final lesson screens. **Disposition:** High-value improvement; Medium.
**Observed evidence:** Only checkpoint completion is recorded; tools are optional and a blank draft can be skipped.
**Proposal and benefit:** Display a lightweight preparation checklist: concepts explored, draft present, self-review done, practical discussion pending. Makes the learning journey legible without equating participation and competence.
**Interaction/design:** Learner-controlled checklist, no compulsory extra score and no claims of observed workplace skill.
**Complexity / regression:** 4–6 days; Medium risk. Dependencies: E04/E12; scope agreed by owner.
**Acceptance:** A blank/skipped/passed path is accurately labelled; access remains independent; no inflation of qualification.
**Scores:** educational/learner/institutional/feasibility/risk = [4, 4, 4, 3, 4]; weighted 77.0/100.

## E20 — Readable source information on demand

**Where:** Every expanded screen footer. **Disposition:** Optional refinement; Low.
**Observed evidence:** Raw filenames and page strings provide traceability but look like development metadata during study.
**Proposal and benefit:** Show a compact source label with a disclosure for title/edition/pages; keep internal hashes in manifests. Less reading clutter with intact provenance.
**Interaction/design:** “Source: CBD Lesson3, pp5–7” opens citation detail; do not publish facilitator PDF.
**Complexity / regression:** 1–2 days; Low risk. Dependencies: Public reference policy.
**Acceptance:** Every source remains reachable and edition clear; no private path/facilitator material appears.
**Scores:** educational/learner/institutional/feasibility/risk = [2, 3, 3, 5, 5]; weighted 66.0/100.

## E21 — Define a deliberate offline distribution profile

**Where:** New JSON runtime versus independent original workbenches. **Disposition:** Defer pending operational requirement; Medium.
**Observed evidence:** Local-served build works; this is not evidence of reliable cached offline return after internet loss.
**Proposal and benefit:** Specify either a downloadable local pack or a versioned offline cache only after operating context is agreed. Avoids misleading offline expectations and stale mixed lessons.
**Interaction/design:** Package integrity and update notice first; any service worker requires atomic asset-version recovery.
**Complexity / regression:** 6–10 days for a bounded pack; caching12–20 days; Medium–High risk. Dependencies: Owner identifies device/storage topology; media size and rights.
**Acceptance:** Disconnect/restart/update/rollback under agreed topology; no stale script/audio pairing; original workbenches preserved.
**Scores:** educational/learner/institutional/feasibility/risk = [3, 4, 5, 2, 2]; weighted 65.0/100.

## E22 — Independent assisted-user acceptance

**Where:** Keyboard, screen-reader, touch and error/recovery journeys. **Disposition:** High-value improvement; High.
**Observed evidence:** Current sampled Axe reports are clean; no full assistive-technology or physical-device acceptance is established.
**Proposal and benefit:** Run a bounded native Safari/VoiceOver and physical iOS/Android acceptance protocol before any compliance claim. Finds reading/focus/form issues automation misses.
**Interaction/design:** Test navigation, feedback announcements, long drafts, resizing, table scrolling and recovery with representative users when authorised.
**Complexity / regression:** 4–7 QA/accessibility days plus participants by approval; Low risk. Dependencies: E01/E05; explicitly not the deferred field-effectiveness pilot.
**Acceptance:** Document task outcomes and unresolved access barriers; no full WCAG claim from Axe alone.
**Scores:** educational/learner/institutional/feasibility/risk = [4, 5, 5, 3, 5]; weighted 88.0/100.

## E23 — Bring construction back into Lesson1 selectively

**Where:** 1.2 lenses,4.2 triangulation,5.2 matrix,6.2 baseline. **Disposition:** Meaningful creative enhancement; Medium.
**Observed evidence:** L1 has richer framework identity and audio, but most outputs stop at exploration/choice.
**Proposal and benefit:** Use the shared bounded draft pattern for a single evidence note and uncertainty explanation, preserving approved visuals/audio. Connects the best Run02 innovation with the approved opening experience.
**Interaction/design:** Record observation/source/uncertainty beside triangulation, then optionally select a matrix cell.
**Complexity / regression:** 4–7 days; Medium risk. Dependencies: E08; owner specifically approves any Lesson1 edit.
**Acceptance:** No Lesson1 text/audio/key regression; one output can feed a chosen next task without exposing scenario answers.
**Scores:** educational/learner/institutional/feasibility/risk = [5, 4, 4, 3, 3]; weighted 80.0/100.

## E24 — Versioned content contract and factual build checks

**Where:** tools/validate-content.cjs, two lesson JSON files, duplicated shells. **Disposition:** High-value improvement; Medium.
**Observed evidence:** Data-driven core is practical; validation mainly checks shape/counts, and legacy/shared shells drift in copy and state.
**Proposal and benefit:** Document one content contract and use stable section/screen IDs for changes; add cross-route/status and migration tests. Reduces regressions without a framework rewrite.
**Interaction/design:** Keep data files initially; add schema/editor tooling only when authors need it.
**Complexity / regression:** 3–5 days; Low–Medium risk. Dependencies: E02/E04; content-owner workflow.
**Acceptance:** Invalid source links/status/version references fail; edits do not reorder saved work silently; two-shell routes covered.
**Scores:** educational/learner/institutional/feasibility/risk = [3, 4, 5, 4, 4]; weighted 77.0/100.

## E25 — Explain revisions once with useful differences

**Where:** All screens after a content-version change. **Disposition:** Optional refinement; Medium.
**Observed evidence:** The version notice repeats above every screen and states checkpoint retention but not draft consequences.
**Proposal and benefit:** Show a persistent concise revision badge plus a detailed difference summary on first entry. Learners understand why review is needed without rereading a full warning.
**Interaction/design:** List changed screens, retained notes and checks to repeat; dismissal does not erase access.
**Complexity / regression:** 2–3 days; Low risk. Dependencies: E02 must be resolved first.
**Acceptance:** Migrated/fresh/return states show accurate information; no claim old drafts survive until they do.
**Scores:** educational/learner/institutional/feasibility/risk = [3, 4, 4, 4, 4]; weighted 74.0/100.

## E26 — Expose local drafting limits and intent

**Where:** Nine text scaffolds;1200-character fields. **Disposition:** Optional refinement; Medium.
**Observed evidence:** Length is capped in UI/load validation but there is no remaining-count cue; generic green feedback resembles success.
**Proposal and benefit:** Show remaining characters near the limit and neutral self-review status; retain safe local text guidance. Avoids surprise truncation and over-reading a completion cue.
**Interaction/design:** Counter appears near limit; no remote analysis or new data collection.
**Complexity / regression:** 1–2 days; Low risk. Dependencies: E06; text-scaling/RTL checks.
**Acceptance:** Pasted oversized content explains the cap; punctuation/RTL safe; no hidden silent shortening across restore.
**Scores:** educational/learner/institutional/feasibility/risk = [3, 4, 4, 5, 5]; weighted 80.0/100.

## E27 — Motion only for meaningful state change

**Where:** Concept selection, risk cell and field review. **Disposition:** Optional refinement; Low.
**Observed evidence:** Current movement is restrained; no evidence of a general animation problem.
**Proposal and benefit:** If added, use brief highlight/connector emphasis for changed evidence or parameter effect. Attention follows the consequence of an action.
**Interaction/design:** 150–250ms state emphasis with reduced-motion instant alternative, no delayed content.
**Complexity / regression:** 1–2 days after instrument redesign; Low risk. Dependencies: E11/E15 first.
**Acceptance:** No content hidden waiting for animation; keyboard/reduced-motion equivalent; no added motion solely for premium appearance.
**Scores:** educational/learner/institutional/feasibility/risk = [2, 3, 2, 4, 4]; weighted 57.0/100.

## E28 — Do not auto-grade policing judgement with a new AI service

**Where:** All open drafting tasks. **Disposition:** Reject; High.
**Observed evidence:** Local scaffolds explicitly avoid semantic grading; no rubric-validity evidence or external-data permission exists.
**Proposal and benefit:** Retain transparent human judgement; reject automatic pass/fail and unapproved external draft transmission. Protects integrity, privacy and institutional credibility.
**Interaction/design:** Possible future advisory hints require separate evidence, consent and uncertainty controls.
**Complexity / regression:** Not estimated as an authorised build; High risk. Dependencies: Explicit future scope/privacy/validation decision.
**Acceptance:** No AI-generated certification, opaque score or new provider egress in the next release.
**Scores:** educational/learner/institutional/feasibility/risk = [1, 2, 2, 1, 1]; weighted 28.0/100.

## E29 — Do not migrate frameworks or require accounts now

**Where:** Static platform and curriculum readiness entries. **Disposition:** Reject/defer; Medium.
**Observed evidence:** The present core renders another curriculum fixture; no present blocker justifies an LMS/auth rewrite.
**Proposal and benefit:** Keep incremental shared components; defer accounts, SCORM/xAPI and CMS migration until an institutional integration requirement exists. Preserves speed and no-login access while containing operational cost.
**Interaction/design:** Agree an interoperability contract before selecting infrastructure.
**Complexity / regression:** Not part of next run; High risk. Dependencies: Institutional requirements and data ownership.
**Acceptance:** No new compulsory login, tracking or unrelated dependency in the bounded improvement release.
**Scores:** educational/learner/institutional/feasibility/risk = [1, 2, 2, 1, 1]; weighted 28.0/100.

## E30 — Do not commission every media opportunity at once

**Where:** Fourteen specifications and38 new transcripts. **Disposition:** Defer; Low.
**Observed evidence:** Specifications are not actual media; current validation/rights and scene differentiation remain open.
**Proposal and benefit:** Validate the changed interaction and commission a small approved batch first. Avoids paying for narration/art that must be regenerated after authoring changes.
**Interaction/design:** Joint script/media hash governance and staged listening/visual acceptance.
**Complexity / regression:** Quote only after scripts/storyboards accepted; Low if staged risk. Dependencies: E17; explicit generation-cost permission and rights.
**Acceptance:** No automatic generation during build; source/recording version pairs and actual acceptance recorded.
**Scores:** educational/learner/institutional/feasibility/risk = [3, 3, 4, 4, 5]; weighted 72.0/100.

## E31 — Stabilise the initial catalog layout

**Where:** platform/index.html loading placeholder → rendered catalog.
**Observed evidence:** Three cold-cache Chromium trials each recorded lab CLS0.378 on the catalog; course landing0.000 under the same stated emulation. Not a field CWV result.
**Proposal and benefit:** Reserve a representative catalog skeleton/minimum geometry or render static catalog structure before hydration; avoid shifting the footer and primary regions when data appears. A lightweight page also feels visually settled and predictable.
**Interaction/design:** Show stable structural placeholders with immediately visible readable content; respect reduced motion.
**Complexity / regression:** 1–2 days; Low risk. Dependencies: Keep no-framework architecture; repeat the exact performance protocol.
**Acceptance:** Three cold-cache repeats under the documented protocol show no large catalog insertion shift; target lab CLS≤0.1 without delaying content or hiding it.
**Scores:** [3, 5, 4, 5, 4]; weighted 82.0/100.
