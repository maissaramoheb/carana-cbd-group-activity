/**
 * Module 2: Objective Setting, Prioritisation and Performance Framework Controller
 * CARANA CBD Learning Lab
 * Fully implements the UNPOL CBD Job-Specific Training (JST) Lesson 2 methodology.
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
    root.Module2App = factory(root.CARANA_SCENARIO, root.CURRICULUM_GLOSSARY, root.LabStorage);
  }
})(typeof self !== 'undefined' ? self : this, function (Scenario, Glossary, Storage) {
  'use strict';

  let state = null;
  let activeStage = 'stage-orientation';

  const STAGES = [
    { id: 'stage-orientation', label: '1. Strategic Alignment & Orientation', short: 'Strategic Alignment' },
    { id: 'stage-candidates', label: '2. Objective Candidates Pool', short: 'Candidates Pool' },
    { id: 'stage-prioritisation', label: '3. Prioritisation Matrix', short: 'Prioritisation Chart' },
    { id: 'stage-smart', label: '4. S.M.A.R.T. Formulation', short: 'SMART Objectives' },
    { id: 'stage-kpis', label: '5. Performance Framework (KPIs)', short: 'KPI Framework' },
    { id: 'stage-summary', label: '6. Review, Reflection & Bridge', short: 'Review & Bridge' }
  ];

  function init() {
    state = Storage.loadLabState();
    if (!state.module2 || !state.module2.objectives) {
      state.module2 = Storage.getDefaultState().module2;
    }
    recalculateAllScores();
    bindGlobalControls();
    renderStageTabs();
    populateFormFields();
    renderCandidates();
    renderPrioritisationTable();
    renderSmartWizards();
    renderKpiTable();
    renderScenarioDrawerList();
    renderGlossaryList();
    Storage.renderCurriculumTrack(2);
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
    Storage.renderCurriculumTrack(2);
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
      if (e.target && e.target.id !== 'confirmModule2' && e.target.id !== 'selfConfirmCheck') {
        invalidateConfirmation();
      }
    });
    document.addEventListener('input', debounce(() => {
      save('Autosaved');
    }, 600));
  }

  function invalidateConfirmation() {
    if (state.module2 && state.module2.confirmed) {
      state.module2.confirmed = false;
      const chk = document.getElementById('confirmModule2') || document.getElementById('selfConfirmCheck');
      if (chk) chk.checked = false;
      updateCompletionBadge();
    }
  }

  function updateCompletionBadge() {
    const badge = document.getElementById('stageCompleteFooterBadge');
    if (!badge) return;
    if (state.module2 && state.module2.confirmed) {
      badge.textContent = '✓ Phase 2 Self-Confirmed · Ready for Module 3';
      badge.style.color = 'var(--ok)';
    } else {
      badge.textContent = 'Phase 2 In Progress · Pending Self-Confirmation';
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
          if (modKey !== 'module2' && incoming[modKey]) {
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
        Storage.renderCurriculumTrack(2);
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
    if (stageId === 'stage-prioritisation') renderPrioritisationTable();
    if (stageId === 'stage-smart') renderSmartWizards();
    if (stageId === 'stage-kpis') renderKpiTable();
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

    const ref = state.module2.reflection || {};
    setValue('reflectionExperience', ref.q1Experience);
    setValue('reflectionPrioritisation', ref.q2StrategicPrioritisation);
    setValue('reflectionOwnership', ref.q3LocalOwnership);

    const confirmBox = document.getElementById('confirmModule2');
    if (confirmBox) confirmBox.checked = !!state.module2.confirmed;
  }

  function collectFormFields() {
    state.module2.reflection = {
      q1Experience: getValue('reflectionExperience'),
      q2StrategicPrioritisation: getValue('reflectionPrioritisation'),
      q3LocalOwnership: getValue('reflectionOwnership')
    };

    const confirmBox = document.getElementById('confirmModule2');
    if (confirmBox) state.module2.confirmed = confirmBox.checked;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  /* Candidate Objectives Management */
  function renderCandidates() {
    const host = document.getElementById('candidatesListHost');
    if (!host) return;

    host.innerHTML = state.module2.objectives.map((obj, idx) => `
      <div class="card" style="margin-bottom: 14px; background: #ffffff;" data-obj-idx="${idx}">
        <div style="padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; background: var(--wash); border-bottom: 1px solid var(--line);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="cell-badge" style="background: var(--navy);">#${idx + 1}</span>
            <strong>${escapeHtml(obj.title || 'Untitled Objective')}</strong>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 0.8rem; color: var(--muted);">${escapeHtml(obj.source || 'User Input')}</span>
            <button class="btn btn-sm btn-danger remove-candidate-btn" data-idx="${idx}" type="button" aria-label="Remove objective ${idx + 1}: ${escapeHtml(obj.title || 'Untitled Objective')}">Remove</button>
          </div>
        </div>
        <div style="padding: 14px 18px;" class="grid-2">
          <div class="form-group col-full" style="margin-bottom: 0;">
            <label class="form-label">Objective Title</label>
            <input class="form-input cand-field" data-idx="${idx}" data-field="title" value="${escapeHtml(obj.title)}" placeholder="e.g. Modernise Criminal Evidence Management" aria-label="Candidate objective ${idx + 1} title">
          </div>
          <div class="form-group col-full" style="margin-bottom: 0;">
            <label class="form-label">Context & Problem Description</label>
            <textarea class="form-textarea cand-field" data-idx="${idx}" data-field="description" style="min-height: 70px;" aria-label="Candidate objective ${idx + 1} context and problem description">${escapeHtml(obj.description || '')}</textarea>
          </div>
        </div>
      </div>
    `).join('');

    host.querySelectorAll('.cand-field').forEach(el => {
      el.addEventListener('input', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        state.module2.objectives[i][f] = e.target.value;
        save();
      });
    });

    host.querySelectorAll('.remove-candidate-btn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.idx;
        if (state.module2.objectives.length > 2) {
          state.module2.objectives.splice(i, 1);
          recalculateAllScores();
          save();
          renderCandidates();
          renderPrioritisationTable();
        } else {
          alert('You must maintain at least 2 objectives to allow prioritisation.');
        }
      };
    });

    updateCandidateCountBadge();
  }

  function updateCandidateCountBadge() {
    const badge = document.getElementById('candidateCountBadge');
    if (badge) {
      const count = state.module2.objectives.length;
      badge.textContent = `${count} Objectives (Recommended: 6–10)`;
      badge.style.background = (count >= 6 && count <= 10) ? 'var(--ok)' : 'var(--navy)';
      badge.style.color = '#ffffff';
    }
  }

  function addCandidateObjective(title, description, source) {
    const newId = 'obj-' + Date.now();
    state.module2.objectives.push({
      id: newId,
      title: title || 'New Proposed CBD Objective',
      description: description || '',
      source: source || 'Participant Syndicate',
      scores: {
        policingPractice: 2,
        environmental: 1,
        conflictPrevention: 2,
        humanRights: 2,
        gender: 2,
        cpoc: 2,
        need: 2,
        risk: 2,
        implementability: 2,
        complementarity: 2,
        donorInterest: 2
      },
      rawStrategicScore: 1.83,
      weightedStrategicScore: 3.67,
      overallScore: 10.67,
      rank: state.module2.objectives.length + 1
    });
    recalculateAllScores();
    save();
    renderCandidates();
    renderPrioritisationTable();
  }

  /* Inter-Module Data Pipeline: Import from Module 1 */
  function importFromModule1() {
    const m1 = state.module1;
    let importedCount = 0;

    // Import from SWOT Opportunities
    if (m1 && m1.swot && m1.swot.opportunities) {
      m1.swot.opportunities.forEach(opp => {
        const exists = state.module2.objectives.some(o => o.title.toLowerCase() === opp.text.toLowerCase());
        if (!exists && opp.text) {
          addCandidateObjective(opp.text, 'Derived from Module 1 SWOT Strategic Point of Entry.', 'Module 1 SWOT Opportunity');
          importedCount++;
        }
      });
    }

    // Import from Baseline unmet targets
    if (m1 && m1.baseline) {
      m1.baseline.forEach(b => {
        if (b.area && b.tobeTarget) {
          const title = `Achieve Target: ${b.area}`;
          const exists = state.module2.objectives.some(o => o.title.toLowerCase() === title.toLowerCase());
          if (!exists) {
            addCandidateObjective(title, `As-is: ${b.asIsEvidence}\nTarget: ${b.tobeTarget}`, `Module 1 Baseline (${b.area})`);
            importedCount++;
          }
        }
      });
    }

    alert(`Imported ${importedCount} candidate objectives from Module 1.`);
    renderCandidates();
    renderPrioritisationTable();
  }

  /* Scoring & Prioritisation Algorithm (Lesson 2 Activity 2.1 p. 22-24) */
  function calculateObjectiveScores(s) {
    const scores = s || {};
    const stratSum = (+scores.policingPractice || 1) +
                     (+scores.environmental || 1) +
                     (+scores.conflictPrevention || 1) +
                     (+scores.humanRights || 1) +
                     (+scores.gender || 1) +
                     (+scores.cpoc || 1);

    const rawStrat = stratSum / 6;
    const weightedStrat = rawStrat * 2.00; // Weighting factor 2.00

    const need = (+scores.need || 1) * 1.00;
    const impl = (+scores.implementability || 1) * 1.00;
    const comp = (+scores.complementarity || 1) * 0.50; // Weighting factor 0.50 per Lesson 2
    const donor = (+scores.donorInterest || 1) * 1.00;
    // Per UNPOL CBD Lesson 2 (p. 22 & 24): "Ignore the risk category at this point as 'Risk' is taught later in the course (Lesson 3)"
    // Risk is recorded for completeness, but excluded from the prioritization sum.
    const overall = weightedStrat + need + impl + comp + donor;

    return {
      rawStrategicScore: Math.round(rawStrat * 100) / 100,
      weightedStrategicScore: Math.round(weightedStrat * 100) / 100,
      overallScore: Math.round(overall * 100) / 100
    };
  }

  function recalculateAllScores() {
    if (!state.module2 || !state.module2.objectives) return;
    state.module2.objectives.forEach(obj => {
      const calc = calculateObjectiveScores(obj.scores);
      obj.rawStrategicScore = calc.rawStrategicScore;
      obj.weightedStrategicScore = calc.weightedStrategicScore;
      obj.overallScore = calc.overallScore;
    });

    // Sort descending by overall score
    const sorted = [...state.module2.objectives].sort((a, b) => b.overallScore - a.overallScore);
    sorted.forEach((obj, idx) => {
      const original = state.module2.objectives.find(o => o.id === obj.id);
      if (original) original.rank = idx + 1;
    });
  }

  /* Render Prioritisation Table (Lesson 2 Activity 2.1) */
  function renderPrioritisationTable() {
    const host = document.getElementById('prioritisationTableHost');
    if (!host) return;

    recalculateAllScores();

    let html = `
      <table class="matrix-table" style="font-size: 0.82rem;">
        <thead>
          <tr>
            <th rowspan="2" style="width: 220px; text-align: left;">Objectives</th>
            <th colspan="6" style="background: var(--navy-light);">6 Strategic Assessment Categories (Weight: 2.00)</th>
            <th rowspan="2" title="Average of 6 strategic categories (1-3)">Raw Strat</th>
            <th rowspan="2" title="Beneficiary Assessment (Weight 1.00)">Need (1.0)</th>
            <th rowspan="2" title="Per Lesson 2 p. 22/24: Recorded for completeness, but excluded from sum; formally analysed in Lesson 3">Risk<br><span style="font-size:0.68rem; opacity:0.85;">(M3 Risk)</span></th>
            <th rowspan="2" title="Implementability (Weight 1.00)">Impl (1.0)</th>
            <th rowspan="2" title="Complementarity (Weight 0.50)">Comp (0.5)</th>
            <th rowspan="2" title="Donor Interest (Weight 1.00)">Donor (1.0)</th>
            <th rowspan="2" style="background: var(--navy); color: #fff;">Overall Score</th>
            <th rowspan="2" style="background: var(--un-blue); color: #fff;">Rank</th>
          </tr>
          <tr>
            <th style="font-size: 0.72rem;">1. Police</th>
            <th style="font-size: 0.72rem;">2. Envir</th>
            <th style="font-size: 0.72rem;">3. Prev</th>
            <th style="font-size: 0.72rem;">4. Rights</th>
            <th style="font-size: 0.72rem;">5. Gend</th>
            <th style="font-size: 0.72rem;">6. CPOC</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Sort display by rank
    const sortedObjectives = [...state.module2.objectives].sort((a, b) => a.rank - b.rank);

    sortedObjectives.forEach(obj => {
      const s = obj.scores || {};
      const isTop2 = obj.rank <= 2;

      html += `
        <tr style="${isTop2 ? 'background: #f0f9fd;' : ''}">
          <td style="font-weight: 700;">
            <div style="color: var(--navy);">${escapeHtml(obj.title)}</div>
            <div style="font-size: 0.72rem; color: var(--muted); font-weight: normal;">${escapeHtml(obj.source || '')}</div>
          </td>
          ${renderScoreSelect(obj.id, 'policingPractice', s.policingPractice)}
          ${renderScoreSelect(obj.id, 'environmental', s.environmental)}
          ${renderScoreSelect(obj.id, 'conflictPrevention', s.conflictPrevention)}
          ${renderScoreSelect(obj.id, 'humanRights', s.humanRights)}
          ${renderScoreSelect(obj.id, 'gender', s.gender)}
          ${renderScoreSelect(obj.id, 'cpoc', s.cpoc)}
          <td style="text-align: center; font-weight: 700; background: var(--wash);">${obj.rawStrategicScore.toFixed(2)}</td>
          ${renderScoreSelect(obj.id, 'need', s.need)}
          ${renderScoreSelect(obj.id, 'risk', s.risk, '3=Low, 1=High')}
          ${renderScoreSelect(obj.id, 'implementability', s.implementability)}
          ${renderScoreSelect(obj.id, 'complementarity', s.complementarity)}
          ${renderScoreSelect(obj.id, 'donorInterest', s.donorInterest)}
          <td style="text-align: center; font-weight: 800; font-size: 0.95rem; color: var(--navy);">${obj.overallScore.toFixed(1)}</td>
          <td style="text-align: center;">
            <span class="cell-badge" style="background: ${isTop2 ? 'var(--ok)' : 'var(--muted)'};">#${obj.rank}</span>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    host.innerHTML = html;

    host.querySelectorAll('.score-selector').forEach(sel => {
      sel.addEventListener('change', e => {
        const objId = e.target.dataset.objId;
        const cat = e.target.dataset.cat;
        const targetObj = state.module2.objectives.find(o => o.id === objId);
        if (targetObj) {
          if (!targetObj.scores) targetObj.scores = {};
          targetObj.scores[cat] = +e.target.value;
          recalculateAllScores();
          save();
          renderPrioritisationTable();
          syncTopSmartObjectives();
          renderSmartWizards();
        }
      });
    });
  }

  function renderScoreSelect(objId, catKey, currentVal, titleNote) {
    const val = currentVal !== undefined ? currentVal : 2;
    return `
      <td style="padding: 4px; text-align: center;">
        <select class="score-selector" data-obj-id="${objId}" data-cat="${catKey}" title="${titleNote || 'Scale: 1=Low, 2=Medium, 3=High'}" 
                aria-label="Score ${catKey} for objective ${objId}"
                style="width: 44px; padding: 4px 2px; text-align: center; font-size: 0.8rem; border-radius: 4px; border: 1px solid var(--line);">
          <option value="1" ${val === 1 ? 'selected' : ''}>1</option>
          <option value="2" ${val === 2 ? 'selected' : ''}>2</option>
          <option value="3" ${val === 3 ? 'selected' : ''}>3</option>
        </select>
      </td>
    `;
  }

  /* Sync Top 2 Ranked Objectives to SMART section preserving objectiveId identity */
  function syncTopSmartObjectives() {
    if (!state.module2.smartObjectives) state.module2.smartObjectives = [];
    const objectives = state.module2.objectives || [];

    // Ensure every candidate objective has a corresponding SMART record, preserving all authored entries
    objectives.forEach(obj => {
      let smart = state.module2.smartObjectives.find(s => s.objectiveId === obj.id);
      if (!smart) {
        state.module2.smartObjectives.push({
          id: 'smart-' + obj.id,
          objectiveId: obj.id,
          title: obj.title,
          specific: '',
          measurable: '',
          achievable: '',
          relevant: '',
          timeBound: '',
          fullStatement: ''
        });
      } else {
        smart.title = obj.title;
      }
    });
  }

  /* Render S.M.A.R.T. Formulation Wizard */
  function renderSmartWizards() {
    const host = document.getElementById('smartWizardsHost');
    if (!host) return;

    syncTopSmartObjectives();

    const sorted = [...(state.module2.objectives || [])].sort((a, b) => a.rank - b.rank);
    const top2 = sorted.slice(0, 2);

    host.innerHTML = top2.map((obj, idx) => {
      const smart = state.module2.smartObjectives.find(s => s.objectiveId === obj.id) || {
        objectiveId: obj.id,
        title: obj.title,
        specific: '',
        measurable: '',
        achievable: '',
        relevant: '',
        timeBound: '',
        fullStatement: ''
      };

      return `
      <div class="card" style="margin-bottom: 24px; border-left: 6px solid ${idx === 0 ? 'var(--ok)' : 'var(--un-blue)'};">
        <div class="card-header" style="background: var(--wash);">
          <div>
            <span class="badge" style="background: ${idx === 0 ? 'var(--ok)' : 'var(--un-blue)'}; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 800;">
              Priority #${idx + 1}
            </span>
            <h3 style="margin-top: 4px; font-size: 1.2rem;">${escapeHtml(smart.title || obj.title)}</h3>
          </div>
          <span style="font-size: 0.85rem; color: var(--muted);">S.M.A.R.T. Framework Formulation</span>
        </div>
        <div class="card-body">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="smart-${idx}-specific">
                (S) Specific
                <span class="form-hint">Related directly to mandate and clear operational scope</span>
              </label>
              <textarea id="smart-${idx}-specific" class="form-textarea smart-field" data-obj-id="${obj.id}" data-field="specific" aria-label="Priority #${idx + 1} Specific">${escapeHtml(smart.specific || '')}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="smart-${idx}-measurable">
                (M) Measurable
                <span class="form-hint">Quantifiable indicators of success (# or %)</span>
              </label>
              <textarea id="smart-${idx}-measurable" class="form-textarea smart-field" data-obj-id="${obj.id}" data-field="measurable" aria-label="Priority #${idx + 1} Measurable">${escapeHtml(smart.measurable || '')}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="smart-${idx}-achievable">
                (A) Achievable
                <span class="form-hint">Feasible within available mission resources and partnerships</span>
              </label>
              <textarea id="smart-${idx}-achievable" class="form-textarea smart-field" data-obj-id="${obj.id}" data-field="achievable" aria-label="Priority #${idx + 1} Achievable">${escapeHtml(smart.achievable || '')}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="smart-${idx}-relevant">
                (R) Realistic & Relevant
                <span class="form-hint">Falls within authorized mandate tasks and political reality</span>
              </label>
              <textarea id="smart-${idx}-relevant" class="form-textarea smart-field" data-obj-id="${obj.id}" data-field="relevant" aria-label="Priority #${idx + 1} Realistic & Relevant">${escapeHtml(smart.relevant || '')}</textarea>
            </div>
            <div class="form-group col-full">
              <label class="form-label" for="smart-${idx}-timeBound">
                (T) Time-Bound
                <span class="form-hint">Clear implementation horizon (e.g. Month 6, Month 12)</span>
              </label>
              <input id="smart-${idx}-timeBound" class="form-input smart-field" data-obj-id="${obj.id}" data-field="timeBound" value="${escapeHtml(smart.timeBound || '')}" placeholder="e.g. Completed within 12 months" aria-label="Priority #${idx + 1} Time-Bound">
            </div>
            <div class="form-group col-full" style="background: var(--wash-subtle); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--line);">
              <label class="form-label" for="smart-${idx}-fullStatement" style="color: var(--navy);">
                Consolidated SMART Objective Statement
                <span class="form-hint">Combined formal wording to be transferred into Module 3 Logframe</span>
              </label>
              <textarea id="smart-${idx}-fullStatement" class="form-textarea smart-field" data-obj-id="${obj.id}" data-field="fullStatement" style="min-height: 80px; font-weight: 600;" aria-label="Priority #${idx + 1} Consolidated SMART Statement">${escapeHtml(smart.fullStatement || '')}</textarea>
            </div>
          </div>
        </div>
      </div>
      `;
    }).join('');

    host.querySelectorAll('.smart-field').forEach(el => {
      el.addEventListener('input', e => {
        const objId = e.target.dataset.objId;
        const f = e.target.dataset.field;
        let targetSmart = state.module2.smartObjectives.find(s => s.objectiveId === objId);
        if (!targetSmart) {
          targetSmart = {
            id: 'smart-' + objId,
            objectiveId: objId,
            title: '',
            specific: '',
            measurable: '',
            achievable: '',
            relevant: '',
            timeBound: '',
            fullStatement: ''
          };
          state.module2.smartObjectives.push(targetSmart);
        }
        targetSmart[f] = e.target.value;
        invalidateConfirmation();
        save();
      });
    });
  }

  /* Performance Framework (KPIs) */
  function renderKpiTable() {
    const host = document.getElementById('kpiTableBody');
    if (!host) return;

    if (!state.module2.kpis) state.module2.kpis = [];

    host.innerHTML = state.module2.kpis.map((kpi, idx) => `
      <tr data-kpi-idx="${idx}">
        <td><input class="form-input kpi-field" data-idx="${idx}" data-field="name" value="${escapeHtml(kpi.name || '')}" placeholder="Indicator Name" aria-label="KPI indicator name for row ${idx + 1}"></td>
        <td>
          <select class="form-select kpi-field" data-idx="${idx}" data-field="type" aria-label="KPI indicator type for row ${idx + 1}">
            <option value="Quantitative (#)" ${kpi.type === 'Quantitative (#)' ? 'selected' : ''}>Quantitative (#)</option>
            <option value="Quantitative (%)" ${kpi.type === 'Quantitative (%)' ? 'selected' : ''}>Quantitative (%)</option>
            <option value="Qualitative condition" ${kpi.type === 'Qualitative condition' ? 'selected' : ''}>Qualitative condition</option>
          </select>
        </td>
        <td><textarea class="form-textarea kpi-field" data-idx="${idx}" data-field="baselineValue" style="min-height: 60px;" aria-label="KPI baseline value for row ${idx + 1}">${escapeHtml(kpi.baselineValue || '')}</textarea></td>
        <td><textarea class="form-textarea kpi-field" data-idx="${idx}" data-field="targetValue" style="min-height: 60px;" aria-label="KPI target value for row ${idx + 1}">${escapeHtml(kpi.targetValue || '')}</textarea></td>
        <td><input class="form-input kpi-field" data-idx="${idx}" data-field="source" value="${escapeHtml(kpi.source || '')}" aria-label="KPI data source for row ${idx + 1}"></td>
        <td><input class="form-input kpi-field" data-idx="${idx}" data-field="frequency" value="${escapeHtml(kpi.frequency || '')}" aria-label="KPI reporting frequency for row ${idx + 1}"></td>
        <td><input class="form-input kpi-field" data-idx="${idx}" data-field="responsible" value="${escapeHtml(kpi.responsible || '')}" aria-label="KPI responsible entity for row ${idx + 1}"></td>
        <td><button class="btn btn-sm btn-danger remove-kpi-btn" data-idx="${idx}" type="button" aria-label="Remove KPI row ${idx + 1}">×</button></td>
      </tr>
    `).join('');

    host.querySelectorAll('.kpi-field').forEach(el => {
      el.addEventListener('input', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        state.module2.kpis[i][f] = e.target.value;
        save();
      });
    });

    host.querySelectorAll('.remove-kpi-btn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.idx;
        if (state.module2.kpis.length > 1) {
          state.module2.kpis.splice(i, 1);
          save();
          renderKpiTable();
        }
      };
    });
  }

  function addKpiRow() {
    if (!state.module2.kpis) state.module2.kpis = [];
    state.module2.kpis.push({
      id: 'kpi-' + Date.now(),
      smartId: 'smart-1',
      name: '',
      type: 'Quantitative (#)',
      baselineValue: '',
      targetValue: '',
      source: '',
      frequency: 'Quarterly',
      responsible: ''
    });
    save();
    renderKpiTable();
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

  /* Global Event Bindings */
  function bindGlobalControls() {
    document.querySelectorAll('[data-goto-stage]').forEach(b => {
      b.onclick = () => setStage(b.dataset.gotoStage);
    });

    document.getElementById('manualSaveBtn')?.addEventListener('click', () => save('Saved locally'));

    // Confirmation checkbox listener
    const confirmBox = document.getElementById('confirmModule2') || document.getElementById('selfConfirmCheck');
    confirmBox?.addEventListener('change', e => {
      state.module2.confirmed = e.target.checked;
      save(e.target.checked ? 'Phase 2 Confirmed' : 'Confirmation withdrawn');
      updateCompletionBadge();
    });

    document.getElementById('importFromM1Btn')?.addEventListener('click', importFromModule1);

    document.getElementById('addCandidateBtn')?.addEventListener('click', () => {
      const title = prompt('Enter Objective Title:');
      if (title && title.trim()) {
        addCandidateObjective(title.trim(), '', 'Participant Formulated');
      }
    });

    document.getElementById('addKpiBtn')?.addEventListener('click', addKpiRow);

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

    // JSON Export / Import
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
      collectFormFields();
      Storage.exportLabAsJson(state);
    });

    document.getElementById('printPdfBtn')?.addEventListener('click', () => {
      collectFormFields();
      if (!state.module2?.confirmed) {
        const proceed = confirm('Note: Phase 2 has not been self-confirmed yet.\n\nDo you want to export an unconfirmed draft PDF?');
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
    recalculateAllScores,
    calculateObjectiveScores,
    syncTopSmartObjectives
  };
});
