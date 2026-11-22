/* CARANA CBD Course Reset controller & safe storage clearer.
 * Clears learner-owned CBD data across Lesson 1, Lessons 2-6, practical workbenches,
 * group exercise, visual exploration history, and Evidence-to-Decision Notebook
 * while preserving interface language preferences, non-CBD courses, and config.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CARANA_COURSE_RESET = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const CBD_LESSON_IDS = ['cbd-1', 'cbd-2', 'cbd-3', 'cbd-4', 'cbd-5', 'cbd-6'];
  const CBD_LESSON_RE = /^cbd-[1-6]$/;
  const CBD_EXPLORE_RE = /^cbd-[1-6]\//;

  const DIRECT_CLEAR_KEYS = [
    'carana_cbd_course_v1',
    'carana_cbd_course_v1_pre_restore',
    'carana_cbd_lab_v1',
    'carana_cbd_lab_v1_corrupted_backup',
    'carana_cbd_lab_v1_pre_handoff',
    'carana_notebook_v1',
    'carana_notebook_v1_pre_restore',
    'carana_cbd_group_activity_v1'
  ];

  const SCOPED_LEARNING_KEYS = [
    'carana_learning_v1',
    'carana_learning_v1_pre_restore'
  ];

  const EXPLORATION_KEY = 'carana_exploration_v1';
  const LAB_RESET_TOKEN_KEY = 'carana_cbd_lab_reset_token';

  const hooks = {
    exportLesson1: null,
    exportLessons2to6: null,
    resetPlatformState: null,
    onReset: null
  };

  function getI18n() {
    return typeof window !== 'undefined' ? window.CARANA_I18N : null;
  }

  function formatVars(str, vars) {
    if (!vars || typeof vars !== 'object') return str;
    return String(str).replace(/\{(\w+)\}/g, (m, k) =>
      Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m
    );
  }

  function rt(key, vars, fallback) {
    const i18n = getI18n();
    if (!i18n || i18n.getLang() === 'en') return formatVars(fallback, vars);
    return i18n.t('resetCourse.' + key, vars, fallback);
  }

  function rtList(key, fallbackList) {
    const i18n = getI18n();
    if (!i18n || i18n.getLang() === 'en') return fallbackList;
    const raw = i18n.rawList('resetCourse.' + key, fallbackList);
    return Array.isArray(raw) && raw.length ? raw : fallbackList;
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function removeDirectKey(storage, sessionStore, key, result) {
    let hadLocal = false;
    try {
      hadLocal = storage && storage.getItem(key) !== null;
    } catch (_) {
      result.failedKeys.push(key);
      return;
    }

    let hadSession = false;
    try {
      hadSession = !!(sessionStore && sessionStore.getItem(key) !== null);
    } catch (_) {
      hadSession = false;
    }

    try {
      if (storage) storage.removeItem(key);
      if (sessionStore) {
        try {
          sessionStore.removeItem(key);
        } catch (_) {
          if (hadSession) {
            result.failedKeys.push(key);
            return;
          }
        }
      }
      if (storage && storage.getItem(key) !== null) {
        result.failedKeys.push(key);
      } else if (hadLocal || hadSession) {
        result.clearedKeys.push(key);
      }
    } catch (_) {
      result.failedKeys.push(key);
    }
  }

  function clearScopedJsonField(storage, key, fieldName, matchFn, result) {
    let raw = null;
    try {
      if (!storage) return;
      raw = storage.getItem(key);
    } catch (_) {
      result.failedKeys.push(key);
      return;
    }
    if (raw === null) return;

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      parsed = null;
    }

    const bucket = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed[fieldName] : null;
    if (bucket && typeof bucket === 'object' && !Array.isArray(bucket)) {
      const retained = {};
      let removedCount = 0;
      for (const [entryKey, entryVal] of Object.entries(bucket)) {
        if (matchFn(entryKey)) removedCount++;
        else retained[entryKey] = entryVal;
      }
      if (!removedCount) return;

      if (Object.keys(retained).length > 0) {
        try {
          storage.setItem(key, JSON.stringify({ ...parsed, [fieldName]: retained }));
          const verify = JSON.parse(storage.getItem(key) || '{}');
          if (Object.keys(verify[fieldName] || {}).some(matchFn)) {
            result.failedKeys.push(key);
          } else {
            result.partialUpdates.push(key);
            result.preservedNonCbd = true;
          }
        } catch (_) {
          result.failedKeys.push(key);
        }
        return;
      }
    }

    try {
      storage.removeItem(key);
      if (storage.getItem(key) !== null) {
        result.failedKeys.push(key);
      } else {
        result.clearedKeys.push(key);
      }
    } catch (_) {
      result.failedKeys.push(key);
    }
  }

  function clearScopedExploration(storage, explorationStore, result) {
    let hasForeignRecords = false;
    try {
      const raw = storage?.getItem(EXPLORATION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.records && typeof parsed.records === 'object') {
          hasForeignRecords = Object.keys(parsed.records).some(k => !CBD_EXPLORE_RE.test(k));
        }
      }
    } catch (_) {
      hasForeignRecords = false;
    }

    if (!hasForeignRecords && explorationStore && typeof explorationStore.resetFor === 'function') {
      let ok = false;
      try {
        ok = !!explorationStore.resetFor(CBD_LESSON_IDS);
      } catch (_) {
        ok = false;
      }
      if (!ok || explorationStore.failed) {
        result.failedKeys.push(EXPLORATION_KEY);
        return;
      }
      try {
        const afterRaw = storage?.getItem(EXPLORATION_KEY);
        if (afterRaw === null) {
          result.clearedKeys.push(EXPLORATION_KEY);
        } else {
          const parsed = JSON.parse(afterRaw);
          if (Object.keys(parsed?.records || {}).some(k => CBD_EXPLORE_RE.test(k))) {
            result.failedKeys.push(EXPLORATION_KEY);
          } else {
            result.partialUpdates.push(EXPLORATION_KEY);
            result.preservedNonCbd = true;
          }
        }
      } catch (_) {
        result.failedKeys.push(EXPLORATION_KEY);
      }
      return;
    }

    clearScopedJsonField(storage, EXPLORATION_KEY, 'records', k => CBD_EXPLORE_RE.test(k), result);
  }

  /**
   * Reset all locally stored CBD course data for the current browser while leaving
   * language selection, non-CBD curricula, AI config, and unrelated keys intact.
   * Returns structured status with any keys that failed to clear.
   */
  function resetCbdCourse(options = {}) {
    const storage = Object.prototype.hasOwnProperty.call(options, 'storage')
      ? options.storage
      : (typeof localStorage !== 'undefined' ? localStorage : null);
    const sessionStore = Object.prototype.hasOwnProperty.call(options, 'sessionStorage')
      ? options.sessionStorage
      : (typeof sessionStorage !== 'undefined' ? sessionStorage : null);
    const explorationStore = Object.prototype.hasOwnProperty.call(options, 'explorationStore')
      ? options.explorationStore
      : (typeof window !== 'undefined' ? window.CARANA_EXPLORATION?.store : null);

    let labExisted = false;
    try {
      labExisted = !!(storage && storage.getItem('carana_cbd_lab_v1') !== null);
    } catch (_) {
      labExisted = false;
    }

    const result = {
      ok: true,
      clearedKeys: [],
      partialUpdates: [],
      failedKeys: [],
      preservedNonCbd: false,
      preservedLanguage: null
    };

    try {
      result.preservedLanguage = storage ? storage.getItem('carana_lang_v1') : null;
    } catch (_) {
      result.preservedLanguage = null;
    }

    if (!storage) {
      result.ok = false;
      result.failedKeys.push('localStorage');
      return result;
    }

    for (const key of DIRECT_CLEAR_KEYS) {
      removeDirectKey(storage, sessionStore, key, result);
    }

    for (const key of SCOPED_LEARNING_KEYS) {
      clearScopedJsonField(storage, key, 'lessons', id => CBD_LESSON_RE.test(id), result);
    }

    clearScopedExploration(storage, explorationStore, result);

    if (labExisted && !result.failedKeys.includes('carana_cbd_lab_v1')) {
      try {
        storage.setItem(LAB_RESET_TOKEN_KEY, String(Date.now()));
        storage.removeItem(LAB_RESET_TOKEN_KEY);
      } catch (_) {
        // Cross-tab token broadcast is best-effort once main lab storage is removed.
      }
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
        try {
          window.dispatchEvent(new CustomEvent('carana_cbd_lab_reset'));
        } catch (_) {}
      }
    }

    result.failedKeys = [...new Set(result.failedKeys)];
    result.clearedKeys = [...new Set(result.clearedKeys)];
    result.partialUpdates = [...new Set(result.partialUpdates)];
    result.ok = result.failedKeys.length === 0;
    return result;
  }

  function registerHooks(nextHooks) {
    if (!nextHooks || typeof nextHooks !== 'object') return;
    if (typeof nextHooks.exportLesson1 === 'function') hooks.exportLesson1 = nextHooks.exportLesson1;
    if (typeof nextHooks.exportLessons2to6 === 'function') hooks.exportLessons2to6 = nextHooks.exportLessons2to6;
    if (typeof nextHooks.resetPlatformState === 'function') hooks.resetPlatformState = nextHooks.resetPlatformState;
    if (typeof nextHooks.onReset === 'function') hooks.onReset = nextHooks.onReset;
  }

  function downloadJsonFallback(filename, payload) {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function triggerL1Backup() {
    if (typeof hooks.exportLesson1 === 'function') {
      hooks.exportLesson1();
      return true;
    }
    try {
      const raw = JSON.parse(localStorage.getItem('carana_cbd_course_v1') || 'null');
      const exp = window.CARANA_EXPLORATION?.store?.exportFor(['cbd-1']);
      downloadJsonFallback('carana-cbd-lesson1-progress.json', {
        course: 'CARANA CBD E-Learning',
        lesson: 'Situational Analysis',
        progress: raw || { version: 1, completed: [], visited: [], activityOpened: false, lessonComplete: false, lastSection: 0, lastScreen: 0, lastKind: 'screen' },
        exploration: exp,
        exportedAt: new Date().toISOString(),
        note: 'Learner-side progress record, not a UN-issued certificate.'
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  function triggerL26Backup() {
    if (typeof hooks.exportLessons2to6 === 'function') {
      hooks.exportLessons2to6();
      return true;
    }
    try {
      const raw = JSON.parse(localStorage.getItem('carana_learning_v1') || 'null');
      const exp = window.CARANA_EXPLORATION?.store?.exportFor(['cbd-2', 'cbd-3', 'cbd-4', 'cbd-5', 'cbd-6']);
      downloadJsonFallback('carana-learning-progress.json', {
        version: 1,
        exportedAt: new Date().toISOString(),
        progress: raw || { version: 1, lessons: {} },
        exploration: exp,
        note: 'Browser-local study progress and drafts. Not an official UN qualification.'
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  function ensureDialog(onAfterReset) {
    let dialog = document.getElementById('cbd-reset-dialog');
    if (dialog) return dialog;

    dialog = document.createElement('dialog');
    dialog.id = 'cbd-reset-dialog';
    dialog.className = 'cbd-reset-dialog';
    dialog.setAttribute('aria-labelledby', 'cbd-reset-title');
    if ('closedBy' in HTMLDialogElement.prototype) {
      dialog.closedBy = 'any';
    }
    document.body.appendChild(dialog);

    dialog.addEventListener('click', event => {
      if (event.target === dialog) {
        dialog.close('backdrop');
      }
    });

    dialog.addEventListener('close', () => {
      const val = dialog.returnValue;
      dialog.returnValue = '';
      if (val === 'confirmed') return;
    });

    return dialog;
  }

  function renderDialogContents(dialog, onAfterReset) {
    const clearItems = rtList('willClearItems', [
      'Lessons 1–6 progress, quiz attempts, and completion statuses',
      'Saved in-lesson activity drafts and diagram exploration history',
      'Practical Workbenches (Modules 1–6) and 60-minute Group Exercise data',
      'Evidence-to-Decision Notebook records and snapshots'
    ]);

    dialog.innerHTML =
      '<div class="cbd-reset-dialog-head">' +
        '<span class="cbd-reset-eyebrow">' + esc(rt('sectionHeading', null, 'Reset local CBD course data')) + '</span>' +
        '<h2 id="cbd-reset-title">' + esc(rt('dialogTitle', null, 'Reset your CBD course?')) + '</h2>' +
      '</div>' +
      '<div class="cbd-reset-dialog-body">' +
        '<p class="cbd-reset-lead">' + esc(rt('dialogLead', null, 'This permanently clears all learner-owned CBD course data saved in this browser.')) + '</p>' +
        '<div class="cbd-reset-scope-block">' +
          '<strong>' + esc(rt('willClearTitle', null, 'Data that will be cleared')) + '</strong>' +
          '<ul>' + clearItems.map(item => '<li>' + esc(item) + '</li>').join('') + '</ul>' +
        '</div>' +
        '<div class="cbd-reset-keep-block">' +
          '<strong>' + esc(rt('willKeepTitle', null, 'What stays intact')) + '</strong>' +
          '<p>' + esc(rt('willKeepBody', null, 'Your selected interface language, non-CBD curricula or unrelated browser settings, AI & service settings, and all course content remain unchanged.')) + '</p>' +
        '</div>' +
        '<div class="cbd-reset-backup-block">' +
          '<strong>' + esc(rt('backupTitle', null, 'Back up before resetting')) + '</strong>' +
          '<p>' + esc(rt('backupCoverageNote', null, 'Course JSON exports save Lessons 1–6 progress, drafts, and exploration history only. They do NOT include Practical Workbenches (Modules 1–6) or Evidence-to-Decision Notebook records — export those directly inside a Workbench or the Notebook before resetting.')) + '</p>' +
          '<div class="cbd-reset-export-row">' +
            '<button type="button" class="btn outline small" id="cbd-reset-export-l1">' + esc(rt('exportL1Btn', null, 'Export Lesson 1 (JSON)')) + '</button>' +
            '<button type="button" class="btn outline small" id="cbd-reset-export-l26">' + esc(rt('exportL26Btn', null, 'Export Lessons 2–6 (JSON)')) + '</button>' +
          '</div>' +
          '<p id="cbd-reset-export-status" class="cbd-reset-feedback" role="status" hidden></p>' +
        '</div>' +
        '<div id="cbd-reset-error" class="cbd-reset-error" role="alert" hidden></div>' +
      '</div>' +
      '<div class="cbd-reset-dialog-foot">' +
        '<button type="button" class="btn outline" id="cbd-reset-cancel" autofocus>' + esc(rt('cancelBtn', null, 'Cancel')) + '</button>' +
        '<button type="button" class="btn cbd-reset-confirm-btn" id="cbd-reset-confirm">' + esc(rt('confirmBtn', null, 'Reset Course')) + '</button>' +
      '</div>';

    const expStatus = dialog.querySelector('#cbd-reset-export-status');
    dialog.querySelector('#cbd-reset-export-l1').onclick = () => {
      if (triggerL1Backup()) {
        expStatus.hidden = false;
        expStatus.textContent = rt('exportedStatus', { label: rt('exportL1Btn', null, 'Export Lesson 1 (JSON)') }, 'Backup downloaded: Export Lesson 1 (JSON).');
      }
    };
    dialog.querySelector('#cbd-reset-export-l26').onclick = () => {
      if (triggerL26Backup()) {
        expStatus.hidden = false;
        expStatus.textContent = rt('exportedStatus', { label: rt('exportL26Btn', null, 'Export Lessons 2–6 (JSON)') }, 'Backup downloaded: Export Lessons 2–6 (JSON).');
      }
    };
    dialog.querySelector('#cbd-reset-cancel').onclick = () => {
      dialog.close('cancel');
    };
    dialog.querySelector('#cbd-reset-confirm').onclick = () => {
      const outcome = resetCbdCourse();
      if (!outcome.ok) {
        const errBox = dialog.querySelector('#cbd-reset-error');
        errBox.hidden = false;
        errBox.textContent = rt('partialError', { keys: outcome.failedKeys.join(', ') }, 'Reset could not clear every storage item cleanly (' + outcome.failedKeys.join(', ') + '). Export anything you need or clear site data in your browser settings.');
        return;
      }
      if (typeof hooks.resetPlatformState === 'function') {
        hooks.resetPlatformState();
      }
      dialog.returnValue = 'confirmed';
      dialog.close('confirmed');
      if (typeof hooks.onReset === 'function') {
        hooks.onReset(outcome);
      } else if (typeof onAfterReset === 'function') {
        onAfterReset(outcome);
      }
    };
  }

  function openConfirmDialog(options = {}) {
    const dialog = ensureDialog(options.onAfterReset);
    renderDialogContents(dialog, options.onAfterReset);
    dialog.showModal();
    const cancelBtn = dialog.querySelector('#cbd-reset-cancel');
    if (cancelBtn) cancelBtn.focus({ preventScroll: true });
    return dialog;
  }

  function renderStatusBanner(container, message) {
    if (!container || !message) return null;
    let banner = container.querySelector('#course-reset-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'course-reset-banner';
      banner.className = 'cbd-reset-banner';
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      container.prepend(banner);
    }
    banner.innerHTML =
      '<p class="cbd-reset-banner-text">' + esc(message) + '</p>' +
      '<button type="button" class="btn outline small cbd-reset-banner-dismiss" id="cbd-reset-banner-dismiss">' +
        esc(rt('dismissBtn', null, 'Dismiss message')) +
      '</button>';
    const dismissBtn = banner.querySelector('#cbd-reset-banner-dismiss');
    dismissBtn.onclick = () => {
      banner.remove();
      const target = document.getElementById('start-course') || document.querySelector('h1');
      if (target) {
        if (!target.hasAttribute('tabindex') && target.tagName === 'H1') target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    };
    return banner;
  }

  function mountControl(slotEl, options = {}) {
    if (!slotEl) return;
    slotEl.innerHTML =
      '<div class="cbd-reset-zone">' +
        '<div class="cbd-reset-zone-copy">' +
          '<strong>' + esc(rt('sectionHeading', null, 'Reset local CBD course data')) + '</strong>' +
          '<p>' + esc(rt('sectionNote', null, 'Clear your browser’s CBD progress, quiz results, saved activity drafts, practical workbenches (Modules 1–6), and Evidence Notebook to start afresh.')) + '</p>' +
        '</div>' +
        '<button type="button" class="btn cbd-reset-trigger" id="reset-course-btn">' +
          '<span aria-hidden="true">↺</span> ' + esc(rt('openBtn', null, 'Reset Course')) +
        '</button>' +
      '</div>';

    const btn = slotEl.querySelector('#reset-course-btn');
    if (btn) {
      btn.addEventListener('click', () => openConfirmDialog(options));
    }
  }

  return {
    CBD_LESSON_IDS,
    DIRECT_CLEAR_KEYS,
    SCOPED_LEARNING_KEYS,
    EXPLORATION_KEY,
    resetCbdCourse,
    registerHooks,
    openConfirmDialog,
    renderStatusBanner,
    mountControl,
    getSuccessMessage: () => rt('successBanner', null, 'Course reset complete. All local CBD progress, quizzes, drafts, workbenches, and Notebook entries in this browser have been cleared.')
  };
});
