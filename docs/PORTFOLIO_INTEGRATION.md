# Portfolio Presentation Package — CARANA CBD Learning Lab

This document provides the complete, production-ready project entry for publication on **[https://maissara.tech/](https://maissara.tech/)**.

---

## 1. Executive Summary & Portfolio Metadata

- **Project Name:** CARANA CBD Learning Lab
- **Short Name:** CARANA CBD Lab
- **Slug:** `carana-cbd-learning-lab`
- **Status:** `PRODUCTION / v1.0.0`
- **Role of Creator:** Sole Instructional Designer, Software Architect, and Engineer (*Prepared by Lt. Col. Maissara Selim*)
- **Author ORCID:** `https://orcid.org/0009-0004-3009-5888`
- **Production URL:** [https://carana-cbd-group-activity.maissara.tech/](https://carana-cbd-group-activity.maissara.tech/)
- **GitHub Repository:** [https://github.com/maissaramoheb/carana-cbd-group-activity](https://github.com/maissaramoheb/carana-cbd-group-activity)
- **Primary Asset:** `/images/carana-cbd-learning-lab.webp` (1440 × 900 px, 112 KB, optimized)

---

## 2. Narrative Case Study

### Context
United Nations Police (UNPOL) personnel, international police development advisers, and peacekeeping training institutions require structured, evidence-based simulation tools to master the complex, politically sensitive Capacity-Building and Development (CBD) project cycle in post-conflict environments.

### Problem
Peacekeeping training exercises often rely on static paper handouts or fragmented forms, causing participants to lose analytical continuity between initial situational diagnosis, objective prioritisation, logframe design, crisis adaptation, and sustainable handover.

### Design Principle
Structure the complete six-phase project cycle as a coherent, evidence-forwarding pipeline. Keep human syndicates responsible for qualitative assessment and political judgment, while automating data flow, mathematical scoring, and multi-tab synchronization.

### System
An offline-first, browser-local interactive laboratory embedding the 36-stage BOPPPS Active Learning Model. Translates the 57-paragraph fictional CARANA scenario into conflict scans, prioritised SMART objectives, a 4×4 logframe, MMA implementation logs, 8-month crisis variance diagnostics, and a formal transition handover instrument.

### Workflow
1. **Situational Analysis:** PESTEL-S, 5×6 Areas–Dimensions Matrix, 4-Quadrant Stakeholder Mapping & Baseline Formulation.
2. **Objective Setting:** Mandate Alignment, SMART Criteria Formulation & 6-Category Multi-Criteria Prioritisation Scoring.
3. **Action Planning:** Theory of Change Causal Pathways, 4×4 Logframe Matrix, Results-Based Budgeting & 3×3 Risk Grid.
4. **Implementation & MMA:** Monitoring, Mentoring and Advising Field Logs, Role Reversal & "5 Whys" Problem-Solving.
5. **Evaluation & Adjustment:** 8-Month Mid-Term Crisis Diagnostics, KPI Variance Analysis & UNPOL 3-Tier Decision Matrix.
6. **Transition & Handover:** 4 Key Transition Principles, 3-Phase Handover Roadmap & Formal Handover Protocol Instrument.
7. **Master Dossier Generation:** Consolidated 6-Phase Printable Mission Dossier with dynamic verification status.

### Current Capabilities
- Production release `v1.0.0` running live at `https://carana-cbd-group-activity.maissara.tech/`.
- Complete 36-stage interactive learning cycle across all 6 UNPOL JST modules.
- Dual instructional delivery: Full ~14-hour Syndicate Learning Lab plus 60-Minute Fast-Track Quick Exercise.
- Local-first `localStorage` persistence with stable stakeholder IDs (`sh-1`..`sh-8`) and multi-tab concurrency protection.
- Non-destructive JSON export/import and safe session reset modal with pre-wipe backup download.
- Print-optimized Six-Module Master Mission Dossier with dynamic verification watermarks.
- 65/65 automated regression tests passing with byte-identical legacy preservation.

### Boundaries & Caveats
- **UNOFFICIAL / EDUCATIONAL TRAINING AID & SIMULATION WORKSPACE.**
- Training aid based on the fictional CARANA scenario and UNPOL CBD JST learning materials; official UN training materials remain the authoritative reference.
- Transition planning specifically addresses the programmatic handover of the bilateral CBD activity (Lesson 6 Activity 6.1), rather than political mission withdrawal or liquidation.
- Local-first browser persistence; no external server database, cloud sync, or telemetry.
- Deterministic prioritisation charts and variance thresholds guide reflection but do not replace facilitator assessment or operational command judgment.
- Do not store classified or sensitive real-world operational materials in public browser environments.

---

## 3. Code Integration Snippets for `maissara-tech`

### A. Addition to `src/data/site.ts` in `systems` array:
```typescript
  {
    id: "005",
    image: "/images/carana-cbd-learning-lab.webp",
    imageAlt:
      "CARANA CBD Learning Lab public desktop interface showing the six-phase learning journey and syndicate workspace.",
    imageCaption: "PUBLIC WORKSPACE / SIX-PHASE CBD SIMULATION",
    name: "CARANA CBD Learning Lab",
    description:
      "A local-first interactive simulation laboratory supporting the six phases of United Nations Police (UNPOL) Capacity-Building and Development, translating peacekeeping scenario intelligence into structured operational planning outputs.",
    tags: ["SIMULATION", "CAPACITY DEVELOPMENT", "UNPOL", "PEACEKEEPING", "LOCAL-FIRST"],
    qualifier: "UNOFFICIAL / EDUCATIONAL SIMULATION WORKSPACE",
    url: "https://carana-cbd-group-activity.maissara.tech",
    repository: "https://github.com/maissaramoheb/carana-cbd-group-activity",
  },
```

### B. Addition to `src/data/projects.ts` in `projects` array:
```typescript
  {
    ...systems[4],
    slug: "carana-cbd-learning-lab",
    shortName: "CARANA CBD Lab",
    name: "CARANA CBD Learning Lab: Six-Phase Simulation Workspace",
    status: "PRODUCTION / v1.0.0",
    image: "/images/carana-cbd-learning-lab.webp",
    imageAlt:
      "CARANA CBD Learning Lab six-phase curriculum navigation and syndicate planning portal.",
    imageCaption: "PRODUCTION WORKSPACE / UNPOL CBD SIMULATION LAB",
    imageWidth: 1440,
    imageHeight: 900,
    context:
      "United Nations Police (UNPOL) personnel, international police development advisers, and peacekeeping training institutions require structured, evidence-based simulation tools to master the complex, politically sensitive Capacity-Building and Development (CBD) project cycle in post-conflict environments.",
    problem:
      "Peacekeeping training exercises often rely on static paper handouts or fragmented forms, causing participants to lose analytical continuity between initial situational diagnosis, objective prioritisation, logframe design, crisis adaptation, and sustainable handover.",
    principle:
      "Structure the complete six-phase project cycle as a coherent, evidence-forwarding pipeline. Keep human syndicates responsible for qualitative assessment and political judgment, while automating data flow, mathematical scoring, and multi-tab synchronization.",
    system:
      "An offline-first, browser-local interactive laboratory embedding the 36-stage BOPPPS Active Learning Model. Translates the 57-paragraph fictional CARANA scenario into conflict scans, prioritised SMART objectives, a 4×4 logframe, MMA implementation logs, 8-month crisis variance diagnostics, and a formal transition handover instrument.",
    workflow: [
      "Situational Analysis (PESTEL-S, 5×6 Matrix & Baseline)",
      "Objective Setting (SMART Formulation & 6-Category Scoring)",
      "Action Planning (Theory of Change, Logframe & 3×3 Risk Grid)",
      "Implementation & MMA (Role Reversal & 5 Whys Problem-Solving)",
      "Evaluation & Adjustment (8-Month Crisis & Variance Analysis)",
      "Transition & Handover (4 Principles, Roadmap & Formal Protocol)",
      "Consolidated Master Mission Dossier Generation",
    ],
    current: [
      "Production release v1.0.0 running live at https://carana-cbd-group-activity.maissara.tech/.",
      "Complete 36-stage interactive learning cycle across all 6 UNPOL JST modules.",
      "Dual instructional mode: Full ~14-hour Syndicate Learning Lab plus 60-Minute Fast-Track Quick Exercise.",
      "Local-first localStorage persistence with stable stakeholder IDs (sh-1..sh-8) and multi-tab concurrency protection.",
      "Non-destructive JSON export/import and safe session reset modal with pre-wipe backup download.",
      "Print-optimized Six-Module Master Mission Dossier with dynamic verification watermarks.",
      "65/65 automated regression tests passing with byte-identical legacy preservation.",
    ],
    boundaries: [
      "UNOFFICIAL / EDUCATIONAL TRAINING AID & SIMULATION WORKSPACE.",
      "Training aid based on the fictional CARANA scenario and UNPOL CBD JST learning materials; official UN training materials remain the authoritative reference.",
      "Transition planning specifically addresses the programmatic handover of the bilateral CBD activity (Lesson 6 Activity 6.1), rather than political mission withdrawal or liquidation.",
      "Local-first browser persistence; no external server database, cloud sync, or telemetry.",
      "Deterministic prioritisation charts and variance thresholds guide reflection but do not replace facilitator assessment or operational command judgment.",
      "Do not store classified or sensitive real-world operational materials in public browser environments.",
    ],
    sourceCommit: "f4bf0f3",
  },
```
