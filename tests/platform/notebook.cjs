const { test } = require('node:test');
const assert = require('node:assert/strict');
const nb = require('../../platform/notebook-core.js');

test('E08: initial state is strictly isolated, separated, and bounded', () => {
  const s = nb.createDefaultNotebook();
  assert.equal(s.product, 'carana-evidence-notebook-v1');
  assert.equal(s.version, 1);
  assert.equal(Object.keys(s.phases).length, 6);
  for (const p of nb.PHASES) {
    assert.equal(nb.phaseHasContent(s.phases[p.id]), false);
    assert.equal(s.phases[p.id].needsAlignmentCheck, false);
  }
});

test('E08: updating upstream Phase 1 flags populated downstream Phase 2 and Phase 3 without mutating their text', () => {
  let state = nb.createDefaultNotebook();
  state = nb.updatePhaseAndPropagate(state, 'phase1', {
    observedEvidence: 'Custody register shows missing shift signatures.',
    assumptionsAndGaps: 'Unclear if night-shift supervisors have register access.',
    sourceCitation: 'District B audit',
    checks: { sourced: true, separated: true, linkTested: false }
  }, { saveRevision: true, now: '2026-11-18T12:00:00Z' });

  state = nb.updatePhaseAndPropagate(state, 'phase2', {
    observedEvidence: 'Standardise intake log within 6 months.',
    assumptionsAndGaps: 'Assumes stable stationery supply.'
  }, { saveRevision: true, now: '2026-11-18T12:05:00Z' });

  state = nb.updatePhaseAndPropagate(state, 'phase3', {
    observedEvidence: 'Outcome 1 -> Logbook review -> Monthly sample.'
  }, { now: '2026-11-18T12:10:00Z' });

  assert.equal(state.phases.phase2.needsAlignmentCheck, false);
  assert.equal(state.phases.phase3.needsAlignmentCheck, false);

  // Revise Phase 1 upstream evidence -> Phase 2 and Phase 3 populated cards get flagged cleanly
  state = nb.updatePhaseAndPropagate(state, 'phase1', {
    observedEvidence: 'Custody register audit updated: gap confined to Unit 2.',
    assumptionsAndGaps: 'Unclear if night-shift supervisors have register access.'
  }, { saveRevision: true, now: '2026-11-18T12:15:00Z' });

  assert.equal(state.phases.phase1.revisions.length, 2);
  assert.equal(state.phases.phase2.needsAlignmentCheck, true);
  assert.equal(state.phases.phase3.needsAlignmentCheck, true);
  assert.equal(state.phases.phase4.needsAlignmentCheck, false); // empty phase is NOT falsely flagged
  assert.equal(state.phases.phase2.observedEvidence, 'Standardise intake log within 6 months.');

  state = nb.acknowledgeDownstreamAlignment(state, 'phase2');
  assert.equal(state.phases.phase2.needsAlignmentCheck, false);
  assert.equal(state.phases.phase3.needsAlignmentCheck, true);
});

test('E08: explicit platform pull candidate separates evidence and gap fields read-only', () => {
  const platformStore = {
    version: 1,
    lessons: {
      'cbd-2': {
        contentVersion: '2026.11-run02',
        completed: [0, 1],
        drafts: {
          '02-04': {
            0: 'Pilot two station custody logs.',
            4: 'Review numeric target after 90-day baseline sample.'
          }
        }
      }
    }
  };
  const pull = nb.extractPlatformPullCandidates(platformStore, null, 'phase2');
  assert.equal(pull.available, true);
  assert.match(pull.observedDraft, /Pilot two station custody logs/);
  assert.match(pull.assumptionDraft, /Review numeric target/);
});

test('E08: import validation rejects wrong-product, corrupt, oversized, and prototype-polluting files', () => {
  assert.equal(nb.validateNotebookImport('{bad').errorCode, 'invalid-json');
  assert.equal(nb.validateNotebookImport('{"progress":{"version":1,"lessons":{}}}').errorCode, 'wrong-product');
  assert.equal(nb.validateNotebookImport('{"module1":{}}').errorCode, 'wrong-product');
  assert.equal(nb.validateNotebookImport('{"__proto__":{"polluted":true}}').ok, false);
  assert.equal(nb.validateNotebookImport('{"product":"other","version":1,"phases":{}}').errorCode, 'incompatible-schema');

  const cur = nb.updatePhaseAndPropagate(nb.createDefaultNotebook(), 'phase1', {
    observedEvidence: 'Active local observation'
  });
  const incoming = nb.updatePhaseAndPropagate(nb.createDefaultNotebook(), 'phase1', {
    observedEvidence: 'Incoming alternate observation'
  });
  const plan = nb.validateNotebookImport(JSON.stringify({ notebook: incoming }));
  assert.equal(plan.ok, true);
  const merged = nb.applyNotebookImport(plan, 'merge', cur);
  assert.equal(merged.phases.phase1.observedEvidence, 'Active local observation');
  assert.equal(merged.phases.phase1.revisions.length, 1);
  assert.equal(merged.phases.phase1.revisions[0].observedEvidence, 'Incoming alternate observation');
});

test('E08: printable advisory thread brief escapes user XSS payloads and carries no automated correctness claims', () => {
  const s = nb.updatePhaseAndPropagate(nb.createDefaultNotebook(), 'phase1', {
    observedEvidence: '<script>xss()</script>Observed baseline evidence',
    assumptionsAndGaps: '<img src=x onerror=bad()>Open question'
  });
  const html = nb.buildNotebookDocumentHTML(s);
  assert(!html.includes('<script>xss'));
  assert(!html.includes('<img src=x'));
  assert(html.includes('&lt;script&gt;xss()&lt;/script&gt;'));
  assert(html.includes('no automated grading'));
});
