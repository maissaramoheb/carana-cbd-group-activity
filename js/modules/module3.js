/**
 * Module 3: Planning Activities Controller
 * CARANA CBD Learning Lab
 * Fully implements the UNPOL CBD Job-Specific Training (JST) Lesson 3 methodology:
 * Theory of Change, Logical Framework Matrix (Logframe), Results-Based Budgeting (RBB),
 * 3x3 Risk Matrix, and Contingency Planning.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['../data/carana-scenario.js', '../data/curriculum-glossary.js', '../storage/lab-storage.js'], factory);
  } else if (typeof module === 'object' && module.exports) {
    const scenario = require('../data/carana-scenario.js');
    const glossary = require('../data/curriculum-glossary.js');
    const storage = require('../storage/lab-storage.js');
    module.exports = factory(scenario, glossary, storage);
  } else {
    root.Module3App = factory(root.CARANA_SCENARIO, root.CURRICULUM_GLOSSARY, root.LabStorage);
  }
})(typeof self !== 'undefined' ? self : this, function (Scenario, Glossary, Storage) {
  'use strict';

  let state = null;
  let activeStage = 'stage-toc';

  const STAGES = [
    { id: 'stage-toc', label: '1. Theory of Change & Tools', short: 'Theory of Change' },
    { id: 'stage-logframe', label: '2. Logical Framework (Logframe)', short: 'Logframe Matrix' },
    { id: 'stage-risks', label: '3. Risk Analysis Register', short: 'Risk Register' },
    { id: 'stage-risk-matrix', label: '4. 3×3 Risk Matrix', short: '3×3 Risk Grid' },
    { id: 'stage-contingency', label: '5. Contingency Planning', short: 'Contingency' },
    { id: 'stage-summary', label: '6. Review, Reflection & Bridge', short: 'Review & Bridge' }
  ];

  function init() {
    state = Storage.loadLabState();
    if (!state.module3 || !state.module3.logframe) {
      state.module3 = Storage.getDefaultState().module3;
    }
    recalculateRisks();
    bindGlobalControls();
    renderStageTabs();
    populateFormFields();
    renderLogframeTables();
    renderRisks();
    render3x3RiskMatrix();
    renderScenarioDrawerList();
    renderGlossaryList();
    Storage.renderCurriculumTrack(3);
    updateSaveIndicator('Loaded local data');
    setupAutosaveListener();
    setupLifecycleListeners();
  }

  function save(statusMsg) {
    collectFormFields();
    const ok = Storage.saveLabState(state);
    if (!ok) {
      updateSaveIndicator('⚠️ Storage full or blocked! Export JSON.', true);
    } else {
      updateSaveIndicator(statusMsg || 'Saved locally');
    }
    Storage.renderCurriculumTrack(3);
    return ok;
  }

  function updateSaveIndicator(msg, isError) {
    const el = document.getElementById('saveIndicator');
    if (el) {
      el.textContent = msg || 'Saved locally on this device';
      el.style.color = isError ? 'var(--danger)' : 'var(--ok)';
    }
  }

  function setupAutosaveListener() {
    document.addEventListener('input', e => {
      if (e.target && e.target.id !== 'confirmModule3' && e.target.id !== 'selfConfirmCheck') {
        invalidateConfirmation();
      }
    });
    document.addEventListener('input', debounce(() => {
      save('Autosaved');
      render3x3RiskMatrix();
    }, 600));
  }

  function invalidateConfirmation() {
    if (state.module3 && state.module3.confirmed) {
      state.module3.confirmed = false;
      const chk = document.getElementById('confirmModule3') || document.getElementById('selfConfirmCheck');
      if (chk) chk.checked = false;
      updateCompletionBadge();
    }
  }

  function updateCompletionBadge() {
    const badge = document.getElementById('stageCompleteFooterBadge');
    if (!badge) return;
    if (state.module3 && state.module3.confirmed) {
      badge.textContent = '✓ Phase 3 Self-Confirmed · Ready for Module 4';
      badge.style.color = 'var(--ok)';
    } else {
      badge.textContent = 'Phase 3 In Progress · Pending Self-Confirmation';
      badge.style.color = 'var(--navy)';
    }
  }

  function setupLifecycleListeners() {
    window.addEventListener('beforeunload', () => save());
    window.addEventListener('pagehide', () => save());
    window.addEventListener('storage', e => {
      if (e.key === Storage.STORAGE_KEY) {
        collectFormFields();
        const incoming = Storage.loadLabState();
        if (!incoming) return;
        for (let i = 1; i <= 6; i++) {
          const modKey = 'module' + i;
          if (modKey !== 'module3' && incoming[modKey]) {
            state[modKey] = incoming[modKey];
          }
        }
        if (incoming.session) {
          const activeId = document.activeElement ? document.activeElement.id : '';
          if (!['teamNameInput', 'participantsInput', 'noteTakerInput'].includes(activeId)) {
            state.session = incoming.session;
          }
        }
        Storage.saveLabState(state);
        Storage.renderCurriculumTrack(3);
        updateSaveIndicator('Synced from another tab');
      }
    });
  }

  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /* Stage Navigation */
  function setStage(stageId) {
    activeStage = stageId;
    document.querySelectorAll('.stage-panel').forEach(p => {
      p.classList.toggle('active', p.id === stageId);
    });
    document.querySelectorAll('.stage-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.stage === stageId);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (stageId === 'stage-logframe') renderLogframeTables();
    if (stageId === 'stage-risks') renderRisks();
    if (stageId === 'stage-risk-matrix') render3x3RiskMatrix();
  }

  function renderStageTabs() {
    const container = document.getElementById('stageNav');
    if (!container) return;
    container.innerHTML = STAGES.map((s, idx) => `
      <button class="stage-tab ${s.id === activeStage ? 'active' : ''}" data-stage="${s.id}" type="button">
        <span class="badge">0${idx + 1}</span>
        <span>${escapeHtml(s.short)}</span>
      </button>
    `).join('');

    container.querySelectorAll('.stage-tab').forEach(b => {
      b.onclick = () => setStage(b.dataset.stage);
    });
  }

  /* Form Data Sync */
  function populateFormFields() {
    setValue('teamName', state.session.teamName);
    setValue('sessionDate', state.session.date);

    // Theory of Change
    const toc = state.module3.theoryOfChange || {};
    setValue('tocDriver', toc.driver);
    setValue('tocConditions', toc.criticalConditions);
    setValue('tocRationale', toc.rationale);

    // Logframe Impact
    const imp = state.module3.logframe?.impact || {};
    setValue('logframeImpactNarrative', imp.narrative);
    setValue('logframeImpactIndicators', imp.indicators);
    setValue('logframeImpactVerification', imp.verification);
    setValue('logframeImpactAssumptions', imp.assumptions);

    // Contingency
    const cont = state.module3.contingency || {};
    setValue('contingencyTrigger', cont.trigger);
    setValue('contingencyBackupPlan', cont.backupPlan);
    setValue('contingencyPersonnel', cont.continuityPersonnel);
    setValue('contingencyCommunication', cont.stakeholderCommunication);

    // Reflection
    const ref = state.module3.reflection || {};
    setValue('reflectionExperience', ref.q1Experience);
    setValue('reflectionHierarchy', ref.q2PlanningHierarchy);
    setValue('reflectionRisk', ref.q3RiskPreparedness);

    const confirmBox = document.getElementById('confirmModule3');
    if (confirmBox) confirmBox.checked = !!state.module3.confirmed;
  }

  function collectFormFields() {
    state.module3.theoryOfChange = {
      driver: getValue('tocDriver'),
      criticalConditions: getValue('tocConditions'),
      rationale: getValue('tocRationale')
    };

    if (!state.module3.logframe) state.module3.logframe = {};
    state.module3.logframe.impact = {
      narrative: getValue('logframeImpactNarrative'),
      indicators: getValue('logframeImpactIndicators'),
      verification: getValue('logframeImpactVerification'),
      assumptions: getValue('logframeImpactAssumptions')
    };

    state.module3.contingency = {
      trigger: getValue('contingencyTrigger'),
      backupPlan: getValue('contingencyBackupPlan'),
      continuityPersonnel: getValue('contingencyPersonnel'),
      stakeholderCommunication: getValue('contingencyCommunication')
    };

    state.module3.reflection = {
      q1Experience: getValue('reflectionExperience'),
      q2PlanningHierarchy: getValue('reflectionHierarchy'),
      q3RiskPreparedness: getValue('reflectionRisk')
    };

    const confirmBox = document.getElementById('confirmModule3');
    if (confirmBox) state.module3.confirmed = confirmBox.checked;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  /* Logframe Hierarchy Render */
  function renderLogframeTables() {
    renderOutcomesTable();
    renderOutputsTable();
    renderActivitiesTable();
  }

  function renderOutcomesTable() {
    const host = document.getElementById('logframeOutcomesBody');
    if (!host) return;
    const outcomes = state.module3.logframe?.outcomes || [];

    host.innerHTML = outcomes.map((o, idx) => `
      <tr data-idx="${idx}">
        <td style="font-weight: 700;">Outcome ${idx + 1}</td>
        <td><textarea class="form-textarea out-field" data-idx="${idx}" data-field="narrative" style="min-height: 60px;" aria-label="Outcome ${idx + 1} narrative">${escapeHtml(o.narrative || '')}</textarea></td>
        <td><textarea class="form-textarea out-field" data-idx="${idx}" data-field="indicators" style="min-height: 60px;" aria-label="Outcome ${idx + 1} indicators">${escapeHtml(o.indicators || '')}</textarea></td>
        <td><textarea class="form-textarea out-field" data-idx="${idx}" data-field="verification" style="min-height: 60px;" aria-label="Outcome ${idx + 1} verification">${escapeHtml(o.verification || '')}</textarea></td>
        <td><textarea class="form-textarea out-field" data-idx="${idx}" data-field="assumptions" style="min-height: 60px;" aria-label="Outcome ${idx + 1} assumptions">${escapeHtml(o.assumptions || '')}</textarea></td>
        <td><button class="btn btn-sm btn-danger remove-out-btn" data-idx="${idx}" type="button" aria-label="Remove outcome ${idx + 1}">×</button></td>
      </tr>
    `).join('');

    host.querySelectorAll('.out-field').forEach(el => {
      el.addEventListener('input', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        state.module3.logframe.outcomes[i][f] = e.target.value;
        save();
      });
    });

    host.querySelectorAll('.remove-out-btn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.idx;
        if (state.module3.logframe.outcomes.length > 1) {
          state.module3.logframe.outcomes.splice(i, 1);
          save();
          renderLogframeTables();
        }
      };
    });
  }

  function renderOutputsTable() {
    const host = document.getElementById('logframeOutputsBody');
    if (!host) return;
    const outputs = state.module3.logframe?.outputs || [];
    const outcomes = state.module3.logframe?.outcomes || [];

    function getOutputCode(outpIndex) {
      const op = outputs[outpIndex];
      if (!op) return '1.1';
      const pOutcomeIdx = outcomes.findIndex(o => o.id === op.outcomeId);
      const outcomeNum = pOutcomeIdx >= 0 ? (pOutcomeIdx + 1) : 1;
      const siblingOutputs = outputs.filter((o, i) => (o.outcomeId === op.outcomeId || (!o.outcomeId && pOutcomeIdx <= 0)) && i <= outpIndex);
      return `${outcomeNum}.${siblingOutputs.length}`;
    }

    host.innerHTML = outputs.map((op, idx) => {
      const outputCode = getOutputCode(idx);
      const outcomeOptions = outcomes.length > 0
        ? outcomes.map((o, oIdx) => `<option value="${escapeHtml(o.id)}" ${op.outcomeId === o.id ? 'selected' : ''}>Outcome ${oIdx + 1}</option>`).join('')
        : `<option value="out-1">Outcome 1</option>`;

      return `
        <tr data-idx="${idx}">
          <td>
            <div style="font-weight: 700; margin-bottom: 4px;">Output ${outputCode}</div>
            <select class="form-select outp-field" data-idx="${idx}" data-field="outcomeId" style="font-size: 0.78rem; padding: 4px;" aria-label="Parent Outcome for Output ${outputCode}">
              ${outcomeOptions}
            </select>
          </td>
          <td><textarea class="form-textarea outp-field" data-idx="${idx}" data-field="narrative" placeholder="Tangible deliverable narrative..." style="min-height: 60px;" aria-label="Output ${outputCode} narrative">${escapeHtml(op.narrative || '')}</textarea></td>
          <td><textarea class="form-textarea outp-field" data-idx="${idx}" data-field="indicators" placeholder="Objectively verifiable indicators..." style="min-height: 60px;" aria-label="Output ${outputCode} indicators">${escapeHtml(op.indicators || '')}</textarea></td>
          <td><textarea class="form-textarea outp-field" data-idx="${idx}" data-field="verification" placeholder="Means of verification..." style="min-height: 60px;" aria-label="Output ${outputCode} verification">${escapeHtml(op.verification || '')}</textarea></td>
          <td><textarea class="form-textarea outp-field" data-idx="${idx}" data-field="assumptions" placeholder="Output assumptions & risks..." style="min-height: 60px;" aria-label="Output ${outputCode} assumptions">${escapeHtml(op.assumptions || '')}</textarea></td>
          <td><button class="btn btn-sm btn-danger remove-outp-btn" data-idx="${idx}" type="button" aria-label="Remove output ${outputCode}">×</button></td>
        </tr>
      `;
    }).join('');

    host.querySelectorAll('.outp-field').forEach(el => {
      el.addEventListener('input', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        state.module3.logframe.outputs[i][f] = e.target.value;
        invalidateConfirmation();
        save();
        if (f === 'outcomeId') {
          renderLogframeTables();
        }
      });
      el.addEventListener('change', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        if (f === 'outcomeId') {
          state.module3.logframe.outputs[i][f] = e.target.value;
          invalidateConfirmation();
          save();
          renderLogframeTables();
        }
      });
    });

    host.querySelectorAll('.remove-outp-btn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.idx;
        if (state.module3.logframe.outputs.length > 1) {
          state.module3.logframe.outputs.splice(i, 1);
          invalidateConfirmation();
          save();
          renderLogframeTables();
        }
      };
    });
  }

  function renderActivitiesTable() {
    const host = document.getElementById('logframeActivitiesBody');
    if (!host) return;
    const activities = state.module3.logframe?.activities || [];
    const outputs = state.module3.logframe?.outputs || [];
    const outcomes = state.module3.logframe?.outcomes || [];

    function getOutputCode(opId) {
      const opIdx = outputs.findIndex(o => o.id === opId);
      if (opIdx < 0) return '1.1';
      const op = outputs[opIdx];
      const pOutcomeIdx = outcomes.findIndex(o => o.id === op.outcomeId);
      const outcomeNum = pOutcomeIdx >= 0 ? (pOutcomeIdx + 1) : 1;
      const siblingOutputs = outputs.filter((o, i) => (o.outcomeId === op.outcomeId || (!o.outcomeId && pOutcomeIdx <= 0)) && i <= opIdx);
      return `${outcomeNum}.${siblingOutputs.length}`;
    }

    host.innerHTML = activities.map((act, idx) => {
      const parentCode = getOutputCode(act.outputId);
      const parentOpIdx = outputs.findIndex(o => o.id === act.outputId);
      const siblingActivities = activities.filter((a, i) => (a.outputId === act.outputId || (!a.outputId && parentOpIdx <= 0)) && i <= idx);
      const actSubIdx = siblingActivities.length;
      const activityCode = `${parentCode}.${actSubIdx}`;

      const outputOptions = outputs.length > 0
        ? outputs.map(op => `<option value="${escapeHtml(op.id)}" ${act.outputId === op.id ? 'selected' : ''}>Output ${getOutputCode(op.id)}</option>`).join('')
        : `<option value="outp-1">Output 1.1</option>`;

      return `
        <tr data-idx="${idx}">
          <td>
            <div style="font-weight: 700; margin-bottom: 4px;">Activity ${activityCode}</div>
            <select class="form-select act-field" data-idx="${idx}" data-field="outputId" style="font-size: 0.78rem; padding: 4px;" aria-label="Parent Output for Activity ${activityCode}">
              ${outputOptions}
            </select>
          </td>
          <td><textarea class="form-textarea act-field" data-idx="${idx}" data-field="narrative" placeholder="Planned activity description..." style="min-height: 60px;" aria-label="Activity ${activityCode} narrative">${escapeHtml(act.narrative || '')}</textarea></td>
          <td><textarea class="form-textarea act-field" data-idx="${idx}" data-field="inputs" placeholder="Capital, Labor, Knowledge (RBB)" style="min-height: 60px;" aria-label="Activity ${activityCode} resource inputs">${escapeHtml(act.inputs || '')}</textarea></td>
          <td><textarea class="form-textarea act-field" data-idx="${idx}" data-field="verification" placeholder="Verification / monitoring..." style="min-height: 60px;" aria-label="Activity ${activityCode} verification">${escapeHtml(act.verification || '')}</textarea></td>
          <td><textarea class="form-textarea act-field" data-idx="${idx}" data-field="assumptions" placeholder="Activity assumptions & risks..." style="min-height: 60px;" aria-label="Activity ${activityCode} assumptions">${escapeHtml(act.assumptions || '')}</textarea></td>
          <td><button class="btn btn-sm btn-danger remove-act-btn" data-idx="${idx}" type="button" aria-label="Remove activity ${activityCode}">×</button></td>
        </tr>
      `;
    }).join('');

    host.querySelectorAll('.act-field').forEach(el => {
      el.addEventListener('input', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        state.module3.logframe.activities[i][f] = e.target.value;
        invalidateConfirmation();
        save();
        if (f === 'outputId') {
          renderLogframeTables();
        }
      });
      el.addEventListener('change', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        if (f === 'outputId') {
          state.module3.logframe.activities[i][f] = e.target.value;
          invalidateConfirmation();
          save();
          renderLogframeTables();
        }
      });
    });

    host.querySelectorAll('.remove-act-btn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.idx;
        if (state.module3.logframe.activities.length > 1) {
          state.module3.logframe.activities.splice(i, 1);
          invalidateConfirmation();
          save();
          renderLogframeTables();
        }
      };
    });
  }

  function addOutcomeRow() {
    if (!state.module3.logframe.outcomes) state.module3.logframe.outcomes = [];
    state.module3.logframe.outcomes.push({
      id: 'out-' + Date.now(),
      narrative: '',
      indicators: '',
      verification: '',
      assumptions: ''
    });
    save();
    renderOutcomesTable();
  }

  function addOutputRow() {
    if (!state.module3.logframe.outputs) state.module3.logframe.outputs = [];
    const defaultParent = state.module3.logframe.outcomes?.[0]?.id || 'out-1';
    state.module3.logframe.outputs.push({
      id: 'outp-' + Date.now(),
      outcomeId: defaultParent,
      narrative: '',
      indicators: '',
      verification: '',
      assumptions: ''
    });
    save();
    renderOutputsTable();
  }

  function addActivityRow() {
    if (!state.module3.logframe.activities) state.module3.logframe.activities = [];
    const defaultParent = state.module3.logframe.outputs?.[0]?.id || 'outp-1';
    state.module3.logframe.activities.push({
      id: 'act-' + Date.now(),
      outputId: defaultParent,
      narrative: '',
      inputs: '',
      verification: '',
      assumptions: ''
    });
    save();
    renderActivitiesTable();
  }

  /* Inter-Module Data Pipeline: Import from Module 2 */
  function importFromModule2() {
    const m2 = state.module2;
    if (!m2 || !m2.smartObjectives || m2.smartObjectives.length === 0) {
      alert('No SMART objectives found in Module 2. Complete Module 2 first.');
      return;
    }

    if (!state.module3.logframe.outcomes) state.module3.logframe.outcomes = [];
    const hasExisting = state.module3.logframe.outcomes.length > 0;
    if (hasExisting) {
      const choice = confirm('You already have Logframe Outcomes.\n\nClick OK to MERGE (add missing objectives without deleting existing outcomes), or CANCEL to keep current outcomes without changes.');
      if (!choice) return;
    }

    let added = 0;
    m2.smartObjectives.forEach((smart, idx) => {
      const title = smart.fullStatement || smart.title || '';
      if (!title) return;
      const exists = state.module3.logframe.outcomes.some(o => 
        (smart.objectiveId && o.id.includes(smart.objectiveId)) || (o.narrative && o.narrative.toLowerCase() === title.toLowerCase())
      );
      if (!exists) {
        const relatedKpi = m2.kpis?.find(k => k.smartId === smart.id);
        state.module3.logframe.outcomes.push({
          id: 'out-' + (smart.objectiveId || smart.id || (idx + 1)),
          narrative: title,
          indicators: relatedKpi ? `${relatedKpi.name} (Target: ${relatedKpi.targetValue || 'N/A'})` : smart.measurable || '',
          verification: relatedKpi ? (relatedKpi.source || 'Records audit') : 'Inspection and records',
          assumptions: 'Institutional stability and host-State commitment'
        });
        added++;
      }
    });

    save('Imported Module 2 SMART Outcomes');
    renderLogframeTables();
    alert(`Imported ${added} SMART objectives from Module 2 into Logframe Outcomes.`);
  }

  /* Inter-Module Data Pipeline: Import Risks from Module 1 SWOT Threats */
  function importThreatsFromModule1() {
    const m1 = state.module1;
    if (!m1 || !m1.swot || !m1.swot.threats || m1.swot.threats.length === 0) {
      alert('No SWOT threats found in Module 1.');
      return;
    }

    let added = 0;
    m1.swot.threats.forEach(t => {
      const exists = state.module3.risks.some(r => r.title.toLowerCase() === t.text.toLowerCase());
      if (!exists && t.text) {
        state.module3.risks.push({
          id: 'risk-' + Date.now() + '-' + added,
          title: t.text,
          description: 'Identified as external threat during Module 1 SWOT situational analysis.',
          likelihood: 2,
          impact: 3,
          magnitude: 6,
          zone: 'red',
          mitigationStrategy: 'Develop preventive liaison and continuous monitoring.',
          contingencyPlan: 'Prepare alternative programmatic channels.'
        });
        added++;
      }
    });

    recalculateRisks();
    save('Imported Module 1 Threats into Risk Register');
    renderRisks();
    render3x3RiskMatrix();
    alert(`Imported ${added} external threats from Module 1 into the Risk Register.`);
  }

  /* Official UN 3x3 Risk Matrix zone calculation (UNPOL CBD Lesson 3 p. 40 / Slide 17) */
  function calculateRiskZone(likelihood, impact) {
    const l = +likelihood || 1;
    const i = +impact || 1;
    // Red: High priority risks (Likelihood 3 & Impact 2/3, or Likelihood 2 & Impact 3)
    if ((l === 3 && i >= 2) || (l === 2 && i === 3)) {
      return 'red';
    }
    // Green: Minor risks / acceptable uncertainty (L1/I1, L1/I2, and L2/I1 per Lesson 3 p. 40)
    if ((l === 1 && i <= 2) || (l === 2 && i === 1)) {
      return 'green';
    }
    // Yellow: Moderate risks (L3/I1, L2/I2, L1/I3)
    return 'yellow';
  }

  /* Risk Analysis & Register */
  function recalculateRisks() {
    if (!state.module3.risks) state.module3.risks = [];
    state.module3.risks.forEach(r => {
      const l = +r.likelihood || 1;
      const i = +r.impact || 1;
      r.magnitude = l * i;
      r.zone = calculateRiskZone(l, i);
    });
  }

  function renderRisks() {
    const host = document.getElementById('risksTableBody');
    if (!host) return;

    recalculateRisks();

    host.innerHTML = state.module3.risks.map((r, idx) => `
      <tr data-idx="${idx}" style="${r.zone === 'red' ? 'background: #fff5f5;' : r.zone === 'yellow' ? 'background: #fffdf5;' : ''}">
        <td><input class="form-input risk-field" data-idx="${idx}" data-field="title" value="${escapeHtml(r.title || '')}" placeholder="Risk description" aria-label="Risk description for row ${idx + 1}"></td>
        <td>
          <select class="form-select risk-field score-l" data-idx="${idx}" data-field="likelihood" aria-label="Risk likelihood for row ${idx + 1}">
            <option value="1" ${r.likelihood === 1 ? 'selected' : ''}>1 (Low)</option>
            <option value="2" ${r.likelihood === 2 ? 'selected' : ''}>2 (Med)</option>
            <option value="3" ${r.likelihood === 3 ? 'selected' : ''}>3 (High)</option>
          </select>
        </td>
        <td>
          <select class="form-select risk-field score-i" data-idx="${idx}" data-field="impact" aria-label="Risk impact for row ${idx + 1}">
            <option value="1" ${r.impact === 1 ? 'selected' : ''}>1 (Low)</option>
            <option value="2" ${r.impact === 2 ? 'selected' : ''}>2 (Med)</option>
            <option value="3" ${r.impact === 3 ? 'selected' : ''}>3 (High)</option>
          </select>
        </td>
        <td style="text-align:center;">
          <span class="cell-badge" style="background: ${r.zone === 'red' ? 'var(--danger)' : r.zone === 'yellow' ? 'var(--warn)' : 'var(--ok)'};">
            ${r.zone.toUpperCase()} (${r.magnitude})
          </span>
        </td>
        <td><textarea class="form-textarea risk-field" data-idx="${idx}" data-field="mitigationStrategy" style="min-height: 60px;" aria-label="Risk mitigation strategy for row ${idx + 1}">${escapeHtml(r.mitigationStrategy || '')}</textarea></td>
        <td><textarea class="form-textarea risk-field" data-idx="${idx}" data-field="contingencyPlan" style="min-height: 60px;" aria-label="Risk contingency plan for row ${idx + 1}">${escapeHtml(r.contingencyPlan || '')}</textarea></td>
        <td><button class="btn btn-sm btn-danger remove-risk-btn" data-idx="${idx}" type="button" aria-label="Remove risk row ${idx + 1}">×</button></td>
      </tr>
    `).join('');

    host.querySelectorAll('.risk-field').forEach(el => {
      el.addEventListener('input', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        state.module3.risks[i][f] = (f === 'likelihood' || f === 'impact') ? +e.target.value : e.target.value;
        recalculateRisks();
        save();
        render3x3RiskMatrix();
      });
    });

    host.querySelectorAll('.remove-risk-btn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.idx;
        if (state.module3.risks.length > 1) {
          state.module3.risks.splice(i, 1);
          recalculateRisks();
          save();
          renderRisks();
          render3x3RiskMatrix();
        }
      };
    });
  }

  function addRiskRow() {
    if (!state.module3.risks) state.module3.risks = [];
    state.module3.risks.push({
      id: 'risk-' + Date.now(),
      title: '',
      description: '',
      likelihood: 2,
      impact: 2,
      magnitude: 4,
      zone: 'yellow',
      mitigationStrategy: '',
      contingencyPlan: ''
    });
    recalculateRisks();
    save();
    renderRisks();
    render3x3RiskMatrix();
  }

  /* 3x3 Risk Matrix Visualization (Lesson 3 Slide 17 & 40) */
  function render3x3RiskMatrix() {
    recalculateRisks();

    // Map cells: L3-I1, L3-I2, L3-I3, L2-I1, L2-I2, L2-I3, L1-I1, L1-I2, L1-I3
    const cells = {
      '3-1': document.getElementById('rc_3_1'),
      '3-2': document.getElementById('rc_3_2'),
      '3-3': document.getElementById('rc_3_3'),
      '2-1': document.getElementById('rc_2_1'),
      '2-2': document.getElementById('rc_2_2'),
      '2-3': document.getElementById('rc_2_3'),
      '1-1': document.getElementById('rc_1_1'),
      '1-2': document.getElementById('rc_1_2'),
      '1-3': document.getElementById('rc_1_3')
    };

    Object.values(cells).forEach(c => {
      if (c) c.innerHTML = '';
    });

    state.module3.risks.forEach((r, idx) => {
      const key = `${r.likelihood}-${r.impact}`;
      const cellEl = cells[key];
      if (cellEl) {
        const badgeHtml = `
          <div style="background: rgba(255,255,255,0.9); border: 1px solid rgba(0,0,0,0.15); border-radius: 4px; padding: 4px 6px; margin: 3px 0; font-size: 0.76rem; font-weight: 700; color: #111;">
            <strong>R${idx + 1}:</strong> ${escapeHtml(r.title || 'Untitled Risk')}
          </div>
        `;
        cellEl.insertAdjacentHTML('beforeend', badgeHtml);
      }
    });
  }

  /* Scenario Reference Drawer & Glossary */
  function renderScenarioDrawerList(searchQuery) {
    const host = document.getElementById('scenarioDrawerList');
    if (!host) return;
    const q = (searchQuery || '').toLowerCase().trim();
    let paragraphs = Scenario.PARAGRAPHS;
    if (q) {
      paragraphs = paragraphs.filter(p =>
        p.id.toString() === q || p.text.toLowerCase().includes(q)
      );
    }
    host.innerHTML = paragraphs.map(p => `
      <div class="para-item">
        <span class="para-badge">Paragraph ${p.id}</span>
        <p style="margin: 4px 0 0;">${escapeHtml(p.text)}</p>
      </div>
    `).join('');
  }

  let modalOpenerEl = null;

  function toggleScenarioDrawer(open) {
    const drawer = document.getElementById('scenarioDrawer');
    const backdrop = document.getElementById('scenarioDrawerBackdrop');
    if (!drawer || !backdrop) return;
    const shouldOpen = open !== undefined ? open : !drawer.classList.contains('open');
    if (shouldOpen) {
      modalOpenerEl = document.activeElement;
      drawer.classList.add('open');
      backdrop.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      const focusable = drawer.querySelectorAll('input, button, [tabindex]:not([tabindex="-1"])');
      if (focusable.length > 0) focusable[0].focus();
    } else {
      drawer.classList.remove('open');
      backdrop.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      if (modalOpenerEl && typeof modalOpenerEl.focus === 'function') {
        modalOpenerEl.focus();
        modalOpenerEl = null;
      }
    }
  }

  function renderGlossaryList(searchQuery) {
    const host = document.getElementById('glossaryList');
    if (!host) return;
    const q = (searchQuery || '').toLowerCase().trim();
    let terms = Glossary.TERMS;
    if (q) {
      terms = terms.filter(t =>
        t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
      );
    }
    host.innerHTML = terms.map(t => `
      <div style="border-bottom: 1px solid var(--line); padding: 10px 0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color: var(--navy); font-size: 1rem;">${escapeHtml(t.term)}</strong>
          <span style="font-size: 0.75rem; color: var(--muted);">${escapeHtml(t.lesson)}</span>
        </div>
        <p style="margin: 4px 0 0; font-size: 0.88rem; color: var(--ink);">${escapeHtml(t.definition)}</p>
      </div>
    `).join('');
  }

  function toggleGlossaryModal(open) {
    const backdrop = document.getElementById('glossaryModalBackdrop');
    if (!backdrop) return;
    const shouldOpen = open !== undefined ? open : !backdrop.classList.contains('open');
    if (shouldOpen) {
      modalOpenerEl = document.activeElement;
      backdrop.classList.add('open');
      backdrop.setAttribute('aria-hidden', 'false');
      const focusable = backdrop.querySelectorAll('input, button, [tabindex]:not([tabindex="-1"])');
      if (focusable.length > 0) focusable[0].focus();
    } else {
      backdrop.classList.remove('open');
      backdrop.setAttribute('aria-hidden', 'true');
      if (modalOpenerEl && typeof modalOpenerEl.focus === 'function') {
        modalOpenerEl.focus();
        modalOpenerEl = null;
      }
    }
  }

  /* Global Event Bindings */
  function bindGlobalControls() {
    document.querySelectorAll('[data-goto-stage]').forEach(b => {
      b.onclick = () => setStage(b.dataset.gotoStage);
    });

    document.getElementById('manualSaveBtn')?.addEventListener('click', () => save('Saved locally'));

    // Confirmation checkbox listener
    const confirmBox = document.getElementById('confirmModule3') || document.getElementById('selfConfirmCheck');
    confirmBox?.addEventListener('change', e => {
      state.module3.confirmed = e.target.checked;
      save(e.target.checked ? 'Phase 3 Confirmed' : 'Confirmation withdrawn');
      updateCompletionBadge();
    });

    document.getElementById('importFromM2Btn')?.addEventListener('click', importFromModule2);
    document.getElementById('importThreatsBtn')?.addEventListener('click', importThreatsFromModule1);

    document.getElementById('addOutcomeBtn')?.addEventListener('click', addOutcomeRow);
    document.getElementById('addOutputBtn')?.addEventListener('click', addOutputRow);
    document.getElementById('addActivityBtn')?.addEventListener('click', addActivityRow);
    document.getElementById('addRiskBtn')?.addEventListener('click', addRiskRow);

    // Scenario drawer
    document.getElementById('openScenarioDrawerBtn')?.addEventListener('click', () => toggleScenarioDrawer(true));
    document.getElementById('closeScenarioDrawerBtn')?.addEventListener('click', () => toggleScenarioDrawer(false));
    document.getElementById('scenarioDrawerBackdrop')?.addEventListener('click', () => toggleScenarioDrawer(false));
    document.getElementById('scenarioSearchInput')?.addEventListener('input', e => {
      renderScenarioDrawerList(e.target.value);
    });

    // Glossary
    document.getElementById('openGlossaryBtn')?.addEventListener('click', () => toggleGlossaryModal(true));
    document.getElementById('closeGlossaryBtn')?.addEventListener('click', () => toggleGlossaryModal(false));
    document.getElementById('glossaryModalBackdrop')?.addEventListener('click', e => {
      if (e.target.id === 'glossaryModalBackdrop') toggleGlossaryModal(false);
    });
    document.getElementById('glossarySearchInput')?.addEventListener('input', e => {
      renderGlossaryList(e.target.value);
    });

    // Modal focus containment and Escape listener
    document.addEventListener('keydown', e => {
      const glossaryOpen = document.getElementById('glossaryModalBackdrop')?.classList.contains('open');
      const drawerOpen = document.getElementById('scenarioDrawer')?.classList.contains('open');

      if (e.key === 'Escape') {
        if (glossaryOpen) toggleGlossaryModal(false);
        if (drawerOpen) toggleScenarioDrawer(false);
        return;
      }

      if (e.key === 'Tab' && (glossaryOpen || drawerOpen)) {
        const activeContainer = glossaryOpen ? document.getElementById('glossaryModalBackdrop') : document.getElementById('scenarioDrawer');
        if (!activeContainer) return;
        const focusable = Array.from(activeContainer.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !activeContainer.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !activeContainer.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    // JSON export
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
      collectFormFields();
      Storage.exportLabAsJson(state);
    });

    // Print
    document.getElementById('printPdfBtn')?.addEventListener('click', () => {
      collectFormFields();
      if (!state.module3?.confirmed) {
        const proceed = confirm('Note: Phase 3 has not been self-confirmed yet.\n\nDo you want to export an unconfirmed draft PDF?');
        if (!proceed) return;
      }
      if (Storage.preparePrintableContent) Storage.preparePrintableContent();
      window.print();
      if (Storage.cleanupPrintableContent) Storage.cleanupPrintableContent();
    });
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[c]));
  }

  return {
    init,
    getState: () => state,
    setStage,
    save,
    recalculateRisks,
    calculateRiskZone
  };
});
