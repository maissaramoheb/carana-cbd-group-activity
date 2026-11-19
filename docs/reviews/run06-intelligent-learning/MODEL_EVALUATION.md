# Model evaluation — AI teaching qualification HOLD

**No tested model is selected as acceptable for teaching.** The working engineering prototype is configured to qwen3:4b in fast mode and visibly says NOT QUALIFIED. The public preview has no live inference connection. Passing source-ID validation is not factual or institutional acceptance.

| Candidate | Genuine observed result | Decision |
|---|---|---|
| Existing glm-ocr | OCR-specialist model; not a tutoring candidate | Not selected |
| Existing gemma4:26b (~17GB weights) | Not loaded given memory headroom | Not qualified; no quality/performance claim |
| qwen3:0.6b (~523MB download) | Fast but incomplete framework/confused examples; final6case test included a source-validation failure. Loaded memory not recorded | Rejected |
| qwen3:1.7b (~1.4GB download;1.5GB observed loaded GPU/context4096) |6structured replies in2.0–3.1s after retrieval fixes, but a wrong procurement-register example for practice verification; earlier invented staffing ratio | Rejected for teaching |
| qwen3:4b fast (~2.5GB download;3.2GB observed loaded GPU/context4096) |6structured replies in2.5–3.6s after source-ID validation correction; flawed-example handling improved, but transition advice still turns ideally sufficient evaluation progress into a mandatory confirmation; a later browser answer used an ambiguous skills/output classification without fixing its result level (see follow-up source-review correction) | Rejected for teaching |
| qwen3:4b bounded reasoning |0/6valid structured replies;43.2–45.4s/case, context4096 and1800output-token budget | Rejected in this tested resource/response budget |

All results are genuine local Ollama inference. Initial failures, undelivered candidates, nonthinking limitations and bounded-reasoning failures are retained in evidence/benchmark-*.json. No internal model reasoning is exposed or logged. The failed4B download was restarted once with cached data preserved; the eventual complete download passed Ollama digest verification. No shared runtime settings/models were replaced.

Specific findings:1.7b recommended procurement-register evidence for review-session practice, reversing a deliberately flawed source example.4b improved that distinction after an explicit counterexample instruction, but still overstated transition wording despite an instruction to preserve modality. The final browser response labelled improved officer skills as an output without specifying its result level. Follow-up source review confirms that this isolated phrase is not, by itself, a universal doctrinal classification error. Its outputs/outcomes definition is also broader and more long-term than a precise institutional results distinction warrants. Two targeted quality corrections (explicit source modality/counterexample instruction; bounded reasoning) did not establish an acceptable model. Further repair/tuning for this gate requires owner approval under the project retry limit.

A separate validator false positive treated digits in valid catalog IDs as numeric claims. It now checks whole referenced IDs against the retrieved set before excluding those verified identifiers from numeric scanning. Unsupported numeric claims and invented source IDs/pages/URLs still fail closed; unit negatives cover those boundaries. That correction is not evidence of semantic grounding.

Retrieval originally returned broad conflict material for stakeholders. IDF/coverage weighting now retrieves the stakeholder screen first; genuine responses describe affected/influential/involved actors, interest, informal influence and revisable engagement. Unsupported staffing-ratio and unrelated sports questions now return a labelled source-check without inference. Active checkpoints, facilitator keys and explicit injection requests receive deterministic, labelled source-based concept guidance. No facilitator solutions or learner drafts enter the index.

References are catalog-derived, with digital adaptations and official teaching paraphrases labelled separately. Source-ID validity, source-page provenance, answer relevance, factual correctness, example quality, conditional wording and latency were assessed separately. The semantic failures above outweigh green transport/schema tests. This is an engineering evaluation, not institutional content accreditation or professional assessment.

Reproduce fast benchmark: node tools/benchmark-tutor.cjs qwen3:4b. Reproduce the tested bounded-reasoning configuration: append --reasoning. Results save to separate fast/thinking JSON files. Do not rerun additional repairs without approval. The model-selection.json receipt records no qualified model.

## Owner-authorized follow-up 01

[Full decision and source-review correction](followup-01/REVIEW.md). The dedicated instruction-tuned variant completed the fixed matrix and one context-wiring verification. Final results were 10 generated responses, 1 blocked invalid source attribution and 1 retrieval decline. Explicit results-chain/evidence errors remain; qualification is HOLD. The gateway now supplies authoritative current-screen metadata and generic study actions remain focused on that screen. Earlier evaluations remain preserved in Git history and the prior backup.

## Owner-authorized follow-up 02

[Report A — AI Educational Quality Qualification](followup-02/REPORT_A_AI_QUALIFICATION.md) and [DECISION.json](followup-02/DECISION.json). Follow-up 02 evaluated the improved retrieval and grounding architecture on `qwen3:4b-instruct-2507-q4_K_M` across the 12-case fixed matrix ([RESPONSES-FIXED.json](followup-02/RESPONSES-FIXED.json)) and a 14-case held-out evaluation suite ([RESPONSES-HELDOUT.json](followup-02/RESPONSES-HELDOUT.json)) in a single pass with zero retries. H1, H2, and H6 retrieval were resolved, but H5 (invented procurement-register contents), H6 (categorical assertion that improved officer skills is an output rather than framework-dependent), E4 (conflating indicator and means of verification), E5 (inline source ID in prose), and E11 (susceptibility to echoing user-supplied fabricated citation strings in prose, caught and blocked by the server validator) demonstrate that the 4B model still fails the teaching-quality gate. **Qualification remains HOLD.**
