const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const core = require('../../platform/progress-core.js');
const lessons = ['lessons-2-3', 'lessons-4-6'].flatMap(f => require('../../curricula/cbd/' + f + '.json'));
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'platform/catalog.js'), 'utf8'), ctx);
const catalogLessons = ctx.window.CARANA_CATALOG.flatMap(c => c.lessons || []);

test('E02: safeProgress preserves drafts across multiple content revisions without granting mastery', () => {
  const cbd2 = lessons.find(l => l.id === 'cbd-2');
  const v1Raw = {
    contentVersion: '2026.11-run01',
    completed: [0, 1],
    section: 1,
    screen: 0,
    drafts: {
      '02-04': { 0: 'Establish supervisory case review in Unit A', 1: '40 sampled files/month' },
      '02-03': { 0: 5, 1: 2 }
    }
  };
  const v2State = core.safeProgress(cbd2, v1Raw, '2026-11-18T12:00:00Z');
  assert.equal(v2State.contentVersion, cbd2.version);
  assert.deepEqual(v2State.completed, []);
  assert.deepEqual(v2State.drafts, {});
  assert.equal(v2State.revisionAck, false);
  assert.equal(v2State.previousProgress.length, 1);
  assert.equal(v2State.previousProgress[0].drafts['02-04'][0], 'Establish supervisory case review in Unit A');
  assert.equal(v2State.previousProgress[0].drafts['02-03'][0], 5);

  // Add new draft in v2, then simulate upgrade to a hypothetical v3
  v2State.completed = [0];
  v2State.drafts['02-04'] = { 0: 'Updated v2 objective wording' };
  const v3Lesson = { ...cbd2, version: '2027.01-run04' };
  const v3State = core.safeProgress(v3Lesson, v2State, '2027-01-05T09:00:00Z');
  assert.deepEqual(v3State.completed, []);
  assert.equal(v3State.previousProgress.length, 2);
  assert.equal(v3State.previousProgress[0].contentVersion, '2026.11-run01');
  assert.equal(v3State.previousProgress[1].contentVersion, cbd2.version);
  assert.equal(v3State.previousProgress[1].drafts['02-04'][0], 'Updated v2 objective wording');
});

test('E02: legacy history without drafts never fabricates recoverable draft text', () => {
  const cbd2 = lessons.find(l => l.id === 'cbd-2');
  const legacyNoDrafts = { contentVersion: '2026.11-run01', completed: [0], section: 1, screen: 0 };
  const migrated = core.safeProgress(cbd2, legacyNoDrafts, '2026-11-18T12:00:00Z');
  assert.equal(migrated.previousProgress[0].drafts, undefined);
  assert.deepEqual(core.getArchivedDraftsForScreen(migrated, '02-04'), []);
});

test('E03: platform import rejects corrupt, oversized, prototype-polluted, and wrong-product backups safely', () => {
  const emptyStore = { version: 1, lessons: {} };
  assert.equal(core.validatePlatformImport('{bad json', emptyStore, catalogLessons).errorCode, 'invalid-json');
  assert.equal(core.validatePlatformImport('x'.repeat(core.MAX_IMPORT_BYTES + 10), emptyStore, catalogLessons).errorCode, 'too-large');
  assert.equal(core.validatePlatformImport(JSON.stringify({ version: 99 }), emptyStore, catalogLessons).errorCode, 'incompatible-schema');

  const l1Export = JSON.stringify({
    course: 'CARANA CBD E-Learning',
    lesson: 'Situational Analysis',
    progress: { version: 1, completed: [0, 1], visited: ['0:0'] }
  });
  const l1Check = core.validatePlatformImport(l1Export, emptyStore, catalogLessons);
  assert.equal(l1Check.ok, false);
  assert.equal(l1Check.errorCode, 'wrong-product');
  assert.match(l1Check.message, /Lesson 1/);

  const labExport = JSON.stringify({ app: 'CARANA CBD Learning Lab', module1: { status: 'in_progress' } });
  const labCheck = core.validatePlatformImport(labExport, emptyStore, catalogLessons);
  assert.equal(labCheck.ok, false);
  assert.equal(labCheck.errorCode, 'wrong-product');
  assert.match(labCheck.message, /Module 1–6/);

  const badId = JSON.stringify({
    version: 1,
    progress: { version: 1, lessons: { '../bad': { contentVersion: '2026.11-run02', completed: [] } } }
  });
  assert.equal(core.validatePlatformImport(badId, emptyStore, catalogLessons).errorCode, 'invalid-lesson-id');
});

test('E03: platform import handles incompatible version migration, duplicates, and conflicting drafts without overwriting', () => {
  const cbd2Ver = catalogLessons.find(l => l.id === 'cbd-2').version;
  const localStore = {
    version: 1,
    lessons: {
      'cbd-2': {
        contentVersion: cbd2Ver,
        completed: [0],
        section: 1,
        screen: 0,
        view: 'screen',
        drafts: {
          '02-04': { 0: 'Local active draft', 1: 'Shared identical text' }
        },
        previousProgress: []
      }
    }
  };
  const incomingFile = JSON.stringify({
    version: 1,
    exportedAt: '2026-11-18T10:00:00Z',
    progress: {
      version: 1,
      lessons: {
        'cbd-2': {
          contentVersion: cbd2Ver,
          completed: [0, 1],
          section: 1,
          screen: 1,
          view: 'screen',
          drafts: {
            '02-04': { 0: 'Incoming conflicting draft', 1: 'Shared identical text', 2: 'New field text' }
          },
          previousProgress: []
        },
        'cbd-3': {
          contentVersion: '2026.11-run01',
          completed: [0, 1, 2],
          section: 2,
          screen: 0,
          drafts: {
            '03-10': { 0: 'Old version logframe row' }
          }
        }
      }
    }
  });

  const plan = core.validatePlatformImport(incomingFile, localStore, catalogLessons);
  assert.equal(plan.ok, true);
  assert.equal(plan.hasConflicts, true);
  const item2 = plan.items.find(i => i.id === 'cbd-2');
  const item3 = plan.items.find(i => i.id === 'cbd-3');
  assert.equal(item2.compatibility, 'exact-match');
  assert.equal(item2.conflictFields, 1);
  assert.equal(item2.identicalFields, 1);
  assert.equal(item2.newFields, 1);
  assert.equal(item3.compatibility, 'version-mismatch');

  const merged = core.applyPlatformImport(localStore, plan, 'merge', catalogLessons, '2026-11-18T12:30:00Z');
  // cbd-2: local active preserved, new field merged, conflicting field archived (never lost!)
  assert.deepEqual(merged.lessons['cbd-2'].completed, [0, 1]);
  assert.equal(merged.lessons['cbd-2'].drafts['02-04'][0], 'Local active draft');
  assert.equal(merged.lessons['cbd-2'].drafts['02-04'][1], 'Shared identical text');
  assert.equal(merged.lessons['cbd-2'].drafts['02-04'][2], 'New field text');
  assert.equal(merged.lessons['cbd-2'].previousProgress[0].drafts['02-04'][0], 'Incoming conflicting draft');

  // cbd-3: older version migrated cleanly; checkpoints NOT falsely granted, drafts archived
  assert.equal(merged.lessons['cbd-3'].contentVersion, catalogLessons.find(l => l.id === 'cbd-3').version);
  assert.deepEqual(merged.lessons['cbd-3'].completed, []);
  assert.equal(merged.lessons['cbd-3'].previousProgress[0].completed.length, 3);
  assert.equal(merged.lessons['cbd-3'].previousProgress[0].drafts['03-10'][0], 'Old version logframe row');
});

test('E03: Lesson 1 backup validation rejects platform files and merges Lesson 1 progress cleanly', () => {
  const platExport = JSON.stringify({ version: 1, progress: { version: 1, lessons: {} } });
  assert.equal(core.validateLesson1Import(platExport, null).errorCode, 'wrong-product');

  const validL1 = JSON.stringify({
    course: 'CARANA CBD E-Learning',
    exportedAt: '2026-11-18T12:00:00Z',
    progress: {
      version: 1,
      completed: [0, 1, 2, 4], // 4 skipped 3 -> normalizes contiguously to [0,1,2]
      visited: ['0:0', '0:1', 'bad:entry'],
      lastSection: 2,
      lastScreen: 1,
      lastKind: 'screen',
      activityOpened: true,
      lessonComplete: true
    }
  });
  const plan = core.validateLesson1Import(validL1, { version: 1, completed: [0], visited: ['0:0'], lastSection: 0, lastScreen: 0 });
  assert.equal(plan.ok, true);
  assert.deepEqual(plan.sanitized.completed, [0, 1, 2]);
  assert.equal(plan.sanitized.lessonComplete, false);
  const merged = core.applyLesson1Import({ version: 1, completed: [0], visited: ['0:0'], lastSection: 0, lastScreen: 0, lastKind: 'screen', startedAt: '2026-11-18T08:00:00Z' }, plan, 'merge');
  assert.deepEqual(merged.completed, [0, 1, 2]);
  assert.deepEqual(merged.visited, ['0:0', '0:1']);
});

test('E04 & E07: catalog status labels and printable study summary escape HTML and support Arabic/RTL safely', () => {
  const l1 = core.readLesson1Summary({ version: 1, startedAt: '2026-11-18T08:00:00Z', completed: [0, 1], visited: ['0:0'], lastSection: 2, lastScreen: 0 }, { module1: { confirmed: false } });
  assert.match(l1.statusText, /2 \/ 6 quizzes/);
  assert.equal(l1.actionText, 'Resume Lesson 1');

  const cbd2Cat = catalogLessons.find(l => l.id === 'cbd-2');
  assert.equal(core.describeCatalogLesson(cbd2Cat, undefined).actionText, 'Explore lesson');
  assert.match(core.describeCatalogLesson(cbd2Cat, { contentVersion: cbd2Cat.version, completed: [0], section: 1, screen: 0, drafts: {} }).statusText, /1 \/ 3 quizzes/);
  assert.equal(core.describeCatalogLesson(cbd2Cat, { contentVersion: cbd2Cat.version, completed: [0, 1, 2], section: 2, screen: 2, drafts: {} }).actionText, 'Review completed lesson');
  assert.equal(core.describeCatalogLesson(cbd2Cat, { contentVersion: 'old-v1', completed: [0], drafts: { '02-04': { 0: 'text' } } }).actionText, 'Review updated lesson');

  const doc = core.buildStudySummaryDocumentHTML({
    version: 1,
    lessons: {
      'cbd-2': {
        contentVersion: cbd2Cat.version,
        completed: [0],
        drafts: { '02-04': { 0: '<script>xss()</script> مراجعة ملفات القضية' } },
        previousProgress: [{ contentVersion: 'old-v1', completed: [0], drafts: { '02-04': { 0: 'Archived text <b>bold</b>' } } }]
      }
    }
  }, lessons, l1, '2026-11-18T12:00:00Z');
  assert(!doc.includes('<script>xss()'));
  assert(doc.includes('&lt;script&gt;xss()'));
  assert(doc.includes('مراجعة ملفات القضية'));
  assert(doc.includes('Archived Drafts (old-v1)'));
});
