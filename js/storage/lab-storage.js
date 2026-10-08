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
        status: 'not_started',
        description: 'Objective Setting, Prioritisation and Performance Frameworks'
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
