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
    updateSaveIndicator('Loaded local data');
    setupAutosaveListener();
  }

  function save(statusMsg) {
    collectFormFields();
    Storage.saveLabState(state);
    updateSaveIndicator(statusMsg || 'Saved locally');
  }

  function updateSaveIndicator(msg) {
    const el = document.getElementById('saveIndicator');
    if (el) {
      el.textContent = msg || 'Saved locally on this device';
      el.style.color = 'var(--ok)';
    }
  }

  function setupAutosaveListener() {
    document.addEventListener('input', debounce(() => {
      save('Autosaved');
    }, 600));
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
              <select class="form-select roadmap-status" data-idx="${idx}" style="padding: 4px 8px; font-size: 0.8rem; width: auto; font-weight: 700;">
                <option value="Completed" ${step.status === 'Completed' ? 'selected' : ''}>Status: Completed</option>
                <option value="In Progress" ${step.status === 'In Progress' ? 'selected' : ''}>Status: In Progress</option>
                <option value="Scheduled" ${step.status === 'Scheduled' ? 'selected' : ''}>Status: Scheduled</option>
              </select>
              <button class="btn btn-sm btn-danger remove-step-btn" data-idx="${idx}" type="button">×</button>
            </div>
          </div>
          <div class="card-body">
            <div class="grid-2" style="margin-bottom: 12px;">
              <div class="form-group">
                <label class="form-label">Roadmap Phase Name & Timeframe</label>
                <input class="form-input step-field" data-idx="${idx}" data-field="phase" value="${escapeHtml(step.phase)}">
              </div>
              <div class="form-group">
                <label class="form-label">Lead Entity & Counterpart Focal Point</label>
                <input class="form-input step-field" data-idx="${idx}" data-field="leadResponsible" value="${escapeHtml(step.leadResponsible || '')}">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" style="color: var(--navy);">Operational Handover Milestone / Activity Deliverable</label>
              <textarea class="form-textarea step-field" data-idx="${idx}" data-field="milestone" style="min-height: 60px;">${escapeHtml(step.milestone || '')}</textarea>
            </div>
            <div class="form-group" style="background: var(--wash-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--line); margin-bottom: 0;">
              <label class="form-label" style="color: var(--ok-dark);">Measurable Handover & Exit Criteria (Lesson 6 Slide 10)</label>
              <textarea class="form-textarea step-field" data-idx="${idx}" data-field="handoverCriteria" style="min-height: 60px;">${escapeHtml(step.handoverCriteria || '')}</textarea>
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
              <select class="form-select cr-risk-level" data-idx="${idx}" style="padding: 4px 8px; font-size: 0.8rem; width: auto;">
                <option value="High" ${cr.riskLevel === 'High' ? 'selected' : ''}>Risk: High</option>
                <option value="Medium" ${cr.riskLevel === 'Medium' ? 'selected' : ''}>Risk: Medium</option>
                <option value="Low" ${cr.riskLevel === 'Low' ? 'selected' : ''}>Risk: Low</option>
              </select>
              <button class="btn btn-sm btn-danger remove-cr-btn" data-idx="${idx}" type="button">×</button>
            </div>
          </div>
          <div class="card-body">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" style="color: var(--danger);">Anticipated Post-Transition Obstacle / Regression Threat</label>
                <textarea class="form-textarea cr-field" data-idx="${idx}" data-field="challenge" style="min-height: 75px;">${escapeHtml(cr.challenge || '')}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label" style="color: var(--ok-dark);">Institutional Remedy & Sustainability Safeguard</label>
                <textarea class="form-textarea cr-field" data-idx="${idx}" data-field="remedy" style="min-height: 75px;">${escapeHtml(cr.remedy || '')}</textarea>
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

  function toggleScenarioDrawer(open) {
    const drawer = document.getElementById('scenarioDrawer');
    const backdrop = document.getElementById('scenarioDrawerBackdrop');
    const shouldOpen = open !== undefined ? open : !drawer.classList.contains('open');
    drawer.classList.toggle('open', shouldOpen);
    backdrop.classList.toggle('open', shouldOpen);
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
    backdrop.classList.toggle('open', open !== undefined ? open : !backdrop.classList.contains('open'));
  }

  /* Global Event Bindings */
  function bindGlobalControls() {
    document.querySelectorAll('[data-goto-stage]').forEach(b => {
      b.onclick = () => setStage(b.dataset.gotoStage);
    });

    document.getElementById('manualSaveBtn')?.addEventListener('click', () => save('Saved locally'));
    document.getElementById('addRoadmapStepBtn')?.addEventListener('click', addRoadmapStep);
    document.getElementById('addChallengeBtn')?.addEventListener('click', addChallengeRow);

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

    // JSON export
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
      collectFormFields();
      Storage.exportLabAsJson(state);
    });

    // Print
    document.getElementById('printPdfBtn')?.addEventListener('click', () => {
      collectFormFields();
      window.print();
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
