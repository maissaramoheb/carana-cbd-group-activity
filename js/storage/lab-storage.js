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
      const list = JSON.parse(JSON.stringify(Scenario.DEFAULT_STAKEHOLDERS));
      return list.map((s, idx) => ({
        id: s.id || ('sh-' + (idx + 1)),
        ...s
      }));
    }
    return [
      {
        id: 'sh-1',
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
        status: 'not_started', // 'not_started' | 'in_progress' | 'completed'
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
        // Baseline Register (Lesson 1 Activity 1.1)
        baseline: [
          {
            id: 'base-1',
            area: 'Policing Services / SGBV (Curriculum Focus)',
            asIsEvidence: '',
            baselineMetric: '',
            tobeTarget: '',
            verificationSource: ''
          },
          {
            id: 'base-2',
            area: 'Accountability & Professional Standards',
            asIsEvidence: '',
            baselineMetric: '',
            tobeTarget: '',
            verificationSource: ''
          },
          {
            id: 'base-3',
            area: 'Forensic Capabilities & Evidence Integrity',
            asIsEvidence: '',
            baselineMetric: '',
            tobeTarget: '',
            verificationSource: ''
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
        // Candidates pool (imported from Module 1 or added from Lesson 2 Activity 2.1)
        objectives: [
          {
            id: 'obj-1',
            title: "Improving CIS's SGBV Investigation Capability",
            description: 'Establish specialized capacity to address sexual and gender-based violence (Lesson 2 Activity 2.1 candidate)',
            source: 'Module 1 Entry Point / Lesson 2 Candidate',
            scores: {
              policingPractice: 1,
              environmental: 1,
              conflictPrevention: 1,
              humanRights: 1,
              gender: 1,
              cpoc: 1,
              need: 1,
              risk: 1,
              implementability: 1,
              complementarity: 1,
              donorInterest: 1
            },
            rawStrategicScore: 1.0,
            weightedStrategicScore: 2.0,
            overallScore: 0,
            rank: 1
          },
          {
            id: 'obj-2',
            title: "Digitalising CIS's Work Processes & Case Files",
            description: 'Transition from manual registers to computerised system (Lesson 2 Activity 2.1 candidate)',
            source: 'Lesson 2 Candidate Objective',
            scores: {
              policingPractice: 1,
              environmental: 1,
              conflictPrevention: 1,
              humanRights: 1,
              gender: 1,
              cpoc: 1,
              need: 1,
              risk: 1,
              implementability: 1,
              complementarity: 1,
              donorInterest: 1
            },
            rawStrategicScore: 1.0,
            weightedStrategicScore: 2.0,
            overallScore: 0,
            rank: 2
          },
          {
            id: 'obj-3',
            title: 'Reinstating Code of Conduct & Oversight Mechanisms',
            description: 'Reactivate suspended professional standards and intake mechanism (Lesson 2 Candidate)',
            source: 'Lesson 2 Candidate Objective',
            scores: {
              policingPractice: 1,
              environmental: 1,
              conflictPrevention: 1,
              humanRights: 1,
              gender: 1,
              cpoc: 1,
              need: 1,
              risk: 1,
              implementability: 1,
              complementarity: 1,
              donorInterest: 1
            },
            rawStrategicScore: 1.0,
            weightedStrategicScore: 2.0,
            overallScore: 0,
            rank: 3
          }
        ],
        // S.M.A.R.T. formulation for the two highest ranked objectives
        smartObjectives: [
          {
            id: 'smart-1',
            objectiveId: 'obj-1',
            title: "Improving CIS's SGBV Investigation Capability",
            specific: '',
            measurable: '',
            achievable: '',
            relevant: '',
            timeBound: '',
            fullStatement: ''
          },
          {
            id: 'smart-2',
            objectiveId: 'obj-2',
            title: "Digitalising CIS's Work Processes & Case Files",
            specific: '',
            measurable: '',
            achievable: '',
            relevant: '',
            timeBound: '',
            fullStatement: ''
          }
        ],
        // Performance Indicators Framework (PIs / KPIs)
        kpis: [
          {
            id: 'kpi-1',
            smartId: 'smart-1',
            name: 'Specialized SGBV Investigation Capacity',
            type: 'Quantitative (#)',
            baselineValue: '',
            targetValue: '',
            source: '',
            frequency: 'Quarterly',
            responsible: ''
          },
          {
            id: 'kpi-2',
            smartId: 'smart-1',
            name: 'Case File Admissibility Rate',
            type: 'Quantitative (%)',
            baselineValue: '',
            targetValue: '',
            source: '',
            frequency: 'Bi-annually',
            responsible: ''
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
        // Theory of Change (Lesson 3 Activity 3.1)
        theoryOfChange: {
          driver: '[Curriculum Framework] High prevalence of violent crime and public mistrust in Galasi (Lesson 3 ToC entry point)',
          criticalConditions: '[Curriculum Framework] Protected victim reporting environment, competent investigator cadre, and prosecution collaboration.',
          rationale: '[Curriculum Framework Hypothesis] If specialized investigative capacity is established under protective SOPs, then reporting and prosecution will increase because procedural errors are mitigated.'
        },
        // Logical Framework Matrix (Logframe)
        logframe: {
          impact: {
            narrative: '',
            indicators: '',
            verification: '',
            assumptions: ''
          },
          outcomes: [
            {
              id: 'out-1',
              narrative: '',
              indicators: '',
              verification: '',
              assumptions: ''
            }
          ],
          outputs: [
            {
              id: 'outp-1',
              outcomeId: 'out-1',
              narrative: '',
              indicators: '',
              verification: '',
              assumptions: ''
            }
          ],
          activities: [
            {
              id: 'act-1',
              outputId: 'outp-1',
              narrative: '',
              inputs: '',
              verification: '',
              assumptions: ''
            }
          ]
        },
        // 3x3 Risk Analysis & Register
        risks: [
          {
            id: 'risk-1',
            title: 'Resistance to new specialized procedures among investigators',
            description: 'Personnel may hesitate to adopt new investigative standards without dedicated incentives.',
            likelihood: 1, // Low
            impact: 1,     // Low
            magnitude: 1,
            zone: 'green',
            mitigationStrategy: 'Introduce professional development recognition and specialized certificates.',
            contingencyPlan: 'Provide continuous mentor accompaniment and peer-to-peer coaching.'
          },
          {
            id: 'risk-2',
            title: 'Inter-agency friction regarding evidentiary thresholds',
            description: 'Public prosecutors may question initial case files without joint procedural clarity.',
            likelihood: 2, // Medium
            impact: 1,     // Low (per Lesson 3 p. 40, L2/I1 is Green)
            magnitude: 2,
            zone: 'green',
            mitigationStrategy: 'Convene joint police-prosecutor case file review clinics.',
            contingencyPlan: 'Elevate procedural questions to the Joint Rule of Law Working Group.'
          }
        ],
        // Contingency Planning (Lesson 3 Slide 18)
        contingency: {
          trigger: 'Administrative reorganizations or unforeseen field setbacks disrupting operational timeline.',
          backupPlan: 'Preserve secure documentation off-site and maintain mentor accompaniment network.',
          stakeholderCommunication: 'Notify Head of CIS, UNPOL Leadership, and civil society counterparts.',
          continuityPersonnel: 'Deputy Head of CIS, Lead Investigator, UNPOL CBD Mentor.'
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
          monitoringMechanisms: '[Curriculum MMA Framework] Co-location observation logs, case intake monitoring, and procedural compliance checks.',
          advisingPriorities: '[Curriculum MMA Framework] Technical advising to CIS leadership on SOP implementation, file QA, and prosecution liaison.',
          mentoringCoachingPlan: '[Curriculum MMA Framework] One-on-one coaching for newly assigned investigators and reflective case review debriefings.'
        },
        // Interactive Role Reversal (Counterpart Perspective per Lesson 4 Activity 4.1)
        roleReversal: [
          {
            id: 'role-1',
            counterpart: 'Head of Galasi Criminal Investigations Service (CIS)',
            perceivedThreats: '[Curriculum Role Reversal] Professional vulnerability, command liability, and apprehension regarding external intervention.',
            unspokenIncentives: '[Curriculum Role Reversal] Departmental standing, career progression, and retaining operational discretion.',
            respectfulEngagementStrategy: '[Curriculum MMA Principle] Consultative private briefings and shared institutional ownership under national command.'
          },
          {
            id: 'role-2',
            counterpart: 'Senior Male Homicide Investigator',
            perceivedThreats: '[Curriculum Role Reversal] Apprehension over specialized procedural methods disrupting established routines.',
            unspokenIncentives: '[Curriculum Role Reversal] Professional prestige, specialized evidentiary tools, and certified training recognition.',
            respectfulEngagementStrategy: '[Curriculum MMA Principle] Frame advanced interviewing as elite forensic technique with joint investigative recognition.'
          },
          {
            id: 'role-3',
            counterpart: 'Female Uniformed Officer Considering Transfer',
            perceivedThreats: '[Curriculum Role Reversal] Risk of professional isolation in male-dominated command and peer retaliation.',
            unspokenIncentives: '[Curriculum Role Reversal] Professional development, specialized community service, and career advancement.',
            respectfulEngagementStrategy: '[Curriculum MMA Principle] Cohort-based transfer, dedicated UNPOL female mentor accompaniment, and protective facilities.'
          }
        ],
        // Change Management Framework
        changeManagement: {
          unfreezingTactics: '[Curriculum Change Management] Joint review workshops highlighting dismissals to establish shared need for reform.',
          coalitionChampions: '[Curriculum Change Management] Progressive senior investigators, community elders, and civil society legal advocates.',
          quickWins: '[Curriculum Change Management] Refurbish private intake room and deliver certified foundational training module.',
          sustainingMomentum: '[Curriculum Change Management] Regular joint police-prosecutor clinics and monthly performance bulletins.'
        },
        // Dynamic Problem-Solving: Field Setback Simulations
        fieldSetbacks: [
          {
            id: 'setback-1',
            title: 'Setback A: Counterpart Reluctance & Administrative Delays',
            category: 'Counterpart Reluctance',
            scenario: 'Key counterparts delay scheduled activities and express doubt regarding operational feasibility.',
            rootCause: '[Curriculum Setback Analysis] Institutional hesitation, administrative inertia, and differing jurisdictional expectations.',
            fiveWhysAnalysis: 'Why 1: Meeting postponed -> Why 2: Draft SOP not reviewed -> Why 3: Competing command duties -> Why 4: Lack of dedicated drafting team -> Why 5: Insufficient co-ownership.',
            negotiationStrategy: '[Curriculum Interest-Based Mediation] Identify shared underlying interests and establish joint procedural clarity.',
            resolutionAction: '[Curriculum Action Framework] Institute structured co-drafting sessions and senior command endorsement.',
            status: 'Scheduled'
          },
          {
            id: 'setback-2',
            title: 'Setback B: Resource and Logistics Shortfalls',
            category: 'Logistical & Resource Shortfalls',
            scenario: 'Procurement delays and premises access hurdles slow down field activities.',
            rootCause: '[Curriculum Setback Analysis] Central procurement delays and physical infrastructure preparation bottlenecks.',
            fiveWhysAnalysis: 'Why 1: Equipment not delivered -> Why 2: Procurement requisition delayed -> Why 3: Budget line authorization -> Why 4: Multi-agency approvals -> Why 5: Lack of fast-track mechanism.',
            negotiationStrategy: '[Curriculum Interest-Based Mediation] Leverage partner assistance and interim low-tech operational measures.',
            resolutionAction: '[Curriculum Action Framework] Fast-track interim facility lease and secure essential analogue supplies.',
            status: 'Scheduled'
          },
          {
            id: 'setback-3',
            title: 'Setback C: Inter-Agency Jurisdictional Disagreement',
            category: 'Institutional Disagreements',
            scenario: 'Friction between police command and prosecution/justice authorities regarding roles.',
            rootCause: '[Curriculum Setback Analysis] Historical inter-agency rivalry and absence of shared evidence threshold standards.',
            fiveWhysAnalysis: 'Why 1: Files rejected -> Why 2: Procedural defects cited -> Why 3: Differing checklist formats -> Why 4: No joint liaison mechanism -> Why 5: Institutional separation.',
            negotiationStrategy: '[Curriculum Interest-Based Mediation] Convene joint police-prosecutor clinics to co-design evidence admissibility checklists.',
            resolutionAction: '[Curriculum Action Framework] Establish Joint Liaison Working Group with bi-weekly case clinics.',
            status: 'Scheduled'
          }
        ],
        // Implementation Activity Tracker (Linked to Module 3 Logframe)
        activityTracker: [
          {
            id: 'track-1',
            activityId: 'act-1',
            activityTitle: 'Initial Implementation Activity 1 (from Module 3)',
            outputRef: 'Output 1.1',
            status: 'In Progress',
            progressPercent: 10,
            fieldAdvisoryNote: '[Field Advisory Observation] Initial operational planning underway with counterpart leadership.',
            lastUpdated: getTodayDateString()
          },
          {
            id: 'track-2',
            activityId: 'act-2',
            activityTitle: 'Initial Implementation Activity 2 (from Module 3)',
            outputRef: 'Output 1.2',
            status: 'In Progress',
            progressPercent: 5,
            fieldAdvisoryNote: '[Field Advisory Observation] Logistics coordination and preliminary engagement commenced.',
            lastUpdated: getTodayDateString()
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
          evalActors: 'Mission Evaluation Unit, OIOS, and SPC Support (Lesson 5 Curriculum Framework)',
          principles: 'SGF compliance, human rights-sensitive, gender-sensitive, impartial and transparent',
          dataCollectionStrategy: '[Lesson 5 Triangulation] Intake registries, court file audits, and community feedback.'
        },
        // 8-Month Situational Assessment (Le Galasien & Official Email from Section Chief Yaa)
        crisisAnalysis: {
          leadershipShiftImpact: '[Lesson 5 Crisis Analysis] Leadership transition and appointment of interim command requiring executive mentoring support.',
          absorptionCapacityAssessment: '[Lesson 5 Crisis Analysis] High daily operational caseload conflicting with training abstractions and organizational absorption.',
          dataLossAssessment: '[Lesson 5 Crisis Analysis] Total failure of digital records system necessitating immediate paper-based logging protocols.',
          interAgencyFriction: '[Lesson 5 Crisis Analysis] Evidentiary dispute between police investigators and prosecution regarding case admissibility.',
          publicPerceptionGap: '[Lesson 5 Crisis Analysis] Citizen and community skepticism requiring renewed outreach and protected complaint mechanisms.',
          budgetCliffRisk: '[Lesson 5 Crisis Analysis] 6-week delay risking lapse of current financial year funds without formal reprogramming.'
        },
        // KPI & Activity Variance Evaluations (Lesson 5 Activity 5.1 Task A)
        kpiEvaluations: [
          {
            id: 'eval-kpi-1',
            kpiTitle: 'SGBV Investigation Capability & Personnel Vetting',
            baselineValue: 'Initial baseline per Module 1/2',
            targetValue: 'Target set in Module 2/3',
            actualValue: '',
            varianceStatus: 'Pending Verification',
            varianceAnalysis: '',
            correctiveAction: ''
          },
          {
            id: 'eval-kpi-2',
            kpiTitle: 'Case File Admissibility & Record Keeping',
            baselineValue: 'Initial baseline per Module 1/2',
            targetValue: 'Target set in Module 2/3',
            actualValue: '',
            varianceStatus: 'Pending Verification',
            varianceAnalysis: '',
            correctiveAction: ''
          }
        ],
        // 3-Tier Adjustment Recommendations (Lesson 5 Activity 5.1 Task B)
        adjustments: [
          {
            id: 'adj-1',
            recommendationTitle: '1. Leadership Engagement & Executive Mentoring for Interim Command',
            reaction: 'Fully Accept',
            justification: '[Lesson 5 Task B Adaptation] Essential to provide structured executive mentoring during transitional command.',
            actionPlan: '[Lesson 5 Task B Adaptation] Institute daily executive advising and develop 90-day transitional command plan.',
            stakeholderOwner: 'UNPOL Senior Police Adviser & Host Police Directorate'
          },
          {
            id: 'adj-2',
            recommendationTitle: '2. Inter-Agency Coordination & Procedural SOP Reconciliation',
            reaction: 'Fully Accept',
            justification: '[Lesson 5 Task B Adaptation] Resolve jurisdictional impasse between police and prosecution regarding case admissibility.',
            actionPlan: '[Lesson 5 Task B Adaptation] Elevate to Joint Rule of Law Working Group to sign joint procedural protocol.',
            stakeholderOwner: 'Joint Rule of Law Working Group & Ministry of Justice'
          },
          {
            id: 'adj-3',
            recommendationTitle: '3. Reprogramming Budget Allocations Before Fiscal Year End',
            reaction: 'Partially Accept',
            justification: '[Lesson 5 Task B Adaptation] Reprogram remaining funds within current cycle to prevent budget lapse.',
            actionPlan: '[Lesson 5 Task B Adaptation] Fast-track urgent programmatic reallocation for essential training and records materials.',
            stakeholderOwner: 'UNPOL Program Management & Host Counterpart'
          }
        ],
        // Impact on Initial Planning (Lesson 5 Activity 5.1 Task C)
        impactAssessment: {
          timelineImpact: '[Lesson 5 Task C Recalibration] Target completion dates extended by 12 weeks to accommodate operational transition.',
          resourceImpact: '[Lesson 5 Task C Recalibration] Immediate reprogramming of capital funds to procure emergency records and materials.',
          qualityImpact: '[Lesson 5 Task C Recalibration] Rigorous competency certification maintained prior to independent caseload deployment.',
          counterpartWillingness: '[Lesson 5 Task C Recalibration] Receptive engagement from interim command with continued oversight coordination.'
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
          hopcInitiationDate: 'Determined by HOPC based on mandate benchmarks and local institutional absorption capacity (JST Lesson 6 pp. 4–6)',
          primaryTrigger: '[Instructional Premise · JST Lesson 6 Activity 6.1] Assume planned CBD benchmarks achieved; transition initiated following joint UNPOL-counterpart capacity assessment',
          succeedingEntity: 'Galasi Police Directorate (CIS) with UN Country Team programmatic support',
          localOwnerDesignation: 'Director of Galasi Criminal Investigations Service (CIS)'
        },
        // The Four Principles of Transition (Lesson 6 Slide 8)
        fourPrinciplesFramework: {
          earlyPlanning: '[Lesson 6 Slide 8 Principle 1] Phased transition strategy initiated under HOPC authority during early mission mandate.',
          unIntegration: '[Lesson 6 Slide 8 Principle 2] Integrated transition compact established with UN Country Team programmatic agencies.',
          localOwnership: '[Lesson 6 Slide 8 Principle 3] National counterpart assumes primary leadership and operational budget ownership.',
          communicationProtocol: '[Lesson 6 Slide 8 Principle 4] Structured transparent milestone briefings to civil society and national stakeholders.'
        },
        // Phased Handover Roadmap (Lesson 6 Activity 6.1 Task 1)
        transitionRoadmap: [
          {
            id: 'trans-step-1',
            phase: 'Phase A: Co-Management',
            milestone: 'Joint operation with shared supervisory responsibilities and co-location',
            leadResponsible: 'UNPOL CBD Lead Adviser & National Counterpart',
            handoverCriteria: '[Lesson 6 Criteria] 100% of case reviews conducted jointly with zero unaddressed human rights violations.',
            status: 'Scheduled'
          },
          {
            id: 'trans-step-2',
            phase: 'Phase B: Shadow Advisory',
            milestone: 'National detectives assume casework leadership; UNPOL provides mentoring and QA',
            leadResponsible: 'National Unit Lead & UNPOL Shadow Mentor',
            handoverCriteria: '[Lesson 6 Criteria] National investigators independently resolve casework with acceptable prosecution standards.',
            status: 'Scheduled'
          },
          {
            id: 'trans-step-3',
            phase: 'Phase C: Institutionalization',
            milestone: 'Curriculum codified into national Police Academy; operational budget line established',
            leadResponsible: 'Director of Police Academy & Budget Authority',
            handoverCriteria: '[Lesson 6 Criteria] Formal gazetting of operating guidelines and ministerial protection of specialized cadre.',
            status: 'Scheduled'
          },
          {
            id: 'trans-step-4',
            phase: 'Phase D: Full Handover & UNCT Handoff',
            milestone: 'Execution of formal Transition Instrument / Handover Protocol',
            leadResponsible: 'HOPC, Police Commissioner, National Authorities, UNCT',
            handoverCriteria: '[Lesson 6 Criteria] Execution of transition protocol and exit of tactical UNPOL advisers.',
            status: 'Scheduled'
          }
        ],
        // Institutionalizing Sustainable Policing Practice (Lesson 6 Slide 10 & Activity 6.1 Task 2)
        institutionalizingPractice: {
          doctrineCodification: '[Lesson 6 Slide 10] Formal codification of operating procedures into national police doctrine directives.',
          academyIntegration: '[Lesson 6 Slide 10] Standardized curriculum integrated into basic and detective recruit courses at Police Academy.',
          genderResponsiveBudget: '[Lesson 6 Slide 10 Adaptation] Institutional budget line designated for specialized investigative facilities and victim support.',
          oversightHandover: '[Lesson 6 Slide 10] Routine external inspection authority transferred to statutory civilian and inspectorate bodies.'
        },
        // Challenges & Remedies Register (Lesson 6 Activity 6.1 Task 4)
        challengesRemedies: [
          {
            id: 'cr-1',
            challenge: 'Post-handover sustainability of specialized standards and procedures',
            riskLevel: 'High',
            remedy: '[Lesson 6 Remedy] Judicial admissibility guidelines requiring certified procedures and regular civilian inspections.'
          },
          {
            id: 'cr-2',
            challenge: 'Budget allocation and facility maintenance continuity',
            riskLevel: 'Medium',
            remedy: '[Lesson 6 Remedy] Bilateral partner coordination to transition ongoing facility support under UNCT auspices.'
          }
        ],
        // Handover Notice / Transition Agreement Protocol (Lesson 6 Slide 14)
        handoverNotice: {
          handoverDate: 'Date determined upon verified achievement of CBD benchmarks (Lesson 6 p. 5)',
          unpolSignatory: 'Senior UNPOL Capacity-Building & Development Adviser, UNAC',
          counterpartSignatory: 'Head of Criminal Investigations Service (CIS), Galasi Police Directorate',
          witnessSignatory: 'Head of Police Component (HOPC) & UN Resident Coordinator',
          residualObligations: '[Lesson 6 Handover Protocol] UNCT agencies provide continuing programmatic monitoring under national leadership.'
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
      if (source[key] === null || source[key] === undefined) {
        // Guard against null/undefined destroying defaults, especially session or modules
        if (target && target[key] !== undefined && target[key] !== null) {
          continue;
        }
      }
      if (Array.isArray(source[key])) {
        output[key] = source[key].filter(item => item !== null && item !== undefined).slice();
      } else if (typeof source[key] === 'object' && source[key] !== null && target && typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }

  function getModuleProgressStatus(modData, modNum) {
    if (!modData || typeof modData !== 'object') return 'not_started';
    if (modData.confirmed) return 'completed';

    switch (modNum) {
      case 1: {
        const p = modData.pestel || {};
        const hasPestel = Object.values(p).some(v => typeof v === 'string' && v.trim().length > 0);
        const hasMatrix = modData.matrixCells && Object.keys(modData.matrixCells).some(k => {
          const c = modData.matrixCells[k];
          return c && ((c.paragraphs && c.paragraphs.length > 0) || (c.notes && c.notes.trim().length > 0));
        });
        const hasSummary = modData.summary && Object.values(modData.summary).some(v => typeof v === 'string' && v.trim().length > 0);
        const hasBaseline = Array.isArray(modData.baseline) && modData.baseline.some(b => b && ((b.asIsEvidence && b.asIsEvidence.trim().length > 0) || (b.baselineMetric && b.baselineMetric.trim().length > 0)));
        const hasReflect = modData.reflection && Object.values(modData.reflection).some(v => typeof v === 'string' && v.trim().length > 0);
        return (hasPestel || hasMatrix || hasSummary || hasBaseline || hasReflect) ? 'in_progress' : 'not_started';
      }
      case 2: {
        const hasSmart = Array.isArray(modData.smartObjectives) && modData.smartObjectives.some(s => s && ((s.specific && s.specific.trim().length > 0) || (s.fullStatement && s.fullStatement.trim().length > 0)));
        const hasCustomScores = Array.isArray(modData.objectives) && modData.objectives.some(o => o && o.scores && Object.values(o.scores).some(val => val > 1));
        const hasKpi = Array.isArray(modData.kpis) && modData.kpis.some(k => k && ((k.baselineValue && k.baselineValue.trim().length > 0) || (k.targetValue && k.targetValue.trim().length > 0)));
        const hasReflect = modData.reflection && Object.values(modData.reflection).some(v => typeof v === 'string' && v.trim().length > 0);
        return (hasSmart || hasCustomScores || hasKpi || hasReflect) ? 'in_progress' : 'not_started';
      }
      case 3: {
        const lf = modData.logframe || {};
        const hasImpact = lf.impact && ((lf.impact.narrative && lf.impact.narrative.trim().length > 0) || (lf.impact.indicators && lf.impact.indicators.trim().length > 0));
        const hasOutcomes = Array.isArray(lf.outcomes) && lf.outcomes.some(o => o && o.narrative && o.narrative.trim().length > 0);
        const hasOutputs = Array.isArray(lf.outputs) && lf.outputs.some(o => o && o.narrative && o.narrative.trim().length > 0);
        const hasActivities = Array.isArray(lf.activities) && lf.activities.some(a => a && a.narrative && a.narrative.trim().length > 0);
        const hasReflect = modData.reflection && Object.values(modData.reflection).some(v => typeof v === 'string' && v.trim().length > 0);
        return (hasImpact || hasOutcomes || hasOutputs || hasActivities || hasReflect) ? 'in_progress' : 'not_started';
      }
      case 4: {
        const hasTracker = Array.isArray(modData.activityTracker) && modData.activityTracker.some(t => t && ((t.progressPercent && t.progressPercent > 0) || (t.fieldAdvisoryNote && t.fieldAdvisoryNote.trim().length > 0)));
        const hasReflect = modData.reflection && Object.values(modData.reflection).some(v => typeof v === 'string' && v.trim().length > 0);
        return (hasTracker || hasReflect) ? 'in_progress' : 'not_started';
      }
      case 5: {
        const hasKpiEval = Array.isArray(modData.kpiEvaluations) && modData.kpiEvaluations.some(k => k && ((k.actualValue && k.actualValue.trim().length > 0) || (k.varianceAnalysis && k.varianceAnalysis.trim().length > 0)));
        const hasReflect = modData.reflection && Object.values(modData.reflection).some(v => typeof v === 'string' && v.trim().length > 0);
        return (hasKpiEval || hasReflect) ? 'in_progress' : 'not_started';
      }
      case 6: {
        const hasRoadmap = Array.isArray(modData.transitionRoadmap) && modData.transitionRoadmap.some(r => r && r.status === 'Completed');
        const hasReflect = modData.reflection && Object.values(modData.reflection).some(v => typeof v === 'string' && v.trim().length > 0);
        return (hasRoadmap || hasReflect) ? 'in_progress' : 'not_started';
      }
      default:
        return 'not_started';
    }
  }

  function getFullCycleProgress(state) {
    if (!state || typeof state !== 'object') {
      return {
        confirmedCount: 0,
        totalModules: 6,
        allConfirmed: false,
        confirmedModules: [],
        pendingModules: [1, 2, 3, 4, 5, 6],
        isFacilitatorCertified: false
      };
    }
    const confirmedModules = [];
    const pendingModules = [];
    for (let i = 1; i <= 6; i++) {
      if (state['module' + i] && state['module' + i].confirmed === true) {
        confirmedModules.push(i);
      } else {
        pendingModules.push(i);
      }
    }
    return {
      confirmedCount: confirmedModules.length,
      totalModules: 6,
      allConfirmed: confirmedModules.length === 6,
      confirmedModules,
      pendingModules,
      isFacilitatorCertified: !!(state.certification && state.certification.certified)
    };
  }

  function loadLabState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const fresh = getDefaultState();
        saveLabState(fresh);
        return fresh;
      }
      let parsed;
      try {
        parsed = JSON.parse(stored);
      } catch (parseErr) {
        console.warn('Malformed JSON in localStorage. Quarantining to backup key:', parseErr);
        try { localStorage.setItem(STORAGE_KEY + '_corrupted_backup', stored); } catch (_) {}
        const fresh = getDefaultState();
        saveLabState(fresh);
        return fresh;
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        console.warn('Invalid root state in localStorage. Resetting to defaults.');
        const fresh = getDefaultState();
        saveLabState(fresh);
        return fresh;
      }
      const merged = deepMerge(getDefaultState(), parsed);
      // Guarantee session object always exists and has valid structure
      if (!merged.session || typeof merged.session !== 'object') {
        merged.session = getDefaultState().session;
      }
      // Guarantee stable IDs for all stakeholders
      if (merged.module1 && Array.isArray(merged.module1.stakeholders)) {
        merged.module1.stakeholders.forEach((s, idx) => {
          if (s && typeof s === 'object' && !s.id) {
            s.id = 'sh-' + (idx + 1);
          }
        });
      }
      return merged;
    } catch (e) {
      console.warn('Error reading from localStorage, initializing defaults:', e);
      return getDefaultState();
    }
  }

  function saveLabState(state) {
    try {
      if (!state || typeof state !== 'object') return false;
      state.updatedAt = new Date().toISOString();
      for (let i = 1; i <= 6; i++) {
        const k = 'module' + i;
        if (state[k]) {
          state[k].status = getModuleProgressStatus(state[k], i);
        }
      }
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

  function isSafeId(id) {
    return typeof id === 'string' && id.length > 0 && id.length <= 128 && /^[a-zA-Z0-9_\-:.]{1,128}$/.test(id);
  }

  function validateImportedData(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { valid: false, error: 'Uploaded file is not a valid JSON object.' };
    }
    // Check exact app identifier
    if (data.app !== 'CARANA CBD Learning Lab') {
      return { valid: false, error: 'Uploaded JSON is missing valid CARANA CBD Learning Lab app identifier.' };
    }
    // Strict semantic version check: 1.x
    if (typeof data.version !== 'string' || !/^1\.\d+(\.\d+)?$/.test(data.version)) {
      return { valid: false, error: `Unsupported or invalid schema version "${data.version}". Expected version 1.x.` };
    }
    // Session validation
    if (data.session !== undefined) {
      if (data.session === null || typeof data.session !== 'object' || Array.isArray(data.session)) {
        return { valid: false, error: 'Invalid session structure in imported JSON.' };
      }
      for (const f of ['teamName', 'participants', 'noteTaker', 'date']) {
        if (data.session[f] !== undefined && typeof data.session[f] !== 'string') {
          return { valid: false, error: `Session ${f} must be a string.` };
        }
      }
      if (data.session.role !== undefined && data.session.role !== 'participant' && data.session.role !== 'facilitator') {
        return { valid: false, error: 'Invalid session role in imported JSON (must be participant or facilitator).' };
      }
    }

    // Module 1 validation
    if (!data.module1 || typeof data.module1 !== 'object' || Array.isArray(data.module1)) {
      return { valid: false, error: 'Missing or invalid module1 structure in imported JSON.' };
    }
    if (data.module1.stakeholders !== undefined) {
      if (!Array.isArray(data.module1.stakeholders) || data.module1.stakeholders.some(s => !s || typeof s !== 'object' || Array.isArray(s))) {
        return { valid: false, error: 'Module 1 stakeholders must be an array of non-null objects.' };
      }
      for (const sh of data.module1.stakeholders) {
        if (sh.id !== undefined && !isSafeId(sh.id)) {
          return { valid: false, error: `Invalid stakeholder ID "${sh.id}". IDs must be safe alphanumeric strings.` };
        }
        for (const f of ['name', 'category', 'role', 'influence', 'interest', 'needs', 'strategy', 'engagementStrategy']) {
          if (sh[f] !== undefined && typeof sh[f] !== 'string') {
            return { valid: false, error: `Stakeholder ${f} must be a string.` };
          }
        }
      }
    }
    if (data.module1.baseline !== undefined) {
      if (!Array.isArray(data.module1.baseline) || data.module1.baseline.some(b => !b || typeof b !== 'object' || Array.isArray(b))) {
        return { valid: false, error: 'Module 1 baseline must be an array of non-null objects.' };
      }
      for (const b of data.module1.baseline) {
        if (b.id !== undefined && !isSafeId(b.id)) {
          return { valid: false, error: `Invalid baseline ID "${b.id}".` };
        }
        for (const f of ['area', 'asIsEvidence', 'baselineMetric', 'tobeTarget', 'verificationSource', 'currentCapacity', 'gapAnalysis', 'entryPoint']) {
          if (b[f] !== undefined && typeof b[f] !== 'string') {
            return { valid: false, error: `Baseline ${f} must be a string.` };
          }
        }
      }
    }
    if (data.module1.matrixCells !== undefined) {
      if (data.module1.matrixCells === null || typeof data.module1.matrixCells !== 'object' || Array.isArray(data.module1.matrixCells)) {
        return { valid: false, error: 'Module 1 matrixCells must be a valid key-value object.' };
      }
      for (const k of Object.keys(data.module1.matrixCells)) {
        if (!k.includes('|')) {
          return { valid: false, error: `Invalid matrix cell key "${k}". Expected subArea|dimension format.` };
        }
        const cell = data.module1.matrixCells[k];
        if (!cell || typeof cell !== 'object' || Array.isArray(cell)) {
          return { valid: false, error: `Invalid matrix cell object at "${k}".` };
        }
        if (cell.paragraphs !== undefined && (!Array.isArray(cell.paragraphs) || cell.paragraphs.some(p => typeof p !== 'number' || isNaN(p)))) {
          return { valid: false, error: `Matrix cell paragraphs at "${k}" must be an array of numbers.` };
        }
        if (cell.notes !== undefined && typeof cell.notes !== 'string') {
          return { valid: false, error: `Matrix cell notes at "${k}" must be a string.` };
        }
      }
    }
    if (data.module1.swot !== undefined) {
      if (data.module1.swot === null || typeof data.module1.swot !== 'object' || Array.isArray(data.module1.swot)) {
        return { valid: false, error: 'Module 1 SWOT must be an object.' };
      }
      for (const cat of ['strengths', 'weaknesses', 'opportunities', 'threats']) {
        if (data.module1.swot[cat] !== undefined) {
          if (!Array.isArray(data.module1.swot[cat])) {
            return { valid: false, error: `Module 1 SWOT ${cat} must be an array of strings.` };
          }
          for (const item of data.module1.swot[cat]) {
            if (typeof item === 'string') continue;
            if (item && typeof item === 'object' && typeof item.text === 'string') continue;
            return { valid: false, error: `Module 1 SWOT ${cat} items must be strings or valid entry objects.` };
          }
        }
      }
    }
    for (const objKey of ['perspectives', 'responseAnalysis', 'pestel', 'summary', 'reflection']) {
      if (data.module1[objKey] !== undefined) {
        if (!data.module1[objKey] || typeof data.module1[objKey] !== 'object' || Array.isArray(data.module1[objKey])) {
          return { valid: false, error: `Module 1 ${objKey} must be an object.` };
        }
        for (const [k, v] of Object.entries(data.module1[objKey])) {
          if (typeof v !== 'string') {
            return { valid: false, error: `Module 1 ${objKey}.${k} must be a string.` };
          }
        }
      }
    }

    // Module 2 validation
    if (data.module2 !== undefined) {
      if (data.module2 === null || typeof data.module2 !== 'object' || Array.isArray(data.module2)) {
        return { valid: false, error: 'Invalid module2 structure in imported JSON.' };
      }
      if (data.module2.objectives !== undefined) {
        if (!Array.isArray(data.module2.objectives) || data.module2.objectives.some(o => !o || typeof o !== 'object' || Array.isArray(o))) {
          return { valid: false, error: 'Module 2 objectives must be an array of non-null objects.' };
        }
        for (const obj of data.module2.objectives) {
          if (!isSafeId(obj.id)) {
            return { valid: false, error: `Invalid objective ID "${obj.id}". IDs must be safe alphanumeric strings.` };
          }
          if (typeof obj.title !== 'string') {
            return { valid: false, error: 'Module 2 objective title must be a string.' };
          }
          if (obj.description !== undefined && typeof obj.description !== 'string') {
            return { valid: false, error: 'Module 2 objective description must be a string.' };
          }
          if (obj.rank !== undefined && (typeof obj.rank !== 'number' || isNaN(obj.rank))) {
            return { valid: false, error: 'Module 2 objective rank must be a number.' };
          }
          if (obj.scores && typeof obj.scores === 'object') {
            for (const [cat, sc] of Object.entries(obj.scores)) {
              if (typeof sc !== 'number' || sc < 1 || sc > 3) {
                return { valid: false, error: `Objective score for "${cat}" must be a number between 1 and 3.` };
              }
            }
          }
        }
      }
      if (data.module2.smartObjectives !== undefined) {
        if (!Array.isArray(data.module2.smartObjectives) || data.module2.smartObjectives.some(s => !s || typeof s !== 'object' || Array.isArray(s))) {
          return { valid: false, error: 'Module 2 smartObjectives must be an array of non-null objects.' };
        }
        for (const s of data.module2.smartObjectives) {
          if (s.id !== undefined && !isSafeId(s.id)) {
            return { valid: false, error: `Invalid SMART objective ID "${s.id}".` };
          }
          if (s.objectiveId !== undefined && !isSafeId(s.objectiveId)) {
            return { valid: false, error: `Invalid SMART objectiveId "${s.objectiveId}".` };
          }
          for (const f of ['title', 'specific', 'measurable', 'achievable', 'relevant', 'timeBound', 'fullStatement']) {
            if (s[f] !== undefined && typeof s[f] !== 'string') {
              return { valid: false, error: `SMART objective ${f} must be a string.` };
            }
          }
        }
      }
      if (data.module2.kpis !== undefined) {
        if (!Array.isArray(data.module2.kpis) || data.module2.kpis.some(k => !k || typeof k !== 'object' || Array.isArray(k))) {
          return { valid: false, error: 'Module 2 kpis must be an array of non-null objects.' };
        }
        for (const k of data.module2.kpis) {
          for (const f of ['name', 'type', 'baselineValue', 'targetValue', 'source', 'frequency', 'responsible']) {
            if (k[f] !== undefined && typeof k[f] !== 'string') {
              return { valid: false, error: `KPI ${f} must be a string.` };
            }
          }
        }
      }
      if (data.module2.reflection !== undefined) {
        if (!data.module2.reflection || typeof data.module2.reflection !== 'object' || Array.isArray(data.module2.reflection)) {
          return { valid: false, error: 'Module 2 reflection must be an object.' };
        }
        for (const [k, v] of Object.entries(data.module2.reflection)) {
          if (typeof v !== 'string') return { valid: false, error: `Module 2 reflection.${k} must be a string.` };
        }
      }
    }

    // Module 3 validation
    if (data.module3 !== undefined) {
      if (data.module3 === null || typeof data.module3 !== 'object' || Array.isArray(data.module3)) {
        return { valid: false, error: 'Invalid module3 structure in imported JSON.' };
      }
      if (data.module3.risks !== undefined) {
        if (!Array.isArray(data.module3.risks) || data.module3.risks.some(r => !r || typeof r !== 'object' || Array.isArray(r))) {
          return { valid: false, error: 'Module 3 risks must be an array of non-null objects.' };
        }
        for (const r of data.module3.risks) {
          if (r.id !== undefined && !isSafeId(r.id)) {
            return { valid: false, error: `Invalid risk ID "${r.id}".` };
          }
          for (const f of ['title', 'mitigationStrategy', 'contingencyPlan']) {
            if (r[f] !== undefined && typeof r[f] !== 'string') {
              return { valid: false, error: `Risk ${f} must be a string.` };
            }
          }
          if (r.likelihood !== undefined && ![1, 2, 3].includes(r.likelihood)) {
            return { valid: false, error: 'Risk likelihood must be 1, 2, or 3.' };
          }
          if (r.impact !== undefined && ![1, 2, 3].includes(r.impact)) {
            return { valid: false, error: 'Risk impact must be 1, 2, or 3.' };
          }
          if (r.zone !== undefined && !['green', 'yellow', 'red'].includes(r.zone)) {
            return { valid: false, error: 'Risk zone must be green, yellow, or red.' };
          }
        }
      }
      if (data.module3.logframe !== undefined) {
        if (data.module3.logframe === null || typeof data.module3.logframe !== 'object' || Array.isArray(data.module3.logframe)) {
          return { valid: false, error: 'Module 3 logframe must be an object.' };
        }
        for (const listKey of ['outcomes', 'outputs', 'activities']) {
          if (data.module3.logframe[listKey] !== undefined) {
            if (!Array.isArray(data.module3.logframe[listKey]) || data.module3.logframe[listKey].some(item => !item || typeof item !== 'object' || Array.isArray(item))) {
              return { valid: false, error: `Module 3 logframe ${listKey} must be an array of non-null objects.` };
            }
            for (const item of data.module3.logframe[listKey]) {
              if (item.id !== undefined && !isSafeId(String(item.id))) {
                return { valid: false, error: `Invalid ID in logframe ${listKey}: "${item.id}".` };
              }
              for (const f of ['narrative', 'indicators', 'verification', 'assumptions', 'inputs']) {
                if (item[f] !== undefined && typeof item[f] !== 'string') {
                  return { valid: false, error: `Logframe ${listKey} ${f} must be a string.` };
                }
              }
            }
          }
        }
      }
      for (const objKey of ['theoryOfChange', 'contingency', 'reflection']) {
        if (data.module3[objKey] !== undefined) {
          if (!data.module3[objKey] || typeof data.module3[objKey] !== 'object' || Array.isArray(data.module3[objKey])) {
            return { valid: false, error: `Module 3 ${objKey} must be an object.` };
          }
          for (const [k, v] of Object.entries(data.module3[objKey])) {
            if (typeof v !== 'string') return { valid: false, error: `Module 3 ${objKey}.${k} must be a string.` };
          }
        }
      }
    }

    // Module 4 validation
    if (data.module4 !== undefined) {
      if (data.module4 === null || typeof data.module4 !== 'object' || Array.isArray(data.module4)) {
        return { valid: false, error: 'Invalid module4 structure in imported JSON.' };
      }
      if (data.module4.activityTracker !== undefined) {
        if (!Array.isArray(data.module4.activityTracker) || data.module4.activityTracker.some(t => !t || typeof t !== 'object' || Array.isArray(t))) {
          return { valid: false, error: 'Module 4 activityTracker must be an array of non-null objects.' };
        }
        for (const tr of data.module4.activityTracker) {
          if (tr.id !== undefined && !isSafeId(tr.id)) {
            return { valid: false, error: `Invalid activity tracker ID "${tr.id}".` };
          }
          if (tr.activityId !== undefined && !isSafeId(tr.activityId)) {
            return { valid: false, error: `Invalid activityId in tracker: "${tr.activityId}".` };
          }
          for (const f of ['activityTitle', 'outputRef', 'status', 'fieldAdvisoryNote', 'lastUpdated']) {
            if (tr[f] !== undefined && typeof tr[f] !== 'string') {
              return { valid: false, error: `Activity tracker ${f} must be a string.` };
            }
          }
          if (tr.progressPercent !== undefined) {
            if (typeof tr.progressPercent !== 'number' || isNaN(tr.progressPercent) || tr.progressPercent < 0 || tr.progressPercent > 100) {
              return { valid: false, error: 'Activity tracker progressPercent must be a number between 0 and 100.' };
            }
          }
        }
      }
      if (data.module4.roleReversal !== undefined) {
        if (!Array.isArray(data.module4.roleReversal) || data.module4.roleReversal.some(rr => !rr || typeof rr !== 'object' || Array.isArray(rr))) {
          return { valid: false, error: 'Module 4 roleReversal must be an array of non-null objects.' };
        }
        for (const rr of data.module4.roleReversal) {
          if (rr.id !== undefined && !isSafeId(rr.id)) {
            return { valid: false, error: `Invalid roleReversal ID "${rr.id}".` };
          }
          for (const f of ['counterpart', 'roleName', 'incumbentTitle', 'counterpartProfile', 'primaryInterests', 'perceivedThreats', 'unspokenIncentives', 'respectfulEngagementStrategy']) {
            if (rr[f] !== undefined && typeof rr[f] !== 'string') {
              return { valid: false, error: `Role reversal ${f} must be a string.` };
            }
          }
        }
      }
      if (data.module4.fieldSetbacks !== undefined) {
        if (!Array.isArray(data.module4.fieldSetbacks) || data.module4.fieldSetbacks.some(sb => !sb || typeof sb !== 'object' || Array.isArray(sb))) {
          return { valid: false, error: 'Module 4 fieldSetbacks must be an array of non-null objects.' };
        }
        for (const sb of data.module4.fieldSetbacks) {
          if (sb.id !== undefined && !isSafeId(sb.id)) {
            return { valid: false, error: `Invalid setback ID "${sb.id}".` };
          }
          for (const f of ['title', 'scenario', 'rootCause', 'negotiationStrategy', 'resolutionAction']) {
            if (sb[f] !== undefined && typeof sb[f] !== 'string') {
              return { valid: false, error: `Setback ${f} must be a string.` };
            }
          }
          if (sb.status !== undefined && !['Scheduled', 'In Progress', 'Resolved'].includes(sb.status)) {
            return { valid: false, error: `Invalid setback status "${sb.status}".` };
          }
        }
      }
      for (const objKey of ['mmaStrategy', 'reflection']) {
        if (data.module4[objKey] !== undefined) {
          if (!data.module4[objKey] || typeof data.module4[objKey] !== 'object' || Array.isArray(data.module4[objKey])) {
            return { valid: false, error: `Module 4 ${objKey} must be an object.` };
          }
          for (const [k, v] of Object.entries(data.module4[objKey])) {
            if (typeof v !== 'string') return { valid: false, error: `Module 4 ${objKey}.${k} must be a string.` };
          }
        }
      }
    }

    // Module 5 validation
    if (data.module5 !== undefined) {
      if (data.module5 === null || typeof data.module5 !== 'object' || Array.isArray(data.module5)) {
        return { valid: false, error: 'Invalid module5 structure in imported JSON.' };
      }
      if (data.module5.kpiEvaluations !== undefined) {
        if (!Array.isArray(data.module5.kpiEvaluations) || data.module5.kpiEvaluations.some(ev => !ev || typeof ev !== 'object' || Array.isArray(ev))) {
          return { valid: false, error: 'Module 5 kpiEvaluations must be an array of non-null objects.' };
        }
        for (const ev of data.module5.kpiEvaluations) {
          if (ev.id !== undefined && !isSafeId(ev.id)) {
            return { valid: false, error: `Invalid evaluation ID "${ev.id}".` };
          }
          for (const f of ['kpiTitle', 'kpiId', 'baselineValue', 'targetValue', 'actualValue', 'varianceAnalysis', 'correctiveAction']) {
            if (ev[f] !== undefined && typeof ev[f] !== 'string') {
              return { valid: false, error: `Evaluation ${f} must be a string.` };
            }
          }
          if (ev.varianceStatus !== undefined && !['On Track', 'Delayed', 'Critical Variance', 'Exceeded', 'Pending Verification', 'Pending Evaluation', 'Pending'].includes(ev.varianceStatus)) {
            return { valid: false, error: `Invalid varianceStatus in Module 5: "${ev.varianceStatus}".` };
          }
        }
      }
      if (data.module5.adjustments !== undefined) {
        if (!Array.isArray(data.module5.adjustments) || data.module5.adjustments.some(adj => !adj || typeof adj !== 'object' || Array.isArray(adj))) {
          return { valid: false, error: 'Module 5 adjustments must be an array of non-null objects.' };
        }
        for (const adj of data.module5.adjustments) {
          if (adj.id !== undefined && !isSafeId(adj.id)) {
            return { valid: false, error: `Invalid adjustment ID "${adj.id}".` };
          }
          for (const f of ['recommendationTitle', 'justification', 'actionPlan', 'stakeholderOwner']) {
            if (adj[f] !== undefined && typeof adj[f] !== 'string') {
              return { valid: false, error: `Adjustment ${f} must be a string.` };
            }
          }
          if (adj.reaction !== undefined && adj.reaction !== '' && !['Fully Accept', 'Partially Accept', 'Reject'].includes(adj.reaction)) {
            return { valid: false, error: `Invalid reaction in Module 5 adjustments: "${adj.reaction}".` };
          }
        }
      }
      for (const objKey of ['crisisAnalysis', 'impactAssessment', 'reflection']) {
        if (data.module5[objKey] !== undefined) {
          if (!data.module5[objKey] || typeof data.module5[objKey] !== 'object' || Array.isArray(data.module5[objKey])) {
            return { valid: false, error: `Module 5 ${objKey} must be an object.` };
          }
          for (const [k, v] of Object.entries(data.module5[objKey])) {
            if (typeof v !== 'string') return { valid: false, error: `Module 5 ${objKey}.${k} must be a string.` };
          }
        }
      }
    }

    // Module 6 validation
    if (data.module6 !== undefined) {
      if (data.module6 === null || typeof data.module6 !== 'object' || Array.isArray(data.module6)) {
        return { valid: false, error: 'Invalid module6 structure in imported JSON.' };
      }
      if (data.module6.transitionRoadmap !== undefined) {
        if (!Array.isArray(data.module6.transitionRoadmap) || data.module6.transitionRoadmap.some(r => !r || typeof r !== 'object' || Array.isArray(r))) {
          return { valid: false, error: 'Module 6 transitionRoadmap must be an array of non-null objects.' };
        }
        for (const r of data.module6.transitionRoadmap) {
          if (r.id !== undefined && !isSafeId(r.id)) {
            return { valid: false, error: `Invalid roadmap ID "${r.id}".` };
          }
          for (const f of ['phase', 'milestone', 'leadResponsible', 'lead', 'handoverCriteria', 'exitCriteria', 'status']) {
            if (r[f] !== undefined && typeof r[f] !== 'string') {
              return { valid: false, error: `Roadmap step ${f} must be a string.` };
            }
          }
        }
      }
      if (data.module6.challengesRemedies !== undefined) {
        if (!Array.isArray(data.module6.challengesRemedies) || data.module6.challengesRemedies.some(cr => !cr || typeof cr !== 'object' || Array.isArray(cr))) {
          return { valid: false, error: 'Module 6 challengesRemedies must be an array of non-null objects.' };
        }
        for (const cr of data.module6.challengesRemedies) {
          if (cr.id !== undefined && !isSafeId(cr.id)) {
            return { valid: false, error: `Invalid challenge ID "${cr.id}".` };
          }
          for (const f of ['challenge', 'remedy', 'preventiveAction', 'remedyOwner']) {
            if (cr[f] !== undefined && typeof cr[f] !== 'string') {
              return { valid: false, error: `Challenge item ${f} must be a string.` };
            }
          }
          if (cr.riskLevel !== undefined && !['Low', 'Medium', 'High'].includes(cr.riskLevel)) {
            return { valid: false, error: `Invalid riskLevel in Module 6 challenges: "${cr.riskLevel}".` };
          }
        }
      }
      for (const objKey of ['fourPrinciplesFramework', 'transitionStrategy', 'institutionalizingPractice', 'handoverNotice', 'reflection']) {
        if (data.module6[objKey] !== undefined) {
          if (!data.module6[objKey] || typeof data.module6[objKey] !== 'object' || Array.isArray(data.module6[objKey])) {
            return { valid: false, error: `Module 6 ${objKey} must be an object.` };
          }
          for (const [k, v] of Object.entries(data.module6[objKey])) {
            if (typeof v !== 'string') return { valid: false, error: `Module 6 ${objKey}.${k} must be a string.` };
          }
        }
      }
    }

    // Common status & confirmed checks for modules 1-6
    for (let i = 1; i <= 6; i++) {
      const mod = data['module' + i];
      if (mod && typeof mod === 'object') {
        if (mod.status !== undefined && !['not_started', 'in_progress', 'completed'].includes(mod.status)) {
          return { valid: false, error: `Invalid module${i} status "${mod.status}".` };
        }
        if (mod.confirmed !== undefined && typeof mod.confirmed !== 'boolean') {
          return { valid: false, error: `Module${i} confirmed flag must be a boolean.` };
        }
      }
    }

    return { valid: true };
  }

  function importLabFromJson(jsonString) {
    try {
      let parsed;
      try {
        parsed = JSON.parse(jsonString);
      } catch (err) {
        return { success: false, error: 'Malformed JSON syntax: ' + err.message };
      }
      const validation = validateImportedData(parsed);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      const merged = deepMerge(getDefaultState(), parsed);
      const saved = saveLabState(merged);
      if (!saved) {
        return { success: false, error: 'Failed to persist imported data to local storage (quota exceeded or storage blocked).' };
      }
      return { success: true, state: merged };
    } catch (e) {
      return { success: false, error: 'Import failed: ' + e.message };
    }
  }

  function renderCurriculumTrack(currentModuleNum, targetContainer) {
    if (typeof document === 'undefined') return;
    const container = targetContainer || document.getElementById('curriculumTrackGrid') || document.querySelector('.curriculum-track-grid');
    if (!container) return;

    const state = loadLabState();
    const modules = [
      { num: 1, file: 'module1.html', title: 'Situational Analysis', desc: '"As is" baseline & conflict scan', key: 'module1' },
      { num: 2, file: 'module2.html', title: 'Objective Setting', desc: '"To be" SMART & Prioritisation', key: 'module2' },
      { num: 3, file: 'module3.html', title: 'Planning Activities', desc: '"What to" Logframe & RBB', key: 'module3' },
      { num: 4, file: 'module4.html', title: 'Implementation', desc: '"How to" MMA execution', key: 'module4' },
      { num: 5, file: 'module5.html', title: 'Evaluation & Adjust.', desc: '"Did we" Impact & adaptation', key: 'module5' },
      { num: 6, file: 'module6.html', title: 'Transition & Handover', desc: '"Sustain" Exit & local ownership', key: 'module6' }
    ];

    let confirmedCount = 0;
    modules.forEach(m => {
      if (state[m.key] && state[m.key].confirmed) confirmedCount++;
    });

    const cycle = getFullCycleProgress(state);
    const header = container.parentElement?.querySelector('.curriculum-track-header');
    if (header) {
      const subtitleEl = document.getElementById('curriculumTrackSubtitle') || header.querySelector('span:last-child');
      if (subtitleEl) {
        subtitleEl.textContent = cycle.allConfirmed
          ? '6 of 6 Phases Self-Confirmed · Full Cycle Review Ready'
          : `${cycle.confirmedCount} of 6 Phases Self-Confirmed · Cycle In Progress`;
      }
    }

    container.innerHTML = modules.map(m => {
      const isCurrent = m.num === currentModuleNum;
      const isConfirmed = !!(state[m.key] && state[m.key].confirmed);
      const modStatus = getModuleProgressStatus(state[m.key], m.num);

      let stepClass = 'track-step';
      let badgeText = `Phase 0${m.num}`;

      if (isCurrent) {
        stepClass += isConfirmed ? ' completed active' : ' active';
        badgeText += isConfirmed ? ' · Confirmed' : (modStatus === 'in_progress' ? ' · In Progress' : ' · Active');
      } else if (isConfirmed) {
        stepClass += ' completed';
        badgeText += ' · Confirmed';
      } else if (modStatus === 'in_progress') {
        stepClass += ' in-progress';
        badgeText += ' · In Progress';
      } else {
        stepClass += ' not-started';
        badgeText += ' · Not Started';
      }

      return `
        <a href="${m.file}" class="${stepClass}" title="Go to Phase ${m.num}: ${m.title}">
          <span class="track-num">${badgeText}</span>
          <span class="track-title">${m.title}</span>
          <span class="track-desc">${m.desc}</span>
        </a>
      `;
    }).join('');
  }

  const RESET_EVENT_KEY = 'carana_cbd_lab_reset_token';

  function showToast(message, type = 'info') {
    if (typeof document === 'undefined') return;
    let container = document.getElementById('labToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'labToastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠️' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span style="font-size:1.15rem; line-height:1;">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function promptResetModal() {
    if (typeof document === 'undefined') return;
    let backdrop = document.getElementById('labResetModalBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'labResetModalBackdrop';
      backdrop.className = 'reset-modal-backdrop';
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');
      backdrop.setAttribute('aria-labelledby', 'resetModalTitle');
      backdrop.innerHTML = `
        <div class="reset-modal-box">
          <div class="reset-modal-header">
            <span style="font-size: 1.5rem; line-height: 1;">⚠️</span>
            <h3 id="resetModalTitle">Start New Session · Reset Learning Lab</h3>
          </div>
          <div class="reset-modal-body">
            <p><strong>Are you sure you want to reset the Learning Lab?</strong></p>
            <p>
              This will clear participant inputs, scores, SWOT items, logframe data, and progress across all <strong>six modules</strong> and restore a clean participant training workspace.
            </p>
            <div class="reset-safeguard-box">
              <strong>Data Safety Notice:</strong>
              <ul style="margin: 6px 0 0; padding-left: 18px;">
                <li>Existing participant work will be lost unless exported.</li>
                <li>The standalone <strong>60-Minute Fast Track Quick Exercise</strong> data is independent and will <strong>not</strong> be affected.</li>
                <li>Official curriculum references and scenario facts remain intact.</li>
              </ul>
            </div>
            <div style="margin-top: 14px;">
              <button type="button" class="btn btn-sm btn-dark" id="resetModalExportBtn" style="width: 100%;">
                💾 Download Complete State Backup (.json) First
              </button>
              <div id="resetModalExportFeedback" style="display:none; font-size: 0.82rem; color: var(--ok); font-weight: 700; margin-top: 6px; text-align: center;">
                ✓ Lab backup exported successfully!
              </div>
            </div>
          </div>
          <div class="reset-modal-footer">
            <button type="button" class="btn btn-ghost" id="resetModalCancelBtn">
              Cancel (Keep Work)
            </button>
            <button type="button" class="btn btn-danger" id="resetModalConfirmBtn">
              Confirm & Start New Session
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);

      const cancelBtn = backdrop.querySelector('#resetModalCancelBtn');
      const confirmBtn = backdrop.querySelector('#resetModalConfirmBtn');
      const exportBtn = backdrop.querySelector('#resetModalExportBtn');
      const feedback = backdrop.querySelector('#resetModalExportFeedback');

      function closeModal() {
        backdrop.classList.remove('open');
        if (feedback) feedback.style.display = 'none';
      }

      cancelBtn.onclick = closeModal;
      backdrop.onclick = e => { if (e.target === backdrop) closeModal(); };
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && backdrop.classList.contains('open')) closeModal();
      });

      exportBtn.onclick = () => {
        exportLabAsJson();
        if (feedback) feedback.style.display = 'block';
        showToast('Complete Lab backup exported to JSON.', 'success');
      };

      confirmBtn.onclick = () => {
        closeModal();
        resetLabState();
        showToast('Learning Lab has been reset to a clean session.', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      };
    }

    backdrop.classList.add('open');
  }

  function resetLabState() {
    if (typeof window !== 'undefined') {
      window.__labIsResetting = true;
      try {
        window.dispatchEvent(new CustomEvent('carana_cbd_lab_reset'));
      } catch (e) {
        // ignore
      }
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
    const fresh = getDefaultState();
    saveLabState(fresh);
    try {
      // Broadcast reset token so other tabs immediately synchronize without ghost-writing
      localStorage.setItem(RESET_EVENT_KEY, Date.now().toString());
    } catch (e) {
      // ignore
    }
    return fresh;
  }

  function preparePrintableContent() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('.printable-clone').forEach(el => el.remove());
    document.querySelectorAll('textarea').forEach(ta => {
      const clone = document.createElement('div');
      clone.className = 'printable-clone printable-textarea-clone';
      clone.textContent = ta.value || '—';
      ta.parentNode.insertBefore(clone, ta);
      ta.classList.add('printable-clone-hidden');
    });
    document.querySelectorAll('input[type="text"], input[type="number"], input:not([type])').forEach(inp => {
      if (inp.type === 'hidden' || inp.type === 'button' || inp.type === 'submit') return;
      const clone = document.createElement('div');
      clone.className = 'printable-clone printable-input-clone';
      clone.textContent = inp.value || '—';
      inp.parentNode.insertBefore(clone, inp);
      inp.classList.add('printable-clone-hidden');
    });
  }

  function cleanupPrintableContent() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('.printable-clone').forEach(el => el.remove());
    document.querySelectorAll('.printable-clone-hidden').forEach(el => el.classList.remove('printable-clone-hidden'));
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeprint', preparePrintableContent);
    window.addEventListener('afterprint', cleanupPrintableContent);

    // Auto-bind reset buttons
    window.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('[data-action="reset-lab"], #resetLabBtn, .reset-lab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          promptResetModal();
        });
      });
    });
  }

  return {
    STORAGE_KEY,
    RESET_EVENT_KEY,
    SCHEMA_VERSION,
    getDefaultState,
    loadLabState,
    saveLabState,
    exportLabAsJson,
    importLabFromJson,
    resetLabState,
    promptResetModal,
    showToast,
    validateImportedData,
    renderCurriculumTrack,
    getModuleProgressStatus,
    getFullCycleProgress,
    deepMerge,
    preparePrintableContent,
    cleanupPrintableContent
  };
});
