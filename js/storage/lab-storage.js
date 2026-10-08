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
        status: 'not_started',
        description: 'Planning Activities, Logframe and RBB'
      },
      module4: {
        status: 'not_started',
        description: 'Implementation and Monitoring'
      },
      module5: {
        status: 'not_started',
        description: 'Evaluation and Adjustment'
      },
      module6: {
        status: 'not_started',
        description: 'Transition and Handover'
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
