/* Browser UI for the isolated E08 Connected Evidence-to-Decision Notebook prototype */
(function () {
  'use strict';

  const core = window.CARANA_NOTEBOOK_CORE;
  const root = document.getElementById('notebook-app');
  if (!core || !root) return;

  const i18n = window.CARANA_I18N || null;
  const esc = core.esc;
  const allowCode = s => esc(s).replace(/&lt;(\/?code)&gt;/g, '<$1>');
  function nt(key, vars, fallback, ns = 'notebook') {
    if (i18n && i18n.getLang() !== 'en') return i18n.t(ns + '.' + key, vars, fallback);
    return fallback;
  }

  let activePhaseId = 'phase1';
  let state = loadState();
  let saveNote = '';
  let notebookReady = !i18n || i18n.getLang() === 'en';
  let currentReadPatch = null;

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
      saveNote = message || nt('statusSavedLocal', null, 'Saved locally in browser notebook storage.');
    } catch (_) {
      saveNote = nt('statusStorageFailed', null, 'Browser storage could not save changes; export your JSON backup before leaving.');
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
    const locPhases = core.getPhases ? core.getPhases() : core.PHASES;
    const locTags = core.getSelfCheckTags ? core.getSelfCheckTags() : core.SELF_CHECK_TAGS;
    const phaseMeta = locPhases.find(p => p.id === activePhaseId) || locPhases[0];
    const phaseState = state.phases[phaseMeta.id];
    const pullInfo = core.extractPlatformPullCandidates(
      readOptionalJson('carana_learning_v1'),
      readOptionalJson('carana_cbd_course_v1'),
      phaseMeta.id
    );
    const activeStatus = saveNote || nt('statusStored', null, 'Stored in this browser under ' + core.STORAGE_KEY + '.');
    const displayTitle = state.threadTitle === 'Untitled CARANA Evidence-to-Decision Thread' && i18n && i18n.getLang() !== 'en'
      ? nt('untitledThread', null, state.threadTitle)
      : state.threadTitle;

    let hasPreRestore = false;
    try { hasPreRestore = Boolean(localStorage.getItem(core.PRE_RESTORE_KEY)); } catch (_) {}

    const navHtml = locPhases.map(p => {
      const ps = state.phases[p.id];
      const hasData = core.phaseHasContent(ps);
      const revBadge = ps.revisionCount > 0 ? 'v' + ps.revisionCount : (hasData ? nt('tagDraft', null, 'Draft') : nt('tagOpen', null, 'Open'));
      return '<button type="button" class="nb-phase-btn" data-phase="' + esc(p.id) + '" ' +
        (p.id === phaseMeta.id ? 'aria-current="step"' : '') + '>' +
        '<span>' + esc(p.title) + '</span>' +
        '<span class="nb-badge-row">' +
        '<span class="nb-tag">' + esc(revBadge) + '</span>' +
        (ps.needsAlignmentCheck ? '<span class="nb-tag warn">' + esc(nt('tagNeedsAlign', null, 'Needs alignment check')) + '</span>' : '') +
        '</span></button>';
    }).join('');

    const historyHtml = phaseState.revisions.length
      ? phaseState.revisions.slice().reverse().map((rev, idx) =>
          '<div class="nb-history-item">' +
          '<p><strong>' + esc(nt('revTitle', { rev: rev.rev }, 'Revision v' + rev.rev)) + '</strong> · ' + esc(rev.savedAt) +
          (rev.note ? ' · ' + esc(rev.note) : '') + '</p>' +
          '<p class="status"><strong>' + esc(nt('revObsLabel', null, 'Observed evidence:')) + '</strong> <span dir="auto">' + (rev.observedEvidence ? esc(rev.observedEvidence) : '<em>' + esc(nt('blankVal', null, 'Blank')) + '</em>') + '</span></p>' +
          '<p class="status"><strong>' + esc(nt('revAssumpLabel', null, 'Assumptions & gaps:')) + '</strong> <span dir="auto">' + (rev.assumptionsAndGaps ? esc(rev.assumptionsAndGaps) : '<em>' + esc(nt('blankVal', null, 'Blank')) + '</em>') + '</span></p>' +
          '<button type="button" class="small-btn nb-restore-rev" data-rev-idx="' + idx + '">' + esc(nt('restoreRevBtn', { rev: rev.rev }, 'Restore v' + rev.rev + ' into editor (archives current draft first)')) + '</button>' +
          '</div>'
        ).join('')
      : '<p class="status">' + esc(nt('noRevisions', null, 'No revision snapshots saved for this phase yet. Use "Save revision snapshot" after editing to record a versioned milestone.')) + '</p>';

    const threadOverviewCards = locPhases.map(p => {
      const ps = state.phases[p.id];
      const filled = core.phaseHasContent(ps);
      return '<div class="nb-mini-card">' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<p class="status">' + esc(filled ? nt('evidenceRecorded', { rev: ps.revisionCount || 0 }, 'Evidence & assumptions recorded (Rev ' + (ps.revisionCount || 0) + ')') : nt('notStartedYet', null, 'Not started yet')) +
        (ps.needsAlignmentCheck ? esc(nt('flaggedReview', null, ' · Flagged for alignment review')) : '') + '</p>' +
        (ps.observedEvidence ? '<p dir="auto">' + esc(ps.observedEvidence.slice(0, 140)) + (ps.observedEvidence.length > 140 ? '…' : '') + '</p>' : '') +
        '</div>';
    }).join('');

    root.innerHTML =
      '<div class="nb-proto-banner" role="region" aria-label="Prototype governance notice">' +
      '<strong>' + esc(nt('protoBannerTitle', null, 'Isolated Functional Prototype (E08) — Connected Evidence-to-Decision Notebook')) + '</strong><br>' +
      allowCode(nt('protoBannerBody', null, 'Trace observed evidence, separate unverified assumptions, save versioned snapshots, and review cross-phase consistency across Phases 1–6. Stored separately under <code>' + core.STORAGE_KEY + '</code>; never alters practical workbenches (<code>carana_cbd_lab_v1</code>) or assigns automated grades.')) +
      '</div>' +
      '<div class="nb-header-card">' +
      '<span class="eyebrow">' + esc(nt('eyebrow', null, 'Connected Reasoning Workspace · Local-First Prototype')) + '</span>' +
      '<h1>' + esc(nt('heading', null, 'Evidence-to-Decision Advisory Thread')) + '</h1>' +
      '<p class="lead">' + esc(nt('lead', null, 'Carry grounded evidence forward from situational diagnosis through objective setting, planning, implementation, evaluation, and handover.')) + '</p>' +
      '<div class="nb-thread-row">' +
      '<div><label for="nb-thread-title">' + esc(nt('threadTitleLabel', null, 'Thread or case title')) + ' <input type="text" id="nb-thread-title" dir="auto" maxlength="140" value="' + esc(displayTitle) + '"></label></div>' +
      '<button type="button" id="nb-save-title" class="small-btn">' + esc(nt('updateTitleBtn', null, 'Update title')) + '</button>' +
      '</div>' +
      '<div class="nb-global-actions">' +
      '<button type="button" id="nb-export-json">' + esc(nt('exportBtn', null, 'Export notebook (JSON)')) + '</button>' +
      '<button type="button" id="nb-import-json">' + esc(nt('importBtn', null, 'Import backup (dry-run)')) + '</button>' +
      '<input type="file" id="nb-import-file" accept=".json,application/json" hidden>' +
      '<button type="button" id="nb-download-brief">' + esc(nt('downloadBriefBtn', null, 'Download Brief (.html)')) + '</button>' +
      '<button type="button" id="nb-print-brief" class="primary">' + esc(nt('printBriefBtn', null, 'Print / Save PDF')) + '</button>' +
      (hasPreRestore ? '<button type="button" id="nb-undo-restore">' + esc(nt('undoRestoreBtn', null, 'Undo last backup restore')) + '</button>' : '') +
      '</div>' +
      '<div id="nb-import-preview" class="restore-preview" hidden></div>' +
      '<p class="status" id="nb-status" role="status">' + esc(activeStatus) + '</p>' +
      '</div>' +
      '<div class="nb-grid">' +
      '<aside class="nb-rail" aria-label="' + esc(nt('railAria', null, 'CBD thread phases')) + '">' +
      '<h2>' + esc(nt('railTitle', null, 'Six Connected Phases')) + '</h2>' +
      '<div class="nb-phase-nav">' + navHtml + '</div>' +
      '</aside>' +
      '<article class="nb-card" id="nb-editor-card">' +
      '<span class="eyebrow">' + esc(nt('phaseHeaderTpl', { num: phaseMeta.number, id: phaseMeta.lessonId.toUpperCase() }, 'Phase ' + phaseMeta.number + ' of 6 · ' + phaseMeta.lessonId.toUpperCase())) + '</span>' +
      '<h2>' + esc(phaseMeta.title) + '</h2>' +
      '<p class="nb-upstream-link"><strong>' + esc(nt('chainConnLabel', null, 'Chain connection:')) + '</strong> ' + esc(phaseMeta.upstreamHint) + '</p>' +
      (phaseState.needsAlignmentCheck
        ? '<div class="nb-align-alert" role="region" aria-label="Alignment check notice">' +
          '<p><strong>' + esc(nt('needsAlignLabel', null, 'Needs alignment check:')) + '</strong> ' + esc(phaseState.alignmentNote) + '</p>' +
          '<button type="button" id="nb-mark-aligned" class="small-btn">' + esc(nt('markAlignedBtn', null, 'Confirm alignment reviewed')) + '</button></div>'
        : '') +
      '<div class="nb-pull-box">' +
      '<p class="status" style="margin-top:0"><strong>' + esc(nt('optionalPullLabel', { num: phaseMeta.number }, 'Optional pull from your Lesson ' + phaseMeta.number + ' study work:')) + '</strong> ' + esc(pullInfo.summary) + '</p>' +
      '<button type="button" id="nb-pull-preview" class="small-btn"' + (pullInfo.available ? '' : ' disabled') + '>' + esc(nt('previewPullBtn', { num: phaseMeta.number }, 'Preview pull from Lesson ' + phaseMeta.number)) + '</button>' +
      '<div id="nb-pull-confirm-area" hidden style="margin-top:10px"></div>' +
      '</div>' +
      '<div class="nb-field-group">' +
      '<span class="nb-field-badge nb-badge-evidence">' + esc(nt('observedBadge', null, 'Observed Evidence & Decisions (Verified facts)')) + '</span>' +
      '<label for="nb-observed">' + esc(phaseMeta.evidenceLabel) + '</label>' +
      '<textarea id="nb-observed" dir="auto" maxlength="' + core.MAX_TEXT + '" aria-describedby="nb-obs-count">' + esc(phaseState.observedEvidence) + '</textarea>' +
      '<div class="field-meta"><span id="nb-obs-count" class="char-count">' + esc(nt('charCount', { len: phaseState.observedEvidence.length, max: core.MAX_TEXT }, phaseState.observedEvidence.length + ' / ' + core.MAX_TEXT + ' characters')) + '</span></div>' +
      '</div>' +
      '<div class="nb-field-group">' +
      '<span class="nb-field-badge nb-badge-assumption">' + esc(nt('assumpBadge', null, 'Assumptions, Risks & Unresolved Questions (Not yet verified)')) + '</span>' +
      '<label for="nb-assumptions">' + esc(phaseMeta.assumptionLabel) + '</label>' +
      '<textarea id="nb-assumptions" dir="auto" maxlength="' + core.MAX_TEXT + '" aria-describedby="nb-assump-count">' + esc(phaseState.assumptionsAndGaps) + '</textarea>' +
      '<div class="field-meta"><span id="nb-assump-count" class="char-count">' + esc(nt('charCount', { len: phaseState.assumptionsAndGaps.length, max: core.MAX_TEXT }, phaseState.assumptionsAndGaps.length + ' / ' + core.MAX_TEXT + ' characters')) + '</span></div>' +
      '</div>' +
      '<div class="nb-field-group">' +
      '<label for="nb-source">' + esc(nt('sourceLabel', null, 'Source / Trace Reference')) + ' <span class="status">(' + esc(phaseMeta.sourceHint) + ')</span></label>' +
      '<input type="text" id="nb-source" dir="auto" maxlength="' + core.MAX_SOURCE + '" value="' + esc(phaseState.sourceCitation) + '">' +
      '</div>' +
      '<fieldset class="nb-checks"><legend>' + esc(nt('checksLegend', null, 'Reasoning Self-Check Criteria (E12-informed, self-assessed only)')) + '</legend>' +
      locTags.map(t =>
        '<label class="nb-check-item"><input type="checkbox" class="nb-self-check" data-check="' + esc(t.key) + '" ' +
        (phaseState.checks[t.key] ? 'checked' : '') + '><span>' + esc(t.label) + '</span></label>'
      ).join('') +
      '</fieldset>' +
      '<div class="nb-card-actions">' +
      '<button type="button" id="nb-save-draft" class="primary">' + esc(nt('savePhaseBtn', null, 'Save current phase')) + '</button>' +
      '<button type="button" id="nb-save-snapshot">' + esc(nt('saveSnapshotBtn', { ver: (phaseState.revisionCount || 0) + 1 }, 'Save revision snapshot (v' + ((phaseState.revisionCount || 0) + 1) + ')')) + '</button>' +
      (phaseMeta.number < 6 ? '<button type="button" id="nb-next-phase">' + esc(nt('nextPhaseBtn', null, 'Next phase →')) + '</button>' : '') +
      '</div>' +
      '<details class="nb-history"><summary>' + esc(nt('historySummary', { num: phaseMeta.number, count: phaseState.revisions.length }, 'Versioned draft history for Phase ' + phaseMeta.number + ' (' + phaseState.revisions.length + ' saved)')) + '</summary>' +
      historyHtml +
      '</details>' +
      '</article>' +
      '</div>' +
      '<section class="nb-thread-overview" aria-labelledby="overview-title">' +
      '<h2 id="overview-title">' + esc(nt('overviewTitle', null, 'Full-Cycle Thread Map (Phases 1–6)')) + '</h2>' +
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
      span.textContent = nt('charCount', { len, max: core.MAX_TEXT }, len + ' / ' + core.MAX_TEXT + ' characters');
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
    currentReadPatch = () => {
      const titleEl = document.getElementById('nb-thread-title');
      if (titleEl) {
        const nextT = titleEl.value.trim();
        const untitled = nt('untitledThread', null, 'Untitled CARANA Evidence-to-Decision Thread');
        if (nextT && nextT !== untitled && nextT !== 'Untitled CARANA Evidence-to-Decision Thread') {
          state.threadTitle = nextT;
        }
      }
      state = core.updatePhaseAndPropagate(state, phaseMeta.id, readEditorPatch());
    };

    document.getElementById('nb-save-title').onclick = () => {
      const nextTitle = document.getElementById('nb-thread-title').value.trim();
      state.threadTitle = nextTitle || 'Untitled CARANA Evidence-to-Decision Thread';
      persist(nt('statusUpdatedTitle', null, 'Updated thread title.'));
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
      persist(nt('statusSavedPhase', { num: phaseMeta.number }, 'Saved Phase ' + phaseMeta.number + ' notes.'));
      render();
    };

    document.getElementById('nb-save-snapshot').onclick = () => {
      state = core.updatePhaseAndPropagate(state, phaseMeta.id, readEditorPatch(), {
        saveRevision: true,
        revisionNote: 'Manual milestone snapshot'
      });
      persist(nt('statusSavedSnapshot', { num: phaseMeta.number }, 'Saved versioned snapshot for Phase ' + phaseMeta.number + '.'));
      render();
    };

    const alignBtn = document.getElementById('nb-mark-aligned');
    if (alignBtn) {
      alignBtn.onclick = () => {
        state = core.acknowledgeDownstreamAlignment(state, phaseMeta.id);
        persist(nt('statusMarkedAligned', { num: phaseMeta.number }, 'Marked Phase ' + phaseMeta.number + ' alignment reviewed.'));
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
          '<p><strong>' + esc(nt('pullPreviewHead', { num: phaseMeta.number }, 'Preview of Lesson ' + phaseMeta.number + ' draft items:')) + '</strong></p>' +
          '<p class="status"><em>' + esc(nt('pullObsLabel', null, 'Observed/Decision items:')) + '</em> <span dir="auto">' + (pullInfo.observedDraft ? esc(pullInfo.observedDraft.slice(0, 220)) : esc(nt('pullNone', null, 'None'))) + '</span></p>' +
          '<p class="status"><em>' + esc(nt('pullAssumpLabel', null, 'Assumptions/Gap items:')) + '</em> <span dir="auto">' + (pullInfo.assumptionDraft ? esc(pullInfo.assumptionDraft.slice(0, 220)) : esc(nt('pullNone', null, 'None'))) + '</span></p>' +
          '<div class="restore-actions">' +
          '<button type="button" id="nb-pull-apply" class="small-btn primary">' + esc(nt('pullApplyBtn', { num: phaseMeta.number }, 'Archive current text & pull into Phase ' + phaseMeta.number)) + '</button>' +
          '<button type="button" id="nb-pull-cancel" class="small-btn">' + esc(nt('cancel', null, 'Cancel', 'common')) + '</button>' +
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
          persist(nt('statusPulledDrafts', { num: phaseMeta.number }, 'Pulled Lesson ' + phaseMeta.number + ' drafts into Phase ' + phaseMeta.number + ' (previous text archived).'));
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
        persist(nt('statusRestoredRev', { rev: revObj.rev }, 'Restored Revision v' + revObj.rev + ' into editor.'));
        render();
      };
    });

    document.getElementById('nb-export-json').onclick = () => {
      state = core.updatePhaseAndPropagate(state, phaseMeta.id, readEditorPatch());
      persist(nt('statusExported', null, 'Exported Connected Notebook backup (JSON).'));
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
        preview.innerHTML = '<strong>' + esc(nt('importErrorTitle', null, 'Restore did not apply')) + '</strong><p>' + esc(plan.message) + '</p>' +
          '<button type="button" id="nb-imp-close" class="small-btn">' + esc(nt('close', null, 'Close message', 'common')) + '</button>';
        document.getElementById('nb-imp-close').onclick = () => { preview.hidden = true; preview.innerHTML = ''; };
        return;
      }
      preview.className = 'restore-preview';
      preview.innerHTML =
        '<h3>' + esc(nt('importPreviewTitle', { file: file.name }, 'Dry-run notebook backup preview · ' + file.name)) + '</h3>' +
        '<p>' + esc(nt('importPreviewMeta', { title: plan.threadTitle, count: plan.activePhases }, 'Thread title: ' + plan.threadTitle + ' · ' + plan.activePhases + ' active phase(s).')) + '</p>' +
        '<p>' + esc(nt('importMergeDesc', null, 'Merge keeps your active cards and preserves differing imported cards inside revision history. A pre-restore backup is saved automatically.')) + '</p>' +
        '<div class="restore-actions">' +
        '<button type="button" id="nb-imp-merge" class="primary">' + esc(nt('importMergeBtn', null, 'Merge safely')) + '</button>' +
        '<button type="button" id="nb-imp-replace">' + esc(nt('importReplaceBtn', null, 'Replace notebook')) + '</button>' +
        '<button type="button" id="nb-imp-cancel">' + esc(nt('cancel', null, 'Cancel', 'common')) + '</button>' +
        '</div>';
      document.getElementById('nb-imp-cancel').onclick = () => { preview.hidden = true; preview.innerHTML = ''; };
      const runApply = mode => {
        try { localStorage.setItem(core.PRE_RESTORE_KEY, JSON.stringify(state)); } catch (_) {}
        state = core.applyNotebookImport(plan, mode, state);
        persist(nt('statusRestoredMode', { mode }, 'Restored notebook via ' + mode + ' (pre-restore backup retained).'));
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
          persist(nt('statusRolledBack', null, 'Rolled back last backup restore cleanly.'));
          render();
        } catch (_) {}
      };
    }

    document.getElementById('nb-download-brief').onclick = () => {
      state = core.updatePhaseAndPropagate(state, phaseMeta.id, readEditorPatch());
      persist(nt('statusBriefDownloaded', null, 'Downloaded standalone Advisory Thread Brief (.html).'));
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
    get ready() { return notebookReady; },
    get state() { return state; }
  };

  async function initNotebook() {
    const slot = document.getElementById('notebook-lang-slot');
    if (i18n && slot) {
      i18n.mountSwitcher(slot, { variant: 'light' });
      i18n.onChange(async newLang => {
        if (currentReadPatch) currentReadPatch();
        if (newLang !== 'en') await i18n.ready(['ui']);
        i18n.applyStaticDom(document);
        document.title = nt('pageTitle', null, 'Evidence-to-Decision Notebook · CARANA E-Learning');
        saveNote = '';
        render();
      });
    }
    if (i18n && i18n.getLang() !== 'en') {
      await i18n.ready(['ui']);
      i18n.applyStaticDom(document);
      document.title = nt('pageTitle', null, 'Evidence-to-Decision Notebook · CARANA E-Learning');
    }
    render();
    notebookReady = true;
  }
  initNotebook();
})();
