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
    updateCompletionBadge();
    Storage.renderCurriculumTrack(6);
    renderSyndicateValidationChecklist();
    updateSaveIndicator('Loaded local data');
    setupAutosaveListener();
    setupLifecycleListeners();
  }

  const dirtyFields = new Set();

  function save(statusMsg) {
    collectFormFields();
    const latest = Storage.loadLabState();
    if (latest) {
      for (let i = 1; i <= 6; i++) {
        if (i !== 6) {
          const modKey = 'module' + i;
          if (latest[modKey]) state[modKey] = latest[modKey];
        }
      }
      if (latest.session) state.session = latest.session;
      if (latest.module6) {
        if (latest.module6.transitionStrategy) {
          const mapping = {
            transHopcDate: 'hopcInitiationDate',
            transPrimaryTrigger: 'primaryTrigger',
            transSucceedingEntity: 'succeedingEntity',
            transLocalOwner: 'localOwnerDesignation'
          };
          for (const [id, f] of Object.entries(mapping)) {
            if (!dirtyFields.has(id) && latest.module6.transitionStrategy[f] !== undefined) {
              state.module6.transitionStrategy[f] = latest.module6.transitionStrategy[f];
              setValue(id, latest.module6.transitionStrategy[f]);
            }
          }
        }
        if (latest.module6.fourPrinciplesFramework) {
          const mapping = {
            principleEarlyPlanning: 'earlyPlanning',
            principleUnIntegration: 'unIntegration',
            principleLocalOwnership: 'localOwnership',
            principleCommunication: 'communicationProtocol'
          };
          for (const [id, f] of Object.entries(mapping)) {
            if (!dirtyFields.has(id) && latest.module6.fourPrinciplesFramework[f] !== undefined) {
              state.module6.fourPrinciplesFramework[f] = latest.module6.fourPrinciplesFramework[f];
              setValue(id, latest.module6.fourPrinciplesFramework[f]);
            }
          }
        }
        if (latest.module6.institutionalizingPractice) {
          const mapping = {
            instDoctrine: 'doctrineCodification',
            instAcademy: 'academyIntegration',
            instGenderBudget: 'genderResponsiveBudget',
            instOversight: 'oversightHandover'
          };
          for (const [id, f] of Object.entries(mapping)) {
            if (!dirtyFields.has(id) && latest.module6.institutionalizingPractice[f] !== undefined) {
              state.module6.institutionalizingPractice[f] = latest.module6.institutionalizingPractice[f];
              setValue(id, latest.module6.institutionalizingPractice[f]);
            }
          }
        }
        if (latest.module6.handoverNotice) {
          const mapping = {
            hnDate: 'handoverDate',
            hnUnpolSignatory: 'unpolSignatory',
            hnCounterpartSignatory: 'counterpartSignatory',
            hnWitnessSignatory: 'witnessSignatory',
            hnResidual: 'residualObligations'
          };
          for (const [id, f] of Object.entries(mapping)) {
            if (!dirtyFields.has(id) && latest.module6.handoverNotice[f] !== undefined) {
              state.module6.handoverNotice[f] = latest.module6.handoverNotice[f];
              setValue(id, latest.module6.handoverNotice[f]);
            }
          }
        }
        if (latest.module6.reflection) {
          const mapping = {
            reflectionTransitionMindset: 'q1TransitionMindset',
            reflectionSustainingOwnership: 'q2SustainingOwnership',
            reflectionOverallCBDJourney: 'q3OverallCBDJourney'
          };
          for (const [id, f] of Object.entries(mapping)) {
            if (!dirtyFields.has(id) && latest.module6.reflection[f] !== undefined) {
              state.module6.reflection[f] = latest.module6.reflection[f];
              setValue(id, latest.module6.reflection[f]);
            }
          }
        }
      }
    }
    const ok = Storage.saveLabState(state);
    if (!ok) {
      updateSaveIndicator('⚠️ Storage full or blocked! Export JSON.', true);
    } else {
      dirtyFields.clear();
      updateSaveIndicator(statusMsg || 'Saved locally');
    }
    updateCompletionBadge();
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
    document.addEventListener('input', e => {
      if (e.target && e.target.id) dirtyFields.add(e.target.id);
      if (e.target && e.target.id !== 'confirmModule6' && e.target.id !== 'selfConfirmCheck') {
        invalidateConfirmation();
      }
    });
    document.addEventListener('change', e => {
      if (e.target && e.target.id) dirtyFields.add(e.target.id);
    });
    document.addEventListener('input', debounce(() => {
      save('Autosaved');
    }, 600));
  }

  function invalidateConfirmation() {
    if (state.module6 && state.module6.confirmed) {
      state.module6.confirmed = false;
      const chk = document.getElementById('confirmModule6') || document.getElementById('selfConfirmCheck');
      if (chk) chk.checked = false;
      updateCompletionBadge();
    }
  }

  function updateCompletionBadge() {
    const cycle = Storage.getFullCycleProgress ? Storage.getFullCycleProgress(state) : {
      confirmedCount: [1, 2, 3, 4, 5, 6].filter(i => !!state['module' + i]?.confirmed).length,
      allConfirmed: [1, 2, 3, 4, 5, 6].every(i => !!state['module' + i]?.confirmed),
      pendingModules: [1, 2, 3, 4, 5, 6].filter(i => !state['module' + i]?.confirmed)
    };

    const isM6Confirmed = !!(state.module6 && state.module6.confirmed);
    const badge = document.getElementById('stageCompleteFooterBadge');
    const finalSpan = document.getElementById('finalCycleStatusText');

    let badgeText = '';
    let badgeColor = '';
    let finalSpanText = '';
    let finalSpanColor = '';

    if (isM6Confirmed) {
      if (cycle.allConfirmed) {
        badgeText = '✓ Full Six-Phase Cycle Self-Confirmed (6/6) · Facilitator Review Ready';
        badgeColor = 'var(--ok)';
        finalSpanText = 'Full 6-Phase Learning Lab Self-Confirmed (6/6) · Ready for Final Review';
        finalSpanColor = 'var(--ok)';
      } else {
        const pendingList = cycle.pendingModules.join(', ');
        badgeText = `✓ Phase 6 Self-Confirmed · Cycle Incomplete (${cycle.confirmedCount}/6 Confirmed · Phases ${pendingList} Pending)`;
        badgeColor = '#b45309';
        finalSpanText = `Phase 6 Self-Confirmed · Cycle Incomplete (${cycle.confirmedCount}/6 Confirmed · Phases ${pendingList} Pending)`;
        finalSpanColor = '#b45309';
      }
    } else {
      if (cycle.confirmedCount > 0) {
        badgeText = `Phase 6 In Progress · Pending Self-Confirmation (${cycle.confirmedCount}/6 Confirmed)`;
        finalSpanText = `Phase 6 In Progress · Pending Self-Confirmation (${cycle.confirmedCount}/6 Confirmed)`;
      } else {
        badgeText = 'Phase 6 In Progress · Pending Self-Confirmation';
        finalSpanText = 'Phase 6 In Progress · Pending Self-Confirmation';
      }
      badgeColor = 'var(--navy)';
      finalSpanColor = 'var(--navy)';
    }

    if (badge) {
      badge.textContent = badgeText;
      badge.style.color = badgeColor;
    }
    if (finalSpan) {
      finalSpan.textContent = finalSpanText;
      finalSpan.style.color = finalSpanColor;
      finalSpan.style.fontWeight = isM6Confirmed && cycle.allConfirmed ? '700' : '600';
    }
  }

  function setupLifecycleListeners() {
    window.addEventListener('beforeunload', () => {
      if (dirtyFields.size > 0) save();
    });
    window.addEventListener('pagehide', () => {
      if (dirtyFields.size > 0) save();
    });
    window.addEventListener('storage', e => {
      if (e.key === Storage.STORAGE_KEY) {
        const incoming = Storage.loadLabState();
        if (!incoming) return;
        for (let i = 1; i <= 6; i++) {
          if (i !== 6) {
            const modKey = 'module' + i;
            if (incoming[modKey]) {
              state[modKey] = incoming[modKey];
            }
          }
        }
        if (incoming.session) {
          state.session = incoming.session;
        }
        if (incoming.module6) {
          const activeId = document.activeElement ? document.activeElement.id : '';
          if (incoming.module6.transitionStrategy) {
            const mapping = {
              transHopcDate: 'hopcInitiationDate',
              transPrimaryTrigger: 'primaryTrigger',
              transSucceedingEntity: 'succeedingEntity',
              transLocalOwner: 'localOwnerDesignation'
            };
            for (const [id, f] of Object.entries(mapping)) {
              if (activeId !== id && !dirtyFields.has(id) && incoming.module6.transitionStrategy[f] !== undefined) {
                state.module6.transitionStrategy[f] = incoming.module6.transitionStrategy[f];
                setValue(id, incoming.module6.transitionStrategy[f]);
              }
            }
          }
          if (incoming.module6.fourPrinciplesFramework) {
            const mapping = {
              principleEarlyPlanning: 'earlyPlanning',
              principleUnIntegration: 'unIntegration',
              principleLocalOwnership: 'localOwnership',
              principleCommunication: 'communicationProtocol'
            };
            for (const [id, f] of Object.entries(mapping)) {
              if (activeId !== id && !dirtyFields.has(id) && incoming.module6.fourPrinciplesFramework[f] !== undefined) {
                state.module6.fourPrinciplesFramework[f] = incoming.module6.fourPrinciplesFramework[f];
                setValue(id, incoming.module6.fourPrinciplesFramework[f]);
              }
            }
          }
          if (incoming.module6.institutionalizingPractice) {
            const mapping = {
              instDoctrine: 'doctrineCodification',
              instAcademy: 'academyIntegration',
              instGenderBudget: 'genderResponsiveBudget',
              instOversight: 'oversightHandover'
            };
            for (const [id, f] of Object.entries(mapping)) {
              if (activeId !== id && !dirtyFields.has(id) && incoming.module6.institutionalizingPractice[f] !== undefined) {
                state.module6.institutionalizingPractice[f] = incoming.module6.institutionalizingPractice[f];
                setValue(id, incoming.module6.institutionalizingPractice[f]);
              }
            }
          }
          if (incoming.module6.handoverNotice) {
            const mapping = {
              hnDate: 'handoverDate',
              hnUnpolSignatory: 'unpolSignatory',
              hnCounterpartSignatory: 'counterpartSignatory',
              hnWitnessSignatory: 'witnessSignatory',
              hnResidual: 'residualObligations'
            };
            for (const [id, f] of Object.entries(mapping)) {
              if (activeId !== id && !dirtyFields.has(id) && incoming.module6.handoverNotice[f] !== undefined) {
                state.module6.handoverNotice[f] = incoming.module6.handoverNotice[f];
                setValue(id, incoming.module6.handoverNotice[f]);
              }
            }
          }
          if (incoming.module6.reflection) {
            const mapping = {
              reflectionTransitionMindset: 'q1TransitionMindset',
              reflectionSustainingOwnership: 'q2SustainingOwnership',
              reflectionOverallCBDJourney: 'q3OverallCBDJourney'
            };
            for (const [id, f] of Object.entries(mapping)) {
              if (activeId !== id && !dirtyFields.has(id) && incoming.module6.reflection[f] !== undefined) {
                state.module6.reflection[f] = incoming.module6.reflection[f];
                setValue(id, incoming.module6.reflection[f]);
              }
            }
          }
        }
        Storage.renderCurriculumTrack(6);
        renderSyndicateValidationChecklist();
        updateCompletionBadge();
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

    const confirmBox = document.getElementById('confirmModule6') || document.getElementById('selfConfirmCheck');
    if (confirmBox) confirmBox.checked = !!state.module6.confirmed;
    updateCompletionBadge();
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

    const confirmBox = document.getElementById('confirmModule6') || document.getElementById('selfConfirmCheck');
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
      const summaryText = `Instructional Premise (UNPOL JST Lesson 6 Activity 6.1): Assuming earlier objectives were implemented and recalibrated following Module 5 evaluation decisions (${summaryParts.join('; ')}), transition and handover planning is initiated under mandate drawdown.`;
      const triggerEl = document.getElementById('transPrimaryTrigger');
      if (triggerEl) triggerEl.value = summaryText;
      if (!state.module6.transitionStrategy) state.module6.transitionStrategy = {};
      state.module6.transitionStrategy.primaryTrigger = summaryText;
      invalidateConfirmation();
      save('Synced Module 5 Evaluation Context');
      alert('Synchronized transition charter with Module 5 evaluation decisions (Instructional Premise).');
    } else {
      alert('Module 5 contains no recorded evaluations yet. Please review Module 5 first.');
    }
  }

  /* Comprehensive Six-Module Mission Handover Dossier Generator */
  function generateFullMissionDossier(targetHost, customState) {
    const host = targetHost || (typeof document !== 'undefined' ? document.getElementById('missionDossierPrintContainer') : null);
    const s = customState || state || {};
    const m1 = s.module1 || {};
    const m2 = s.module2 || {};
    const m3 = s.module3 || {};
    const m4 = s.module4 || {};
    const m5 = s.module5 || {};
    const m6 = s.module6 || {};
    const session = s.session || {};

    // Extract non-empty matrix findings
    const recordedCells = [];
    if (m1.matrixCells && typeof Scenario !== 'undefined' && Scenario.AREAS) {
      Scenario.AREAS.forEach(area => {
        area.subcategories.forEach(sub => {
          Scenario.DIMENSIONS.forEach(dim => {
            const cellKey = `${sub.id}|${dim.id}`;
            const cell = m1.matrixCells[cellKey];
            if (cell && ((cell.paragraphs && cell.paragraphs.length > 0) || (cell.notes && cell.notes.trim().length > 0))) {
              recordedCells.push({
                area: area.name,
                subarea: sub.name,
                dim: dim.name,
                paragraphs: cell.paragraphs || [],
                notes: cell.notes || ''
              });
            }
          });
        });
      });
    }

    const isAllConfirmed = [1, 2, 3, 4, 5, 6].every(num => !!s['module' + num]?.confirmed);
    const confirmedCount = [1, 2, 3, 4, 5, 6].filter(num => !!s['module' + num]?.confirmed).length;

    let html = `
      <div style="padding: 10mm 5mm; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111; line-height: 1.45;">
        <!-- COVER / TITLE BLOCK -->
        <div style="border-bottom: 3px solid #001f3f; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="font-size: 0.8rem; text-transform: uppercase; font-weight: 800; color: #0072ce; letter-spacing: 0.05em;">United Nations Police (UNPOL) · Capacity-Building and Development (CBD)</div>
          <h1 style="margin: 6px 0 4px; font-size: 20pt; color: #001f3f;">Comprehensive Mission Handover Dossier</h1>
          <div style="font-size: 11pt; color: #333; font-weight: 600;">Full Six-Phase Cycle: Situational Analysis → Transition Protocol</div>
          
          <div style="margin-top: 8px;">
            ${isAllConfirmed ? `
              <span style="display: inline-block; padding: 4px 10px; background: #e6f4ea; border: 1.5px solid #137333; color: #137333; font-weight: 800; font-size: 8.5pt; border-radius: 4px;">
                ✓ STATUS: CONFIRMED FINAL MISSION DOSSIER (All 6 Phases Validated by Syndicate · Facilitator Review Ready)
              </span>
            ` : confirmedCount > 0 ? `
              <span style="display: inline-block; padding: 4px 10px; background: #fef7e0; border: 1.5px solid #b06000; color: #b06000; font-weight: 800; font-size: 8.5pt; border-radius: 4px;">
                ⚠️ STATUS: INCOMPLETE DRAFT DOSSIER (${confirmedCount}/6 Phases Self-Confirmed · Pending Syndicate Completion)
              </span>
            ` : `
              <span style="display: inline-block; padding: 4px 10px; background: #fef7e0; border: 1.5px solid #b06000; color: #b06000; font-weight: 800; font-size: 8.5pt; border-radius: 4px;">
                ⚠️ STATUS: UNCONFIRMED DRAFT DOSSIER (Pending Syndicate Self-Confirmation)
              </span>
            `}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 9pt;">
            <div><strong>Syndicate Team:</strong> ${escapeHtml(session.teamName || 'Syndicate Team')}</div>
            <div><strong>Session Date:</strong> ${escapeHtml(session.date || new Date().toISOString().slice(0, 10))}</div>
            <div><strong>Participants:</strong> ${escapeHtml(session.participants || 'Not provided')}</div>
            <div><strong>Appointed Note-Taker:</strong> ${escapeHtml(session.noteTaker || 'Not provided')}</div>
            <div><strong>Target Mandate:</strong> UNAC / CARANA (Galasi CIS)</div>
            <div><strong>Curriculum Authority:</strong> Official UNPOL CBD JST Lessons 1–6</div>
          </div>
        </div>

        <!-- TRAINING SAFEGUARD & INSTRUCTIONAL PREMISE -->
        <div style="background: #fdf8eb; border: 1px solid #d4a72c; padding: 10px 14px; font-size: 8.5pt; color: #583c03; margin-bottom: 20px; border-radius: 4px;">
          <strong>Official Training Safeguard & Curriculum Premise:</strong> CARANA and UNAC are fictional training scenarios developed by the United Nations Department of Peace Operations (DPO). This dossier documents the cumulative operational outputs of UNPOL CBD Job-Specific Training (JST) Lessons 1 through 6. In accordance with JST Lesson 6 (Slide 8 & Activity 6.1), transition planning specifically addresses the programmatic handover and sustainability of the bilateral Capacity-Building and Development (CBD) activity to host-state authorities and development partners, rather than the political withdrawal or overall liquidation of the wider UN peacekeeping mission.
        </div>

        <!-- ========================================== -->
        <!-- PHASE 1: SITUATIONAL ANALYSIS -->
        <!-- ========================================== -->
        <section style="margin-bottom: 24px; page-break-after: always;">
          <h2 style="font-size: 13pt; color: #001f3f; border-bottom: 1.5px solid #0072ce; padding-bottom: 4px; margin-bottom: 12px;">
            Phase 1: Situational Analysis (JST Lesson 1)
          </h2>

          <!-- Strategic Perspectives (3 CBD Levels) -->
          <div style="margin-bottom: 14px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">1. Strategic Mandate Perspectives (3 CBD Levels)</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px;">
              <tr>
                <th style="width: 25%; text-align: left; background: #f0f4f8; padding: 6px; border: 1px solid #ccc;">Enabling Environment</th>
                <td style="padding: 6px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.perspectives?.enablingEnvironment || 'Not provided')}</td>
              </tr>
              <tr>
                <th style="text-align: left; background: #f0f4f8; padding: 6px; border: 1px solid #ccc;">Organisational Level</th>
                <td style="padding: 6px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.perspectives?.organisationalLevel || 'Not provided')}</td>
              </tr>
              <tr>
                <th style="text-align: left; background: #f0f4f8; padding: 6px; border: 1px solid #ccc;">Individual Level</th>
                <td style="padding: 6px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.perspectives?.individualLevel || 'Not provided')}</td>
              </tr>
            </table>
          </div>

          <!-- PESTEL-S Scanning -->
          <div style="margin-bottom: 14px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">2. Environmental Scanning (PESTEL-S Analysis)</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px;">
              <tr><th style="width: 25%; text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Political Context</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.pestel?.political || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Economic & Budgetary Factors</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.pestel?.economic || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Social, Ethnic & Cultural Realities</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.pestel?.social || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Technological & Infrastructure Realities</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.pestel?.technological || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Environmental & Geographic Factors</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.pestel?.environmental || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Legal & Institutional Framework</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.pestel?.legal || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Security Environment Factors</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.pestel?.security || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc; font-weight: 700;">Synthesis & Strategic Implications</th><td style="padding: 5px; border: 1px solid #ccc; font-weight: 600; white-space: pre-wrap;">${escapeHtml(m1.pestel?.synthesis || 'Not provided')}</td></tr>
            </table>
          </div>

          <!-- Response Analysis & External Coordination -->
          <div style="margin-bottom: 14px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">Response Analysis & External Coordination</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px;">
              <tr><th style="width: 25%; text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">External Actors & Ongoing Interventions</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.responseAnalysis?.externalActors || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Potential Synergies & Opportunities</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.responseAnalysis?.synergiesOpportunities || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Risks of Duplication & Mitigation</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.responseAnalysis?.risksDuplication || 'Not provided')}</td></tr>
            </table>
          </div>

          <!-- Stakeholders -->
          <div style="margin-bottom: 14px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">3. Stakeholder Analysis & 4-Quadrant Strategy</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 8px;">
              <thead>
                <tr style="background: #f0f4f8;">
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 20%;">Stakeholder</th>
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 15%;">Role / Sector</th>
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 10%;">Influence</th>
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 10%;">Interest</th>
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 25%;">Needs & Concerns</th>
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 20%;">Engagement Strategy</th>
                </tr>
              </thead>
              <tbody>
                ${(m1.stakeholders || []).map(sh => `
                  <tr>
                    <td style="border: 1px solid #ccc; padding: 4px; font-weight: 600;">${escapeHtml(sh.name)}</td>
                    <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(sh.role || sh.category || '')}</td>
                    <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(sh.influence)}</td>
                    <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(sh.interest)}</td>
                    <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(sh.needs || '')}</td>
                    <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(sh.strategy || sh.engagementStrategy || '')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top: 6px; font-size: 8.5pt; background: #fafafa; border: 1px solid #ccc; padding: 6px 8px;">
              <strong>Stakeholder Engagement Conclusion:</strong> ${escapeHtml(m1.stakeholdersConclusion || 'Not provided')}
            </div>
          </div>

          <!-- Matrix Evidence Register -->
          <div style="margin-bottom: 14px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">4. Diagnostic Matrix Findings (Recorded Intersections)</h3>
            ${recordedCells.length === 0 ? '<p style="font-size: 8pt; color: #666; font-style: italic;">No specific matrix findings recorded.</p>' : `
              <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 8px;">
                <thead>
                  <tr style="background: #f0f4f8;">
                    <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 22%;">Area & Subcategory</th>
                    <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 18%;">Dimension</th>
                    <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 15%;">Scenario Para(s)</th>
                    <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 45%;">Diagnostic Finding & Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${recordedCells.map(c => `
                    <tr>
                      <td style="border: 1px solid #ccc; padding: 4px; vertical-align: top;"><strong>${escapeHtml(c.area)}</strong><br><span style="color:#555;">${escapeHtml(c.subarea)}</span></td>
                      <td style="border: 1px solid #ccc; padding: 4px; vertical-align: top;">${escapeHtml(c.dim)}</td>
                      <td style="border: 1px solid #ccc; padding: 4px; vertical-align: top;">${c.paragraphs.length > 0 ? c.paragraphs.map(p => `Para ${escapeHtml(String(p))}`).join(', ') : '—'}</td>
                      <td style="border: 1px solid #ccc; padding: 4px; vertical-align: top; white-space: pre-wrap;">${escapeHtml(c.notes || '—')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>

          <!-- SWOT Analysis -->
          <div style="margin-bottom: 14px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">5. SWOT Analysis</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 8pt; margin-bottom: 8px;">
              <div style="border: 1px solid #ccc; padding: 6px; background: #fafafa;"><strong>Strengths:</strong> ${(m1.swot?.strengths || []).map(s => escapeHtml(typeof s === 'string' ? s : s.text)).join('; ') || 'None recorded'}</div>
              <div style="border: 1px solid #ccc; padding: 6px; background: #fafafa;"><strong>Weaknesses:</strong> ${(m1.swot?.weaknesses || []).map(s => escapeHtml(typeof s === 'string' ? s : s.text)).join('; ') || 'None recorded'}</div>
              <div style="border: 1px solid #ccc; padding: 6px; background: #fafafa;"><strong>Opportunities:</strong> ${(m1.swot?.opportunities || []).map(s => escapeHtml(typeof s === 'string' ? s : s.text)).join('; ') || 'None recorded'}</div>
              <div style="border: 1px solid #ccc; padding: 6px; background: #fafafa;"><strong>Threats:</strong> ${(m1.swot?.threats || []).map(s => escapeHtml(typeof s === 'string' ? s : s.text)).join('; ') || 'None recorded'}</div>
            </div>
          </div>

          <!-- Programmatic Baseline Register -->
          <div style="margin-bottom: 14px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">6. Programmatic Baseline Register</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 8px;">
              <thead>
                <tr style="background: #f0f4f8;">
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 20%;">Functional Area / Baseline</th>
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 30%;">As-Is Evidence (Current State)</th>
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 15%;">Baseline Metric</th>
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 15%;">To-Be Target</th>
                  <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 20%;">Means of Verification</th>
                </tr>
              </thead>
              <tbody>
                ${(m1.baseline || []).map(b => `
                  <tr>
                    <td style="border: 1px solid #ccc; padding: 4px; font-weight: 600;">${escapeHtml(b.area || b.functionalArea || '')}<br><span style="color:#555; font-weight: normal;">${escapeHtml(b.subarea || '')}</span></td>
                    <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(b.asIsEvidence || b.currentCapacity || 'Not provided')}</td>
                    <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(b.baselineMetric || '—')}</td>
                    <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(b.tobeTarget || '—')}</td>
                    <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(b.verificationSource || b.entryPoint || 'Not provided')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Situational Diagnostic Summary -->
          <div style="margin-bottom: 14px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">7. Situational Diagnostic Summary</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px;">
              <tr><th style="width: 25%; text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Core Challenge / Problem</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.summary?.mainProblem || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Evidence & Fact Pattern</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.summary?.evidenceText || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Primary CBD Intervention</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.summary?.primaryIntervention || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Operational Safeguards</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m1.summary?.safeguards || 'Not provided')}</td></tr>
            </table>
          </div>

          <!-- Phase 1 Reflection -->
          <div style="background: #fafafa; border: 1px solid #ddd; padding: 8px 12px; font-size: 8pt; margin-bottom: 8px;">
            <strong>Phase 1 Syndicate Reflection:</strong>
            <div style="margin-top: 4px;"><strong>Mandate & Field Experience:</strong> ${escapeHtml(m1.reflection?.q1Experience || 'Not provided')}</div>
            <div style="margin-top: 4px;"><strong>Counterpart Perspective:</strong> ${escapeHtml(m1.reflection?.q2CounterpartPerspective || 'Not provided')}</div>
            <div style="margin-top: 4px;"><strong>Personal Resilience & Growth:</strong> ${escapeHtml(m1.reflection?.q3PersonalGrowth || 'Not provided')}</div>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- PHASE 2: OBJECTIVE SETTING & PRIORITISATION -->
        <!-- ========================================== -->
        <section style="margin-bottom: 24px; page-break-after: always;">
          <h2 style="font-size: 13pt; color: #001f3f; border-bottom: 1.5px solid #0072ce; padding-bottom: 4px; margin-bottom: 12px;">
            Phase 2: Objective Setting & Prioritisation (JST Lesson 2)
          </h2>

          <div style="margin-bottom: 10px; font-size: 8.5pt;">
            <strong>Strategic Mandate Alignment:</strong> UNSCR: ${escapeHtml(m2.strategicAlignment?.alignedUNSCR || 'UNSCR 2151')} | SDG: ${escapeHtml(m2.strategicAlignment?.alignedSDG || 'SDG 16')} | Mission Priorities: ${escapeHtml(m2.strategicAlignment?.missionPriorities || 'Rule of law strengthening')}
          </div>

          <!-- Prioritisation Table -->
          <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">1. Candidate Objectives Prioritisation Chart (Lesson 2 p. 24)</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 12px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 6%;">Rank</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 34%;">Objective Initiative & Scope</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 10%;">Align (x2)</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 10%;">Need</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 10%;">Impl.</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 10%;">Comp. (x0.5)</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 10%;">Donor</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 10%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(m2.objectives || []).map((o, idx) => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: 700;">#${escapeHtml(String(o.rank || idx + 1))}</td>
                  <td style="border: 1px solid #ccc; padding: 4px;"><strong>${escapeHtml(o.title)}</strong><br><span style="color: #555;">${escapeHtml(o.description || '')}</span></td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(String(o.weightedStrategicScore || 0))}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(String(o.scores?.need || 0))}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(String(o.scores?.implementability || 0))}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(String((o.scores?.complementarity || 0) * 0.5))}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(String(o.scores?.donorInterest || 0))}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: 700;">${escapeHtml(String(o.overallScore || 0))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- SMART Objectives -->
          <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0;">2. Formulated S.M.A.R.T. Objectives</h3>
          ${(m2.smartObjectives || []).map((so, idx) => `
            <div style="background: #f9fbfd; border: 1px solid #bce1f8; padding: 8px 12px; margin-bottom: 10px; font-size: 8.5pt; border-radius: 4px;">
              <div style="font-weight: 700; color: #001f3f; margin-bottom: 4px;">SMART Objective #${idx + 1}: ${escapeHtml(so.title)}</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 8pt; margin-bottom: 6px;">
                <div><strong>Specific (S):</strong> ${escapeHtml(so.specific || 'Not provided')}</div>
                <div><strong>Measurable (M):</strong> ${escapeHtml(so.measurable || 'Not provided')}</div>
                <div><strong>Achievable (A):</strong> ${escapeHtml(so.achievable || 'Not provided')}</div>
                <div><strong>Relevant (R):</strong> ${escapeHtml(so.relevant || 'Not provided')}</div>
                <div style="grid-column: span 2;"><strong>Time-Bound (T):</strong> ${escapeHtml(so.timeBound || 'Not provided')}</div>
              </div>
              <div style="background: #fff; padding: 6px; border: 1px solid #ddd; font-weight: 600; color: #001f3f;">
                Statement: "${escapeHtml(so.fullStatement || 'Formulation in progress')}"
              </div>
            </div>
          `).join('')}

          <!-- Performance Framework (KPIs) -->
          <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0;">3. Performance Measurement Framework (KPIs)</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 12px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 22%;">Performance Indicator</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 12%;">Type</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 12%;">Baseline</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 14%;">Target</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 16%;">Source / Verification</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 12%;">Frequency</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 12%;">Lead</th>
              </tr>
            </thead>
            <tbody>
              ${(m2.kpis || []).map(k => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 600;">${escapeHtml(k.name)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(k.type)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(k.baselineValue || '')}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(k.targetValue || '')}</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(k.source || '')}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(k.frequency || '')}</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(k.responsible || '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Phase 2 Reflection -->
          <div style="background: #fafafa; border: 1px solid #ddd; padding: 8px 12px; font-size: 8pt; margin-bottom: 8px;">
            <strong>Phase 2 Syndicate Reflection:</strong>
            <div style="margin-top: 4px;"><strong>SMART Formulation Experience:</strong> ${escapeHtml(m2.reflection?.q1Experience || 'Not provided')}</div>
            <div style="margin-top: 4px;"><strong>Strategic Prioritisation Challenges:</strong> ${escapeHtml(m2.reflection?.q2StrategicPrioritisation || 'Not provided')}</div>
            <div style="margin-top: 4px;"><strong>Local Ownership & Sustainability:</strong> ${escapeHtml(m2.reflection?.q3LocalOwnership || 'Not provided')}</div>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- PHASE 3: PLANNING & LOGFRAME -->
        <!-- ========================================== -->
        <section style="margin-bottom: 24px; page-break-after: always;">
          <h2 style="font-size: 13pt; color: #001f3f; border-bottom: 1.5px solid #0072ce; padding-bottom: 4px; margin-bottom: 12px;">
            Phase 3: Planning Activities & Logframe (JST Lesson 3)
          </h2>

          <!-- Theory of Change -->
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">1. Theory of Change</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px;">
              <tr><th style="width: 25%; text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Key Driver of Change</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m3.theoryOfChange?.driver || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Critical Conditions Required</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m3.theoryOfChange?.criticalConditions || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Core Causal Rationale (If-Then)</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m3.theoryOfChange?.rationale || 'Not provided')}</td></tr>
            </table>
          </div>

          <!-- Logframe -->
          <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">2. Logical Framework (Logframe Results Chain)</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 12px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 18%;">Hierarchy Level</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 42%;">Narrative Summary</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 20%;">Indicators & Verification</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 20%;">Assumptions / Inputs</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background: #edf4fa;">
                <td style="border: 1px solid #ccc; padding: 4px; font-weight: 700;">Impact</td>
                <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(m3.logframe?.impact?.narrative || '')}</td>
                <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">Ind: ${escapeHtml(m3.logframe?.impact?.indicators || 'Not provided')}<br>Verif: ${escapeHtml(m3.logframe?.impact?.verification || 'Not provided')}</td>
                <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(m3.logframe?.impact?.assumptions || '')}</td>
              </tr>
              ${(m3.logframe?.outcomes || []).map(o => `
                <tr style="background: #fbfbfb;">
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 700;">Outcome ${escapeHtml(String(o.id))}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(o.narrative)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">Ind: ${escapeHtml(o.indicators || 'Not provided')}<br>Verif: ${escapeHtml(o.verification || 'Not provided')}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(o.assumptions || '')}</td>
                </tr>
              `).join('')}
              ${(m3.logframe?.outputs || []).map(outp => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 600;">Output ${escapeHtml(String(outp.id))}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(outp.narrative)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">Target: ${escapeHtml(outp.indicators || 'Not provided')}<br>Verif: ${escapeHtml(outp.verification || 'Not provided')}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(outp.assumptions || '')}</td>
                </tr>
              `).join('')}
              ${(m3.logframe?.activities || []).map(act => `
                <tr style="font-size: 7.5pt;">
                  <td style="border: 1px solid #ccc; padding: 3px;">Activity ${escapeHtml(String(act.id))}</td>
                  <td style="border: 1px solid #ccc; padding: 3px; white-space: pre-wrap;">${escapeHtml(act.narrative)}</td>
                  <td style="border: 1px solid #ccc; padding: 3px; white-space: pre-wrap;">Inputs: ${escapeHtml(act.inputs || 'Not provided')}<br>Verif: ${escapeHtml(act.verification || 'Not provided')}</td>
                  <td style="border: 1px solid #ccc; padding: 3px; white-space: pre-wrap;">${escapeHtml(act.assumptions || '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Risks & Contingency -->
          <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">3. 3x3 Risk Assessment Matrix (Lesson 3 Slide 17)</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 12px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 22%;">Risk Title</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 8%;">L</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 8%;">I</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 10%;">Zone</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 26%;">Mitigation Strategy</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 26%;">Contingency Trigger & Plan</th>
              </tr>
            </thead>
            <tbody>
              ${(m3.risks || m3.riskRegister || []).map(r => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 600;">${escapeHtml(r.title)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(String(r.likelihood))}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(String(r.impact))}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: 700; text-transform: uppercase;">${escapeHtml(r.zone)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(r.mitigationStrategy || r.mitigation || '')}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(r.contingencyPlan || r.contingencyTrigger || 'Not provided')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Contingency Continuity Plan -->
          <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">4. Operational Contingency & Continuity Plan</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px;">
            <tr><th style="width: 25%; text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Contingency Activation Trigger</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m3.contingency?.trigger || 'Not provided')}</td></tr>
            <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Backup Plan & Redundancy</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m3.contingency?.backupPlan || 'Not provided')}</td></tr>
            <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Continuity Personnel</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m3.contingency?.continuityPersonnel || 'Not provided')}</td></tr>
            <tr><th style="text-align: left; background: #f0f4f8; padding: 5px; border: 1px solid #ccc;">Stakeholder Communications</th><td style="padding: 5px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m3.contingency?.stakeholderCommunication || 'Not provided')}</td></tr>
          </table>

          <!-- Phase 3 Reflection -->
          <div style="background: #fafafa; border: 1px solid #ddd; padding: 8px 12px; font-size: 8pt; margin-bottom: 8px;">
            <strong>Phase 3 Syndicate Reflection:</strong>
            <div style="margin-top: 4px;"><strong>Logframe Planning Experience:</strong> ${escapeHtml(m3.reflection?.q1Experience || 'Not provided')}</div>
            <div style="margin-top: 4px;"><strong>Planning Hierarchy:</strong> ${escapeHtml(m3.reflection?.q2PlanningHierarchy || 'Not provided')}</div>
            <div style="margin-top: 4px;"><strong>Risk Preparedness:</strong> ${escapeHtml(m3.reflection?.q3RiskPreparedness || 'Not provided')}</div>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- PHASE 4: IMPLEMENTATION & PROBLEM SOLVING -->
        <!-- ========================================== -->
        <section style="margin-bottom: 24px; page-break-after: always;">
          <h2 style="font-size: 13pt; color: #001f3f; border-bottom: 1.5px solid #0072ce; padding-bottom: 4px; margin-bottom: 12px;">
            Phase 4: Implementation (JST Lesson 4)
          </h2>

          <!-- MMA Strategy -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 8pt; margin-bottom: 12px;">
            <div style="border: 1px solid #ccc; padding: 6px; background: #fafafa;"><strong>Monitoring:</strong> ${escapeHtml(m4.mmaStrategy?.monitoringMechanisms || 'Not provided')}</div>
            <div style="border: 1px solid #ccc; padding: 6px; background: #fafafa;"><strong>Mentoring:</strong> ${escapeHtml(m4.mmaStrategy?.mentoringCoachingPlan || 'Not provided')}</div>
            <div style="border: 1px solid #ccc; padding: 6px; background: #fafafa;"><strong>Advising:</strong> ${escapeHtml(m4.mmaStrategy?.advisingPriorities || 'Not provided')}</div>
          </div>

          <!-- Role Reversal -->
          <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">1. Counterpart Perspective & Role Reversal Analysis</h3>
          ${(m4.roleReversal || []).map(rr => `
            <div style="background: #fdfdfe; border: 1px solid #ddd; padding: 8px 10px; margin-bottom: 8px; font-size: 8pt; border-radius: 4px;">
              <strong style="color: #001f3f;">${escapeHtml(rr.counterpart ? rr.counterpart + ' — ' : '')}${escapeHtml(rr.roleName)} (${escapeHtml(rr.incumbentTitle || 'Counterpart')})</strong>
              <div style="margin-top: 4px; color: #333;"><strong>Operational Realities:</strong> ${escapeHtml(rr.counterpartProfile || 'Not provided')}</div>
              <div style="margin-top: 2px;"><strong>Primary Interests:</strong> ${escapeHtml(rr.primaryInterests || 'Not provided')} | <strong style="color:#a62727;">Fears/Threats:</strong> ${escapeHtml(rr.perceivedThreats || 'Not provided')}</div>
              <div style="margin-top: 2px;"><strong>Unspoken Incentives:</strong> ${escapeHtml(rr.unspokenIncentives || 'Not provided')}</div>
              <div style="margin-top: 4px; background: #f0f4f8; padding: 4px; font-weight: 600;">Trust-Building Strategy: ${escapeHtml(rr.respectfulEngagementStrategy || 'Not provided')}</div>
            </div>
          `).join('')}

          <!-- Field Setbacks -->
          <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0 4px;">2. Dynamic Field Problem Solving (Setbacks Register)</h3>
          ${(m4.fieldSetbacks || []).map(sb => `
            <div style="border: 1px solid #ccc; padding: 6px 10px; margin-bottom: 6px; font-size: 8pt; background: #fff;">
              <div style="display:flex; justify-content:space-between;">
                <strong>${escapeHtml(sb.title)}</strong>
                <span style="font-weight:700; color:${sb.status === 'Resolved' ? '#135232' : '#8c4a00'};">${escapeHtml(sb.status)}</span>
              </div>
              <div style="margin-top: 2px;"><strong>Scenario:</strong> ${escapeHtml(sb.scenario || '')}</div>
              <div style="margin-top: 2px;"><strong>Root Cause (5 Whys):</strong> ${escapeHtml(sb.rootCause || '')}</div>
              <div style="margin-top: 2px;"><strong>Negotiation Strategy:</strong> ${escapeHtml(sb.negotiationStrategy || '')}</div>
              <div style="margin-top: 2px; font-weight:600;">Resolution Action: ${escapeHtml(sb.resolutionAction || '')}</div>
            </div>
          `).join('')}

          <!-- Change Management -->
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0 4px;">3. Change Management Strategy</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px;">
              <tr><th style="width: 25%; text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Unfreezing Tactics</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m4.changeManagement?.unfreezingTactics || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Guiding Coalition Champions</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m4.changeManagement?.coalitionChampions || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Short-Term Quick Wins</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m4.changeManagement?.quickWins || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Sustaining Momentum</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m4.changeManagement?.sustainingMomentum || 'Not provided')}</td></tr>
            </table>
          </div>

          <!-- Activity Tracker -->
          <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0 4px;">4. Implementation Activity Tracker</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 10px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 35%;">Activity Title</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 12%;">Status</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 10%;">Progress</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 43%;">Field Advisory / Mentoring Note</th>
              </tr>
            </thead>
            <tbody>
              ${(m4.activityTracker || []).map(tr => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 600;">${escapeHtml(tr.activityTitle)}<br><span style="font-size: 7.2pt; color: #555;">Ref: ${escapeHtml(tr.outputRef || 'Output')}</span></td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(tr.status)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: 700;">${escapeHtml(String(tr.progressPercent != null ? tr.progressPercent : 0))}%</td>
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(tr.fieldAdvisoryNote || '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Phase 4 Reflection -->
          <div style="background: #fafafa; border: 1px solid #ddd; padding: 8px 12px; font-size: 8pt; margin-bottom: 8px;">
            <strong>Phase 4 Syndicate Reflection:</strong>
            <div style="margin-top: 4px;"><strong>Implementation & Advising Experience:</strong> ${escapeHtml(m4.reflection?.q1Experience || 'Not provided')}</div>
            <div style="margin-top: 4px;"><strong>Counterpart Empathy & Resistance:</strong> ${escapeHtml(m4.reflection?.q2EmpathyAndResistance || 'Not provided')}</div>
            <div style="margin-top: 4px;"><strong>Resilience in the Field:</strong> ${escapeHtml(m4.reflection?.q3ResilienceInTheField || 'Not provided')}</div>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- PHASE 5: EVALUATION & ADJUSTMENT -->
        <!-- ========================================== -->
        <section style="margin-bottom: 24px; page-break-after: always;">
          <h2 style="font-size: 13pt; color: #001f3f; border-bottom: 1.5px solid #0072ce; padding-bottom: 4px; margin-bottom: 12px;">
            Phase 5: Evaluation & Adjustment (JST Lesson 5)
          </h2>

          <!-- Evaluation Framework -->
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">1. Evaluation Framework (Deming PDCA Cycle)</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px;">
              <tr><th style="width: 25%; text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Deming Cycle Phase</th><td style="padding: 4px; border: 1px solid #ccc;">${escapeHtml(m5.evaluationFramework?.demingPhase || 'CHECK / ADJUST')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Key Evaluation Actors</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m5.evaluationFramework?.evalActors || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Core Evaluation Principles</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m5.evaluationFramework?.principles || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Data Collection Strategy</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m5.evaluationFramework?.dataCollectionStrategy || 'Not provided')}</td></tr>
            </table>
          </div>

          <!-- Crisis Diagnostics -->
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">2. Mid-Term Crisis Diagnostics & Bottleneck Realities</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px;">
              <tr><th style="width: 25%; text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Political & Leadership Shift</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m5.crisisAnalysis?.leadershipShiftImpact || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Absorption Capacity Assessment</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m5.crisisAnalysis?.absorptionCapacityAssessment || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Data Loss & Paper Vulnerability</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m5.crisisAnalysis?.dataLossAssessment || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Inter-Agency Dynamics & Friction</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m5.crisisAnalysis?.interAgencyFriction || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Public Perception Gap</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m5.crisisAnalysis?.publicPerceptionGap || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Budget Cliff & Donor Fatigue</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m5.crisisAnalysis?.budgetCliffRisk || 'Not provided')}</td></tr>
            </table>
          </div>

          <!-- KPI Evaluations -->
          <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">3. Performance Indicator Mid-Term Evaluations</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 12px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 20%;">Indicator</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 9%;">Baseline</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 9%;">Target</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 9%;">Month 8 Actual</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 11%;">Variance Status</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 42%;">Variance Analysis & Corrective Action</th>
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
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">
                    ${ev.varianceAnalysis ? `<div style="margin-bottom: 2px;"><strong>Variance Analysis:</strong> ${escapeHtml(ev.varianceAnalysis)}</div>` : ''}
                    <div><strong>Corrective Action:</strong> ${escapeHtml(ev.correctiveAction || 'Not provided')}</div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- 3-Tier Adjustments -->
          <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">4. 3-Tier Adjustment Recommendations & Decisions (Lesson 5 Slide 10)</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 12px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 25%;">Recommendation</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 12%;">Reaction</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 30%;">Justification</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 33%;">Action Plan & Lead Owner</th>
              </tr>
            </thead>
            <tbody>
              ${(m5.adjustments || []).map(adj => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 600;">${escapeHtml(adj.recommendationTitle)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: 700;">${escapeHtml(adj.reaction)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(adj.justification || '')}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(adj.actionPlan || '')}<br><span style="font-size:7.2pt; color:#555;">Lead: ${escapeHtml(adj.stakeholderOwner || '')}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Planning Recalibration Impact -->
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">5. Planning Recalibration Impact Assessment (Lesson 5 p. 11)</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px;">
              <tr><th style="width: 25%; text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Timeline Recalibration</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m5.impactAssessment?.timelineImpact || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Resource & Budget Realignment</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m5.impactAssessment?.resourceImpact || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Quality & Standard Standards</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m5.impactAssessment?.qualityImpact || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Counterpart Ownership & Will</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m5.impactAssessment?.counterpartWillingness || 'Not provided')}</td></tr>
            </table>
          </div>

          <!-- Phase 5 Reflection -->
          <div style="background: #fafafa; border: 1px solid #ddd; padding: 8px 12px; font-size: 8pt; margin-bottom: 8px;">
            <strong>Phase 5 Syndicate Reflection:</strong>
            <div style="margin-top: 4px;"><strong>Evaluation Relevance:</strong> ${escapeHtml(m5.reflection?.q1EvaluationRelevance || 'Not provided')}</div>
            <div style="margin-top: 4px;"><strong>Facing Inconvenient Truths:</strong> ${escapeHtml(m5.reflection?.q2FacingInconvenientTruths || 'Not provided')}</div>
            <div style="margin-top: 4px;"><strong>Personal Resilience in Failure:</strong> ${escapeHtml(m5.reflection?.q3PersonalResilienceInFailure || 'Not provided')}</div>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- PHASE 6: TRANSITION & HANDOVER -->
        <!-- ========================================== -->
        <section style="margin-bottom: 24px;">
          <h2 style="font-size: 13pt; color: #001f3f; border-bottom: 1.5px solid #0072ce; padding-bottom: 4px; margin-bottom: 12px;">
            Phase 6: Transition & Handover Protocol (JST Lesson 6)
          </h2>

          <!-- The Four Key Principles of Transition (Lesson 6 Slide 8) -->
          <div style="margin-bottom: 14px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">The Four Key Principles of Transition (Lesson 6 Slide 8)</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px;">
              <tr><th style="width: 25%; text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">1. Early Planning Framework</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m6.fourPrinciplesFramework?.earlyPlanning || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">2. UN Integration & Coordination</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m6.fourPrinciplesFramework?.unIntegration || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">3. Local Institutional Ownership</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m6.fourPrinciplesFramework?.localOwnership || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">4. Communication Protocol</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m6.fourPrinciplesFramework?.communicationProtocol || 'Not provided')}</td></tr>
            </table>
          </div>

          <!-- Transition Initiation Charter -->
          <div style="margin-bottom: 12px; font-size: 8.5pt;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 4px 0 6px;">Transition Initiation Charter</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px;">
              <tr><th style="width: 25%; text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">HOPC Initiation Horizon</th><td style="padding: 4px; border: 1px solid #ccc;">${escapeHtml(m6.transitionStrategy?.hopcInitiationDate || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Primary Transition Trigger</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m6.transitionStrategy?.primaryTrigger || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Succeeding Entity</th><td style="padding: 4px; border: 1px solid #ccc;">${escapeHtml(m6.transitionStrategy?.succeedingEntity || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Local Institutional Owner</th><td style="padding: 4px; border: 1px solid #ccc;">${escapeHtml(m6.transitionStrategy?.localOwnerDesignation || 'Not provided')}</td></tr>
            </table>
          </div>

          <!-- Phased Roadmap -->
          <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0 4px;">1. Phased Handover Roadmap (Lesson 6 Slide 9)</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 12px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 18%;">Phase</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 32%;">Operational Milestone</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 20%;">Lead Entity</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 20%;">Exit & Handover Criteria</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 10%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${(m6.transitionRoadmap || []).map(r => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 700;">${escapeHtml(r.phase)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(r.milestone)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px;">${escapeHtml(r.leadResponsible || r.lead || '')}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(r.handoverCriteria || r.exitCriteria || '')}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${escapeHtml(r.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Institutionalizing Practice -->
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0 4px;">2. Institutionalising Sustainable Policing Practice</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px;">
              <tr><th style="width: 25%; text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">National Doctrine Codification</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m6.institutionalizingPractice?.doctrineCodification || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Police Academy Curriculum</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m6.institutionalizingPractice?.academyIntegration || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Gender-Responsive Budgeting</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m6.institutionalizingPractice?.genderResponsiveBudget || 'Not provided')}</td></tr>
              <tr><th style="text-align: left; background: #f0f4f8; padding: 4px; border: 1px solid #ccc;">Democratic Oversight Handover</th><td style="padding: 4px; border: 1px solid #ccc; white-space: pre-wrap;">${escapeHtml(m6.institutionalizingPractice?.oversightHandover || 'Not provided')}</td></tr>
            </table>
          </div>

          <!-- Post-Transition Challenges & Remedies -->
          <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0 4px;">3. Post-Transition Risks & Sustainability Remedies</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 12px;">
            <thead>
              <tr style="background: #f0f4f8;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 45%;">Anticipated Obstacle / Regression Threat</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; width: 12%;">Risk Level</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; width: 43%;">Mitigating Remedy / Institutional Safeguard</th>
              </tr>
            </thead>
            <tbody>
              ${(m6.challengesRemedies || []).map(cr => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 4px; font-weight: 600; white-space: pre-wrap;">${escapeHtml(cr.challenge)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: 700;">${escapeHtml(cr.riskLevel)}</td>
                  <td style="border: 1px solid #ccc; padding: 4px; white-space: pre-wrap;">${escapeHtml(cr.remedy || '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Formal Handover Protocol Instrument -->
          <h3 style="font-size: 10pt; color: #001f3f; margin: 6px 0 4px;">4. Formal Handover Protocol Instrument</h3>
          <div style="border: 1.5px solid #001f3f; padding: 12px; font-size: 8.5pt; background: #fafafa; margin-bottom: 12px; border-radius: 4px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
              <div><strong>Effective Handover Date:</strong> ${escapeHtml(m6.handoverNotice?.handoverDate || 'Not provided')}</div>
              <div><strong>UNPOL Lead Signatory:</strong> ${escapeHtml(m6.handoverNotice?.unpolSignatory || 'Not provided')}</div>
              <div><strong>Host Counterpart Signatory:</strong> ${escapeHtml(m6.handoverNotice?.counterpartSignatory || 'Not provided')}</div>
              <div><strong>Witness Signatory:</strong> ${escapeHtml(m6.handoverNotice?.witnessSignatory || 'Not provided')}</div>
            </div>
            <div><strong>Residual Programmatic Obligations:</strong> ${escapeHtml(m6.handoverNotice?.residualObligations || 'Not provided')}</div>
          </div>

          <!-- Phase 6 Reflection -->
          <div style="background: #fafafa; border: 1px solid #ddd; padding: 8px 12px; font-size: 8pt; margin-bottom: 8px;">
            <strong>Phase 6 Syndicate Reflection:</strong>
            <div style="margin-top: 4px;"><strong>Transition Mindset:</strong> ${escapeHtml(m6.reflection?.q1TransitionMindset || 'Not provided')}</div>
            <div style="margin-top: 4px;"><strong>Sustaining National Ownership:</strong> ${escapeHtml(m6.reflection?.q2SustainingOwnership || 'Not provided')}</div>
            <div style="margin-top: 4px;"><strong>Overall CBD Learning Journey:</strong> ${escapeHtml(m6.reflection?.q3OverallCBDJourney || 'Not provided')}</div>
          </div>
        </section>
      </div>
    `;

    if (host) {
      host.innerHTML = html;
    }
    return html;
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
    if (!backdrop) return;
    const shouldOpen = open !== undefined ? open : !backdrop.classList.contains('open');
    if (shouldOpen) {
      lastActiveElement = document.activeElement;
    }
    backdrop.classList.toggle('open', shouldOpen);
    backdrop.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    if (shouldOpen) {
      const searchInput = document.getElementById('glossarySearchInput');
      if (searchInput) {
        searchInput.focus();
      } else {
        const focusable = backdrop.querySelectorAll('input, button, [tabindex]:not([tabindex="-1"])');
        if (focusable.length > 0) focusable[0].focus();
      }
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

    // Confirmation checkbox listener
    const confirmBox = document.getElementById('confirmModule6') || document.getElementById('selfConfirmCheck');
    confirmBox?.addEventListener('change', e => {
      state.module6.confirmed = e.target.checked;
      save(e.target.checked ? 'Phase 6 Confirmed' : 'Confirmation withdrawn');
      updateCompletionBadge();
    });

    document.getElementById('addRoadmapStepBtn')?.addEventListener('click', () => {
      invalidateConfirmation();
      addRoadmapStep();
    });
    document.getElementById('addChallengeBtn')?.addEventListener('click', () => {
      invalidateConfirmation();
      addChallengeRow();
    });
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

    // Print full 6-module dossier
    document.getElementById('printPdfBtn')?.addEventListener('click', () => {
      collectFormFields();
      if (!state.module6?.confirmed) {
        const proceed = confirm('Note: Phase 6 has not been self-confirmed yet.\n\nDo you want to generate the Full Mission Handover Dossier with unconfirmed draft entries?');
        if (!proceed) return;
      }
      save();
      generateFullMissionDossier();
      document.body.classList.add('printing-dossier');
      if (Storage.preparePrintableContent) Storage.preparePrintableContent();
      window.print();
      if (Storage.cleanupPrintableContent) Storage.cleanupPrintableContent();
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
    save,
    generateFullMissionDossier
  };
});
