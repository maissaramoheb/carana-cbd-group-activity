# Release Notes — CARANA CBD Learning Lab v1.0.0

**Production URL:** [https://carana-cbd-group-activity.maissara.tech/](https://carana-cbd-group-activity.maissara.tech/)  
**Release Tag:** `v1.0.0`  
**Git Baseline Commit:** `f4bf0f3` (merged from `development` baseline `bdeb407`)  
**Legacy Fast-Track SHA-256 Checksum:** `b1ff9a705c3faeee59000b629ae3db4aa23f9d2d7d5c8a2cef1a9872532e26d4`  
**Author:** Prepared by Lt. Col. Maissara Selim (ORCID: [0009-0004-3009-5888](https://orcid.org/0009-0004-3009-5888))

---

## 1. Executive Summary & Educational Purpose

The **CARANA CBD Learning Lab v1.0.0** is the first stable public software release of a comprehensive, local-first simulation environment supporting the six phases of United Nations Police (UNPOL) Capacity-Building and Development (CBD).

Built specifically for UN peacekeeping pre-deployment training, international police development advisers, and security sector reform (SSR) specialists, the software guides learning syndicates through the complete lifecycle of mission planning—from initial situational scanning to sustainable transition and operational handover.

---

## 2. The Six-Module Learning System & 36 Stages

The platform implements 36 interactive learning stages structured under the **BOPPPS Active Learning Model** (*Bridge-In, Objective, Pre-Assessment, Participatory Learning, Post-Assessment, Summary/Bridge-Out*):

1. **Module 1 — Situational Analysis & Baseline Scanning (6 Stages):**
   - PESTEL-S conflict scan and external actor response analysis.
   - Three CBD analytical perspectives (Enabling Environment, Organisational, Individual).
   - 4-Quadrant Stakeholder Matrix with influence/interest mapping.
   - Official 5 Areas × 6 Dimensions Matrix (78 cell intersections).
   - 2 × 2 SWOT matrix and quantitative/qualitative baseline indicators.
2. **Module 2 — Objective Setting & Multi-Criteria Prioritisation (6 Stages):**
   - Mandate alignment with UNSCR 2151 and Sustainable Development Goal 16 (Peace, Justice & Strong Institutions).
   - Official UNPOL 6-Category Objective Prioritisation Chart (Urgency, Sustainability, Feasibility, Counterpart Buy-in, Gender Equity, Impact).
   - SMART objective formulation engine with criteria validation.
   - KPI performance framework establishing baselines, targets, and verification sources.
3. **Module 3 — Action Planning, Logframe & Results-Based Budgeting (6 Stages):**
   - Theory of Change causal pathways connecting activities to developmental outcomes.
   - 4 × 4 Logical Framework Approach (Logframe Matrix) with hierarchical numbering.
   - Results-Based Budgeting (RBB) resource estimations.
   - 3 × 3 Risk Matrix with automatic High/Medium/Low zone calculations and contingency fallbacks.
4. **Module 4 — Implementation, Monitoring, Mentoring & Advising (6 Stages):**
   - Monitoring, Mentoring and Advising (MMA) field practice logs.
   - Interactive Counterpart Role Reversal simulation modeling Galasi police leadership perspectives.
   - Dynamic problem-solving via the "5 Whys" root-cause methodology.
   - Interest-based negotiation protocols and milestone activity tracker.
5. **Module 5 — Evaluation, Crisis Adaptation & Variance Analysis (6 Stages):**
   - Mid-term evaluation against Module 1 baselines.
   - Simulated 8-Month Mid-Term Crisis scenario (political tension, budget deficits, equipment delays).
   - KPI variance analysis supporting legitimate "Exceeded" progress.
   - UNPOL 3-Tier Adjustment Decision Matrix and 4-dimensional recalibration framework.
6. **Module 6 — Transition Planning & Formal Handover Protocol (6 Stages):**
   - Tactical transition initiation charter (distinguishing CBD activity transition from mission drawdown).
   - Four Key Principles of Transition (Early Planning, UN Integration, Local Ownership, Communication).
   - 3-Phase Handover Roadmap (Handover, Drawdown, Handback).
   - National doctrine gazetting, police academy curriculum integration, and gender-responsive budgeting.
   - Formal Handover Protocol Instrument with designated signatories.

---

## 3. Major Educational Capabilities

- **Dual Instructional Delivery:**
  - **Full Syndicate Learning Lab:** ~14 hours of active syndicate learning (suggested facilitation duration) across all 6 modules.
  - **60-Minute Fast-Track Quick Exercise:** Preserved byte-identically at `/quick-exercise` (`CARANA_CBD_Group_Activity.html`) for executive overviews and short classroom briefings.
- **Master Mission Dossier:** Automated generation of a print-optimized, 6-phase master mission dossier with clean page breaks, SVG matrix visualizers, and dynamic draft vs. participant-confirmed status watermarks.
- **Non-Destructive Session Management:** Accessible session reset dialog with automatic pre-wipe JSON download, multi-tab broadcast synchronization token, and isolated key protection.

---

## 4. Technical Validation & Concurrency Architecture

- **Automated Regression Suite:** 65/65 tests passing across 13 test groups (`node tests/run-tests.js`).
- **Local-First Storage:** Operates 100% locally in `localStorage` with zero remote servers, cloud accounts, or telemetry.
- **Multi-Tab Concurrency Control:** Record-level reconciliation using stable stakeholder IDs (`sh-1`..`sh-8`) and dirty-field tracking to eliminate overwrite conflicts when syndicates collaborate across multiple tabs.
- **Import Security:** Strict nested JSON schema validation protecting against tampering and invalid payloads.

---

## 5. Known Limitations & Educational Boundaries

- **Browser Storage Scope:** Data is persisted in the local browser's `localStorage`. Clearing browser cache will erase saved data unless exported to JSON. Participants should download a session backup before clearing cookies.
- **Scenario Scope:** Training aid based on the fictional CARANA scenario and UNPOL CBD JST learning materials. Official UN training materials remain the authoritative reference.
- **Transition Scope:** Transition planning specifically addresses the programmatic handover and sustainability of the bilateral CBD activity (JST Lesson 6 Activity 6.1), rather than the political withdrawal or overall liquidation of the wider UN peacekeeping mission.

---

## 6. Citation & Academic Attribution

```bibtex
@software{selim2026carana,
  author       = {Selim, Maissara},
  title        = {{CARANA CBD Learning Lab: An Offline-First Simulation Environment for UNPOL Capacity-Building and Development}},
  year         = {2026},
  version      = {v1.0.0},
  publisher    = {GitHub},
  url          = {https://carana-cbd-group-activity.maissara.tech/},
  repository   = {https://github.com/maissaramoheb/carana-cbd-group-activity},
  note         = {Prepared by Lt. Col. Maissara Selim. ORCID: 0009-0004-3009-5888}
}
```
