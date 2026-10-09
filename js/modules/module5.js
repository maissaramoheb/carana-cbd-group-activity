/**
 * Module 5: Evaluation & Adjustment Controller
 * CARANA CBD Learning Lab
 * Fully implements the UNPOL CBD Job-Specific Training (JST) Lesson 5 methodology:
 * Deming Cycle (Check & Act), 8-Month Crisis Intelligence Analysis,
 * Empirical Planned vs Actual Variance Evaluation, 3-Tier Adjustment Matrix
 * (Fully Accept, Partially Accept, Reject), Planning Recalibration, and Synthesis.
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
    root.Module5App = factory(root.CARANA_SCENARIO, root.CURRICULUM_GLOSSARY, root.LabStorage);
  }
})(typeof self !== 'undefined' ? self : this, function (Scenario, Glossary, Storage) {
  'use strict';

  let state = null;
  let activeStage = 'stage-methodology';

  const STAGES = [
    { id: 'stage-methodology', label: '1. Methodology & Deming Cycle', short: 'Methodology' },
    { id: 'stage-scenario', label: '2. 8-Month Crisis Scenario', short: 'Crisis Scenario' },
    { id: 'stage-kpis', label: '3. KPI Variance Evaluation', short: 'Variance Eval' },
    { id: 'stage-adjustments', label: '4. 3-Tier Adjustment Matrix', short: 'Adjustment Matrix' },
    { id: 'stage-impact', label: '5. Planning Recalibration', short: 'Recalibration' },
    { id: 'stage-summary', label: '6. Review, Reflection & Handoff', short: 'Review & Handoff' }
  ];

  function init() {
    state = Storage.loadLabState();
    if (!state.module5 || !state.module5.adjustments) {
      state.module5 = Storage.getDefaultState().module5;
    }
    bindGlobalControls();
    renderStageTabs();
    populateFormFields();
    renderKpiEvaluations();
    renderAdjustments();
    renderScenarioDrawerList();
    renderGlossaryList();
    Storage.renderCurriculumTrack(5);
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
    Storage.renderCurriculumTrack(5);
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
        renderKpiEvaluations();
        renderAdjustments();
        Storage.renderCurriculumTrack(5);
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
    if (stageId === 'stage-kpis') renderKpiEvaluations();
    if (stageId === 'stage-adjustments') renderAdjustments();
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
    // Stage 1: Framework
    const fw = state.module5.evaluationFramework || {};
    setValue('evalDemingPhase', fw.demingPhase);
    setValue('evalActors', fw.evalActors);
    setValue('evalPrinciples', fw.principles);
    setValue('evalDataStrategy', fw.dataCollectionStrategy);

    // Stage 2: Crisis Diagnostics
    const cd = state.module5.crisisAnalysis || {};
    setValue('diagLeadership', cd.leadershipShiftImpact);
    setValue('diagAbsorption', cd.absorptionCapacityAssessment);
    setValue('diagDataLoss', cd.dataLossAssessment);
    setValue('diagInterAgency', cd.interAgencyFriction);
    setValue('diagPublicPerception', cd.publicPerceptionGap);
    setValue('diagBudgetCliff', cd.budgetCliffRisk);

    // Stage 5: Impact Assessment
    const imp = state.module5.impactAssessment || {};
    setValue('impactTimeline', imp.timelineImpact);
    setValue('impactResource', imp.resourceImpact);
    setValue('impactQuality', imp.qualityImpact);
    setValue('impactCounterpart', imp.counterpartWillingness);

    // Stage 6: Reflection
    const ref = state.module5.reflection || {};
    setValue('reflectionEvalRelevance', ref.q1EvaluationRelevance);
    setValue('reflectionFacingTruths', ref.q2FacingInconvenientTruths);
    setValue('reflectionResilienceFailure', ref.q3PersonalResilienceInFailure);

    const confirmBox = document.getElementById('confirmModule5');
    if (confirmBox) confirmBox.checked = !!state.module5.confirmed;
  }

  function collectFormFields() {
    state.module5.evaluationFramework = {
      demingPhase: getValue('evalDemingPhase'),
      evalActors: getValue('evalActors'),
      principles: getValue('evalPrinciples'),
      dataCollectionStrategy: getValue('evalDataStrategy')
    };

    state.module5.crisisAnalysis = {
      leadershipShiftImpact: getValue('diagLeadership'),
      absorptionCapacityAssessment: getValue('diagAbsorption'),
      dataLossAssessment: getValue('diagDataLoss'),
      interAgencyFriction: getValue('diagInterAgency'),
      publicPerceptionGap: getValue('diagPublicPerception'),
      budgetCliffRisk: getValue('diagBudgetCliff')
    };

    state.module5.impactAssessment = {
      timelineImpact: getValue('impactTimeline'),
      resourceImpact: getValue('impactResource'),
      qualityImpact: getValue('impactQuality'),
      counterpartWillingness: getValue('impactCounterpart')
    };

    state.module5.reflection = {
      q1EvaluationRelevance: getValue('reflectionEvalRelevance'),
      q2FacingInconvenientTruths: getValue('reflectionFacingTruths'),
      q3PersonalResilienceInFailure: getValue('reflectionResilienceFailure')
    };

    const confirmBox = document.getElementById('confirmModule5');
    if (confirmBox) state.module5.confirmed = confirmBox.checked;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  /* Stage 3: KPI Variance Evaluations */
  function renderKpiEvaluations() {
    const host = document.getElementById('kpiEvaluationsHost');
    if (!host) return;

    host.innerHTML = state.module5.kpiEvaluations.map((kpi, idx) => {
      const statusColor = kpi.varianceStatus === 'On Track' ? 'var(--ok)' :
                          kpi.varianceStatus === 'Delayed' ? 'var(--warn)' :
                          kpi.varianceStatus === 'Critical Variance' ? 'var(--danger)' : 'var(--navy)';
      return `
        <div class="card" style="margin-bottom: 22px; border: 1px solid var(--line);">
          <div class="card-header" style="background: var(--wash);">
            <div>
              <span class="badge" style="background: ${statusColor}; color: #fff; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 800;">
                ${escapeHtml(kpi.varianceStatus || 'Pending')}
              </span>
              <strong style="margin-left: 8px; font-size: 1.05rem; color: var(--navy);">${escapeHtml(kpi.kpiTitle)}</strong>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <select class="form-select kpi-variance-status" data-idx="${idx}" style="padding: 4px 8px; font-size: 0.8rem; width: auto;" aria-label="Variance status for ${escapeHtml(kpi.kpiTitle || (idx + 1))}">
                <option value="On Track" ${kpi.varianceStatus === 'On Track' ? 'selected' : ''}>Status: On Track</option>
                <option value="Delayed" ${kpi.varianceStatus === 'Delayed' ? 'selected' : ''}>Status: Delayed</option>
                <option value="Critical Variance" ${kpi.varianceStatus === 'Critical Variance' ? 'selected' : ''}>Status: Critical Variance</option>
                <option value="Exceeded" ${kpi.varianceStatus === 'Exceeded' ? 'selected' : ''}>Status: Exceeded</option>
              </select>
              <button class="btn btn-sm btn-danger remove-kpi-btn" data-idx="${idx}" type="button" aria-label="Remove KPI evaluation ${escapeHtml(kpi.kpiTitle || (idx + 1))}">×</button>
            </div>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">KPI / Performance Metric Name</label>
              <input class="form-input kpi-field" data-idx="${idx}" data-field="kpiTitle" value="${escapeHtml(kpi.kpiTitle)}" aria-label="Performance indicator title">
            </div>
            <div class="grid-3" style="margin-bottom: 14px;">
              <div class="form-group">
                <label class="form-label" style="font-size: 0.8rem; color: var(--muted);">Module 1 Baseline</label>
                <input class="form-input kpi-field" data-idx="${idx}" data-field="baselineValue" value="${escapeHtml(kpi.baselineValue || '')}" aria-label="Baseline value">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size: 0.8rem; color: var(--navy);">Module 2/3 Planned Target</label>
                <input class="form-input kpi-field" data-idx="${idx}" data-field="targetValue" value="${escapeHtml(kpi.targetValue || '')}" aria-label="Planned target value">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size: 0.8rem; color: var(--danger);">Month 8 Actual Measured Reality</label>
                <input class="form-input kpi-field" data-idx="${idx}" data-field="actualValue" value="${escapeHtml(kpi.actualValue || '')}" aria-label="Month 8 actual measured value">
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" style="color: var(--danger);">Empirical Variance & Bottleneck Analysis</label>
                <textarea class="form-textarea kpi-field" data-idx="${idx}" data-field="varianceAnalysis" style="min-height: 70px;" aria-label="Empirical variance and bottleneck analysis">${escapeHtml(kpi.varianceAnalysis || '')}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label" style="color: var(--ok-dark);">Targeted Corrective Action</label>
                <textarea class="form-textarea kpi-field" data-idx="${idx}" data-field="correctiveAction" style="min-height: 70px;" aria-label="Targeted corrective action">${escapeHtml(kpi.correctiveAction || '')}</textarea>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    host.querySelectorAll('.kpi-field').forEach(el => {
      el.addEventListener('input', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        state.module5.kpiEvaluations[i][f] = e.target.value;
        save();
      });
    });

    host.querySelectorAll('.kpi-variance-status').forEach(el => {
      el.addEventListener('change', e => {
        const i = +e.target.dataset.idx;
        state.module5.kpiEvaluations[i].varianceStatus = e.target.value;
        save();
        renderKpiEvaluations();
      });
    });

    host.querySelectorAll('.remove-kpi-btn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.idx;
        if (state.module5.kpiEvaluations.length > 1) {
          state.module5.kpiEvaluations.splice(i, 1);
          save();
          renderKpiEvaluations();
        }
      };
    });
  }

  function addKpiEvaluationRow() {
    state.module5.kpiEvaluations.push({
      id: 'eval-kpi-' + Date.now(),
      kpiTitle: 'New Performance Indicator Evaluation',
      baselineValue: '',
      targetValue: '',
      actualValue: '',
      varianceStatus: 'Delayed',
      varianceAnalysis: '',
      correctiveAction: ''
    });
    save();
    renderKpiEvaluations();
  }

  function importFromModules2And3() {
    let importedM2 = 0;
    let importedM3 = 0;
    let updated = 0;

    if (state.module5.kpiEvaluations.length > 0) {
      const proceed = confirm('Reconcile evaluation indicators with Module 2 KPIs and Module 3 Logframe outputs? Existing evaluation notes will be preserved.');
      if (!proceed) return;
    }

    // 1. Import/reconcile from M2 KPIs
    if (state.module2 && state.module2.kpis) {
      state.module2.kpis.forEach(k => {
        if (!k.name) return;
        const existing = state.module5.kpiEvaluations.find(e => 
          (e.sourceId && e.sourceId === k.id) ||
          (e.kpiTitle && e.kpiTitle.trim().toLowerCase() === k.name.trim().toLowerCase())
        );

        if (existing) {
          existing.sourceId = k.id;
          if (k.baselineValue && !existing.baselineValue) existing.baselineValue = k.baselineValue;
          if (k.targetValue && !existing.targetValue) existing.targetValue = k.targetValue;
          updated++;
        } else {
          state.module5.kpiEvaluations.push({
            id: 'eval-kpi-' + Date.now() + '-' + importedM2,
            sourceId: k.id,
            kpiTitle: k.name,
            baselineValue: k.baselineValue || 'Baseline N/A',
            targetValue: k.targetValue || 'Target N/A',
            actualValue: 'Pending 8-month audit',
            varianceStatus: 'Delayed',
            varianceAnalysis: 'Imported from Module 2 Performance Framework. Undergoing mid-term field verification.',
            correctiveAction: 'Triangulate field reports and establish low-tech verification ledger.'
          });
          importedM2++;
        }
      });
    }

    // 2. Import/reconcile from Module 3 Logframe outputs
    if (state.module3 && state.module3.logframe && state.module3.logframe.outputs) {
      state.module3.logframe.outputs.forEach(outp => {
        if (!outp.narrative) return;
        const titleStr = `Output ${outp.id}: ${outp.narrative}`;
        const existing = state.module5.kpiEvaluations.find(e =>
          (e.sourceId && e.sourceId === outp.id) ||
          (e.kpiTitle && e.kpiTitle.trim().toLowerCase() === titleStr.trim().toLowerCase()) ||
          (e.kpiTitle && e.kpiTitle.trim().toLowerCase() === outp.narrative.trim().toLowerCase())
        );

        if (existing) {
          existing.sourceId = outp.id;
          if (outp.indicators && !existing.targetValue) existing.targetValue = outp.indicators;
          updated++;
        } else {
          state.module5.kpiEvaluations.push({
            id: 'eval-outp-' + Date.now() + '-' + importedM3,
            sourceId: outp.id,
            kpiTitle: titleStr,
            baselineValue: 'Module 1 Baseline',
            targetValue: outp.indicators || 'Per Logframe target',
            actualValue: 'Pending verification',
            varianceStatus: 'Delayed',
            varianceAnalysis: `Imported from Module 3 Logframe Output. Verification: ${outp.verification || 'Field observation'}.`,
            correctiveAction: 'Deploy advisory inspection team.'
          });
          importedM3++;
        }
      });
    }

    save('Reconciled Modules 2 & 3 Planning');
    renderKpiEvaluations();
    alert(`Reconciliation Complete: ${updated} existing indicators updated, ${importedM2} KPIs and ${importedM3} Logframe outputs added.`);
  }

  /* Stage 4: 3-Tier Adjustment Recommendations */
  function renderAdjustments() {
    const host = document.getElementById('adjustmentsHost');
    if (!host) return;

    host.innerHTML = state.module5.adjustments.map((adj, idx) => {
      const reactionBadgeColor = adj.reaction === 'Fully Accept' ? 'var(--ok)' :
                                 adj.reaction === 'Partially Accept' ? 'var(--warn)' : 'var(--danger)';
      return `
        <div class="card" style="margin-bottom: 22px; border: 1px solid var(--line);">
          <div class="card-header" style="background: ${adj.reaction === 'Fully Accept' ? '#edf9f2' : adj.reaction === 'Partially Accept' ? '#fff9ec' : '#fef2f2'};">
            <div>
              <span class="badge" style="background: ${reactionBadgeColor}; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 800;">
                ${escapeHtml(adj.reaction || 'Pending')}
              </span>
              <strong style="margin-left: 10px; font-size: 1.05rem; color: var(--navy);">${escapeHtml(adj.recommendationTitle)}</strong>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <select class="form-select adj-reaction" data-idx="${idx}" style="padding: 4px 8px; font-size: 0.8rem; width: auto; font-weight: 700;" aria-label="Syndicate decision on ${escapeHtml(adj.recommendationTitle || (idx + 1))}">
                <option value="Fully Accept" ${adj.reaction === 'Fully Accept' ? 'selected' : ''}>Reaction: Fully Accept</option>
                <option value="Partially Accept" ${adj.reaction === 'Partially Accept' ? 'selected' : ''}>Reaction: Partially Accept</option>
                <option value="Reject" ${adj.reaction === 'Reject' ? 'selected' : ''}>Reaction: Reject</option>
              </select>
              <button class="btn btn-sm btn-danger remove-adj-btn" data-idx="${idx}" type="button" aria-label="Remove adjustment recommendation ${escapeHtml(adj.recommendationTitle || (idx + 1))}">×</button>
            </div>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Recommendation Title & Scope</label>
              <input class="form-input adj-field" data-idx="${idx}" data-field="recommendationTitle" value="${escapeHtml(adj.recommendationTitle)}" aria-label="Recommendation title and scope">
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" style="color: var(--navy);">
                  Decision Justification (Lesson 5 Slide 10)
                  <span class="form-hint">Why do implementors agree, disagree, or reject parts of this recommendation?</span>
                </label>
                <textarea class="form-textarea adj-field" data-idx="${idx}" data-field="justification" style="min-height: 80px;" aria-label="Decision justification">${escapeHtml(adj.justification || '')}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label" style="color: var(--ok-dark);">
                  Concrete Action Plan & Remedial Measure
                  <span class="form-hint">What immediate steps will be taken to implement this decision?</span>
                </label>
                <textarea class="form-textarea adj-field" data-idx="${idx}" data-field="actionPlan" style="min-height: 80px;" aria-label="Action plan and remedial measure">${escapeHtml(adj.actionPlan || '')}</textarea>
              </div>
              <div class="form-group col-full" style="background: var(--wash-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--line);">
                <label class="form-label">Lead Stakeholder & Responsible Entity</label>
                <input class="form-input adj-field" data-idx="${idx}" data-field="stakeholderOwner" value="${escapeHtml(adj.stakeholderOwner || '')}" aria-label="Lead stakeholder owner">
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    host.querySelectorAll('.adj-field').forEach(el => {
      el.addEventListener('input', e => {
        const i = +e.target.dataset.idx;
        const f = e.target.dataset.field;
        state.module5.adjustments[i][f] = e.target.value;
        save();
      });
    });

    host.querySelectorAll('.adj-reaction').forEach(el => {
      el.addEventListener('change', e => {
        const i = +e.target.dataset.idx;
        state.module5.adjustments[i].reaction = e.target.value;
        save();
        renderAdjustments();
      });
    });

    host.querySelectorAll('.remove-adj-btn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.idx;
        if (state.module5.adjustments.length > 1) {
          state.module5.adjustments.splice(i, 1);
          save();
          renderAdjustments();
        }
      };
    });
  }

  function addAdjustmentRow() {
    state.module5.adjustments.push({
      id: 'adj-' + Date.now(),
      recommendationTitle: 'New Strategic Adjustment Recommendation',
      reaction: 'Fully Accept',
      justification: '',
      actionPlan: '',
      stakeholderOwner: 'UNPOL CBD Lead & Host Counterpart'
    });
    save();
    renderAdjustments();
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
    document.getElementById('importM2M3Btn')?.addEventListener('click', importFromModules2And3);
    document.getElementById('addKpiEvalBtn')?.addEventListener('click', addKpiEvaluationRow);
    document.getElementById('addAdjustmentBtn')?.addEventListener('click', addAdjustmentRow);

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
