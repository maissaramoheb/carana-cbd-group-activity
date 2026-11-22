/* Formative construction and reasoning tools. No text grading, remote calls or official keys. */
(function (global) {
  'use strict';
  const MAX_CHARS = 1200;
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function getI18n() {
    return (typeof global !== 'undefined' && global.CARANA_I18N) || (typeof globalThis !== 'undefined' && globalThis.CARANA_I18N) || null;
  }
  function lt(key, vars, fallback) {
    const i18n = getI18n();
    if (i18n && i18n.getLang() !== 'en') return i18n.t('learningTools.' + key, vars, fallback);
    return fallback;
  }
  function ltRaw(key) {
    const i18n = getI18n();
    if (!i18n || i18n.getLang() === 'en') return undefined;
    const pack = i18n.getPack('ui');
    let cur = pack && pack.learningTools;
    for (const part of String(key).split('.')) {
      if (!cur || typeof cur !== 'object') return undefined;
      cur = cur[part];
    }
    return cur;
  }
  function getRiskStrategy(key) {
    const base = RISK_STRATEGIES[key] || RISK_STRATEGIES.prevent;
    const loc = ltRaw('strategies.' + (RISK_STRATEGIES[key] ? key : 'prevent'));
    return loc && loc.label ? loc : base;
  }

  const RISK_STRATEGIES = {
    prevent: {
      label: 'Prevent / reduce likelihood',
      guidance: 'Address preconditions, mandate clarity, or counterpart bottlenecks early so disruption is less likely to occur.'
    },
    mitigate: {
      label: 'Mitigate operational impact',
      guidance: 'Protect essential public-safety and human-rights safeguards so critical progress survives partial disruption.'
    },
    contingency: {
      label: 'Prepare contingency & escalation trigger',
      guidance: 'Define the observable trigger, pre-agreed fallback path, and responsible owner before committing irreversible resources.'
    }
  };

  function rank(exercise, weights) {
    const normalized = exercise.criteria.map((_, i) => {
      const n = Number(weights && weights[i] !== undefined ? weights[i] : 1);
      return Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : 1;
    });
    const rows = exercise.alternatives.map((a, idx) => ({
      label: a.label,
      score: a.ratings.reduce((n, r, i) => n + r * (normalized[i] ?? 1), 0),
      constraint: a.constraint,
      _idx: idx
    }));
    rows.sort((a, b) => b.score - a.score || a._idx - b._idx);
    const counts = new Map();
    rows.forEach(r => counts.set(r.score, (counts.get(r.score) || 0) + 1));
    let currentRank = 1;
    return rows.map((r, idx) => {
      if (idx > 0 && r.score < rows[idx - 1].score) currentRank = idx + 1;
      return {
        label: r.label,
        score: r.score,
        constraint: r.constraint,
        rankPosition: currentRank,
        tied: counts.get(r.score) > 1
      };
    });
  }

  function validDraft(exercise, draft = {}) {
    const result = {};
    if (!draft || typeof draft !== 'object') return result;
    if (exercise.type === 'builder') {
      exercise.fields.forEach((f, i) => {
        if (typeof draft[i] === 'string') result[i] = draft[i].slice(0, MAX_CHARS);
      });
    }
    if (exercise.type === 'classify') {
      exercise.items.forEach((_, i) => {
        if (Number.isInteger(draft[i]) && draft[i] >= 0 && draft[i] < exercise.categories.length) result[i] = draft[i];
      });
    }
    if (exercise.type === 'priority') {
      exercise.criteria.forEach((_, i) => {
        if (Number.isInteger(draft[i]) && draft[i] >= 0 && draft[i] <= 5) result[i] = draft[i];
      });
      if (Array.isArray(draft.snapshot) && draft.snapshot.length === exercise.criteria.length &&
          draft.snapshot.every(v => Number.isInteger(v) && v >= 0 && v <= 5)) {
        result.snapshot = draft.snapshot.slice();
      }
    }
    if (exercise.type === 'risk') {
      for (const k of ['likelihood', 'impact']) {
        if (Number.isInteger(draft[k]) && draft[k] >= 1 && draft[k] <= 3) result[k] = draft[k];
      }
      if (typeof draft.strategy === 'string' && RISK_STRATEGIES[draft.strategy]) {
        result.strategy = draft.strategy;
      }
    }
    return result;
  }

  function html(x) {
    const prefix = '<section class="applied-lab" aria-labelledby="lab-title"><span class="eyebrow">' + esc(lt('eyebrow', null, 'Practise · independently authored example')) + '</span><h2 id="lab-title">' + esc(x.title) + '</h2><p>' + esc(x.context) + '</p>';
    if (x.type === 'builder') {
      const zeroCount = lt('charCount', { len: 0, max: MAX_CHARS }, '0 / ' + MAX_CHARS + ' characters');
      return prefix +
        '<p class="status">' + esc(lt('builderStatus', null, 'Use invented or non-sensitive details. Drafts stay in this browser and are included in your progress export. Text is not automatically graded or approved.')) + '</p>' +
        '<div class="draft-grid">' + x.fields.map((f, i) =>
          '<div class="draft-field-card">' +
          '<label for="lab-field-' + i + '">' + esc(f.label) + '</label>' +
          '<p class="field-hint" id="lab-hint-' + i + '">' + esc(f.prompt) + '</p>' +
          '<textarea id="lab-field-' + i + '" data-field="' + i + '" dir="auto" maxlength="' + MAX_CHARS + '" rows="3" aria-describedby="lab-hint-' + i + ' lab-count-' + i + '"></textarea>' +
          '<div class="field-meta"><span class="char-count" id="lab-count-' + i + '" aria-live="off">' + esc(zeroCount) + '</span></div>' +
          '<p class="field-check" id="lab-check-item-' + i + '" hidden><strong>' + esc(lt('selfCheckLabel', null, 'Self-check criterion:')) + '</strong> ' + esc(f.check || x.review) + '</p>' +
          '</div>'
        ).join('') + '</div>' +
        '<div id="lab-archive-slot"></div>' +
        '<button type="button" id="lab-check">' + esc(lt('openPrompts', null, 'Open self-review prompts')) + '</button>' +
        '<div id="lab-feedback" class="feedback self-review" role="status" hidden></div>' +
        '<details class="worked-example"><summary>' + esc(lt('workedSummary', null, 'Compare with an illustrative approach')) + '</summary><p>' + esc(x.example) + '</p><p><strong>' + esc(lt('debriefLabel', null, 'Debrief:')) + '</strong> ' + esc(x.debrief) + '</p></details></section>';
    }
    if (x.type === 'classify') {
      return prefix +
        '<div class="classification">' + x.items.map((item, i) =>
          '<div class="classify-row"><label for="lab-class-' + i + '">' + esc(item.text) + '</label><select id="lab-class-' + i + '" data-class="' + i + '"><option value="">' + esc(lt('chooseCat', null, 'Choose a category')) + '</option>' +
          x.categories.map((c, j) => '<option value="' + j + '">' + esc(c) + '</option>').join('') +
          '</select><p id="lab-item-' + i + '" class="quiz-hint" hidden></p></div>'
        ).join('') + '</div>' +
        '<div id="lab-archive-slot"></div>' +
        '<button type="button" id="lab-check">' + esc(lt('checkReasoning', null, 'Check my reasoning')) + '</button>' +
        '<div id="lab-feedback" class="feedback" role="status" hidden></div></section>';
    }
    if (x.type === 'priority') {
      return prefix +
        '<p class="status">' + esc(lt('priorityNote', null, 'Invented ratings, not the official participant scoring chart. Move a weighting to examine sensitivity; a high total never overrides a prerequisite or tie.')) + '</p>' +
        '<div class="weights">' + x.criteria.map((c, i) =>
          '<label>' + esc(c) + ' <output id="weight-' + i + '">1</output><input aria-label="' + esc(lt('weightingAria', { name: c }, c + ' weighting')) + '" type="range" min="0" max="5" value="1" data-weight="' + i + '"></label>'
        ).join('') + '</div>' +
        '<div class="priority-actions">' +
        '<button type="button" id="priority-save-snapshot" class="small-btn">' + esc(lt('saveSnapshot', null, 'Save current weights as Snapshot A')) + '</button>' +
        '<button type="button" id="priority-reset" class="small-btn">' + esc(lt('resetWeights', null, 'Reset to equal weights (1)')) + '</button>' +
        '<button type="button" id="priority-clear-snapshot" class="small-btn" hidden>' + esc(lt('clearSnapshot', null, 'Clear Snapshot A')) + '</button>' +
        '</div>' +
        '<div class="table-scroll" role="region" tabindex="0" aria-label="' + esc(lt('priorityCaption', null, 'Illustrative options, ratings and constraints')) + '"><table><caption>' + esc(lt('priorityCaption', null, 'Illustrative options, ratings and constraints')) + '</caption><thead><tr><th scope="col">' + esc(lt('colOption', null, 'Option')) + '</th>' +
        x.criteria.map(c => '<th scope="col">' + esc(c) + '</th>').join('') +
        '<th scope="col">' + esc(lt('colConstraint', null, 'Constraint')) + '</th></tr></thead><tbody>' +
        x.alternatives.map(a => '<tr><th scope="row">' + esc(a.label) + '</th>' + a.ratings.map(r => '<td>' + r + '</td>').join('') + '<td>' + esc(a.constraint) + '</td></tr>').join('') +
        '</tbody></table></div>' +
        '<div id="priority-result" class="reveal" aria-live="off"></div>' +
        '<p id="priority-live" class="status" role="status"></p>' +
        '<div id="priority-compare" class="priority-compare" hidden></div>' +
        '<div id="lab-archive-slot"></div>' +
        '<p><strong>' + esc(lt('discussLabel', null, 'Discuss:')) + '</strong> ' + esc(x.debrief) + '</p></section>';
    }
    if (x.type === 'risk') {
      const rLevels = ltRaw('riskLevels');
      const lv = Array.isArray(rLevels) && rLevels.length === 3 ? rLevels : ['1 · low', '2 · medium', '3 · high'];
      return prefix +
        '<div class="risk-inputs"><label>' + esc(lt('likelihood', null, 'Likelihood')) + '<select id="risk-likelihood"><option value="1">' + esc(lv[0]) + '</option><option value="2" selected>' + esc(lv[1]) + '</option><option value="3">' + esc(lv[2]) + '</option></select></label>' +
        '<label>' + esc(lt('impact', null, 'Impact')) + '<select id="risk-impact"><option value="1">' + esc(lv[0]) + '</option><option value="2" selected>' + esc(lv[1]) + '</option><option value="3">' + esc(lv[2]) + '</option></select></label>' +
        '<label>' + esc(lt('strategyLabel', null, 'Primary response strategy')) + '<select id="risk-strategy">' +
        Object.keys(RISK_STRATEGIES).map(k => '<option value="' + k + '">' + esc(getRiskStrategy(k).label) + '</option>').join('') +
        '</select></label></div>' +
        '<div id="risk-grid" class="risk-grid" aria-label="' + esc(lt('riskGridAria', null, 'Three by three likelihood and impact matrix')) + '">' +
        [3, 2, 1].flatMap(impact => [1, 2, 3].map(likelihood => '<span data-risk="' + likelihood + '-' + impact + '">' + esc(lt('riskCell', { l: likelihood, i: impact }, 'Likelihood ' + likelihood + '<br>Impact ' + impact)).replace(/&lt;br\s*\/?&gt;/gi, '<br>') + '</span>')).join('') +
        '</div><div id="risk-result" class="reveal" role="status"></div>' +
        '<div id="lab-archive-slot"></div>' +
        '<p><strong>' + esc(lt('debriefLabel', null, 'Debrief:')) + '</strong> ' + esc(x.debrief) + '</p></section>';
    }
    return '';
  }

  function formatArchiveValue(x, key, val) {
    if (x.type === 'builder') {
      const label = x.fields?.[Number(key)]?.label || ('Field ' + (Number(key) + 1));
      return { label, display: String(val) };
    }
    if (x.type === 'classify') {
      const itemText = x.items?.[Number(key)]?.text || ('Item ' + (Number(key) + 1));
      const catText = x.categories?.[val] || String(val);
      return { label: itemText, display: catText };
    }
    if (x.type === 'priority') {
      if (key === 'snapshot') return { label: lt('archiveSnapLabel', null, 'Saved snapshot weights'), display: Array.isArray(val) ? val.join(', ') : String(val) };
      const crit = x.criteria?.[Number(key)] || ('Criterion ' + (Number(key) + 1));
      return { label: lt('archiveWeightLabel', { crit }, crit + ' weighting'), display: String(val) + ' / 5' };
    }
    if (x.type === 'risk') {
      if (key === 'strategy') return { label: lt('archiveStratLabel', null, 'Response strategy'), display: getRiskStrategy(val)?.label || String(val) };
      return { label: key === 'likelihood' ? lt('likelihood', null, 'Likelihood') : lt('impact', null, 'Impact'), display: String(val) + ' / 3' };
    }
    return { label: String(key), display: String(val) };
  }

  function summarizePriority(x, weights) {
    const cleanWeights = x.criteria.map((_, i) => {
      const n = Number(weights && weights[i] !== undefined ? weights[i] : 1);
      return Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : 1;
    });
    const allZero = cleanWeights.every(w => w === 0);
    const ranked = rank(x, cleanWeights);
    if (allZero) {
      return {
        allZero: true,
        hasTies: false,
        ranked,
        text: lt('allZeroText', null, 'All criterion weightings are set to 0. Weighted ranking is paused because no criterion carries weight; raise at least one weighting above 0 or compare prerequisites and constraints directly.')
      };
    }
    const tiedGroups = [];
    const seenTieScore = new Set();
    ranked.forEach(item => {
      if (item.tied && !seenTieScore.has(item.score)) {
        seenTieScore.add(item.score);
        const names = ranked.filter(r => r.score === item.score).map(r => r.label).join(lt('tieSummaryJoin', null, ' and '));
        tiedGroups.push(lt('tieGroupTpl', { rank: item.rankPosition, score: item.score, names }, 'Tie at rank #' + item.rankPosition + ' (' + item.score + ' weighted points): ' + names + ' — decide on prerequisites and constraints.'));
      }
    });
    const linesText = ranked
      .map(a => lt('lineItemTpl', {
        prefix: a.tied ? lt('linePrefixTie', { rank: a.rankPosition }, 'Tie #' + a.rankPosition) : lt('linePrefixRank', { rank: a.rankPosition }, '#' + a.rankPosition),
        label: a.label,
        score: a.score,
        constraint: a.constraint
      }, (a.tied ? 'Tie #' + a.rankPosition : '#' + a.rankPosition) + ' ' + a.label + ': ' + a.score + ' weighted points. ' + a.constraint))
      .join(' ');
    return {
      allZero: false,
      hasTies: tiedGroups.length > 0,
      tieSummary: tiedGroups.join(' '),
      ranked,
      text: (tiedGroups.length > 0 ? tiedGroups.join(' ') + ' ' : '') + linesText
    };
  }

  function formatRiskAnalysis(likelihood, impact, strategyKey) {
    const l = Math.max(1, Math.min(3, Number(likelihood) || 2));
    const i = Math.max(1, Math.min(3, Number(impact) || 2));
    const strat = getRiskStrategy(strategyKey);
    const asymmetry = l !== i
      ? lt('riskAsym', { l, i, prod: l * i }, ' Note why (' + l + ',' + i + ') differs from (' + i + ',' + l + ') despite product ' + (l * i) + ': high impact requires contingency readiness even when likelihood is low, while high likelihood requires upstream prevention.')
      : '';
    const severity = i === 3
      ? lt('riskSevere', null, 'A severe consequence still needs attention even if unlikely.')
      : lt('riskGeneral', null, 'Consider both prevention and impact reduction, and identify who will review the response.');
    return lt('riskSummary', {
      l, i, prod: l * i, severity, asym: asymmetry, stratLabel: strat.label, stratGuidance: strat.guidance
    }, 'Selected likelihood ' + l + ', impact ' + i + '. Illustrative product ' + (l * i) +
      '; this is a discussion aid, not an authorised acceptance threshold. ' +
      severity + asymmetry + ' Selected response focus (' + strat.label + '): ' + strat.guidance +
      ' Carry trigger thresholds and ownership into your contingency plan.');
  }

  function renderArchivedDrafts(x, saved, archivedDrafts, doc, applyHandler) {
    const slot = doc.getElementById('lab-archive-slot');
    if (!slot || !Array.isArray(archivedDrafts) || archivedDrafts.length === 0) return;

    const panel = doc.createElement('details');
    panel.className = 'archived-drafts';
    const summary = doc.createElement('summary');
    summary.textContent = lt('archiveSummary', { count: archivedDrafts.length }, 'Previous-version draft archive (' + archivedDrafts.length + ' saved revision' + (archivedDrafts.length > 1 ? 's' : '') + ')');
    panel.appendChild(summary);

    const notice = doc.createElement('p');
    notice.className = 'status';
    notice.textContent = lt('archiveNotice', null, 'Read-only record from an earlier content version. Inspect it here or copy items into your current draft explicitly; nothing overwrites your active text automatically.');
    panel.appendChild(notice);

    archivedDrafts.forEach((entry, revIdx) => {
      const card = doc.createElement('div');
      card.className = 'archived-revision';
      const head = doc.createElement('div');
      head.className = 'archived-rev-head';
      const dateStr = entry.archivedAt ? entry.archivedAt.slice(0, 10) : '';
      head.textContent = lt('archiveRevHead', { ver: entry.contentVersion }, 'Version: ' + entry.contentVersion) +
        (dateStr ? lt('archiveArchivedSuffix', { date: dateStr }, ' · Archived ' + dateStr) : '');
      card.appendChild(head);

      const keys = Object.keys(entry.fields || {});
      keys.forEach(k => {
        const { label, display } = formatArchiveValue(x, k, entry.fields[k]);
        const row = doc.createElement('div');
        row.className = 'archived-field';
        const strong = doc.createElement('strong');
        strong.textContent = label;
        const pre = doc.createElement('p');
        pre.className = 'archived-text';
        pre.setAttribute('dir', 'auto');
        pre.textContent = display;
        row.appendChild(strong);
        row.appendChild(pre);

        if (x.type === 'builder' && x.fields?.[Number(k)]) {
          const btnWrap = doc.createElement('div');
          btnWrap.className = 'archived-field-actions';
          const copyBtn = doc.createElement('button');
          copyBtn.type = 'button';
          copyBtn.className = 'archived-copy-btn';
          copyBtn.dataset.archiveRev = String(revIdx);
          copyBtn.dataset.archiveField = String(k);
          copyBtn.textContent = lt('copyIntoDraft', null, 'Copy into current draft');
          const msgSpan = doc.createElement('span');
          msgSpan.className = 'status archived-copy-status';
          copyBtn.onclick = () => {
            const currentVal = String(saved[k] || '');
            if (currentVal === display) {
              msgSpan.textContent = lt('alreadyMatches', null, 'Current field already matches this archived text.');
              return;
            }
            if (currentVal.trim() && copyBtn.dataset.confirmOverwrite !== 'true') {
              copyBtn.dataset.confirmOverwrite = 'true';
              copyBtn.textContent = lt('confirmOverwriteBtn', null, 'Confirm overwrite current field');
              msgSpan.textContent = lt('confirmOverwrite', null, 'Current field has text; click again to confirm replacing it.');
              return;
            }
            copyBtn.dataset.confirmOverwrite = 'false';
            copyBtn.textContent = lt('copyIntoDraft', null, 'Copy into current draft');
            applyHandler({ [k]: display });
            msgSpan.textContent = lt('copiedIntoActive', null, 'Copied into active field.');
          };
          btnWrap.appendChild(copyBtn);
          btnWrap.appendChild(msgSpan);
          row.appendChild(btnWrap);
        }
        card.appendChild(row);
      });

      if (x.type === 'builder' && keys.length > 0) {
        const fillEmptyBtn = doc.createElement('button');
        fillEmptyBtn.type = 'button';
        fillEmptyBtn.className = 'archived-fill-empty';
        fillEmptyBtn.textContent = lt('copyEmptyOnly', null, 'Copy into empty fields only');
        const revStatus = doc.createElement('span');
        revStatus.className = 'status archived-copy-status';
        fillEmptyBtn.onclick = () => {
          const patch = {};
          let copied = 0;
          for (const k of keys) {
            if (x.fields?.[Number(k)] && !String(saved[k] || '').trim()) {
              patch[k] = String(entry.fields[k]);
              copied++;
            }
          }
          if (copied === 0) {
            revStatus.textContent = lt('noEmptyFields', null, 'No empty matching fields to fill; use individual copy buttons to replace.');
            return;
          }
          applyHandler(patch);
          revStatus.textContent = lt('copiedNEmpty', { count: copied }, 'Copied ' + copied + ' field(s) into empty inputs.');
        };
        card.appendChild(fillEmptyBtn);
        card.appendChild(revStatus);
      } else if (x.type !== 'builder' && keys.length > 0) {
        const applyBtn = doc.createElement('button');
        applyBtn.type = 'button';
        applyBtn.className = 'archived-fill-empty';
        applyBtn.textContent = lt('restoreSelections', null, 'Restore archived selections');
        const revStatus = doc.createElement('span');
        revStatus.className = 'status archived-copy-status';
        applyBtn.onclick = () => {
          const hasExisting = Object.keys(saved).length > 0;
          if (hasExisting && applyBtn.dataset.confirmOverwrite !== 'true') {
            applyBtn.dataset.confirmOverwrite = 'true';
            applyBtn.textContent = lt('confirmReplaceSel', null, 'Confirm replace current selections');
            revStatus.textContent = lt('activeSelExist', null, 'Active selections exist; click again to confirm.');
            return;
          }
          applyBtn.dataset.confirmOverwrite = 'false';
          applyBtn.textContent = lt('restoreSelections', null, 'Restore archived selections');
          applyHandler(entry.fields);
          revStatus.textContent = lt('selRestored', null, 'Archived selections restored.');
        };
        card.appendChild(applyBtn);
        card.appendChild(revStatus);
      }

      panel.appendChild(card);
    });

    slot.appendChild(panel);
  }

  function mount(x, draft, onSave, doc = document, opts = {}) {
    const saved = validDraft(x, draft);
    const feedback = doc.getElementById('lab-feedback');

    function updateCounter(el) {
      const idx = el.dataset.field;
      const counter = doc.getElementById('lab-count-' + idx);
      if (!counter) return;
      const len = el.value.length;
      const remaining = MAX_CHARS - len;
      counter.classList.toggle('char-warn', remaining <= 150);
      counter.textContent = len >= MAX_CHARS
        ? lt('charMax', { len: MAX_CHARS, max: MAX_CHARS }, MAX_CHARS + ' / ' + MAX_CHARS + ' characters (maximum local field limit reached)')
        : remaining <= 150
          ? lt('charRem', { len, max: MAX_CHARS, rem: remaining }, len + ' / ' + MAX_CHARS + ' characters (' + remaining + ' remaining)')
          : lt('charCount', { len, max: MAX_CHARS }, len + ' / ' + MAX_CHARS + ' characters');
    }

    if (x.type === 'builder') {
      const fields = [...doc.querySelectorAll('[data-field]')];
      fields.forEach(el => {
        el.value = saved[el.dataset.field] || '';
        updateCounter(el);
        el.oninput = () => {
          saved[el.dataset.field] = el.value.slice(0, MAX_CHARS);
          updateCounter(el);
          onSave(saved);
        };
      });

      doc.getElementById('lab-check').onclick = () => {
        x.fields.forEach((_, i) => {
          const itemCheck = doc.getElementById('lab-check-item-' + i);
          if (itemCheck) itemCheck.hidden = false;
        });
        const missing = x.fields
          .map((f, i) => ({ f, i }))
          .filter(({ i }) => !String(saved[i] || '').trim());
        feedback.hidden = false;
        feedback.innerHTML = '';
        if (missing.length) {
          const lead = doc.createElement('span');
          lead.textContent = lt('openDraftFields', null, 'Draft fields still open: ');
          feedback.appendChild(lead);
          missing.forEach(({ f, i }, idx) => {
            if (idx > 0) feedback.appendChild(doc.createTextNode('; '));
            const jump = doc.createElement('button');
            jump.type = 'button';
            jump.className = 'inline-jump';
            jump.textContent = f.label;
            jump.onclick = () => doc.getElementById('lab-field-' + i)?.focus();
            feedback.appendChild(jump);
          });
          const tail = doc.createElement('span');
          tail.textContent = lt('selfReviewTail', null, '. No judgement score has been assigned. Use the self-check criteria above each field as you draft.');
          feedback.appendChild(tail);
        } else {
          feedback.textContent = lt('allFieldsReady', { review: x.review }, 'All fields contain text; your draft is ready for self-review, not automatically approved or quality-checked. Review each field against its self-check criterion above and compare with the illustrative approach below. ' + x.review);
        }
      };

      renderArchivedDrafts(x, saved, opts?.archivedDrafts, doc, patch => {
        for (const [k, v] of Object.entries(patch)) {
          const el = doc.getElementById('lab-field-' + k);
          if (el) {
            el.value = String(v).slice(0, MAX_CHARS);
            saved[k] = el.value;
            updateCounter(el);
          }
        }
        onSave(saved);
      });
    }

    if (x.type === 'classify') {
      const selects = [...doc.querySelectorAll('[data-class]')];
      selects.forEach(el => {
        el.value = saved[el.dataset.class] ?? '';
        el.onchange = () => {
          if (el.value === '') delete saved[el.dataset.class];
          else saved[el.dataset.class] = +el.value;
          onSave(saved);
        };
      });
      doc.getElementById('lab-check').onclick = () => {
        let correct = 0, unanswered = 0;
        x.items.forEach((item, i) => {
          const el = doc.getElementById('lab-item-' + i);
          el.hidden = false;
          if (saved[i] === undefined) {
            el.textContent = lt('chooseCatHint', null, 'Choose a category before comparing your reasoning.');
            unanswered++;
          } else {
            const ok = saved[i] === item.answer;
            if (ok) correct++;
            el.textContent = (ok ? lt('itemFits', null, 'This fits. ') : lt('reconsiderCat', null, 'Reconsider the distinction. ')) + item.feedback;
          }
        });
        feedback.hidden = false;
        feedback.textContent = unanswered
          ? lt('itemsNeedChoice', { count: unanswered }, unanswered + ' item(s) still need a choice.')
          : lt('classifyScoreSummary', { correct, total: x.items.length }, correct + ' of ' + x.items.length + ' classifications fit the teaching example. Explain the evidence for your choices; this does not alter quiz scores.');
      };
      renderArchivedDrafts(x, saved, opts?.archivedDrafts, doc, patch => {
        const clean = validDraft(x, patch);
        for (const k of Object.keys(saved)) delete saved[k];
        Object.assign(saved, clean);
        selects.forEach(el => { el.value = saved[el.dataset.class] ?? ''; });
        onSave(saved);
      });
    }

    if (x.type === 'priority') {
      const inputs = [...doc.querySelectorAll('[data-weight]')];
      const resultEl = doc.getElementById('priority-result');
      const liveEl = doc.getElementById('priority-live');
      const compareEl = doc.getElementById('priority-compare');
      const saveSnapBtn = doc.getElementById('priority-save-snapshot');
      const clearSnapBtn = doc.getElementById('priority-clear-snapshot');
      const resetBtn = doc.getElementById('priority-reset');

      const renderCompare = currentSummary => {
        if (!compareEl || !clearSnapBtn) return;
        const snapWeights = Array.isArray(saved.snapshot) && saved.snapshot.length === x.criteria.length ? saved.snapshot : null;
        clearSnapBtn.hidden = !snapWeights;
        if (!snapWeights) {
          compareEl.hidden = true;
          compareEl.innerHTML = '';
          return;
        }
        const snapSummary = summarizePriority(x, snapWeights);
        compareEl.hidden = false;
        compareEl.innerHTML =
          '<h3>' + esc(lt('snapVsCurrent', null, 'Snapshot A vs Current weightings')) + '</h3>' +
          '<p class="status">' + esc(lt('snapLegend', { snap: snapWeights.join(', '), cur: inputs.map(el => el.value).join(', ') }, 'Snapshot A: [' + snapWeights.join(', ') + '] · Current: [' + inputs.map(el => el.value).join(', ') + ']')) + '</p>' +
          '<div class="table-scroll" role="region" tabindex="0"><table><thead><tr><th scope="col">' + esc(lt('colOption', null, 'Option')) + '</th><th scope="col">' + esc(lt('colSnapA', null, 'Snapshot A')) + '</th><th scope="col">' + esc(lt('colCurrent', null, 'Current')) + '</th><th scope="col">' + esc(lt('colShift', null, 'Shift')) + '</th></tr></thead><tbody>' +
          currentSummary.ranked.map(cur => {
            const prev = snapSummary.ranked.find(p => p.label === cur.label) || cur;
            const delta = prev.rankPosition - cur.rankPosition;
            const shiftText = currentSummary.allZero || snapSummary.allZero
              ? lt('zeroWeightPause', null, 'Zero weight pause')
              : (delta > 0 ? lt('shiftUp', { n: delta }, '↑ Up ' + delta) : delta < 0 ? lt('shiftDown', { n: Math.abs(delta) }, '↓ Down ' + Math.abs(delta)) : lt('shiftUnchanged', null, 'Unchanged'));
            const tieLbl = lt('tieTag', null, ' (Tie)');
            const ptsLbl = lt('ptsUnit', null, 'pts');
            const pausedLbl = lt('pausedZero', null, 'Paused (all 0)');
            return '<tr><th scope="row">' + esc(cur.label) + '</th><td>' +
              (snapSummary.allZero ? pausedLbl : '#' + prev.rankPosition + (prev.tied ? tieLbl : '') + ' · ' + prev.score + ' ' + ptsLbl) +
              '</td><td>' +
              (currentSummary.allZero ? pausedLbl : '#' + cur.rankPosition + (cur.tied ? tieLbl : '') + ' · ' + cur.score + ' ' + ptsLbl) +
              '</td><td>' + esc(shiftText) + '</td></tr>';
          }).join('') +
          '</tbody></table></div>';
      };

      const refresh = announceLive => {
        const weights = inputs.map(el => +el.value);
        inputs.forEach((el, i) => {
          doc.getElementById('weight-' + i).textContent = weights[i];
          saved[i] = weights[i];
        });
        const summary = summarizePriority(x, weights);
        resultEl.textContent = summary.text;
        resultEl.classList.toggle('warning', summary.allZero || summary.hasTies);
        if (announceLive && liveEl) {
          liveEl.textContent = summary.allZero
            ? lt('liveAllZero', null, 'All criteria weightings are 0; numeric ranking is paused.')
            : (summary.hasTies
              ? summary.tieSummary
              : lt('liveTopOption', { label: summary.ranked[0].label, score: summary.ranked[0].score }, 'Top weighted option is now ' + summary.ranked[0].label + ' at ' + summary.ranked[0].score + ' weighted points.'));
        }
        renderCompare(summary);
      };

      inputs.forEach(el => {
        el.value = saved[el.dataset.weight] ?? 1;
        el.oninput = () => { refresh(false); onSave(saved); };
        el.onchange = () => { refresh(true); onSave(saved); };
      });
      if (saveSnapBtn) {
        saveSnapBtn.onclick = () => {
          saved.snapshot = inputs.map(el => +el.value);
          refresh(true);
          onSave(saved);
        };
      }
      if (clearSnapBtn) {
        clearSnapBtn.onclick = () => {
          delete saved.snapshot;
          refresh(true);
          onSave(saved);
        };
      }
      if (resetBtn) {
        resetBtn.onclick = () => {
          inputs.forEach((el, i) => { el.value = 1; saved[i] = 1; });
          refresh(true);
          onSave(saved);
        };
      }
      refresh(false);
      renderArchivedDrafts(x, saved, opts?.archivedDrafts, doc, patch => {
        const clean = validDraft(x, patch);
        Object.assign(saved, clean);
        inputs.forEach(el => { el.value = saved[el.dataset.weight] ?? 1; });
        refresh(true);
        onSave(saved);
      });
    }

    if (x.type === 'risk') {
      const likelihood = doc.getElementById('risk-likelihood');
      const impact = doc.getElementById('risk-impact');
      const strategy = doc.getElementById('risk-strategy');
      likelihood.value = saved.likelihood ?? 2;
      impact.value = saved.impact ?? 2;
      if (strategy) strategy.value = saved.strategy || 'prevent';
      const refresh = () => {
        const l = +likelihood.value, i = +impact.value;
        const stratKey = strategy && RISK_STRATEGIES[strategy.value] ? strategy.value : 'prevent';
        saved.likelihood = l;
        saved.impact = i;
        saved.strategy = stratKey;
        doc.querySelectorAll('[data-risk]').forEach(el => {
          const active = el.dataset.risk === l + '-' + i;
          el.classList.toggle('selected', active);
          if (active) el.setAttribute('aria-current', 'true');
          else el.removeAttribute('aria-current');
        });
        doc.getElementById('risk-result').textContent = formatRiskAnalysis(l, i, stratKey);
      };
      for (const input of [likelihood, impact, strategy].filter(Boolean)) {
        input.onchange = () => { refresh(); onSave(saved); };
      }
      refresh();
      renderArchivedDrafts(x, saved, opts?.archivedDrafts, doc, patch => {
        const clean = validDraft(x, patch);
        Object.assign(saved, clean);
        likelihood.value = saved.likelihood ?? 2;
        impact.value = saved.impact ?? 2;
        if (strategy && clean.strategy) strategy.value = clean.strategy;
        refresh();
        onSave(saved);
      });
    }
  }

  const api = { html, mount, validDraft, rank, summarizePriority, formatRiskAnalysis, MAX_CHARS };
  global.CARANA_LEARNING_TOOLS = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
