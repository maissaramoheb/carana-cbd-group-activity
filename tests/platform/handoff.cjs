const { test } = require('node:test');
const assert = require('node:assert/strict');
const handoff = require('../../platform/handoff.js');
const labStorage = require('../../js/storage/lab-storage.js');

test('E09: handoff triggers on the intended synthesis screens of Lessons 2-6 only', () => {
  assert.equal(handoff.shouldShowOnScreen(2, '02-06'), true);
  assert.equal(handoff.shouldShowOnScreen(3, '03-07'), true);
  assert.equal(handoff.shouldShowOnScreen(4, '04-06'), true);
  assert.equal(handoff.shouldShowOnScreen(5, '05-05'), true);
  assert.equal(handoff.shouldShowOnScreen(6, '06-06'), true);
  assert.equal(handoff.shouldShowOnScreen(2, '02-01'), false);
  assert.equal(handoff.shouldShowOnScreen(1, '01-01'), false);
});

test('E09: handoff builds accurate field mapping and preserves untouched workbench conflicts by default', () => {
  const existingLab = labStorage.getDefaultState();
  existingLab.module2.smartObjectives[0].specific = 'Existing learner workbench entry (must not be silently overwritten)';
  existingLab.module2.smartObjectives[0].measurable = '';

  const drafts = {
    '02-04': {
      0: 'New draft specific target from Lesson 2',
      1: 'New draft measurable evidence from Lesson 2'
    }
  };

  const map = handoff.buildMapping(2, drafts, existingLab);
  const specRow = map.find(r => r.targetPath === 'module2.smartObjectives.0.specific');
  const measRow = map.find(r => r.targetPath === 'module2.smartObjectives.0.measurable');
  assert.equal(specRow.willConflict, true);
  assert.equal(measRow.willConflict, false);

  // Without allowOverwrite, conflict field stays untouched while empty field populates cleanly
  const safeRes = handoff.applyHandoffToLab(2, drafts, existingLab, { allowOverwrite: false });
  assert.equal(
    safeRes.nextLabState.module2.smartObjectives[0].specific,
    'Existing learner workbench entry (must not be silently overwritten)'
  );
  assert.equal(
    safeRes.nextLabState.module2.smartObjectives[0].measurable,
    'New draft measurable evidence from Lesson 2'
  );
  assert.equal(safeRes.nextLabState.module2.confirmed, false);
  assert.equal(safeRes.skippedConflicts.length, 1);
  assert.equal(safeRes.nextLabState.module2.smartObjectives.length, 2);
  assert.equal(safeRes.nextLabState.module2.kpis.length, 2);

  // Original existingLab object was NOT mutated
  assert.equal(existingLab.module2.smartObjectives[0].measurable, '');

  // Pre-handoff backup snapshot preserves exact prior value
  assert.equal(
    safeRes.preBackup.module2.smartObjectives[0].specific,
    'Existing learner workbench entry (must not be silently overwritten)'
  );
});

test('E09: explicit opt-in overwrite updates conflicting fields and Lesson 3-6 handoffs map cleanly without corrupting IDs', () => {
  const existingLab = labStorage.getDefaultState();
  existingLab.module3.logframe.outcomes[0].narrative = 'Old logframe narrative';
  const res3 = handoff.applyHandoffToLab(
    3,
    {
      '03-10': { 0: 'Revised custody accountability outcome', 1: 'Case review audit completion rate' },
      '03-07': { 0: 'Records server outage > 48h' }
    },
    existingLab,
    { allowOverwrite: true }
  );
  assert.equal(res3.nextLabState.module3.logframe.outcomes[0].id, 'out-1');
  assert.equal(res3.nextLabState.module3.logframe.outcomes[0].narrative, 'Revised custody accountability outcome');
  assert.equal(res3.nextLabState.module3.contingency.trigger, 'Records server outage > 48h');
  assert.equal(res3.skippedConflicts.length, 0);

  const res6 = handoff.applyHandoffToLab(
    6,
    {
      '06-05': { 0: 'Transfer weekly custody inspection leadership', 2: 'Sustain gender desk focal point budget' },
      '06-07': { 0: 'Joint handover review script' }
    },
    labStorage.getDefaultState(),
    { allowOverwrite: false }
  );
  assert.match(res6.nextLabState.module6.reflection.q1TransitionMindset, /Transfer weekly custody/);
  assert.match(res6.nextLabState.module6.reflection.q2SustainingOwnership, /Sustain gender desk/);
  assert.match(res6.nextLabState.module6.reflection.q3OverallCBDJourney, /Joint handover review/);
});

test('E09: HTML handoff output escapes user-entered HTML and rejects prototype-pollution keys cleanly', () => {
  const html = handoff.renderHandoffSection(
    { number: 4, title: 'Implementation', activity: '../../module4.html' },
    { '04-02': { 0: '<script>alert(1)</script>Cohort briefing' } },
    null
  );
  assert(!html.includes('<script>alert(1)'));
  assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;Cohort briefing'));

  const text = handoff.formatHandoffText(4, 'Implementation', { '04-02': { 0: 'Audience note' } }, null);
  assert.match(text, /Module 4: Implementation & MMA/);
  assert.match(text, /Audience note/);
});
