/* Shared preview runtime. Deliberately isolates carana_learning_v1 from Lesson 1 and original workbenches. */
(function () {
  'use strict';
  const catalog = window.CARANA_CATALOG;
  const homeMode = document.body.dataset.cbdHome === 'true';
  let root = document.getElementById('app');
  const learningTools = window.CARANA_LEARNING_TOOLS;
  const progressCore = window.CARANA_PROGRESS_CORE;
  const handoff = window.CARANA_WORKBENCH_HANDOFF;
  const esc = progressCore.esc;
  const parameters = new URLSearchParams(location.search);
  const course = catalog.find(x => x.id === (homeMode ? 'cbd' : parameters.get('course')));
  const ref = course?.lessons.find(x => x.id === parameters.get('lesson'));
  const KEY = 'carana_learning_v1';
  const PRE_RESTORE_KEY = 'carana_learning_v1_pre_restore';
  const L1_KEY = 'carana_cbd_course_v1';
  const LAB_KEY = 'carana_cbd_lab_v1';
  const attempts = new Map();

  let lesson, state, selected = 0, index = 0, quiz = false, answers = {}, checked = false, storageFailed = false, ready = false;
  let railExpanded = false;

  const initial = () => ({ version: 1, lessons: {} });
  function readJsonKey(storageKey) {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function load() {
    const raw = readJsonKey(KEY);
    if (!raw || raw.version !== 1 || !raw.lessons || typeof raw.lessons !== 'object' || Array.isArray(raw.lessons)) {
      return initial();
    }
    return { version: 1, lessons: raw.lessons };
  }

  let store = load();

  function allPlatformCatalogLessons() {
    return catalog.flatMap(c => c.lessons || []);
  }

  function save(targetStore = store) {
    if (lesson && state) {
      state.section = selected;
      state.screen = index;
      state.view = quiz ? 'quiz' : 'screen';
      targetStore.lessons[lesson.id] = state;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(targetStore));
      storageFailed = false;
    } catch (_) {
      storageFailed = true;
    }
    const el = document.getElementById('save-status');
    if (el) {
      el.textContent = storageFailed
        ? 'Could not save progress. Export before closing.'
        : 'Progress saved in this browser.';
    }
  }

  function focus() {
    const h = root.querySelector('h1');
    if (h) {
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0 });
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportProgress(filename = 'carana-learning-progress.json') {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      progress: store,
      note: 'Formative browser-local record; no certificate or demonstrated competence.'
    };
    downloadFile(filename, JSON.stringify(payload, null, 2), 'application/json');
  }

  function savePreRestoreBackup() {
    if (!store.lessons || Object.keys(store.lessons).length === 0) return false;
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      backupReason: 'automatic-pre-restore-safety-copy',
      progress: store,
      note: 'Automatic pre-restore safety backup generated before importing progress.'
    };
    const json = JSON.stringify(backup, null, 2);
    try { localStorage.setItem(PRE_RESTORE_KEY, json); } catch (_) {}
    downloadFile('carana-learning-pre-restore-backup.json', json, 'application/json');
    return true;
  }

  async function loadAllCbdLessonsForSummary() {
    const files = [...new Set(allPlatformCatalogLessons().map(l => l.file).filter(Boolean))];
    const loaded = [];
    for (const file of files) {
      try {
        const res = await fetch(file);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) loaded.push(...data);
        }
      } catch (_) {}
    }
    if (loaded.length === 0 && lesson) loaded.push(lesson);
    return loaded;
  }

  function closeModal(id, returnFocusTo) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    document.body.classList.remove('modal-open');
    if (returnFocusTo && returnFocusTo.isConnected) returnFocusTo.focus();
  }

  async function openStudySummary(triggerEl) {
    const lessonsData = await loadAllCbdLessonsForSummary();
    const l1Summary = progressCore.readLesson1Summary(readJsonKey(L1_KEY), readJsonKey(LAB_KEY));
    const exportedAt = new Date().toISOString();
    const bodyHtml = progressCore.buildStudySummaryBodyHTML(store, lessonsData, l1Summary, exportedAt);
    const fullDocHtml = progressCore.buildStudySummaryDocumentHTML(store, lessonsData, l1Summary, exportedAt);

    closeModal('study-summary-modal');
    const modal = document.createElement('section');
    modal.id = 'study-summary-modal';
    modal.className = 'study-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'study-modal-title');
    modal.innerHTML =
      '<div class="study-modal-dialog">' +
      '<div class="study-modal-bar">' +
      '<h2 id="study-modal-title">Study-Work Summary</h2>' +
      '<div class="study-modal-actions">' +
      '<button type="button" id="study-print" class="primary">Print / Save PDF</button>' +
      '<button type="button" id="study-download">Download HTML</button>' +
      '<button type="button" id="study-close">Close</button>' +
      '</div></div>' +
      '<div class="study-modal-body">' + bodyHtml + '</div></div>';
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');

    document.getElementById('study-print').onclick = () => window.print();
    document.getElementById('study-download').onclick = () => {
      downloadFile('carana-study-summary.html', fullDocHtml, 'text/html');
    };
    const doClose = () => closeModal('study-summary-modal', triggerEl);
    document.getElementById('study-close').onclick = doClose;
    modal.addEventListener('keydown', e => { if (e.key === 'Escape') doClose(); });
    document.getElementById('study-close').focus();
  }

  function renderRestorePreview(container, fileName, text, onRestored) {
    const plan = progressCore.validatePlatformImport(text, store, allPlatformCatalogLessons());
    container.hidden = false;
    if (!plan.ok) {
      container.className = 'restore-preview warning';
      container.innerHTML = '<strong>Restore did not apply</strong><p>' + esc(plan.message) + '</p>' +
        '<button type="button" class="restore-dismiss">Close message</button>';
      container.querySelector('.restore-dismiss').onclick = () => { container.hidden = true; container.innerHTML = ''; };
      return;
    }

    const rowsHtml = plan.items.map(item => {
      const compatLabel = item.compatibility === 'exact-match'
        ? 'Version matches (' + item.importedVersion + ')'
        : item.compatibility === 'version-mismatch'
          ? 'Updated from ' + item.importedVersion + ' → ' + item.currentCatalogVersion + ' (checkpoints reset for review; drafts archived)'
          : 'Unrecognized catalog ID (' + item.importedVersion + ')';
      const conflictNote = item.conflictFields > 0
        ? item.conflictFields + ' differing draft field(s) will be archived without overwriting your active text in Merge mode.'
        : item.identicalFields > 0
          ? item.identicalFields + ' duplicate field(s) match your current browser text.'
          : 'No conflicting active fields.';
      return '<li><strong>' + esc(item.title) + '</strong> — ' + esc(compatLabel) +
        '<br><span class="status">File: ' + item.importedCheckpoints + (item.totalCheckpoints ? ' / ' + item.totalCheckpoints : '') +
        ' checkpoints, ' + item.importedDraftScreens + ' draft screen(s), ' + item.archivedRevisions + ' prior revision(s). ' +
        esc(conflictNote) + '</span></li>';
    }).join('');

    const hasLocal = store.lessons && Object.keys(store.lessons).length > 0;
    container.className = 'restore-preview';
    container.innerHTML =
      '<strong>Dry-run restore preview · ' + esc(fileName) + '</strong>' +
      (plan.exportedAt ? '<p class="status">Exported: ' + esc(plan.exportedAt) + '</p>' : '') +
      (plan.items.length ? '<ul class="restore-list">' + rowsHtml + '</ul>' : '<p>This backup contains 0 recorded lessons.</p>') +
      (hasLocal ? '<p class="status">Safety notice: an automatic pre-restore backup of your current browser progress will download before applying.</p>' : '') +
      '<div class="restore-actions">' +
      '<button type="button" id="restore-merge" class="primary">Merge with current progress</button>' +
      '<button type="button" id="restore-replace">Replace browser progress</button>' +
      '<button type="button" id="restore-cancel">Cancel</button>' +
      '</div>';

    const applyMode = mode => {
      const backedUp = savePreRestoreBackup();
      store = progressCore.applyPlatformImport(store, plan, mode, allPlatformCatalogLessons());
      if (lesson) {
        state = progressCore.safeProgress(lesson, store.lessons[lesson.id]);
        selected = state.section;
        index = state.screen;
        quiz = state.view === 'quiz';
      }
      save(store);
      container.hidden = true;
      container.innerHTML = '';
      onRestored(
        'Progress restored (' + (mode === 'merge' ? 'merged cleanly without losing conflicting drafts' : 'replaced from file') + ')' +
        (backedUp ? '; pre-restore backup downloaded.' : '.')
      );
    };

    container.querySelector('#restore-merge').onclick = () => applyMode('merge');
    container.querySelector('#restore-replace').onclick = () => applyMode('replace');
    container.querySelector('#restore-cancel').onclick = () => {
      container.hidden = true;
      container.innerHTML = '';
    };
  }

  function wireBackupControls(scopeEl, onAfterRestore) {
    const exportBtn = scopeEl.querySelector('#export-progress');
    const importBtn = scopeEl.querySelector('#import-progress');
    const studyBtn = scopeEl.querySelector('#export-study-sheet');
    const fileInput = scopeEl.querySelector('#import-file');
    const previewEl = scopeEl.querySelector('#restore-preview');

    if (exportBtn) exportBtn.onclick = () => exportProgress();
    if (studyBtn) studyBtn.onclick = () => openStudySummary(studyBtn);
    if (importBtn && fileInput && previewEl) {
      importBtn.onclick = () => {
        fileInput.value = '';
        fileInput.click();
      };
      fileInput.onchange = async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        if (file.size > progressCore.MAX_IMPORT_BYTES) {
          previewEl.hidden = false;
          previewEl.className = 'restore-preview warning';
          previewEl.innerHTML = '<strong>File too large</strong><p>Backup files must be under 2 MB. Existing progress was not changed.</p>';
          return;
        }
        try {
          const text = await file.text();
          renderRestorePreview(previewEl, file.name, text, onAfterRestore);
        } catch (_) {
          previewEl.hidden = false;
          previewEl.className = 'restore-preview warning';
          previewEl.innerHTML = '<strong>Could not read file</strong><p>Your existing browser progress was not changed.</p>';
        }
      };
    }
  }

  function catalogHTML(bannerMessage) {
    root.classList.remove('app-boot');
    if (!course) {
      root.innerHTML =
        '<span class="eyebrow">Professional practice · connected learning</span>' +
        '<h1>From understanding a situation to improving practice.</h1>' +
        '<p class="lead">Explore source-based police learning, meaningful decisions and practical workbenches. Begin with CBD or inspect the next curriculum pathways.</p>' +
        '<div class="banner">Independent learning environment. Institutional approval, curriculum permissions and field validation are pending. No compulsory account.</div>' +
        '<div class="cards">' + catalog.map(c =>
          '<article class="card"><span class="eyebrow">' + esc(c.short) + '</span><h2>' + esc(c.title) + '</h2><p>' + esc(c.description) + '</p><p class="status">' + esc(c.status) + '</p><a class="action" href="' + esc(c.href) + '">Explore ' + esc(c.short) + '</a></article>'
        ).join('') + '</div>' +
        '<a href="./demo.html">View the institutional demonstration →</a>';
      return;
    }

    const available = course.lessons.length;
    const l1Summary = progressCore.readLesson1Summary(readJsonKey(L1_KEY), readJsonKey(LAB_KEY));

    const lessonsMarkup = available
      ? '<p>Each lesson can be explored independently. Checkpoints guide study within a lesson; screen completion is not demonstrated workplace competence. Lesson 1 retains its own saved progress.</p>' +
        '<div class="lesson-list">' + course.lessons.map(l => {
          if (l.href) {
            return '<article class="panel lesson-row"><span class="number">' + l.number + '</span><div><h2>' + esc(l.title) + '</h2>' +
              '<p class="status">' + esc(l1Summary.statusText) + '</p></div>' +
              '<a class="action" href="' + esc(l.href) + '">' + esc(l1Summary.actionText) + '</a></article>';
          }
          const desc = progressCore.describeCatalogLesson(l, store.lessons[l.id]);
          return '<article class="panel lesson-row"><span class="number">' + l.number + '</span><div><h2>' + esc(l.title) + '</h2>' +
            '<p class="status">' + esc(desc.statusText) + '</p></div>' +
            '<a class="action" href="./?course=' + esc(course.id) + '&lesson=' + esc(l.id) + '">' + esc(desc.actionText) + '</a></article>';
        }).join('') + '</div>' +
        '<section class="panel backup-panel" aria-labelledby="backup-heading">' +
        '<h2 id="backup-heading">Study summary &amp; browser backup</h2>' +
        '<p class="status">Progress and drafts stay in this browser. Export JSON for recovery, restore a saved backup, or print a readable study sheet.</p>' +
        '<div class="backup-actions">' +
        '<button type="button" id="export-progress">Export progress (JSON)</button>' +
        '<button type="button" id="import-progress">Restore progress</button>' +
        '<button type="button" id="export-study-sheet">Print / view study summary</button>' +
        '<input type="file" id="import-file" accept=".json,application/json" hidden>' +
        '</div>' +
        (bannerMessage ? '<p id="backup-status" class="feedback self-review" role="status">' + esc(bannerMessage) + '</p>' : '<p id="backup-status" class="status" role="status"></p>') +
        '<div id="restore-preview" class="restore-preview" hidden></div>' +
        '</section>' +
        (course.id === 'cbd'
          ? '<section class="panel backup-panel" aria-labelledby="e08-proto-heading">' +
            '<span class="eyebrow">Separate Prototype Candidate · E08</span>' +
            '<h2 id="e08-proto-heading">Connected Evidence-to-Decision Notebook</h2>' +
            '<p class="status">Isolated prototype: carry verified observations and explicit assumptions across Lessons 1–6 under dedicated local storage (<code>carana_notebook_v1</code>) without changing course checkpoints or practical workbenches.</p>' +
            '<p><a class="action" id="open-e08-notebook" href="./notebook.html">Open Connected Notebook prototype →</a></p>' +
            '</section>'
          : '')
      : '<section class="panel"><h2>Sources verified; conversion not yet released.</h2><p>The official 2023 curriculum has been inventoried. No complete digital course is claimed here. Content review, activity integration, media and learner validation remain separate work.</p><p><a href="./demo.html#partnership">Explore the conversion programme</a></p></section>';

    root.innerHTML =
      '<a href="./?view=curricula">← All curricula</a>' +
      '<h1>' + esc(course.title) + '</h1>' +
      '<p class="lead">' + esc(course.description) + '</p>' +
      '<div class="banner">' + esc(course.status) + '. ' + esc(course.source) + '.</div>' +
      lessonsMarkup;

    if (available) {
      wireBackupControls(root, msg => catalogHTML(msg));
    }
  }

  function layout(content, headingNote, screenAttrs) {
    root.classList.remove('app-boot');
    const mobileLabel = 'Sections (' + state.completed.length + '/' + lesson.sections.length + ')';
    root.innerHTML =
      '<div class="workspace">' +
      '<aside class="rail panel">' +
      '<div class="rail-mobile-bar">' +
      '<a class="rail-back" href="' + (course.id === 'cbd' ? '../course/#home' : './?course=' + esc(course.id)) + '">← ' + (course.id === 'cbd' ? 'CBD home' : esc(course.short) + ' lessons') + '</a>' +
      '<button type="button" class="rail-toggle" id="rail-toggle" aria-expanded="' + String(railExpanded) + '" aria-controls="rail-nav-panel">' + esc(mobileLabel) + ' ▾</button>' +
      '</div>' +
      '<div id="rail-nav-panel" class="rail-panel-body" data-collapsed="' + String(!railExpanded) + '">' +
      '<h2>Lesson ' + lesson.number + '</h2>' +
      '<p>' + esc(lesson.title) + '</p>' +
      '<nav aria-label="Lesson sections">' + lesson.sections.map((s, i) =>
        '<button type="button" data-section="' + i + '" ' + (i > state.completed.length ? 'disabled' : '') + ' ' + (i === selected ? 'aria-current="step"' : '') + '>' +
        esc((state.completed.includes(i) ? '✓ ' : '') + s.title) + '</button>'
      ).join('') + '</nav>' +
      '<p class="status">' + state.completed.length + ' / ' + lesson.sections.length + ' checkpoints passed</p>' +
      '<div class="rail-backup">' +
      '<button type="button" id="export-progress">Export progress</button>' +
      '<button type="button" id="import-progress">Restore progress</button>' +
      '<button type="button" id="export-study-sheet">Study summary</button>' +
      '<input type="file" id="import-file" accept=".json,application/json" hidden>' +
      '</div>' +
      '<div id="restore-preview" class="restore-preview" hidden></div>' +
      '<p class="status" id="save-status" role="status">' +
      (headingNote ? esc(headingNote) : (storageFailed ? 'Could not save progress. Export before closing.' : 'Progress stays in this browser.')) +
      '</p>' +
      '</div></aside>' +
      '<article class="screen" ' + (screenAttrs || '') + '>' + content + '</article>' +
      '</div>';

    const toggleBtn = document.getElementById('rail-toggle');
    const panelBody = document.getElementById('rail-nav-panel');
    if (toggleBtn && panelBody) {
      toggleBtn.onclick = () => {
        railExpanded = !railExpanded;
        toggleBtn.setAttribute('aria-expanded', String(railExpanded));
        panelBody.dataset.collapsed = String(!railExpanded);
      };
    }

    root.querySelectorAll('[data-section]').forEach(b => b.onclick = () => {
      selected = +b.dataset.section;
      index = 0;
      quiz = false;
      answers = {};
      checked = false;
      railExpanded = false;
      save();
      render();
      focus();
    });

    wireBackupControls(root, msg => {
      render(msg);
      focus();
    });
  }

  function buildRevisionBanner() {
    const prev = state.previousProgress;
    if (!prev || !prev.length) return '';
    const last = prev[prev.length - 1];
    const archivedDraftScreens = prev.reduce((sum, p) => sum + progressCore.countDraftScreens(p?.drafts), 0);
    const badge = '<p class="status revision-badge">Revised from ' + esc(last.contentVersion) + ' · ' +
      archivedDraftScreens + ' archived draft screen(s) preserved</p>';
    if (state.revisionAck) return badge;

    return badge +
      '<div class="version-note" role="region" aria-label="Content revision notice">' +
      '<p><strong>Lesson updated to ' + esc(lesson.version) + '.</strong> Earlier checkpoint records from ' + esc(last.contentVersion) +
      ' (' + last.completed.length + ' passed section(s))' +
      (archivedDraftScreens > 0
        ? ' and ' + archivedDraftScreens + ' saved draft screen(s) are preserved in your export and archived read-only inside each practice tool.'
        : ' are preserved in your export (no saved text drafts were present in that prior record).') +
      ' Review the updated material to record new checkpoints.</p>' +
      '<button type="button" id="ack-revision" class="small-btn">Acknowledge notice</button>' +
      '</div>';
  }

  const RHYTHM_META = {
    explain: 'Explain · Conceptual structure & context',
    investigate: 'Investigate · Diagnostic analysis & contrast',
    construct: 'Construct · Applied drafting & self-check'
  };

  function buildVisualHTML(screen) {
    const v = screen.visual || {};
    const kind = v.kind || 'explore';
    const layoutKind = v.layout || kind;
    const nodes = Array.isArray(v.nodes) ? v.nodes : [];
    const btn = (n, i, extraLabel) =>
      '<button type="button" data-node="' + i + '" aria-pressed="false">' +
      (extraLabel ? '<span class="node-role">' + esc(extraLabel) + '</span>' : '') +
      '<span class="node-label">' + esc(n.label) + '</span></button>';

    let inner = '';
    if (layoutKind === 'logframe-row' && nodes.length === 4) {
      const roles = ['Col 1 · Intended Result', 'Col 2 · Indicator / Measure', 'Col 3 · Verification Source', 'Col 4 · Assumption / Risk'];
      inner = '<div class="nodes nodes-logframe">' + nodes.map((n, i) => btn(n, i, roles[i])).join('') + '</div>' +
        '<p class="diagram-caption">Read left to right: Result requires Verification and Source, contingent on External Conditions.</p>';
    } else if (layoutKind === 'system-deps' && nodes.length === 3) {
      inner = '<div class="nodes nodes-system">' +
        '<div class="sys-top">' + btn(nodes[0], 0, 'Authorising Tier') + '</div>' +
        '<div class="sys-arrow" aria-hidden="true">↓ frames & coordinates with</div>' +
        '<div class="sys-peers">' + btn(nodes[1], 1, 'Legal & Policy Context') + btn(nodes[2], 2, 'Justice Sector Chain') + '</div>' +
        '</div>';
    } else if (layoutKind === 'toc-bridge' && nodes.length === 4) {
      const roles = ['Condition (IF)', 'Projected Shift (THEN)', 'Mechanism (BECAUSE)', 'Precondition (PROVIDED THAT)'];
      inner = '<div class="nodes nodes-toc">' + nodes.map((n, i) => btn(n, i, roles[i])).join('') + '</div>';
    } else if (layoutKind === 'problem-loop') {
      inner = '<div class="nodes nodes-loop">' +
        nodes.map((n, i) => btn(n, i, 'Step ' + (i + 1))).join('') +
        '</div><div class="loop-return" aria-hidden="true">↺ Re-enter Step 1 whenever operational evidence or counterpart conditions shift</div>';
    } else if (layoutKind === 'principle-hub' && nodes.length === 4) {
      inner = '<div class="nodes nodes-hub">' +
        btn(nodes[0], 0, 'Principle 1') + btn(nodes[1], 1, 'Principle 2') +
        '<div class="hub-core" aria-hidden="true">Sustainable Handover</div>' +
        btn(nodes[2], 2, 'Principle 3') + btn(nodes[3], 3, 'Principle 4') +
        '</div>';
    } else if (kind === 'chain') {
      inner = '<div class="nodes">' + nodes.map((n, i) => btn(n, i, 'Step ' + (i + 1))).join('') + '</div>';
    } else if (kind === 'compare') {
      inner = '<div class="nodes">' + nodes.map((n, i) => btn(n, i, nodes.length <= 2 ? (i === 0 ? 'Lens A' : 'Lens B') : 'Compare ' + (i + 1))).join('') + '</div>';
    } else if (kind === 'cycle') {
      inner = '<div class="nodes">' + nodes.map((n, i) => btn(n, i, 'Phase ' + (i + 1))).join('') + '</div>' +
        '<div class="loop-return" aria-hidden="true">↺ Iterative cycle: return and adjust as field evidence updates</div>';
    } else {
      inner = '<div class="nodes">' + nodes.map((n, i) => btn(n, i, '')).join('') + '</div>';
    }

    return '<div class="visual" data-kind="' + esc(kind) + '" data-layout="' + esc(layoutKind) + '">' +
      '<div class="visual-head"><span class="eyebrow">Explore the relationship</span>' +
      '<span class="visual-progress" id="visual-progress">0 of ' + nodes.length + ' components explored</span></div>' +
      '<h2>' + esc(v.title) + '</h2>' + inner +
      '<div id="concept-feedback" class="reveal" role="status">Select a component to explore its meaning and relationship to the whole.</div></div>';
  }

  function buildSourceHTML(screen) {
    const src = lesson.source || {};
    const label = src.label || src.file || 'Curriculum source reference';
    const sha = typeof src.sha256 === 'string' && src.sha256.length >= 12 ? src.sha256.slice(0, 12) + '…' : '';
    return '<p class="status source-summary">Source: ' + esc(label) + ' · pages ' + esc(screen.sourcePages) + '.</p>' +
      (src.file
        ? '<details class="source-details"><summary>Technical curriculum source & verification record</summary><p class="status">Source file: <code>' + esc(src.file) + '</code> · Lesson scope: pp. ' + esc(src.pages || screen.sourcePages) +
          (sha ? ' · SHA-256 prefix: <code>' + esc(sha) + '</code>' : '') + '</p></details>'
        : '');
  }

  function render(statusMessage) {
    const section = lesson.sections[selected];
    const count = lesson.sections.reduce((n, s) => n + s.screens.length, 0);
    const ordinal = lesson.sections.slice(0, selected).reduce((n, s) => n + s.screens.length, 0) + index + 1;
    const banner = buildRevisionBanner() + '<p class="status">REVIEW ADAPTATION · English transcript · Independent, not UN-endorsed</p>';

    if (quiz) {
      renderQuiz(section, banner, statusMessage);
      return;
    }

    const screen = section.screens[index];
    const rhythm = RHYTHM_META[screen.rhythm] ? screen.rhythm : 'explain';
    const orientationMarkup = selected === 0 && index === 0
      ? '<details open><summary>Learning orientation</summary><ul>' + lesson.objectives.map(o => '<li>' + esc(o) + '</li>').join('') + '</ul><p>Explore the relationships, make a decision, check your understanding and apply your own reasoning in the original practical activity. English text is the current review language.</p></details>'
      : '';
    const visualMarkup = buildVisualHTML(screen);
    const workedMarkup = screen.worked
      ? '<div class="worked-contrast"><div><h3>Initial proposal</h3><p>' + esc(screen.worked.before) + '</p><p class="status">' + esc(screen.worked.beforeWhy) + '</p></div><div class="improved"><h3>A more defensible approach</h3><p>' + esc(screen.worked.after) + '</p><p class="status">' + esc(screen.worked.afterWhy) + '</p></div></div>'
      : '';
    const pointsListMarkup = '<ul class="points">' + screen.points.map(p => '<li>' + esc(p) + '</li>').join('') + '</ul>';
    const pointsMarkup = rhythm === 'construct'
      ? '<details class="points-reference"><summary>Reference criteria & key takeaways (' + screen.points.length + ')</summary>' + pointsListMarkup + '</details>'
      : pointsListMarkup;
    const transcriptMarkup = '<details><summary>Read the trainer explanation</summary><p class="transcript">' + esc(screen.transcript) + '</p><p class="status">Recording pending review. No synthetic playback has been substituted.</p></details>';
    const labMarkup = screen.lab && learningTools ? learningTools.html(screen.lab) : '';
    const decisionMarkup = '<section class="decision"><span class="eyebrow">Decide · invented teaching example</span><h2>' + esc(screen.decision.prompt) + '</h2><div class="choices">' +
      screen.decision.options.map((o, i) => '<button type="button" data-choice="' + i + '" aria-pressed="false">' + esc(o.label) + '</button>').join('') +
      '</div><div id="decision-feedback" class="feedback" role="status" hidden></div></section>';
    const takeawayMarkup = '<div class="banner"><strong>Carry this forward</strong><p>' + esc(screen.takeaway) + '</p></div>';
    const handoffMarkup = handoff && handoff.shouldShowOnScreen(lesson.number, screen.id)
      ? handoff.renderHandoffSection(lesson, state.drafts, readJsonKey(LAB_KEY))
      : '';
    const sourceMarkup = buildSourceHTML(screen);

    let orderedBody = '';
    if (rhythm === 'investigate') {
      orderedBody = orientationMarkup + labMarkup + workedMarkup + visualMarkup + pointsMarkup + transcriptMarkup + decisionMarkup + takeawayMarkup + handoffMarkup + sourceMarkup;
    } else if (rhythm === 'construct') {
      orderedBody = orientationMarkup + visualMarkup + labMarkup + workedMarkup + pointsMarkup + transcriptMarkup + decisionMarkup + takeawayMarkup + handoffMarkup + sourceMarkup;
    } else {
      orderedBody = orientationMarkup + visualMarkup + workedMarkup + pointsMarkup + transcriptMarkup + labMarkup + decisionMarkup + takeawayMarkup + handoffMarkup + sourceMarkup;
    }

    layout(
      banner +
      '<div class="progress"><span>' + esc(section.title) + '</span><span>Screen ' + ordinal + ' of ' + count + '</span>' +
      '<progress value="' + ordinal + '" max="' + count + '" aria-label="Current screen"></progress></div>' +
      '<span class="rhythm-tag rhythm-' + esc(rhythm) + '">' + esc(RHYTHM_META[rhythm]) + '</span>' +
      '<h1>' + esc(screen.title) + '</h1>' +
      '<p class="lead">' + esc(screen.lead) + '</p>' +
      orderedBody +
      '<div class="actions"><button type="button" id="back" ' + (selected === 0 && index === 0 ? 'disabled' : '') + '>← Back</button><button type="button" id="next" class="primary">' +
      (index === section.screens.length - 1 ? 'Knowledge checkpoint →' : 'Continue →') + '</button></div>',
      statusMessage,
      'data-rhythm="' + esc(rhythm) + '"'
    );

    const ackBtn = document.getElementById('ack-revision');
    if (ackBtn) {
      ackBtn.onclick = () => {
        state.revisionAck = true;
        save();
        render();
      };
    }

    if (screen.lab && learningTools) {
      const archivedDrafts = progressCore.getArchivedDraftsForScreen(state, screen.id);
      learningTools.mount(screen.lab, state.drafts?.[screen.id], draft => {
        state.drafts = state.drafts || {};
        state.drafts[screen.id] = draft;
        save();
      }, document, { archivedDrafts });
    }

    if (handoff && handoff.shouldShowOnScreen(lesson.number, screen.id)) {
      handoff.mountHandoffSection({
        doc: document,
        storage: localStorage,
        lesson,
        lessonDrafts: state.drafts,
        downloadFile,
        onRefresh: msg => render(msg)
      });
    }

    const exploredSet = new Set();
    root.querySelectorAll('[data-node]').forEach(b => b.onclick = () => {
      root.querySelectorAll('[data-node]').forEach(n => n.setAttribute('aria-pressed', String(n === b)));
      const nodeIdx = +b.dataset.node;
      document.getElementById('concept-feedback').textContent = screen.visual.nodes[nodeIdx].detail;
      exploredSet.add(nodeIdx);
      const vp = document.getElementById('visual-progress');
      if (vp) vp.textContent = exploredSet.size + ' of ' + screen.visual.nodes.length + ' components explored';
    });

    root.querySelectorAll('[data-choice]').forEach(b => b.onclick = () => {
      root.querySelectorAll('[data-choice]').forEach(n => n.setAttribute('aria-pressed', String(n === b)));
      const i = +b.dataset.choice;
      const el = document.getElementById('decision-feedback');
      el.hidden = false;
      el.className = 'feedback' + (i === screen.decision.answer ? '' : ' warning');
      el.textContent = (i === screen.decision.answer ? 'A defensible choice. ' : 'Consider the implications. ') + screen.decision.options[i].feedback;
    });

    document.getElementById('next').onclick = () => {
      if (index < section.screens.length - 1) index++;
      else {
        quiz = true;
        if (!attempts.has(selected)) attempts.set(selected, {});
        answers = attempts.get(selected);
        checked = false;
      }
      save();
      render();
      focus();
    };

    document.getElementById('back').onclick = () => {
      if (index) index--;
      else {
        selected--;
        index = lesson.sections[selected].screens.length - 1;
      }
      save();
      render();
      focus();
    };
  }

  function renderQuiz(section, banner, statusMessage) {
    if (state.completed.includes(selected)) {
      const last = selected === lesson.sections.length - 1;
      const quizHandoff = last && handoff
        ? handoff.renderHandoffSection(lesson, state.drafts, readJsonKey(LAB_KEY))
        : '';
      layout(
        banner +
        '<span class="eyebrow">Checkpoint passed</span><h1>' + esc(last ? 'Carry your work into practice.' : 'Understanding checked.') + '</h1>' +
        '<p>You corrected all ' + section.quiz.length + ' questions. This records guided study, not professional certification.</p>' +
        (last
          ? '<p>Apply your own analysis in the original practical activity, and ask a peer or facilitator to challenge your reasoning. The digital checkpoint does not assess your workbench output.</p>' +
            '<a class="action primary" href="' + esc(lesson.activity) + '" target="_blank" rel="noopener noreferrer">Open original Lesson ' + lesson.number + ' activity ↗</a>' +
            '<p class="status">Cinematic artwork is specified for this lesson; new images and narration are pending authorised production and review.</p>'
          : '') +
        quizHandoff +
        (last && lesson.number < 6 ? '<p><a class="action" href="./?course=cbd&lesson=cbd-' + (lesson.number + 1) + '">Continue to Lesson ' + (lesson.number + 1) + ' →</a></p>' : '') +
        '<div class="actions"><button type="button" id="review">Review this section</button>' +
        (last ? '<a class="action" href="../course/#home">Return to CBD home</a>' : '<button type="button" id="continue" class="primary">Next section →</button>') +
        '</div>',
        statusMessage
      );
      const ackBtn = document.getElementById('ack-revision');
      if (ackBtn) ackBtn.onclick = () => { state.revisionAck = true; save(); render(); };
      if (last && handoff) {
        handoff.mountHandoffSection({
          doc: document,
          storage: localStorage,
          lesson,
          lessonDrafts: state.drafts,
          downloadFile,
          onRefresh: msg => render(msg)
        });
      }
      document.getElementById('review').onclick = () => { quiz = false; index = 0; save(); render(); focus(); };
      if (!last) {
        document.getElementById('continue').onclick = () => {
          selected++; index = 0; quiz = false; answers = {}; checked = false; save(); render(); focus();
        };
      }
      return;
    }

    layout(
      banner +
      '<span class="eyebrow">Formative knowledge checkpoint</span><h1>' + esc(section.title) + '</h1>' +
      '<p>Correct all ' + section.quiz.length + ' questions to continue. Retry without penalty. This is the adaptation’s study rule, not an official UN qualification standard.</p>' +
      '<form id="quiz">' + section.quiz.map((q, i) =>
        '<fieldset><legend>' + esc(q.prompt) + '</legend>' +
        q.options.map((option, j) => '<label class="choice"><input type="radio" name="q' + i + '" value="' + j + '" ' + (answers[i] === j ? 'checked' : '') + '><span>' + esc(option) + '</span></label>').join('') +
        (checked && answers[i] !== q.answer ? '<p class="quiz-hint">' + esc((q.optionFeedback?.[answers[i]] || '') + ' ' + q.feedback) + '</p>' : '') +
        '</fieldset>'
      ).join('') + '</form>' +
      '<p id="quiz-status" role="status">' + (checked ? 'Review the feedback and correct the remaining answers.' : 'Select an answer for every question.') + '</p>' +
      '<div class="actions"><button type="button" id="review">Review learning screens</button><button type="button" id="check" class="primary">Check answers →</button></div>',
      statusMessage
    );

    const ackBtn = document.getElementById('ack-revision');
    if (ackBtn) ackBtn.onclick = () => { state.revisionAck = true; save(); render(); };
    root.querySelectorAll('#quiz input').forEach(inp => inp.onchange = () => { answers[+inp.name.slice(1)] = +inp.value; });
    document.getElementById('review').onclick = () => { quiz = false; save(); render(); focus(); };
    document.getElementById('check').onclick = () => {
      const missing = section.quiz.some((_, i) => answers[i] === undefined);
      if (missing) {
        document.getElementById('quiz-status').textContent = 'Answer every question before checking.';
        return;
      }
      checked = true;
      if (section.quiz.every((q, i) => answers[i] === q.answer)) {
        state.completed = [...new Set([...state.completed, selected])].sort((a, b) => a - b);
        save();
      }
      render();
      focus();
    };
  }

  async function start() {
    if (homeMode) { ready = true; return; }
    if (ref?.href) { location.replace(new URL(ref.href, location.href).href); return; }
    if (!ref && ((!parameters.get('course') && parameters.get('view') !== 'curricula') || course?.id === 'cbd')) {
      const destination = new URL('../course/', location.href);
      destination.hash = location.hash || '#home';
      location.replace(destination.href);
      return;
    }
    if (!ref?.file) {
      catalogHTML();
      ready = true;
      return;
    }
    try {
      const response = await fetch(ref.file);
      if (!response.ok) throw Error('Lesson file unavailable.');
      const data = await response.json();
      lesson = data.find(x => x.id === ref.id);
      if (!lesson?.sections?.length || !lesson.sections.every(s => s.screens?.length && s.quiz?.length)) {
        throw Error('Lesson structure is invalid.');
      }
      state = progressCore.safeProgress(lesson, store.lessons[lesson.id]);
      selected = state.section;
      index = state.screen;
      quiz = state.view === 'quiz';
      render();
      ready = true;
    } catch (_) {
      root.classList.remove('app-boot');
      root.innerHTML = '<h1>This lesson could not open.</h1><p>Check your connection and try again. Your existing progress has not been changed.</p><a class="action" href="../course/#home">Return to CBD home</a>';
      ready = true;
    }
  }

  function mountHome(container, bannerMessage) {
    if (!homeMode || !container) return;
    root = container;
    store = load();
    for (const entry of course.lessons) {
      const desc = entry.href
        ? progressCore.readLesson1Summary(readJsonKey(L1_KEY), readJsonKey(LAB_KEY))
        : progressCore.describeCatalogLesson(entry, store.lessons[entry.id]);
      const status = document.querySelector('[data-home-progress="' + entry.id + '"]');
      const action = document.querySelector('[data-home-lesson="' + entry.id + '"]');
      if (status) status.textContent = desc.statusText;
      if (action) action.textContent = desc.actionText + ' ↗';
    }
    container.innerHTML =
      '<p>Progress and drafts stay in this browser. Keep a backup before clearing browser data.</p>' +
      '<div class="backup-actions"><button class="btn outline small" id="export-progress">Export Lessons 2–6 (JSON)</button>' +
      '<button class="btn outline small" id="import-progress">Restore Lessons 2–6</button>' +
      '<button class="btn outline small" id="export-study-sheet">Print / view study summary</button>' +
      '<input type="file" id="import-file" accept=".json,application/json" hidden></div>' +
      '<p id="backup-status" role="status">' + esc(bannerMessage || '') + '</p>' +
      '<div id="restore-preview" class="restore-preview" hidden></div>' +
      '<div class="backup-actions"><button class="btn outline small" id="home-export-l1">Export Lesson 1 (JSON)</button>' +
      '<button class="btn outline small" id="home-restore-l1">Restore Lesson 1 backup (JSON)</button>' +
      '<input type="file" id="home-import-l1-file" accept=".json,application/json" hidden></div>' +
      '<div id="l1-restore-preview" class="l1-restore-preview" hidden></div>';
    wireBackupControls(container, message => {
      // Preserve Lesson 1 listeners when refreshing expanded progress.
      for (const entry of course.lessons.filter(x => !x.href)) {
        const desc = progressCore.describeCatalogLesson(entry, store.lessons[entry.id]);
        const status = document.querySelector('[data-home-progress="' + entry.id + '"]');
        const action = document.querySelector('[data-home-lesson="' + entry.id + '"]');
        if (status) status.textContent = desc.statusText;
        if (action) action.textContent = desc.actionText + ' ↗';
      }
      document.getElementById('backup-status').textContent = message;
    });
  }

  window.CARANA_PLATFORM = {
    mountHome,
    get lesson() { return lesson; },
    get ready() { return ready; }
  };
  start();
})();
