# Package B — interaction and progress specification

## Four independent meanings

| Category | Meaning and UI | What it does not establish |
|---|---|---|
| Position | Existing screen/section position and resume | Understanding or workplace competence |
| Exploration | Explanations X of Y explored; Explore / Explored / Viewing | A correct answer or passed checkpoint |
| Practice | Decision/classification attempted; existing practice draft saved | Mastery or approval of a draft |
| Checkpoint achievement | Existing correct-all section checks passed | Certification or professionally observed competence |

Course home and study summaries continue to prioritize checkpoint achievement. Screen/exploration indicators are not converted to a mastery percentage. Existing correct-all rules and practical confirmation requirements are unchanged. Lesson1 passed-checkpoint heading now says “Checkpoint passed.”

## Interaction contract

Explanatory nodes can be selected in any order. Current selection controls its original explanation; other explored nodes retain an explicit text badge. Reload/review restores the selected explanation and explored count. Native button text exposes the same state to assistive technology; aria-pressed marks current selection and aria-controls links the explanation region. Explanations remain polite status regions.

The first Continue attempt with remaining explanations offers Review remaining explanations or Continue anyway. Reviewing focuses the first unexplored node without falsely recording it as explored. Continue anyway records an explicit opt-out for this diagram revision. A second click on the still-available Continue control also explicitly proceeds. No further reminder appears for that revision after opting out. This never bypasses a checkpoint. The30-cell CBD matrix records optional exploration without requesting exhaustive opening of all cells. The2L1classification exercises retain actual result feedback and receive no explanatory reminder. Illustrations, audio controls and decorative interactions receive no click-completion requirement.

## Local state and compatibility

- New independent key: `carana_exploration_v1`, schema version1. No checkpoint/draft/workbench/Notebook keys were replaced or reformatted.
- Keyed by lesson ID, stable screen ID and explanatory-content fingerprint. Node IDs derive from semantic identifiers/labels, not array positions. Reordering nodes preserves history; changed explanatory content receives a fresh revision with previous records retained within bounds. Fingerprints identify content changes; they are not security hashes.
- Stores only node IDs, current selection, an explicit reminder choice and a practice-attempt boolean. No answer text, sensitive learner information or telemetry is added.
- Bound:192diagram records,80node IDs per record,3retained revisions per screen,96KiB JSON validation/storage/export budget. Old auxiliary revisions may be pruned; legacy checkpoint and draft stores are unaffected.
- Existing browser records with no auxiliary key remain valid. Malformed auxiliary records are ignored on load; wrong/oversized/malformed imports fail before applying course progress. Only validated identifiers and booleans are copied.
- Existing Lesson1 and Lessons2–6 JSON envelopes stay version1 and gain optional `exploration`. Old exports remain usable; absence of this optional field does not erase existing exploration. Current importers validate it and merge/replace only their own lesson scope. Older software may ignore the optional field; current recovery preserves it.
- Dry-run previews disclose diagram-history revisions separately from checkpoints. Existing pre-restore backups include auxiliary history. Merge unions explored IDs; replace is scoped to the corresponding lesson family. Saved history is read before writes/exports to retain other open-tab activity; sequential two-tab merging is tested, not a formal concurrency guarantee.
- Storage failure retains current in-memory history for export and shows a warning. Main course restoration and auxiliary restoration use separate storage writes; failure of the auxiliary write is reported separately and does not erase restored course progress. Closing a failed-save page without exporting can lose that unsaved auxiliary history.

Existing learning-tool draft, handoff, Notebook and original workbench schemas remain unchanged. Native screen-reader listening and physical-device validation remain pending; browser accessibility and responsive checks are evidence within their tested scope.
