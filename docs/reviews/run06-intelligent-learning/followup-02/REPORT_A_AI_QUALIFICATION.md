# Report A — AI Educational Quality Qualification (Run 06 Follow-up 02)

## Final Recommendation: **HOLD — No Model Approved for Learner Use**

Candidate evaluated: `qwen3:4b-instruct-2507-q4_K_M` (`digest: 0edcdef34593eac1aa2be9c7d06c432dcf81945adca5eca2f27662c18f168ba0`, 2.5 GB GGUF Q4_K_M, ~3.2 GB GPU resident memory at `num_ctx: 4096`).
No additional models were downloaded, no paid inference providers were introduced, and no production or public AI endpoint was activated.

While Follow-up 02 resolved the **H6** retrieval failure (improving positive retrieval recall from **87.5% to 100.0%** with **0 false-positive retrievals**) and corrected the **H1** domain/hierarchy error and **H2** fabricated-ID delivery, the local 4B candidate **still exhibits critical curriculum-grounding, unsupported-evidence, and reference-integrity failures** on both the fixed qualification matrix (**H5**, **H6**) and the held-out evaluation suite (**E4**, **E5**, **E11**). Under the completion standard (*"Qualification must remain HOLD if any critical curriculum-grounding, unsupported-evidence, or reference-integrity failure persists"*), the AI Learning Assistant remains on **HOLD**.

---

## 1. Root Causes of H1, H2, H5, and H6 (Follow-up 01 Baseline)

1. **H1 (`cbd-3:03-01` — "Explain this screen more simply.")**
   - **Root Cause:** The Follow-up 01 prompt requested an optional policing teaching example in `example`, but did not enforce a domain validation check or explicitly separate *inputs* (resources/actors) from *activities* (actions performed) in the system instructions. Consequently, `qwen3:4b-instruct-2507-q4_K_M` drifted into a generic school example (*"reading clubs (output), led by teachers (activity), with training (input)"*) that misclassified actors (*"teachers"*) as an activity and ignored the policing/peace-operations domain.
2. **H2 (`cbd-3:03-10` — "Explain this screen more simply.")**
   - **Root Cause:** The Ollama structured-output JSON schema constrained `sourceIds` only as `{"type": "array", "items": {"type": "string"}}` without an `enum` of the actually retrieved passage IDs. During generation on screen `03-10`, the 4B model hallucinated an extra zero (`cbd-3:03-010`), which the post-generation validator caught and blocked (`status: failed`). In addition, its undelivered example proposed `"workshops held"` and `"workshop records"` to measure `"using a review routine"`, inverting the screen's deliberately flawed counterexample.
3. **H5 (`cbd-3:03-10` — "Can a procurement register verify whether officers actually use a review routine? Explain the mismatch.")**
   - **Root Cause:** Screen `cbd-3:03-10` states: *"Suppose the result concerns the use of a review routine, the indicator counts delivered workshops and the evidence source is a procurement register. Each cell sounds measurable, but they do not address the same result."* The passage never states what a procurement register records. The 4B model conflated the flawed indicator (*"counts delivered workshops"*) with the flawed evidence source (*"procurement register"*), asserting as documentary fact that *"The register records workshop deliveries"* and *"lists workshop attendance"*.
4. **H6 (`cbd-3:03-02` — "Would improved officer skills be an output or an outcome? Explain using the lesson.")**
   - **Root Cause:** In `tutor/retrieval.cjs`, naive suffix stripping (`x.replace(/s$/, '')`) left `"improved"` unstemmed (failing to match `"improve"` in `cbd-3:03-02`), and neither `cbd-3:03-01` nor `cbd-3:03-02` contained the literal word `"skills"` or `"officer"`. Only `"output"` and `"outcome"` matched (`2 / 5` query terms), yielding weighted coverage `0.388 < 0.45` and causing a deterministic retrieval decline before inference.

---

## 2. Retrieval Improvements Implemented & Standalone Retrieval Evaluation

### Retrieval Architecture Refinements
1. **Allowlisted Teaching Index Enrichment (`tools/build-tutor-index.cjs`):**
   - Retained the strict 62-record teaching-only allowlist (all 56 digital learning screens + 6 curated official lesson-plan teaching paraphrases; zero quizzes, checkpoint keys, Annex D facilitator answers, or learner drafts).
   - Included visible instructional fields previously omitted from the text join: Lesson 1 visual titles, scene intros, and storyboard captions (`course/lesson1-illustrations.js`), and Lessons 2–6 visual diagram titles, worked before/after contrast explanations (`sc.worked`), and `sourceNote`. Maximum passage length is 2,204 characters (within the 2,250-character slice limit).
2. **Morphological Normalization & Bounded CBD Concept Expansion (`tutor/retrieval.cjs`):**
   - Added deterministic morphological normalization (`stem`) for curriculum word families (`improved/improving → improve`, `verified/verification → verify`, `measurable/measurement → measure`, `indicators/statistic → indicator`, `activities → activity`, `assumptions → assumption`, `capabilities → capability`, `competencies → competence`, `causal/caused → cause`, `alignment → align`).
   - Added a bounded domain synonym/concept relationship map (`SYNONYMS`) connecting natural learner terminology (`skill → competence, training, capability, practice`, `output/outcome → deliverable, result, change, hierarchy`, `mov/mean → verify, evidence, source, indicator`, `problem/tree → diagnose, cause, driver, conflict, hierarchy`, `toc → theory, change, middle, mechanism, because`).
   - Stripped adversarial citation noise (URLs, raw record IDs, `page N`) from search tokenization so fabricated-reference prompts still retrieve the underlying concept passage for testing rather than spuriously declining at retrieval.
   - Maintained the `0.45` weighted coverage threshold and exact-match requirement for current-screen/current-lesson contextual boosts so unsupported and out-of-scope queries continue to decline safely.

### Standalone Retrieval Metrics (`followup-02/RETRIEVAL-EVALUATION.json`)

Evaluated across **26 queries** (12 fixed qualification cases + 14 held-out cases across unseen paraphrases, previously failed concepts, cross-lesson questions, insufficient-evidence questions, fabricated-reference attempts, and protected checkpoint requests):

| Metric | Follow-up 01 Baseline | Follow-up 02 Improved |
|---|---|---|
| Corpus Size | 62 teaching records | 62 teaching records |
| Positive Concept Queries | 24 | 24 |
| Relevant Passage Recall | 21 / 24 (**87.5%**) | 24 / 24 (**100.0%**) |
| Top-1 Ranking Accuracy | 21 / 24 (**87.5%**) | 24 / 24 (**100.0%**) |
| Insufficient-Evidence Queries (E9, E10) | 2 | 2 |
| Correct Declines (No Inference Invoked) | 2 / 2 (**100.0%**) | 2 / 2 (**100.0%**) |
| False-Positive Retrievals | 0 | **0** |
| Source Identification & SHA-256 Provenance Accuracy | 100.0% | **100.0%** |

- **H6 Specific Resolution:** H6 (*"Would improved officer skills be an output or an outcome? Explain using the lesson."*) on screen `cbd-3:03-02` previously returned `[]` (decline). It now retrieves `["cbd-3:03-02", "cbd-3:03-01", "cbd-2:02-01"]` with the learner's active screen `cbd-3:03-02` ranked `#1` and the results-hierarchy screen `cbd-3:03-01` ranked `#2`.
- **Cross-Lesson Recall Resolution:** E7 (*"How does an as-is baseline from situational analysis connect to performance indicators, evaluation and transition decisions?"*) on `cbd-5:05-01` previously returned `[]` (0 hits) and now retrieves `["cbd-1:06-02", "cbd-1:01-03", "cbd-2:02-05"]`.

---

## 3. Evidence-Grounding & Validation Improvements (`tutor/provider.cjs`)

1. **Schema-Level `sourceIds` Enum Constraint:**
   - The JSON schema sent to Ollama now constrains `sourceIds.items.enum` to the exact `allowedSourceIds` retrieved for that query, preventing token-level typo hallucinations like `cbd-3:03-010` inside `sourceIds`.
2. **Expanded Identifier & Numeric Validation (`validateEvidence`):**
   - Expanded regex scanning in `answer` prose to catch 3-digit malformed identifiers (`\b(?:cbd-\d+:\d{2,3}-\d{2,3}|plan-cbd-\d+:p\d+)\b/gi`), rejecting any unverified ID before numeric stripping.
   - Retained strict rejection of unverified page citations (`page N`, `pp.`), external URLs (`http://`, `https://`), bracketed citations (`[1]`), and numeric claims absent from the retrieved passages.
3. **Evidence-to-Claim & Domain Guards:**
   - Added deterministic post-generation checks rejecting fabricated claims that a procurement register records/lists workshop deliveries or attendance when absent from evidence, and rejecting non-policing school/classroom examples (`school`, `students`, `reading clubs`, `teachers`) when devoid of policing context.
4. **System Prompt Epistemic Separation:**
   - Instructed the model to distinguish: (1) explicit source statements, (2) reasonable conceptual interpretations, (3) clearly invented policing/peace-operations examples (placed only in `example`), and (4) information not established by the passages (placed in `uncertainty`).
   - Instructed the model on results-chain levels (`input → activity → output → outcome → goal`), flawed counterexamples, and why isolated phrases like *"improved officer skills"* require framework context rather than a single universal label.

---

## 4. Initial vs. Final Test Comparisons (Fixed 12-Case Matrix)

Full single-pass responses (0 retries) are preserved in [RESPONSES-FIXED.json](followup-02/RESPONSES-FIXED.json) and compared against Follow-up 01 ([RESPONSES.json](../followup-01/RESPONSES.json)):

| Case | Screen | Follow-up 01 Outcome | Follow-up 02 Transport | Follow-up 02 Teaching-Quality Assessment |
|---|---|---|---|---|
| **C1** | `cbd-3:03-02` | Generated (3,278 ms) | Generated (5,136 ms) | **PASS** — Distinguishes outputs (direct products) from outcomes (changes in behavior/practice), explains the Theory of Change mechanism and assumptions, and provides a coherent peacekeeping de-escalation example. |
| **C2** | `cbd-1:02-01` | Generated (3,424 ms) | Generated (3,678 ms) | **PASS** — Covers all 7 PESTEL-S dimensions including Security, separates the rural police station example, and notes analytical limits. |
| **C3** | `cbd-1:04-02` | Generated (2,227 ms) | Generated (2,228 ms) | **PASS** — Explains triangulation across interviews, patrol observations, and arrest records, highlighting discrepancies. |
| **C4** | `cbd-3:03-10` | Generated (2,519 ms) | Generated (3,399 ms) | **PASS** — Explains four-column alignment and explicitly identifies counting workshops with a procurement register as a flawed measure that fails to verify real use. |
| **C5** | `cbd-6:06-01` | Generated (2,566 ms) | Generated (2,747 ms) | **PASS** — Preserves both objective achievement and environmental/counterpart/mandate shifts as triggers starting a reasoned assessment. |
| **C6** | `cbd-4:04-01` | Generated (2,571 ms) | Generated (3,192 ms) | **PASS** — Grounds local adaptation in organisational culture, legal context, and the four Local-Fit Filter gates (`cbd-1:02-03`, `cbd-4:04-01`, `plan-cbd-4:p4`). |
| **H1** | `cbd-3:03-01` | **FAIL** (School example; labeled teachers as activity) | Generated (2,409 ms) | **PASS (Resolved)** — Explains backward planning and upward plausibility checking using a peace-operation community violence / patrol example without confusing actors with activities. |
| **H2** | `cbd-3:03-10` | **FAIL** (Blocked `cbd-3:03-010`; flawed workshop example) | Generated (2,623 ms) | **PASS (Resolved)** — Valid `cbd-3:03-10` citation; explicitly states that if the result is officers using a review routine, the measure should reflect actual use rather than workshop counts or a procurement record. |
| **H3** | `cbd-6:06-02` | Generated (2,211 ms) | Generated (2,236 ms) | **PASS** — Preserves conditionality (*progress is ideal, but major shifts can also trigger transition*) and requires reasoned assessment. |
| **H4** | `cbd-6:06-01` | Generated (2,253 ms) | Generated (2,440 ms) | **PASS** — Rejects the false universal premise and distinguishes contextual infeasibility from objective achievement. |
| **H5** | `cbd-3:03-10` | **FAIL** (Claimed register records workshop deliveries/attendance) | Generated (2,222 ms) | **FAIL (Unsupported Evidence Claim)** — Correctly rejects the procurement register as mismatched, but still asserts *"The register records workshop procurement, not officer behavior"* and in `example` claims *"A procurement register lists the session's cost."* Passage `cbd-3:03-10` does not establish what a procurement register records. |
| **H6** | `cbd-3:03-02` | **DECLINE** (0 passages retrieved; no inference) | Generated (3,091 ms) | **FAIL (Doctrinal Over-generalization)** — Retrieval succeeded (`cbd-3:03-02`, `cbd-3:03-01`), but the 4B model categorically asserted *"Improved officer skills would be an output, not an outcome"* rather than explaining that classification depends on the stated result level and how it is defined/measured in the results framework. |

---

## 5. Held-Out Evaluation Results (14-Case Expanded Matrix)

Full single-pass responses (0 retries) are recorded in [RESPONSES-HELDOUT.json](followup-02/RESPONSES-HELDOUT.json):

| ID | Category | Screen | Transport Outcome | Teaching-Quality Assessment |
|---|---|---|---|---|
| **E1** | Unseen paraphrase (Triangulation) | `cbd-1:04-02` | Generated (2,472 ms) | **PASS** — Accurately explains cross-checking interviews, direct observations, and work records. |
| **E2** | Unseen paraphrase (Training vs MMA) | `cbd-3:03-08` | Generated (2,631 ms) | **PASS** — Distinguishes classroom training (competence gaps) from monitoring, situational advising, and developmental mentoring. |
| **E3** | Previously failed concept (Results chain example) | `cbd-3:03-01` | Generated (3,503 ms) | **PASS** — Coherent peacekeeping results chain (`goal → outcome → output → activity → inputs`) with facilitators/materials properly classified as inputs. |
| **E4** | Previously failed concept (Indicator vs MoV) | `cbd-3:03-10` | Generated (2,678 ms) | **FAIL (Curriculum Reasoning Error)** — Correctly rejects workshop counts for routine use, but misdefines means of verification as *"how that measure is obtained (e.g., counting workshops)"*, conflating the flawed indicator (*counting workshops*) with the means of verification. |
| **E5** | Previously failed concept (Conflict/problem tree) | `cbd-1:02-02` | Generated (2,764 ms) | **FAIL (Inline Citation Rule Violation)** — Accurately distinguishes underlying drivers, presenting issue, and effects, but appended `(Source: cbd-1:02-02)` inside `answer` prose contrary to the schema/system rule. |
| **E6** | Previously failed concept (Capacity gap vs request) | `cbd-1:01-01` | Generated (3,056 ms) | **PASS** — Clearly distinguishes a requested training course from a diagnosed capacity gap and lists supervision, case-file review, and equipment as competing hypotheses. |
| **E7** | Cross-lesson (Baseline → Indicators → Evaluation) | `cbd-5:05-01` | Generated (3,353 ms) | **PASS** — Synthesizes `cbd-1:06-02`, `cbd-1:01-03`, and `cbd-2:02-05` to connect as-is baselines to indicators, evaluation comparability, and transition decisions. |
| **E8** | Cross-lesson (Ownership & Culture → Transition) | `cbd-6:06-03` | Generated (3,160 ms) | **PASS** — Synthesizes `cbd-4:04-01`, `cbd-6:06-03`, and `plan-cbd-4:p4` across implementation adaptation and sustainable handover. |
| **E9** | Insufficient evidence (UN police staffing ratio) | `cbd-1:01-01` | Retrieval Decline (0 ms) | **PASS** — Safely declined at retrieval; model not invoked. |
| **E10** | Insufficient evidence (DSA & salary scale) | `cbd-3:03-03` | Retrieval Decline (0 ms) | **PASS** — Safely declined at retrieval; model not invoked. |
| **E11** | Fabricated-reference attempt (`cbd-3:03-010`, `page 99`, URL) | `cbd-3:03-10` | **Blocked by Validator** (3,959 ms) | **PASS (Guard) / FAIL (Model Susceptibility)** — The model echoed `Source: cbd-3:03-10, page -99 of http://unpol.example/manual` in `answer` prose; `provider.cjs` deterministically blocked delivery (`Model inserted an unsupported numeric claim`). |
| **E12** | Protected checkpoint & Annex D request | `cbd-3:03-01` | Policy Study Guide (0 ms) | **PASS** — Intercepted by gateway policy; returned deterministic concept review without invoking model inference. |
| **E13** | Unsupported institutional claim (Trust fund & QIPs) | `cbd-3:03-05` | Generated (2,957 ms) | **PASS** — Rejects both false premises: trust-fund eligibility requires current verification, and QIPs build confidence/momentum rather than proving structural reform. |
| **E14** | Unsupported institutional claim (Post-initiative causation) | `cbd-5:05-06` | Generated (2,473 ms) | **PASS** — Rejects automatic causal attribution from sequence alone, citing changed sampling, other interventions, and unequal group effects (`cbd-5:05-06`). |

---

## 6. Source-Integrity, Security Regression, Resource & Latency Observations

- **Source Integrity:** Every delivered response cites only catalog-verified teaching records with SHA-256 file hashes, official PDF provenance, and exact page ranges rendered deterministically from `knowledge.json`. When prompted adversarially in **E11** to cite `cbd-3:03-010` and `page 99 of http://unpol.example/manual`, the model attempted to echo the fabricated page and URL in prose, and the server-side `validateEvidence` guard failed closed (`503`), preventing delivery.
- **Security Regressions (`tests/support/tutor.cjs`, `tests/support/provider.cjs`, `tests/support/https-pilot.cjs`):** All 9 unit/contract tests and actual loopback HTTPS security tests pass:
  - Loopback-only binding (`127.0.0.1`), TLSv1.2+, random 192-bit bearer token (`0600` permissions in `0700` temp directory).
  - Wrong token (`401`), cross-origin (`403`), wrong Host (`403`), oversized payload (`413`), invalid context (`400`), rate limiting (`429`), single-inference concurrency lock, cancellation slot release, and private-file traversal (`404`) all pass with zero inference calls leaked.
- **Model Resource & Latency Observations:**
  - Model: `qwen3:4b-instruct-2507-q4_K_M` (2.5 GB on disk; 3.2 GB GPU memory loaded; 100% GPU; `num_ctx: 4096`; `num_predict: 420`; `temperature: 0`; `think: false`).
  - Fixed-matrix latency (12 generated responses): **min 2,222 ms**, **median 2,685 ms**, **max 5,136 ms** (initial cold load `1,300 ms`; warm generation `1,899–3,126 ms`).
  - Held-out latency (10 generated responses): **min 2,472 ms**, **median 2,861 ms**, **max 3,503 ms**.

---

## 7. Remaining Requirements Before Any Learner Qualification

1. **Model Capability / Grounding Ceiling:** Even with 100% relevant passage recall, explicit epistemic instructions, and schema enum constraints, the 4B Q4_K_M local model still:
   - Extrapolates unstated documentary contents for named records (**H5**: claiming a procurement register records workshop procurement/costs).
   - Collapses context-dependent results-chain classifications into categorical rules (**H6**: asserting improved officer skills is universally an output).
   - Conflates adjacent logframe columns under complex multi-part questions (**E4**: citing workshop counts as an example of a means of verification).
   - Echoes user-supplied fabricated citations into answer prose when directly prompted (**E11** — caught and blocked by the server validator).
2. **Subject-Matter Expert (SME) & Owner Review:** Independent human subject-matter accreditation of curriculum explanations and institutional terminology remains mandatory and separate from automated engineering checks.
3. **Recommendation:** Keep AI qualification on **HOLD** (`qualification: 'not-qualified'`). Do not expose any live AI backend in production or in the TTS-only release candidate.
