# Changelog

All notable changes to the **CARANA CBD Learning Lab** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-10

### Added
- **Six-Module Capacity-Building & Development (CBD) Learning System:**
  - **Module 1 (Situational Analysis):** PESTEL-S conflict scan, actor response analysis, 3 CBD perspectives (Enabling, Organisational, Individual), 4-Quadrant Stakeholder Matrix, official 5 Areas × 6 Dimensions Matrix (78 intersections), 2 × 2 SWOT matrix, and qualitative/quantitative baseline indicators.
  - **Module 2 (Objective Setting & Prioritisation):** UN mandate alignment (SSR & SDG 16), official 6-category prioritisation chart, SMART objective formulation, and quantitative/qualitative KPI framework.
  - **Module 3 (Planning Activities):** Theory of Change causal pathways, 4 × 4 Logical Framework Approach (Logframe Matrix) with hierarchical numbering, Results-Based Budgeting (RBB), 3 × 3 Risk Matrix with High/Medium/Low zone calculations, and contingency plans.
  - **Module 4 (Implementation & MMA):** Monitoring, Mentoring and Advising (MMA) field practice logs, interactive Counterpart Role Reversal simulation, dynamic problem-solving via the "5 Whys" root-cause methodology, interest-based negotiation, and milestone activity tracker.
  - **Module 5 (Evaluation & Adjustment):** Mid-term review against Module 1 baselines, simulated 8-Month Mid-Term Crisis scenario, KPI variance analysis (supporting legitimate "Exceeded" progress), UNPOL 3-Tier Adjustment Decision Matrix, and 4-dimensional recalibration framework.
  - **Module 6 (Transition & Handover):** Transition definition distinguishing CBD activity handover from full mission drawdown, application of the Four Key Principles (Early Planning, UN Integration, Local Ownership, Communication), 3-phase Handover Roadmap, sustainable policing doctrine gazetting, police academy curriculum integration, gender-responsive budgeting, and formal Handover Protocol Instrument with designated signatories.
- **Master Mission Dossier Generation:** Printable 6-phase master dossier synthesizing all learner-authored data with dynamic draft vs. participant-confirmed status watermarks and clean pagination.
- **Local-First Architecture & Concurrency Control:**
  - Browser `localStorage` engine requiring zero backend infrastructure and zero network access.
  - Record-level multi-tab reconciliation using stable stakeholder IDs (`sh-1`..`sh-8`) and dirty-field tracking to prevent cross-tab overwrites.
  - Non-destructive corrupted data quarantine preserving sessions against malformed payloads.
- **Session Management & Safety:**
  - Safe "Start New Session / Reset Lab" modal with automatic JSON backup export prior to state clearing.
  - Cross-tab broadcast synchronization token to prevent zombie resaves on tab close.
- **Standardized Instructional Design:**
  - 36 interactive learning stages structured under the BOPPPS Active Learning Model.
  - Standardized `.stage-briefing` blocks across all modules detailing Stage Purpose, Expected Outputs, and What Happens Next.
- **Institutional Identity & Accessibility:**
  - United Nations Peacekeeping visual palette (`#12304a` navy, `#007cb0` UN blue) meeting WCAG AA contrast ratios.
  - Visible 2px `:focus-visible` indicators and `@media (hover: none)` touch optimizations.
  - Authoritative attribution: `"Prepared by Lt. Col. Maissara Selim"`.
  - Consolidated training disclaimer across all interfaces.

### Preserved
- **Legacy 60-Minute Fast-Track Quick Exercise:** Preserved byte-identically at `/quick-exercise` (`CARANA_CBD_Group_Activity.html`, SHA-256: `b1ff9a705c3faeee59000b629ae3db4aa23f9d2d7d5c8a2cef1a9872532e26d4`).
