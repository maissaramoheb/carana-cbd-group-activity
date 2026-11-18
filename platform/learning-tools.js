/* Formative construction and reasoning tools. No text grading, remote calls or official keys. */
(function (global) {
  'use strict';
  const MAX_CHARS = 1200;
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function rank(exercise, weights) {
    return exercise.alternatives.map(a => ({
      label: a.label,
      score: a.ratings.reduce((n, r, i) => n + r * Number(weights[i] ?? 1), 0),
      constraint: a.constraint
    })).sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
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
    }
    if (exercise.type === 'risk') {
      for (const k of ['likelihood', 'impact']) {
        if (Number.isInteger(draft[k]) && draft[k] >= 1 && draft[k] <= 3) result[k] = draft[k];
      }
    }
    return result;
  }

  function html(x) {
    const prefix = '<section class="applied-lab" aria-labelledby="lab-title"><span class="eyebrow">Practise · independently authored example</span><h2 id="lab-title">' + esc(x.title) + '</h2><p>' + esc(x.context) + '</p>';
    if (x.type === 'builder') {
      return prefix +
        '<p class="status">Use invented or non-sensitive details. Drafts stay in this browser and are included in your progress export. Text is not automatically graded or approved.</p>' +
        '<div class="draft-grid">' + x.fields.map((f, i) =>
          '<div class="draft-field-card">' +
          '<label for="lab-field-' + i + '">' + esc(f.label) + '</label>' +
          '<p class="field-hint" id="lab-hint-' + i + '">' + esc(f.prompt) + '</p>' +
          '<textarea id="lab-field-' + i + '" data-field="' + i + '" maxlength="' + MAX_CHARS + '" rows="3" aria-describedby="lab-hint-' + i + ' lab-count-' + i + '"></textarea>' +
          '<div class="field-meta"><span class="char-count" id="lab-count-' + i + '" aria-live="off">0 / ' + MAX_CHARS + ' characters</span></div>' +
          '<p class="field-check" id="lab-check-item-' + i + '" hidden><strong>Self-check criterion:</strong> ' + esc(f.check || x.review) + '</p>' +
          '</div>'
        ).join('') + '</div>' +
        '<div id="lab-archive-slot"></div>' +
        '<button type="button" id="lab-check">Open self-review prompts</button>' +
        '<div id="lab-feedback" class="feedback self-review" role="status" hidden></div>' +
        '<details class="worked-example"><summary>Compare with an illustrative approach</summary><p>' + esc(x.example) + '</p><p><strong>Debrief:</strong> ' + esc(x.debrief) + '</p></details></section>';
    }
    if (x.type === 'classify') {
      return prefix +
        '<div class="classification">' + x.items.map((item, i) =>
          '<div class="classify-row"><label for="lab-class-' + i + '">' + esc(item.text) + '</label><select id="lab-class-' + i + '" data-class="' + i + '"><option value="">Choose a category</option>' +
          x.categories.map((c, j) => '<option value="' + j + '">' + esc(c) + '</option>').join('') +
          '</select><p id="lab-item-' + i + '" class="quiz-hint" hidden></p></div>'
        ).join('') + '</div>' +
        '<div id="lab-archive-slot"></div>' +
        '<button type="button" id="lab-check">Check my reasoning</button>' +
        '<div id="lab-feedback" class="feedback" role="status" hidden></div></section>';
    }
    if (x.type === 'priority') {
      return prefix +
        '<p class="status">Invented ratings, not the official participant scoring chart. Move a weighting to examine sensitivity; a high total never overrides a prerequisite.</p>' +
        '<div class="weights">' + x.criteria.map((c, i) =>
          '<label>' + esc(c) + ' <output id="weight-' + i + '">1</output><input aria-label="' + esc(c) + ' weighting" type="range" min="0" max="5" value="1" data-weight="' + i + '"></label>'
        ).join('') + '</div>' +
        '<div class="table-scroll"><table><caption>Illustrative options, ratings and constraints</caption><thead><tr><th scope="col">Option</th>' +
        x.criteria.map(c => '<th scope="col">' + esc(c) + '</th>').join('') +
        '<th scope="col">Constraint</th></tr></thead><tbody>' +
        x.alternatives.map(a => '<tr><th scope="row">' + esc(a.label) + '</th>' + a.ratings.map(r => '<td>' + r + '</td>').join('') + '<td>' + esc(a.constraint) + '</td></tr>').join('') +
        '</tbody></table></div>' +
        '<div id="priority-result" class="reveal" role="status"></div>' +
        '<div id="lab-archive-slot"></div>' +
        '<p><strong>Discuss:</strong> ' + esc(x.debrief) + '</p></section>';
    }
    if (x.type === 'risk') {
      return prefix +
        '<div class="risk-inputs"><label>Likelihood<select id="risk-likelihood"><option value="1">1 · low</option><option value="2" selected>2 · medium</option><option value="3">3 · high</option></select></label><label>Impact<select id="risk-impact"><option value="1">1 · low</option><option value="2" selected>2 · medium</option><option value="3">3 · high</option></select></label></div>' +
        '<div id="risk-grid" class="risk-grid" aria-label="Three by three likelihood and impact matrix">' +
        [3, 2, 1].flatMap(impact => [1, 2, 3].map(likelihood => '<span data-risk="' + likelihood + '-' + impact + '">Likelihood ' + likelihood + '<br>Impact ' + impact + '</span>')).join('') +
        '</div><div id="risk-result" class="reveal" role="status"></div>' +
        '<div id="lab-archive-slot"></div>' +
        '<p><strong>Debrief:</strong> ' + esc(x.debrief) + '</p></section>';
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
      const crit = x.criteria?.[Number(key)] || ('Criterion ' + (Number(key) + 1));
      return { label: crit + ' weighting', display: String(val) + ' / 5' };
    }
    if (x.type === 'risk') {
      return { label: key === 'likelihood' ? 'Likelihood' : 'Impact', display: String(val) + ' / 3' };
    }
    return { label: String(key), display: String(val) };
  }

  function renderArchivedDrafts(x, saved, archivedDrafts, doc, applyHandler) {
    const slot = doc.getElementById('lab-archive-slot');
    if (!slot || !Array.isArray(archivedDrafts) || archivedDrafts.length === 0) return;

    const panel = doc.createElement('details');
    panel.className = 'archived-drafts';
    const summary = doc.createElement('summary');
    summary.textContent = 'Previous-version draft archive (' + archivedDrafts.length + ' saved revision' + (archivedDrafts.length > 1 ? 's' : '') + ')';
    panel.appendChild(summary);

    const notice = doc.createElement('p');
    notice.className = 'status';
    notice.textContent = 'Read-only record from an earlier content version. Inspect it here or copy items into your current draft explicitly; nothing overwrites your active text automatically.';
    panel.appendChild(notice);

    archivedDrafts.forEach((entry, revIdx) => {
      const card = doc.createElement('div');
      card.className = 'archived-revision';
      const head = doc.createElement('div');
      head.className = 'archived-rev-head';
      head.textContent = 'Version: ' + entry.contentVersion + (entry.archivedAt ? ' · Archived ' + entry.archivedAt.slice(0, 10) : '');
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
          copyBtn.textContent = 'Copy into current draft';
          const msgSpan = doc.createElement('span');
          msgSpan.className = 'status archived-copy-status';
          copyBtn.onclick = () => {
            const currentVal = String(saved[k] || '');
            if (currentVal === display) {
              msgSpan.textContent = 'Current field already matches this archived text.';
              return;
            }
            if (currentVal.trim() && copyBtn.dataset.confirmOverwrite !== 'true') {
              copyBtn.dataset.confirmOverwrite = 'true';
              copyBtn.textContent = 'Confirm overwrite current field';
              msgSpan.textContent = 'Current field has text; click again to confirm replacing it.';
              return;
            }
            copyBtn.dataset.confirmOverwrite = 'false';
            copyBtn.textContent = 'Copy into current draft';
            applyHandler({ [k]: display });
            msgSpan.textContent = 'Copied into active field.';
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
        fillEmptyBtn.textContent = 'Copy into empty fields only';
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
            revStatus.textContent = 'No empty matching fields to fill; use individual copy buttons to replace.';
            return;
          }
          applyHandler(patch);
          revStatus.textContent = 'Copied ' + copied + ' field(s) into empty inputs.';
        };
        card.appendChild(fillEmptyBtn);
        card.appendChild(revStatus);
      } else if (x.type !== 'builder' && keys.length > 0) {
        const applyBtn = doc.createElement('button');
        applyBtn.type = 'button';
        applyBtn.className = 'archived-fill-empty';
        applyBtn.textContent = 'Restore archived selections';
        const revStatus = doc.createElement('span');
        revStatus.className = 'status archived-copy-status';
        applyBtn.onclick = () => {
          const hasExisting = Object.keys(saved).length > 0;
          if (hasExisting && applyBtn.dataset.confirmOverwrite !== 'true') {
            applyBtn.dataset.confirmOverwrite = 'true';
            applyBtn.textContent = 'Confirm replace current selections';
            revStatus.textContent = 'Active selections exist; click again to confirm.';
            return;
          }
          applyBtn.dataset.confirmOverwrite = 'false';
          applyBtn.textContent = 'Restore archived selections';
          applyHandler(entry.fields);
          revStatus.textContent = 'Archived selections restored.';
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
        ? MAX_CHARS + ' / ' + MAX_CHARS + ' characters (maximum local field limit reached)'
        : remaining <= 150
          ? len + ' / ' + MAX_CHARS + ' characters (' + remaining + ' remaining)'
          : len + ' / ' + MAX_CHARS + ' characters';
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
          lead.textContent = 'Draft fields still open: ';
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
          tail.textContent = '. No judgement score has been assigned. Use the self-check criteria above each field as you draft.';
          feedback.appendChild(tail);
        } else {
          feedback.textContent = 'All fields contain text; your draft is ready for self-review, not automatically approved or quality-checked. Review each field against its self-check criterion above and compare with the illustrative approach below. ' + x.review;
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
            el.textContent = 'Choose a category before comparing your reasoning.';
            unanswered++;
          } else {
            const ok = saved[i] === item.answer;
            if (ok) correct++;
            el.textContent = (ok ? 'This fits. ' : 'Reconsider the distinction. ') + item.feedback;
          }
        });
        feedback.hidden = false;
        feedback.textContent = unanswered
          ? unanswered + ' item(s) still need a choice.'
          : correct + ' of ' + x.items.length + ' classifications fit the teaching example. Explain the evidence for your choices; this does not alter checkpoint scores.';
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
      const refresh = () => {
        const weights = inputs.map(el => +el.value);
        inputs.forEach((el, i) => {
          doc.getElementById('weight-' + i).textContent = weights[i];
          saved[i] = weights[i];
        });
        doc.getElementById('priority-result').textContent = rank(x, weights)
          .map(a => a.label + ': ' + a.score + ' weighted points. ' + a.constraint).join(' ');
      };
      inputs.forEach(el => {
        el.value = saved[el.dataset.weight] ?? 1;
        el.oninput = () => { refresh(); onSave(saved); };
      });
      refresh();
      renderArchivedDrafts(x, saved, opts?.archivedDrafts, doc, patch => {
        const clean = validDraft(x, patch);
        Object.assign(saved, clean);
        inputs.forEach(el => { el.value = saved[el.dataset.weight] ?? 1; });
        refresh();
        onSave(saved);
      });
    }

    if (x.type === 'risk') {
      const likelihood = doc.getElementById('risk-likelihood');
      const impact = doc.getElementById('risk-impact');
      likelihood.value = saved.likelihood ?? 2;
      impact.value = saved.impact ?? 2;
      const refresh = () => {
        const l = +likelihood.value, i = +impact.value;
        saved.likelihood = l;
        saved.impact = i;
        doc.querySelectorAll('[data-risk]').forEach(el => {
          const active = el.dataset.risk === l + '-' + i;
          el.classList.toggle('selected', active);
          if (active) el.setAttribute('aria-current', 'true');
          else el.removeAttribute('aria-current');
        });
        doc.getElementById('risk-result').textContent =
          'Selected likelihood ' + l + ', impact ' + i + '. Illustrative product ' + (l * i) +
          '; this is a discussion aid, not an authorised acceptance threshold. ' +
          (i === 3
            ? 'A severe consequence still needs attention even if unlikely.'
            : 'Consider both prevention and impact reduction, and identify who will review the response.');
      };
      for (const input of [likelihood, impact]) {
        input.onchange = () => { refresh(); onSave(saved); };
      }
      refresh();
      renderArchivedDrafts(x, saved, opts?.archivedDrafts, doc, patch => {
        const clean = validDraft(x, patch);
        Object.assign(saved, clean);
        likelihood.value = saved.likelihood ?? 2;
        impact.value = saved.impact ?? 2;
        refresh();
        onSave(saved);
      });
    }
  }

  const api = { html, mount, validDraft, rank, MAX_CHARS };
  global.CARANA_LEARNING_TOOLS = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
