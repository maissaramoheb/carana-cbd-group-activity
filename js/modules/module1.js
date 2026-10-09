/**
 * Module 1: Situational Analysis Controller
 * CARANA CBD Learning Lab
 * Fully implements the UNPOL CBD Job-Specific Training (JST) Lesson 1 methodology.
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
    root.Module1App = factory(root.CARANA_SCENARIO, root.CURRICULUM_GLOSSARY, root.LabStorage);
  }
})(typeof self !== 'undefined' ? self : this, function (Scenario, Glossary, Storage) {
  'use strict';

  let state = null;
  let activeStage = 'stage-team';
  let activeModalCellKey = null;

  const STAGES = [
    { id: 'stage-team', label: '1. Orientation & Team', short: 'Orientation' },
    { id: 'stage-conflict', label: '2. Conflict & Response Analysis', short: 'Conflict Analysis' },
    { id: 'stage-stakeholders', label: '3. Stakeholder Analysis', short: 'Stakeholders' },
    { id: 'stage-matrix', label: '4. 5×6 Areas–Dimensions Matrix', short: 'CBD Matrix' },
    { id: 'stage-swot', label: '5. SWOT & Points of Entry', short: 'SWOT Analysis' },
    { id: 'stage-baseline', label: '6. Baseline & Synthesis', short: 'Baseline & Review' }
  ];

  function init() {
    state = Storage.loadLabState();
    bindGlobalControls();
    renderStageTabs();
    populateFormFields();
    syncBaselineStakeholders();
    renderStakeholders();
    renderStakeholderQuadrants();
    renderMatrix();
    renderSwot();
    renderBaseline();
    renderScenarioDrawerList();
    renderGlossaryList();
    Storage.renderCurriculumTrack(1);
    updateSaveIndicator('Loaded local data');
    updateRoleView();
    setupAutosaveListener();
    setupLifecycleListeners();
  }

  const dirtyFields = new Set();
  const deletedStakeholderIds = new Set();
  const baselineStakeholders = new Map();

  function syncBaselineStakeholders() {
    baselineStakeholders.clear();
    if (state.module1 && Array.isArray(state.module1.stakeholders)) {
      state.module1.stakeholders.forEach(s => {
        if (s && s.id) baselineStakeholders.set(s.id, JSON.stringify(s));
      });
    }
  }

  function save(statusMsg) {
    collectFormFields();
    const latest = Storage.loadLabState();
    if (latest) {
      for (let i = 2; i <= 6; i++) {
        const modKey = 'module' + i;
        if (latest[modKey]) state[modKey] = latest[modKey];
      }
      if (latest.module1) {
        if (latest.module1.pestel) {
          for (const key of ['political', 'economic', 'social', 'technological', 'environmental', 'legal', 'security']) {
            const inputId = 'pestel' + key.charAt(0).toUpperCase() + key.slice(1);
            if (!dirtyFields.has(inputId) && latest.module1.pestel[key] !== undefined) {
              state.module1.pestel[key] = latest.module1.pestel[key];
              setValue(inputId, latest.module1.pestel[key]);
            }
          }
        }
        if (latest.module1.responseAnalysis) {
          const mapping = {
            responseActors: 'externalActors',
            responseSynergies: 'synergiesOpportunities',
            responseRisks: 'risksDuplication'
          };
          for (const [id, f] of Object.entries(mapping)) {
            if (!dirtyFields.has(id) && latest.module1.responseAnalysis[f] !== undefined) {
              state.module1.responseAnalysis[f] = latest.module1.responseAnalysis[f];
              setValue(id, latest.module1.responseAnalysis[f]);
            }
          }
        }
        if (latest.module1.perspectives) {
          const mapping = {
            perspectiveEnabling: 'enablingEnvironment',
            perspectiveOrganisational: 'organisationalLevel',
            perspectiveIndividual: 'individualLevel'
          };
          for (const [id, f] of Object.entries(mapping)) {
            if (!dirtyFields.has(id) && latest.module1.perspectives[f] !== undefined) {
              state.module1.perspectives[f] = latest.module1.perspectives[f];
              setValue(id, latest.module1.perspectives[f]);
            }
          }
        }
        if (!dirtyFields.has('stakeholdersConclusion') && latest.module1.stakeholdersConclusion !== undefined) {
          state.module1.stakeholdersConclusion = latest.module1.stakeholdersConclusion;
          setValue('stakeholdersConclusion', latest.module1.stakeholdersConclusion);
        }
        if (latest.module1.reflection) {
          const mapping = {
            reflectionExperience: 'q1Experience',
            reflectionCounterpart: 'q2CounterpartPerspective',
            reflectionPersonal: 'q3PersonalGrowth'
          };
          for (const [id, f] of Object.entries(mapping)) {
            if (!dirtyFields.has(id) && latest.module1.reflection[f] !== undefined) {
              state.module1.reflection[f] = latest.module1.reflection[f];
              setValue(id, latest.module1.reflection[f]);
            }
          }
        }
        // Record-level stakeholder reconciliation
        if (Array.isArray(latest.module1.stakeholders)) {
          const latestList = latest.module1.stakeholders;
          const localList = state.module1.stakeholders || [];
          const localById = new Map();
          localList.forEach(s => { if (s && s.id) localById.set(s.id, s); });

          const merged = [];
          const processedIds = new Set();
          const fields = ['name', 'role', 'influence', 'interest', 'needs', 'strategy'];

          for (const lsh of latestList) {
            if (!lsh || !lsh.id) continue;
            processedIds.add(lsh.id);

            if (deletedStakeholderIds.has(lsh.id)) {
              // Check if lsh was modified remotely compared to baseline snapshot
              const baseSnap = baselineStakeholders.get(lsh.id);
              const isModifiedRemotely = baseSnap && JSON.stringify(lsh) !== baseSnap;
              if (isModifiedRemotely) {
                console.warn(`[Concurrency] Stakeholder "${lsh.id}" was modified remotely while marked for deletion locally. Retaining to prevent data loss.`);
                deletedStakeholderIds.delete(lsh.id);
                merged.push({ ...lsh });
              } else {
                // Intentionally deleted locally without conflicting remote modification
                continue;
              }
            } else {
              const localSh = localById.get(lsh.id);
              if (!localSh) {
                // Stakeholder added remotely in another tab
                merged.push({ ...lsh });
              } else {
                // Stakeholder present locally and remotely: merge at field level
                const mergedRecord = { ...lsh };
                for (const f of fields) {
                  const fieldKey = `stake-${lsh.id}-${f}`;
                  if (dirtyFields.has(fieldKey)) {
                    mergedRecord[f] = localSh[f];
                  } else if (lsh[f] !== undefined) {
                    mergedRecord[f] = lsh[f];
                  }
                }
                merged.push(mergedRecord);
              }
            }
          }

          // Preserve new stakeholders added locally not yet in latest
          for (const localSh of localList) {
            if (localSh && localSh.id && !processedIds.has(localSh.id) && !deletedStakeholderIds.has(localSh.id)) {
              merged.push({ ...localSh });
            }
          }

          state.module1.stakeholders = merged;
        }

        // Record-level baseline indicators reconciliation
        if (Array.isArray(latest.module1.baseline)) {
          const latestBase = latest.module1.baseline;
          const localBase = state.module1.baseline || [];
          const baseFields = ['area', 'asIsEvidence', 'baselineMetric', 'tobeTarget', 'verificationSource'];
          for (const lb of latestBase) {
            if (!lb || !lb.id) continue;
            const localB = localBase.find(b => b.id === lb.id);
            if (!localB) continue;
            for (const f of baseFields) {
              const inputId = `base-${lb.id}-${f}`;
              if (!dirtyFields.has(inputId) && lb[f] !== undefined) {
                localB[f] = lb[f];
              }
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
      deletedStakeholderIds.clear();
      syncBaselineStakeholders();
      updateSaveIndicator(statusMsg || 'Saved locally');
    }
    Storage.renderCurriculumTrack(1);
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
      if (e.target && e.target.id) {
        dirtyFields.add(e.target.id);
      }
      if (e.target && e.target.id !== 'confirmModule1' && e.target.id !== 'selfConfirmCheck') {
        invalidateConfirmation();
      }
    });
    document.addEventListener('change', e => {
      if (e.target && e.target.id) {
        dirtyFields.add(e.target.id);
      }
    });
    document.addEventListener('input', debounce(() => {
      save('Autosaved');
      renderStakeholderQuadrants();
      updateSwotCountBadge();
    }, 600));
  }

  function invalidateConfirmation() {
    if (state.module1 && state.module1.confirmed) {
      state.module1.confirmed = false;
      const chk = document.getElementById('confirmModule1') || document.getElementById('selfConfirmCheck');
      if (chk) chk.checked = false;
      updateCompletionBadge();
    }
  }

  function updateCompletionBadge() {
    const badge = document.getElementById('stageCompleteFooterBadge');
    if (!badge) return;
    if (state.module1 && state.module1.confirmed) {
      badge.textContent = '✓ Phase 1 Self-Confirmed · Ready for Module 2';
      badge.style.color = 'var(--ok)';
    } else {
      badge.textContent = 'Phase 1 In Progress · Pending Self-Confirmation';
      badge.style.color = 'var(--navy)';
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
        for (let i = 2; i <= 6; i++) {
          const modKey = 'module' + i;
          if (incoming[modKey]) {
            state[modKey] = incoming[modKey];
          }
        }
        if (incoming.session) {
          const sessionFields = ['teamName', 'participants', 'noteTaker', 'sessionDate'];
          for (const fId of sessionFields) {
            const activeId = document.activeElement ? document.activeElement.id : '';
            if (activeId !== fId && !dirtyFields.has(fId)) {
              const val = fId === 'sessionDate' ? incoming.session.date : incoming.session[fId];
              if (val !== undefined) {
                setValue(fId, val);
                if (fId === 'sessionDate') state.session.date = val;
                else state.session[fId] = val;
              }
            }
          }
        }
        if (incoming.module1) {
          const activeId = document.activeElement ? document.activeElement.id : '';
          if (incoming.module1.pestel) {
            for (const key of ['political', 'economic', 'social', 'technological', 'environmental', 'legal', 'security']) {
              const inputId = 'pestel' + key.charAt(0).toUpperCase() + key.slice(1);
              if (activeId !== inputId && !dirtyFields.has(inputId) && incoming.module1.pestel[key] !== undefined) {
                state.module1.pestel[key] = incoming.module1.pestel[key];
                setValue(inputId, incoming.module1.pestel[key]);
              }
            }
          }
          if (incoming.module1.responseAnalysis) {
            const mapping = {
              responseActors: 'externalActors',
              responseSynergies: 'synergiesOpportunities',
              responseRisks: 'risksDuplication'
            };
            for (const [id, f] of Object.entries(mapping)) {
              if (activeId !== id && !dirtyFields.has(id) && incoming.module1.responseAnalysis[f] !== undefined) {
                state.module1.responseAnalysis[f] = incoming.module1.responseAnalysis[f];
                setValue(id, incoming.module1.responseAnalysis[f]);
              }
            }
          }
          if (incoming.module1.perspectives) {
            const mapping = {
              perspectiveEnabling: 'enablingEnvironment',
              perspectiveOrganisational: 'organisationalLevel',
              perspectiveIndividual: 'individualLevel'
            };
            for (const [id, f] of Object.entries(mapping)) {
              if (activeId !== id && !dirtyFields.has(id) && incoming.module1.perspectives[f] !== undefined) {
                state.module1.perspectives[f] = incoming.module1.perspectives[f];
                setValue(id, incoming.module1.perspectives[f]);
              }
            }
          }
          if (activeId !== 'stakeholdersConclusion' && !dirtyFields.has('stakeholdersConclusion') && incoming.module1.stakeholdersConclusion !== undefined) {
            state.module1.stakeholdersConclusion = incoming.module1.stakeholdersConclusion;
            setValue('stakeholdersConclusion', incoming.module1.stakeholdersConclusion);
          }
          if (incoming.module1.reflection) {
            const mapping = {
              reflectionExperience: 'q1Experience',
              reflectionCounterpart: 'q2CounterpartPerspective',
              reflectionPersonal: 'q3PersonalGrowth'
            };
            for (const [id, f] of Object.entries(mapping)) {
              if (activeId !== id && !dirtyFields.has(id) && incoming.module1.reflection[f] !== undefined) {
                state.module1.reflection[f] = incoming.module1.reflection[f];
                setValue(id, incoming.module1.reflection[f]);
              }
            }
          }
          // Real-time record-level stakeholder synchronization
          if (Array.isArray(incoming.module1.stakeholders)) {
            const incomingList = incoming.module1.stakeholders;
            const localList = state.module1.stakeholders || [];
            const fields = ['name', 'role', 'influence', 'interest', 'needs', 'strategy'];

            let structureChanged = incomingList.length !== localList.length;
            if (!structureChanged) {
              for (let i = 0; i < incomingList.length; i++) {
                if (incomingList[i]?.id !== localList[i]?.id) {
                  structureChanged = true;
                  break;
                }
              }
            }

            const isTypingInStakeholders = document.activeElement && document.activeElement.classList.contains('stake-field');
            if (structureChanged && !isTypingInStakeholders && deletedStakeholderIds.size === 0) {
              state.module1.stakeholders = JSON.parse(JSON.stringify(incomingList));
              syncBaselineStakeholders();
              renderStakeholders();
              renderStakeholderQuadrants();
            } else {
              for (const incSh of incomingList) {
                if (!incSh || !incSh.id) continue;
                const localSh = localList.find(s => s.id === incSh.id);
                if (!localSh) continue;

                for (const f of fields) {
                  const inputId = `stake-${incSh.id}-${f}`;
                  if (activeId !== inputId && !dirtyFields.has(inputId)) {
                    localSh[f] = incSh[f];
                    const inputEl = document.getElementById(inputId);
                    if (inputEl && inputEl.value !== incSh[f]) {
                      inputEl.value = incSh[f] || '';
                    }
                    if (f === 'name') {
                      const h = document.getElementById(`stakeHeader-${incSh.id}`);
                      if (h) {
                        const idx = localList.indexOf(localSh);
                        h.textContent = `Actor #${idx + 1}: ${incSh.name || 'Unnamed Stakeholder'}`;
                      }
                    }
                  }
                }
              }
              renderStakeholderQuadrants();
            }
          }

          // Real-time baseline indicators synchronization
          if (Array.isArray(incoming.module1.baseline)) {
            const incBase = incoming.module1.baseline;
            const localBase = state.module1.baseline || [];
            const baseFields = ['area', 'asIsEvidence', 'baselineMetric', 'tobeTarget', 'verificationSource'];
            for (const ib of incBase) {
              if (!ib || !ib.id) continue;
              const localB = localBase.find(b => b.id === ib.id);
              if (!localB) continue;
              for (const f of baseFields) {
                const inputId = `base-${ib.id}-${f}`;
                if (activeId !== inputId && !dirtyFields.has(inputId) && ib[f] !== undefined) {
                  localB[f] = ib[f];
                  const inp = document.getElementById(inputId);
                  if (inp && inp.value !== ib[f]) inp.value = ib[f];
                }
              }
            }
          }
        }
        Storage.renderCurriculumTrack(1);
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

  /* Navigation & Stages */
  function setStage(stageId) {
    activeStage = stageId;
    document.querySelectorAll('.stage-panel').forEach(p => {
      p.classList.toggle('active', p.id === stageId);
    });
    document.querySelectorAll('.stage-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.stage === stageId);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (stageId === 'stage-stakeholders') renderStakeholderQuadrants();
    if (stageId === 'stage-matrix') renderMatrix();
    if (stageId === 'stage-swot') renderSwot();
    if (stageId === 'stage-baseline') renderBaseline();
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
    // Session / Team
    setValue('teamName', state.session.teamName);
    setValue('participants', state.session.participants);
    setValue('noteTaker', state.session.noteTaker);
    setValue('sessionDate', state.session.date);

    // Conflict analysis (PESTEL-S)
    const p = state.module1.pestel || {};
    setValue('pestelPolitical', p.political);
    setValue('pestelEconomic', p.economic);
    setValue('pestelSocial', p.social);
    setValue('pestelTechnological', p.technological);
    setValue('pestelEnvironmental', p.environmental);
    setValue('pestelLegal', p.legal);
    setValue('pestelSecurity', p.security);

    // Response Analysis
    const r = state.module1.responseAnalysis || {};
    setValue('responseActors', r.externalActors);
    setValue('responseSynergies', r.synergiesOpportunities);
    setValue('responseRisks', r.risksDuplication);

    // Three Perspectives
    const pers = state.module1.perspectives || {};
    setValue('perspectiveEnabling', pers.enablingEnvironment);
    setValue('perspectiveOrganisational', pers.organisationalLevel);
    setValue('perspectiveIndividual', pers.individualLevel);

    // Stakeholder conclusion
    setValue('stakeholdersConclusion', state.module1.stakeholdersConclusion);

    // Reflection & Summary
    const ref = state.module1.reflection || {};
    setValue('reflectionExperience', ref.q1Experience);
    setValue('reflectionCounterpart', ref.q2CounterpartPerspective);
    setValue('reflectionPersonal', ref.q3PersonalGrowth);

    const sum = state.module1.summary || {};
    setValue('summaryProblem', sum.mainProblem);
    setValue('summaryEvidence', sum.evidenceText);
    setValue('summaryIntervention', sum.primaryIntervention);
    setValue('summarySafeguards', sum.safeguards);

    const confirmBox = document.getElementById('confirmModule1');
    if (confirmBox) confirmBox.checked = !!state.module1.confirmed;
  }

  function collectFormFields() {
    state.session.teamName = getValue('teamName');
    state.session.participants = getValue('participants');
    state.session.noteTaker = getValue('noteTaker');
    state.session.date = getValue('sessionDate');

    state.module1.pestel = {
      political: getValue('pestelPolitical'),
      economic: getValue('pestelEconomic'),
      social: getValue('pestelSocial'),
      technological: getValue('pestelTechnological'),
      environmental: getValue('pestelEnvironmental'),
      legal: getValue('pestelLegal'),
      security: getValue('pestelSecurity')
    };

    state.module1.responseAnalysis = {
      externalActors: getValue('responseActors'),
      synergiesOpportunities: getValue('responseSynergies'),
      risksDuplication: getValue('responseRisks')
    };

    state.module1.perspectives = {
      enablingEnvironment: getValue('perspectiveEnabling'),
      organisationalLevel: getValue('perspectiveOrganisational'),
      individualLevel: getValue('perspectiveIndividual')
    };

    state.module1.stakeholdersConclusion = getValue('stakeholdersConclusion');

    state.module1.reflection = {
      q1Experience: getValue('reflectionExperience'),
      q2CounterpartPerspective: getValue('reflectionCounterpart'),
      q3PersonalGrowth: getValue('reflectionPersonal')
    };

    state.module1.summary = {
      mainProblem: getValue('summaryProblem'),
      evidenceText: getValue('summaryEvidence'),
      primaryIntervention: getValue('summaryIntervention'),
      safeguards: getValue('summarySafeguards')
    };

    const confirmBox = document.getElementById('confirmModule1');
    if (confirmBox) state.module1.confirmed = confirmBox.checked;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  /* Stakeholder Analysis */
  function renderStakeholders() {
    const container = document.getElementById('stakeholderList');
    if (!container) return;

    // Ensure every stakeholder has a valid stable ID
    state.module1.stakeholders.forEach((s, idx) => {
      if (s && !s.id) s.id = 'sh-' + (idx + 1);
    });

    container.innerHTML = state.module1.stakeholders.map((s, idx) => `
      <div class="card" style="margin-bottom: 12px; background: #ffffff;" data-idx="${idx}" data-stakeholder-id="${s.id}">
        <div style="padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; background: var(--wash); border-bottom: 1px solid var(--line);">
          <strong id="stakeHeader-${s.id}">Actor #${idx + 1}: ${escapeHtml(s.name || 'Unnamed Stakeholder')}</strong>
          <button class="btn btn-sm btn-danger remove-stakeholder-btn" data-id="${s.id}" data-remove="${idx}" type="button" aria-label="Remove stakeholder ${escapeHtml(s.name || (idx + 1))}">Remove</button>
        </div>
        <div style="padding: 14px 16px;" class="grid-3">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="stake-${s.id}-name">Stakeholder Name / Entity</label>
            <input id="stake-${s.id}-name" class="form-input stake-field" data-id="${s.id}" data-idx="${idx}" data-field="name" value="${escapeHtml(s.name)}" placeholder="e.g. Public Prosecutors" aria-label="Stakeholder name">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="stake-${s.id}-role">Role in CBD</label>
            <select id="stake-${s.id}-role" class="form-select stake-field" data-id="${s.id}" data-idx="${idx}" data-field="role" aria-label="Stakeholder role in CBD">
              ${['Owner', 'Enabler', 'Affected group', 'Influencer', 'Potential blocker'].map(r => `
                <option value="${r}" ${r === s.role ? 'selected' : ''}>${r}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Influence vs Interest</label>
            <div style="display: flex; gap: 6px;">
              <select id="stake-${s.id}-influence" class="form-select stake-field" data-id="${s.id}" data-idx="${idx}" data-field="influence" title="Influence" aria-label="Stakeholder influence level">
                <option value="High" ${s.influence === 'High' ? 'selected' : ''}>Inf: High</option>
                <option value="Medium" ${s.influence === 'Medium' ? 'selected' : ''}>Inf: Med</option>
                <option value="Low" ${s.influence === 'Low' ? 'selected' : ''}>Inf: Low</option>
              </select>
              <select id="stake-${s.id}-interest" class="form-select stake-field" data-id="${s.id}" data-idx="${idx}" data-field="interest" title="Interest" aria-label="Stakeholder interest level">
                <option value="High" ${s.interest === 'High' ? 'selected' : ''}>Int: High</option>
                <option value="Medium" ${s.interest === 'Medium' ? 'selected' : ''}>Int: Med</option>
                <option value="Low" ${s.interest === 'Low' ? 'selected' : ''}>Int: Low</option>
              </select>
            </div>
          </div>
          <div class="form-group col-full" style="margin-bottom: 0;">
            <label class="form-label" for="stake-${s.id}-needs">Motivations, Needs & Perceived Obstacles</label>
            <input id="stake-${s.id}-needs" class="form-input stake-field" data-id="${s.id}" data-idx="${idx}" data-field="needs" value="${escapeHtml(s.needs || '')}" placeholder="What drives or concerns this stakeholder?" aria-label="Stakeholder motivations and needs">
          </div>
          <div class="form-group col-full" style="margin-bottom: 0;">
            <label class="form-label" for="stake-${s.id}-strategy">Engagement & Communication Strategy</label>
            <input id="stake-${s.id}-strategy" class="form-input stake-field" data-id="${s.id}" data-idx="${idx}" data-field="strategy" value="${escapeHtml(s.strategy || '')}" placeholder="How will UNPOL CBD advisers engage them?" aria-label="Stakeholder engagement and communication strategy">
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.stake-field').forEach(el => {
      el.addEventListener('input', e => {
        const shId = e.target.dataset.id;
        const f = e.target.dataset.field;
        const fieldKey = `stake-${shId}-${f}`;
        dirtyFields.add(fieldKey);
        if (e.target.id) dirtyFields.add(e.target.id);
        const targetSh = state.module1.stakeholders.find(s => s.id === shId);
        if (targetSh) {
          targetSh[f] = e.target.value;
        }
        if (f === 'name') {
          const h = document.getElementById(`stakeHeader-${shId}`);
          if (h) {
            h.textContent = `Actor #${+e.target.dataset.idx + 1}: ${e.target.value || 'Unnamed Stakeholder'}`;
          }
        }
        invalidateConfirmation();
        renderStakeholderQuadrants();
      });
      el.addEventListener('change', e => {
        const shId = e.target.dataset.id;
        const f = e.target.dataset.field;
        dirtyFields.add(`stake-${shId}-${f}`);
        if (e.target.id) dirtyFields.add(e.target.id);
        save();
      });
    });

    container.querySelectorAll('.remove-stakeholder-btn').forEach(b => {
      b.onclick = () => {
        const shId = b.dataset.id;
        if (state.module1.stakeholders.length > 1) {
          deletedStakeholderIds.add(shId);
          dirtyFields.add(`stake-deleted-${shId}`);
          const idx = state.module1.stakeholders.findIndex(s => s.id === shId);
          if (idx !== -1) {
            state.module1.stakeholders.splice(idx, 1);
          }
          invalidateConfirmation();
          save();
          renderStakeholders();
          renderStakeholderQuadrants();
        }
      };
    });
  }

  function renderStakeholderQuadrants() {
    const qRed = document.getElementById('quadRed');
    const qBlue = document.getElementById('quadBlue');
    const qOrange = document.getElementById('quadOrange');
    const qGreen = document.getElementById('quadGreen');
    if (!qRed || !qBlue || !qOrange || !qGreen) return;

    qRed.innerHTML = '';
    qBlue.innerHTML = '';
    qOrange.innerHTML = '';
    qGreen.innerHTML = '';

    state.module1.stakeholders.forEach(s => {
      if (!s.name) return;
      const cardHtml = `
        <div class="stakeholder-badge">
          <span>${escapeHtml(s.name)}</span>
          <span style="font-size: 0.72rem; color: var(--muted);">${escapeHtml(s.role)}</span>
        </div>
      `;

      const infHigh = s.influence === 'High';
      const intHigh = s.interest === 'High';

      if (infHigh && intHigh) {
        qRed.insertAdjacentHTML('beforeend', cardHtml);
      } else if (infHigh && !intHigh) {
        qBlue.insertAdjacentHTML('beforeend', cardHtml);
      } else if (!infHigh && intHigh) {
        qOrange.insertAdjacentHTML('beforeend', cardHtml);
      } else {
        qGreen.insertAdjacentHTML('beforeend', cardHtml);
      }
    });

    [qRed, qBlue, qOrange, qGreen].forEach(q => {
      if (!q.children.length) {
        q.innerHTML = '<span style="color: var(--muted); font-size: 0.8rem; font-style: italic;">No stakeholders in this quadrant yet.</span>';
      }
    });
  }

  /* 5x6 Areas-Dimensions Matrix */
  function renderMatrix() {
    const tableHost = document.getElementById('matrixTableHost');
    if (!tableHost) return;

    const isFacilitator = state.session.role === 'facilitator';
    const showExpectedOverlay = isFacilitator || !!state.module1.showExpectedGuide;

    let html = `
      <table class="matrix-table">
        <thead>
          <tr>
            <th>UNPOL CBD Areas ↓ / Cross-Cutting Dimensions →</th>
            ${Scenario.DIMENSIONS.map(d => `<th>${escapeHtml(d.name)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    Scenario.AREAS.forEach(area => {
      html += `
        <tr>
          <td colspan="${Scenario.DIMENSIONS.length + 1}" class="area-group-th">
            ${escapeHtml(area.name)}
          </td>
        </tr>
      `;

      area.subcategories.forEach(sub => {
        html += `<tr>`;
        html += `<td class="subarea-td">${escapeHtml(sub.name)}</td>`;

        Scenario.DIMENSIONS.forEach(dim => {
          const cellKey = `${sub.id}|${dim.id}`;
          const cellData = state.module1.matrixCells[cellKey] || { paragraphs: [], notes: '' };
          const count = (cellData.paragraphs || []).length;

          html += `
            <td class="matrix-cell ${count > 0 ? 'has-content' : ''}" 
                data-cellkey="${cellKey}" tabindex="0" role="button" aria-label="${sub.name} in ${dim.name}">
              <div style="font-size: 0.75rem; color: var(--muted); margin-bottom: 4px;">
                ${count > 0 ? `<span class="cell-badge">${count} issue${count > 1 ? 's' : ''}</span>` : '<span style="opacity:0.4;">—</span>'}
              </div>
              <div style="max-height: 48px; overflow: hidden; text-overflow: ellipsis; font-size: 0.72rem; color: var(--ink);">
                ${cellData.notes ? escapeHtml(cellData.notes.slice(0, 40)) + '...' : ''}
              </div>
            </td>
          `;
        });

        html += `</tr>`;
      });
    });

    html += `</tbody></table>`;

    const nonEmptyCells = [];
    Scenario.AREAS.forEach(area => {
      area.subcategories.forEach(sub => {
        Scenario.DIMENSIONS.forEach(dim => {
          const cellKey = `${sub.id}|${dim.id}`;
          const cellData = state.module1.matrixCells[cellKey];
          if (cellData && ((cellData.paragraphs && cellData.paragraphs.length > 0) || (cellData.notes && cellData.notes.trim().length > 0))) {
            nonEmptyCells.push({
              areaName: area.name,
              subName: sub.name,
              dimName: dim.name,
              paragraphs: cellData.paragraphs || [],
              notes: cellData.notes || ''
            });
          }
        });
      });
    });

    html += `
      <div class="printable-matrix-summary print-only-section" style="margin-top: 28px;">
        <h4 style="font-size: 1.05rem; color: var(--navy); margin-bottom: 12px; border-bottom: 2px solid var(--un-blue); padding-bottom: 6px;">
          Structured Diagnostic Matrix Findings & Evidence Register
        </h4>
        ${nonEmptyCells.length === 0 ? '<p style="font-size: 0.88rem; color: var(--muted); font-style: italic;">No specific matrix findings or paragraph references recorded yet.</p>' : `
          <table class="table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
            <thead>
              <tr style="background: var(--wash); text-align: left;">
                <th style="padding: 8px; border: 1px solid var(--line); width: 25%;">Area & Sub-Category</th>
                <th style="padding: 8px; border: 1px solid var(--line); width: 20%;">Dimension</th>
                <th style="padding: 8px; border: 1px solid var(--line); width: 15%;">Scenario Ref</th>
                <th style="padding: 8px; border: 1px solid var(--line); width: 40%;">Diagnostic Finding & Notes</th>
              </tr>
            </thead>
            <tbody>
              ${nonEmptyCells.map(c => `
                <tr>
                  <td style="padding: 8px; border: 1px solid var(--line); vertical-align: top;">
                    <strong>${escapeHtml(c.areaName)}</strong><br>
                    <span style="color: var(--muted);">${escapeHtml(c.subName)}</span>
                  </td>
                  <td style="padding: 8px; border: 1px solid var(--line); vertical-align: top;">
                    ${escapeHtml(c.dimName)}
                  </td>
                  <td style="padding: 8px; border: 1px solid var(--line); vertical-align: top;">
                    ${c.paragraphs.length > 0 ? c.paragraphs.map(p => `<span class="badge" style="display:inline-block; margin:2px 2px 2px 0;">Para ${p}</span>`).join('') : '—'}
                  </td>
                  <td style="padding: 8px; border: 1px solid var(--line); vertical-align: top; white-space: pre-wrap; word-break: break-word;">
                    ${escapeHtml(c.notes || '—')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;

    tableHost.innerHTML = html;

    tableHost.querySelectorAll('.matrix-cell').forEach(td => {
      td.onclick = () => openCellModal(td.dataset.cellkey);
      td.onkeydown = e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCellModal(td.dataset.cellkey);
        }
      };
    });
  }

  let modalOpenerEl = null;

  function openCellModal(cellKey) {
    modalOpenerEl = document.activeElement;
    activeModalCellKey = cellKey;
    const [subId, dimId] = cellKey.split('|');
    let subName = subId;
    let areaName = '';

    for (const a of Scenario.AREAS) {
      const match = a.subcategories.find(s => s.id === subId);
      if (match) {
        subName = match.name;
        areaName = a.name;
        break;
      }
    }

    const dim = Scenario.DIMENSIONS.find(d => d.id === dimId);
    const dimName = dim ? dim.name : dimId;

    document.getElementById('modalCellTitle').textContent = `${subName} × ${dimName}`;
    document.getElementById('modalCellAreaSub').textContent = `${areaName} → ${subName}`;

    const cellData = state.module1.matrixCells[cellKey] || { paragraphs: [], notes: '' };
    setValue('modalCellNotes', cellData.notes || '');

    // Paragraph pills selector
    const paraHost = document.getElementById('modalCellParaPills');
    const selectedParas = new Set((cellData.paragraphs || []).filter(p => Number.isInteger(p) && p > 0));

    paraHost.innerHTML = Scenario.PARAGRAPHS.map(p => {
      const isSel = selectedParas.has(p.id);
      return `
        <button type="button" class="btn btn-sm ${isSel ? 'btn-primary' : 'btn-ghost'}" 
                style="margin: 2px; border: 1px solid var(--line);" data-para-id="${p.id}">
          Para ${p.id}
        </button>
      `;
    }).join('');

    paraHost.querySelectorAll('[data-para-id]').forEach(b => {
      b.onclick = () => {
        const pId = parseInt(b.getAttribute('data-para-id') || b.dataset.paraId, 10);
        if (!Number.isInteger(pId)) return;
        if (selectedParas.has(pId)) {
          selectedParas.delete(pId);
          b.className = 'btn btn-sm btn-ghost';
        } else {
          selectedParas.add(pId);
          b.className = 'btn btn-sm btn-primary';
        }
      };
    });

    // Focus note input
    const backdrop = document.getElementById('cellModalBackdrop');
    if (backdrop) {
      backdrop.classList.add('open');
      backdrop.setAttribute('aria-hidden', 'false');
      const focusable = backdrop.querySelectorAll('textarea, input, button, [tabindex]:not([tabindex="-1"])');
      if (focusable.length > 0) focusable[0].focus();
    }
  }

  function saveCellModal() {
    if (!activeModalCellKey) return;
    const selectedParas = [];
    document.getElementById('modalCellParaPills').querySelectorAll('.btn-primary').forEach(b => {
      const pId = parseInt(b.getAttribute('data-para-id') || b.dataset.paraId, 10);
      if (Number.isInteger(pId) && pId > 0 && !selectedParas.includes(pId)) {
        selectedParas.push(pId);
      }
    });
    selectedParas.sort((a, b) => a - b);

    state.module1.matrixCells[activeModalCellKey] = {
      paragraphs: selectedParas,
      notes: getValue('modalCellNotes')
    };

    invalidateConfirmation();
    save('Updated matrix cell');
    closeCellModal();
    renderMatrix();
  }

  function closeCellModal() {
    const backdrop = document.getElementById('cellModalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
    activeModalCellKey = null;
    if (modalOpenerEl && typeof modalOpenerEl.focus === 'function') {
      modalOpenerEl.focus();
      modalOpenerEl = null;
    }
  }

  /* SWOT Analysis */
  function renderSwot() {
    renderSwotQuadrant('swotStrengthsHost', state.module1.swot.strengths, 'strengths');
    renderSwotQuadrant('swotWeaknessesHost', state.module1.swot.weaknesses, 'weaknesses');
    renderSwotQuadrant('swotOpportunitiesHost', state.module1.swot.opportunities, 'opportunities');
    renderSwotQuadrant('swotThreatsHost', state.module1.swot.threats, 'threats');
    updateSwotCountBadge();
  }

  function renderSwotQuadrant(elementId, items, categoryKey) {
    const host = document.getElementById(elementId);
    if (!host) return;

    if (!items || items.length === 0) {
      host.innerHTML = `<span style="color: var(--muted); font-size: 0.82rem; font-style: italic;">No items added yet.</span>`;
      return;
    }

    host.innerHTML = items.map((item, idx) => `
      <div class="swot-item-pill">
        <div>
          <span>${escapeHtml(item.text)}</span>
          ${item.isEntryPoint ? '<span class="cell-badge" style="background:#0c6a99; margin-left:6px;">CBD Entry Point</span>' : ''}
          ${item.isRisk ? '<span class="cell-badge" style="background:#a62727; margin-left:6px;">CBD Risk</span>' : ''}
        </div>
        <button class="remove-btn" type="button" data-cat="${categoryKey}" data-idx="${idx}" title="Remove item" aria-label="Remove SWOT item: ${escapeHtml(item.text)}">×</button>
      </div>
    `).join('');

    host.querySelectorAll('.remove-btn').forEach(b => {
      b.onclick = () => {
        const cat = b.dataset.cat;
        const i = +b.dataset.idx;
        state.module1.swot[cat].splice(i, 1);
        save();
        renderSwot();
      };
    });
  }

  function addSwotItem() {
    const text = getValue('newSwotText').trim();
    const cat = getValue('newSwotCategory');
    const isEntryPoint = document.getElementById('newSwotIsEntryPoint')?.checked || false;
    const isRisk = document.getElementById('newSwotIsRisk')?.checked || false;

    if (!text) {
      alert('Please enter an issue or finding description.');
      return;
    }

    if (!state.module1.swot[cat]) state.module1.swot[cat] = [];
    state.module1.swot[cat].push({ text, isEntryPoint, isRisk });

    setValue('newSwotText', '');
    if (document.getElementById('newSwotIsEntryPoint')) document.getElementById('newSwotIsEntryPoint').checked = false;
    if (document.getElementById('newSwotIsRisk')) document.getElementById('newSwotIsRisk').checked = false;

    save('Added SWOT item');
    renderSwot();
  }

  function updateSwotCountBadge() {
    const s = state.module1.swot;
    const total = (s.strengths?.length || 0) + (s.weaknesses?.length || 0) + (s.opportunities?.length || 0) + (s.threats?.length || 0);
    const badge = document.getElementById('swotCountBadge');
    if (badge) {
      badge.textContent = `${total} items (Recommended: 15–20)`;
      badge.style.background = total >= 15 ? 'var(--ok)' : 'var(--warn)';
      badge.style.color = '#ffffff';
    }
  }

  /* Baseline Development */
  function renderBaseline() {
    const host = document.getElementById('baselineTableBody');
    if (!host) return;

    host.innerHTML = state.module1.baseline.map((b, idx) => `
      <tr data-idx="${idx}">
        <td><input class="form-input base-field" data-idx="${idx}" data-field="area" value="${escapeHtml(b.area || '')}" placeholder="Domain / Area" aria-label="Baseline domain or area for row ${idx + 1}"></td>
        <td><textarea class="form-textarea base-field" data-idx="${idx}" data-field="asIsEvidence" style="min-height: 80px;" aria-label="Current baseline AS-IS evidence for row ${idx + 1}">${escapeHtml(b.asIsEvidence || '')}</textarea></td>
        <td><textarea class="form-textarea base-field" data-idx="${idx}" data-field="baselineMetric" style="min-height: 80px;" aria-label="Baseline metric for row ${idx + 1}">${escapeHtml(b.baselineMetric || '')}</textarea></td>
        <td><textarea class="form-textarea base-field" data-idx="${idx}" data-field="tobeTarget" style="min-height: 80px;" aria-label="Target TO-BE state for row ${idx + 1}">${escapeHtml(b.tobeTarget || '')}</textarea></td>
        <td><input class="form-input base-field" data-idx="${idx}" data-field="verificationSource" value="${escapeHtml(b.verificationSource || '')}" aria-label="Means of verification for row ${idx + 1}"></td>
        <td><button class="btn btn-sm btn-danger remove-base-btn" data-idx="${idx}" type="button" aria-label="Remove baseline row ${idx + 1}">×</button></td>
      </tr>
    `).join('');

    host.querySelectorAll('.base-field').forEach(el => {
      el.addEventListener('input', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        state.module1.baseline[i][f] = e.target.value;
        save();
      });
    });

    host.querySelectorAll('.remove-base-btn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.idx;
        if (state.module1.baseline.length > 1) {
          state.module1.baseline.splice(i, 1);
          save();
          renderBaseline();
        }
      };
    });
  }

  function addBaselineRow() {
    state.module1.baseline.push({
      id: 'base-' + (state.module1.baseline.length + 1),
      area: '',
      asIsEvidence: '',
      baselineMetric: '',
      tobeTarget: '',
      verificationSource: ''
    });
    save();
    renderBaseline();
  }

  /* Scenario Reference Drawer */
  function renderScenarioDrawerList(searchQuery) {
    const host = document.getElementById('scenarioDrawerList');
    if (!host) return;

    const q = (searchQuery || '').toLowerCase().trim();
    let paragraphs = Scenario.PARAGRAPHS;

    if (q) {
      paragraphs = paragraphs.filter(p =>
        p.id.toString() === q ||
        p.text.toLowerCase().includes(q)
      );
    }

    host.innerHTML = paragraphs.map(p => `
      <div class="para-item" id="drawer-para-${p.id}">
        <span class="para-badge">Paragraph ${p.id}</span>
        <p style="margin: 4px 0 0;">${escapeHtml(p.text)}</p>
      </div>
    `).join('');
  }

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

  /* Glossary Modal */
  function renderGlossaryList(searchQuery) {
    const host = document.getElementById('glossaryList');
    if (!host) return;

    const q = (searchQuery || '').toLowerCase().trim();
    let terms = Glossary.TERMS;

    if (q) {
      terms = terms.filter(t =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
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

  /* Role Switcher (Participant vs Facilitator) */
  function setRole(newRole) {
    state.session.role = newRole;
    save();
    updateRoleView();
    renderMatrix();
  }

  function updateRoleView() {
    const isFacilitator = state.session.role === 'facilitator';
    document.querySelectorAll('.facilitator-only').forEach(el => {
      el.style.display = isFacilitator ? 'block' : 'none';
    });
    const roleSelect = document.getElementById('roleSelector');
    if (roleSelect) roleSelect.value = state.session.role;
  }

  /* Global Event Bindings */
  function bindGlobalControls() {
    // Stage jump buttons
    document.querySelectorAll('[data-goto-stage]').forEach(b => {
      b.onclick = () => setStage(b.dataset.gotoStage);
    });

    // Save button
    document.getElementById('manualSaveBtn')?.addEventListener('click', () => save('Saved locally'));

    // Confirmation checkbox listener
    const confirmBox = document.getElementById('confirmModule1') || document.getElementById('selfConfirmCheck');
    confirmBox?.addEventListener('change', e => {
      state.module1.confirmed = e.target.checked;
      save(e.target.checked ? 'Phase 1 Confirmed' : 'Confirmation withdrawn');
      updateCompletionBadge();
    });

    // Role selector
    document.getElementById('roleSelector')?.addEventListener('change', e => {
      setRole(e.target.value);
    });

    // Scenario drawer controls
    document.getElementById('openScenarioDrawerBtn')?.addEventListener('click', () => toggleScenarioDrawer(true));
    document.getElementById('closeScenarioDrawerBtn')?.addEventListener('click', () => toggleScenarioDrawer(false));
    document.getElementById('scenarioDrawerBackdrop')?.addEventListener('click', () => toggleScenarioDrawer(false));
    document.getElementById('scenarioSearchInput')?.addEventListener('input', e => {
      renderScenarioDrawerList(e.target.value);
    });

    // Glossary controls
    document.getElementById('openGlossaryBtn')?.addEventListener('click', () => toggleGlossaryModal(true));
    document.getElementById('closeGlossaryBtn')?.addEventListener('click', () => toggleGlossaryModal(false));
    document.getElementById('glossaryModalBackdrop')?.addEventListener('click', e => {
      if (e.target.id === 'glossaryModalBackdrop') toggleGlossaryModal(false);
    });
    document.getElementById('glossarySearchInput')?.addEventListener('input', e => {
      renderGlossaryList(e.target.value);
    });

    // Cell modal controls
    document.getElementById('closeCellModalBtn')?.addEventListener('click', closeCellModal);
    document.getElementById('saveCellModalBtn')?.addEventListener('click', saveCellModal);

    // Modal focus containment and Escape listener
    document.addEventListener('keydown', e => {
      const cellOpen = document.getElementById('cellModalBackdrop')?.classList.contains('open');
      const glossaryOpen = document.getElementById('glossaryModalBackdrop')?.classList.contains('open');
      const drawerOpen = document.getElementById('scenarioDrawer')?.classList.contains('open');

      if (e.key === 'Escape') {
        if (cellOpen) closeCellModal();
        if (glossaryOpen) toggleGlossaryModal(false);
        if (drawerOpen) toggleScenarioDrawer(false);
        return;
      }

      if (e.key === 'Tab' && (cellOpen || glossaryOpen || drawerOpen)) {
        let activeContainer = null;
        if (cellOpen) activeContainer = document.getElementById('cellModalBackdrop');
        else if (glossaryOpen) activeContainer = document.getElementById('glossaryModalBackdrop');
        else if (drawerOpen) activeContainer = document.getElementById('scenarioDrawer');

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

    // Stakeholder buttons
    document.getElementById('addStakeholderBtn')?.addEventListener('click', () => {
      invalidateConfirmation();
      const newId = 'sh-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      state.module1.stakeholders.push({
        id: newId,
        name: '',
        role: 'Enabler',
        influence: 'Medium',
        interest: 'Medium',
        needs: '',
        strategy: ''
      });
      dirtyFields.add(`stake-added-${newId}`);
      save();
      renderStakeholders();
      renderStakeholderQuadrants();
    });

    // SWOT buttons
    document.getElementById('addSwotBtn')?.addEventListener('click', () => {
      invalidateConfirmation();
      addSwotItem();
    });

    // Baseline buttons
    document.getElementById('addBaselineBtn')?.addEventListener('click', () => {
      invalidateConfirmation();
      addBaselineRow();
    });

    // Toggle expected guide overlay
    document.getElementById('toggleExpectedGuideBtn')?.addEventListener('click', () => {
      state.module1.showExpectedGuide = !state.module1.showExpectedGuide;
      renderMatrix();
    });

    // JSON Export / Import
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
      collectFormFields();
      Storage.exportLabAsJson(state);
    });

    document.getElementById('importJsonInput')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => {
        const res = Storage.importLabFromJson(evt.target.result);
        if (res.success) {
          state = res.state;
          populateFormFields();
          renderStakeholders();
          renderStakeholderQuadrants();
          renderMatrix();
          renderSwot();
          renderBaseline();
          alert('Module 1 data imported successfully.');
        } else {
          alert('Import failed: ' + res.error);
        }
      };
      reader.readAsText(file);
    });

    // Reset Activity
    document.getElementById('resetActivityBtn')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all data for this learning lab? This action cannot be undone.')) {
        state = Storage.resetLabState();
        populateFormFields();
        renderStakeholders();
        renderStakeholderQuadrants();
        renderMatrix();
        renderSwot();
        renderBaseline();
        setStage('stage-team');
        alert('Learning lab reset to blank state.');
      }
    });

    // Print / PDF Report
    document.getElementById('printPdfBtn')?.addEventListener('click', () => {
      collectFormFields();
      if (!state.module1?.confirmed) {
        const proceed = confirm('Note: Phase 1 has not been self-confirmed yet.\n\nDo you want to export an unconfirmed draft PDF?');
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
