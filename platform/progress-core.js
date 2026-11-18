/* Shared pure progress, migration, validated import/restore, and readable study-summary core.
 * Zero external dependencies; works identically in browser and Node unit tests.
 * Preserves namespace isolation across carana_learning_v1, carana_cbd_course_v1, and carana_cbd_lab_v1.
 */
(function (root, factory) {
  const tools = typeof module === 'object' && module.exports
    ? require('./learning-tools.js')
    : root.CARANA_LEARNING_TOOLS;
  const api = factory(tools);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CARANA_PROGRESS_CORE = api;
})(typeof window !== 'undefined' ? window : globalThis, function (learningTools) {
  'use strict';

  const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
  const MAX_ARCHIVED_VERSIONS = 5;
  const MAX_DRAFT_LEN = 1200;
  const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function isPlainObject(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
  }

  function safeKeys(obj) {
    return Object.keys(obj).filter(k => !FORBIDDEN_KEYS.has(k));
  }

  function sanitizeArchivedDrafts(rawDrafts) {
    if (!isPlainObject(rawDrafts)) return {};
    const out = {};
    for (const screenId of safeKeys(rawDrafts).slice(0, 30)) {
      if (!/^[0-9]{2}-[0-9]{2}$/.test(screenId)) continue;
      const fields = rawDrafts[screenId];
      if (!isPlainObject(fields)) continue;
      const cleanFields = {};
      for (const fieldKey of safeKeys(fields).slice(0, 15)) {
        const val = fields[fieldKey];
        if (typeof val === 'string') {
          const trimmed = val.slice(0, MAX_DRAFT_LEN);
          if (trimmed.trim().length > 0) cleanFields[fieldKey] = trimmed;
        } else if (Number.isInteger(val) && val >= 0 && val <= 20) {
          cleanFields[fieldKey] = val;
        }
      }
      if (Object.keys(cleanFields).length > 0) out[screenId] = cleanFields;
    }
    return out;
  }

  function countDraftScreens(drafts) {
    if (!isPlainObject(drafts)) return 0;
    return safeKeys(drafts).filter(k => {
      const f = drafts[k];
      return isPlainObject(f) && safeKeys(f).length > 0;
    }).length;
  }

  function countDraftFields(drafts) {
    if (!isPlainObject(drafts)) return 0;
    let total = 0;
    for (const k of safeKeys(drafts)) {
      const f = drafts[k];
      if (isPlainObject(f)) total += safeKeys(f).length;
    }
    return total;
  }

  function sanitizePreviousEntry(p) {
    if (!isPlainObject(p) || typeof p.contentVersion !== 'string' || !Array.isArray(p.completed)) return null;
    const contentVersion = p.contentVersion.trim().slice(0, 80);
    if (!contentVersion) return null;
    const completed = [...new Set(p.completed.filter(n => Number.isInteger(n) && n >= 0 && n < 100))].sort((a, b) => a - b);
    const entry = {
      contentVersion,
      completed,
      section: Number.isInteger(p.section) && p.section >= 0 && p.section < 100 ? p.section : 0,
      screen: Number.isInteger(p.screen) && p.screen >= 0 && p.screen < 100 ? p.screen : 0
    };
    if (typeof p.archivedAt === 'string' && Number.isFinite(Date.parse(p.archivedAt))) entry.archivedAt = p.archivedAt;
    const archivedDrafts = sanitizeArchivedDrafts(p.drafts);
    if (countDraftScreens(archivedDrafts) > 0) entry.drafts = archivedDrafts;
    return entry;
  }

  function normalizeCompleted(arr, sectionCount) {
    const completed = [];
    if (!Array.isArray(arr)) return completed;
    while (completed.length < sectionCount && arr.includes(completed.length)) {
      completed.push(completed.length);
    }
    return completed;
  }

  function safeProgress(data, raw, nowIso) {
    const previous = Array.isArray(raw?.previousProgress)
      ? raw.previousProgress.map(sanitizePreviousEntry).filter(Boolean).slice(-(MAX_ARCHIVED_VERSIONS - 1))
      : [];
    const oldDrafts = raw ? sanitizeArchivedDrafts(raw.drafts) : {};
    const hasOldCompleted = !!(raw && Array.isArray(raw.completed));
    const hasOldVersion = !!(raw && typeof raw.contentVersion === 'string' && raw.contentVersion.trim());
    const oldRecord = (hasOldVersion && (hasOldCompleted || countDraftScreens(oldDrafts) > 0))
      ? sanitizePreviousEntry({
          contentVersion: raw.contentVersion,
          completed: hasOldCompleted ? raw.completed : [],
          section: raw.section,
          screen: raw.screen,
          archivedAt: nowIso || new Date().toISOString(),
          drafts: oldDrafts
        })
      : null;

    if (!raw || raw.contentVersion !== data.version) {
      const mergedPrev = oldRecord ? [...previous, oldRecord].slice(-MAX_ARCHIVED_VERSIONS) : previous;
      return {
        contentVersion: data.version,
        completed: [],
        section: 0,
        screen: 0,
        view: 'screen',
        drafts: {},
        revisionAck: false,
        previousProgress: mergedPrev
      };
    }

    const completed = normalizeCompleted(raw.completed, data.sections.length);
    const section = Number.isInteger(raw.section) && raw.section >= 0
      ? Math.min(raw.section, completed.length, data.sections.length - 1)
      : 0;
    const screen = Number.isInteger(raw.screen) && raw.screen >= 0
      ? Math.min(raw.screen, data.sections[section].screens.length - 1)
      : 0;
    const drafts = {};
    for (const part of data.sections) {
      for (const item of part.screens) {
        if (item.lab && learningTools) {
          drafts[item.id] = learningTools.validDraft(item.lab, raw.drafts?.[item.id]);
        }
      }
    }
    return {
      contentVersion: data.version,
      completed,
      section,
      screen,
      view: raw.view === 'quiz' ? 'quiz' : 'screen',
      drafts,
      revisionAck: raw.revisionAck === true,
      previousProgress: previous
    };
  }

  function getArchivedDraftsForScreen(state, screenId) {
    if (!state || !Array.isArray(state.previousProgress)) return [];
    const matches = [];
    for (let i = state.previousProgress.length - 1; i >= 0; i--) {
      const entry = state.previousProgress[i];
      const fields = entry?.drafts?.[screenId];
      if (isPlainObject(fields) && safeKeys(fields).length > 0) {
        matches.push({
          contentVersion: entry.contentVersion,
          archivedAt: entry.archivedAt || null,
          fields
        });
      }
    }
    return matches;
  }

  function readLesson1Summary(rawL1, rawLab) {
    const fallback = {
      started: false,
      completedCount: 0,
      totalCheckpoints: 6,
      lastSection: 0,
      lastScreen: 0,
      lastKind: 'screen',
      activityOpened: false,
      lessonComplete: false,
      labConfirmed: !!(rawLab && rawLab.module1 && rawLab.module1.confirmed === true),
      statusText: 'Implemented · institutional validation pending · 0 / 6 checkpoints passed',
      actionText: 'Open Lesson 1'
    };
    if (!isPlainObject(rawL1) || rawL1.version !== 1 || !Array.isArray(rawL1.completed)) {
      return fallback;
    }
    const completed = normalizeCompleted(rawL1.completed, 6);
    const completedCount = completed.length;
    const lastSection = Number.isInteger(rawL1.lastSection) && rawL1.lastSection >= 0
      ? Math.min(rawL1.lastSection, completedCount, 5)
      : 0;
    const lastScreen = Number.isInteger(rawL1.lastScreen) && rawL1.lastScreen >= 0 && rawL1.lastScreen <= 2
      ? rawL1.lastScreen
      : 0;
    const lastKind = ['screen', 'quiz', 'activity', 'complete'].includes(rawL1.lastKind) ? rawL1.lastKind : 'screen';
    const visitedCount = Array.isArray(rawL1.visited) ? rawL1.visited.length : 0;
    const started = !!(rawL1.startedAt || completedCount > 0 || visitedCount > 0);
    const activityOpened = completedCount === 6 && rawL1.activityOpened === true;
    const lessonComplete = activityOpened && rawL1.lessonComplete === true;
    const labConfirmed = !!(rawLab && rawLab.module1 && rawLab.module1.confirmed === true);

    if (lessonComplete) {
      return {
        started: true, completedCount, totalCheckpoints: 6, lastSection, lastScreen, lastKind,
        activityOpened, lessonComplete, labConfirmed,
        statusText: 'Guided study complete · 6 / 6 checkpoints + workbench self-confirmed',
        actionText: 'Review Lesson 1'
      };
    }
    if (completedCount === 6) {
      return {
        started: true, completedCount, totalCheckpoints: 6, lastSection, lastScreen, lastKind,
        activityOpened, lessonComplete, labConfirmed,
        statusText: '6 / 6 checkpoints passed · Module 1 confirmation pending',
        actionText: 'Continue to practice'
      };
    }
    if (started) {
      return {
        started: true, completedCount, totalCheckpoints: 6, lastSection, lastScreen, lastKind,
        activityOpened, lessonComplete, labConfirmed,
        statusText: 'In progress (Section ' + (lastSection + 1) + ') · ' + completedCount + ' / 6 checkpoints passed',
        actionText: 'Resume Lesson 1'
      };
    }
    return fallback;
  }

  function describeCatalogLesson(lessonEntry, lessonRecord) {
    const total = Number.isInteger(lessonEntry.sectionsCount) ? lessonEntry.sectionsCount : null;
    const baseNote = lessonEntry.status || 'Review adaptation · transcript available · recording and expert validation pending';
    if (!isPlainObject(lessonRecord)) {
      return {
        state: 'fresh',
        statusText: baseNote,
        actionText: 'Explore lesson'
      };
    }
    const prevList = Array.isArray(lessonRecord.previousProgress) ? lessonRecord.previousProgress : [];
    const archivedDraftScreens = prevList.reduce((sum, p) => sum + countDraftScreens(p?.drafts), 0);

    if (lessonEntry.version && lessonRecord.contentVersion !== lessonEntry.version) {
      const oldChecks = Array.isArray(lessonRecord.completed) ? lessonRecord.completed.length : 0;
      const oldDrafts = countDraftScreens(lessonRecord.drafts) + archivedDraftScreens;
      return {
        state: 'migrated',
        statusText: 'Updated content ready · ' + oldChecks + ' prior checkpoint(s) & ' + oldDrafts + ' draft screen(s) will be archived on open · ' + baseNote,
        actionText: 'Review updated lesson'
      };
    }

    const completedArr = Array.isArray(lessonRecord.completed)
      ? (total ? normalizeCompleted(lessonRecord.completed, total) : lessonRecord.completed)
      : [];
    const passed = completedArr.length;
    const denom = total !== null ? ' / ' + total : '';
    const secIdx = Number.isInteger(lessonRecord.section) && lessonRecord.section >= 0 ? lessonRecord.section : 0;
    const secTitle = Array.isArray(lessonEntry.sectionTitles) && lessonEntry.sectionTitles[secIdx]
      ? lessonEntry.sectionTitles[secIdx]
      : 'Section ' + (secIdx + 1);
    const activeDrafts = countDraftScreens(lessonRecord.drafts);
    const draftNote = activeDrafts > 0 ? ' · ' + activeDrafts + ' practice draft(s)' : '';

    if (total !== null && passed >= total) {
      return {
        state: 'completed',
        statusText: 'Guided study complete · ' + passed + denom + ' checkpoints passed' + draftNote + ' · ' + baseNote,
        actionText: 'Review completed lesson'
      };
    }

    if (passed > 0 || secIdx > 0 || (lessonRecord.screen || 0) > 0 || lessonRecord.view === 'quiz' || activeDrafts > 0) {
      return {
        state: 'in-progress',
        statusText: 'Resume: ' + secTitle + ' · ' + passed + denom + ' checkpoints passed' + draftNote,
        actionText: 'Resume lesson'
      };
    }

    return {
      state: 'reading',
      statusText: 'Started (' + secTitle + ' · Screen 1) · 0' + denom + ' checkpoints passed · ' + baseNote,
      actionText: 'Resume lesson'
    };
  }

  function parseJsonSafely(text) {
    if (typeof text !== 'string') return { ok: false, errorCode: 'empty', message: 'No file text provided.' };
    if (text.length > MAX_IMPORT_BYTES) {
      return { ok: false, errorCode: 'too-large', message: 'File exceeds the 2 MB local restore limit.' };
    }
    let parsed;
    try {
      parsed = JSON.parse(text, (key, value) => (FORBIDDEN_KEYS.has(key) ? undefined : value));
    } catch (_) {
      return { ok: false, errorCode: 'invalid-json', message: 'The selected file is not valid JSON. Your existing browser progress was not changed.' };
    }
    if (!isPlainObject(parsed)) {
      return { ok: false, errorCode: 'invalid-root', message: 'Invalid backup format: expected a JSON object.' };
    }
    return { ok: true, data: parsed };
  }

  function detectWrongBackupKind(parsed, expectedKind) {
    if (parsed.app === 'CARANA CBD Learning Lab' && isPlainObject(parsed.module1)) {
      return 'This file is an original CARANA Practical Workbench export (carana_cbd_lab_v1). Open Module 1–6 to restore workbench data.';
    }
    const isL1 = parsed.course === 'CARANA CBD E-Learning' && isPlainObject(parsed.progress) && Array.isArray(parsed.progress.completed) && !parsed.progress.lessons;
    const isPlatform = parsed.version === 1 && isPlainObject(parsed.progress) && parsed.progress.version === 1 && isPlainObject(parsed.progress.lessons);
    if (expectedKind === 'platform' && isL1) {
      return 'This file is a Lesson 1 progress export (carana_cbd_course_v1). Open Lesson 1 to restore Lesson 1 progress without mixing storage records.';
    }
    if (expectedKind === 'lesson1' && isPlatform) {
      return 'This file is a Lessons 2–6 platform export (carana_learning_v1). Use Restore progress on the CBD catalog or Lessons 2–6 rail.';
    }
    return null;
  }

  function validatePlatformImport(jsonText, currentStore, catalogLessons) {
    const parsedRes = parseJsonSafely(jsonText);
    if (!parsedRes.ok) return parsedRes;
    const parsed = parsedRes.data;

    const wrongKind = detectWrongBackupKind(parsed, 'platform');
    if (wrongKind) return { ok: false, errorCode: 'wrong-product', message: wrongKind };

    if (parsed.version !== 1 || !isPlainObject(parsed.progress) || parsed.progress.version !== 1 || !isPlainObject(parsed.progress.lessons)) {
      return {
        ok: false,
        errorCode: 'incompatible-schema',
        message: 'Unrecognized platform progress schema. Expected a CARANA Learning Platform v1 export.'
      };
    }

    const catalogById = new Map((catalogLessons || []).filter(l => l.version).map(l => [l.id, l]));
    const importedLessons = parsed.progress.lessons;
    const lessonKeys = safeKeys(importedLessons);
    if (lessonKeys.length > 50) {
      return { ok: false, errorCode: 'too-many-lessons', message: 'Import rejected: unexpected number of lesson records.' };
    }

    const items = [];
    const sanitizedRecords = {};
    let hasConflicts = false;

    for (const id of lessonKeys) {
      if (!/^[a-z0-9-]{2,40}$/.test(id)) {
        return { ok: false, errorCode: 'invalid-lesson-id', message: 'Import rejected: invalid lesson identifier.' };
      }
      const rawRec = importedLessons[id];
      if (!isPlainObject(rawRec) || typeof rawRec.contentVersion !== 'string' || !Array.isArray(rawRec.completed)) {
        return { ok: false, errorCode: 'malformed-lesson', message: 'Import rejected: malformed progress record for "' + id + '".' };
      }

      const cat = catalogById.get(id);
      const currentRec = currentStore?.lessons?.[id];
      const importedDrafts = sanitizeArchivedDrafts(rawRec.drafts);
      const importedPrev = Array.isArray(rawRec.previousProgress)
        ? rawRec.previousProgress.map(sanitizePreviousEntry).filter(Boolean).slice(-MAX_ARCHIVED_VERSIONS)
        : [];
      const importedCompleted = [...new Set(rawRec.completed.filter(n => Number.isInteger(n) && n >= 0 && n < 100))].sort((a, b) => a - b);

      const cleanRec = {
        contentVersion: rawRec.contentVersion.trim().slice(0, 80),
        completed: cat?.sectionsCount ? normalizeCompleted(importedCompleted, cat.sectionsCount) : importedCompleted,
        section: Number.isInteger(rawRec.section) && rawRec.section >= 0 ? Math.min(rawRec.section, Math.max(0, (cat?.sectionsCount || 20) - 1)) : 0,
        screen: Number.isInteger(rawRec.screen) && rawRec.screen >= 0 ? Math.min(rawRec.screen, 40) : 0,
        view: rawRec.view === 'quiz' ? 'quiz' : 'screen',
        drafts: importedDrafts,
        revisionAck: rawRec.revisionAck === true,
        previousProgress: importedPrev
      };

      const compatibility = !cat
        ? 'unknown-lesson'
        : (cleanRec.contentVersion === cat.version ? 'exact-match' : 'version-mismatch');

      let identicalFields = 0;
      let newFields = 0;
      let conflictFields = 0;
      const localDrafts = isPlainObject(currentRec?.drafts) ? currentRec.drafts : {};
      for (const sid of safeKeys(importedDrafts)) {
        for (const fk of safeKeys(importedDrafts[sid])) {
          const incVal = importedDrafts[sid][fk];
          const curVal = localDrafts[sid]?.[fk];
          if (curVal === undefined || curVal === '') newFields++;
          else if (curVal === incVal) identicalFields++;
          else conflictFields++;
        }
      }
      if (conflictFields > 0 || (currentRec && currentRec.contentVersion !== cleanRec.contentVersion)) {
        hasConflicts = true;
      }

      sanitizedRecords[id] = cleanRec;
      items.push({
        id,
        title: cat?.title || id,
        known: !!cat,
        compatibility,
        importedVersion: cleanRec.contentVersion,
        currentCatalogVersion: cat?.version || null,
        importedCheckpoints: cleanRec.completed.length,
        totalCheckpoints: cat?.sectionsCount || null,
        importedDraftScreens: countDraftScreens(cleanRec.drafts),
        importedDraftFields: countDraftFields(cleanRec.drafts),
        archivedRevisions: cleanRec.previousProgress.length,
        localCheckpoints: Array.isArray(currentRec?.completed) ? currentRec.completed.length : 0,
        localDraftFields: countDraftFields(localDrafts),
        identicalFields,
        newFields,
        conflictFields
      });
    }

    return {
      ok: true,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null,
      items,
      hasConflicts,
      sanitizedRecords
    };
  }

  function mergeDraftObjects(localDrafts, incomingDrafts, incomingVersion, nowIso) {
    const merged = sanitizeArchivedDrafts(localDrafts);
    const conflictArchive = {};
    const cleanIncoming = sanitizeArchivedDrafts(incomingDrafts);

    for (const sid of safeKeys(cleanIncoming)) {
      const incFields = cleanIncoming[sid];
      merged[sid] = merged[sid] || {};
      for (const fk of safeKeys(incFields)) {
        const incVal = incFields[fk];
        const curVal = merged[sid][fk];
        if (curVal === undefined || curVal === '') {
          merged[sid][fk] = incVal;
        } else if (curVal !== incVal) {
          conflictArchive[sid] = conflictArchive[sid] || {};
          conflictArchive[sid][fk] = incVal;
        }
      }
    }

    const extraArchive = countDraftScreens(conflictArchive) > 0
      ? sanitizePreviousEntry({
          contentVersion: (incomingVersion || 'imported') + ' (merged-alternate)',
          completed: [],
          section: 0,
          screen: 0,
          archivedAt: nowIso,
          drafts: conflictArchive
        })
      : null;

    return { mergedDrafts: merged, extraArchive };
  }

  function applyPlatformImport(currentStore, plan, mode, catalogLessons, nowIso) {
    const stamp = nowIso || new Date().toISOString();
    const catalogById = new Map((catalogLessons || []).filter(l => l.version).map(l => [l.id, l]));
    const nextLessons = mode === 'replace'
      ? {}
      : JSON.parse(JSON.stringify(isPlainObject(currentStore?.lessons) ? currentStore.lessons : {}));

    for (const id of safeKeys(plan.sanitizedRecords)) {
      const inc = plan.sanitizedRecords[id];
      const cat = catalogById.get(id);

      // Migrate incoming record if its contentVersion differs from the current catalog lesson version
      let normalizedIncoming = inc;
      if (cat && inc.contentVersion !== cat.version) {
        normalizedIncoming = {
          contentVersion: cat.version,
          completed: [],
          section: 0,
          screen: 0,
          view: 'screen',
          drafts: {},
          revisionAck: false,
          previousProgress: [
            ...inc.previousProgress,
            sanitizePreviousEntry({
              contentVersion: inc.contentVersion,
              completed: inc.completed,
              section: inc.section,
              screen: inc.screen,
              archivedAt: stamp,
              drafts: inc.drafts
            })
          ].filter(Boolean).slice(-MAX_ARCHIVED_VERSIONS)
        };
      }

      if (mode === 'replace' || !isPlainObject(nextLessons[id])) {
        nextLessons[id] = normalizedIncoming;
        continue;
      }

      // Merge mode when local record already exists
      let local = nextLessons[id];
      if (cat && local.contentVersion !== cat.version) {
        const localArchive = sanitizePreviousEntry({
          contentVersion: local.contentVersion,
          completed: local.completed,
          section: local.section,
          screen: local.screen,
          archivedAt: stamp,
          drafts: local.drafts
        });
        local = {
          contentVersion: cat.version,
          completed: [],
          section: 0,
          screen: 0,
          view: 'screen',
          drafts: {},
          revisionAck: false,
          previousProgress: [...(Array.isArray(local.previousProgress) ? local.previousProgress.map(sanitizePreviousEntry).filter(Boolean) : []), localArchive].filter(Boolean).slice(-MAX_ARCHIVED_VERSIONS)
        };
      }

      const sectionCount = cat?.sectionsCount || 20;
      const mergedCompleted = normalizeCompleted(
        [...new Set([...(Array.isArray(local.completed) ? local.completed : []), ...normalizedIncoming.completed])],
        sectionCount
      );
      const { mergedDrafts, extraArchive } = mergeDraftObjects(local.drafts, normalizedIncoming.drafts, inc.contentVersion, stamp);

      // Deduplicate previousProgress entries by (contentVersion + serialized drafts)
      const combinedPrev = [
        ...(Array.isArray(local.previousProgress) ? local.previousProgress.map(sanitizePreviousEntry).filter(Boolean) : []),
        ...normalizedIncoming.previousProgress,
        ...(extraArchive ? [extraArchive] : [])
      ];
      const seenPrev = new Set();
      const dedupedPrev = [];
      for (const p of combinedPrev) {
        const sig = p.contentVersion + '|' + JSON.stringify(p.completed) + '|' + JSON.stringify(p.drafts || {});
        if (!seenPrev.has(sig)) {
          seenPrev.add(sig);
          dedupedPrev.push(p);
        }
      }

      nextLessons[id] = {
        contentVersion: local.contentVersion,
        completed: mergedCompleted,
        section: Math.min(Math.max(local.section || 0, normalizedIncoming.section || 0), Math.max(0, sectionCount - 1), mergedCompleted.length),
        screen: (normalizedIncoming.section || 0) > (local.section || 0) ? normalizedIncoming.screen : (local.screen || 0),
        view: local.view === 'quiz' || normalizedIncoming.view === 'quiz' ? 'quiz' : 'screen',
        drafts: mergedDrafts,
        revisionAck: local.revisionAck === true && normalizedIncoming.revisionAck === true,
        previousProgress: dedupedPrev.slice(-MAX_ARCHIVED_VERSIONS)
      };
    }

    return { version: 1, lessons: nextLessons };
  }

  function validateLesson1Import(jsonText, currentL1) {
    const parsedRes = parseJsonSafely(jsonText);
    if (!parsedRes.ok) return parsedRes;
    const parsed = parsedRes.data;

    const wrongKind = detectWrongBackupKind(parsed, 'lesson1');
    if (wrongKind) return { ok: false, errorCode: 'wrong-product', message: wrongKind };

    const p = parsed.progress;
    if (parsed.course !== 'CARANA CBD E-Learning' || !isPlainObject(p) || p.version !== 1 || !Array.isArray(p.completed)) {
      return {
        ok: false,
        errorCode: 'incompatible-schema',
        message: 'Unrecognized Lesson 1 export schema. Expected a CARANA CBD Lesson 1 progress JSON file.'
      };
    }

    const completed = normalizeCompleted(p.completed, 6);
    const visited = Array.isArray(p.visited)
      ? [...new Set(p.visited.filter(x => typeof x === 'string' && /^[0-5]:[0-2]$/.test(x)))]
      : [];
    const lastSection = Number.isInteger(p.lastSection) && p.lastSection >= 0 ? Math.min(p.lastSection, completed.length, 5) : 0;
    const lastScreen = Number.isInteger(p.lastScreen) && p.lastScreen >= 0 && p.lastScreen <= 2 ? p.lastScreen : 0;
    const lastKind = ['screen', 'quiz', 'activity', 'complete'].includes(p.lastKind) ? p.lastKind : 'screen';
    const activityOpened = completed.length === 6 && p.activityOpened === true;
    const lessonComplete = activityOpened && p.lessonComplete === true;
    const dateOrNull = v => (typeof v === 'string' && Number.isFinite(Date.parse(v)) ? v : null);

    const sanitized = {
      version: 1,
      completed,
      visited,
      activityOpened,
      lessonComplete,
      lastSection,
      lastScreen,
      lastKind,
      startedAt: dateOrNull(p.startedAt),
      updatedAt: dateOrNull(p.updatedAt)
    };

    const localCompleted = Array.isArray(currentL1?.completed) ? normalizeCompleted(currentL1.completed, 6).length : 0;
    return {
      ok: true,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null,
      sanitized,
      summary: {
        importedCheckpoints: completed.length,
        importedVisited: visited.length,
        importedComplete: lessonComplete,
        localCheckpoints: localCompleted,
        localComplete: !!(currentL1 && currentL1.lessonComplete)
      }
    };
  }

  function applyLesson1Import(currentL1, plan, mode) {
    const inc = plan.sanitized;
    if (mode === 'replace' || !isPlainObject(currentL1) || currentL1.version !== 1) return inc;

    const completed = normalizeCompleted([...(currentL1.completed || []), ...inc.completed], 6);
    const visited = [...new Set([...(Array.isArray(currentL1.visited) ? currentL1.visited : []), ...inc.visited])];
    const activityOpened = completed.length === 6 && (currentL1.activityOpened === true || inc.activityOpened === true);
    const lessonComplete = activityOpened && (currentL1.lessonComplete === true || inc.lessonComplete === true);
    const lastSection = Math.min(Math.max(currentL1.lastSection || 0, inc.lastSection || 0), completed.length, 5);
    return {
      version: 1,
      completed,
      visited,
      activityOpened,
      lessonComplete,
      lastSection,
      lastScreen: (inc.lastSection || 0) > (currentL1.lastSection || 0) ? inc.lastScreen : (currentL1.lastScreen || 0),
      lastKind: lessonComplete ? 'complete' : activityOpened ? 'activity' : (inc.lastSection > (currentL1.lastSection || 0) ? inc.lastKind : (currentL1.lastKind || 'screen')),
      startedAt: currentL1.startedAt || inc.startedAt,
      updatedAt: new Date().toISOString()
    };
  }

  function renderDraftBlockHTML(screen, fieldsObj) {
    const lab = screen.lab;
    if (!lab || !isPlainObject(fieldsObj) || safeKeys(fieldsObj).length === 0) return '';
    if (lab.type === 'builder') {
      const rows = lab.fields.map((f, i) => {
        const val = typeof fieldsObj[i] === 'string' ? fieldsObj[i].trim() : '';
        return '<div class="study-field"><h4>' + esc(f.label) + '</h4><p class="study-prompt">' + esc(f.prompt) + '</p>' +
          (val ? '<p class="study-answer">' + esc(val) + '</p>' : '<p class="study-empty">Not yet drafted</p>') +
          (f.check ? '<p class="study-check"><strong>Self-check:</strong> ' + esc(f.check) + '</p>' : '') + '</div>';
      }).join('');
      return '<div class="study-tool"><h3>' + esc(screen.id + ' · ' + lab.title) + '</h3>' + rows +
        '<p class="study-debrief"><strong>Debrief prompt:</strong> ' + esc(lab.debrief) + '</p></div>';
    }
    if (lab.type === 'classify') {
      const rows = lab.items.map((item, i) => {
        const chosenIdx = fieldsObj[i];
        const chosenText = Number.isInteger(chosenIdx) && lab.categories[chosenIdx] ? lab.categories[chosenIdx] : 'Not yet selected';
        return '<li><span>' + esc(item.text) + '</span> — <strong>' + esc(chosenText) + '</strong></li>';
      }).join('');
      return '<div class="study-tool"><h3>' + esc(screen.id + ' · ' + lab.title) + '</h3><ul>' + rows + '</ul></div>';
    }
    if (lab.type === 'priority') {
      const weights = lab.criteria.map((_, i) => (Number.isInteger(fieldsObj[i]) ? fieldsObj[i] : 1));
      const ranked = learningTools ? learningTools.rank(lab, weights) : [];
      return '<div class="study-tool"><h3>' + esc(screen.id + ' · ' + lab.title) + '</h3>' +
        '<p>Saved weights: ' + lab.criteria.map((c, i) => esc(c) + ' (' + weights[i] + ')').join(', ') + '</p>' +
        (ranked.length ? '<p>Illustrative totals: ' + ranked.map(r => esc(r.label + ': ' + r.score + ' pts [' + r.constraint + ']')).join(' · ') + '</p>' : '') +
        '</div>';
    }
    if (lab.type === 'risk') {
      const l = fieldsObj.likelihood ?? 2;
      const im = fieldsObj.impact ?? 2;
      return '<div class="study-tool"><h3>' + esc(screen.id + ' · ' + lab.title) + '</h3>' +
        '<p>Selected likelihood ' + esc(l) + ', impact ' + esc(im) + ' (illustrative product ' + esc(l * im) + ').</p>' +
        '<p class="study-debrief"><strong>Debrief prompt:</strong> ' + esc(lab.debrief) + '</p></div>';
    }
    return '';
  }

  function buildStudySummaryBodyHTML(store, lessonsData, l1Summary, exportedAt) {
    const stamp = exportedAt || new Date().toISOString();
    const parts = [];
    parts.push('<div class="study-header"><span class="eyebrow">CARANA E-Learning · Study-Work Summary</span>' +
      '<h1>Learner Drafts &amp; Study Preparation Sheet</h1>' +
      '<p class="status">Generated locally: ' + esc(stamp) + ' · Browser-local study record; not a UN certificate, observed workplace competence, or facilitator solution key.</p></div>');

    if (l1Summary) {
      parts.push('<section class="study-lesson"><h2>Lesson 1: Situational Analysis (Approved Benchmark)</h2>' +
        '<p class="status">' + esc(l1Summary.statusText) + '</p>' +
        '<p>Original practical workbench: <code>module1.html</code> (PESTEL-S, 5×6 Matrix, SWOT, Baseline).</p></section>');
    }

    for (const lesson of (lessonsData || [])) {
      const rec = store?.lessons?.[lesson.id];
      const sectionCount = lesson.sections.length;
      const passed = rec && rec.contentVersion === lesson.version && Array.isArray(rec.completed)
        ? normalizeCompleted(rec.completed, sectionCount).length
        : 0;
      const versionNote = rec && rec.contentVersion !== lesson.version
        ? 'Stored record is from earlier version ' + rec.contentVersion + ' (not yet updated to ' + lesson.version + ').'
        : passed + ' / ' + sectionCount + ' checkpoints passed (' + lesson.version + ').';

      const toolBlocks = [];
      for (const sec of lesson.sections) {
        for (const sc of sec.screens) {
          if (!sc.lab) continue;
          const activeDrafts = rec && rec.contentVersion === lesson.version ? rec.drafts?.[sc.id] : null;
          const htmlBlock = renderDraftBlockHTML(sc, activeDrafts);
          if (htmlBlock) toolBlocks.push(htmlBlock);
        }
      }

      const archivedBlocks = [];
      const prevList = Array.isArray(rec?.previousProgress) ? rec.previousProgress : [];
      if (rec && rec.contentVersion !== lesson.version && isPlainObject(rec.drafts) && countDraftScreens(rec.drafts) > 0) {
        prevList.push({ contentVersion: rec.contentVersion, drafts: rec.drafts });
      }
      for (const prev of prevList) {
        if (!isPlainObject(prev?.drafts) || countDraftScreens(prev.drafts) === 0) continue;
        const inner = [];
        for (const sec of lesson.sections) {
          for (const sc of sec.screens) {
            if (sc.lab && prev.drafts[sc.id]) {
              const b = renderDraftBlockHTML(sc, prev.drafts[sc.id]);
              if (b) inner.push(b);
            }
          }
        }
        if (inner.length) {
          archivedBlocks.push('<div class="study-archived"><h3>Archived Drafts (' + esc(prev.contentVersion) + ')</h3>' + inner.join('') + '</div>');
        }
      }

      parts.push('<section class="study-lesson"><h2>Lesson ' + esc(lesson.number + ': ' + lesson.title) + '</h2>' +
        '<p class="status">' + esc(versionNote) + ' · Practical activity: <code>module' + esc(lesson.number) + '.html</code></p>' +
        (toolBlocks.length ? toolBlocks.join('') : '<p class="study-empty">No practice drafts saved in the current version of this lesson yet.</p>') +
        archivedBlocks.join('') + '</section>');
    }
    return parts.join('');
  }

  function buildStudySummaryDocumentHTML(store, lessonsData, l1Summary, exportedAt) {
    const body = buildStudySummaryBodyHTML(store, lessonsData, l1Summary, exportedAt);
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>CARANA E-Learning — Study-Work Summary</title>' +
      '<style>' +
      'body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#102d46;background:#f5f9fa;margin:0;padding:32px 20px;line-height:1.6}' +
      '.wrap{max-width:920px;margin:0 auto;background:#fff;border:1px solid #cbdde4;border-radius:12px;padding:32px}' +
      '.eyebrow{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#146981}' +
      'h1,h2,h3,h4{font-family:Georgia,serif;color:#102d46}h1{margin:8px 0 10px}h2{border-bottom:1px solid #cbdde4;padding-bottom:8px;margin-top:28px}' +
      '.status{font-size:13px;color:#425d71}.study-lesson{margin-bottom:28px}.study-tool{background:#f9fcfd;border:1px solid #d7e6ec;border-radius:8px;padding:16px;margin:14px 0}' +
      '.study-field{margin:12px 0;padding-top:10px;border-top:1px solid #e7f0f3}.study-field:first-of-type{border-top:0;padding-top:0}' +
      '.study-prompt{font-size:13px;color:#425d71;margin:4px 0}.study-answer{background:#fff;border:1px solid #cbdde4;border-radius:6px;padding:10px;white-space:pre-wrap}' +
      '.study-empty{font-style:italic;color:#62788a}.study-check,.study-debrief{font-size:13px;color:#146981;margin:6px 0 0}' +
      '.study-archived{background:#fff8eb;border-left:4px solid #a56f12;padding:12px 16px;margin:14px 0;border-radius:6px}' +
      '@media print{body{background:#fff;padding:0}.wrap{border:0;padding:0}.study-tool,.study-lesson{break-inside:avoid}}' +
      '</style></head><body><main class="wrap">' + body + '</main></body></html>';
  }

  return {
    esc,
    MAX_IMPORT_BYTES,
    MAX_ARCHIVED_VERSIONS,
    MAX_DRAFT_LEN,
    sanitizeArchivedDrafts,
    countDraftScreens,
    countDraftFields,
    safeProgress,
    getArchivedDraftsForScreen,
    readLesson1Summary,
    describeCatalogLesson,
    validatePlatformImport,
    applyPlatformImport,
    validateLesson1Import,
    applyLesson1Import,
    buildStudySummaryBodyHTML,
    buildStudySummaryDocumentHTML
  };
});
