# CARANA CBD E-Learning: Original Learning Architecture and Implementation Record

**Author:** Maissara Selim  
**ORCID:** https://orcid.org/0009-0004-3009-5888  
**Record date:** 2026-11-24  
**DOI:** https://doi.org/10.5281/zenodo.24495425 (reserved for this record; activated upon Zenodo publication)  
**Record version:** 1.0 (technical documentation record; not a new software release)  
**Status:** Independent instructional and software development; not an official United Nations publication, approval, certification or endorsement.

Copyright © 2026 Maissara Selim. All rights reserved in the author's original contributions, subject to applicable employment obligations, third-party rights, and agreements. Reading, referencing and academic citation are permitted. Reproduction, adaptation and redistribution require appropriate authorization, except as permitted by applicable law or existing permissions. This statement does not claim ownership of United Nations curricula, scenarios, marks, pre-existing frameworks or institutional concepts, nor supersede existing permissions.

## Abstract

This technical record describes a working interactive digital learning environment developed to support police capacity-building education. It documents the author's contribution to instructional architecture, structured learning progression, applied decision-making activities, local-first learner state, multilingual presentation and optional source-grounded learning assistance. A six-stage practical simulation is connected to a self-paced instructional environment. The implementation provides a reference for further evaluation, adaptation and institutional integration; technical verification does not establish curriculum approval, professional competence or demonstrated learning effectiveness.

## Development provenance

- Repository: https://github.com/maissaramoheb/carana-cbd-group-activity
- Immutable source baseline: https://github.com/maissaramoheb/carana-cbd-group-activity/commit/643799ff4a675eac96f50154bb2792181c9a2b59
- Baseline package metadata: `carana-cbd-elearning`, version `0.10.0`. Package version is not asserted to be a published release tag.
- Earlier Learning Lab citation: the repository's existing `CITATION.cff` identifies v1.0.1, release date 2026-10-10, DOI reference `10.5281/zenodo.23284920`. This is historical repository metadata, not an independent verification of DOI registration or scope.
- Demonstration address: https://e-learning.maissara.tech/ (a mutable service, not the immutable archival object).

## Contribution inventory

| Contribution area | Documented implementation | Source evidence at baseline |
| --- | --- | --- |
| Practical learning architecture | Six connected workbenches, 36 interactive activity stages, structured outputs and a consolidated handover dossier | `README.md`; `docs/LICENSING_AND_CREDITS.md` |
| Instructional experience | Initial developed instructional lesson with 18 screens and 36 formative quiz items; five additional review adaptations containing 38 screens and 42 quiz items | `docs/institutional/GOVERNANCE_AND_CAPABILITIES.md`; `docs/reviews/run10-1-quiz-and-reset/REPORT.md` |
| Reusable learning architecture | Configuration-driven lesson catalog, renderer, per-lesson progress and integration with practical activities | `docs/expansion/MULTI_CURRICULUM_READINESS.md` |
| Learner state and continuity | Browser-local progress, recovery, export and selective full-CBD reset preserving unrelated state | `docs/reviews/run10-1-quiz-and-reset/REPORT.md` |
| Multilingual experience | Shared English/French/Arabic interface, Arabic RTL support, language-aware learning support | `docs/reviews/run08-trilingual/REPORT.md` |
| Optional intelligent learning support | Separate local model service with curriculum retrieval, source checks, access control and neural voice support | `docs/reviews/run07-ai-excellence/REPORT.md` |

These descriptions identify implemented components and original design work. They do not assert sole ownership of generic technologies, pedagogical frameworks, third-party dependencies, model weights, synthetic-media rights or every line of the repository.

## Architecture and boundaries

The main learning experience uses standard browser technologies with a reproducible build process. A separated optional AI service permits core study and practical activities to continue without live inference. This separation creates a basis for evaluating deployment in another compatible environment. Institutional hosting, LMS interoperability, verified learner identity, security accreditation, centralized records and certification require separate assessment and approval.

Automated checks and reported browser verification are engineering evidence, not human pedagogical validation. Additional lessons and translations require authorized expert and linguistic review. No formal field-effectiveness result or official endorsement is claimed.

## Publication scope and permissions

This record is intentionally a description of the author's original technical and instructional contributions, not a redistribution of training manuals, scenario text, protected facilitator materials, training participant records, operational data, model credentials, third-party media or the entire repository. United Nations-origin materials remain attributed to their respective rights holders. See `docs/LICENSING_AND_CREDITS.md` and `docs/institutional/RIGHTS_AND_PERMISSIONS.md`.

No new blanket software license, copyright assignment, unrestricted redistribution permission or institutional handover is granted by this record. Before archival publication, verify the author's applicable rights and employment obligations, select an appropriate document license, and confirm that the selected archival files contain only authorized material. Preserve historical citation metadata and existing permissions.

## Recommended citation

Selim, M. (2026). *CARANA CBD E-Learning: Original Learning Architecture and Implementation Record* (Version 1.0) [Technical report]. Zenodo. https://doi.org/10.5281/zenodo.24495425

This identifier was reserved for this record before deposit. DOI registration and public resolution take effect upon publication in Zenodo. This report is a documentation record, not a new release of the complete software package.
