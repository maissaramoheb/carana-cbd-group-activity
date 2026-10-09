/**
 * Module 6: Transition & Handover Controller
 * CARANA CBD Learning Lab
 * Fully implements the UNPOL CBD Job-Specific Training (JST) Lesson 6 methodology:
 * The Four Key Principles of Transition (Early Planning, UN Integration, Local Ownership, Communication),
 * Integrated Assessment & Gender-Responsive Budgeting, Phased Handover Roadmap,
 * Institutionalising Sustainable Policing Practice, Challenges & Remedies Register,
 * and the Formal Transition Instrument & Handover Notice.
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
    root.Module6App = factory(root.CARANA_SCENARIO, root.CURRICULUM_GLOSSARY, root.LabStorage);
  }
})(typeof self !== 'undefined' ? self : this, function (Scenario, Glossary, Storage) {
  'use strict';

  let state = null;
  let activeStage = 'stage-principles';

  const STAGES = [
    { id: 'stage-principles', label: '1. Principles & Triggers', short: 'Principles' },
    { id: 'stage-assessment', label: '2. Integrated Assessment & Equity', short: 'Integrated Assess.' },
    { id: 'stage-roadmap', label: '3. Phased Handover Roadmap', short: 'Handover Roadmap' },
    { id: 'stage-practice', label: '4. Institutionalising Practice', short: 'Sustainable Practice' },
    { id: 'stage-challenges', label: '5. Challenges & Remedies', short: 'Challenges & Risks' },
    { id: 'stage-handover', label: '6. Handover Protocol & Synthesis', short: 'Protocol & Synthesis' }
  ];

  function init() {
    state = Storage.loadLabState();
    if (!state.module6 || !state.module6.transitionRoadmap) {
      state.module6 = Storage.getDefaultState().module6;
    }
    bindGlobalControls();
    renderStageTabs();
    populateFormFields();
    renderTransitionRoadmap();
    renderChallengesRemedies();
    renderScenarioDrawerList();
    renderGlossaryList();
    Storage.renderCurriculumTrack(6);
    renderSyndicateValidationChecklist();
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
    Storage.renderCurriculumTrack(6);
    renderSyndicateValidationChecklist();
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
    document.addEventListener('input', debounce(() => {
      save('Autosaved');
    }, 600));
  }

  function setupLifecycleListeners() {
    window.addEventListener('beforeunload', () => save());
    window.addEventListener('pagehide', () => save());
    window.addEventListener('storage', e => {
      if (e.key === Storage.STORAGE_KEY) {
        state = Storage.loadLabState();
        populateFormFields();
        renderTransitionRoadmap();
        renderChallengesRemedies();
        Storage.renderCurriculumTrack(6);
        renderSyndicateValidationChecklist();
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
    if (stageId === 'stage-roadmap') renderTransitionRoadmap();
    if (stageId === 'stage-challenges') renderChallengesRemedies();
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
    // Stage 1: Strategy
    const strat = state.module6.transitionStrategy || {};
    setValue('transHopcDate', strat.hopcInitiationDate);
    setValue('transPrimaryTrigger', strat.primaryTrigger);
    setValue('transSucceedingEntity', strat.succeedingEntity);
    setValue('transLocalOwner', strat.localOwnerDesignation);

    // Stage 2: Assessment Framework
    const fw = state.module6.fourPrinciplesFramework || {};
    setValue('principleEarlyPlanning', fw.earlyPlanning);
    setValue('principleUnIntegration', fw.unIntegration);
    setValue('principleLocalOwnership', fw.localOwnership);
    setValue('principleCommunication', fw.communicationProtocol);

    // Stage 4: Institutionalizing Practice
    const inst = state.module6.institutionalizingPractice || {};
    setValue('instDoctrine', inst.doctrineCodification);
    setValue('instAcademy', inst.academyIntegration);
    setValue('instGenderBudget', inst.genderResponsiveBudget);
    setValue('instOversight', inst.oversightHandover);

    // Stage 6: Handover Notice Instrument
    const hn = state.module6.handoverNotice || {};
    setValue('hnDate', hn.handoverDate);
    setValue('hnUnpolSignatory', hn.unpolSignatory);
    setValue('hnCounterpartSignatory', hn.counterpartSignatory);
    setValue('hnWitnessSignatory', hn.witnessSignatory);
    setValue('hnResidual', hn.residualObligations);

    // Stage 6: Reflection
    const ref = state.module6.reflection || {};
    setValue('reflectionTransitionMindset', ref.q1TransitionMindset);
    setValue('reflectionSustainingOwnership', ref.q2SustainingOwnership);
    setValue('reflectionOverallCBDJourney', ref.q3OverallCBDJourney);

    const confirmBox = document.getElementById('confirmModule6');
    if (confirmBox) confirmBox.checked = !!state.module6.confirmed;
  }

  function collectFormFields() {
    state.module6.transitionStrategy = {
      hopcInitiationDate: getValue('transHopcDate'),
      primaryTrigger: getValue('transPrimaryTrigger'),
      succeedingEntity: getValue('transSucceedingEntity'),
      localOwnerDesignation: getValue('transLocalOwner')
    };

    state.module6.fourPrinciplesFramework = {
      earlyPlanning: getValue('principleEarlyPlanning'),
      unIntegration: getValue('principleUnIntegration'),
      localOwnership: getValue('principleLocalOwnership'),
      communicationProtocol: getValue('principleCommunication')
    };

    state.module6.institutionalizingPractice = {
      doctrineCodification: getValue('instDoctrine'),
      academyIntegration: getValue('instAcademy'),
      genderResponsiveBudget: getValue('instGenderBudget'),
      oversightHandover: getValue('instOversight')
    };

    state.module6.handoverNotice = {
      handoverDate: getValue('hnDate'),
      unpolSignatory: getValue('hnUnpolSignatory'),
      counterpartSignatory: getValue('hnCounterpartSignatory'),
      witnessSignatory: getValue('hnWitnessSignatory'),
      residualObligations: getValue('hnResidual')
    };

    state.module6.reflection = {
      q1TransitionMindset: getValue('reflectionTransitionMindset'),
      q2SustainingOwnership: getValue('reflectionSustainingOwnership'),
      q3OverallCBDJourney: getValue('reflectionOverallCBDJourney')
    };

    const confirmBox = document.getElementById('confirmModule6');
    if (confirmBox) state.module6.confirmed = confirmBox.checked;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  /* Stage 3: Phased Transition Roadmap */
  function renderTransitionRoadmap() {
    const host = document.getElementById('transitionRoadmapHost');
    if (!host) return;

    host.innerHTML = state.module6.transitionRoadmap.map((step, idx) => {
      const statusColor = step.status === 'Completed' ? 'var(--ok)' :
                          step.status === 'In Progress' ? 'var(--un-blue)' : 'var(--muted)';
      return `
        <div class="card" style="margin-bottom: 22px; border: 1px solid var(--line);">
          <div class="card-header" style="background: var(--wash);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="cell-badge" style="background: var(--navy); font-size: 0.72rem;">Phase #${idx + 1}</span>
              <strong style="font-size: 1.05rem; color: var(--navy);">${escapeHtml(step.phase)}</strong>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <select class="form-select roadmap-status" data-idx="${idx}" style="padding: 4px 8px; font-size: 0.8rem; width: auto; font-weight: 700;" aria-label="Status for roadmap phase ${escapeHtml(step.phase || (idx + 1))}">
                <option value="Completed" ${step.status === 'Completed' ? 'selected' : ''}>Status: Completed</option>
                <option value="In Progress" ${step.status === 'In Progress' ? 'selected' : ''}>Status: In Progress</option>
                <option value="Scheduled" ${step.status === 'Scheduled' ? 'selected' : ''}>Status: Scheduled</option>
              </select>
              <button class="btn btn-sm btn-danger remove-step-btn" data-idx="${idx}" type="button" aria-label="Remove roadmap phase ${escapeHtml(step.phase || (idx + 1))}">×</button>
            </div>
          </div>
          <div class="card-body">
            <div class="grid-2" style="margin-bottom: 12px;">
              <div class="form-group">
                <label class="form-label">Roadmap Phase Name & Timeframe</label>
                <input class="form-input step-field" data-idx="${idx}" data-field="phase" value="${escapeHtml(step.phase)}" aria-label="Roadmap phase name and timeframe">
              </div>
              <div class="form-group">
                <label class="form-label">Lead Entity & Counterpart Focal Point</label>
                <input class="form-input step-field" data-idx="${idx}" data-field="leadResponsible" value="${escapeHtml(step.leadResponsible || '')}" aria-label="Lead entity and counterpart focal point">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" style="color: var(--navy);">Operational Handover Milestone / Activity Deliverable</label>
              <textarea class="form-textarea step-field" data-idx="${idx}" data-field="milestone" style="min-height: 60px;" aria-label="Operational handover milestone deliverable">${escapeHtml(step.milestone || '')}</textarea>
            </div>
            <div class="form-group" style="background: var(--wash-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--line); margin-bottom: 0;">
              <label class="form-label" style="color: var(--ok-dark);">Measurable Handover & Exit Criteria (Lesson 6 Slide 10)</label>
              <textarea class="form-textarea step-field" data-idx="${idx}" data-field="handoverCriteria" style="min-height: 60px;" aria-label="Measurable handover and exit criteria">${escapeHtml(step.handoverCriteria || '')}</textarea>
            </div>
          </div>
        </div>
      `;
    }).join('');

    host.querySelectorAll('.step-field').forEach(el => {
      el.addEventListener('input', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        state.module6.transitionRoadmap[i][f] = e.target.value;
        save();
      });
    });

    host.querySelectorAll('.roadmap-status').forEach(el => {
      el.addEventListener('change', e => {
        const i = +e.target.dataset.idx;
        state.module6.transitionRoadmap[i].status = e.target.value;
        save();
        renderTransitionRoadmap();
      });
    });

    host.querySelectorAll('.remove-step-btn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.idx;
        if (state.module6.transitionRoadmap.length > 1) {
          state.module6.transitionRoadmap.splice(i, 1);
          save();
          renderTransitionRoadmap();
        }
      };
    });
  }

  function addRoadmapStep() {
    state.module6.transitionRoadmap.push({
      id: 'trans-step-' + Date.now(),
      phase: 'New Handover Phase',
      milestone: '',
      leadResponsible: 'UNPOL CBD Adviser & National Counterpart',
      handoverCriteria: '',
      status: 'Scheduled'
    });
    save();
    renderTransitionRoadmap();
  }

  /* Stage 5: Challenges & Remedies Register */
  function renderChallengesRemedies() {
    const host = document.getElementById('challengesRemediesHost');
    if (!host) return;

    host.innerHTML = state.module6.challengesRemedies.map((cr, idx) => {
      const riskBadgeColor = cr.riskLevel === 'High' ? 'var(--danger)' :
                             cr.riskLevel === 'Medium' ? 'var(--warn)' : 'var(--ok)';
      return `
        <div class="card" style="margin-bottom: 22px; border: 1px solid var(--line);">
          <div class="card-header" style="background: var(--wash);">
            <div>
              <span class="badge" style="background: ${riskBadgeColor}; color: #fff; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 800;">
                Risk: ${escapeHtml(cr.riskLevel || 'Medium')}
              </span>
              <strong style="margin-left: 8px; font-size: 1.05rem; color: var(--navy);">Challenge #${idx + 1}</strong>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <select class="form-select cr-risk-level" data-idx="${idx}" style="padding: 4px 8px; font-size: 0.8rem; width: auto;" aria-label="Risk level for challenge #${idx + 1}">
                <option value="High" ${cr.riskLevel === 'High' ? 'selected' : ''}>Risk: High</option>
                <option value="Medium" ${cr.riskLevel === 'Medium' ? 'selected' : ''}>Risk: Medium</option>
                <option value="Low" ${cr.riskLevel === 'Low' ? 'selected' : ''}>Risk: Low</option>
              </select>
              <button class="btn btn-sm btn-danger remove-cr-btn" data-idx="${idx}" type="button" aria-label="Remove challenge #${idx + 1}">×</button>
            </div>
          </div>
          <div class="card-body">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" style="color: var(--danger);">Anticipated Post-Transition Obstacle / Regression Threat</label>
                <textarea class="form-textarea cr-field" data-idx="${idx}" data-field="challenge" style="min-height: 75px;" aria-label="Anticipated post-transition obstacle and regression threat">${escapeHtml(cr.challenge || '')}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label" style="color: var(--ok-dark);">Institutional Remedy & Sustainability Safeguard</label>
                <textarea class="form-textarea cr-field" data-idx="${idx}" data-field="remedy" style="min-height: 75px;" aria-label="Institutional remedy and sustainability safeguard">${escapeHtml(cr.remedy || '')}</textarea>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    host.querySelectorAll('.cr-field').forEach(el => {
      el.addEventListener('input', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        state.module6.challengesRemedies[i][f] = e.target.value;
        save();
      });
    });

    host.querySelectorAll('.cr-risk-level').forEach(el => {
      el.addEventListener('change', e => {
        const i = +e.target.dataset.idx;
        state.module6.challengesRemedies[i].riskLevel = e.target.value;
        save();
        renderChallengesRemedies();
      });
    });

    host.querySelectorAll('.remove-cr-btn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.idx;
        if (state.module6.challengesRemedies.length > 1) {
          state.module6.challengesRemedies.splice(i, 1);
          save();
          renderChallengesRemedies();
        }
      };
    });
  }

  function addChallengeRow() {
    state.module6.challengesRemedies.push({
      id: 'cr-' + Date.now(),
      challenge: 'New Transition Risk / Sustainability Obstacle',
      riskLevel: 'Medium',
      remedy: ''
    });
    save();
    renderChallengesRemedies();
  }

  /* Syndicate Six-Phase Completion Checklist */
  function renderSyndicateValidationChecklist() {
    const host = document.getElementById('syndicateChecklistHost');
    if (!host) return;

    const modules = [
      { num: 1, title: 'Phase 1: Situational Analysis', file: 'module1.html', key: 'module1' },
      { num: 2, title: 'Phase 2: Objective Setting & Prioritisation', file: 'module2.html', key: 'module2' },
      { num: 3, title: 'Phase 3: Planning Activities (Logframe & RBB)', file: 'module3.html', key: 'module3' },
      { num: 4, title: 'Phase 4: Implementation (MMA & Problem Solving)', file: 'module4.html', key: 'module4' },
      { num: 5, title: 'Phase 5: Evaluation & Adjustment', file: 'module5.html', key: 'module5' },
      { num: 6, title: 'Phase 6: Transition & Handover', file: 'module6.html', key: 'module6' },
    ];

    host.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <thead>
          <tr style="background: var(--surface); border-bottom: 2px solid var(--line); text-align: left;">
            <th style="padding: 6px 10px;">Curriculum Phase</th>
            <th style="padding: 6px 10px;">Syndicate Self-Assessment Status</th>
            <th style="padding: 6px 10px; text-align: right;">Workbench Action</th>
          </tr>
        </thead>
        <tbody>
          ${modules.map(m => {
            const isConfirmed = !!(state[m.key] && state[m.key].confirmed);
            const statusBadge = isConfirmed
              ? '<span class="badge" style="background: var(--ok); color: #fff; padding: 2px 7px; border-radius: 4px; font-weight: 700;">Validated by Syndicate</span>'
              : '<span class="badge" style="background: var(--warn); color: #fff; padding: 2px 7px; border-radius: 4px; font-weight: 700;">Pending Self-Assessment</span>';
            return `
              <tr style="border-bottom: 1px solid var(--line);">
                <td style="padding: 6px 10px; font-weight: 600;">${m.title}</td>
                <td style="padding: 6px 10px;">${statusBadge}</td>
                <td style="padding: 6px 10px; text-align: right;">
                  ${m.num === 6 ? '<span style="color: var(--muted); font-size: 0.8rem;">Current Phase</span>' : `<a href="${m.file}" style="font-weight: 700; text-decoration: none; color: var(--navy); font-size: 0.82rem;">Review Phase ${m.num} →</a>`}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  /* Inter-Module Continuity: Sync from Module 5 Evaluation */
  function syncFromModule5Evaluation() {
    const m5 = state.module5;
    if (!m5) {
      alert('No Module 5 data found.');
      return;
    }

    let summaryParts = [];
    if (m5.kpiEvaluations && m5.kpiEvaluations.length > 0) {
      const delayedCount = m5.kpiEvaluations.filter(k => k.varianceStatus === 'Delayed' || k.varianceStatus === 'Critical Variance').length;
      summaryParts.push(`${m5.kpiEvaluations.length} KPIs evaluated (${delayedCount} delayed/critical variances addressed)`);
    }
    if (m5.adjustments && m5.adjustments.length > 0) {
      const accepted = m5.adjustments.filter(a => a.reaction === 'Fully Accept' || a.reaction === 'Partially Accept').length;
      summaryParts.push(`${accepted} 3-tier adjustment decisions accepted`);
    }
    if (m5.impactAssessment && m5.impactAssessment.timelineImpact) {
      summaryParts.push('timeline & budget recalibration ratified');
    }

    if (summaryParts.length > 0) {
      const summaryText = `Objective achievement verified by Module 5 Mid-Term Evaluation: ${summaryParts.join('; ')}. Transition initiated following operational stabilization.`;
      const triggerEl = document.getElementById('transPrimaryTrigger');
      if (triggerEl) triggerEl.value = summaryText;
      if (!state.module6.transitionStrategy) state.module6.transitionStrategy = {};
      state.module6.transitionStrategy.primaryTrigger = summaryText;
      save('Synced Module 5 Evaluation Context');
      alert('Synchronized transition charter with Module 5 evaluation decisions.');
    } else {
      alert('Module 5 contains no recorded evaluations yet. Please review Module 5 first.');
    }
  }

  /* Comprehensive Six-Module Mission Handover Dossier Generator */
  function generateFullMissionDossier() {
    const host = document.getElementById('missionDossierPrintContainer');
    if (!host) return;

    const s = state;
    const m1 = s.module1 || {};
    const m2 = s.module2 || {};
    const m3 = s.module3 || {};
    const m4 = s.module4 || {};
    const m5 = s.module5 || {};
    const m6 = s.module6 || {};
    const session = s.session || {};

    let html = `
      <div style="padding: 10mm 5mm; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111; line-height: 1.45;">
        <!-- COVER / TITLE BLOCK -->
        <div style="border-bottom: 3px solid #001f3f; padding-bottom: 12px; margin-bottom: 18px;">
          <div style="font-size: 0.8rem; text-transform: uppercase; font-weight: 800; color: #0072ce; letter-spacing: 0.05em;">United Nations Police (UNPOL) · Capacity-Building and Development (CBD)</div>
          <h1 style="margin: 6px 0 4px; font-size: 20pt; color: #001f3f;">Comprehensive Mission Handover Dossier</h1>
          <div style="font-size: 11pt; color: #333; font-weight: 600;">Full Six-Phase Cycle: Situational Analysis → Transition Protocol</div>
          
          <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 9pt;">
            <div><strong>Syndicate Team:</strong> ${escapeHtml(session.teamName || 'Syndicate Team')}</div>
            <div><strong>Session Date:</strong> ${escapeHtml(session.date || new Date().toISOString().slice(0, 10))}</div>
            <div><strong>Target Mandate:</strong> UNAC / CARANA (Galasi CIS)</div>
            <div><strong>Curriculum:</strong> UNPOL CBD JST 2021/2023</div>
          </div>
        </div>

        <!-- TRAINING SAFEGUARD -->
        <div style="background: #fdf8eb; border: 1px solid #d4a72c; padding: 10px 14px; font-size: 8.5pt; color: #583c03; margin-bottom: 22px;">
          <strong>Official Training Safeguard:</strong> CARANA and UNAC are fictional training scenarios developed by the United Nations Department of Peace Operations (DPO). This dossier documents the operational execution of UNPOL CBD Job-Specific Training (JST) Lessons 1 through 6.
        </div>

        <!-- PHASE 1: SITUATIONAL ANALYSIS -->
        <section style="margin-bottom: 24px; page-break-inside: avoid;">
          <h2 style="font-size: 13pt; color: #001f3f; border-bottom: 1.5px solid #0072ce; padding-bottom: 4px; margin-bottom: 10px;">
            Phase 1: Situational Analysis (JST Lesson 1)
          </h2>
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0;">Strategic Conflict Analysis (PESTEL-S)</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 10px;">
              <tr><th style="width: 25%; text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Political Context</th><td style="padding: 4px; border: 1px solid #ccc;">${escapeHtml(m1.conflictAnalysis?.politicalContext || 'N/A')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Strategic Imperatives</th><td style="padding: 4px; border: 1px solid #ccc;">${escapeHtml(m1.conflictAnalysis?.strategicImperatives || 'N/A')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Police Infrastructure</th><td style="padding: 4px; border: 1px solid #ccc;">${escapeHtml(m1.conflictAnalysis?.policeInfrastructure || 'N/A')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Community Security</th><td style="padding: 4px; border: 1px solid #ccc;">${escapeHtml(m1.conflictAnalysis?.communitySecurity || 'N/A')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Operational Challenges</th><td style="padding: 4px; border: 1px solid #ccc;">${escapeHtml(m1.conflictAnalysis?.operationalChallenges || 'N/A')}</td></tr>
            </table>
          </div>

          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0;">Key Stakeholders & 4-Quadrant Engagement</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 10px;">
              <thead>
                <tr style="background: #f0f4f8;">
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Stakeholder</th>
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Sector</th>
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Interest</th>
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Influence</th>
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Quadrant Strategy</th>
                </tr>
              </thead>
              <tbody>
                ${(m1.stakeholders || []).map(sh => `
                  <tr>
                    <td style="border: 1px solid #ccc; padding: 4px; font-weight: 600;">${escapeHtml(sh.name)}</td>
                    <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(sh.category)}</td>
                    <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(sh.interest)}</td>
                    <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(sh.influence)}</td>
                    <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(sh.engagementStrategy || sh.quadrant)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0;">SWOT Matrix</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 8pt;">
              <div style="border: 1px solid #ccc; padding: 6px; background: #fafafa;"><strong>Strengths:</strong> ${(m1.swot?.strengths || []).map(s => escapeHtml(s.text)).join('; ')}</div>
              <div style="border: 1px solid #ccc; padding: 6px; background: #fafafa;"><strong>Weaknesses:</strong> ${(m1.swot?.weaknesses || []).map(s => escapeHtml(s.text)).join('; ')}</div>
              <div style="border: 1px solid #ccc; padding: 6px; background: #fafafa;"><strong>Opportunities:</strong> ${(m1.swot?.opportunities || []).map(s => escapeHtml(s.text)).join('; ')}</div>
              <div style="border: 1px solid #ccc; padding: 6px; background: #fafafa;"><strong>Threats:</strong> ${(m1.swot?.threats || []).map(s => escapeHtml(s.text)).join('; ')}</div>
            </div>
          </div>
        </section>

        <!-- PHASE 2: OBJECTIVE SETTING & PRIORITISATION -->
        <section style="margin-bottom: 24px; page-break-inside: avoid;">
          <h2 style="font-size: 13pt; color: #001f3f; border-bottom: 1.5px solid #0072ce; padding-bottom: 4px; margin-bottom: 10px;">
            Phase 2: Objective Setting & Prioritisation (JST Lesson 2)
          </h2>
          <div style="margin-bottom: 10px; font-size: 8.5pt;">
            <strong>Mandate Alignment:</strong> UNSCR: ${escapeHtml(m2.strategicAlignment?.alignedUNSCR || 'UNSCR 2151')} | SDG: ${escapeHtml(m2.strategicAlignment?.alignedSDG || 'SDG 16')}
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 12px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Rank</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Objective Initiative</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Align (x2)</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Need</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Impl.</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Comp. (0.5x)</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Donor</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(m2.objectives || []).map((o, idx) => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: 700;">#${o.rank || idx + 1}</td>
                  <td style="border: 1px solid #ccc; padding: 4px;"><strong>${escapeHtml(o.title)}</strong><br><span style="color: #666;">${escapeHtml(o.description || '')}</span></td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${o.weightedStrategicScore || 0}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${o.scores?.need || 0}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${o.scores?.implementability || 0}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${(o.scores?.complementarity || 0) * 0.5}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${o.scores?.donorInterest || 0}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: 700;">${o.overallScore || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0;">Top Formulated S.M.A.R.T. Objectives</h3>
          ${(m2.smartObjectives || []).slice(0, 2).map((so, idx) => `
            <div style="background: #f9fbfd; border: 1px solid #bce1f8; padding: 8px 12px; margin-bottom: 8px; font-size: 8.5pt;">
              <strong>SMART Objective #${idx + 1}: ${escapeHtml(so.title)}</strong>
              <div style="margin-top: 4px; font-style: italic;">"${escapeHtml(so.fullStatement || 'Formulation in progress')}"</div>
            </div>
          `).join('')}
        </section>

        <!-- PHASE 3: PLANNING & LOGFRAME -->
        <section style="margin-bottom: 24px; page-break-inside: avoid;">
          <h2 style="font-size: 13pt; color: #001f3f; border-bottom: 1.5px solid #0072ce; padding-bottom: 4px; margin-bottom: 10px;">
            Phase 3: Planning Activities & Logframe (JST Lesson 3)
          </h2>
          <div style="margin-bottom: 8px; font-size: 8.5pt;">
            <strong>Theory of Change:</strong> ${escapeHtml(m3.theoryOfChange?.coreHypothesis || 'If-Then causal chain established')}
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 12px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 22%;">Result Level</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 45%;">Narrative</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Assumptions & Risks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ccc; padding: 4px; font-weight: 700;">Impact</td>
                <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(m3.logframe?.impact?.narrative || '')}</td>
                <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(m3.logframe?.impact?.assumptions || '')}</td>
              </tr>
              ${(m3.logframe?.outcomes || []).map(o => `
                <tr style="background: #fbfbfb;">
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 700;">Outcome (${o.id})</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(o.narrative)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(o.assumptions || '')}</td>
                </tr>
              `).join('')}
              ${(m3.logframe?.outputs || []).map(outp => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 600;">Output (${outp.id})</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(outp.narrative)}<br><span style="font-size: 7.5pt; color: #555;">Target: ${escapeHtml(outp.indicators || 'N/A')}</span></td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(outp.assumptions || '')}</td>
                </tr>
              `).join('')}
              ${(m3.logframe?.activities || []).map(act => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px;">Activity (${act.id})</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(act.narrative)}<br><span style="font-size: 7.5pt; color: #555;">Inputs: ${escapeHtml(act.inputs || 'N/A')}</span></td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(act.assumptions || '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0;">3x3 Risk Assessment & Contingency Matrix</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Risk Title</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">L</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">I</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Zone</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Mitigation Strategy</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Contingency Trigger & Plan</th>
              </tr>
            </thead>
            <tbody>
              ${(m3.riskRegister || []).map(r => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 600;">${escapeHtml(r.title)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${r.likelihood}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${r.impact}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: 700; text-transform: uppercase;">${escapeHtml(r.zone)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(r.mitigation)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(r.contingencyPlan || r.contingencyTrigger || 'N/A')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>

        <!-- PHASE 4: IMPLEMENTATION & PROBLEM SOLVING -->
        <section style="margin-bottom: 24px; page-break-inside: avoid;">
          <h2 style="font-size: 13pt; color: #001f3f; border-bottom: 1.5px solid #0072ce; padding-bottom: 4px; margin-bottom: 10px;">
            Phase 4: Implementation (JST Lesson 4)
          </h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 8pt; margin-bottom: 10px;">
            <div style="border: 1px solid #ccc; padding: 6px;"><strong>Monitoring:</strong> ${escapeHtml(m4.mmaStrategy?.monitoringMechanisms || 'N/A')}</div>
            <div style="border: 1px solid #ccc; padding: 6px;"><strong>Mentoring:</strong> ${escapeHtml(m4.mmaStrategy?.mentoringCoachingPlan || 'N/A')}</div>
            <div style="border: 1px solid #ccc; padding: 6px;"><strong>Advising:</strong> ${escapeHtml(m4.mmaStrategy?.advisingPriorities || 'N/A')}</div>
          </div>
          <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0;">Implementation Activity Tracker</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 10px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Activity</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Status</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Progress</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Field Advisory / Mentoring Note</th>
              </tr>
            </thead>
            <tbody>
              ${(m4.activityTracker || []).map(tr => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 600;">${escapeHtml(tr.activityTitle)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(tr.status)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: 700;">${tr.progressPercent || 0}%</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(tr.fieldAdvisoryNote || '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>

        <!-- PHASE 5: EVALUATION & ADJUSTMENT -->
        <section style="margin-bottom: 24px; page-break-inside: avoid;">
          <h2 style="font-size: 13pt; color: #001f3f; border-bottom: 1.5px solid #0072ce; padding-bottom: 4px; margin-bottom: 10px;">
            Phase 5: Evaluation & Adjustment (JST Lesson 5)
          </h2>
          <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0;">Performance Indicator Mid-Term Evaluations</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 10px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Indicator</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Baseline</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Target</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Actual</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Variance Status</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Corrective Action</th>
              </tr>
            </thead>
            <tbody>
              ${(m5.kpiEvaluations || []).map(ev => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 600;">${escapeHtml(ev.kpiTitle)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(ev.baselineValue)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(ev.targetValue)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(ev.actualValue)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: 700;">${escapeHtml(ev.varianceStatus)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(ev.correctiveAction || '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0;">3-Tier Adjustment Recommendations & Decisions</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 10px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Recommendation</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Reaction</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Justification</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Action Plan</th>
              </tr>
            </thead>
            <tbody>
              ${(m5.adjustments || []).map(adj => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 600;">${escapeHtml(adj.recommendationTitle)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: 700;">${escapeHtml(adj.reaction)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(adj.justification || '')}</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(adj.actionPlan || '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>

        <!-- PHASE 6: TRANSITION & HANDOVER -->
        <section style="margin-bottom: 24px; page-break-inside: avoid;">
          <h2 style="font-size: 13pt; color: #001f3f; border-bottom: 1.5px solid #0072ce; padding-bottom: 4px; margin-bottom: 10px;">
            Phase 6: Transition & Handover Protocol (JST Lesson 6)
          </h2>
          <div style="margin-bottom: 10px; font-size: 8.5pt;">
            <div><strong>HOPC Initiation Timeline:</strong> ${escapeHtml(m6.transitionStrategy?.hopcInitiationDate || 'Month 18')}</div>
            <div><strong>Primary Transition Trigger:</strong> ${escapeHtml(m6.transitionStrategy?.primaryTrigger || 'Verified benchmark achievement')}</div>
            <div><strong>Succeeding Handover Entity:</strong> ${escapeHtml(m6.transitionStrategy?.succeedingEntity || 'National Police Directorate & UNDP')}</div>
            <div><strong>Local Institutional Owner:</strong> ${escapeHtml(m6.transitionStrategy?.localOwnerDesignation || 'Director of CIS')}</div>
          </div>

          <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0;">Phased Handover Roadmap</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 12px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Phase</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Milestone</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Lead Entity</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Drawdown & Exit Criteria</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${(m6.transitionRoadmap || []).map(r => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 700;">${escapeHtml(r.phase)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(r.milestone)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(r.leadResponsible || '')}</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(r.handoverCriteria || '')}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(r.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0;">Formal Handover Protocol Instrument</h3>
          <div style="border: 1.5px solid #001f3f; padding: 12px; font-size: 8.5pt; background: #fafafa; margin-bottom: 12px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
              <div><strong>Effective Handover Date:</strong> ${escapeHtml(m6.handoverNotice?.handoverDate || '')}</div>
              <div><strong>UNPOL Lead Signatory:</strong> ${escapeHtml(m6.handoverNotice?.unpolSignatory || '')}</div>
              <div><strong>Counterpart Signatory:</strong> ${escapeHtml(m6.handoverNotice?.counterpartSignatory || '')}</div>
              <div><strong>Witness Signatory:</strong> ${escapeHtml(m6.handoverNotice?.witnessSignatory || '')}</div>
            </div>
            <div><strong>Residual Programmatic Obligations:</strong> ${escapeHtml(m6.handoverNotice?.residualObligations || 'Full national ownership established.')}</div>
          </div>
        </section>
      </div>
    `;

    host.innerHTML = html;
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

  let lastActiveElement = null;

  function toggleScenarioDrawer(open) {
    const drawer = document.getElementById('scenarioDrawer');
    const backdrop = document.getElementById('scenarioDrawerBackdrop');
    const shouldOpen = open !== undefined ? open : !drawer.classList.contains('open');
    if (shouldOpen) {
      lastActiveElement = document.activeElement;
    }
    drawer.classList.toggle('open', shouldOpen);
    backdrop.classList.toggle('open', shouldOpen);
    if (shouldOpen) {
      setTimeout(() => document.getElementById('scenarioSearchInput')?.focus(), 50);
    } else if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
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
    const shouldOpen = open !== undefined ? open : !backdrop.classList.contains('open');
    if (shouldOpen) {
      lastActiveElement = document.activeElement;
    }
    backdrop.classList.toggle('open', shouldOpen);
    if (shouldOpen) {
      setTimeout(() => document.getElementById('glossarySearchInput')?.focus(), 50);
    } else if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  /* Global Event Bindings */
  function bindGlobalControls() {
    document.querySelectorAll('[data-goto-stage]').forEach(b => {
      b.onclick = () => setStage(b.dataset.gotoStage);
    });

    document.getElementById('manualSaveBtn')?.addEventListener('click', () => save('Saved locally'));
    document.getElementById('addRoadmapStepBtn')?.addEventListener('click', addRoadmapStep);
    document.getElementById('addChallengeBtn')?.addEventListener('click', addChallengeRow);
    document.getElementById('syncM5EvaluationBtn')?.addEventListener('click', syncFromModule5Evaluation);

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

    // Global keyboard accessibility (Escape to dismiss modal / drawer)
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        toggleScenarioDrawer(false);
        toggleGlossaryModal(false);
      }
    });

    // JSON export
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
      collectFormFields();
      Storage.exportLabAsJson(state);
    });

    // Print full 6-module dossier
    document.getElementById('printPdfBtn')?.addEventListener('click', () => {
      collectFormFields();
      save();
      generateFullMissionDossier();
      document.body.classList.add('printing-dossier');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-dossier');
      }, 1000);
    });

    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-dossier');
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
    save
  };
});
