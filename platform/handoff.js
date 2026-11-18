/* Reviewable handoff from Lessons 2-6 drafts into original CARANA practical workbenches (module2.html-module6.html).
 * Strict rules: never auto-writes on navigation, never alters Lesson 1 (carana_cbd_course_v1) or module1..6 HTML/JS,
 * never claims automated verification, backs up existing workbench state before consented staging, and preserves conflict fields unless opted in.
 */
(function (global) {
  'use strict';

  const LAB_KEY = 'carana_cbd_lab_v1';
  const LAB_BACKUP_KEY = 'carana_cbd_lab_v1_pre_handoff';
  const MAX_TEXT = 1200;

  const HANDOFF_SCREENS = {
    2: '02-06',
    3: '03-07',
    4: '04-06',
    5: '05-05',
    6: '06-06'
  };

  const MODULE_META = {
    2: {
      url: '../../module2.html',
      title: 'Module 2: Objective Setting & Prioritisation',
      targetSummary: 'Stage 4 (S.M.A.R.T. Objective 1), Stage 5 (KPI 1), and Lesson 2 Reflection'
    },
    3: {
      url: '../../module3.html',
      title: 'Module 3: Planning Activities, Logframe & Risk',
      targetSummary: 'Stage 3 (Logframe Outcome 1), Stage 5 (Contingency Plan), and Lesson 3 Reflection'
    },
    4: {
      url: '../../module4.html',
      title: 'Module 4: Implementation & MMA',
      targetSummary: 'Stage 6 Reflection (Audience, Adaptation Message & Comprehension Check)'
    },
    5: {
      url: '../../module5.html',
      title: 'Module 5: Evaluation & Adjustment',
      targetSummary: 'Stage 6 Reflection (Evaluation Purpose, Evidence Limits & Adjustment Action)'
    },
    6: {
      url: '../../module6.html',
      title: 'Module 6: Transition & Handover',
      targetSummary: 'Stage 6 Reflection (Phased Readiness, Ownership Safeguards & Handover Dialogue)'
    }
  };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const cleanText = s => (typeof s === 'string' ? s.trim().slice(0, MAX_TEXT) : '');

  function getByPath(obj, pathStr) {
    let cur = obj;
    for (const part of pathStr.split('.')) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = Array.isArray(cur) ? cur[Number(part)] : cur[part];
    }
    return cur;
  }

  function cloneJson(obj) {
    return obj && typeof obj === 'object' ? JSON.parse(JSON.stringify(obj)) : {};
  }

  function isDefaultContingencyPlaceholder(val) {
    const defaults = new Set([
      'Administrative reorganizations or unforeseen field setbacks disrupting operational timeline.',
      'Preserve secure documentation off-site and maintain mentor accompaniment network.',
      'Notify Head of CIS, UNPOL Leadership, and civil society counterparts.',
      'Deputy Head of CIS, Lead Investigator, UNPOL CBD Mentor.'
    ]);
    return !val || defaults.has(String(val).trim());
  }

  function buildMappingsForLesson(lessonNumber, drafts) {
    const d = drafts || {};
    const field = (screenId, idx) => cleanText(d?.[screenId]?.[idx]);
    const combine = parts => parts.filter(Boolean).join('\n\n').slice(0, MAX_TEXT);

    if (lessonNumber === 2) {
      return [
        { sourceId: '02-04[0]', sourceLabel: '02-04 · Intended change & scope', draftText: field('02-04', 0), targetPath: 'module2.smartObjectives.0.specific', targetLabel: 'Module 2 → Objective 1 → Specific (S)' },
        { sourceId: '02-04[1]', sourceLabel: '02-04 · Evidence & measure', draftText: field('02-04', 1), targetPath: 'module2.smartObjectives.0.measurable', targetLabel: 'Module 2 → Objective 1 → Measurable (M)' },
        { sourceId: '02-04[2]', sourceLabel: '02-04 · Achievability & ownership', draftText: field('02-04', 2), targetPath: 'module2.smartObjectives.0.achievable', targetLabel: 'Module 2 → Objective 1 → Achievable (A)' },
        { sourceId: '02-04[3]', sourceLabel: '02-04 · Relevance', draftText: field('02-04', 3), targetPath: 'module2.smartObjectives.0.relevant', targetLabel: 'Module 2 → Objective 1 → Relevant (R)' },
        { sourceId: '02-04[4]', sourceLabel: '02-04 · Review date & unresolved target', draftText: field('02-04', 4), targetPath: 'module2.smartObjectives.0.timeBound', targetLabel: 'Module 2 → Objective 1 → Time-bound (T)' },
        { sourceId: '02-08[1]', sourceLabel: '02-08 · Baseline & repeat observation', draftText: field('02-08', 1), targetPath: 'module2.kpis.0.baselineValue', targetLabel: 'Module 2 → KPI 1 → Baseline Value' },
        { sourceId: '02-08[2]', sourceLabel: '02-08 · Collection responsibility & limits', draftText: field('02-08', 2), targetPath: 'module2.kpis.0.source', targetLabel: 'Module 2 → KPI 1 → Evidence Source & Limits' },
        { sourceId: '02-08[0]+02-08[3]', sourceLabel: '02-08 · Indicator definition & decision use', draftText: combine([field('02-08', 0), field('02-08', 3)]), targetPath: 'module2.reflection.q2StrategicPrioritisation', targetLabel: 'Module 2 → Reflection → Prioritisation & Indicator Rationale' }
      ];
    }

    if (lessonNumber === 3) {
      return [
        { sourceId: '03-10[0]', sourceLabel: '03-10 · Intended result & level', draftText: field('03-10', 0), targetPath: 'module3.logframe.outcomes.0.narrative', targetLabel: 'Module 3 → Logframe Outcome 1 → Narrative' },
        { sourceId: '03-10[1]', sourceLabel: '03-10 · Measure', draftText: field('03-10', 1), targetPath: 'module3.logframe.outcomes.0.indicators', targetLabel: 'Module 3 → Logframe Outcome 1 → Indicators' },
        { sourceId: '03-10[2]', sourceLabel: '03-10 · Evidence source & method', draftText: field('03-10', 2), targetPath: 'module3.logframe.outcomes.0.verification', targetLabel: 'Module 3 → Logframe Outcome 1 → Means of Verification' },
        { sourceId: '03-10[3]', sourceLabel: '03-10 · External condition / assumption', draftText: field('03-10', 3), targetPath: 'module3.logframe.outcomes.0.assumptions', targetLabel: 'Module 3 → Logframe Outcome 1 → Assumptions' },
        { sourceId: '03-07[0]', sourceLabel: '03-07 · Trigger & essential function', draftText: field('03-07', 0), targetPath: 'module3.contingency.trigger', targetLabel: 'Module 3 → Contingency Plan → Disruption Trigger' },
        { sourceId: '03-07[1]', sourceLabel: '03-07 · Alternative & responsible actors', draftText: field('03-07', 1), targetPath: 'module3.contingency.backupPlan', targetLabel: 'Module 3 → Contingency Plan → Fallback Action' },
        { sourceId: '03-07[2]', sourceLabel: '03-07 · Resources & safeguards', draftText: field('03-07', 2), targetPath: 'module3.contingency.stakeholderCommunication', targetLabel: 'Module 3 → Contingency Plan → Safeguards & Communication' },
        { sourceId: '03-07[3]', sourceLabel: '03-07 · Review point', draftText: field('03-07', 3), targetPath: 'module3.reflection.q3RiskPreparedness', targetLabel: 'Module 3 → Reflection → Risk Preparedness' }
      ];
    }

    if (lessonNumber === 4) {
      return [
        { sourceId: '04-02[0]', sourceLabel: '04-02 · Audience & purpose', draftText: field('04-02', 0), targetPath: 'module4.reflection.q1Experience', targetLabel: 'Module 4 → Reflection → Implementation Audience & Context' },
        { sourceId: '04-02[1]', sourceLabel: '04-02 · Revised message', draftText: field('04-02', 1), targetPath: 'module4.reflection.q2EmpathyAndResistance', targetLabel: 'Module 4 → Reflection → Framing & Resistance Awareness' },
        { sourceId: '04-02[2]', sourceLabel: '04-02 · Check understanding', draftText: field('04-02', 2), targetPath: 'module4.reflection.q3ResilienceInTheField', targetLabel: 'Module 4 → Reflection → Two-Way Feedback Check' }
      ];
    }

    if (lessonNumber === 5) {
      return [
        { sourceId: '05-03[0]', sourceLabel: '05-03 · Question & planned result', draftText: field('05-03', 0), targetPath: 'module5.reflection.q1EvaluationRelevance', targetLabel: 'Module 5 → Reflection → Evaluation Question & Focus' },
        { sourceId: '05-03[1..2]', sourceLabel: '05-03 · Methods, limits & credibility', draftText: combine([field('05-03', 1), field('05-03', 2)]), targetPath: 'module5.reflection.q2FacingInconvenientTruths', targetLabel: 'Module 5 → Reflection → Evidence Limits & Rigour' },
        { sourceId: '05-04[0..2]', sourceLabel: '05-04 · Management response & follow-up', draftText: combine([field('05-04', 0), field('05-04', 1), field('05-04', 2)]), targetPath: 'module5.reflection.q3PersonalResilienceInFailure', targetLabel: 'Module 5 → Reflection → Response Justification & Follow-Up' }
      ];
    }

    if (lessonNumber === 6) {
      return [
        { sourceId: '06-05[0..1]', sourceLabel: '06-05 · Task, readiness evidence & unresolved capacity', draftText: combine([field('06-05', 0), field('06-05', 1)]), targetPath: 'module6.reflection.q1TransitionMindset', targetLabel: 'Module 6 → Reflection → Phased Transfer & Readiness' },
        { sourceId: '06-05[2..3]', sourceLabel: '06-05 · Rights, gender, resources & phasing review', draftText: combine([field('06-05', 2), field('06-05', 3)]), targetPath: 'module6.reflection.q2SustainingOwnership', targetLabel: 'Module 6 → Reflection → Sustaining Safeguards & Ownership' },
        { sourceId: '06-07[0..2]', sourceLabel: '06-07 · Handover conversation & unresolved steps', draftText: combine([field('06-07', 0), field('06-07', 1), field('06-07', 2)]), targetPath: 'module6.reflection.q3OverallCBDJourney', targetLabel: 'Module 6 → Reflection → Mutual Expectations & Follow-Up' }
      ];
    }

    return [];
  }

  function buildMapping(lessonNumber, lessonDrafts, currentLabState) {
    const lab = currentLabState && typeof currentLabState === 'object' ? currentLabState : {};
    const rows = buildMappingsForLesson(Number(lessonNumber), lessonDrafts);
    return rows.map(r => {
      const existingRaw = getByPath(lab, r.targetPath);
      const existingText = typeof existingRaw === 'string' ? existingRaw.trim() : '';
      const isDefaultPlaceholder = r.targetPath.startsWith('module3.contingency.')
        ? isDefaultContingencyPlaceholder(existingText)
        : false;
      const hasExistingLearnerText = Boolean(existingText && !isDefaultPlaceholder);
      return {
        ...r,
        hasDraft: Boolean(r.draftText),
        existingText,
        hasExistingLearnerText,
        willConflict: Boolean(r.draftText && hasExistingLearnerText && existingText !== r.draftText)
      };
    });
  }

  function ensureModuleSkeleton(nextLab, lessonNumber) {
    if (!nextLab.version) nextLab.version = '1.0.0';
    if (lessonNumber === 2) {
      nextLab.module2 = nextLab.module2 || {};
      if (!Array.isArray(nextLab.module2.smartObjectives) || nextLab.module2.smartObjectives.length === 0) {
        nextLab.module2.smartObjectives = [
          { id: 'smart-1', objectiveId: 'obj-1', title: "Improving CIS's SGBV Investigation Capability", specific: '', measurable: '', achievable: '', relevant: '', timeBound: '', fullStatement: '' },
          { id: 'smart-2', objectiveId: 'obj-2', title: "Digitalising CIS's Work Processes & Case Files", specific: '', measurable: '', achievable: '', relevant: '', timeBound: '', fullStatement: '' }
        ];
      }
      if (!Array.isArray(nextLab.module2.kpis) || nextLab.module2.kpis.length === 0) {
        nextLab.module2.kpis = [
          { id: 'kpi-1', smartId: 'smart-1', name: 'Specialized SGBV Investigation Capacity', type: 'Quantitative (#)', baselineValue: '', targetValue: '', source: '', frequency: 'Quarterly', responsible: '' },
          { id: 'kpi-2', smartId: 'smart-2', name: 'Digital Case Intake Tracking Rate', type: 'Quantitative (%)', baselineValue: '', targetValue: '', source: '', frequency: 'Monthly', responsible: '' }
        ];
      }
      nextLab.module2.reflection = nextLab.module2.reflection || { q1Experience: '', q2StrategicPrioritisation: '', q3LocalOwnership: '' };
    } else if (lessonNumber === 3) {
      nextLab.module3 = nextLab.module3 || {};
      nextLab.module3.logframe = nextLab.module3.logframe || { impact: { narrative: '', indicators: '', verification: '', assumptions: '' }, outcomes: [], outputs: [] };
      if (!Array.isArray(nextLab.module3.logframe.outcomes) || nextLab.module3.logframe.outcomes.length === 0) {
        nextLab.module3.logframe.outcomes = [{ id: 'out-1', narrative: '', indicators: '', verification: '', assumptions: '' }];
      }
      nextLab.module3.contingency = nextLab.module3.contingency || {};
      nextLab.module3.reflection = nextLab.module3.reflection || { q1Experience: '', q2PlanningHierarchy: '', q3RiskPreparedness: '' };
    } else {
      const mKey = 'module' + lessonNumber;
      nextLab[mKey] = nextLab[mKey] || {};
      nextLab[mKey].reflection = nextLab[mKey].reflection || {};
    }
  }

  function setByPath(obj, pathStr, val) {
    const parts = pathStr.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part === '__proto__' || part === 'constructor' || part === 'prototype') return;
      const key = Array.isArray(cur) ? Number(part) : part;
      if (cur[key] == null || typeof cur[key] !== 'object') cur[key] = {};
      cur = cur[key];
    }
    const leaf = parts[parts.length - 1];
    if (leaf === '__proto__' || leaf === 'constructor' || leaf === 'prototype') return;
    cur[Array.isArray(cur) ? Number(leaf) : leaf] = val;
  }

  function applyHandoffToLab(lessonNumber, lessonDrafts, existingLabState, options) {
    const allowOverwrite = Boolean(options && options.allowOverwrite);
    const num = Number(lessonNumber);
    const preBackup = existingLabState && typeof existingLabState === 'object' ? cloneJson(existingLabState) : null;
    const nextLabState = existingLabState && typeof existingLabState === 'object' ? cloneJson(existingLabState) : { version: '1.0.0' };
    ensureModuleSkeleton(nextLabState, num);

    const rows = buildMapping(num, lessonDrafts, existingLabState);
    const writtenFields = [];
    const skippedConflicts = [];

    for (const r of rows) {
      if (!r.hasDraft) continue;
      if (r.willConflict && !allowOverwrite) {
        skippedConflicts.push(r.targetLabel);
        continue;
      }
      setByPath(nextLabState, r.targetPath, r.draftText);
      writtenFields.push(r.targetLabel);
    }

    if (num === 2 && writtenFields.some(w => w.includes('Objective 1')) && nextLabState.module2?.smartObjectives?.[0]) {
      const so = nextLabState.module2.smartObjectives[0];
      so.fullStatement = [so.specific, so.measurable, so.achievable, so.relevant, so.timeBound].filter(Boolean).join(' · ').slice(0, MAX_TEXT);
    }

    return { nextLabState, preBackup, writtenFields, skippedConflicts };
  }

  function formatHandoffText(lessonNumber, lessonTitle, lessonDrafts, currentLabState) {
    const meta = MODULE_META[Number(lessonNumber)];
    if (!meta) return '';
    const rows = buildMapping(lessonNumber, lessonDrafts, currentLabState);
    const lines = [
      'CARANA CBD E-LEARNING — PRACTICAL WORKBENCH HANDOFF SHEET',
      'Source lesson: Lesson ' + lessonNumber + ' — ' + lessonTitle,
      'Target workbench: ' + meta.title + ' (' + meta.targetSummary + ')',
      'Governance note: Browser-local preparation aid only; not automatically graded or verified.',
      ''
    ];
    for (const r of rows) {
      lines.push('--- ' + r.sourceLabel + ' → ' + r.targetLabel + ' ---');
      lines.push('Lesson draft: ' + (r.hasDraft ? r.draftText : '(not yet drafted in this lesson)'));
      if (r.hasExistingLearnerText) lines.push('Existing Module ' + lessonNumber + ' workbench entry: ' + r.existingText);
      lines.push('');
    }
    return lines.join('\n');
  }

  function readLabSafe(storage) {
    try {
      const raw = storage.getItem(LAB_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function shouldShowOnScreen(lessonNumber, screenId) {
    return HANDOFF_SCREENS[Number(lessonNumber)] === screenId;
  }

  function renderHandoffSection(lesson, lessonDrafts, currentLabState) {
    const num = Number(lesson.number);
    const meta = MODULE_META[num];
    if (!meta) return '';
    const rows = buildMapping(num, lessonDrafts, currentLabState);
    const draftedCount = rows.filter(r => r.hasDraft).length;
    const conflictCount = rows.filter(r => r.willConflict).length;

    return '<section class="handoff-card" aria-labelledby="handoff-heading">' +
      '<span class="eyebrow">Practical workbench handoff</span>' +
      '<h2 id="handoff-heading">Reviewable transfer to ' + esc(meta.title) + '</h2>' +
      '<p>Compare what you drafted in Lesson ' + num + ' against the corresponding fields inside <code>module' + num + '.html</code>. Opening the workbench never changes your saved workbench data unless you explicitly stage selected fields below.</p>' +
      '<p class="status">' + draftedCount + ' of ' + rows.length + ' mapped prompt field(s) drafted in Lesson ' + num +
      (conflictCount > 0 ? ' · ' + conflictCount + ' field(s) already contain custom workbench text (preserved by default).' : '.') + '</p>' +
      '<div class="table-scroll"><table class="handoff-table"><thead><tr>' +
      '<th scope="col">Lesson ' + num + ' draft field</th>' +
      '<th scope="col">Your current draft</th>' +
      '<th scope="col">Target workbench field & status</th>' +
      '</tr></thead><tbody>' +
      rows.map(r =>
        '<tr>' +
        '<th scope="row">' + esc(r.sourceLabel) + '</th>' +
        '<td>' + (r.hasDraft ? '<div class="handoff-snippet">' + esc(r.draftText) + '</div>' : '<span class="muted">No draft saved yet</span>') + '</td>' +
        '<td><strong>' + esc(r.targetLabel) + '</strong><br><span class="status">' +
        (r.hasExistingLearnerText ? (r.willConflict ? 'Has existing learner entry (protected unless overwrite opted in)' : 'Matches existing workbench text') : 'Empty or curriculum placeholder in workbench') +
        '</span></td>' +
        '</tr>'
      ).join('') +
      '</tbody></table></div>' +
      '<div class="handoff-actions">' +
      '<button type="button" id="handoff-copy" class="small-btn">Copy handoff sheet</button>' +
      '<button type="button" id="handoff-download" class="small-btn">Download handoff note (.txt)</button>' +
      '<button type="button" id="handoff-preview-btn" class="small-btn"' + (draftedCount === 0 ? ' disabled' : '') + '>Preview copy to Module ' + num + ' workbench</button>' +
      '<a class="action" href="' + esc(lesson.activity || meta.url) + '" target="_blank" rel="noopener noreferrer">Open original Lesson ' + num + ' workbench ↗</a>' +
      '</div>' +
      '<div id="handoff-preview-box" class="restore-preview" hidden></div>' +
      '<p id="handoff-status" class="status" role="status"></p>' +
      '</section>';
  }

  function mountHandoffSection(opts) {
    const doc = opts.doc || document;
    const storage = opts.storage || global.localStorage;
    const lesson = opts.lesson;
    const drafts = opts.lessonDrafts;
    const downloadFn = opts.downloadFile;
    const onRefresh = opts.onRefresh;
    const num = Number(lesson.number);

    const statusEl = doc.getElementById('handoff-status');
    const previewBox = doc.getElementById('handoff-preview-box');
    const copyBtn = doc.getElementById('handoff-copy');
    const dlBtn = doc.getElementById('handoff-download');
    const previewBtn = doc.getElementById('handoff-preview-btn');
    if (!statusEl) return;

    if (copyBtn) {
      copyBtn.onclick = async () => {
        const text = formatHandoffText(num, lesson.title, drafts, readLabSafe(storage));
        try {
          if (global.navigator?.clipboard?.writeText) {
            await global.navigator.clipboard.writeText(text);
            statusEl.textContent = 'Copied structured Lesson ' + num + ' handoff sheet to clipboard.';
          } else {
            statusEl.textContent = 'Clipboard unavailable here; use Download handoff note (.txt).';
          }
        } catch (_) {
          statusEl.textContent = 'Clipboard blocked; use Download handoff note (.txt).';
        }
      };
    }

    if (dlBtn) {
      dlBtn.onclick = () => {
        const text = formatHandoffText(num, lesson.title, drafts, readLabSafe(storage));
        if (typeof downloadFn === 'function') {
          downloadFn('carana-lesson' + num + '-handoff-note.txt', text, 'text/plain');
          statusEl.textContent = 'Downloaded Lesson ' + num + ' handoff note locally.';
        }
      };
    }

    if (previewBtn && previewBox) {
      previewBtn.onclick = () => {
        const currentLab = readLabSafe(storage);
        const rows = buildMapping(num, drafts, currentLab);
        const populated = rows.filter(r => r.hasDraft);
        const conflicts = populated.filter(r => r.willConflict);
        let hasUndoBackup = false;
        try { hasUndoBackup = Boolean(storage.getItem(LAB_BACKUP_KEY)); } catch (_) {}

        previewBox.hidden = false;
        previewBox.innerHTML =
          '<h3>Dry-run workbench transfer preview (Module ' + num + ')</h3>' +
          '<p>An automatic backup of existing <code>carana_cbd_lab_v1</code> data will be saved before copying.</p>' +
          '<ul class="restore-list">' +
          populated.map(r =>
            '<li><strong>' + esc(r.targetLabel) + '</strong>: ' +
            (r.willConflict ? 'Conflict detected — will skip unless overwrite is checked.' : 'Ready to populate cleanly.') +
            '</li>'
          ).join('') +
          '</ul>' +
          (conflicts.length > 0
            ? '<label class="handoff-optin"><input type="checkbox" id="handoff-overwrite"> Explicitly overwrite ' + conflicts.length + ' existing workbench field(s) listed above (a pre-transfer backup is kept)</label>'
            : '') +
          '<div class="restore-actions">' +
          '<button type="button" id="handoff-confirm" class="primary">Copy approved fields into Module ' + num + '</button>' +
          (hasUndoBackup ? '<button type="button" id="handoff-undo">Undo last transfer</button>' : '') +
          '<button type="button" id="handoff-cancel">Cancel</button>' +
          '</div>';

        doc.getElementById('handoff-cancel').onclick = () => {
          previewBox.hidden = true;
          previewBox.innerHTML = '';
        };

        const confirmBtn = doc.getElementById('handoff-confirm');
        if (confirmBtn) {
          confirmBtn.onclick = () => {
            const allowOverwrite = Boolean(doc.getElementById('handoff-overwrite')?.checked);
            const res = applyHandoffToLab(num, drafts, readLabSafe(storage), { allowOverwrite });
            try {
              if (res.preBackup) {
                storage.setItem(LAB_BACKUP_KEY, JSON.stringify(res.preBackup));
              } else {
                storage.setItem(LAB_BACKUP_KEY, JSON.stringify({ _emptyBeforeHandoff: true }));
              }
              storage.setItem(LAB_KEY, JSON.stringify(res.nextLabState));
              previewBox.hidden = true;
              const msg = 'Staged ' + res.writtenFields.length + ' field(s) into Module ' + num + ' workbench' +
                (res.skippedConflicts.length ? ' (' + res.skippedConflicts.length + ' existing field(s) preserved untouched).' : '.') +
                ' Open Module ' + num + ' to review and refine.';
              if (typeof onRefresh === 'function') onRefresh(msg);
              else statusEl.textContent = msg;
            } catch (_) {
              statusEl.textContent = 'Browser storage prevented writing to workbench storage; download your handoff note instead.';
            }
          };
        }

        const undoBtn = doc.getElementById('handoff-undo');
        if (undoBtn) {
          undoBtn.onclick = () => {
            try {
              const rawPrev = storage.getItem(LAB_BACKUP_KEY);
              if (!rawPrev) return;
              const prev = JSON.parse(rawPrev);
              if (prev && prev._emptyBeforeHandoff) storage.removeItem(LAB_KEY);
              else storage.setItem(LAB_KEY, JSON.stringify(prev));
              storage.removeItem(LAB_BACKUP_KEY);
              if (typeof onRefresh === 'function') onRefresh('Rolled back last Module ' + num + ' handoff transfer.');
              else statusEl.textContent = 'Rolled back last transfer.';
            } catch (_) {
              statusEl.textContent = 'Unable to restore prior workbench backup cleanly.';
            }
          };
        }
      };
    }
  }

  const api = {
    LAB_KEY,
    LAB_BACKUP_KEY,
    shouldShowOnScreen,
    buildMapping,
    applyHandoffToLab,
    formatHandoffText,
    readLabSafe,
    renderHandoffSection,
    mountHandoffSection
  };

  global.CARANA_WORKBENCH_HANDOFF = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
