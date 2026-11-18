# Practical activity integration map

Inspection date: 18 November 2026. This map distinguishes source inspection from executed application testing. No external activity project, deployment, data or storage was modified.

| Curriculum | Accessible implementation | Intended connection | Evidence and release status | Integration decision |
|---|---|---|---|---|
| CBD | Current repository `module1.html`–`module6.html`, original quick exercise and their `js/`/`css/` assets | Link each self-paced lesson to its corresponding original workbench; preserve direct independent access | Lesson 1 original-source preservation and browser handoff documented in prior verification. Do not extend Module 1 browser acceptance to all workbench interactions. | Same-origin direct links; existing exercise data and confirmation rules unchanged. Course completion must not claim independently observed competence. |
| MMA | Separate `maissaramoheb/mma-activity-lab`, local `Consultancy/UN MMA/mma-activity-lab` | Link a later MMA lesson to relevant human-led activity, preserving separate deployment and facilitator workflow | Static inspection of local HEAD `67f854c6a6ac5c154458908e137f67c6b44547eb`; tracked working files clean. React/Vite application package version `0.1.0-beta.1`. Existing test and acceptance reports were read, not rerun in this integration review. | Prefer a full-window external handoff. Do not embed the instructor console, copy confidential role cards into generic lesson JSON or import its session state into learner progress. |
| COP | Official plans accessible; no separate COP activity application found in the scoped local search or Vercel project-name search | Future source-based exercise integration once an owning project is identified and tested | Searches covered Consultancy/UN COP (directory absent), relevant UN TOT CC files and Documents/Codex package paths; Vercel project search `cop` returned no projects. This does not prove no COP implementation exists elsewhere. | No invented activity URL and no available-course claim. Keep catalog conversion-readiness status. |

## MMA activity-level connections

Source code `src/data/activities/index.ts` registers exactly three activity IDs. These are reference activities, not a complete digital MMA curriculum.

| Activity | Source connection observed in project | Appropriate course handoff | Required acceptance before integration |
|---|---|---|---|
| MMA-R01 — The Resistant Counterpart | Lesson 4.1 role-play, informed by communication, motivation and resistance content in Lessons 3.1–3.3 | Prepare the learner for human role-play, observer feedback and reflection | Verify role-specific information separation, printable observer material, actual paired/group operation and debrief. Avoid automated competence claims. |
| MMA-K02 — MMA Knowledge Café | Lesson 2 syndicate discussion and station work | Human-led exploration of monitoring, mentoring and advising followed by facilitated synthesis | Exercise all stations concurrently with three groups, one facilitator laptop and projector, no trainee devices; print the physical station packets; verify rotations/timer and late projector recovery. |
| MMA-N03 — Negotiation Challenge | Lesson 3.4 negotiation exercises and Lesson 4.1 role-play connections | Prepare principles and explain participation before the private-role exercise | Verify role-card privacy, public projection, controlled debrief reveal and paper delivery. Do not reproduce solutions or confidential interests in the learner catalog/demo. |

The MMA project's older README lists an evaluation preview. A read-only Vercel API query on 18 November 2026 identified project `mma-activity-lab`, latest deployment `dpl_CZz9aW2rwHGShchjBJYmMbdyWYZh`, Ready, target `production`, URL [latest immutable deployment](https://mma-activity-lq85l5511-delta4ce20-5830s-projects.vercel.app). Project domains were `mma-activity-lab.vercel.app` and `mma-activity-lab-delta4ce20-5830s-projects.vercel.app`. Deployment metadata confirms availability in Vercel, not educational or operational acceptance. No live browser journey was run here and no custom-domain claim is made. Use a reviewed stable link only after the activity owner confirms which deployment is intended.

## Operational risks that affect handoff

The MMA project's `qa/classroom-recovery-001/ROOT_CAUSE.md` records a genuine instructional delivery failure: serial tabs left two of three concurrent Knowledge Café groups without instructions on a single projected display. Earlier simulated single-user tests had missed that condition. Current `K02Workspace.tsx` contains `all_stations_overview`, and `K02StationWorksheets.tsx` exists; these are repair implementation evidence, not a fresh classroom acceptance result. Its `CLASSROOM_ACCEPTANCE_CONTRACT.md` requires concurrent visibility, physical packets, rotation continuity, projector recovery and confidentiality.

MMA uses a separate local session model and same-device `BroadcastChannel` coordination. It is not evidence of multi-device network synchronisation. A classroom access PIN is a workflow convenience, not strong authentication. Preserve English/localisation boundaries and keep any future Arabic/RTL work subject to explicit validation. Existing assessment records and two-attempt handling must remain under the activity's curriculum authority; the course shell must not replace them with its own checkpoint score.

For every external handoff, test destination access, browser back/return, storage isolation, role visibility and projector behavior. A successful link or deployment does not satisfy the exercise's multi-actor acceptance. Keep original activity source/deployment paths independent and review any future cross-origin data exchange separately.
