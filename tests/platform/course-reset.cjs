'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const resetMod = require('../../platform/course-reset.js');
const explorationMod = require('../../platform/exploration.js');

function createMockStorage(initial = {}, opts = {}) {
  const map = new Map(Object.entries(initial).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]));
  return {
    map,
    getItem(key) {
      if (opts.failGet && opts.failGet(key)) throw new Error('get denied: ' + key);
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, val) {
      if (opts.failSet && opts.failSet(key)) throw new Error('set denied: ' + key);
      map.set(String(key), String(val));
    },
    removeItem(key) {
      if (opts.failRemove && opts.failRemove(key)) throw new Error('remove denied: ' + key);
      map.delete(String(key));
    }
  };
}

test('full CBD reset clears all CBD stores (L1, L2-6, workbenches, notebook, exploration, group exercise) and preserves language & unrelated keys', () => {
  const local = createMockStorage({
    carana_lang_v1: 'ar',
    unrelated_pref_key: 'keep-me',
    carana_cbd_course_v1: { version: 1, completed: [0, 1], visited: ['0:0', '0:1'], lastSection: 2, lessonComplete: false },
    carana_cbd_course_v1_pre_restore: { version: 1, completed: [0] },
    carana_learning_v1: {
      version: 1,
      lessons: {
        'cbd-2': { contentVersion: '2026.11-run02', completed: [0, 1], drafts: { '02-04': { 0: 'Objective' } } },
        'cbd-5': { contentVersion: '2026.11-run02', completed: [0], drafts: {} },
        'mma-1': { contentVersion: '2026.11-run01', completed: [0], drafts: { '01-01': { 0: 'Keep non-CBD MMA lesson' } } }
      }
    },
    carana_learning_v1_pre_restore: {
      version: 1,
      lessons: {
        'cbd-3': { contentVersion: '2026.11-run02', completed: [0] },
        'cop-1': { contentVersion: '2026.11-run01', completed: [] }
      }
    },
    carana_cbd_lab_v1: { app: 'CARANA CBD Learning Lab', module1: { confirmed: true }, module2: { goal: 'Save police' } },
    carana_cbd_lab_v1_corrupted_backup: '{broken',
    carana_cbd_lab_v1_pre_handoff: { module2: { goal: 'Old' } },
    carana_notebook_v1: { product: 'carana-evidence-notebook-v1', phases: { phase1: { observed: 'Gap noted' } } },
    carana_notebook_v1_pre_restore: { phases: {} },
    carana_cbd_group_activity_v1: { team: { name: 'Syndicate A' }, meta: { confirmed: true } },
    carana_exploration_v1: {
      version: 1,
      records: {
        'cbd-1/01-01/a1b2c3d4': { seen: ['n-11112222'], selected: 'n-11112222', practice: true },
        'cbd-4/04-02/11223344': { seen: ['n-33334444'], dismissed: true },
        'mma-1/01-01/deadbeef': { seen: ['n-55556666'], selected: 'n-55556666' }
      }
    }
  });
  const session = createMockStorage({
    carana_cbd_lab_v1: 'stale-session-copy',
    carana_cbd_group_activity_v1: 'stale-group-copy',
    session_auth_note: 'keep-session-note'
  });

  const expStore = explorationMod.createStore(local);
  const outcome = resetMod.resetCbdCourse({
    storage: local,
    sessionStorage: session,
    explorationStore: expStore
  });

  assert.equal(outcome.ok, true);
  assert.deepEqual(outcome.failedKeys, []);
  assert.equal(outcome.preservedLanguage, 'ar');
  assert.equal(outcome.preservedNonCbd, true);

  // All standalone CBD keys removed
  for (const key of [
    'carana_cbd_course_v1',
    'carana_cbd_course_v1_pre_restore',
    'carana_cbd_lab_v1',
    'carana_cbd_lab_v1_corrupted_backup',
    'carana_cbd_lab_v1_pre_handoff',
    'carana_notebook_v1',
    'carana_notebook_v1_pre_restore',
    'carana_cbd_group_activity_v1'
  ]) {
    assert.equal(local.getItem(key), null, `Expected ${key} cleared from localStorage`);
  }
  assert.equal(session.getItem('carana_cbd_lab_v1'), null);
  assert.equal(session.getItem('carana_cbd_group_activity_v1'), null);

  // Non-CBD entries preserved while CBD entries deleted
  const learningAfter = JSON.parse(local.getItem('carana_learning_v1'));
  assert.deepEqual(Object.keys(learningAfter.lessons), ['mma-1']);
  assert.equal(learningAfter.lessons['mma-1'].drafts['01-01'][0], 'Keep non-CBD MMA lesson');

  const preRestoreAfter = JSON.parse(local.getItem('carana_learning_v1_pre_restore'));
  assert.deepEqual(Object.keys(preRestoreAfter.lessons), ['cop-1']);

  const exploreAfter = JSON.parse(local.getItem('carana_exploration_v1'));
  assert.deepEqual(Object.keys(exploreAfter.records), ['mma-1/01-01/deadbeef']);

  // Preserved language & unrelated keys
  assert.equal(local.getItem('carana_lang_v1'), 'ar');
  assert.equal(local.getItem('unrelated_pref_key'), 'keep-me');
  assert.equal(session.getItem('session_auth_note'), 'keep-session-note');
});

test('CBD reset removes scoped keys completely when no non-CBD lessons or exploration records exist', () => {
  const local = createMockStorage({
    carana_lang_v1: 'fr-FR',
    carana_learning_v1: { version: 1, lessons: { 'cbd-2': { completed: [0] } } },
    carana_exploration_v1: { version: 1, records: { 'cbd-2/02-01/01020304': { seen: ['n-11223344'], selected: 'n-11223344' } } }
  });
  const expStore = explorationMod.createStore(local);
  const cbdDescriptor = { key: 'cbd-2/02-01/01020304', ids: ['n-11223344'] };
  assert.deepEqual(expStore.get(cbdDescriptor).seen, ['n-11223344']);

  const outcome = resetMod.resetCbdCourse({ storage: local, sessionStorage: createMockStorage(), explorationStore: expStore });

  assert.equal(outcome.ok, true);
  assert.equal(local.getItem('carana_learning_v1'), null);
  assert.equal(local.getItem('carana_exploration_v1'), null);
  assert.deepEqual(expStore.get(cbdDescriptor).seen, []);
  assert.equal(local.getItem('carana_lang_v1'), 'fr-FR');
});

test('CBD reset detects and reports partial storage failure instead of claiming success', () => {
  const local = createMockStorage(
    {
      carana_cbd_course_v1: { version: 1, completed: [0] },
      carana_notebook_v1: { phases: { phase1: { observed: 'Locked' } } },
      carana_learning_v1: {
        version: 1,
        lessons: {
          'cbd-2': { completed: [0] },
          'mma-1': { completed: [] }
        }
      },
      carana_exploration_v1: { version: 1, records: { 'cbd-1/01-01/aabbccdd': { seen: ['n-aabbccdd'], selected: 'n-aabbccdd' } } }
    },
    {
      failRemove: k => k === 'carana_notebook_v1' || k === 'carana_exploration_v1',
      failSet: k => k === 'carana_learning_v1'
    }
  );
  const expStore = explorationMod.createStore(local);
  const outcome = resetMod.resetCbdCourse({
    storage: local,
    sessionStorage: createMockStorage(),
    explorationStore: expStore
  });

  assert.equal(outcome.ok, false);
  assert.equal(local.getItem('carana_cbd_course_v1'), null);
  assert(outcome.failedKeys.includes('carana_notebook_v1'));
  assert(outcome.failedKeys.includes('carana_learning_v1'));
  assert(outcome.failedKeys.includes('carana_exploration_v1'));
});
