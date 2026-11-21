/**
 * Module 4: Implementation Controller
 * CARANA CBD Learning Lab
 * Fully implements the UNPOL CBD Job-Specific Training (JST) Lesson 4 methodology:
 * Monitoring, Mentoring and Advising (MMA), Interactive Role Reversal,
 * National Counterpart Perspectives, Change Management, and Dynamic Problem-Solving.
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
    root.Module4App = factory(root.CARANA_SCENARIO, root.CURRICULUM_GLOSSARY, root.LabStorage);
  }
})(typeof self !== 'undefined' ? self : this, function (Scenario, Glossary, Storage) {
  'use strict';

  let state = null;
  let activeStage = 'stage-mma';

  const tw = (key, vars, fallback) => (Storage && Storage.wbT ? Storage.wbT(key, vars, fallback !== undefined ? fallback : key) : (fallback !== undefined ? fallback : key));
  const scLoc = () => (Scenario && Scenario.getLocalized ? Scenario.getLocalized() : Scenario);
  const glLoc = () => (Glossary && Glossary.getLocalized ? Glossary.getLocalized() : Glossary);

  const STAGES = [
    { id: 'stage-mma', label: '1. MMA Operational Triad', short: 'MMA Strategy' },
    { id: 'stage-rolereversal', label: '2. Role Reversal & Empathy', short: 'Role Reversal' },
    { id: 'stage-changemgmt', label: '3. Change Management', short: 'Change Model' },
    { id: 'stage-setbacks', label: '4. Setback Problem-Solving', short: 'Problem-Solving' },
    { id: 'stage-tracker', label: '5. Implementation Tracker', short: 'Activity Tracker' },
    { id: 'stage-summary', label: '6. Review, Reflection & Handoff', short: 'Review & Handoff' }
  ];

  function applyLocaleToModule() {
    renderStageTabs();
    updateCompletionBadge();
    renderRoleReversal();
    renderFieldSetbacks();
    renderActivityTracker();
    renderScenarioDrawerList(document.getElementById('scenarioSearchInput')?.value);
    renderGlossaryList(document.getElementById('glossarySearchInput')?.value);
    Storage.renderCurriculumTrack(4);
  }

  function init() {
    state = Storage.loadLabState();
    if (!state.module4 || !state.module4.fieldSetbacks) {
      state.module4 = Storage.getDefaultState().module4;
    }
    bindGlobalControls();
    renderStageTabs();
    populateFormFields();
    renderRoleReversal();
    renderFieldSetbacks();
    renderActivityTracker();
    renderScenarioDrawerList();
    renderGlossaryList();
    Storage.renderCurriculumTrack(4);
    updateSaveIndicator(tw('Loaded local data'));
    setupAutosaveListener();
    setupLifecycleListeners();
    if (Storage && Storage.initWorkbenchI18n) {
      Storage.initWorkbenchI18n(applyLocaleToModule);
    }
  }

  const dirtyFields = new Set();

  function save(statusMsg) {
    if (typeof window !== 'undefined' && window.__labIsResetting) return false;
    collectFormFields();
    const latest = Storage.loadLabState();
    if (latest) {
      for (let i = 1; i <= 6; i++) {
        if (i !== 4) {
          const modKey = 'module' + i;
          if (latest[modKey]) state[modKey] = latest[modKey];
        }
      }
      if (latest.session) state.session = latest.session;
      if (latest.module4) {
        if (latest.module4.mmaStrategy) {
          const mapping = {
            mmaMonitoring: 'monitoringMechanisms',
            mmaAdvising: 'advisingPriorities',
            mmaMentoring: 'mentoringCoachingPlan'
          };
          for (const [id, f] of Object.entries(mapping)) {
            if (!dirtyFields.has(id) && latest.module4.mmaStrategy[f] !== undefined) {
              state.module4.mmaStrategy[f] = latest.module4.mmaStrategy[f];
              setValue(id, latest.module4.mmaStrategy[f]);
            }
          }
        }
        if (latest.module4.changeManagement) {
          const mapping = {
            cmUnfreezing: 'unfreezingTactics',
            cmChampions: 'coalitionChampions',
            cmQuickWins: 'quickWins',
            cmMomentum: 'sustainingMomentum'
          };
          for (const [id, f] of Object.entries(mapping)) {
            if (!dirtyFields.has(id) && latest.module4.changeManagement[f] !== undefined) {
              state.module4.changeManagement[f] = latest.module4.changeManagement[f];
              setValue(id, latest.module4.changeManagement[f]);
            }
          }
        }
        if (latest.module4.reflection) {
          const mapping = {
            reflectionExperience: 'q1Experience',
            reflectionEmpathy: 'q2EmpathyAndResistance',
            reflectionResilience: 'q3ResilienceInTheField'
          };
          for (const [id, f] of Object.entries(mapping)) {
            if (!dirtyFields.has(id) && latest.module4.reflection[f] !== undefined) {
              state.module4.reflection[f] = latest.module4.reflection[f];
              setValue(id, latest.module4.reflection[f]);
            }
          }
        }
      }
    }
    const ok = Storage.saveLabState(state);
    if (!ok) {
      updateSaveIndicator('⚠️ ' + tw('Storage full or blocked! Export JSON.'), true);
    } else {
      dirtyFields.clear();
      updateSaveIndicator(statusMsg || tw('Saved locally'));
    }
    Storage.renderCurriculumTrack(4);
    return ok;
  }

  function updateSaveIndicator(msg, isError) {
    const el = document.getElementById('saveIndicator');
    if (el) {
      el.textContent = msg || tw('Saved locally on this device');
      el.style.color = isError ? 'var(--danger)' : 'var(--ok)';
    }
  }

  function setupAutosaveListener() {
    document.addEventListener('input', e => {
      if (e.target && e.target.id) dirtyFields.add(e.target.id);
      if (e.target && e.target.id !== 'confirmModule4' && e.target.id !== 'selfConfirmCheck') {
        invalidateConfirmation();
      }
    });
    document.addEventListener('change', e => {
      if (e.target && e.target.id) dirtyFields.add(e.target.id);
    });
    document.addEventListener('input', debounce(() => {
      save(tw('Autosaved'));
    }, 600));
  }

  function invalidateConfirmation() {
    if (state.module4 && state.module4.confirmed) {
      state.module4.confirmed = false;
      const chk = document.getElementById('confirmModule4') || document.getElementById('selfConfirmCheck');
      if (chk) chk.checked = false;
      updateCompletionBadge();
    }
  }

  function updateCompletionBadge() {
    const badge = document.getElementById('stageCompleteFooterBadge');
    if (!badge) return;
    if (state.module4 && state.module4.confirmed) {
      badge.textContent = tw('✓ Phase 4 Self-Confirmed · Ready for Module 5');
      badge.style.color = 'var(--ok)';
    } else {
      badge.textContent = tw('Phase 4 In Progress · Pending Self-Confirmation');
      badge.style.color = 'var(--navy)';
    }
  }

  function setupLifecycleListeners() {
    window.addEventListener('beforeunload', () => {
      if (typeof window !== 'undefined' && window.__labIsResetting) return;
      if (dirtyFields.size > 0) save();
    });
    window.addEventListener('pagehide', () => {
      if (typeof window !== 'undefined' && window.__labIsResetting) return;
      if (dirtyFields.size > 0) save();
    });
    window.addEventListener('carana_cbd_lab_reset', () => {
      dirtyFields.clear();
    });
    window.addEventListener('storage', e => {
      if (e.key === 'carana_cbd_lab_reset_token') {
        if (typeof window !== 'undefined') window.__labIsResetting = true;
        dirtyFields.clear();
        window.location.reload();
        return;
      }
      if (e.key === Storage.STORAGE_KEY) {
        const incoming = Storage.loadLabState();
        if (!incoming) return;
        for (let i = 1; i <= 6; i++) {
          if (i !== 4) {
            const modKey = 'module' + i;
            if (incoming[modKey]) {
              state[modKey] = incoming[modKey];
            }
          }
        }
        if (incoming.session) {
          state.session = incoming.session;
        }
        if (incoming.module4) {
          const activeId = document.activeElement ? document.activeElement.id : '';
          if (incoming.module4.mmaStrategy) {
            const mapping = {
              mmaMonitoring: 'monitoringMechanisms',
              mmaAdvising: 'advisingPriorities',
              mmaMentoring: 'mentoringCoachingPlan'
            };
            for (const [id, f] of Object.entries(mapping)) {
              if (activeId !== id && !dirtyFields.has(id) && incoming.module4.mmaStrategy[f] !== undefined) {
                state.module4.mmaStrategy[f] = incoming.module4.mmaStrategy[f];
                setValue(id, incoming.module4.mmaStrategy[f]);
              }
            }
          }
          if (incoming.module4.changeManagement) {
            const mapping = {
              cmUnfreezing: 'unfreezingTactics',
              cmChampions: 'coalitionChampions',
              cmQuickWins: 'quickWins',
              cmMomentum: 'sustainingMomentum'
            };
            for (const [id, f] of Object.entries(mapping)) {
              if (activeId !== id && !dirtyFields.has(id) && incoming.module4.changeManagement[f] !== undefined) {
                state.module4.changeManagement[f] = incoming.module4.changeManagement[f];
                setValue(id, incoming.module4.changeManagement[f]);
              }
            }
          }
          if (incoming.module4.reflection) {
            const mapping = {
              reflectionExperience: 'q1Experience',
              reflectionEmpathy: 'q2EmpathyAndResistance',
              reflectionResilience: 'q3ResilienceInTheField'
            };
            for (const [id, f] of Object.entries(mapping)) {
              if (activeId !== id && !dirtyFields.has(id) && incoming.module4.reflection[f] !== undefined) {
                state.module4.reflection[f] = incoming.module4.reflection[f];
                setValue(id, incoming.module4.reflection[f]);
              }
            }
          }
        }
        Storage.renderCurriculumTrack(4);
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
    if (stageId === 'stage-rolereversal') renderRoleReversal();
    if (stageId === 'stage-setbacks') renderFieldSetbacks();
    if (stageId === 'stage-tracker') renderActivityTracker();
  }

  function renderStageTabs() {
    const container = document.getElementById('stageNav');
    if (!container) return;
    container.innerHTML = STAGES.map((s, idx) => `
      <button class="stage-tab ${s.id === activeStage ? 'active' : ''}" data-stage="${s.id}" type="button">
        <span class="badge">0${idx + 1}</span>
        <span>${escapeHtml(tw(s.short))}</span>
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

    // MMA Strategy
    const mma = state.module4.mmaStrategy || {};
    setValue('mmaMonitoring', mma.monitoringMechanisms);
    setValue('mmaAdvising', mma.advisingPriorities);
    setValue('mmaMentoring', mma.mentoringCoachingPlan);

    // Change Management
    const cm = state.module4.changeManagement || {};
    setValue('cmUnfreezing', cm.unfreezingTactics);
    setValue('cmChampions', cm.coalitionChampions);
    setValue('cmQuickWins', cm.quickWins);
    setValue('cmMomentum', cm.sustainingMomentum);

    // Reflection
    const ref = state.module4.reflection || {};
    setValue('reflectionExperience', ref.q1Experience);
    setValue('reflectionEmpathy', ref.q2EmpathyAndResistance);
    setValue('reflectionResilience', ref.q3ResilienceInTheField);

    const confirmBox = document.getElementById('confirmModule4') || document.getElementById('selfConfirmCheck');
    if (confirmBox) confirmBox.checked = !!state.module4.confirmed;
    updateCompletionBadge();
  }

  function collectFormFields() {
    state.module4.mmaStrategy = {
      monitoringMechanisms: getValue('mmaMonitoring'),
      advisingPriorities: getValue('mmaAdvising'),
      mentoringCoachingPlan: getValue('mmaMentoring')
    };

    state.module4.changeManagement = {
      unfreezingTactics: getValue('cmUnfreezing'),
      coalitionChampions: getValue('cmChampions'),
      quickWins: getValue('cmQuickWins'),
      sustainingMomentum: getValue('cmMomentum')
    };

    state.module4.reflection = {
      q1Experience: getValue('reflectionExperience'),
      q2EmpathyAndResistance: getValue('reflectionEmpathy'),
      q3ResilienceInTheField: getValue('reflectionResilience')
    };

    const confirmBox = document.getElementById('confirmModule4') || document.getElementById('selfConfirmCheck');
    if (confirmBox) state.module4.confirmed = confirmBox.checked;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  /* Role Reversal (Counterpart Perspectives) */
  function renderRoleReversal() {
    const host = document.getElementById('roleReversalHost');
    if (!host) return;

    host.innerHTML = state.module4.roleReversal.map((role, idx) => `
      <div class="card" style="margin-bottom: 20px; border-inline-start: 6px solid var(--navy);">
        <div class="card-header" style="background: var(--wash);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="cell-badge" style="background: var(--navy);">${escapeHtml(tw('Role #{idx}', { idx: idx + 1 }, `Role #${idx + 1}`))}</span>
            <h3 dir="auto" data-learner-text style="margin: 0; font-size: 1.15rem; color: var(--navy);">${escapeHtml(role.counterpart)}</h3>
          </div>
          <button class="btn btn-sm btn-danger remove-role-btn" data-idx="${idx}" type="button" aria-label="${escapeHtml(tw('Remove role card {name}', { name: role.counterpart || (idx + 1) }, `Remove role card ${role.counterpart || (idx + 1)}`))}">${escapeHtml(tw('Remove Role'))}</button>
        </div>
        <div class="card-body">
          <div class="grid-2">
            <div class="form-group col-full">
              <label class="form-label">${escapeHtml(tw('Counterpart Designation / Role'))}</label>
              <input dir="auto" class="form-input role-field" data-idx="${idx}" data-field="counterpart" value="${escapeHtml(role.counterpart)}" aria-label="${escapeHtml(tw('Counterpart Designation / Role'))}">
            </div>
            <div class="form-group">
              <label class="form-label" style="color: var(--danger);">
                ${escapeHtml(tw('Perceived Vulnerabilities, Fears & Threats'))}
                <span class="form-hint">${escapeHtml(tw('Why might this counterpart resist the CBD initiative? What do they stand to lose?'))}</span>
              </label>
              <textarea dir="auto" class="form-textarea role-field" data-idx="${idx}" data-field="perceivedThreats" style="min-height: 80px;" aria-label="${escapeHtml(tw('Perceived Vulnerabilities, Fears & Threats'))}">${escapeHtml(role.perceivedThreats || '')}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label" style="color: var(--ok-dark);">
                ${escapeHtml(tw('Unspoken Motivations & Legitimate Incentives'))}
                <span class="form-hint">${escapeHtml(tw('What drives them? Career standing, pride, security, peer respect?'))}</span>
              </label>
              <textarea dir="auto" class="form-textarea role-field" data-idx="${idx}" data-field="unspokenIncentives" style="min-height: 80px;" aria-label="${escapeHtml(tw('Unspoken Motivations & Legitimate Incentives'))}">${escapeHtml(role.unspokenIncentives || '')}</textarea>
            </div>
            <div class="form-group col-full" style="background: var(--wash-subtle); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--line);">
              <label class="form-label" style="color: var(--navy);">
                ${escapeHtml(tw('Adviser Engagement & Trust-Building Strategy'))}
                <span class="form-hint">${escapeHtml(tw('How will UNPOL CBD advisers interact to build genuine mutual respect and ownership?'))}</span>
              </label>
              <textarea dir="auto" class="form-textarea role-field" data-idx="${idx}" data-field="respectfulEngagementStrategy" style="min-height: 70px;" aria-label="${escapeHtml(tw('Adviser Engagement & Trust-Building Strategy'))}">${escapeHtml(role.respectfulEngagementStrategy || '')}</textarea>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    host.querySelectorAll('.role-field').forEach(el => {
      el.addEventListener('input', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        state.module4.roleReversal[i][f] = e.target.value;
        save();
      });
    });

    host.querySelectorAll('.remove-role-btn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.idx;
        if (state.module4.roleReversal.length > 1) {
          state.module4.roleReversal.splice(i, 1);
          save();
          renderRoleReversal();
        }
      };
    });
  }

  function addRoleRow() {
    state.module4.roleReversal.push({
      id: 'role-' + Date.now(),
      counterpart: 'New Counterpart Official',
      perceivedThreats: '',
      unspokenIncentives: '',
      respectfulEngagementStrategy: ''
    });
    save();
    renderRoleReversal();
  }

  /* Field Setback Simulations & Problem Solving */
  function renderFieldSetbacks() {
    const host = document.getElementById('fieldSetbacksHost');
    if (!host) return;

    host.innerHTML = state.module4.fieldSetbacks.map((sb, idx) => `
      <div class="card" style="margin-bottom: 22px; border: 1px solid var(--line);">
        <div class="card-header" style="background: ${sb.status === 'Resolved' ? '#eefbf4' : '#fff9f0'};">
          <div>
            <span class="badge" style="background: ${sb.status === 'Resolved' ? 'var(--ok)' : 'var(--warn)'}; color: #fff; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 800;">
              ${escapeHtml(tw(sb.status))}
            </span>
            <strong dir="auto" data-learner-text style="margin-inline-start: 8px; font-size: 1.05rem; color: var(--navy);">${escapeHtml(sb.title)}</strong>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <select class="form-select setback-status" data-idx="${idx}" style="padding: 4px 8px; font-size: 0.8rem; width: auto;" aria-label="${escapeHtml(tw('Setback resolution status'))}">
              <option value="Scheduled" ${sb.status === 'Scheduled' ? 'selected' : ''}>${escapeHtml(tw('Status: Scheduled'))}</option>
              <option value="In Progress" ${sb.status === 'In Progress' ? 'selected' : ''}>${escapeHtml(tw('Status: In Progress'))}</option>
              <option value="Resolved" ${sb.status === 'Resolved' ? 'selected' : ''}>${escapeHtml(tw('Status: Resolved'))}</option>
            </select>
            <button class="btn btn-sm btn-danger remove-setback-btn" data-idx="${idx}" type="button" aria-label="${escapeHtml(tw('Remove setback {title}', { title: sb.title || (idx + 1) }, `Remove setback ${sb.title || (idx + 1)}`))}">×</button>
          </div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label" style="color: var(--danger);">${escapeHtml(tw('Field Crisis / Obstacle Scenario'))}</label>
            <textarea dir="auto" class="form-textarea sb-field" data-idx="${idx}" data-field="scenario" style="min-height: 60px;" aria-label="${escapeHtml(tw('Field Crisis / Obstacle Scenario'))}">${escapeHtml(sb.scenario || '')}</textarea>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">${escapeHtml(tw('Root Cause Analysis (5 Whys / Underlying Friction)'))}</label>
              <textarea dir="auto" class="form-textarea sb-field" data-idx="${idx}" data-field="rootCause" style="min-height: 70px;" aria-label="${escapeHtml(tw('Root Cause Analysis (5 Whys / Underlying Friction)'))}">${escapeHtml(sb.rootCause || '')}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">${escapeHtml(tw('Negotiation & Mediation Strategy (Interest-Based)'))}</label>
              <textarea dir="auto" class="form-textarea sb-field" data-idx="${idx}" data-field="negotiationStrategy" style="min-height: 70px;" aria-label="${escapeHtml(tw('Negotiation & Mediation Strategy (Interest-Based)'))}">${escapeHtml(sb.negotiationStrategy || '')}</textarea>
            </div>
            <div class="form-group col-full" style="background: var(--wash); padding: 12px; border-radius: var(--radius-sm);">
              <label class="form-label" style="color: var(--ok-dark);">${escapeHtml(tw('Concrete Problem-Solving Action & Protocol'))}</label>
              <textarea dir="auto" class="form-textarea sb-field" data-idx="${idx}" data-field="resolutionAction" style="min-height: 60px;" aria-label="${escapeHtml(tw('Concrete Problem-Solving Action & Protocol'))}">${escapeHtml(sb.resolutionAction || '')}</textarea>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    host.querySelectorAll('.sb-field').forEach(el => {
      el.addEventListener('input', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        state.module4.fieldSetbacks[i][f] = e.target.value;
        save();
      });
    });

    host.querySelectorAll('.setback-status').forEach(el => {
      el.addEventListener('change', e => {
        const i = +e.target.dataset.idx;
        state.module4.fieldSetbacks[i].status = e.target.value;
        save();
        renderFieldSetbacks();
      });
    });

    host.querySelectorAll('.remove-setback-btn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.idx;
        if (state.module4.fieldSetbacks.length > 1) {
          state.module4.fieldSetbacks.splice(i, 1);
          save();
          renderFieldSetbacks();
        }
      };
    });
  }

  function addSetbackRow() {
    state.module4.fieldSetbacks.push({
      id: 'setback-' + Date.now(),
      title: 'New Field Implementation Setback',
      scenario: '',
      rootCause: '',
      negotiationStrategy: '',
      resolutionAction: '',
      status: 'In Progress'
    });
    save();
    renderFieldSetbacks();
  }

  /* Activity Implementation Tracker */
  function renderActivityTracker() {
    const host = document.getElementById('activityTrackerBody');
    if (!host) return;

    host.innerHTML = state.module4.activityTracker.map((tr, idx) => `
      <tr data-idx="${idx}">
        <td style="font-weight: 700;">
          <input dir="auto" class="form-input tr-field" data-idx="${idx}" data-field="activityTitle" value="${escapeHtml(tr.activityTitle || '')}" aria-label="${escapeHtml(tw('Activity Title'))}">
          <div style="font-size: 0.72rem; color: var(--muted); margin-top: 4px;">${escapeHtml(tr.outputRef || 'Output')}</div>
        </td>
        <td>
          <select class="form-select tr-field" data-idx="${idx}" data-field="status" aria-label="${escapeHtml(tw('Activity implementation status'))}">
            <option value="Scheduled" ${tr.status === 'Scheduled' ? 'selected' : ''}>${escapeHtml(tw('Scheduled'))}</option>
            <option value="In Progress" ${tr.status === 'In Progress' ? 'selected' : ''}>${escapeHtml(tw('In Progress'))}</option>
            <option value="Delayed" ${tr.status === 'Delayed' ? 'selected' : ''}>${escapeHtml(tw('Delayed'))}</option>
            <option value="Completed" ${tr.status === 'Completed' ? 'selected' : ''}>${escapeHtml(tw('Completed'))}</option>
          </select>
        </td>
        <td>
          <input type="number" class="form-input tr-field" data-idx="${idx}" data-field="progressPercent" min="0" max="100" value="${escapeHtml(String(tr.progressPercent != null ? tr.progressPercent : 0))}" style="width: 70px;" aria-label="${escapeHtml(tw('Activity progress percentage (0-100)'))}"> %
        </td>
        <td>
          <textarea dir="auto" class="form-textarea tr-field" data-idx="${idx}" data-field="fieldAdvisoryNote" style="min-height: 60px;" aria-label="${escapeHtml(tw('Field advisory and mentoring note'))}">${escapeHtml(tr.fieldAdvisoryNote || '')}</textarea>
        </td>
        <td>
          <input class="form-input tr-field" type="date" data-idx="${idx}" data-field="lastUpdated" value="${escapeHtml(tr.lastUpdated || '')}" aria-label="${escapeHtml(tw('Last updated date'))}">
        </td>
        <td><button class="btn btn-sm btn-danger remove-tr-btn" data-idx="${idx}" type="button" aria-label="${escapeHtml(tw('Remove activity {title}', { title: tr.activityTitle || (idx + 1) }, `Remove activity ${tr.activityTitle || (idx + 1)}`))}">×</button></td>
      </tr>
    `).join('');

    host.querySelectorAll('.tr-field').forEach(el => {
      el.addEventListener('input', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        if (f === 'progressPercent') {
          let num = parseInt(e.target.value, 10);
          if (isNaN(num)) num = 0;
          if (num < 0) num = 0;
          if (num > 100) num = 100;
          state.module4.activityTracker[i][f] = num;
        } else {
          state.module4.activityTracker[i][f] = e.target.value;
        }
        invalidateConfirmation();
        save();
      });
      if (el.dataset.field === 'progressPercent') {
        el.addEventListener('blur', e => {
          const i = +e.target.dataset.idx;
          e.target.value = state.module4.activityTracker[i].progressPercent;
        });
      }
    });

    host.querySelectorAll('.remove-tr-btn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.idx;
        if (state.module4.activityTracker.length > 1) {
          state.module4.activityTracker.splice(i, 1);
          invalidateConfirmation();
          save();
          renderActivityTracker();
        }
      };
    });
  }

  function addTrackerRow() {
    state.module4.activityTracker.push({
      id: 'track-' + Date.now(),
      activityId: 'custom-act',
      activityTitle: 'New Implementation Activity',
      outputRef: 'Output',
      status: 'In Progress',
      progressPercent: 20,
      fieldAdvisoryNote: '',
      lastUpdated: new Date().toISOString().slice(0, 10)
    });
    save();
    renderActivityTracker();
  }

  /* Inter-Module Data Pipeline: Import from Module 3 Logframe */
  function importFromModule3Logframe() {
    const m3 = state.module3;
    if (!m3 || !m3.logframe || !m3.logframe.activities || m3.logframe.activities.length === 0) {
      alert(tw('No activities found in Module 3 Logframe. Complete Module 3 first.'));
      return;
    }

    if (state.module4.activityTracker.length > 0) {
      const proceed = confirm(tw('Sync implementation tracker with Module 3 Logframe? Existing activities will be updated with latest Module 3 titles without overwriting your entered progress.'));
      if (!proceed) return;
    }

    let updated = 0;
    let added = 0;

    m3.logframe.activities.forEach((act, idx) => {
      if (!act.narrative) return;
      const existing = state.module4.activityTracker.find(t => 
        (t.activityId && act.id && t.activityId === act.id) ||
        (t.id && act.id && t.id === act.id) ||
        (t.activityTitle && t.activityTitle.trim().toLowerCase() === act.narrative.trim().toLowerCase())
      );

      if (existing) {
        existing.activityTitle = act.narrative;
        existing.activityId = act.id;
        if (act.outputId) existing.outputRef = act.outputId;
        updated++;
      } else {
        state.module4.activityTracker.push({
          id: 'track-' + Date.now() + '-' + idx,
          activityId: act.id,
          activityTitle: act.narrative,
          outputRef: act.outputId || 'Logframe Activity',
          status: 'In Progress',
          progressPercent: 0,
          fieldAdvisoryNote: `Imported from Module 3. Inputs: ${act.inputs || 'N/A'}`,
          lastUpdated: new Date().toISOString().slice(0, 10)
        });
        added++;
      }
    });

    save(tw('Synced with Module 3 Logframe'));
    renderActivityTracker();
    alert(tw('Module 3 Sync Complete: {updated} activities updated, {added} new activities added.', { updated, added }, `Module 3 Sync Complete: ${updated} activities updated, ${added} new activities added.`));
  }

  /* Scenario Reference Drawer & Glossary */
  function renderScenarioDrawerList(searchQuery) {
    const host = document.getElementById('scenarioDrawerList');
    if (!host) return;
    const q = (searchQuery || '').toLowerCase().trim();
    let paragraphs = scLoc().PARAGRAPHS;
    if (q) {
      paragraphs = paragraphs.filter(p =>
        p.id.toString() === q || p.text.toLowerCase().includes(q)
      );
    }
    host.innerHTML = paragraphs.map(p => `
      <div class="para-item">
        <span class="para-badge">${escapeHtml(tw('Paragraph {id}', { id: p.id }, `Paragraph ${p.id}`))}</span>
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
    let terms = glLoc().TERMS;
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

    document.getElementById('manualSaveBtn')?.addEventListener('click', () => save(tw('Saved locally')));

    // Confirmation checkbox listener
    const confirmBox = document.getElementById('confirmModule4') || document.getElementById('selfConfirmCheck');
    confirmBox?.addEventListener('change', e => {
      state.module4.confirmed = e.target.checked;
      save(e.target.checked ? tw('Phase {num} Confirmed', { num: 4 }, 'Phase 4 Confirmed') : tw('Confirmation withdrawn'));
      updateCompletionBadge();
    });

    document.getElementById('importFromM3Btn')?.addEventListener('click', importFromModule3Logframe);

    document.getElementById('addRoleBtn')?.addEventListener('click', () => {
      invalidateConfirmation();
      addRoleRow();
    });
    document.getElementById('addSetbackBtn')?.addEventListener('click', () => {
      invalidateConfirmation();
      addSetbackRow();
    });
    document.getElementById('addTrackerBtn')?.addEventListener('click', () => {
      invalidateConfirmation();
      addTrackerRow();
    });

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
      if (!state.module4?.confirmed) {
        const proceed = confirm(tw('Note: Phase 4 has not been self-confirmed yet.\n\nDo you want to export an unconfirmed draft PDF?'));
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
    save
  };
});
