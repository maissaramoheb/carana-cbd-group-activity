/* Shared preview runtime. Deliberately isolates carana_learning_v1 from Lesson 1 and original workbenches. */
(function () {
  'use strict';
  const catalog = window.CARANA_CATALOG;
  const homeMode = document.body.dataset.cbdHome === 'true';
  let root = document.getElementById('app');
  const learningTools = window.CARANA_LEARNING_TOOLS;
  const progressCore = window.CARANA_PROGRESS_CORE;
  const handoff = window.CARANA_WORKBENCH_HANDOFF;
  const exploration = window.CARANA_EXPLORATION;
  const i18n = window.CARANA_I18N || null;
  const expandedIds = ['cbd-2','cbd-3','cbd-4','cbd-5','cbd-6'];
  const esc = progressCore.esc;
  const allowStrong = s => esc(s).replace(/&lt;(\/?strong)&gt;/g, '<$1>');
  const tp = (key, vars, fallback, ns = 'platform') => {
    if (i18n && i18n.getLang() !== 'en') return i18n.t(ns + '.' + key, vars, fallback);
    return fallback;
  };
  const tpRaw = key => {
    if (!i18n || i18n.getLang() === 'en') return undefined;
    const pack = i18n.getPack('ui');
    let cur = pack && pack.platform;
    for (const part of String(key).split('.')) {
      if (!cur || typeof cur !== 'object') return undefined;
      cur = cur[part];
    }
    return cur;
  };

  function getLocalizedCatalog() {
    if (!i18n || i18n.getLang() === 'en') return catalog;
    const catPack = i18n.getPack('lessons-2-6')?.catalog || {};
    return catalog.map(c => {
      const lc = catPack[c.id];
      if (!lc) return c;
      const lessons = Array.isArray(c.lessons)
        ? c.lessons.map(l => ({ ...l, ...(lc.lessons?.[l.id] || {}) }))
        : c.lessons;
      return { ...c, ...lc, lessons };
    });
  }
  function getLocalizedCourse(id) {
    return getLocalizedCatalog().find(x => x.id === id);
  }
  function localizeLab(rawLab, locLab) {
    if (!rawLab || !locLab) return rawLab;
    const next = { ...rawLab, ...locLab };
    if (rawLab.type === 'builder' && Array.isArray(rawLab.fields)) {
      next.fields = rawLab.fields.map((f, idx) => ({ ...f, ...(locLab.fields?.[idx] || {}) }));
    } else if (rawLab.type === 'classify' && Array.isArray(rawLab.items)) {
      next.categories = Array.isArray(locLab.categories) ? locLab.categories : rawLab.categories;
      next.items = rawLab.items.map((it, idx) => ({ ...it, ...(locLab.items?.[idx] || {}) }));
    } else if (rawLab.type === 'priority' && Array.isArray(rawLab.alternatives)) {
      next.criteria = Array.isArray(locLab.criteria) ? locLab.criteria : rawLab.criteria;
      next.alternatives = rawLab.alternatives.map((alt, idx) => ({ ...alt, ...(locLab.alternatives?.[idx] || {}) }));
    }
    return next;
  }
  function localizeLesson(raw) {
    if (!raw || !i18n || i18n.getLang() === 'en') return raw;
    const loc = i18n.getPack('lessons-2-6')?.lessons?.[raw.id];
    if (!loc) return raw;
    return {
      ...raw,
      title: loc.title || raw.title,
      source: loc.source ? { ...raw.source, ...loc.source } : raw.source,
      objectives: Array.isArray(loc.objectives) ? loc.objectives : raw.objectives,
      sections: raw.sections.map((sec, sIdx) => {
        const lSec = loc.sections?.[sIdx] || {};
        return {
          ...sec,
          title: lSec.title || sec.title,
          screens: sec.screens.map((scr, scIdx) => {
            const lScr = lSec.screens?.[scIdx] || {};
            const rawVis = scr.visual || {};
            const lVis = lScr.visual || {};
            const visNodes = Array.isArray(rawVis.nodes)
              ? rawVis.nodes.map((node, nIdx) => ({ ...node, ...(lVis.nodes?.[nIdx] || {}), _canonical: node }))
              : rawVis.nodes;
            const lDec = lScr.decision || {};
            const dec = scr.decision
              ? {
                  ...scr.decision,
                  prompt: lDec.prompt || scr.decision.prompt,
                  options: scr.decision.options.map((o, oIdx) => ({ ...o, ...(lDec.options?.[oIdx] || {}) }))
                }
              : scr.decision;
            return {
              ...scr,
              title: lScr.title || scr.title,
              lead: lScr.lead || scr.lead,
              points: Array.isArray(lScr.points) ? lScr.points : scr.points,
              takeaway: lScr.takeaway || scr.takeaway,
              transcript: lScr.transcript || scr.transcript,
              worked: scr.worked ? { ...scr.worked, ...(lScr.worked || {}) } : scr.worked,
              visual: scr.visual ? { ...rawVis, title: lVis.title || rawVis.title, nodes: visNodes } : scr.visual,
              lab: localizeLab(scr.lab, lScr.lab),
              decision: dec
            };
          }),
          quiz: sec.quiz.map((q, qIdx) => ({ ...q, ...(lSec.quiz?.[qIdx] || {}) }))
        };
      })
    };
  }

  const parameters = new URLSearchParams(location.search);
  const baseCourseId = homeMode ? 'cbd' : parameters.get('course');
  let course = catalog.find(x => x.id === baseCourseId);
  const ref = course?.lessons.find(x => x.id === parameters.get('lesson'));
  const KEY = 'carana_learning_v1';
  const PRE_RESTORE_KEY = 'carana_learning_v1_pre_restore';
  const L1_KEY = 'carana_cbd_course_v1';
  const LAB_KEY = 'carana_cbd_lab_v1';
  const attempts = new Map();

  let rawLesson, lesson, state, selected = 0, index = 0, quiz = false, answers = {}, checked = false, storageFailed = false, ready = false;
  let railExpanded = false;

  function allPlatformCatalogLessons() {
    return getLocalizedCatalog().flatMap(c => c.lessons || []);
  }

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
        ? tp('saveErr', null, 'Could not save progress. Export before closing.')
        : tp('saveOk', null, 'Progress saved in this browser.');
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
      exploration: exploration?.store.exportFor(expandedIds),
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
      exploration: exploration?.store.exportFor(expandedIds),
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
          if (Array.isArray(data)) loaded.push(...data.map(localizeLesson));
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
      '<h2 id="study-modal-title">' + esc(tp('studyModalTitle', null, 'Study-Work Summary')) + '</h2>' +
      '<div class="study-modal-actions">' +
      '<button type="button" id="study-print" class="primary">' + esc(tp('studyPrint', null, 'Print / Save PDF')) + '</button>' +
      '<button type="button" id="study-download">' + esc(tp('studyDownload', null, 'Download HTML')) + '</button>' +
      '<button type="button" id="study-close">' + esc(tp('close', null, 'Close', 'common')) + '</button>' +
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
    if(plan.ok){
      const parsed=JSON.parse(text);
      if(parsed.exploration!==undefined){
        const history=exploration?.validate(parsed.exploration);
        if(!history?.ok){plan.ok=false;plan.message=tp('importInvalid', null, 'Invalid exploration history. Existing progress was not changed.');}
        else plan.exploration=history.value;
      }
    }
    container.hidden = false;
    if (!plan.ok) {
      container.className = 'restore-preview warning';
      container.innerHTML = '<strong>' + esc(tp('restoreDidNotApply', null, 'Restore did not apply')) + '</strong><p>' + esc(plan.message) + '</p>' +
        '<button type="button" class="restore-dismiss">' + esc(tp('closeMessage', null, 'Close message')) + '</button>';
      container.querySelector('.restore-dismiss').onclick = () => { container.hidden = true; container.innerHTML = ''; };
      return;
    }

    const rowsHtml = plan.items.map(item => {
      const compatLabel = item.compatibility === 'exact-match'
        ? tp('compatExact', { v: item.importedVersion }, 'Version matches (' + item.importedVersion + ')')
        : item.compatibility === 'version-mismatch'
          ? tp('compatUpdated', { old: item.importedVersion, cur: item.currentCatalogVersion }, 'Updated from ' + item.importedVersion + ' → ' + item.currentCatalogVersion + ' (checkpoints reset for review; drafts archived)')
          : tp('compatUnknown', { v: item.importedVersion }, 'Unrecognized catalog ID (' + item.importedVersion + ')');
      const conflictNote = item.conflictFields > 0
        ? tp('conflictFieldsNote', { count: item.conflictFields }, item.conflictFields + ' differing draft field(s) will be archived without overwriting your active text in Merge mode.')
        : item.identicalFields > 0
          ? tp('identicalFieldsNote', { count: item.identicalFields }, item.identicalFields + ' duplicate field(s) match your current browser text.')
          : tp('noConflictFields', null, 'No conflicting active fields.');
      const totalPart = item.totalCheckpoints ? ' / ' + item.totalCheckpoints : '';
      return '<li><strong>' + esc(item.title) + '</strong> — ' + esc(compatLabel) +
        '<br><span class="status">' + esc(tp('fileSummaryLine', {
          passed: item.importedCheckpoints,
          totalPart,
          drafts: item.importedDraftScreens,
          arch: item.archivedRevisions
        }, 'File: ' + item.importedCheckpoints + totalPart +
        ' checkpoints, ' + item.importedDraftScreens + ' draft screen(s), ' + item.archivedRevisions + ' prior revision(s).')) + ' ' +
        esc(conflictNote) + '</span></li>';
    }).join('');

    const hasLocal = store.lessons && Object.keys(store.lessons).length > 0;
    container.className = 'restore-preview';
    container.innerHTML =
      '<strong>' + esc(tp('dryRunPreview', { file: fileName }, 'Dry-run restore preview · ' + fileName)) + '</strong>' +
      (plan.exploration ? '<p class="status">' + esc(tp('explorationHistoryNote', { count: Object.keys(plan.exploration.records).filter(k => expandedIds.includes(k.split('/')[0])).length }, 'Includes explanatory history for ' + Object.keys(plan.exploration.records).filter(k => expandedIds.includes(k.split('/')[0])).length + ' saved diagram revision(s). This is separate from checkpoint achievement.')) + '</p>' : '') +
      (plan.exportedAt ? '<p class="status">' + esc(tp('exportedAtPrefix', { date: plan.exportedAt }, 'Exported: ' + plan.exportedAt)) + '</p>' : '') +
      (plan.items.length ? '<ul class="restore-list">' + rowsHtml + '</ul>' : '<p>' + esc(tp('backupZeroLessons', null, 'This backup contains 0 recorded lessons.')) + '</p>') +
      (hasLocal ? '<p class="status">' + esc(tp('restoreSafetyNotice', null, 'Safety notice: an automatic pre-restore backup of your current browser progress will download before applying.')) + '</p>' : '') +
      '<div class="restore-actions">' +
      '<button type="button" id="restore-merge" class="primary">' + esc(tp('mergeProgressBtn', null, 'Merge with current progress')) + '</button>' +
      '<button type="button" id="restore-replace">' + esc(tp('replaceProgressBtn', null, 'Replace browser progress')) + '</button>' +
      '<button type="button" id="restore-cancel">' + esc(tp('cancel', null, 'Cancel', 'common')) + '</button>' +
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
      if(plan.exploration)exploration.store.importFor(plan.exploration,expandedIds,mode);
      container.hidden = true;
      container.innerHTML = '';
      onRestored(tp('progressRestoredMsg', {
        mode: mode === 'merge' ? tp('mergedWord', null, 'merged cleanly without losing conflicting drafts') : tp('replacedWord', null, 'replaced from file'),
        bak: backedUp ? tp('preBackupDownloaded', null, '; pre-restore backup downloaded.') : '.',
        expFail: exploration?.store.failed ? tp('explorationFailed', null, ' Exploration history could not save; export before closing.') : ''
      }, 'Progress restored (' + (mode === 'merge' ? 'merged cleanly without losing conflicting drafts' : 'replaced from file') + ')' +
        (backedUp ? '; pre-restore backup downloaded.' : '.') + (exploration?.store.failed ? ' Exploration history could not save; export before closing.' : '')));
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
          previewEl.innerHTML = '<strong>' + esc(tp('fileTooLargeHeading', null, 'File too large')) + '</strong><p>' + esc(tp('fileTooLargeBody', null, 'Backup files must be under 2 MB. Existing progress was not changed.')) + '</p>';
          return;
        }
        try {
          const text = await file.text();
          renderRestorePreview(previewEl, file.name, text, onAfterRestore);
        } catch (_) {
          previewEl.hidden = false;
          previewEl.className = 'restore-preview warning';
          previewEl.innerHTML = '<strong>' + esc(tp('couldNotReadHeading', null, 'Could not read file')) + '</strong><p>' + esc(tp('couldNotReadBody', null, 'Your existing browser progress was not changed.')) + '</p>';
        }
      };
    }
  }

  function catalogHTML(bannerMessage) {
    root.classList.remove('app-boot');
    const locCatalog = getLocalizedCatalog();
    const locCourse = baseCourseId ? locCatalog.find(x => x.id === baseCourseId) : null;
    if (!locCourse) {
      root.innerHTML =
        '<span class="eyebrow">' + esc(tp('curriculaEyebrow', null, 'Professional practice · connected learning')) + '</span>' +
        '<h1>' + esc(tp('curriculaHeading', null, 'From understanding a situation to improving practice.')) + '</h1>' +
        '<p class="lead">' + esc(tp('curriculaLead', null, 'Explore source-based police learning, meaningful decisions and practical workbenches. Begin with CBD or inspect the next curriculum pathways.')) + '</p>' +
        '<div class="banner">' + esc(tp('curriculaBanner', null, 'Independent learning environment. Institutional approval, curriculum permissions and field validation are pending. No compulsory account.')) + '</div>' +
        '<div class="cards">' + locCatalog.map(c =>
          '<article class="card"><span class="eyebrow">' + esc(c.short) + '</span><h2>' + esc(c.title) + '</h2><p>' + esc(c.description) + '</p><p class="status">' + esc(c.status) + '</p><a class="action" href="' + esc(c.href) + '">' + esc(tp('curriculaExploreAction', { short: c.short }, 'Explore ' + c.short)) + '</a></article>'
        ).join('') + '</div>' +
        '<a href="./demo.html">' + esc(tp('curriculaDemoLink', null, 'View the institutional demonstration →')) + '</a>';
      return;
    }

    const available = locCourse.lessons.length;
    const l1Summary = progressCore.readLesson1Summary(readJsonKey(L1_KEY), readJsonKey(LAB_KEY));

    const lessonsMarkup = available
      ? '<p>' + esc(tp('catalogLessonsIntro', null, 'Each lesson can be explored independently. Checkpoints guide study within a lesson; screen completion is not demonstrated workplace competence. Lesson 1 retains its own saved progress.')) + '</p>' +
        '<div class="lesson-list">' + locCourse.lessons.map(l => {
          if (l.href) {
            return '<article class="panel lesson-row"><span class="number">' + l.number + '</span><div><h2>' + esc(l.title) + '</h2>' +
              '<p class="status">' + esc(l1Summary.statusText) + '</p></div>' +
              '<a class="action" href="' + esc(l.href) + '">' + esc(l1Summary.actionText) + '</a></article>';
          }
          const desc = progressCore.describeCatalogLesson(l, store.lessons[l.id]);
          return '<article class="panel lesson-row"><span class="number">' + l.number + '</span><div><h2>' + esc(l.title) + '</h2>' +
            '<p class="status">' + esc(desc.statusText) + '</p></div>' +
            '<a class="action" href="./?course=' + esc(locCourse.id) + '&lesson=' + esc(l.id) + '">' + esc(desc.actionText) + '</a></article>';
        }).join('') + '</div>' +
        '<section class="panel backup-panel" aria-labelledby="backup-heading">' +
        '<h2 id="backup-heading">' + esc(tp('backupHeading', null, 'Study summary & browser backup')) + '</h2>' +
        '<p class="status">' + esc(tp('backupDesc', null, 'Progress and drafts stay in this browser. Export JSON for recovery, restore a saved backup, or print a readable study sheet.')) + '</p>' +
        '<div class="backup-actions">' +
        '<button type="button" id="export-progress">' + esc(tp('exportJson', null, 'Export progress (JSON)', 'common')) + '</button>' +
        '<button type="button" id="import-progress">' + esc(tp('restoreJson', null, 'Restore progress', 'common')) + '</button>' +
        '<button type="button" id="export-study-sheet">' + esc(tp('printSummary', null, 'Print / view study summary', 'common')) + '</button>' +
        '<input type="file" id="import-file" accept=".json,application/json" hidden>' +
        '</div>' +
        (bannerMessage ? '<p id="backup-status" class="feedback self-review" role="status">' + esc(bannerMessage) + '</p>' : '<p id="backup-status" class="status" role="status"></p>') +
        '<div id="restore-preview" class="restore-preview" hidden></div>' +
        '</section>' +
        (locCourse.id === 'cbd'
          ? '<section class="panel backup-panel" aria-labelledby="e08-proto-heading">' +
            '<span class="eyebrow">' + esc(tp('protoBannerTitle', null, 'Separate Prototype Candidate · E08', 'notebook')) + '</span>' +
            '<h2 id="e08-proto-heading">' + esc(tp('notebookPromoHeading', null, 'Connected Evidence-to-Decision Notebook')) + '</h2>' +
            '<p class="status">' + esc(tp('notebookPromoDesc', null, 'Isolated prototype: carry verified observations and explicit assumptions across Lessons 1–6 under dedicated local storage (carana_notebook_v1) without changing course checkpoints or practical workbenches.')) + '</p>' +
            '<p><a class="action" id="open-e08-notebook" href="./notebook.html">' + esc(tp('notebookPromoAction', null, 'Open Connected Notebook prototype →')) + '</a></p>' +
            '</section>'
          : '')
      : '<section class="panel"><h2>' + esc(tp('comingSoonTitle', null, 'Sources verified; conversion not yet released.')) + '</h2><p>' + esc(tp('comingSoonBody', null, 'The official 2023 curriculum has been inventoried. No complete digital course is claimed here. Content review, activity integration, media and learner validation remain separate work.')) + '</p><p><a href="./demo.html#partnership">' + esc(tp('comingSoonLink', null, 'Explore the conversion programme')) + '</a></p></section>';

    root.innerHTML =
      '<a href="./?view=curricula">' + esc(tp('allCurriculaBack', null, '← All curricula')) + '</a>' +
      '<h1>' + esc(locCourse.title) + '</h1>' +
      '<p class="lead">' + esc(locCourse.description) + '</p>' +
      '<div class="banner">' + esc(locCourse.status) + '. ' + esc(locCourse.source) + '.</div>' +
      lessonsMarkup;

    if (available) {
      wireBackupControls(root, msg => catalogHTML(msg));
    }
  }

  function layout(content, headingNote, screenAttrs) {
    root.classList.remove('app-boot');
    const locCourse = getLocalizedCourse(baseCourseId) || course;
    const mobileLabel = tp('railSectionsMobile', { done: state.completed.length, total: lesson.sections.length }, 'Sections (' + state.completed.length + '/' + lesson.sections.length + ')');
    root.innerHTML =
      '<div class="workspace">' +
      '<aside class="rail panel">' +
      '<div class="rail-mobile-bar">' +
      '<a class="rail-back" href="' + (locCourse.id === 'cbd' ? '../course/#home' : './?course=' + esc(locCourse.id)) + '">← ' + (locCourse.id === 'cbd' ? esc(tp('railBackHome', null, 'CBD home')) : esc(tp('railBackLessons', { short: locCourse.short }, locCourse.short + ' lessons'))) + '</a>' +
      '<button type="button" class="rail-toggle" id="rail-toggle" aria-expanded="' + String(railExpanded) + '" aria-controls="rail-nav-panel">' + esc(mobileLabel) + ' ▾</button>' +
      '</div>' +
      '<div id="rail-nav-panel" class="rail-panel-body" data-collapsed="' + String(!railExpanded) + '">' +
      '<h2>' + esc(tp('lessonWord', { num: lesson.number }, 'Lesson ' + lesson.number)) + '</h2>' +
      '<p>' + esc(lesson.title) + '</p>' +
      '<nav aria-label="' + esc(tp('lessonNavAria', null, 'Lesson sections')) + '">' + lesson.sections.map((s, i) =>
        '<button type="button" data-section="' + i + '" ' + (i > state.completed.length ? 'disabled' : '') + ' ' + (i === selected ? 'aria-current="step"' : '') + '>' +
        esc((state.completed.includes(i) ? '✓ ' : '') + s.title) + '<small class="section-state">' + esc((i === selected ? tp('railCurrent', null, 'Current') + ' · ' : '') + (state.completed.includes(i) ? tp('railPassed', null, 'Checkpoint passed') : i > state.completed.length ? tp('railLocked', null, 'Not yet available') : tp('railAvailable', null, 'Available to study'))) + '</small></button>'
      ).join('') + '</nav>' +
      '<p class="status">' + esc(tp('railCheckpointsPassed', { done: state.completed.length, total: lesson.sections.length }, state.completed.length + ' / ' + lesson.sections.length + ' checkpoints passed')) + '</p>' +
      '<div class="rail-backup">' +
      '<button type="button" id="export-progress">' + esc(tp('exportBtn', null, 'Export progress')) + '</button>' +
      '<button type="button" id="import-progress">' + esc(tp('importBtn', null, 'Restore progress')) + '</button>' +
      '<button type="button" id="export-study-sheet">' + esc(tp('studyBtn', null, 'Study summary')) + '</button>' +
      '<input type="file" id="import-file" accept=".json,application/json" hidden>' +
      '</div>' +
      '<div id="restore-preview" class="restore-preview" hidden></div>' +
      '<p class="status" id="save-status" role="status">' +
      (headingNote ? esc(headingNote) : (storageFailed ? esc(tp('saveErr', null, 'Could not save progress. Export before closing.')) : esc(tp('statusStays', null, 'Progress stays in this browser.')))) +
      '</p>' +
      '</div></aside>' +
      '<article class="screen" ' + (screenAttrs || '') + '>' + content + '</article>' +
      '</div>';

    const currentScreen=lesson.sections[selected].screens[Math.min(index,lesson.sections[selected].screens.length-1)];
    window.CARANA_SUPPORT?.mount({root:root.querySelector('article.screen'),lessonId:lesson.id,lessonNumber:lesson.number,lessonTitle:lesson.title,section:lesson.sections[selected].title,screenId:currentScreen.id,screenTitle:root.querySelector('h1')?.textContent||currentScreen.title,mode:quiz?'checkpoint':'screen'});
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
    const badge = '<p class="status revision-badge">' + esc(tp('revisionBadgeTpl', { ver: last.contentVersion, count: archivedDraftScreens }, 'Revised from ' + last.contentVersion + ' · ' + archivedDraftScreens + ' archived draft screen(s) preserved')) + '</p>';
    if (state.revisionAck) return badge;

    const draftText = archivedDraftScreens > 0
      ? tp('revisionDraftsPresent', { count: archivedDraftScreens }, ' and ' + archivedDraftScreens + ' saved draft screen(s) are preserved in your export and archived read-only inside each practice tool.')
      : tp('revisionDraftsNone', null, ' are preserved in your export (no saved text drafts were present in that prior record).');
    return badge +
      '<div class="version-note" role="region" aria-label="' + esc(tp('revisionAria', null, 'Content revision notice')) + '">' +
      '<p>' + allowStrong(tp('revisionUpdatedBody', {
        curVer: lesson.version,
        oldVer: last.contentVersion,
        oldDone: last.completed.length,
        draftText
      }, '<strong>Lesson updated to ' + lesson.version + '.</strong> Earlier checkpoint records from ' + last.contentVersion +
      ' (' + last.completed.length + ' passed section(s))' + draftText + ' Review the updated material to record new checkpoints.')) + '</p>' +
      '<button type="button" id="ack-revision" class="small-btn">' + esc(tp('revisionAckBtn', null, 'Acknowledge notice')) + '</button>' +
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
      const lRoles = tpRaw('visualColsLogframe');
      const roles = Array.isArray(lRoles) && lRoles.length === 4 ? lRoles : ['Col 1 · Intended Result', 'Col 2 · Indicator / Measure', 'Col 3 · Verification Source', 'Col 4 · Assumption / Risk'];
      inner = '<div class="nodes nodes-logframe">' + nodes.map((n, i) => btn(n, i, roles[i])).join('') + '</div>' +
        '<p class="diagram-caption">' + esc(tp('visualCaptionLogframe', null, 'Read left to right: Result requires Verification and Source, contingent on External Conditions.')) + '</p>';
    } else if (layoutKind === 'system-deps' && nodes.length === 3) {
      inner = '<div class="nodes nodes-system">' +
        '<div class="sys-top">' + btn(nodes[0], 0, tp('visualSysTop', null, 'Authorising Tier')) + '</div>' +
        '<div class="sys-arrow" aria-hidden="true">' + esc(tp('visualSystemArrow', null, '↓ frames & coordinates with')) + '</div>' +
        '<div class="sys-peers">' + btn(nodes[1], 1, tp('visualSysLeft', null, 'Legal & Policy Context')) + btn(nodes[2], 2, tp('visualSysRight', null, 'Justice Sector Chain')) + '</div>' +
        '</div>';
    } else if (layoutKind === 'toc-bridge' && nodes.length === 4) {
      const lToc = tpRaw('visualTocRoles');
      const roles = Array.isArray(lToc) && lToc.length === 4 ? lToc : ['Condition (IF)', 'Projected Shift (THEN)', 'Mechanism (BECAUSE)', 'Precondition (PROVIDED THAT)'];
      inner = '<div class="nodes nodes-toc">' + nodes.map((n, i) => btn(n, i, roles[i])).join('') + '</div>';
    } else if (layoutKind === 'problem-loop') {
      inner = '<div class="nodes nodes-loop">' +
        nodes.map((n, i) => btn(n, i, tp('visualStepPrefix', { i: i + 1 }, 'Step ' + (i + 1)))).join('') +
        '</div><div class="loop-return" aria-hidden="true">' + esc(tp('visualProblemLoopReturn', null, '↺ Re-enter Step 1 whenever operational evidence or counterpart conditions shift')) + '</div>';
    } else if (layoutKind === 'principle-hub' && nodes.length === 4) {
      inner = '<div class="nodes nodes-hub">' +
        btn(nodes[0], 0, tp('visualPrinciplePrefix', { i: 1 }, 'Principle 1')) + btn(nodes[1], 1, tp('visualPrinciplePrefix', { i: 2 }, 'Principle 2')) +
        '<div class="hub-core" aria-hidden="true">' + esc(tp('visualPrincipleHubCore', null, 'Sustainable Handover')) + '</div>' +
        btn(nodes[2], 2, tp('visualPrinciplePrefix', { i: 3 }, 'Principle 3')) + btn(nodes[3], 3, tp('visualPrinciplePrefix', { i: 4 }, 'Principle 4')) +
        '</div>';
    } else if (kind === 'chain') {
      inner = '<div class="nodes">' + nodes.map((n, i) => btn(n, i, tp('visualStepPrefix', { i: i + 1 }, 'Step ' + (i + 1)))).join('') + '</div>';
    } else if (kind === 'compare') {
      inner = '<div class="nodes">' + nodes.map((n, i) => btn(n, i, nodes.length <= 2 ? (i === 0 ? tp('visualLensA', null, 'Lens A') : tp('visualLensB', null, 'Lens B')) : tp('visualComparePrefix', { i: i + 1 }, 'Compare ' + (i + 1)))).join('') + '</div>';
    } else if (kind === 'cycle') {
      inner = '<div class="nodes">' + nodes.map((n, i) => btn(n, i, tp('visualPhasePrefix', { i: i + 1 }, 'Phase ' + (i + 1)))).join('') + '</div>' +
        '<div class="loop-return" aria-hidden="true">' + esc(tp('visualCycleLoopReturn', null, '↺ Iterative cycle: return and adjust as field evidence updates')) + '</div>';
    } else {
      inner = '<div class="nodes">' + nodes.map((n, i) => btn(n, i, '')).join('') + '</div>';
    }

    return '<div class="visual" data-kind="' + esc(kind) + '" data-layout="' + esc(layoutKind) + '">' +
      '<div class="visual-head"><span class="eyebrow">' + esc(tp('exploreRelEyebrow', null, 'Explore the relationship')) + '</span>' +
      '<span class="visual-progress" id="visual-progress">' + esc(tp('visualProgressTpl', { done: 0, total: nodes.length }, '0 of ' + nodes.length + ' components explored')) + '</span></div>' +
      '<h2>' + esc(v.title) + '</h2>' + inner +
      '<div id="concept-feedback" class="reveal" role="status">' + esc(tp('visualFeedbackDefault', null, 'Select a component to explore its meaning and relationship to the whole.')) + '</div></div>';
  }

  function buildSourceHTML(screen) {
    const src = lesson.source || {};
    const label = src.label || src.file || 'Curriculum source reference';
    const sha = typeof src.sha256 === 'string' && src.sha256.length >= 12 ? src.sha256.slice(0, 12) + '…' : '';
    const shaPart = sha ? ' · SHA-256: ' + sha : '';
    const fileHtml = esc(tp('sourceFileLine', {
      file: src.file || '',
      pages: src.pages || screen.sourcePages,
      shaPart
    }, 'Source file: <code>' + (src.file || '') + '</code> · Lesson scope: pp. ' + (src.pages || screen.sourcePages) +
      (sha ? ' · SHA-256 prefix: <code>' + sha + '</code>' : ''))).replace(/&lt;(\/?code)&gt;/g, '<$1>');
    return '<p class="status source-summary">' + esc(tp('sourceSummaryTpl', { label, pages: screen.sourcePages }, 'Source: ' + label + ' · pages ' + screen.sourcePages + '.')) + '</p>' +
      (src.file
        ? '<details class="source-details"><summary>' + esc(tp('sourceTechSummary', null, 'Technical curriculum source & verification record')) + '</summary><p class="status">' + fileHtml + '</p></details>'
        : '');
  }

  function render(statusMessage) {
    window.CARANA_SUPPORT?.dispose();
    const section = lesson.sections[selected];
    const count = lesson.sections.reduce((n, s) => n + s.screens.length, 0);
    const ordinal = lesson.sections.slice(0, selected).reduce((n, s) => n + s.screens.length, 0) + index + 1;
    const banner = buildRevisionBanner() + '<p class="status">' + esc(tp('reviewBanner', null, 'REVIEW ADAPTATION · English transcript · Independent, not UN-endorsed')) + '</p>';

    if (quiz) {
      renderQuiz(section, banner, statusMessage);
      return;
    }

    const screen = section.screens[index];
    const rhythm = RHYTHM_META[screen.rhythm] ? screen.rhythm : 'explain';
    const rhythmLabel = tp('rhythmMeta.' + rhythm, null, RHYTHM_META[rhythm]);
    const orientationMarkup = selected === 0 && index === 0
      ? '<details open><summary>' + esc(tp('orientationSummary', null, 'Learning orientation')) + '</summary><ul>' + lesson.objectives.map(o => '<li>' + esc(o) + '</li>').join('') + '</ul><p>' + esc(tp('orientationNote', null, 'Explore the relationships, make a decision, check your understanding and apply your own reasoning in the original practical activity. English text is the current review language.')) + '</p></details>'
      : '';
    const visualMarkup = buildVisualHTML(screen);
    const workedMarkup = screen.worked
      ? '<div class="worked-contrast"><div><h3>' + esc(tp('workedBefore', null, 'Initial proposal')) + '</h3><p>' + esc(screen.worked.before) + '</p><p class="status">' + esc(screen.worked.beforeWhy) + '</p></div><div class="improved"><h3>' + esc(tp('workedAfter', null, 'A more defensible approach')) + '</h3><p>' + esc(screen.worked.after) + '</p><p class="status">' + esc(screen.worked.afterWhy) + '</p></div></div>'
      : '';
    const pointsListMarkup = '<ul class="points">' + screen.points.map(p => '<li>' + esc(p) + '</li>').join('') + '</ul>';
    const pointsMarkup = rhythm === 'construct'
      ? '<details class="points-reference"><summary>' + esc(tp('pointsSummary', { count: screen.points.length }, 'Reference criteria & key takeaways (' + screen.points.length + ')')) + '</summary>' + pointsListMarkup + '</details>'
      : pointsListMarkup;
    const transcriptMarkup = '<details><summary>' + esc(tp('transcriptSummary', null, 'Read the trainer explanation')) + '</summary><p class="transcript">' + esc(screen.transcript) + '</p><p class="status">' + esc(tp('transcriptPending', null, 'Recording pending review. No synthetic playback has been substituted.')) + '</p></details>';
    const labMarkup = screen.lab && learningTools ? learningTools.html(screen.lab) : '';
    const decisionMarkup = '<section class="decision"><span class="eyebrow">' + esc(tp('decideEyebrow', null, 'Decide · invented teaching example')) + '</span><h2>' + esc(screen.decision.prompt) + '</h2><div class="choices">' +
      screen.decision.options.map((o, i) => '<button type="button" data-choice="' + i + '" aria-pressed="false">' + esc(o.label) + '</button>').join('') +
      '</div><div id="decision-feedback" class="feedback" role="status" hidden></div></section>';
    const takeawayMarkup = '<div class="banner"><strong>' + esc(tp('takeawayStrong', null, 'Carry this forward')) + '</strong><p>' + esc(screen.takeaway) + '</p></div>';
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

    const screenCounterText = (i18n?.getLang() === 'fr-FR'
      ? 'Écran ' + ordinal + ' sur ' + count
      : i18n?.getLang() === 'ar'
        ? 'الشاشة ' + ordinal + ' من ' + count
        : 'Screen ' + ordinal + ' of ' + count);

    layout(
      banner +
      '<div class="progress"><span>' + esc(section.title) + '</span><span>' + esc(screenCounterText) + '</span>' +
      '<progress value="' + ordinal + '" max="' + count + '" aria-label="' + esc(screenCounterText) + '"></progress></div>' +
      '<span class="rhythm-tag rhythm-' + esc(rhythm) + '">' + esc(rhythmLabel) + '</span>' +
      '<h1>' + esc(screen.title) + '</h1>' +
      '<p class="lead">' + esc(screen.lead) + '</p>' +
      orderedBody +
      '<div class="actions"><button type="button" id="back" ' + (selected === 0 && index === 0 ? 'disabled' : '') + '>' + esc(tp('backBtn', null, '← Back')) + '</button><button type="button" id="next" class="primary">' +
      esc(index === section.screens.length - 1 ? tp('checkpointBtn', null, 'Knowledge checkpoint →') : tp('nextBtn', null, 'Continue →')) + '</button></div>',
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
        const draftStatus=root.querySelector('#draft-save-status');
        if(draftStatus)draftStatus.textContent=storageFailed?tp('draftSaveFailed', null, 'Draft remains in this page; saving failed. Export before closing.'):tp('draftSavedStatus', null, 'Practice draft saved on this device · separate from checkpoints');
      }, document, { archivedDrafts });
    }

    if(screen.lab){const note=document.createElement('p');note.id='draft-save-status';note.className='practice-history';note.setAttribute('role','status');note.textContent=state.drafts?.[screen.id]?tp('draftSavedAvail', null, 'Saved practice draft available · separate from checkpoints'):'';root.querySelector('.applied-lab')?.append(note);}

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

    root.querySelectorAll('.table-scroll').forEach(el=>{el.tabIndex=0;el.setAttribute('role','region');el.setAttribute('aria-label',tp('priorityCaption', null, 'Scrollable learning table', 'learningTools'));});
    const explanation = exploration?.bind({lessonId:lesson.id,screenId:screen.id,items:screen.visual.nodes,
      buttons:root.querySelectorAll('[data-node]'),feedback:document.getElementById('concept-feedback'),count:document.getElementById('visual-progress'),container:root.querySelector('.visual'),
      onSelect:i=>{const fb=document.getElementById('concept-feedback');fb.dataset.readExplanation='true';fb.dataset.readTitle=screen.visual.nodes[i].label;fb.textContent=screen.visual.nodes[i].detail;},practiceButtons:[...root.querySelectorAll('[data-choice]')]});

    if(!explanation){const seen=new Set();root.querySelectorAll('[data-node]').forEach(b=>b.onclick=()=>{root.querySelectorAll('[data-node]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));const i=+b.dataset.node;seen.add(i);const fb=document.getElementById('concept-feedback');fb.dataset.readExplanation='true';fb.dataset.readTitle=screen.visual.nodes[i].label;fb.textContent=screen.visual.nodes[i].detail;document.getElementById('visual-progress').textContent=tp('countExplored', { done: seen.size, total: screen.visual.nodes.length }, 'Explanations '+seen.size+' of '+screen.visual.nodes.length+' explored', 'exploration');fb.dispatchEvent(new CustomEvent('carana:explanation-updated',{bubbles:true,detail:{id:screen.visual.nodes[i].label,target:fb}}));});}

    root.querySelectorAll('[data-choice]').forEach(b => b.onclick = () => {
      root.querySelectorAll('[data-choice]').forEach(n => n.setAttribute('aria-pressed', String(n === b)));
      const i = +b.dataset.choice;
      const el = document.getElementById('decision-feedback');
      el.hidden = false;
      el.className = 'feedback' + (i === screen.decision.answer ? '' : ' warning');
      el.dataset.readExplanation = 'true';
      el.dataset.readTitle = screen.decision.options[i].label;
      el.textContent = (i === screen.decision.answer ? tp('choiceGood', null, 'A defensible choice. ') : tp('choiceReflect', null, 'Consider the implications. ')) + screen.decision.options[i].feedback;
      el.dispatchEvent(new CustomEvent('carana:explanation-updated', { bubbles: true, detail: { id: screen.decision.options[i].label, target: el } }));
    });
    root.addEventListener('toggle', e => {
      if (e.target && e.target.matches && e.target.matches('details')) {
        e.target.dispatchEvent(new CustomEvent('carana:explanation-updated', { bubbles: true, detail: { toggled: true, target: e.target } }));
      }
    }, true);

    document.getElementById('next').onclick = () => {
      const advance=()=>{
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
      if(explanation)explanation.advance(advance);else advance();
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
        '<span class="eyebrow">' + esc(tp('cpPassedEyebrow', null, 'Checkpoint passed')) + '</span><h1>' + esc(last ? tp('cpPassedLastHeading', null, 'Carry your work into practice.') : tp('cpPassedHeading', null, 'Understanding checked.')) + '</h1>' +
        '<p>' + esc(tp('cpPassedDesc', { count: section.quiz.length }, 'You corrected all ' + section.quiz.length + ' questions. This records guided study, not professional certification.')) + '</p>' +
        (last
          ? '<p>' + esc(tp('cpLastPracticeNote', null, 'Apply your own analysis in the original practical activity, and ask a peer or facilitator to challenge your reasoning. The digital checkpoint does not assess your workbench output.')) + '</p>' +
            '<a class="action primary" href="' + esc(lesson.activity) + '" target="_blank" rel="noopener noreferrer">' + esc(tp('cpOpenOrigBtn', { num: lesson.number }, 'Open original Lesson ' + lesson.number + ' activity ↗')) + '</a>' +
            '<p class="status">' + esc(tp('cpArtworkNote', null, 'Cinematic artwork is specified for this lesson; new images and narration are pending authorised production and review.')) + '</p>'
          : '') +
        quizHandoff +
        (last && lesson.number < 6 ? '<p><a class="action" href="./?course=cbd&lesson=cbd-' + (lesson.number + 1) + '">' + esc(tp('cpNextLessonBtn', { num: lesson.number + 1 }, 'Continue to Lesson ' + (lesson.number + 1) + ' →')) + '</a></p>' : '') +
        '<div class="actions"><button type="button" id="review">' + esc(tp('cpReviewBtn', null, 'Review this section')) + '</button>' +
        (last ? '<a class="action" href="../course/#home">' + esc(tp('cpReturnHomeBtn', null, 'Return to CBD home')) + '</a>' : '<button type="button" id="continue" class="primary">' + esc(tp('cpNextSectionBtn', null, 'Next section →')) + '</button>') +
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
      '<span class="eyebrow">' + esc(tp('cpFormativeEyebrow', null, 'Formative knowledge checkpoint')) + '</span><h1>' + esc(section.title) + '</h1>' +
      '<p>' + esc(tp('cpRuleDesc', { count: section.quiz.length }, 'Correct all ' + section.quiz.length + ' questions to continue. Retry without penalty. This is the adaptation’s study rule, not an official UN qualification standard.')) + '</p>' +
      '<form id="quiz">' + section.quiz.map((q, i) =>
        '<fieldset><legend>' + esc(q.prompt) + '</legend>' +
        q.options.map((option, j) => '<label class="choice"><input type="radio" name="q' + i + '" value="' + j + '" ' + (answers[i] === j ? 'checked' : '') + '><span>' + esc(option) + '</span></label>').join('') +
        (checked && answers[i] !== q.answer ? '<p class="quiz-hint">' + esc((q.optionFeedback?.[answers[i]] || '') + ' ' + q.feedback) + '</p>' : '') +
        '</fieldset>'
      ).join('') + '</form>' +
      '<p id="quiz-status" role="status">' + esc(checked ? tp('cpFeedbackRetry', null, 'Review the feedback and correct the remaining answers.') : tp('cpFeedbackSelect', null, 'Select an answer for every question.')) + '</p>' +
      '<div class="actions"><button type="button" id="review">' + esc(tp('cpReviewScreensBtn', null, 'Review learning screens')) + '</button><button type="button" id="check" class="primary">' + esc(tp('cpCheckAnswersBtn', null, 'Check answers →')) + '</button></div>',
      statusMessage
    );

    const ackBtn = document.getElementById('ack-revision');
    if (ackBtn) ackBtn.onclick = () => { state.revisionAck = true; save(); render(); };
    root.querySelectorAll('#quiz input').forEach(inp => inp.onchange = () => { answers[+inp.name.slice(1)] = +inp.value; });
    document.getElementById('review').onclick = () => { quiz = false; save(); render(); focus(); };
    document.getElementById('check').onclick = () => {
      const missing = section.quiz.some((_, i) => answers[i] === undefined);
      if (missing) {
        document.getElementById('quiz-status').textContent = tp('cpAnswerAll', null, 'Answer every question before checking.');
        return;
      }
      checked = true;
      if (section.quiz.every((q, i) => answers[i] === q.answer)) {
        const newlyPassed = !state.completed.includes(selected);
        state.completed = [...new Set([...state.completed, selected])].sort((a, b) => a - b);
        save();
        if (newlyPassed) {
          window.CARANA_MONITORING?.event('checkpoint_completed', lesson.id + ':checkpoint-' + (selected + 1));
          if (state.completed.length === lesson.sections.length) window.CARANA_MONITORING?.event('lesson_completed', lesson.id);
        }
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
    const langSlot = document.getElementById('platform-lang-slot');
    if (i18n && langSlot) {
      i18n.mountSwitcher(langSlot, { variant: 'light' });
      i18n.onChange(async newLang => {
        if (newLang !== 'en') await i18n.ready(['ui', 'lessons-2-6']);
        i18n.applyStaticDom(document);
        document.title = tp('pageTitle', null, 'CARANA E-Learning');
        closeModal('study-summary-modal');
        if (!ref?.file) {
          catalogHTML();
        } else if (rawLesson) {
          lesson = localizeLesson(rawLesson);
          render();
        }
      });
    }
    if (i18n && i18n.getLang() !== 'en') {
      await i18n.ready(['ui', 'lessons-2-6']);
      i18n.applyStaticDom(document);
      document.title = tp('pageTitle', null, 'CARANA E-Learning');
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
      rawLesson = data.find(x => x.id === ref.id);
      if (!rawLesson?.sections?.length || !rawLesson.sections.every(s => s.screens?.length && s.quiz?.length)) {
        throw Error('Lesson structure is invalid.');
      }
      lesson = localizeLesson(rawLesson);
      state = progressCore.safeProgress(rawLesson, store.lessons[rawLesson.id]);
      selected = state.section;
      index = state.screen;
      quiz = state.view === 'quiz';
      render();
      ready = true;
    } catch (_) {
      root.classList.remove('app-boot');
      root.innerHTML = '<h1>' + esc(tp('loadErrHeading', null, 'This lesson could not open.')) + '</h1><p>' + esc(tp('loadErrBody', null, 'Check your connection and try again. Your existing progress has not been changed.')) + '</p><a class="action" href="../course/#home">' + esc(tp('cpReturnHomeBtn', null, 'Return to CBD home')) + '</a>';
      ready = true;
    }
  }

  function mountHome(container, bannerMessage) {
    if (!homeMode || !container) return;
    root = container;
    store = load();
    const locCourse = getLocalizedCourse('cbd') || course;
    for (const entry of locCourse.lessons) {
      const desc = entry.href
        ? progressCore.readLesson1Summary(readJsonKey(L1_KEY), readJsonKey(LAB_KEY))
        : progressCore.describeCatalogLesson(entry, store.lessons[entry.id]);
      const status = document.querySelector('[data-home-progress="' + entry.id + '"]');
      const action = document.querySelector('[data-home-lesson="' + entry.id + '"]');
      if (status) status.textContent = desc.statusText;
      if (action) action.textContent = desc.actionText + ' ↗';
    }
    container.innerHTML =
      '<p>' + esc(tp('homeBackupNote', null, 'Progress and drafts stay in this browser. Keep a backup before clearing browser data.')) + '</p>' +
      '<div class="backup-actions"><button class="btn outline small" id="export-progress">' + esc(tp('homeExportL26', null, 'Export Lessons 2–6 (JSON)')) + '</button>' +
      '<button class="btn outline small" id="import-progress">' + esc(tp('homeImportL26', null, 'Restore Lessons 2–6')) + '</button>' +
      '<button class="btn outline small" id="export-study-sheet">' + esc(tp('printSummary', null, 'Print / view study summary', 'common')) + '</button>' +
      '<input type="file" id="import-file" accept=".json,application/json" hidden></div>' +
      '<p id="backup-status" role="status">' + esc(bannerMessage || (exploration?.store.failed ? tp('explorationFailed', null, 'Exploration history could not save. Export a backup before closing.') : '')) + '</p>' +
      '<div id="restore-preview" class="restore-preview" hidden></div>' +
      '<div class="backup-actions"><button class="btn outline small" id="home-export-l1">' + esc(tp('homeExportL1', null, 'Export Lesson 1 (JSON)')) + '</button>' +
      '<button class="btn outline small" id="home-restore-l1">' + esc(tp('homeRestoreL1', null, 'Restore Lesson 1 backup (JSON)')) + '</button>' +
      '<input type="file" id="home-import-l1-file" accept=".json,application/json" hidden></div>' +
      '<div id="l1-restore-preview" class="l1-restore-preview" hidden></div>';
    wireBackupControls(container, message => {
      // Preserve Lesson 1 listeners when refreshing expanded progress.
      const curCourse = getLocalizedCourse('cbd') || course;
      for (const entry of curCourse.lessons.filter(x => !x.href)) {
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
