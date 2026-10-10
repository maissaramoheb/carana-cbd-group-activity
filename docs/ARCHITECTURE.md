# CARANA CBD Learning Lab — System Architecture & Instructional Design

## 1. Executive Summary & Existing Architecture Inspection

### 1.1 Existing Architecture Review (`CARANA_CBD_Group_Activity.html`)
The existing repository provides a focused 60-minute group exercise for UNPOL participants:
- **Format:** Single-file monolithic HTML document (`CARANA_CBD_Group_Activity.html`, ~31 KB) embedding HTML structure, CSS styling, and client-side JavaScript.
- **Workflow:** 6 sequential stages (`start`, `situation`, `stakeholders`, `cbd`, `review`, `export`).
- **Scope & Scope Limitation:** Designed as a rapid offline exercise. It uses a condensed 5 × 4 matrix (5 areas × 4 dimensions), simplified stakeholder inputs, and direct print styling.
- **Data Persistence:** Client-side `localStorage` under key `carana_cbd_group_activity_v1`.
- **Deployment:** Static deployment on Vercel with clean URLs rewriting `/` to `/CARANA_CBD_Group_Activity`.
- **Preservation Mandate:** The 60-minute quick activity must remain fully functional with zero regressions and instant accessibility.

---

## 2. Target Six-Module System Architecture

The CARANA CBD Learning Lab transforms this foundation into a comprehensive, modular instructional laboratory aligned directly with the official UNPOL Job-Specific Training (JST) on Capacity-Building and Development (CBD) curriculum.

```
+---------------------------------------------------------------------------------------------------+
|                                     CARANA CBD LEARNING LAB                                       |
|                                                                                                   |
|  [Module 1: Situational Analysis]  -->  [Module 2: Objective Setting]  -->  [Module 3: Planning]   |
|         "As is" Baseline                      "To be" SMART KPIs                 "What to" Logframe  |
|                 |                                      |                                   |      |
|                 v                                      v                                   v      |
|  [Module 6: Transition & Handover] <--  [Module 5: Evaluation]       <--  [Module 4: Implementation|
|         "Sustain & Exit"                      "Did we achieve"                   "How to" MMA     |
+---------------------------------------------------------------------------------------------------+
```

### 2.1 The Six Modules and Their Curriculum Mapping

| Phase / Module | Curriculum Focus | Key Methodology & Tools | Key Outputs Passed Forward |
| :--- | :--- | :--- | :--- |
| **Module 1: Situational Analysis** *(Current Milestone)* | "As is" assessment | • PESTEL-S Conflict Analysis<br>• Response Analysis (actor motivations)<br>• 3 Perspectives (Enabling, Org, Ind)<br>• Stakeholder 4-Quadrant Matrix<br>• Official 5 × 6 Areas–Dimensions Matrix<br>• 2 × 2 SWOT Analysis<br>• Baseline Development | • Verified problem statements<br>• Ranked SWOT entry points & risks<br>• Key stakeholder influence map<br>• As-is baseline indicator table |
| **Module 2: Objective Setting & Prioritisation** | "To be" future state | • Objective Alignment with SSR & SDG 16<br>• 6-Category Objective Prioritisation Chart<br>• SMART Objective formulation<br>• Performance Indicator (KPI) framework | • Prioritised SMART Objectives<br>• Measurable KPI target metrics |
| **Module 3: Planning Activities** | "What to" strategy | • Theory of Change causal pathways<br>• Logical Framework Approach (Logframe Matrix)<br>• Results-Based Budgeting (RBB)<br>• 3 × 3 Risk Matrix & Mitigation Logs<br>• Contingency Planning | • Complete Logframe matrix<br>• Activity-to-output work breakdown<br>• Risk register with mitigations |
| **Module 4: Implementation** | "How to" execution | • Monitoring, Mentoring and Advising (MMA)<br>• Change management & resilience<br>• Inter-agency coordination & mediation<br>• Activity tracking against milestones | • MMA field implementation logs<br>• Bottleneck resolution records |
| **Module 5: Evaluation & Adjustment** | "Did we" evaluation | • Periodic & terminal evaluation against M1 Baseline<br>• Indicator variance analysis<br>• Self-reflection & organizational learning<br>• Corrective adaptation plan | • Mid-term/End-term evaluation report<br>• Lessons learned & adjustments |
| **Module 6: Transition & Handover** | "Sustain & exit" | • Hand-over & exit strategy<br>• Local ownership institutionalisation<br>• Handover to host-State LEA / UNCT / Bilateral partners<br>• Post-transition monitoring | • Transition Plan & Sustainability Charter<br>• Final mission completion roadmap |

---

## 3. Data Architecture & Inter-Module Data Flow

### 3.1 Local-First Schema (`carana_cbd_lab_v1`)
All data resides in browser storage without mandatory cloud dependencies, ensuring complete offline availability in UN field missions:

```json
{
  "version": "1.0.0",
  "app": "CARANA CBD Learning Lab",
  "updatedAt": "2026-10-08T22:00:00.000Z",
  "session": {
    "teamName": "Team Alpha",
    "participants": "Maj. Smith, Capt. Diallo, Insp. Garcia",
    "noteTaker": "Capt. Diallo",
    "date": "2026-10-08",
    "mode": "participant" // "participant" | "facilitator"
  },
  "modules": {
    "module1": {
      "status": "completed",
      "pestel": { ... },
      "responseAnalysis": { ... },
      "stakeholders": [ ... ],
      "areasDimensionsMatrix": { ... },
      "swot": { ... },
      "baseline": [ ... ],
      "summary": { ... }
    },
    "module2": { "status": "not_started" },
    "module3": { "status": "not_started" },
    "module4": { "status": "not_started" },
    "module5": { "status": "not_started" },
    "module6": { "status": "not_started" }
  },
  "facilitator": {
    "notes": "",
    "checklist": { ... }
  }
}
```

### 3.2 Inter-Module Data Reusability Pipeline
- **Module 1 → Module 2:**
  - `module1.swot.opportunities` and `module1.baseline` items are automatically imported into Module 2's Objective Candidate pool.
  - Baseline indicators provide the "Current Value" for establishing SMART KPI targets.
- **Module 2 → Module 3:**
  - The highest scoring SMART Objectives become the "Developmental Outcomes" in the Module 3 Logframe.
- **Module 3 → Module 4 & 5:**
  - Logframe Activities and Indicators populate the Implementation Monitoring Dashboard (Module 4) and provide the evaluation criteria for Module 5.

---

## 4. UI/UX Design System Specification

### 4.1 Visual Hierarchy & Palette
- **Primary UN Blue:** `#009edb` (Accents, active steps, primary buttons)
- **Deep Navy:** `#12304a` (Headers, structural headers, high contrast titles)
- **UN Light Wash:** `#f0f7fb` (Subtle backgrounds, card surfaces)
- **Slate Text:** `#243746` (High-legibility typography)
- **Muted Text:** `#607586` (Labels, meta text, hints)
- **Curriculum Gold:** `#d4972e` (Training safeguards, highlights, key notes)
- **Status Green:** `#1b8764` (Completed states, positive indicators)
- **Risk Amber / Red:** `#c93b3b` / `#d97706` (High risk / threats in SWOT & risk matrices)

### 4.2 Typography & Accessibility
- Headings: `Georgia`, Cambria, Times New Roman, serif (official UN publication aesthetic).
- Body & UI: System UI font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`).
- High-contrast form controls, keyboard navigation (`focus-visible` styling), ARIA landmarks, responsive grids adapting from single column (mobile) to wide desktop layouts.
- Print stylesheets formatted for clean A4 report generation (`@page { size: A4; margin: 12mm; }`).

---

## 5. Instructional Integration & Roles

### 5.1 BOPPPS Instructional Model
Every module follows the UN Department of Peace Operations BOPPPS model:
1. **Bridge-in:** Engaging introduction connecting mission reality with prior experience.
2. **Outcome / Objectives:** Explicit learning outcomes based on Bloom's taxonomy.
3. **Pre-assessment:** Formative self-checks and baseline questions.
4. **Participatory Learning:** Interactive, multi-stage activities (case study analysis, matrix populating, SWOT sorting).
5. **Post-assessment / Reflection:** Synthesis questions from the official UN Learning Activity Repository.
6. **Summary:** Key takeaways, export, and bridge to the next CBD phase.

### 5.2 Participant vs Facilitator Modes
- **Participant Mode:** Clean, focused workspace with guidance prompts, in-context scenario reference drawer, dynamic matrix tools, and local export.
- **Facilitator Mode:** Adds facilitator checklist, timing guidance, expected outcome overlays (official 5×6 matrix cell assignments from Annex D and SWOT points of entry), and plenary debrief prompts.
