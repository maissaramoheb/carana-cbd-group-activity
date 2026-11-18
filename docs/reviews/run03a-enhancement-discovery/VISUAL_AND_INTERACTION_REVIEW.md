# Visual and Interaction Review — CARANA E-Learning (Run 03A)

**Reviewed Target:** `aff6ab0c003995a0b2382bb04c8083359ae81597`
**Scope:** Conceptual diagrams (Lesson 1 and Lessons 2–6), 3 produced cinematic illustrations + 14 unproduced specifications, and all 17 applied learning tools.

---

## 1. Conceptual Visualizations Review (`E11`, `E23`, `E27`)

### A. Lesson 1 Conceptual Visualizations (`course/visual-journey.js` & `course/lesson1-labs.js`) — **Preserve Benchmark**
Lesson 1 features 18 distinct, purpose-built conceptual visualizations (`course/visual-gallery.html` & `course/visual-journey.js`):
- **Structural Diversity:** Uses 14 distinct visual topologies (`path` on `01-01`, `lenses` on `01-02`, `timeline` on `01-03`, `wheel` with custom SVG pictograms on `02-01`, `tree` with `ROOTS/TRUNK/BRANCHES` on `02-02`, `gates` on `02-03`, `orbit` on `03-01`, `iceberg` with `VISIBLE/EXPLORE/VERIFY` on `03-02`, `overlap` on `03-03`, `tiers` on `04-01`, `triangle` on `04-02`, `quadrant` 2×2 power/interest matrix on `04-03`, `pillars` on `05-01`, the 30-cell `5×6 CBD Matrix` on `05-02`, multi-case `classify` on `05-03`, 4-quadrant `swot` sorting on `06-01`, `compare` baseline vs target on `06-02`, and 5-step `route` on `06-03`).
- **Micro-Decision Integration:** Screens `02-01`, `04-02`, and `04-03` include embedded `YOUR TURN · 1 SHORT DECISION` micro-cases inside the visual stage (`microCases` in `course/visual-journey.js` lines 137–162).
- **Verdict on Lesson 1 Visuals:** High conceptual clarity, strong spatial metaphors, full keyboard operability (`aria-pressed`, `role="status"`), and clean 320px/768px reflow (`VISUAL_EVIDENCE/lesson1/gallery-320.png`, `gallery-768.png`). **Preserve intact.** The only optional enhancement (`E23`) is allowing a learner to jot a bounded observation/uncertainty note alongside `04-02` (Triangulation) or `05-02` (5×6 Matrix) if approved by the owner.

### B. Lessons 2–6 Conceptual Visualizations (`platform/platform.js` & `platform/platform.css`) — **High-Value Upgrade Opportunity (`E11`)**
In contrast to Lesson 1's 14 visual topologies, all 38 screens in Lessons 2–6 use a single DOM structure (`platform/platform.js` line 70):
```html
<div class="visual" data-kind="chain|compare|cycle">
  <span class="eyebrow">Explore the relationship</span>
  <h2>...</h2>
  <div class="nodes">
    <button data-node="0" aria-pressed="false">...</button>
    ...
  </div>
  <div id="concept-feedback" class="reveal" role="status">...</div>
</div>
```
And in `platform/platform.css` (line 9), `data-kind` applies only minimal CSS variation:
- `data-kind="chain"`: 1-column stack with a `↓` character (`::after`) on buttons (`10` screens: `02-01`, `02-08`, `02-06`, `03-01`, `03-10`, `03-09`, `04-07`, `05-06`, `06-07`).
- `data-kind="compare"`: 2-column grid of buttons (`22` screens).
- `data-kind="cycle"`: 2-column grid of buttons with a `2px solid #a4c8d2; border-radius: 22px` border around `.nodes` (`6` screens: `03-06`, `03-07`, `04-04`, `04-05`, `05-03`, `06-03`).

**Specific Screens Where Generic Button Lists Undermine the Framework's Relational Structure (`E11`):**
1. **Screen `03-10` (*Check one logframe row across four columns*):** The lesson explicitly teaches **horizontal** coherence across the four columns of a single logframe row (`Result | Verification measure | Evidence source | External condition`). Yet `data-kind="chain"` renders them vertically (`↓`) like a top-down hierarchy, visually confusing horizontal row verification with the vertical `Goal → Outcome → Output → Activity` chain taught on `03-01` (`probe-mobile-390.jpg`).
2. **Screen `02-01` (*A police objective sits within a larger system*):** Teaches how police outputs interact across the wider SSR and justice chain (`Mandate`, `National framework`, `Justice relationships` — prosecution, courts, corrections, oversight). Needs a system-flow diagram showing where bottlenecks accumulate when police output rises without justice-sector coordination.
3. **Screen `04-05` (*Use a structure, then revisit your diagnosis*) & `04-07` (*New evidence can change the problem you are solving*):** Teaches the iterative 6-step problem-solving / SARA loop where monitoring forces a return to problem definition. Wrapping 4 buttons in a rounded rectangle (`data-kind="cycle"`) does not visually depict the feedback return path from *Monitor/Assess* back to *Define/Analyze*.
4. **Screen `06-03` (*Four principles make transition a process*):** Teaches how `Early planning`, `UN integration`, `Local ownership`, and `Communication` reinforce one another continuously, and what breaks when one pillar is missing (e.g., communication without ownership).

---

## 2. Cinematic Illustrations Review (`E17`, `E30`)

### A. Existing Three Produced Illustrations (Lesson 1) — **Preserve Benchmark**
- `01-01-diagnose-first.jpg`, `03-03-counterpart-fatigue.jpg`, and `04-02-triangulation.jpg` (`1672×941`, lazy-loaded, paired with `01 See the situation` → `02 Explore the underlying concept` in `course/lesson1-illustrations.js`).
- Each image depicts a concrete operational tension (premature training request vs case-file inquiry; overlapping donor workshops overloading one counterpart; comparing an interview account with records and observation) without UN insignia, real likenesses, or baked-in text keys.

### B. Fourteen New Cinematic Specifications (Lessons 2–6) — **Storyboard & Differentiate Before Production (`E17`, `E30`)**
Run 02 authored 14 specifications across Lessons 2–6 (`3 / 3 / 3 / 2 / 3`). While all 14 pass schema validation (`tools/validate-content.cjs`) and respect rights/style constraints, close inspection of `curricula/cbd/lessons-2-3.json` and `lessons-4-6.json` reveals two weaknesses that should be corrected **before** any image generation is authorised:
1. **Identical Copy-Pasted `teachingPrompt` Strings Within Lessons 3, 4, 5, and 6:**
   - In **Lesson 2**, each scene has a distinct teaching prompt (`02-01`: *"Whose work changes when police output increases?"*; `02-07`: *"What agreement is still missing behind the shared wording?"*; `02-08`: *"What would you check before interpreting a reported improvement?"*).
   - However, in **Lessons 3, 4, 5, and 6**, the exact same `teachingPrompt` was copied across every scene in the lesson:
     - Lesson 3 (`03-10`, `03-04`, `03-07`): all three ask *"What relationship, safeguard or responsibility needs examination before acting?"*
     - Lesson 4 (`04-01`, `04-03`, `04-06`): all three ask *"Whose interpretation of the proposed change is missing?"*
     - Lesson 5 (`05-01`, `05-03`): both ask *"What could the available evidence fail to show?"*
     - Lesson 6 (`06-01`, `06-05`, `06-06`): all three ask *"What continuing responsibility or support is not yet agreed?"*
2. **Visual Over-Reliance on "People Sitting at a Table with Blank Folders":**
   - Several scene briefs (`02-07`, `03-10`, `03-04`, `04-01`, `04-06`, `05-03`, `06-06`) describe variations of small-group desk discussions with blank papers. Unlike Lesson 1's `03-03` (two simultaneous workshops visible in the background) or `04-02` (three distinct evidence spaces: desk files, doorway interview, glass-walled observation), multiple Lessons 2–6 briefs risk looking visually repetitive if produced directly from the current text.
3. **Recommendation (`E17`, `E30`):** Write screen-specific observation prompts and distinct spatial compositions (e.g., showing the environmental/operational consequence in the background rather than another conference table) and review low-cost storyboards before authorising paid media generation (`E30`).

---

## 3. Comprehensive Review of All 17 Applied Learning Tools (`E06`, `E12`, `E14`, `E15`, `E26`)

We inspected every one of the 17 applied tools in `platform/learning-tools.js` and `curricula/cbd/*.json` (`VISUAL_EVIDENCE/expanded/chromium-tool-*.png`):

| # | Screen | Tool Type | Title & Pedagogical Task | Specific Assessment & Enhancement Needed |
|---:|---|---|---|---|
| 1 | `02-03` | `priority` | *Test how a priority changes* (4 range sliders `0–5` across 2 options with constraints) | **Good sensitivity model; weak edge-case handling (`E14`).** Setting all sliders to `0` outputs `0 weighted points` for both options in alphabetical order (`probe-priority-tie.png`). Needs explicit tie detection, zero-weight warning, and a way to lock/compare two weight profiles side by side. |
| 2 | `02-04` | `builder` | *Draft an objective you can defend* (5 fields: Change/scope, Evidence/measure, Achievability/ownership, Relevance, Review date/unresolved target) | **Strong decomposition of SMART under missing baseline.** Suffers from generic `#lab-check` feedback (`probe-draft-x.png`, `E06`), no character counter (`E26`), and no carry-forward to `02-08`, `03-10`, or `module2.html` (`E08`, `E09`). |
| 3 | `02-05` | `classify` | *Separate delivery, results and uncertainty* (4 items × 3 categories) | **High educational clarity.** Distinguishes session registers, sampled practice records, biased self-selection, and shifting definitions with item-specific feedback. |
| 4 | `02-08` | `builder` | *Design a usable indicator* (4 fields: Definition/population, Baseline/repeat method, Responsibility/limits, Decision/explanation) | **Strong indicator discipline.** Would benefit from displaying the learner's `02-04` SMART draft above it (`E08`) and field-specific self-check prompts (`E06`). |
| 5 | `03-10` | `builder` | *Construct a connected logframe row* (4 fields: Result/level, Measure, Evidence source/method, External condition/assumption) | **Essential planning task (`chromium-tool-03-10.png`).** Currently laid out as a 2×2 `.draft-grid`; formatting it as a true 4-column horizontal logframe row on desktop (`E11`) with field-adjacent checks (`E06`) and handoff to `module3.html` (`E09`) will significantly boost transfer. |
| 6 | `03-02` | `classify` | *Separate a deliverable from its causal claim* (3 items × 3 categories: Output, Outcome, Assumption) | **Clean and effective** at exposing the "missing middle" in Theory of Change. |
| 7 | `03-08` | `classify` | *Select a support starting point* (3 items × 3 categories: Training, Advisory, Mentoring) | **Clear differentiation** between competence gaps, situational advice, and long-term mentoring. |
| 8 | `03-06` | `risk` | *Explore likelihood and consequence separately* (2 selects `1–3` + 3×3 grid highlight) | **Too passive (`E15`).** Changing the two dropdowns highlights cell `l-i` and prints `Illustrative product L*I`, with only one conditional sentence (`i===3`). Upgrade by letting the learner compare how **Prevention** (reduces likelihood), **Mitigation** (reduces impact), and **Contingency** (prepares fallback) affect the risk and link directly to `03-07`. |
| 9 | `03-07` | `builder` | *Prepare a response people can use* (4 fields: Trigger/essential function, Alternative/actors, Resources/safeguards, Review point) | **Practical contingency scaffold.** Should connect directly to the risk explored on `03-06` (`E15`) and hand off to `module3.html` (`E09`). |
| 10 | `04-02` | `builder` | *Repair a message for a specific counterpart* (3 fields: Audience/purpose, Revised message, Check understanding) | **High-value communication practice** repairing an accusatory message (*"Your team keeps ignoring the new routine. Fix it immediately."*). Adding a Seven-Cs self-check checklist beside `Revised message` (`E06`, `E12`) will make self-review much sharper. |
| 11 | `04-03` | `classify` | *What does the implementation evidence establish?* (3 items × 3 categories: Delivery, Adoption, Unresolved explanation) | **Effective diagnostic check** separating attendance from shift-wide adoption and unverified "resistance" claims. |
| 12 | `05-06` | `classify` | *Choose what the evidence permits you to say* (3 items × 3 categories: Supported observation, Causal claim needing evidence, Limitation/unequal effect) | **Strong analytical tool** reinforcing statistical comparability and unequal shift effects. |
| 13 | `05-03` | `builder` | *Plan an evaluation question before a data request* (4 fields: Question/result, Methods/sample, Credibility/limits, Communication/use) | **Well-scoped evaluation design scaffold.** Needs field-adjacent self-review (`E06`) and connection to earlier indicator drafts (`E08`). |
| 14 | `05-04` | `builder` | *Make an evaluation response accountable* (3 fields: Recommendation/finding, Position/reasons, Action/follow-up) | **Strong governance practice** teaching transparent partial acceptance or reasoned rejection. |
| 15 | `06-02` | `classify` | *Explain why transition is being considered* (3 items × 3 categories: Progress evidence, Context/mandate feasibility, Adviser continuity) | **Sharp conceptual distinction** preventing adviser rotation or security interruption from being mislabelled as objective achievement. |
| 16 | `06-05` | `builder` | *Draft a phased responsibility handover* (4 fields: Task/receiving actor, Readiness/unresolved capacity, Rights/gender/resources, Phasing/contingency/review) | **Comprehensive transition scaffold.** Connects directly to `module6.html` (`E09`). |
| 17 | `06-07` | `builder` | *Prepare an opening for the receiving counterpart* (3 fields: Opening explanation, Question to receiving actor, Unresolved issue/next step) | **Strong interpersonal preparation.** Would benefit from a counterpart challenge rubric (`E06`, `E12`). |
