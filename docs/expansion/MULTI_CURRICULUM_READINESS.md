# MMA and COP conversion readiness

This is a source-based conversion and architecture readiness record, not a claim that MMA or COP digital courses are implemented. The official source inventory is [CURRICULUM_INVENTORY.md](CURRICULUM_INVENTORY.md), with hashes and objective extracts in [sources.json](sources.json). Curriculum rights, formal adoption and human validation remain separate gates. No field pilot is initiated.

## Verified structures to preserve

MMA is Monitoring, Mentoring and Advising. The locally inspected July 2023 plans contain: 0 Course Introduction; 1 UN Mission Environment; 2 MMA in UN Peace Operations; 3.1 Cross-Cultural Communication; 3.2 Motivating; 3.3 Preventing & Coping with Resistance; 3.4 Introduction to Negotiation; 4.1 MMA Scenario Role-Plays; 4.2 Continued Development in MMA. Role-play and personal-development evidence cannot be reduced to MCQ completion. Preserve participant, role-player and facilitator information boundaries.

COP is Community-Oriented Policing. Plans contain: 0 Course Introduction; 1 Introduction to Community-Oriented Policing; 2 Four Essential Elements of COP and Practices; 3 Implementing Community-Oriented Policing; 4 Monitoring and Evaluation. The source set combines July/August 2023 version indicators and older footers; resolve lineage through designated curriculum review. COP consultation, service/response, mobilisation, SARA problem-solving and local action planning need their own applied work, not a copy of CBD's six-phase sequence.

MMA/COP course introductions use `1.45 hours`; do not silently convert that to decimal hours or minutes before clarification. Classroom durations in the inventory are not e-learning seat-time estimates. Official activity assessment requirements remain authoritative; an adaptation's mastery rule is a separate labelled study mechanism.

## Shared infrastructure and meaningful differences

The Run 01 `platform/` implementation uses configuration-driven catalog entries and JSON lesson references. The shared renderer reads sections, screens and checkpoint arrays dynamically, rather than imposing Lesson 1's 18 screens or six checkpoints. Its progress namespace `carana_learning_v1` isolates new lesson records by lesson ID and content version; the original `carana_cbd_course_v1` and original workbench state remain separate. The approved Lesson 1 is linked directly and retains its legacy renderer and narration experience.

Reuse the visual shell, orientation, semantic navigation, conceptual exploration, formative feedback, transcripts, checkpoint scaffolding, export, error handling and build/release integrity. Keep separate curriculum IDs, titles, objectives, source versions, section order, assessments, media provenance and activity destinations. Do not mark a curriculum available merely because it has a catalog entry. At this inspection, MMA/COP entries correctly carry conversion-readiness status and have no released digital lessons.

A practical second-curriculum acceptance test should load an unpublished fixture with a different lesson/section/screen/question count through the same renderer, exercise feedback, checkpoints and resume, and show that progress from CBD is unchanged. Synthetic fixtures must be labelled and excluded from published curriculum. Passing that infrastructure test demonstrates addability, not official MMA/COP conversion. Production readiness additionally requires actual source-aligned content and its own acceptance record.

## Conversion method

1. Select an actual official lesson/version and record hash, printed pages, objectives, expected participant outputs, timing/methods and protected role/facilitator content.
2. Map each objective to explanation, conceptual relationship, professional decision, evidence of application and debrief. Identify what still requires human observation or group work.
3. Build variable-length sections from that map. Use substantive judgement questions and meaningful feedback; document the adaptation's progression rule without implying UN qualification.
4. Prepare narration scripts and two or three cinematic opportunities only when they strengthen professional context. Reuse interactive concepts where their meaning fits the curriculum. Do not buy or generate assets without authorisation.
5. Connect the existing practical activity in a separate window when available; preserve role privacy and activity data/assessment rules. COP destination remains unresolved in the inspected scope.
6. Validate source alignment, media, keyboard/screen-reader use, reduced motion, reflow, malformed storage, all assessment states and activity return. Test actual classroom concurrency, paper materials and projector privacy for group work.
7. Release an isolated preview with explicit review status, open gates, immutable assets, source commit and restore-tested backup. Require owner release acceptance before assigning an umbrella domain or replacing any deployment.

## Effort and dependencies

For one bounded MMA or COP conversion example, allow an indicative 5–8 engineering days, 2–4 instructional-design days, 2–3 curriculum-review days and 2–4 QA/accessibility days, plus separately approved media and review lag. These are internal scoping assumptions, not quotations or measured productivity. A group-intensive lesson may require substantially more facilitator design, printing and hardware verification than a conceptual lesson. Do not multiply official classroom hours by a fixed screen conversion rate.

Before estimating complete MMA/COP programmes, agree exact lessons, digital/facilitated boundaries, languages, rights, media quantities, assessment authority and accessibility/service requirements. Shared component changes require Lesson 1 and CBD regression checks. Catalog deployment, DNS and institution-level use are distinct acceptance decisions. The [activity integration map](ACTIVITY_INTEGRATION_MAP.md) records the separate MMA project and COP discovery limitation.
