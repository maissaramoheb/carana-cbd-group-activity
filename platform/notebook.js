/* Browser UI for the isolated E08 Connected Evidence-to-Decision Notebook prototype */
(function () {
  'use strict';

  const core = window.CARANA_NOTEBOOK_CORE;
  const root = document.getElementById('notebook-app');
  if (!core || !root) return;

  const esc = core.esc;
  let activePhaseId = 'phase1';
  let state = loadState();
  let saveNote = 'Stored in this browser under ' + core.STORAGE_KEY + '.';

  function loadState() {
    try {
      const raw = localStorage.getItem(core.STORAGE_KEY);
      if (!raw) return core.createDefaultNotebook();
      return core.safeNotebookState(JSON.parse(raw));
    } catch (_) {
      return core.createDefaultNotebook();
    }
  }

  function readOptionalJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function persist(message) {
    try {
      localStorage.setItem(core.STORAGE_KEY, JSON.stringify(state));
      saveNote = message || 'Saved locally in browser notebook storage.';
    } catch (_) {
      saveNote = 'Browser storage could not save changes; export your JSON backup before leaving.';
    }
  }

  function downloadFile(filename, content, mimeType) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: mimeType || 'application/octet-stream' }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  }

  function render() {
    root.classList.remove('app-boot');
    const phaseMeta = core.PHASES.find(p => p.id === activePhaseId) || core.PHASES[0];
    const phaseState = state.phases[phaseMeta.id];
    const pullInfo = core.extractPlatformPullCandidates(
      readOptionalJson('carana_learning_v1'),
      readOptionalJson('carana_cbd_course_v1'),
      phaseMeta.id
    );

    let hasPreRestore = false;
    try { hasPreRestore = Boolean(localStorage.getItem(core.PRE_RESTORE_KEY)); } catch (_) {}

    const navHtml = core.PHASES.map(p => {
      const ps = state.phases[p.id];
      const hasData = core.phaseHasContent(ps);
      const revBadge = ps.revisionCount > 0 ? 'v' + ps.revisionCount : (hasData ? 'Draft' : 'Open');
      return '<button type="button" class="nb-phase-btn" data-phase="' + esc(p.id) + '" ' +
        (p.id === phaseMeta.id ? 'aria-current="step"' : '') + '>' +
        '<span>' + esc(p.title) + '</span>' +
        '<span class="nb-badge-row">' +
        '<span class="nb-tag">' + esc(revBadge) + '</span>' +
        (ps.needsAlignmentCheck ? '<span class="nb-tag warn">Needs alignment check</span>' : '') +
        '</span></button>';
    }).join('');

    const historyHtml = phaseState.revisions.length
      ? phaseState.revisions.slice().reverse().map((rev, idx) =>
          '<div class="nb-history-item">' +
          '<p><strong>Revision v' + rev.rev + '</strong> · ' + esc(rev.savedAt) +
          (rev.note ? ' · ' + esc(rev.note) : '') + '</p>' +
          '<p class="status"><strong>Observed evidence:</strong> ' + (rev.observedEvidence ? esc(rev.observedEvidence) : '<em>Blank</em>') + '</p>' +
          '<p class="status"><strong>Assumptions &amp; gaps:</strong> ' + (rev.assumptionsAndGaps ? esc(rev.assumptionsAndGaps) : '<em>Blank</em>') + '</p>' +
          '<button type="button" class="small-btn nb-restore-rev" data-rev-idx="' + idx + '">Restore v' + rev.rev + ' into editor (archives current draft first)</button>' +
          '</div>'
        ).join('')
      : '<p class="status">No revision snapshots saved for this phase yet. Use "Save revision snapshot" after editing to record a versioned milestone.</p>';

    const threadOverviewCards = core.PHASES.map(p => {
      const ps = state.phases[p.id];
      const filled = core.phaseHasContent(ps);
      return '<div class="nb-mini-card">' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<p class="status">' + (filled ? 'Evidence &amp; assumptions recorded (Rev ' + (ps.revisionCount || 0) + ')' : 'Not started yet') +
        (ps.needsAlignmentCheck ? ' · Flagged for alignment review' : '') + '</p>' +
        (ps.observedEvidence ? '<p>' + esc(ps.observedEvidence.slice(0, 140)) + (ps.observedEvidence.length > 140 ? '…' : '') + '</p>' : '') +
        '</div>';
    }).join('');

    root.innerHTML =
      '<div class="nb-proto-banner" role="region" aria-label="Prototype governance notice">' +
      '<strong>Isolated Functional Prototype (E08) — Connected Evidence-to-Decision Notebook</strong><br>' +
      'Trace observed evidence, separate unverified assumptions, save versioned snapshots, and review cross-phase consistency across Phases 1–6. Stored separately under <code>' + esc(core.STORAGE_KEY) + '</code>; never alters practical workbenches (<code>carana_cbd_lab_v1</code>) or assigns automated grades.' +
      '</div>' +
      '<div class="nb-header-card">' +
      '<span class="eyebrow">Connected Reasoning Workspace · Local-First Prototype</span>' +
      '<h1>Evidence-to-Decision Advisory Thread</h1>' +
      '<p class="lead">Carry grounded evidence forward from situational diagnosis through objective setting, planning, implementation, evaluation, and handover.</p>' +
      '<div class="nb-thread-row">' +
      '<div><label for="nb-thread-title">Thread or case title <input type="text" id="nb-thread-title" maxlength="140" value="' + esc(state.threadTitle) + '"></label></div>' +
      '<button type="button" id="nb-save-title" class="small-btn">Update title</button>' +
      '</div>' +
      '<div class="nb-global-actions">' +
      '<button type="button" id="nb-export-json">Export notebook (JSON)</button>' +
      '<button type="button" id="nb-import-json">Import backup (dry-run)</button>' +
      '<input type="file" id="nb-import-file" accept=".json,application/json" hidden>' +
      '<button type="button" id="nb-download-brief">Download Brief (.html)</button>' +
      '<button type="button" id="nb-print-brief" class="primary">Print / Save PDF</button>' +
      (hasPreRestore ? '<button type="button" id="nb-undo-restore">Undo last backup restore</button>' : '') +
      '</div>' +
      '<div id="nb-import-preview" class="restore-preview" hidden></div>' +
      '<p class="status" id="nb-status" role="status">' + esc(saveNote) + '</p>' +
      '</div>' +
      '<div class="nb-grid">' +
      '<aside class="nb-rail" aria-label="CBD thread phases">' +
      '<h2>Six Connected Phases</h2>' +
      '<div class="nb-phase-nav">' + navHtml + '</div>' +
      '</aside>' +
      '<article class="nb-card" id="nb-editor-card">' +
      '<span class="eyebrow">Phase ' + phaseMeta.number + ' of 6 · ' + esc(phaseMeta.lessonId.toUpperCase()) + '</span>' +
      '<h2>' + esc(phaseMeta.title) + '</h2>' +
      '<p class="nb-upstream-link"><strong>Chain connection:</strong> ' + esc(phaseMeta.upstreamHint) + '</p>' +
      (phaseState.needsAlignmentCheck
        ? '<div class="nb-align-alert" role="region" aria-label="Alignment check notice">' +
          '<p><strong>Needs alignment check:</strong> ' + esc(phaseState.alignmentNote) + '</p>' +
          '<button type="button" id="nb-mark-aligned" class="small-btn">Confirm alignment reviewed</button></div>'
        : '') +
      '<div class="nb-pull-box">' +
      '<p class="status" style="margin-top:0"><strong>Optional pull from your Lesson ' + phaseMeta.number + ' study work:</strong> ' + esc(pullInfo.summary) + '</p>' +
      '<button type="button" id="nb-pull-preview" class="small-btn"' + (pullInfo.available ? '' : ' disabled') + '>Preview pull from Lesson ' + phaseMeta.number + '</button>' +
      '<div id="nb-pull-confirm-area" hidden style="margin-top:10px"></div>' +
      '</div>' +
      '<div class="nb-field-group">' +
      '<span class="nb-field-badge nb-badge-evidence">Observed Evidence &amp; Decisions (Verified facts)</span>' +
      '<label for="nb-observed">' + esc(phaseMeta.evidenceLabel) + '</label>' +
      '<textarea id="nb-observed" maxlength="' + core.MAX_TEXT + '" aria-describedby="nb-obs-count">' + esc(phaseState.observedEvidence) + '</textarea>' +
      '<div class="field-meta"><span id="nb-obs-count" class="char-count">' + phaseState.observedEvidence.length + ' / ' + core.MAX_TEXT + ' characters</span></div>' +
      '</div>' +
      '<div class="nb-field-group">' +
      '<span class="nb-field-badge nb-badge-assumption">Assumptions, Risks &amp; Unresolved Questions (Not yet verified)</span>' +
      '<label for="nb-assumptions">' + esc(phaseMeta.assumptionLabel) + '</label>' +
      '<textarea id="nb-assumptions" maxlength="' + core.MAX_TEXT + '" aria-describedby="nb-assump-count">' + esc(phaseState.assumptionsAndGaps) + '</textarea>' +
      '<div class="field-meta"><span id="nb-assump-count" class="char-count">' + phaseState.assumptionsAndGaps.length + ' / ' + core.MAX_TEXT + ' characters</span></div>' +
      '</div>' +
      '<div class="nb-field-group">' +
      '<label for="nb-source">Source / Trace Reference <span class="status">(' + esc(phaseMeta.sourceHint) + ')</span></label>' +
      '<input type="text" id="nb-source" maxlength="' + core.MAX_SOURCE + '" value="' + esc(phaseState.sourceCitation) + '">' +
      '</div>' +
      '<fieldset class="nb-checks"><legend>Reasoning Self-Check Criteria (E12-informed, self-assessed only)</legend>' +
      core.SELF_CHECK_TAGS.map(t =>
        '<label class="nb-check-item"><input type="checkbox" class="nb-self-check" data-check="' + esc(t.key) + '" ' +
        (phaseState.checks[t.key] ? 'checked' : '') + '><span>' + esc(t.label) + '</span></label>'
      ).join('') +
      '</fieldset>' +
      '<div class="nb-card-actions">' +
      '<button type="button" id="nb-save-draft" class="primary">Save current phase</button>' +
      '<button type="button" id="nb-save-snapshot">Save revision snapshot (v' + ((phaseState.revisionCount || 0) + 1) + ')</button>' +
      (phaseMeta.number < 6 ? '<button type="button" id="nb-next-phase">Next phase →</button>' : '') +
      '</div>' +
      '<details class="nb-history"><summary>Versioned draft history for Phase ' + phaseMeta.number + ' (' + phaseState.revisions.length + ' saved)</summary>' +
      historyHtml +
      '</details>' +
      '</article>' +
      '</div>' +
      '<section class="nb-thread-overview" aria-labelledby="overview-title">' +
      '<h2 id="overview-title">Full-Cycle Thread Map (Phases 1–6)</h2>' +
      '<div class="nb-summary-cards">' + threadOverviewCards + '</div>' +
      '</section>';

    wireEvents(phaseMeta, pullInfo);
  }

  function wireEvents(phaseMeta, pullInfo) {
    const obsEl = document.getElementById('nb-observed');
    const assumpEl = document.getElementById('nb-assumptions');
    const sourceEl = document.getElementById('nb-source');
    const obsCount = document.getElementById('nb-obs-count');
    const assumpCount = document.getElementById('nb-assump-count');

    const updateCount = (el, span) => {
      const len = el.value.length;
      span.textContent = len + ' / ' + core.MAX_TEXT + ' characters';
      span.classList.toggle('char-warn', core.MAX_TEXT - len <= 150);
    };

    obsEl.oninput = () => updateCount(obsEl, obsCount);
    assumpEl.oninput = () => updateCount(assumpEl, assumpCount);

    const readEditorPatch = () => {
      const checks = {};
      document.querySelectorAll('.nb-self-check').forEach(cb => {
        checks[cb.dataset.check] = cb.checked;
      });
      return {
        observedEvidence: obsEl.value,
        assumptionsAndGaps: assumpEl.value,
        sourceCitation: sourceEl.value,
        checks
      };
    };

    document.getElementById('nb-save-title').onclick = () => {
      const nextTitle = document.getElementById('nb-thread-title').value.trim();
      state.threadTitle = nextTitle || 'Untitled CARANA Evidence-to-Decision Thread';
      persist('Updated thread title.');
      render();
    };

    document.querySelectorAll('[data-phase]').forEach(btn => {
      btn.onclick = () => {
        state = core.updatePhaseAndPropagate(state, phaseMeta.id, readEditorPatch());
        persist();
        activePhaseId = btn.dataset.phase;
        render();
      };
    });

    document.getElementById('nb-save-draft').onclick = () => {
      state = core.updatePhaseAndPropagate(state, phaseMeta.id, readEditorPatch());
      persist('Saved Phase ' + phaseMeta.number + ' notes.');
      render();
    };

    document.getElementById('nb-save-snapshot').onclick = () => {
      state = core.updatePhaseAndPropagate(state, phaseMeta.id, readEditorPatch(), {
        saveRevision: true,
        revisionNote: 'Manual milestone snapshot'
      });
      persist('Saved versioned snapshot for Phase ' + phaseMeta.number + '.');
      render();
    };

    const alignBtn = document.getElementById('nb-mark-aligned');
    if (alignBtn) {
      alignBtn.onclick = () => {
        state = core.acknowledgeDownstreamAlignment(state, phaseMeta.id);
        persist('Marked Phase ' + phaseMeta.number + ' alignment reviewed.');
        render();
      };
    }

    const nextBtn = document.getElementById('nb-next-phase');
    if (nextBtn) {
      nextBtn.onclick = () => {
        state = core.updatePhaseAndPropagate(state, phaseMeta.id, readEditorPatch());
        persist();
        activePhaseId = 'phase' + (phaseMeta.number + 1);
        render();
      };
    }

    const pullBtn = document.getElementById('nb-pull-preview');
    const pullArea = document.getElementById('nb-pull-confirm-area');
    if (pullBtn && pullArea && pullInfo.available) {
      pullBtn.onclick = () => {
        pullArea.hidden = false;
        pullArea.innerHTML =
          '<p><strong>Preview of Lesson ' + phaseMeta.number + ' draft items:</strong></p>' +
          '<p class="status"><em>Observed/Decision items:</em> ' + (pullInfo.observedDraft ? esc(pullInfo.observedDraft.slice(0, 220)) : 'None') + '</p>' +
          '<p class="status"><em>Assumptions/Gap items:</em> ' + (pullInfo.assumptionDraft ? esc(pullInfo.assumptionDraft.slice(0, 220)) : 'None') + '</p>' +
          '<div class="restore-actions">' +
          '<button type="button" id="nb-pull-apply" class="small-btn primary">Archive current text &amp; pull into Phase ' + phaseMeta.number + '</button>' +
          '<button type="button" id="nb-pull-cancel" class="small-btn">Cancel</button>' +
          '</div>';
        document.getElementById('nb-pull-cancel').onclick = () => {
          pullArea.hidden = true;
          pullArea.innerHTML = '';
        };
        document.getElementById('nb-pull-apply').onclick = () => {
          state = core.updatePhaseAndPropagate(state, phaseMeta.id, {
            observedEvidence: pullInfo.observedDraft || obsEl.value,
            assumptionsAndGaps: pullInfo.assumptionDraft || assumpEl.value,
            sourceCitation: pullInfo.sourceHint || sourceEl.value
          }, {
            archivePrevious: true,
            revisionNote: 'Before Lesson ' + phaseMeta.number + ' draft pull'
          });
          persist('Pulled Lesson ' + phaseMeta.number + ' drafts into Phase ' + phaseMeta.number + ' (previous text archived).');
          render();
        };
      };
    }

    document.querySelectorAll('.nb-restore-rev').forEach(btn => {
      btn.onclick = () => {
        const revList = state.phases[phaseMeta.id].revisions.slice().reverse();
        const revObj = revList[+btn.dataset.revIdx];
        if (!revObj) return;
        state = core.updatePhaseAndPropagate(state, phaseMeta.id, {
          observedEvidence: revObj.observedEvidence,
          assumptionsAndGaps: revObj.assumptionsAndGaps,
          sourceCitation: revObj.sourceCitation
        }, {
          archivePrevious: true,
          revisionNote: 'Archived prior editor text before restoring v' + revObj.rev
        });
        persist('Restored Revision v' + revObj.rev + ' into editor.');
        render();
      };
    });

    document.getElementById('nb-export-json').onclick = () => {
      state = core.updatePhaseAndPropagate(state, phaseMeta.id, readEditorPatch());
      persist('Exported Connected Notebook backup (JSON).');
      downloadFile('carana-evidence-notebook.json', JSON.stringify({
        exportedAt: new Date().toISOString(),
        notebook: state
      }, null, 2), 'application/json');
      render();
    };

    const fileInput = document.getElementById('nb-import-file');
    document.getElementById('nb-import-json').onclick = () => fileInput.click();
    fileInput.onchange = async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const text = await file.text();
      fileInput.value = '';
      const preview = document.getElementById('nb-import-preview');
      const plan = core.validateNotebookImport(text);
      preview.hidden = false;
      if (!plan.ok) {
        preview.className = 'restore-preview warning';
        preview.innerHTML = '<strong>Restore did not apply</strong><p>' + esc(plan.message) + '</p>' +
          '<button type="button" id="nb-imp-close" class="small-btn">Close message</button>';
        document.getElementById('nb-imp-close').onclick = () => { preview.hidden = true; preview.innerHTML = ''; };
        return;
      }
      preview.className = 'restore-preview';
      preview.innerHTML =
        '<h3>Dry-run notebook backup preview · ' + esc(file.name) + '</h3>' +
        '<p>Thread title: <strong>' + esc(plan.threadTitle) + '</strong> · ' + plan.activePhases + ' active phase(s).</p>' +
        '<p>Merge keeps your active cards and preserves differing imported cards inside revision history. A pre-restore backup is saved automatically.</p>' +
        '<div class="restore-actions">' +
        '<button type="button" id="nb-imp-merge" class="primary">Merge safely</button>' +
        '<button type="button" id="nb-imp-replace">Replace notebook</button>' +
        '<button type="button" id="nb-imp-cancel">Cancel</button>' +
        '</div>';
      document.getElementById('nb-imp-cancel').onclick = () => { preview.hidden = true; preview.innerHTML = ''; };
      const runApply = mode => {
        try { localStorage.setItem(core.PRE_RESTORE_KEY, JSON.stringify(state)); } catch (_) {}
        state = core.applyNotebookImport(plan, mode, state);
        persist('Restored notebook via ' + mode + ' (pre-restore backup retained).');
        render();
      };
      document.getElementById('nb-imp-merge').onclick = () => runApply('merge');
      document.getElementById('nb-imp-replace').onclick = () => runApply('replace');
    };

    const undoBtn = document.getElementById('nb-undo-restore');
    if (undoBtn) {
      undoBtn.onclick = () => {
        try {
          const prev = readOptionalJson(core.PRE_RESTORE_KEY);
          if (!prev) return;
          state = core.safeNotebookState(prev);
          localStorage.removeItem(core.PRE_RESTORE_KEY);
          persist('Rolled back last backup restore cleanly.');
          render();
        } catch (_) {}
      };
    }

    document.getElementById('nb-download-brief').onclick = () => {
      state = core.updatePhaseAndPropagate(state, phaseMeta.id, readEditorPatch());
      persist('Downloaded standalone Advisory Thread Brief (.html).');
      downloadFile('carana-advisory-thread-brief.html', core.buildNotebookDocumentHTML(state), 'text/html');
      render();
    };

    document.getElementById('nb-print-brief').onclick = () => {
      state = core.updatePhaseAndPropagate(state, phaseMeta.id, readEditorPatch());
      persist();
      window.print();
    };
  }

  window.CARANA_NOTEBOOK_PROTOTYPE = {
    get ready() { return true; },
    get state() { return state; }
  };

  render();
})();
