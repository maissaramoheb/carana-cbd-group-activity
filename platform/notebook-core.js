/* Isolated E08 Prototype Core: Connected Evidence-to-Decision Notebook (carana_notebook_v1).
 * Pure UMD logic module. Never modifies carana_cbd_lab_v1, carana_learning_v1, or carana_cbd_course_v1.
 * Incorporates E12-informed self-check criteria tags only; assigns no automated grade or correctness verdict.
 */
(function (global) {
  'use strict';

  const PRODUCT_ID = 'carana-evidence-notebook-v1';
  const STORAGE_KEY = 'carana_notebook_v1';
  const PRE_RESTORE_KEY = 'carana_notebook_v1_pre_restore';
  const MAX_TEXT = 1500;
  const MAX_SOURCE = 240;
  const MAX_REVISIONS = 10;
  const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
  const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

  const PHASES = [
    {
      id: 'phase1',
      number: 1,
      lessonId: 'cbd-1',
      title: '1. Situational Analysis & Baseline Evidence',
      evidenceLabel: 'Observed institutional evidence & baseline state',
      assumptionLabel: 'Working assumptions, unverified claims & blind spots',
      sourceHint: 'e.g. Case register review, informant note, Observation log',
      upstreamHint: 'Starting point of the analytical thread.',
      pullScreenIds: []
    },
    {
      id: 'phase2',
      number: 2,
      lessonId: 'cbd-2',
      title: '2. Objective Setting & Indicator Logic',
      evidenceLabel: 'Testable objective statement & verifiable indicator basis',
      assumptionLabel: 'Dependencies & targets still awaiting baseline proof',
      sourceHint: 'e.g. Lesson 2 builder drafts (02-04 / 02-08) or SMART notes',
      upstreamHint: 'Must address a verified baseline constraint identified in Phase 1.',
      pullScreenIds: ['02-04', '02-08']
    },
    {
      id: 'phase3',
      number: 3,
      lessonId: 'cbd-3',
      title: '3. Planning Logic, Risk & Contingency',
      evidenceLabel: 'Logframe row, verification method & planned contingency trigger',
      assumptionLabel: 'External conditions outside UNPOL control & fallback risks',
      sourceHint: 'e.g. Lesson 3 builder drafts (03-10 / 03-07) or Logframe notes',
      upstreamHint: 'Connects Phase 2 objective and indicator into causal logframe logic.',
      pullScreenIds: ['03-10', '03-07']
    },
    {
      id: 'phase4',
      number: 4,
      lessonId: 'cbd-4',
      title: '4. Implementation & MMA Adaptation',
      evidenceLabel: 'Observed counterpart adoption, communication framing & field signals',
      assumptionLabel: 'Counterpart incentives, resistance hypotheses & operational uncertainties',
      sourceHint: 'e.g. Lesson 4 builder draft (04-02) or MMA mentoring observation',
      upstreamHint: 'Tests whether the Phase 3 plan fits real counterpart desk routines.',
      pullScreenIds: ['04-02']
    },
    {
      id: 'phase5',
      number: 5,
      lessonId: 'cbd-5',
      title: '5. Evaluation & Management Response',
      evidenceLabel: 'Evaluation findings, triangulated sources & response decision rationale',
      assumptionLabel: 'Evidence limits, excluded groups & follow-up uncertainties',
      sourceHint: 'e.g. Lesson 5 builder drafts (05-03 / 05-04) or review memo',
      upstreamHint: 'Compares Phase 4 implementation evidence against Phase 2–3 baseline and intent.',
      pullScreenIds: ['05-03', '05-04']
    },
    {
      id: 'phase6',
      number: 6,
      lessonId: 'cbd-6',
      title: '6. Transition, Readiness & Handover',
      evidenceLabel: 'Verified counterpart readiness benchmarks & receiving accountability lead',
      assumptionLabel: 'Open bilateral expectations, residual risks & transitional support gaps',
      sourceHint: 'e.g. Lesson 6 builder drafts (06-05 / 06-07) or handover notes',
      upstreamHint: 'Grounds sustainable transition decisions on Phase 5 evaluation evidence.',
      pullScreenIds: ['06-05', '06-07']
    }
  ];

  const SELF_CHECK_TAGS = [
    { key: 'sourced', label: 'Evidence cites a concrete record, source, or direct observation' },
    { key: 'separated', label: 'Assumptions and unverified points are separated from observed facts' },
    { key: 'linkTested', label: 'Connection to the previous phase is explicitly stated' }
  ];

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const isPlainObject = v => Boolean(v && typeof v === 'object' && !Array.isArray(v));
  const clampText = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');

  function createEmptyPhaseState() {
    return {
      observedEvidence: '',
      assumptionsAndGaps: '',
      sourceCitation: '',
      checks: { sourced: false, separated: false, linkTested: false },
      revisionCount: 0,
      updatedAt: null,
      needsAlignmentCheck: false,
      alignmentNote: '',
      revisions: []
    };
  }

  function createDefaultNotebook() {
    const phases = {};
    for (const p of PHASES) phases[p.id] = createEmptyPhaseState();
    return {
      product: PRODUCT_ID,
      version: 1,
      threadTitle: 'Untitled CARANA Evidence-to-Decision Thread',
      updatedAt: null,
      phases
    };
  }

  function sanitizeChecks(raw) {
    const out = { sourced: false, separated: false, linkTested: false };
    if (!isPlainObject(raw)) return out;
    for (const tag of SELF_CHECK_TAGS) out[tag.key] = Boolean(raw[tag.key]);
    return out;
  }

  function sanitizeRevisions(rawList) {
    if (!Array.isArray(rawList)) return [];
    return rawList
      .filter(r => isPlainObject(r))
      .slice(-MAX_REVISIONS)
      .map((r, idx) => ({
        rev: Number.isInteger(r.rev) && r.rev > 0 ? r.rev : idx + 1,
        savedAt: typeof r.savedAt === 'string' ? r.savedAt.slice(0, 40) : '',
        observedEvidence: clampText(r.observedEvidence, MAX_TEXT),
        assumptionsAndGaps: clampText(r.assumptionsAndGaps, MAX_TEXT),
        sourceCitation: clampText(r.sourceCitation, MAX_SOURCE),
        note: clampText(r.note, 180)
      }));
  }

  function sanitizePhase(raw) {
    const base = createEmptyPhaseState();
    if (!isPlainObject(raw)) return base;
    base.observedEvidence = clampText(raw.observedEvidence, MAX_TEXT);
    base.assumptionsAndGaps = clampText(raw.assumptionsAndGaps, MAX_TEXT);
    base.sourceCitation = clampText(raw.sourceCitation, MAX_SOURCE);
    base.checks = sanitizeChecks(raw.checks);
    base.revisionCount = Number.isInteger(raw.revisionCount) && raw.revisionCount >= 0 ? raw.revisionCount : 0;
    base.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt.slice(0, 40) : null;
    base.needsAlignmentCheck = Boolean(raw.needsAlignmentCheck);
    base.alignmentNote = clampText(raw.alignmentNote, 240);
    base.revisions = sanitizeRevisions(raw.revisions);
    return base;
  }

  function safeNotebookState(raw) {
    const out = createDefaultNotebook();
    if (!isPlainObject(raw)) return out;
    if (typeof raw.threadTitle === 'string' && raw.threadTitle.trim()) {
      out.threadTitle = raw.threadTitle.trim().slice(0, 140);
    }
    out.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt.slice(0, 40) : null;
    if (isPlainObject(raw.phases)) {
      for (const p of PHASES) {
        out.phases[p.id] = sanitizePhase(raw.phases[p.id]);
      }
    }
    return out;
  }

  function phaseHasContent(phaseState) {
    if (!phaseState) return false;
    return Boolean(
      phaseState.observedEvidence.trim() ||
      phaseState.assumptionsAndGaps.trim() ||
      phaseState.sourceCitation.trim()
    );
  }

  function updatePhaseAndPropagate(notebookState, phaseId, patch, opts) {
    const next = safeNotebookState(notebookState);
    const meta = PHASES.find(p => p.id === phaseId);
    if (!meta) return next;

    const current = next.phases[phaseId];
    const now = (opts && opts.now) || new Date().toISOString();
    const prevSnapshot = {
      observedEvidence: current.observedEvidence,
      assumptionsAndGaps: current.assumptionsAndGaps,
      sourceCitation: current.sourceCitation
    };

    const nextObserved = patch.observedEvidence !== undefined ? clampText(patch.observedEvidence, MAX_TEXT) : current.observedEvidence;
    const nextAssumptions = patch.assumptionsAndGaps !== undefined ? clampText(patch.assumptionsAndGaps, MAX_TEXT) : current.assumptionsAndGaps;
    const nextSource = patch.sourceCitation !== undefined ? clampText(patch.sourceCitation, MAX_SOURCE) : current.sourceCitation;

    const contentChanged =
      nextObserved !== prevSnapshot.observedEvidence ||
      nextAssumptions !== prevSnapshot.assumptionsAndGaps ||
      nextSource !== prevSnapshot.sourceCitation;

    if (opts && opts.archivePrevious && phaseHasContent(current)) {
      const nextRevNum = (current.revisionCount || current.revisions.length) + 1;
      current.revisions = current.revisions.concat([{
        rev: nextRevNum,
        savedAt: now,
        observedEvidence: current.observedEvidence,
        assumptionsAndGaps: current.assumptionsAndGaps,
        sourceCitation: current.sourceCitation,
        note: clampText(opts.revisionNote || 'Archived prior draft', 180)
      }]).slice(-MAX_REVISIONS);
      current.revisionCount = nextRevNum;
    }

    current.observedEvidence = nextObserved;
    current.assumptionsAndGaps = nextAssumptions;
    current.sourceCitation = nextSource;
    if (patch.checks) current.checks = sanitizeChecks(patch.checks);
    current.updatedAt = now;
    next.updatedAt = now;

    if (opts && opts.saveRevision && phaseHasContent(current)) {
      const nextRevNum = (current.revisionCount || current.revisions.length) + 1;
      current.revisions = current.revisions.concat([{
        rev: nextRevNum,
        savedAt: now,
        observedEvidence: current.observedEvidence,
        assumptionsAndGaps: current.assumptionsAndGaps,
        sourceCitation: current.sourceCitation,
        note: clampText(opts.revisionNote || 'Saved revision snapshot', 180)
      }]).slice(-MAX_REVISIONS);
      current.revisionCount = nextRevNum;
    }

    if (opts && opts.markAligned) {
      current.needsAlignmentCheck = false;
      current.alignmentNote = '';
    }

    // Propagate alignment warning strictly downward without mutating downstream user text
    if (contentChanged) {
      for (const downstream of PHASES) {
        if (downstream.number > meta.number) {
          const ds = next.phases[downstream.id];
          if (phaseHasContent(ds)) {
            ds.needsAlignmentCheck = true;
            ds.alignmentNote = 'Upstream Phase ' + meta.number + ' was updated — review downstream alignment without discarding your notes.';
          }
        }
      }
    }

    return next;
  }

  function acknowledgeDownstreamAlignment(notebookState, phaseId) {
    const next = safeNotebookState(notebookState);
    if (!next.phases[phaseId]) return next;
    next.phases[phaseId].needsAlignmentCheck = false;
    next.phases[phaseId].alignmentNote = '';
    return next;
  }

  function extractPlatformPullCandidates(platformStore, lesson1Store, phaseId) {
    const meta = PHASES.find(p => p.id === phaseId);
    if (!meta) return { available: false, summary: '', observedDraft: '', assumptionDraft: '', sourceHint: '' };

    if (phaseId === 'phase1') {
      if (!isPlainObject(lesson1Store) || !Array.isArray(lesson1Store.completed)) {
        return { available: false, summary: 'No Lesson 1 checkpoint state detected yet in this browser.', observedDraft: '', assumptionDraft: '', sourceHint: '' };
      }
      return {
        available: true,
        summary: 'Lesson 1 progress detected (' + lesson1Store.completed.length + ' / 6 checkpoints cleared). Summarise your verified Lesson 1 findings here (notebook keeps its own text without altering carana_cbd_course_v1).',
        observedDraft: 'Lesson 1 study status: ' + lesson1Store.completed.length + ' of 6 situational analysis checkpoints completed. Record key verified facts from your Lesson 1 matrix/SWOT here.',
        assumptionDraft: 'List any remaining unverified assumptions or stakeholder questions carried out of Lesson 1.',
        sourceHint: 'Lesson 1 (carana_cbd_course_v1) / CARANA baseline notes'
      };
    }

    const drafts = platformStore?.lessons?.[meta.lessonId]?.drafts;
    if (!isPlainObject(drafts)) {
      return { available: false, summary: 'No Lesson ' + meta.number + ' builder drafts found in this browser yet.', observedDraft: '', assumptionDraft: '', sourceHint: '' };
    }

    const obsParts = [];
    const gapParts = [];
    for (const sid of meta.pullScreenIds) {
      const scrDraft = drafts[sid];
      if (!isPlainObject(scrDraft)) continue;
      Object.keys(scrDraft).sort((a, b) => Number(a) - Number(b)).forEach(idx => {
        const txt = clampText(scrDraft[idx], 600).trim();
        if (!txt) return;
        // Separate risk/assumption/unresolved fields cleanly where structured
        const isGapField =
          (sid === '02-04' && idx === '4') ||
          (sid === '03-10' && idx === '3') ||
          (sid === '05-03' && idx === '2') ||
          (sid === '06-05' && idx === '1') ||
          (sid === '06-07' && idx === '2');
        if (isGapField) gapParts.push('[' + sid + '] ' + txt);
        else obsParts.push('[' + sid + '] ' + txt);
      });
    }

    if (!obsParts.length && !gapParts.length) {
      return { available: false, summary: 'Lesson ' + meta.number + ' draft screens are still blank.', observedDraft: '', assumptionDraft: '', sourceHint: '' };
    }

    return {
      available: true,
      summary: 'Found drafted items in Lesson ' + meta.number + ' (' + meta.pullScreenIds.join(', ') + ').',
      observedDraft: obsParts.join('\n\n').slice(0, MAX_TEXT),
      assumptionDraft: gapParts.join('\n\n').slice(0, MAX_TEXT),
      sourceHint: 'Imported read-only from Lesson ' + meta.number + ' drafts (' + meta.pullScreenIds.join(', ') + ')'
    };
  }

  function hasBlockedKeys(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 8) return false;
    for (const key of Object.keys(obj)) {
      if (BLOCKED_KEYS.has(key)) return true;
      if (hasBlockedKeys(obj[key], depth + 1)) return true;
    }
    return false;
  }

  function validateNotebookImport(jsonText) {
    if (typeof jsonText !== 'string' || !jsonText.trim()) {
      return { ok: false, errorCode: 'empty-file', message: 'The selected file is empty.' };
    }
    if (jsonText.length > MAX_IMPORT_BYTES) {
      return { ok: false, errorCode: 'file-too-large', message: 'File exceeds the 2 MB safety limit.' };
    }
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (_) {
      return { ok: false, errorCode: 'invalid-json', message: 'Invalid JSON syntax. Your active notebook was not changed.' };
    }
    if (!isPlainObject(parsed)) {
      return { ok: false, errorCode: 'invalid-root', message: 'Backup root must be a JSON object.' };
    }
    if (hasBlockedKeys(parsed)) {
      return { ok: false, errorCode: 'unsafe-keys', message: 'Import rejected: unsupported object keys detected.' };
    }
    if (parsed.progress?.lessons || parsed.course === 'CARANA CBD E-Learning' || parsed.module1) {
      return {
        ok: false,
        errorCode: 'wrong-product',
        message: 'This file belongs to Lesson Progress or the Practical Workbench, not the Connected Evidence Notebook (E08).'
      };
    }
    const payload = isPlainObject(parsed.notebook) ? parsed.notebook : parsed;
    if (payload.product !== PRODUCT_ID || payload.version !== 1 || !isPlainObject(payload.phases)) {
      return {
        ok: false,
        errorCode: 'incompatible-schema',
        message: 'Unrecognized notebook schema. Expected a CARANA Evidence Notebook v1 JSON export.'
      };
    }
    const clean = safeNotebookState(payload);
    const activePhases = PHASES.filter(p => phaseHasContent(clean.phases[p.id])).length;
    return {
      ok: true,
      cleanState: clean,
      activePhases,
      threadTitle: clean.threadTitle
    };
  }

  function applyNotebookImport(validationResult, mode, currentState) {
    if (!validationResult?.ok || !validationResult.cleanState) return safeNotebookState(currentState);
    if (mode === 'replace') return safeNotebookState(validationResult.cleanState);

    const base = safeNotebookState(currentState);
    const inc = validationResult.cleanState;
    if (inc.threadTitle && base.threadTitle === 'Untitled CARANA Evidence-to-Decision Thread') {
      base.threadTitle = inc.threadTitle;
    }
    for (const p of PHASES) {
      const curPhase = base.phases[p.id];
      const incPhase = inc.phases[p.id];
      if (!phaseHasContent(incPhase)) continue;
      if (!phaseHasContent(curPhase)) {
        base.phases[p.id] = sanitizePhase(incPhase);
      } else {
        // Keep current active editor intact and preserve differing imported text in revision history!
        const differing =
          incPhase.observedEvidence !== curPhase.observedEvidence ||
          incPhase.assumptionsAndGaps !== curPhase.assumptionsAndGaps;
        if (differing) {
          const revNum = (curPhase.revisionCount || curPhase.revisions.length) + 1;
          curPhase.revisions = curPhase.revisions.concat([{
            rev: revNum,
            savedAt: incPhase.updatedAt || new Date().toISOString(),
            observedEvidence: incPhase.observedEvidence,
            assumptionsAndGaps: incPhase.assumptionsAndGaps,
            sourceCitation: incPhase.sourceCitation,
            note: 'Archived from merged JSON backup without overwriting your active card'
          }]).slice(-MAX_REVISIONS);
          curPhase.revisionCount = revNum;
        }
      }
    }
    return base;
  }

  function buildNotebookDocumentHTML(state) {
    const s = safeNotebookState(state);
    const rows = PHASES.map(p => {
      const ps = s.phases[p.id];
      const checksDone = SELF_CHECK_TAGS.filter(t => ps.checks[t.key]).map(t => t.label);
      return '<section class="nb-print-card">' +
        '<h2>' + esc(p.title) + '</h2>' +
        '<p class="nb-print-meta">Revisions: ' + (ps.revisionCount || ps.revisions.length) +
        (ps.updatedAt ? ' · Last saved: ' + esc(ps.updatedAt) : '') +
        (ps.needsAlignmentCheck ? ' · Flagged for upstream alignment review' : '') + '</p>' +
        '<h3>' + esc(p.evidenceLabel) + '</h3>' +
        '<div class="nb-print-box">' + (ps.observedEvidence ? esc(ps.observedEvidence) : '<em>Not recorded yet.</em>') + '</div>' +
        '<h3>' + esc(p.assumptionLabel) + '</h3>' +
        '<div class="nb-print-box">' + (ps.assumptionsAndGaps ? esc(ps.assumptionsAndGaps) : '<em>Not recorded yet.</em>') + '</div>' +
        '<p><strong>Source / trace note:</strong> ' + (ps.sourceCitation ? esc(ps.sourceCitation) : '<em>None listed</em>') + '</p>' +
        '<p><strong>Self-review checks marked:</strong> ' + (checksDone.length ? esc(checksDone.join('; ')) : 'None marked') + '</p>' +
        '</section>';
    }).join('');

    return '<!doctype html><html lang="en" dir="auto"><head><meta charset="utf-8">' +
      '<title>' + esc(s.threadTitle) + ' — CARANA Connected Evidence Notebook</title>' +
      '<style>body{font-family:system-ui,sans-serif;color:#102d46;max-width:860px;margin:32px auto;padding:0 18px;line-height:1.55}' +
      '.nb-print-card{border:1px solid #cbdde4;border-top:4px solid #146981;border-radius:10px;padding:16px;margin:18px 0;break-inside:avoid}' +
      '.nb-print-box{background:#f5f9fa;border:1px solid #d7e6ec;border-radius:6px;padding:10px;white-space:pre-wrap;margin-bottom:10px}' +
      '.nb-print-meta{color:#425d71;font-size:13px}h1{margin-bottom:6px}h2{margin-top:0;font-size:19px}h3{font-size:14px;color:#146981;margin:10px 0 4px}</style>' +
      '</head><body>' +
      '<p style="text-transform:uppercase;letter-spacing:.1em;font-size:12px;color:#146981;font-weight:700">CARANA E-LEARNING · CONNECTED EVIDENCE-TO-DECISION BRIEF (PROTOTYPE E08)</p>' +
      '<h1>' + esc(s.threadTitle) + '</h1>' +
      '<p class="nb-print-meta">Browser-local reasoning document. Observed evidence and working assumptions are separated deliberately. Contains no automated grading or UN endorsement.</p>' +
      rows +
      '</body></html>';
  }

  const api = {
    PRODUCT_ID,
    STORAGE_KEY,
    PRE_RESTORE_KEY,
    MAX_TEXT,
    MAX_SOURCE,
    MAX_REVISIONS,
    PHASES,
    SELF_CHECK_TAGS,
    esc,
    createDefaultNotebook,
    safeNotebookState,
    phaseHasContent,
    updatePhaseAndPropagate,
    acknowledgeDownstreamAlignment,
    extractPlatformPullCandidates,
    validateNotebookImport,
    applyNotebookImport,
    buildNotebookDocumentHTML
  };

  global.CARANA_NOTEBOOK_CORE = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
