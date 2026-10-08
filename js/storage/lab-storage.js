/**
 * Local-First Persistence & Storage Manager
 * CARANA CBD Learning Lab
 * Manages versioned local storage, JSON exports/imports, and validation.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['../data/carana-scenario.js'], factory);
  } else if (typeof module === 'object' && module.exports) {
    const scenario = require('../data/carana-scenario.js');
    module.exports = factory(scenario);
  } else {
    root.LabStorage = factory(root.CARANA_SCENARIO);
  }
})(typeof self !== 'undefined' ? self : this, function (Scenario) {
  'use strict';

  const STORAGE_KEY = 'carana_cbd_lab_v1';
  const SCHEMA_VERSION = '1.0.0';

  function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getDefaultStakeholders() {
    if (Scenario && Scenario.DEFAULT_STAKEHOLDERS) {
      return JSON.parse(JSON.stringify(Scenario.DEFAULT_STAKEHOLDERS));
    }
    return [
      {
        name: 'Galasi CIS Leadership',
        role: 'Owner',
        influence: 'High',
        interest: 'High',
        needs: 'Institutional standing and resources',
        strategy: 'Engage closely & influence actively'
      }
    ];
  }

  function getDefaultState() {
    return {
      version: SCHEMA_VERSION,
      app: 'CARANA CBD Learning Lab',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      session: {
        teamName: '',
        participants: '',
        noteTaker: '',
        date: getTodayDateString(),
        role: 'participant' // 'participant' | 'facilitator'
      },
      module1: {
        status: 'in_progress', // 'not_started' | 'in_progress' | 'completed'
        // Conflict Analysis (PESTEL-S)
        pestel: {
          political: '',
          economic: '',
          social: '',
          technological: '',
          environmental: '',
          legal: '',
          security: ''
        },
        // Response Analysis
        responseAnalysis: {
          externalActors: '',
          synergiesOpportunities: '',
          risksDuplication: ''
        },
        // Three Focused Perspectives
        perspectives: {
          enablingEnvironment: '',
          organisationalLevel: '',
          individualLevel: ''
        },
        // Stakeholder Analysis
        stakeholders: getDefaultStakeholders(),
        stakeholdersConclusion: '',
        // Official 5x6 Areas-Dimensions Matrix
        // Key is `${subAreaId}|${dimensionId}`, value is { paragraphs: [number], notes: string }
        matrixCells: {},
        // SWOT Analysis
        swot: {
          strengths: [],
          weaknesses: [],
          opportunities: [], // CBD entry points
          threats: [] // CBD risks
        },
        // Baseline Register
        baseline: [
          {
            id: 'base-1',
            area: 'Policing Services / SGBV',
            asIsEvidence: '12 female officers out of 250 in CIS (4.8%). No specialised SGBV unit; cases assigned on availability/personal preference. Victims fear approaching police (Para 2, 3, 4).',
            baselineMetric: '0 specialized SGBV investigators certified; 0 dedicated interviewing rooms.',
            tobeTarget: 'Operational SGBV investigation unit established with certified female & male investigators and protected interviewing space.',
            verificationSource: 'Galasi CIS personnel roster, SOP registry, inspection of facilities.'
          },
          {
            id: 'base-2',
            area: 'Accountability & Complaints',
            asIsEvidence: 'Code of conduct suspended; no independent external complaint mechanism; complaints handled case-by-case (Para 27, 40, 51).',
            baselineMetric: '0 active internal affairs guidelines; 0 citizen complaint logbooks.',
            tobeTarget: 'Enforceable Code of Conduct reinstated with transparent complaint intake and tracking mechanism.',
            verificationSource: 'Galasi PD directive, public notices, human rights ombudsman logs.'
          },
          {
            id: 'base-3',
            area: 'Forensic Capabilities & Protocol',
            asIsEvidence: 'No certified serological lab, no specialised surveillance personnel; files thrown out of court due to procedural errors (Para 11, 24).',
            baselineMetric: 'Zero forensic chain-of-custody standard operating procedures.',
            tobeTarget: 'Standardised forensic protocols implemented in cooperation with public prosecution.',
            verificationSource: 'Court trial records, case file audits.'
          }
        ],
        // Reflection Activity (Lesson 1 Repository)
        reflection: {
          q1Experience: '',
          q2CounterpartPerspective: '',
          q3PersonalGrowth: ''
        },
        summary: {
          mainProblem: '',
          evidenceText: '',
          primaryIntervention: '',
          safeguards: ''
        },
        confirmed: false
      },
      module2: {
        status: 'not_started', // 'not_started' | 'in_progress' | 'completed'
        description: 'Objective Setting, Prioritisation and Performance Frameworks',
        // Candidates pool (imported from Module 1 or added)
        objectives: [
          {
            id: 'obj-1',
            title: "Improving CIS's SGBV Investigation Capability",
            description: 'Establish a specialized unit with trained investigators to address high rates of sexual and gender-based violence and protect vulnerable victims.',
            source: 'Module 1 SWOT Opportunity & Baseline 1',
            scores: {
              policingPractice: 3,
              environmental: 1,
              conflictPrevention: 3,
              humanRights: 3,
              gender: 3,
              cpoc: 2,
              need: 1,
              risk: 2,
              implementability: 2,
              complementarity: 3, // 1.5 weighted (3 * 0.5)
              donorInterest: 3
            },
            rawStrategicScore: 2.5,
            weightedStrategicScore: 5.0,
            overallScore: 12.5,
            rank: 1
          },
          {
            id: 'obj-2',
            title: "Digitalising CIS's Work Processes & Case Files",
            description: 'Transition from pen-and-paper registers to centralized database to improve case management and transparency.',
            source: 'Module 1 SWOT Opportunity',
            scores: {
              policingPractice: 1,
              environmental: 1,
              conflictPrevention: 1,
              humanRights: 1,
              gender: 1,
              cpoc: 1,
              need: 3,
              risk: 3,
              implementability: 3,
              complementarity: 1, // 0.5 weighted (1 * 0.5)
              donorInterest: 1
            },
            rawStrategicScore: 1.0,
            weightedStrategicScore: 2.0,
            overallScore: 9.5,
            rank: 2
          },
          {
            id: 'obj-3',
            title: 'Reinstating Code of Conduct & Oversight Mechanisms',
            description: 'Draft updated Code of Conduct SOPs, train officers, and establish accessible complaint intake to restore public trust.',
            source: 'Module 1 Baseline 2',
            scores: {
              policingPractice: 3,
              environmental: 1,
              conflictPrevention: 2,
              humanRights: 3,
              gender: 2,
              cpoc: 2,
              need: 2,
              risk: 2,
              implementability: 2,
              complementarity: 2,
              donorInterest: 2
            },
            rawStrategicScore: 2.17,
            weightedStrategicScore: 4.33,
            overallScore: 11.33,
            rank: 3
          }
        ],
        // S.M.A.R.T. formulation for the two highest ranked objectives
        smartObjectives: [
          {
            id: 'smart-1',
            objectiveId: 'obj-1',
            title: "Establish and Operationalise Galasi CIS SGBV Investigation Unit",
            specific: 'Establish a dedicated SGBV unit within Galasi CIS with 15 certified male and female investigators, standard operating procedures, and a secure confidential interview facility.',
            measurable: '15 investigators certified in victim-centered interviewing; 100% of reported SGBV cases investigated according to formal SOPs within 12 months.',
            achievable: 'Feasible through partnership with UNODC, Interpol project support, and local women’s civil society organisations.',
            relevant: 'Directly addresses widespread SGBV victimisation and extreme under-reporting in Galasi under UNSCR 2151 and SDG 16.',
            timeBound: 'Full operational status achieved within 12 months of project inception.',
            fullStatement: 'By Month 12, Galasi CIS will establish and operationalise a specialised SGBV Investigation Unit comprising 15 certified investigators operating under formal human-rights compliant SOPs with a dedicated confidential interview facility.'
          },
          {
            id: 'smart-2',
            objectiveId: 'obj-3',
            title: "Reactivate and Institutionalise Galasi PD Professional Conduct SOPs",
            specific: 'Update and re-issue the suspended CNP Code of Conduct for Galasi CIS and establish a transparent internal complaint intake logbook.',
            measurable: '250 CIS officers briefed and signed adherence pledges; 100% of received complaints logged and reviewed within 14 days.',
            achievable: 'Leverages Interpol "Police Support for Galasi" human rights workshop outputs and command support.',
            relevant: 'Restores public trust and addresses impunity regarding police misconduct towards minority communities.',
            timeBound: 'Achieved within 6 months of rollout.',
            fullStatement: 'Within 6 months, Galasi CIS leadership will re-issue the revised Code of Conduct, train all 250 personnel, and establish an active complaint intake register with monthly reporting to Galasi Police Directorate.'
          }
        ],
        // Performance Indicators Framework (PIs / KPIs)
        kpis: [
          {
            id: 'kpi-1',
            smartId: 'smart-1',
            name: 'Number of trained and certified SGBV criminal investigators',
            type: 'Quantitative (#)',
            baselineValue: '0 certified investigators in Galasi CIS',
            targetValue: '15 investigators certified (at least 6 female officers)',
            source: 'CIS Training & Roster Records',
            frequency: 'Quarterly',
            responsible: 'UNPOL CBD Training Lead & Head of CIS'
          },
          {
            id: 'kpi-2',
            smartId: 'smart-1',
            name: 'Percentage of SGBV case files meeting prosecution procedural standards',
            type: 'Quantitative (%)',
            baselineValue: 'Estimated < 20% (frequent dismissal due to procedural defects)',
            targetValue: '≥ 75% of submitted files accepted without dismissal',
            source: 'Public Prosecution Office Case Logs',
            frequency: 'Bi-annually',
            responsible: 'Joint Police-Prosecutor Liaison Committee'
          },
          {
            id: 'kpi-3',
            smartId: 'smart-2',
            name: 'Operational Code of Conduct and Disciplinary Intake SOP',
            type: 'Qualitative condition',
            baselineValue: 'Code of conduct suspended; no complaint intake desk',
            targetValue: 'Formal SOP approved, published, and intake registry active',
            source: 'Galasi PD Directive Bulletin & Ombudsman Inspection',
            frequency: 'Semi-annually',
            responsible: 'Galasi PD Internal Affairs & UNPOL CBD Adviser'
          }
        ],
        reflection: {
          q1Experience: '',
          q2StrategicPrioritisation: '',
          q3LocalOwnership: ''
        },
        confirmed: false
      },
      module3: {
        status: 'not_started', // 'not_started' | 'in_progress' | 'completed'
        description: 'Planning Activities, Logframe and RBB',
        // Theory of Change
        theoryOfChange: {
          driver: 'High prevalence of violent crime, SGBV, and public mistrust in Galasi.',
          criticalConditions: 'Victims feel safe to report; investigators possess professional competence; leadership enforces human rights SOPs; prosecutors accept case files.',
          rationale: 'If we establish a dedicated, trained SGBV investigation unit operating from a secure facility under strict confidentiality SOPs, then reporting of SGBV will increase and cases will withstand prosecution scrutiny, because victim stigmatization and procedural errors in court will be systematically mitigated.'
        },
        // Logical Framework Matrix (Logframe)
        logframe: {
          impact: {
            narrative: 'Galasi CIS professionally addresses SGBV-related cases in a manner that does no harm to victims and witnesses, in turn fostering community trust.',
            indicators: 'Short-term increase in reported SGBV cases followed by long-term decrease in recidivism; improved % trust in Galasi CIS.',
            verification: 'Galasi PD annual crime statistics; joint UNPOL-civil society community perception survey.',
            assumptions: 'Sustained political stability and absence of major armed conflict resurgence.'
          },
          outcomes: [
            {
              id: 'out-1',
              narrative: 'Effective investigation and delivery of actionable results (prosecutable cases).',
              indicators: '≥ 75% of SGBV case files submitted to prosecution result in formal charges.',
              verification: 'Public Prosecutor liaison registry; court trial records.',
              assumptions: 'Public prosecutors maintain constructive cooperation and avoid adversarial obstruction.'
            },
            {
              id: 'out-2',
              narrative: 'Victims of SGBV-related crimes are protected from repercussions and social ostracism.',
              indicators: '100% of interviewed victims report feeling secure during CIS intake and investigation.',
              verification: 'Confidential victim service feedback survey; NGO partner monitoring logs.',
              assumptions: 'Local community leaders and elders support victim reporting and discourage retaliation.'
            }
          ],
          outputs: [
            {
              id: 'outp-1',
              outcomeId: 'out-1',
              narrative: 'A specialised SGBV investigation unit is formally established and integrated into CIS structure.',
              indicators: 'Unit formal charter signed by Galasi PD Chief of Staff; 15 investigators assigned (at least 6 female).',
              verification: 'Galasi PD organizational chart; personnel assignment roster.'
            },
            {
              id: 'outp-2',
              outcomeId: 'out-1',
              narrative: 'Personnel trained in victim-centred interviewing, evidence handling, and legal protocol.',
              indicators: '15 investigators complete certified 4-week advanced SGBV curriculum.',
              verification: 'Training attendance sheets; post-course certification records.'
            },
            {
              id: 'outp-3',
              outcomeId: 'out-2',
              narrative: 'Confidential victim intake protocol and secure interview facility established.',
              indicators: 'Separate confidential facility operational; data protection SOP issued.',
              verification: 'Facility inspection report; SOP bulletin.'
            }
          ],
          activities: [
            {
              id: 'act-1',
              outputId: 'outp-1',
              narrative: 'Draft and gazette administrative terms of reference establishing the Galasi CIS SGBV unit.',
              inputs: 'Labor: 40 hours UNPOL advisory support + 20 hours CIS leadership drafting.',
              verification: 'Signed Terms of Reference document.'
            },
            {
              id: 'act-2',
              outputId: 'outp-2',
              narrative: 'Conduct specialized SGBV interview & evidence management training in coordination with UNODC & Interpol.',
              inputs: 'Capital: $15,000 training logistics (Trust Fund). Labor: 2 international trainers for 20 training days.',
              verification: 'Course completion report; training log.'
            },
            {
              id: 'act-3',
              outputId: 'outp-3',
              narrative: 'Secure, furnish, and equip off-site confidential interview room with victim protection NGO partnership.',
              inputs: 'Capital: $25,000 Quick Impact Project (QIP) allocation. Labor: Facilities management team.',
              verification: 'QIP project completion voucher; Memorandum of Understanding with local NGO.'
            }
          ]
        },
        // 3x3 Risk Analysis & Register
        risks: [
          {
            id: 'risk-1',
            title: 'Lack of officers willing to join the specialised SGBV unit',
            description: 'Male officers may perceive SGBV as low-status crime; female officers may hesitate due to prevailing male-dominated institutional culture.',
            likelihood: 2, // Medium
            impact: 3,     // High
            magnitude: 6,
            zone: 'red',
            mitigationStrategy: 'Introduce prestige incentives, accelerated career advancement points, and targeted leadership backing from Head of CIS.',
            contingencyPlan: 'Temporarily co-locate experienced UNPOL female advisers to mentor incoming candidates and build peer support.'
          },
          {
            id: 'risk-2',
            title: 'Lack of dedicated off-site facility leading to victim stigmatisation',
            description: 'Victims avoid approaching main police building for fear of public exposure and harassment by armed officers.',
            likelihood: 3, // High
            impact: 3,     // High
            magnitude: 9,
            zone: 'red',
            mitigationStrategy: 'Fast-track Quick Impact Project (QIP) funding to lease and secure an off-site confidential interview bungalow.',
            contingencyPlan: 'Partner with local accredited women’s health NGO to utilize a private consulting room for police interviews.'
          },
          {
            id: 'risk-3',
            title: 'Resistance from public prosecutors to accept initial CIS files',
            description: 'Existing "us against them" institutional friction causes prosecutors to dismiss cases citing alleged technical errors.',
            likelihood: 2, // Medium
            impact: 2,     // Medium
            magnitude: 4,
            zone: 'yellow',
            mitigationStrategy: 'Establish monthly joint police-prosecutor case file clinics to co-design evidence submission checklists.',
            contingencyPlan: 'Elevate recurring procedural disagreements to the Joint Rule of Law Working Group co-chaired by UNAC.'
          },
          {
            id: 'risk-4',
            title: 'Lack of IT and database equipment for case records',
            description: 'Central procurement delays electronic records management software and hardware.',
            likelihood: 1, // Low
            impact: 1,     // Low
            magnitude: 1,
            zone: 'green',
            mitigationStrategy: 'Implement standardized hard-copy secure ledgers and locked filing cabinets in the interim.',
            contingencyPlan: 'Continue analogue casework with strict physical access control until donor IT packages arrive.'
          }
        ],
        // Contingency Planning (Lesson 3 Slide 18)
        contingency: {
          trigger: 'Sudden political reorganization or civil unrest causing suspension of regular CIS operations.',
          backupPlan: 'Preserve secured case files off-site; designate interim senior female investigator as acting focal point; redirect pending victim support through UN partner network.',
          stakeholderCommunication: 'Notify Head of CIS, UNPOL Police Commissioner, and local NGO partners within 24 hours.',
          continuityPersonnel: 'Deputy Head of CIS, Lead SGBV Investigator, UNPOL Mentor.'
        },
        reflection: {
          q1Experience: '',
          q2PlanningHierarchy: '',
          q3RiskPreparedness: ''
        },
        confirmed: false
      },
      module4: {
        status: 'not_started', // 'not_started' | 'in_progress' | 'completed'
        description: 'Implementation, MMA Execution and Problem-Solving',
        // Monitoring, Mentoring & Advising (MMA) Strategy
        mmaStrategy: {
          monitoringMechanisms: 'Daily co-location observation logs, case file intake tracking, compliance check against human rights standards.',
          advisingPriorities: 'Technical guidance to CIS Leadership on SOP drafting, file quality assurance, and inter-agency coordination with prosecution.',
          mentoringCoachingPlan: 'One-on-one coaching for newly assigned SGBV investigators, confidence-building for female officers, reflective case debriefings.'
        },
        // Interactive Role Reversal (Counterpart's Perspective)
        roleReversal: [
          {
            id: 'role-1',
            counterpart: 'Head of Galasi CIS (Col. Tariq)',
            perceivedThreats: 'Fears appearing weak before subordinates; anxious about being held personally liable if politically sensitive cases surface; wary of international advisers taking credit for successes.',
            unspokenIncentives: 'Desire for career advancement, prestige within CNP hierarchy, retaining operational discretion, protecting loyal officers.',
            respectfulEngagementStrategy: 'Always brief him in private before plenary meetings; present all draft SOPs as co-authored under his leadership; publicly credit his department for all breakthroughs.'
          },
          {
            id: 'role-2',
            counterpart: 'Senior Male Homicide Investigator',
            perceivedThreats: 'Perceives specialized SGBV work as "social work" or low-status crime; fears loss of informal fee collection and disruption of established habits.',
            unspokenIncentives: 'Respect from peers, modern specialized investigation equipment, professional training certificates with donor prestige.',
            respectfulEngagementStrategy: 'Frame advanced SGBV interviewing as high-level investigative methodology; showcase sophisticated forensic and psychological interviewing tools (UNODC/Interpol curricula).'
          },
          {
            id: 'role-3',
            counterpart: 'Female Uniformed Officer Considering Transfer',
            perceivedThreats: 'Fears professional isolation in an exclusively male unit, harassment, and retaliation from superiors if she advocates for victims.',
            unspokenIncentives: 'Meaningful service to community, professional development, escaping static guard duties.',
            respectfulEngagementStrategy: 'Provide dedicated UNPOL female mentor accompaniment; advocate for cohort recruitment (transfer in pairs or groups of 3+ rather than solo); ensure safe separate sanitation facilities.'
          }
        ],
        // Change Management Framework
        changeManagement: {
          unfreezingTactics: 'Joint workshop reviewing high prosecution dismissal rates (>80%) to build shared recognition that the current status quo harms CIS prestige.',
          coalitionChampions: 'Partner with respected Galasi elders, the progressive Deputy Head of CIS, and the regional head of the Women Lawyers Association.',
          quickWins: 'Refurbish the confidential interview bungalow within 30 days and deliver the first cohort of certified victim-intake training.',
          sustainingMomentum: 'Establish monthly joint police-prosecutor case clinics and publish quarterly performance bulletins celebrating successful prosecutions.'
        },
        // Dynamic Problem-Solving: Field Setback Simulations
        fieldSetbacks: [
          {
            id: 'setback-1',
            title: 'Setback A: Leadership Resistance to Off-Site Facility',
            scenario: 'Galasi PD Chief of Staff insists that all CIS interviews must take place inside the central fortified station, refusing to authorize the off-site bungalow lease (citing security and territorial authority).',
            rootCause: 'Territorial control anxiety and fear of lost command visibility over off-site personnel.',
            negotiationStrategy: 'Interest-based negotiation: Offer dedicated security patrols and radio comms linking the bungalow directly to Central Dispatch, satisfying his security mandate while protecting victim confidentiality.',
            resolutionAction: 'Sign joint security protocol with Galasi PD uniformed branch guaranteeing perimeter guard for the facility without armed officers entering interview rooms.',
            status: 'Resolved'
          },
          {
            id: 'setback-2',
            title: 'Setback B: Prosecution File Rejection Crisis',
            scenario: 'Public prosecutor summarily rejects first three SGBV case files submitted by the new unit, claiming "unqualified interviewing and procedural defects" (Para 11).',
            rootCause: 'Historic "us against them" institutional rivalry and lack of shared evidentiary threshold definitions.',
            negotiationStrategy: 'Invite Chief Prosecutor to co-chair a joint case-review clinic where prosecutors define the exact admissibility checklist.',
            resolutionAction: 'Institute mandatory pre-submission case checklist signed by both lead detective and duty prosecutor.',
            status: 'In Progress'
          },
          {
            id: 'setback-3',
            title: 'Setback C: Retention and Reassignment Threat',
            scenario: 'Dominant political party influences CNP headquarters to transfer 4 of the newly trained SGBV investigators to static border checkpoint duties (Para 8, 23).',
            rootCause: 'Partisan patronage and absence of codified police specialization tenure regulations.',
            negotiationStrategy: 'Engage Head of Police Component (HOPC) and Police Commissioner to invoke the bilateral donor training conditionality clause protecting trained personnel.',
            resolutionAction: 'Draft and sign Ministerial directive establishing a mandatory 2-year minimum tenure for certified specialized investigators.',
            status: 'Scheduled'
          }
        ],
        // Implementation Activity Tracker (Linked to Module 3 Logframe)
        activityTracker: [
          {
            id: 'track-1',
            activityId: 'act-1',
            activityTitle: 'Draft and gazette administrative terms of reference establishing the Galasi CIS SGBV unit',
            outputRef: 'Output 1.1',
            status: 'Completed',
            progressPercent: 100,
            fieldAdvisoryNote: 'TOR signed by Head of CIS on Day 20. Unit integrated into official org chart.',
            lastUpdated: '2026-10-08'
          },
          {
            id: 'track-2',
            activityId: 'act-2',
            activityTitle: 'Conduct specialized SGBV interview & evidence management training (Interpol/UNODC)',
            outputRef: 'Output 1.2',
            status: 'In Progress',
            progressPercent: 65,
            fieldAdvisoryNote: 'Cohort 1 (10 officers) currently in Week 2. Strong engagement from female officers.',
            lastUpdated: '2026-10-08'
          },
          {
            id: 'track-3',
            activityId: 'act-3',
            activityTitle: 'Secure and equip off-site confidential interview room with NGO partnership',
            outputRef: 'Output 1.3',
            status: 'In Progress',
            progressPercent: 40,
            fieldAdvisoryNote: 'Lease finalized under QIP funding. Furniture and recording equipment pending delivery.',
            lastUpdated: '2026-10-08'
          }
        ],
        reflection: {
          q1Experience: '',
          q2EmpathyAndResistance: '',
          q3ResilienceInTheField: ''
        },
        confirmed: false
      },
      module5: {
        status: 'not_started', // 'not_started' | 'in_progress' | 'completed'
        description: 'Evaluation and Adjustment (UNPOL CBD JST Lesson 5)',
        // Evaluation Framework & Deming PDCA Cycle
        evaluationFramework: {
          demingPhase: 'Check & Act',
          evalActors: 'Mission Evaluation Unit (under Mission CoS), OIOS, and SPC Support',
          principles: 'SGF compliance, human rights-sensitive, gender-sensitive, impartial and transparent',
          dataCollectionStrategy: 'Triangulation of police intake registers, court dismissal audits, and confidential civil society interviews'
        },
        // 8-Month Situational Assessment (Le Galasien & Cable from Section Chief Yaa)
        crisisAnalysis: {
          leadershipShiftImpact: 'Col. Tariq transferred; inexperienced Tatsi deputy appointed for UN diversity requirements lacks criminal investigations background; succession candidate questioned over past human rights record.',
          absorptionCapacityAssessment: 'Galasi CIS overwhelmed by proposed changes in time allotted; daily caseload pressure conflicts with training abstractions.',
          dataLossAssessment: 'Total loss of digitized performance measurement data due to IT crash; urgent need for resilient low-tech data ledgers.',
          interAgencyFriction: 'Jurisdiction struggle: Ministry of Justice claims competence over CNP policy drafting, delaying formal gazetting of SOPs.',
          publicPerceptionGap: 'Citizens, especially women and Tatsi minorities, express profound skepticism; ombudsman mechanism remains completely unused.',
          budgetCliffRisk: 'Lagging 6 weeks behind; funds cannot carry over past fiscal year; risk of losing allocations unless urgently reprogrammed.'
        },
        // KPI & Activity Variance Evaluations (Lesson 5 Activity 5.1 Task A)
        kpiEvaluations: [
          {
            id: 'eval-kpi-1',
            kpiTitle: 'Number of trained and certified SGBV criminal investigators',
            baselineValue: '0 certified investigators in Galasi CIS',
            targetValue: '15 investigators certified (at least 6 female officers)',
            actualValue: '10 investigators completed classroom module; 0 formally certified due to delayed vetting and test deferral',
            varianceStatus: 'Delayed', // 'On Track' | 'Delayed' | 'Critical Variance' | 'Exceeded'
            varianceAnalysis: 'Vetting bottlenecks and CNP headquarters attempting to reassign trained officers to static border posts. High absorption strain.',
            correctiveAction: 'Deploy UNPOL mobile mentor team to administer in-situ field competency tests; invoke bilateral donor protection clause against premature transfers.'
          },
          {
            id: 'eval-kpi-2',
            kpiTitle: 'Percentage of SGBV case files meeting prosecution procedural standards',
            baselineValue: 'Under 15% accepted by Galasi Prosecution Office',
            targetValue: 'At least 75% accepted without procedural dismissal',
            actualValue: 'Estimated ~20%; accurate rate unknown due to total loss of IT database records',
            varianceStatus: 'Critical Variance',
            varianceAnalysis: 'IT server failure erased quantitative case intake records; ongoing institutional rivalry with Falin Ministry of Justice prosecutors.',
            correctiveAction: 'Reinstate paper-based emergency logbook; convene emergency joint UNPOL-CIS-Prosecution case file clinics to co-sign admissibility checklists.'
          },
          {
            id: 'eval-kpi-3',
            kpiTitle: 'Public complaint mechanism utilisation & misconduct review',
            baselineValue: '0 formal external complaints recorded',
            targetValue: '100% of received complaints logged and reviewed within 14 days',
            actualValue: '0 complaints lodged through new ombudsman office in 8 months',
            varianceStatus: 'Critical Variance',
            varianceAnalysis: 'Citizens, especially vulnerable women and minority groups, unaware or terrified of retaliation; ombudsman office lacks outreach and safe intake channels.',
            correctiveAction: 'Launch community radio sensitization campaign with local women civil society leaders; co-locate complaint dropboxes in neutral civil society facilities.'
          }
        ],
        // 3-Tier Adjustment Recommendations (Lesson 5 Activity 5.1 Task B)
        adjustments: [
          {
            id: 'adj-1',
            recommendationTitle: '1. Leadership Engagement & Executive Mentoring for Interim CIS Command',
            reaction: 'Fully Accept', // 'Fully Accept' | 'Partially Accept' | 'Reject'
            justification: 'The transfer of Col. Tariq and elevation of an inexperienced Tatsi deputy creates acute leadership vulnerability that will stall reform without immediate mentoring.',
            actionPlan: 'Provide daily co-located executive advising to the new deputy; develop a 90-day transitional command roadmap; advise mission leadership against appointing succession candidates with human rights allegations.',
            stakeholderOwner: 'UNPOL Senior Police Adviser & Head of Galasi Police Directorate'
          },
          {
            id: 'adj-2',
            recommendationTitle: '2. Inter-Agency MOJ vs CNP Competence Conflict Resolution',
            reaction: 'Fully Accept',
            justification: 'Jurisdiction dispute between Ministry of Justice and CNP over policy drafting is beyond tactical police component authority and paralyzes SOP legalization.',
            actionPlan: 'Elevate dispute to the DSRSG/RoL and UNAC Mission Leadership to facilitate a formal tripartite MOU between Ministry of Interior, Ministry of Justice, and CNP.',
            stakeholderOwner: 'UNAC DSRSG/Rule of Law, UNPOL Police Commissioner & Falin MOJ'
          },
          {
            id: 'adj-3',
            recommendationTitle: '3. Emergency Budgetary Cliff Mitigation & Absorption Pacing',
            reaction: 'Partially Accept',
            justification: 'While Section Chief Yaa warned funds cannot carry over, repeating the full 4-month approval process would kill momentum. Reprogramming within the current cycle is essential.',
            actionPlan: 'Submit urgent programmatic reallocation request to fast-track remaining capital expenditures (interview room refurbishment, offline ledger procurement) before financial year-end.',
            stakeholderOwner: 'UNPOL Program Management Unit & Mission Support Finance'
          },
          {
            id: 'adj-4',
            recommendationTitle: '4. Public Trust Restoration & Ombudsman Outreach',
            reaction: 'Fully Accept',
            justification: 'The Le Galasien finding that vulnerable groups remain skeptical and the ombudsman is unused proves that institutional reform without community trust is futile.',
            actionPlan: 'Partner with local women’s associations and minority elders to re-introduce the complaint mechanism with anonymous intake protocols and visible witness protection.',
            stakeholderOwner: 'Galasi Ombudsman, UNPOL Community Policing Team, Local CSOs'
          }
        ],
        // Impact on Initial Planning (Lesson 5 Activity 5.1 Task C)
        impactAssessment: {
          timelineImpact: 'Overall milestone completion shifted back by 12 weeks to accommodate leadership transition, paper ledger reinstatement, and SOP gazetting.',
          resourceImpact: 'Immediate reallocation of $35,000 to emergency paper registers, mobile training clinics, and civil society outreach before budget year-end.',
          qualityImpact: 'Initial cohort certification deferred until field competency is verified, preserving high investigative standards over rushed outputs.',
          counterpartWillingness: 'Cautious receptivity from interim Tatsi deputy; heightened political scrutiny from central CNP HQ.'
        },
        // Syndicate Reflection (Lesson 5 Activity 5.1 Task D)
        reflection: {
          q1EvaluationRelevance: '',
          q2FacingInconvenientTruths: '',
          q3PersonalResilienceInFailure: ''
        },
        confirmed: false
      },
      module6: {
        status: 'not_started', // 'not_started' | 'in_progress' | 'completed'
        description: 'Transition and Handover (UNPOL CBD JST Lesson 6)',
        // Transition Strategy & Mandate Triggers (Lesson 6 Slides 6-9)
        transitionStrategy: {
          hopcInitiationDate: 'Month 18 of Mission Mandate',
          primaryTrigger: 'Substantial achievement of core CBD objectives verified by Lesson 5 Evaluation',
          succeedingEntity: 'Galasi Police Directorate (CIS) with continuing UN Country Team (UNDP/UNODC) programmatic support',
          localOwnerDesignation: 'Director of Galasi Criminal Investigations Service & Galasi Police Academy Commandant'
        },
        // The Four Principles of Transition (Lesson 6 Slide 8)
        fourPrinciplesFramework: {
          earlyPlanning: 'Phased 6-month drawdown schedule initiated at Month 12; status determined across human rights, gender, strategic, political, and financial dimensions.',
          unIntegration: 'Integrated transition compact signed with UNCT (UNDP Rule of Law project, UNODC, UN Women) ensuring long-term technical and material assistance.',
          localOwnership: 'National counterpart co-leads all training modules and assumes direct budget responsibility under the Galasi Police Directorate annual appropriation.',
          communicationProtocol: 'Bimonthly transition bulletins to Galasi civil society, joint press releases by HOPC and CNP Commissioner, transparent milestone briefings.'
        },
        // Phased Handover Roadmap (Lesson 6 Activity 6.1 Task 1)
        transitionRoadmap: [
          {
            id: 'trans-step-1',
            phase: 'Phase A: Co-Management (Months 1–2)',
            milestone: 'Joint operation of SGBV Unit and Code of Conduct complaint register; 50/50 division of supervisory responsibilities.',
            leadResponsible: 'UNPOL CBD Lead Adviser & Galasi CIS Deputy',
            handoverCriteria: '100% of case reviews conducted jointly; zero unaddressed human rights violations.',
            status: 'Completed'
          },
          {
            id: 'trans-step-2',
            phase: 'Phase B: Shadow Advisory (Months 3–4)',
            milestone: 'National detectives assume 100% casework leadership; UNPOL shifts from daily co-location to scheduled mentoring visits and QA checks.',
            leadResponsible: 'Galasi CIS Unit Chief & UNPOL Shadow Mentor',
            handoverCriteria: 'National investigators independently resolve 25+ casework dockets with >80% prosecution acceptance rate.',
            status: 'In Progress'
          },
          {
            id: 'trans-step-3',
            phase: 'Phase C: Institutionalization (Months 5–6)',
            milestone: 'Curriculum codified into national Police Academy; operational budget line established in Galasi PD annual budget.',
            leadResponsible: 'Director of Police Academy & Ministry of Interior Budget Officer',
            handoverCriteria: 'Formal gazetting of SGBV investigation manual; ministerial decree protecting specialized detective tenure.',
            status: 'Scheduled'
          },
          {
            id: 'trans-step-4',
            phase: 'Phase D: Full Handover & UNCT Handoff (Month 6+)',
            milestone: 'Execution of formal Transition Instrument / Handover Protocol; transition of residual donor support to UNDP/UNODC.',
            leadResponsible: 'HOPC, UNPOL Police Commissioner, Head of CNP, UNDP Resident Representative',
            handoverCriteria: 'Formal signing ceremony and transition protocol archivation; exit of tactical UNPOL advisers.',
            status: 'Scheduled'
          }
        ],
        // Institutionalizing Sustainable Policing Practice (Lesson 6 Slide 10 & Activity 6.1 Task 2)
        institutionalizingPractice: {
          doctrineCodification: 'SGBV investigation SOPs and Human Rights Code of Conduct formally gazetted as standard CNP national operating directives.',
          academyIntegration: 'Mandatory 40-hour victim-centered interviewing curriculum integrated into basic police recruit and detective promotional courses at Galasi Police Academy.',
          genderResponsiveBudget: 'Dedicated 12% operational budget allocation within Galasi PD budget specifically earmarked for confidential interview facilities and victim assistance logistics.',
          oversightHandover: 'Permanent oversight transferred to the Regional Police Inspectorate and the independent Galasi Civilian Oversight Board.'
        },
        // Challenges & Remedies Register (Lesson 6 Activity 6.1 Task 4)
        challengesRemedies: [
          {
            id: 'cr-1',
            challenge: 'Post-handover relapse into coercive interrogation techniques once UNPOL advisers depart',
            riskLevel: 'High',
            remedy: 'Establish mandatory judicial admissibility rules rejecting unrecorded confessions; integrate random quarterly case file inspections by the Civilian Oversight Board.'
          },
          {
            id: 'cr-2',
            challenge: 'Budget exhaustion leading to closure of the off-site confidential interview bungalow',
            riskLevel: 'High',
            remedy: 'Secure bilateral donor endowment with local women’s health NGO under UNDP management to subsidize lease for 3 years post-mission.'
          },
          {
            id: 'cr-3',
            challenge: 'Political reassignment of trained detectives to non-specialized static duties',
            riskLevel: 'Medium',
            remedy: 'National Ministerial directive codifying 3-year minimum tenure for certified specialized investigators with promotion incentives for retention.'
          }
        ],
        // Handover Notice / Transition Agreement Protocol (Lesson 6 Slide 14)
        handoverNotice: {
          handoverDate: '2027-04-15',
          unpolSignatory: 'Senior UNPOL Capacity-Building & Development Adviser, UNAC',
          counterpartSignatory: 'Chief of Criminal Investigations Service, Galasi Police Directorate',
          witnessSignatory: 'Head of Police Component (HOPC) & UNDP Resident Representative',
          residualObligations: 'UNDP will provide quarterly programmatic monitoring; CNP Directorate will submit semiannual human rights adherence reports to the Minister of Interior.'
        },
        // Final Syndicate Reflection on the 6-Phase CBD Cycle (Lesson 6 Activity 6.1 Task 5)
        reflection: {
          q1TransitionMindset: '',
          q2SustainingOwnership: '',
          q3OverallCBDJourney: ''
        },
        confirmed: false
      },
      facilitator: {
        notes: '',
        checklist: {}
      }
    };
  }

  function deepMerge(target, source) {
    if (!source || typeof source !== 'object') return target;
    const output = Object.assign({}, target);
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Array) {
        output[key] = source[key];
      } else if (source[key] !== null && typeof source[key] === 'object' && target && typeof target[key] === 'object') {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }

  function loadLabState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const fresh = getDefaultState();
        saveLabState(fresh);
        return fresh;
      }
      const parsed = JSON.parse(stored);
      return deepMerge(getDefaultState(), parsed);
    } catch (e) {
      console.warn('Error reading from localStorage, initializing defaults:', e);
      return getDefaultState();
    }
  }

  function saveLabState(state) {
    try {
      state.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
      return false;
    }
  }

  function exportLabAsJson(state) {
    const currentState = state || loadLabState();
    const exportData = {
      ...currentState,
      exportedAt: new Date().toISOString(),
      exportMeta: {
        curriculum: 'UNPOL CBD JST 2021/2023',
        authority: 'UN Peacekeeping Training Material',
        trainingSafeguard: 'CARANA and UNAC are fictional training settings.'
      }
    };

    const teamSlug = (currentState.session.teamName || 'CBD_Lab')
      .trim()
      .replace(/[^a-z0-9]+/gi, '_')
      .replace(/^_|_$/g, '') || 'Team';

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CARANA_CBD_Lab_${teamSlug}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function validateImportedData(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Uploaded file is not a valid JSON object.' };
    }
    if (!data.version || !data.module1) {
      return { valid: false, error: 'Uploaded JSON lacks required CARANA CBD Learning Lab structure.' };
    }
    return { valid: true };
  }

  function importLabFromJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      const validation = validateImportedData(parsed);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      const merged = deepMerge(getDefaultState(), parsed);
      saveLabState(merged);
      return { success: true, state: merged };
    } catch (e) {
      return { success: false, error: 'Malformed JSON syntax: ' + e.message };
    }
  }

  function resetLabState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
    const fresh = getDefaultState();
    saveLabState(fresh);
    return fresh;
  }

  return {
    STORAGE_KEY,
    SCHEMA_VERSION,
    getDefaultState,
    loadLabState,
    saveLabState,
    exportLabAsJson,
    importLabFromJson,
    resetLabState,
    validateImportedData
  };
});
