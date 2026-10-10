# Licensing, Credits & Third-Party Notices

## 1. Intellectual Property & Heritage

The **CARANA CBD Learning Lab** represents a dual-heritage instructional software product:

### 1.1 Original Software Engineering & Instructional Design
- **Copyright © 2026 Maissara Selim**
- **Attribution:** *Prepared by Lt. Col. Maissara Selim*
- **Author ORCID:** [0009-0004-3009-5888](https://orcid.org/0009-0004-3009-5888)
- The application architecture, user interface, client-side data pipeline, local-first multi-tab synchronization engine, mathematical scoring logic, 36-stage interactive tools, session reset system, and print formatting engine were conceived, designed, and developed by Lt. Col. Maissara Selim.

### 1.2 United Nations Training Materials & Doctrinal Heritage
- The fictional **CARANA country scenario** (57 paragraphs), institutional background on Galasi City Police Station, and the **Job-Specific Training (JST) on Capacity-Building and Development (CBD, 2021/2023)** curriculum frameworks originate from the United Nations Department of Peace Operations (DPO), the United Nations Police Division, and the Integrated Training Service (ITS).
- These materials are referenced strictly as an instructional training aid for peace operations capacity-building and simulation exercises.

---

## 2. Licensing Policy & Governance Notice

An automatic open-source license (such as MIT, Apache 2.0, or GPL) has **not** been arbitrarily applied to the whole repository because doing so could erroneously imply that official United Nations peacekeeping scenario materials and curriculum texts belong to the author or are placed unreservedly into the public domain.

### Current Distribution Terms: Educational & Research Use
The software is made available publicly on GitHub for:
1. **Educational & Training Use:** Facilitators, peacekeeping training centres, and UNPOL contingents may freely use, deploy, and execute the software in training workshops and simulation exercises.
2. **Academic & Research Review:** Researchers and curriculum designers may study, evaluate, and reference the software architecture and simulation methodology with appropriate academic attribution.
3. **No Commercial Exploitation:** The software may not be packaged, sold, or redistributed as a commercial product without explicit authorization.

### Available Formal Licensing Options for the Repository Owner:

If the repository owner wishes to formally publish a standalone `LICENSE` file, the recommended options are:

1. **Option 1 — Dual License (Recommended for Academic / Open Science):**
   - Apply the **MIT License** to all original source code (`js/storage/`, `js/modules/`, `css/`, `tests/`, HTML application shells).
   - Retain an explicit **United Nations Copyright Reservation** for curriculum text and scenario content (`js/data/carana-scenario.js`, `js/data/curriculum-glossary.js`).
2. **Option 2 — Creative Commons Attribution-NonCommercial (CC BY-NC 4.0):**
   - Applies across the entire instructional package, permitting non-commercial copying, adaptation, and distribution with attribution.
3. **Option 3 — Custom UN Peacekeeping Training Aid Notice:**
   - Formal institutional notice reserving all rights while granting royalty-free educational execution licenses to UN Member States and accredited peacekeeping training institutions.

*Selection of the final formal license is subject to the repository owner's governance decision.*

---

## 3. Third-Party Software & Dependency Notices

- **Runtime Dependencies:** Zero. The application runs natively in modern web browsers without external runtime packages, libraries, or CDNs.
- **Node.js Test Dependencies:** The regression test suite (`tests/run-tests.js`) uses standard Node.js built-in modules (`fs`, `path`, `vm`, `crypto`, `assert`).
- **Icons & Visuals:** Pure inline SVG vectors and CSS shapes. No external icon font or tracker is imported.
