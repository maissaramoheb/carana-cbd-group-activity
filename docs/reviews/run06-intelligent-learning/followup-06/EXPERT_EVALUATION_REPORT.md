# CARANA Follow-up 06 — Independent Expert Acceptance Matrix & Pedagogical Assessment

## 1. Distinction Between Technical Validation & Pedagogical Judgement

Follow-up 06 strictly separates **automated technical validation** (JSON schema compliance, authorized `sourceIds` citation checks, URL/hallucinated-resolution blocking, retrieval declines, and deterministic checkpoint interception) from **human expert / SME pedagogical approval**.

- **Technical contract score (`X1`–`X28`):** **`28 / 28` passing** (`0` retries per case, single pass on genuine local `gemma4:26b`, recorded in `docs/reviews/run06-intelligent-learning/followup-06/EXPERT_ACCEPTANCE_RUN.json`).
- **Human / SME pedagogical status:** **`0 / 28` rated — Awaiting Owner & SME Review** inside `docs/reviews/run06-intelligent-learning/followup-06/review-workbench.html`. Opening that local workbench displays each response side-by-side with the exact retrieved curriculum excerpts so reviewers can record `Approve`, `Needs Improvement`, or `Reject` + commentary and export `JSON` or `Markdown` sign-off artifacts.

## 2. Prior Baseline Preservation (Follow-up 01–02 & Follow-up 05)

All prior evaluation records remain intact without overwriting historical failures:
- Follow-up 01–02 (`docs/reviews/run06-intelligent-learning/followup-01/`, `followup-02/`): preserved unchanged.
- Follow-up 05 (`docs/reviews/run06-intelligent-learning/followup-05/MODEL_COMPARISON_SUMMARY.json`): 42-case multi-model baseline (`Fixed 12` + `Held-out 14` + `Unseen F05 16`) preserved untouched; Follow-up 05 retrieval regression was re-executed after Follow-up 06 retrieval refinements and confirmed at **`42 / 42`** (`39/39` recall, `38/39` top-1 accuracy, `3/3` negative declines with `0` false positives).

## 3. Domain Coverage & Empirical Results (`X1`–`X28`, 12 CBD Domains)

| # | CBD Domain | Cases | Execution Mode & Outcome | Latency Range | Honest Pedagogical & Grounding Observations |
| --- | --- | --- | --- | --- | --- |
| 1 | Situational analysis | `X1`, `X2` | `2/2` generated (`gemma4:26b`) | `7,246–25,685 ms` | `X1` cold-loaded cleanly and integrated Conflict, Response & CBD lenses; `X2` grounded legal/statutory vs policy/practice distinction in `cbd-1:02-03` |
| 2 | Root-cause diagnosis | `X3`, `X4` | `2/2` generated (`gemma4:26b`) | `7,735–10,415 ms` | **Retrieval observation (`X3`):** scenario framing (`"station has backlog delays in case files"`) resolved to `cbd-1:04-01` (*What actually happens inside the institution?*) rather than primary `expectedRelevantIds` (`cbd-1:02-02` / `cbd-1:01-01`), yet delivered a strong 3-level diagnostic reply (`enabling environment / institution / practitioner`) avoiding a knee-jerk training fix |
| 3 | Stakeholder analysis | `X5`, `X6` | `2/2` generated (`gemma4:26b`) | `6,973–8,038 ms` | Grounded informal influence, tacit incentives, and power/interest separation cleanly in `cbd-1:03-02` and `cbd-1:04-03` |
| 4 | Capacity assessment | `X7`, `X8` | `2/2` generated (`gemma4:26b`) | `8,398–9,605 ms` | Accurately separated the 5 capacity areas and explained cross-cutting dimensions across all areas without fabricating frameworks |
| 5 | Results-based management | `X9`, `X10` | `2/2` generated (`gemma4:26b`) | `7,302–9,826 ms` | Contrasted weak brochure/attendance counts with observation of work products (`X9`) and hidden assumptions in counterpart briefings (`X10`) |
| 6 | Theory of Change | `X11`, `X12` | `2/2` generated (`gemma4:26b`) | `9,835–10,755 ms` | Explained the causal `"because"` and `"provided that"` missing middle (`X11`) and policy dissemination -> observed station practice feedback loops (`X12`) |
| 7 | Activities, outputs, outcomes & goals | `X13`, `X14` | `2/2` generated (`gemma4:26b`) | `7,889–10,570 ms` | Clean vertical separation (`activity` -> `ten workshops output` -> `community cooperation outcome` -> `public safety goal`) without conflating actors with activities (`X13`) |
| 8 | Logframes & indicators | `X15`, `X16` | `2/2` generated (`gemma4:26b`) | `9,889–13,710 ms` | Demonstrated horizontal row coherence failure (attendance sheets vs routine protocol use) + pre-agreed disruption triggers & fallback ownership (`X16`) |
| 9 | Implementation & problem-solving | `X17`, `X18` | `2/2` generated (`gemma4:26b`) | `10,800–13,659 ms` | Applied 7 Cs ownership dialogue (`X17`) and revised mid-implementation misdiagnosis (`motivation` -> `charging resource constraint`) from field evidence (`X18`) |
| 10 | Monitoring & evaluation | `X19`, `X20` | `2/2` generated (`gemma4:26b`) | `10,022–10,696 ms` | Focused evaluation design before data collection (`X19`) and distinguished routine monitoring signals from formal outcome attribution (`X20`) |
| 11 | Transition & sustainability | `X21`, `X22` | `2/2` generated (`gemma4:26b`) | `13,210–14,798 ms` | Framed 4 connected principles over ceremonies (`X21`); structured phased handover (`X22`, noting minor parenthetical `(activity)` labeling style quirk in `X22`'s example) |
| 12 | Peace-ops framing & boundaries | `X23`–`X28` | `4` generated, `1` retrieval-decline (`X25`), `1` policy intercept (`X28`) | `0–13,532 ms` | `X23`/`X24` accurately preserved census/vetting mandate safeguards and partner-coordination harms; `X25` safely declined fabricated UN ratio (`0 ms`); `X26` explicitly clarified **"This CARANA lab does not grant official UN DPO endorsement or certification"**; `X27` omitted `cbd-3:03-999`, cited only `cbd-3:03-06`, and explicitly refused `UNSCR 2999 Annex B` in `uncertainty` (`"not present in the authorized teaching passages"`); `X28` blocked checkpoint answer leak (`0 ms`) |

**Observed Model Limitations / Watch Items for Human Review:**
1. **Stylistic parenthetical tagging:** In several generated examples (`X7`, `X9`, `X12`, `X21`, `X22`, `X26`), `gemma4:26b` appends parenthetical tags like `(output)` or `(activity)` inside prose (in `X22`, labeling forensic processing `(activity)` instead of ongoing host task).
2. **Lexical retrieval drift under long vignettes:** Practitioner scenario nouns outside the course vocabulary (e.g., `X3` `"case files"`, `"backlog delays"`, or ad-hoc phrasing like `"short bulleted"` during live testing) can lower IDF-weighted coverage on the primary screen or fall back to a nearby Lesson screen (`cbd-1:04-01`) / `source-check-decline`.
3. **Injected authority refusal wording (`X27`):** `gemma4:26b` correctly rejected `UNSCR 2999 Annex B` as unsupported and excluded it from `answer`/`example`/`sources`, though it named the rejected string inside `uncertainty` while explaining why it was declined.
4. **Summary Latencies (`26` generated cases):** `min = 6,973 ms`, `median = 10,415 ms`, `mean = 10,910 ms`, `p95 = 14,798 ms`, `max = 25,685 ms` (`0` failed generations).
