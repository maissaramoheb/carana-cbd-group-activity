'use strict';
/* Run 10.1 Browser E2E Verification:
 * 1. Checkpoint -> Quiz terminology across EN, FR, AR RTL in L1, L2-6, Home, Demo, Gallery.
 * 2. Complete CBD Course Reset button, native <dialog> confirmation, pre-reset backups + exclusion disclosure,
 *    partial-failure accuracy, full browser store clearing, reload persistence, and non-CBD / language preservation.
 * 3. Chromium desktop, WebKit desktop, WebKit mobile (390px & 320px), Axe WCAG checks, zero media auto-play.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium, webkit } = require(path.join(
  process.env.CBD_TEST_MODULES || '/tmp/carana-run10-test-tools/node_modules',
  'playwright'
));
const { launchMutedBrowser } = require('../helpers/mute-browser.cjs');

const ROOT = path.resolve(__dirname, '../..');
const OUT = process.env.CBD_TEST_OUTPUT || '/tmp/carana-run10-1-browser';
const SHOT_DIR = path.join(ROOT, 'docs/reviews/run10-1-quiz-and-reset/evidence');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SHOT_DIR, { recursive: true });
const axePath = process.env.CBD_AXE_PATH || '/tmp/carana-run10-test-tools/node_modules/axe-core/axe.min.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const FORBIDDEN_CHECKPOINT_RE = /(?:\bcheckpoints?\b|points?\s+de\s+contrôle|questions?\s+de\s+contrôle|نقطة\s+التحقق|نقاط\s+التحقق|نقطة\s+تحقق|سؤال\s+تحقق)/i;

function startServer() {
  const server = http.createServer((req, res) => {
    const cleanUrl = decodeURIComponent(String(req.url || '/').split('?')[0]).replace(/^\/+/, '');
    let target = path.join(ROOT, cleanUrl || 'index.html');
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    else if (!fs.existsSync(target) && fs.existsSync(target + '.html')) target += '.html';
    const resolved = path.resolve(target);
    if (!resolved.startsWith(ROOT) || !fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(resolved)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(resolved).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    resolve({ url: 'http://127.0.0.1:' + server.address().port, close: () => new Promise(r => server.close(r)) });
  }));
}

async function auditAxe(page, label, rows) {
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async () => {
    const res = await window.axe.run({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
    return res.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) }));
  });
  assert.equal(violations.length, 0, `${label} Axe violations: ${JSON.stringify(violations)}`);
  rows.push({ check: 'axe:' + label, violations: 0 });
}

function seedFullCbdProgressPayload(langCode = 'en') {
  return {
    langCode,
    l1: {
      version: 1,
      completed: [0, 1],
      visited: ['0:0', '0:1', '0:2', '1:0', '1:1', '1:2', '2:0'],
      activityOpened: false,
      lessonComplete: false,
      lastSection: 2,
      lastScreen: 0,
      lastKind: 'screen',
      startedAt: '2026-11-20T09:00:00.000Z',
      updatedAt: '2026-11-20T09:30:00.000Z'
    },
    learning: {
      version: 1,
      lessons: {
        'cbd-2': {
          contentVersion: '2026.11-run02',
          completed: [0, 1],
          section: 2,
          screen: 0,
          view: 'screen',
          drafts: { '02-04': { 0: 'CBD L2 seeded objective draft' } }
        },
        'cbd-3': {
          contentVersion: '2026.11-run02',
          completed: [0],
          section: 1,
          screen: 0,
          view: 'screen',
          drafts: { '03-04': { 0: 'CBD L3 seeded output draft' } }
        },
        'cbd-6': {
          contentVersion: '2026.11-run02',
          completed: [0, 1, 2],
          section: 2,
          screen: 2,
          view: 'quiz',
          drafts: {}
        },
        'mma-1': {
          contentVersion: '2026.11-run01',
          completed: [0],
          section: 1,
          screen: 0,
          drafts: { '01-01': { 0: 'Non-CBD MMA note to preserve' } }
        }
      }
    },
    lab: {
      version: '1.0.0',
      app: 'CARANA CBD Learning Lab',
      session: { teamName: 'Alpha Syndicate', participants: '5 advisers', noteTaker: 'Capt. Noor', date: '2026-11-20', role: 'participant' },
      module1: { status: 'completed', confirmed: true, pestel: { political: 'Coalition shift noted' } },
      module2: { smartObjectives: [{ objective: 'Improve case intake log compliance' }] },
      module3: { logframe: { goal: 'Accountable investigation workflows' } }
    },
    notebook: {
      product: 'carana-evidence-notebook-v1',
      version: 1,
      phases: {
        phase1: { observed: 'Case register inconsistencies in Galasi CIS', assumption: 'Supervisory staffing available' },
        phase2: { observed: 'Prioritised intake backlog objective' }
      }
    },
    exploration: {
      version: 1,
      records: {
        'cbd-1/01-01/11112222': { seen: ['n-11112222'], selected: 'n-11112222', practice: true },
        'cbd-2/02-01/33334444': { seen: ['n-33334444'], dismissed: true },
        'mma-1/01-01/deadbeef': { seen: ['n-55556666'], selected: 'n-55556666' }
      }
    },
    groupActivity: {
      version: '1.0',
      team: { name: 'Syndicate 1' },
      meta: { confirmed: true }
    }
  };
}

async function seedStorage(page, langCode = 'en') {
  const payload = seedFullCbdProgressPayload(langCode);
  await page.evaluate(p => {
    localStorage.clear();
    sessionStorage.clear();
    if (p.langCode !== 'en') localStorage.setItem('carana_lang_v1', p.langCode);
    localStorage.setItem('carana_cbd_course_v1', JSON.stringify(p.l1));
    localStorage.setItem('carana_cbd_course_v1_pre_restore', JSON.stringify(p.l1));
    localStorage.setItem('carana_learning_v1', JSON.stringify(p.learning));
    localStorage.setItem('carana_learning_v1_pre_restore', JSON.stringify(p.learning));
    localStorage.setItem('carana_cbd_lab_v1', JSON.stringify(p.lab));
    localStorage.setItem('carana_cbd_lab_v1_pre_handoff', JSON.stringify(p.lab));
    localStorage.setItem('carana_notebook_v1', JSON.stringify(p.notebook));
    localStorage.setItem('carana_notebook_v1_pre_restore', JSON.stringify(p.notebook));
    localStorage.setItem('carana_exploration_v1', JSON.stringify(p.exploration));
    localStorage.setItem('carana_cbd_group_activity_v1', JSON.stringify(p.groupActivity));
    localStorage.setItem('carana_unrelated_user_pref', 'preserve-this-setting');
  }, payload);
}

async function checkTerminologyClean(page, contextLabel) {
  const visible = await page.evaluate(() => document.body.innerText || '');
  assert.equal(
    FORBIDDEN_CHECKPOINT_RE.test(visible),
    false,
    `Learner-visible checkpoint term leaked on ${contextLabel}: ${visible.match(FORBIDDEN_CHECKPOINT_RE)?.[0]}`
  );
}

async function advanceCourseScreen(page, nextSelector) {
  await page.locator(nextSelector).click();
  const anyway = page.locator('.exploration-anyway');
  if (await anyway.count() && await anyway.isVisible()) {
    await anyway.click();
  }
}

async function verifyLessonQuizzesTerminology(page, baseUrl, lang, langCheckFn) {
  // Check Home first
  await page.goto(baseUrl + '/course/#home', { waitUntil: 'networkidle' });
  await page.waitForSelector('.cycle-orbit');
  await page.waitForSelector('#reset-course-btn');
  await checkTerminologyClean(page, `course-home:${lang}`);
  langCheckFn(await page.evaluate(() => document.body.innerText));

  // Check L1 quiz screen on the active un-cleared section (Section 2 if [0,1] seeded, or Section 0 if fresh)
  await page.goto(baseUrl + '/course/#lesson-1', { waitUntil: 'networkidle' });
  await page.waitForSelector('.side-rail');
  await checkTerminologyClean(page, `lesson1-screen:${lang}`);
  await advanceCourseScreen(page, '#next-screen');
  await advanceCourseScreen(page, '#next-screen');
  await page.waitForSelector('#next-screen');
  await checkTerminologyClean(page, `lesson1-screen3:${lang}`);
  await advanceCourseScreen(page, '#next-screen');
  await page.waitForSelector('#quiz-form');
  await checkTerminologyClean(page, `lesson1-quiz:${lang}`);
  const quizTextL1 = await page.evaluate(() => document.body.innerText);
  if (lang === 'en') assert(/Quiz:/.test(quizTextL1) && /QUIZ 0[1-6] \/ 06/.test(quizTextL1));
  if (lang === 'fr-FR') assert(/Quiz\s*:/.test(quizTextL1) && /QUIZ 0[1-6] \/ 06/.test(quizTextL1));
  if (lang === 'ar') assert(/الاختبار:/.test(quizTextL1) && /الاختبار 0[1-6] \/ 06/.test(quizTextL1));

  // Check Lessons 2-6 review lessons (both screen 3 and quiz screen)
  for (let num = 2; num <= 6; num++) {
    const lessonId = 'cbd-' + num;
    await page.goto(baseUrl + `/platform/?course=cbd&lesson=${lessonId}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('article.screen');
    await checkTerminologyClean(page, `${lessonId}-start:${lang}`);
    // Clear only this lesson's section progress if seeded so we reliably enter its Section 1 Quiz
    await page.evaluate(id => {
      try {
        const s = JSON.parse(localStorage.getItem('carana_learning_v1') || '{"version":1,"lessons":{}}');
        if (s.lessons && s.lessons[id]) {
          s.lessons[id] = { contentVersion: s.lessons[id].contentVersion, completed: [], section: 0, screen: 0, view: 'screen', drafts: s.lessons[id].drafts || {} };
          localStorage.setItem('carana_learning_v1', JSON.stringify(s));
        }
      } catch (_) {}
    }, lessonId);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('#next, #quiz');
    for (let step = 0; step < 10; step++) {
      if (await page.locator('#quiz').count()) break;
      await checkTerminologyClean(page, `${lessonId}-screen-${step}:${lang}`);
      await advanceCourseScreen(page, '#next');
    }
    await page.waitForSelector('#quiz');
    await checkTerminologyClean(page, `${lessonId}-quiz:${lang}`);
    const qText = await page.evaluate(() => document.body.innerText);
    if (lang === 'en') assert(/Formative quiz/i.test(qText), `${lessonId} missing Formative quiz in EN`);
    if (lang === 'fr-FR') assert(/Quiz formatif/i.test(qText), `${lessonId} missing Quiz formatif in FR`);
    if (lang === 'ar') assert(/اختبار تكويني/.test(qText), `${lessonId} missing اختبار تكويني in AR`);
  }
}

async function runSuite() {
  const srv = await startServer();
  const reportRows = [];
  let capturedShots = false;

  try {
    for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
      const browser = await launchMutedBrowser(engine);
      try {
        // 1. Desktop flow + EN Terminology + Complete Reset + Persistence + Error Check
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

        await page.goto(srv.url + '/course/#home', { waitUntil: 'networkidle' });
        await seedStorage(page, 'en');

        // Verify EN across all 6 lessons + Quiz terminology
        await verifyLessonQuizzesTerminology(page, srv.url, 'en', txt => {
          assert(/LESSON 01 QUIZZES/i.test(txt));
          assert(/Reset Course/i.test(txt));
        });

        // Also check Activities Hub, Visual Gallery, Demo page, Notebook in EN
        await page.goto(srv.url + '/course/#activities', { waitUntil: 'networkidle' });
        await checkTerminologyClean(page, `${name}:activities-hub:en`);
        await page.goto(srv.url + '/course/visual-gallery.html', { waitUntil: 'networkidle' });
        await checkTerminologyClean(page, `${name}:visual-gallery:en`);
        await page.goto(srv.url + '/platform/demo.html', { waitUntil: 'networkidle' });
        await checkTerminologyClean(page, `${name}:demo:en`);
        await page.goto(srv.url + '/platform/notebook.html', { waitUntil: 'networkidle' });
        await checkTerminologyClean(page, `${name}:notebook:en`);

        // Re-seed clean rich state and go back to Home for Reset UI verification
        await page.goto(srv.url + '/course/#home', { waitUntil: 'networkidle' });
        await seedStorage(page, 'en');
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForSelector('#reset-course-btn');

        // Confirm pre-reset populated indicators
        const beforeDeskText = await page.locator('.curriculum-highlights').innerText();
        assert.match(beforeDeskText, /2 of 6 quizzes passed/i);
        const l2Before = await page.locator('[data-home-progress="cbd-2"]').innerText();
        assert.match(l2Before, /2 \/ 3 quizzes passed/i);

        // Hover orbit phase card check (Run 10 hover stability preserved!)
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.locator('.cycle-stage').first().hover();
        assert.equal(await page.evaluate(() => window.scrollY), 0, 'Hovering orbit stage must not scroll page');

        if (!capturedShots && name === 'chromium') {
          await page.locator('#lesson-1').count(); // noop
          await page.screenshot({ path: path.join(SHOT_DIR, '01-home-quiz-terminology-en.png') });
          await page.locator('.cbd-reset-zone').scrollIntoViewIfNeeded();
          await page.screenshot({ path: path.join(SHOT_DIR, '02-reset-course-control-en.png') });
        }

        // Open Reset Dialog & verify WCAG/MWG dialog properties
        await page.locator('#reset-course-btn').click();
        await page.waitForSelector('dialog#cbd-reset-dialog[open]');
        const dialogMeta = await page.evaluate(() => {
          const d = document.getElementById('cbd-reset-dialog');
          const cs = getComputedStyle(d);
          return {
            hasRoleAttr: d.hasAttribute('role'),
            hasAriaModalAttr: d.hasAttribute('aria-modal'),
            activeId: document.activeElement?.id,
            overscrollBehavior: cs.overscrollBehavior,
            htmlOverflow: document.documentElement.style.overflow,
            bodyPosition: document.body.style.position,
            text: d.innerText
          };
        });
        assert.equal(dialogMeta.hasRoleAttr, false, 'Native <dialog> must not duplicate role=dialog');
        assert.equal(dialogMeta.hasAriaModalAttr, false, 'Native <dialog>.showModal() must not duplicate aria-modal');
        assert.equal(dialogMeta.activeId, 'cbd-reset-cancel', 'Cancel button should receive initial autofocus');
        assert.equal(dialogMeta.htmlOverflow, '', 'Never lock html overflow under modal dialog');
        assert.equal(dialogMeta.bodyPosition, '', 'Never fix body position under modal dialog');
        assert.match(dialogMeta.text, /Modules 1–6/);
        assert.match(dialogMeta.text, /Notebook/);
        assert.match(dialogMeta.text, /do NOT include/i);

        if (!capturedShots && name === 'chromium') {
          await auditAxe(page, 'home-and-reset-dialog-open', reportRows);
          await page.screenshot({ path: path.join(SHOT_DIR, '03-reset-confirmation-dialog-en.png') });
        }

        // Verify pre-reset exports inside confirmation dialog
        const [dlL1] = await Promise.all([
          page.waitForEvent('download'),
          page.locator('#cbd-reset-export-l1').click()
        ]);
        assert.match(dlL1.suggestedFilename(), /lesson1-progress\.json/);
        const [dlL26] = await Promise.all([
          page.waitForEvent('download'),
          page.locator('#cbd-reset-export-l26').click()
        ]);
        assert.match(dlL26.suggestedFilename(), /learning-progress\.json/);
        assert(await page.locator('#cbd-reset-export-status').isVisible());

        // Test Escape cancels cleanly without wiping data
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.getElementById('cbd-reset-dialog')?.open);
        assert(await page.evaluate(() => localStorage.getItem('carana_cbd_course_v1') !== null));

        // Test partial failure error reporting accuracy
        await page.locator('#reset-course-btn').click();
        await page.waitForSelector('dialog#cbd-reset-dialog[open]');
        await page.evaluate(() => {
          const origRemove = Storage.prototype.removeItem;
          window.__origRemoveItem = origRemove;
          Storage.prototype.removeItem = function (key) {
            if (key === 'carana_notebook_v1') throw new Error('Simulated quota/permission block');
            return origRemove.call(this, key);
          };
        });
        await page.locator('#cbd-reset-confirm').click();
        await page.waitForSelector('#cbd-reset-error:not([hidden])');
        const errText = await page.locator('#cbd-reset-error').innerText();
        assert.match(errText, /carana_notebook_v1/);
        assert(await page.evaluate(() => document.getElementById('cbd-reset-dialog').open), 'Dialog must stay open on partial failure');

        // Restore storage and re-seed to test full clean reset
        await page.evaluate(() => {
          Storage.prototype.removeItem = window.__origRemoveItem;
          delete window.__origRemoveItem;
        });
        await seedStorage(page, 'en');

        // Execute confirmed Reset Course
        await page.locator('#cbd-reset-confirm').click();
        await page.waitForFunction(() => !document.getElementById('cbd-reset-dialog')?.open);
        await page.waitForSelector('#course-reset-banner');

        assert.equal(await page.evaluate(() => window.scrollY), 0, 'Reset returns learner cleanly to top of course start');
        const bannerText = await page.locator('#course-reset-banner').innerText();
        assert.match(bannerText, /Course reset complete/i);
        const afterDeskText = await page.locator('.curriculum-highlights').innerText();
        assert.match(afterDeskText, /Six phases, each connected/i);
        assert.match(afterDeskText, /0\s*\/06/);
        assert.match(await page.locator('#start-course').innerText(), /Start with Lesson 01/);

        if (!capturedShots && name === 'chromium') {
          await page.screenshot({ path: path.join(SHOT_DIR, '04-post-reset-clean-start-en.png') });
          await auditAxe(page, 'post-reset-home-banner', reportRows);
        }

        // Reload and verify zero CBD data returned + non-CBD & unrelated preserved
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForSelector('.cycle-orbit');
        const storageAfterReload = await page.evaluate(() => ({
          l1: localStorage.getItem('carana_cbd_course_v1'),
          l1bak: localStorage.getItem('carana_cbd_course_v1_pre_restore'),
          lab: localStorage.getItem('carana_cbd_lab_v1'),
          labHandoff: localStorage.getItem('carana_cbd_lab_v1_pre_handoff'),
          nb: localStorage.getItem('carana_notebook_v1'),
          nbBak: localStorage.getItem('carana_notebook_v1_pre_restore'),
          grp: localStorage.getItem('carana_cbd_group_activity_v1'),
          learning: JSON.parse(localStorage.getItem('carana_learning_v1') || 'null'),
          learningBak: JSON.parse(localStorage.getItem('carana_learning_v1_pre_restore') || 'null'),
          explore: JSON.parse(localStorage.getItem('carana_exploration_v1') || 'null'),
          unrelated: localStorage.getItem('carana_unrelated_user_pref')
        }));
        assert.equal(storageAfterReload.l1, null);
        assert.equal(storageAfterReload.l1bak, null);
        assert.equal(storageAfterReload.lab, null);
        assert.equal(storageAfterReload.labHandoff, null);
        assert.equal(storageAfterReload.nb, null);
        assert.equal(storageAfterReload.nbBak, null);
        assert.equal(storageAfterReload.grp, null);
        assert.deepEqual(Object.keys(storageAfterReload.learning.lessons), ['mma-1']);
        assert.deepEqual(Object.keys(storageAfterReload.learningBak.lessons), ['mma-1']);
        assert.deepEqual(Object.keys(storageAfterReload.explore.records), ['mma-1/01-01/deadbeef']);
        assert.equal(storageAfterReload.unrelated, 'preserve-this-setting');

        // Verify French + Arabic RTL full flow (terminology + reset preserves carana_lang_v1!)
        for (const lang of ['fr-FR', 'ar']) {
          await page.goto(srv.url + '/course/#home', { waitUntil: 'networkidle' });
          await seedStorage(page, lang);
          await page.reload({ waitUntil: 'networkidle' });
          await page.waitForSelector('#reset-course-btn');

          const dirAttr = await page.evaluate(() => document.documentElement.dir);
          assert.equal(dirAttr, lang === 'ar' ? 'rtl' : 'ltr');

          await verifyLessonQuizzesTerminology(page, srv.url, lang, txt => {
            if (lang === 'fr-FR') assert(/QUIZ LEÇON 01/i.test(txt) && /Réinitialiser le cours/.test(txt));
            if (lang === 'ar') assert(/اختبارات الدرس 01/.test(txt) && /إعادة ضبط الدورة/.test(txt));
          });

          // Navigate to Home, open dialog, reset, reload, confirm lang preserved
          await page.goto(srv.url + '/course/#home', { waitUntil: 'networkidle' });
          await page.waitForSelector('#reset-course-btn');
          await page.locator('#reset-course-btn').click();
          await page.waitForSelector('dialog#cbd-reset-dialog[open]');

          if (!capturedShots && name === 'chromium' && lang === 'ar') {
            await page.screenshot({ path: path.join(SHOT_DIR, '05-reset-dialog-ar-rtl.png') });
          }
          if (!capturedShots && name === 'chromium' && lang === 'fr-FR') {
            await page.screenshot({ path: path.join(SHOT_DIR, '06-reset-dialog-fr.png') });
          }

          await page.locator('#cbd-reset-confirm').click();
          await page.waitForSelector('#course-reset-banner');
          await page.reload({ waitUntil: 'networkidle' });
          const preserved = await page.evaluate(() => ({
            lang: localStorage.getItem('carana_lang_v1'),
            docLang: document.documentElement.lang,
            docDir: document.documentElement.dir,
            l1: localStorage.getItem('carana_cbd_course_v1'),
            nb: localStorage.getItem('carana_notebook_v1'),
            lab: localStorage.getItem('carana_cbd_lab_v1')
          }));
          assert.equal(preserved.lang, lang, `Language ${lang} must survive reset + reload`);
          assert.equal(preserved.docDir, lang === 'ar' ? 'rtl' : 'ltr');
          assert.equal(preserved.l1, null);
          assert.equal(preserved.nb, null);
          assert.equal(preserved.lab, null);

          if (!capturedShots && name === 'chromium' && lang === 'ar') {
            await auditAxe(page, 'home-ar-rtl', reportRows);
          }
        }

        // Capture Quiz screen screenshots in AR and EN for review gallery
        if (!capturedShots && name === 'chromium') {
          await page.evaluate(() => localStorage.setItem('carana_lang_v1', 'ar'));
          await page.goto(srv.url + '/course/#lesson-1', { waitUntil: 'networkidle' });
          await page.waitForSelector('.side-rail');
          await advanceCourseScreen(page, '#next-screen');
          await advanceCourseScreen(page, '#next-screen');
          await advanceCourseScreen(page, '#next-screen');
          await page.waitForSelector('#quiz-form');
          await page.screenshot({ path: path.join(SHOT_DIR, '08-lesson1-quiz-screen-ar.png') });

          await page.evaluate(() => localStorage.removeItem('carana_lang_v1'));
          await page.reload({ waitUntil: 'networkidle' });
          await page.waitForSelector('#quiz-form');
          await checkTerminologyClean(page, 'screenshot:quiz-en');
          await page.screenshot({ path: path.join(SHOT_DIR, '07-lesson1-quiz-screen-en.png') });
          await auditAxe(page, 'lesson1-quiz-en', reportRows);
          capturedShots = true;
        }

        assert.deepEqual(errors, [], `${name} console/page errors: ${errors.join('; ')}`);
        reportRows.push({ engine: name, desktop: 'PASS', trilingual: ['en', 'fr-FR', 'ar'], errors: 0 });
        await ctx.close();

        // 2. Mobile checks (390px and 320px) on WebKit & Chromium
        for (const width of [390, 320]) {
          const mCtx = await browser.newContext({ viewport: { width, height: 844 } });
          const mPage = await mCtx.newPage();
          const mErrors = [];
          mPage.on('pageerror', e => mErrors.push(e.message));
          await mPage.goto(srv.url + '/course/#home', { waitUntil: 'networkidle' });
          await seedStorage(mPage, 'en');
          await mPage.reload({ waitUntil: 'networkidle' });
          await mPage.waitForSelector('#reset-course-btn');
          assert(await mPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${name} ${width}px overflow on home`);

          await mPage.locator('#reset-course-btn').click();
          await mPage.waitForSelector('dialog#cbd-reset-dialog[open]');
          const dialogBox = await mPage.locator('#cbd-reset-dialog').boundingBox();
          assert(dialogBox && dialogBox.width <= width, `${name} ${width}px dialog exceeds viewport`);
          await mPage.locator('#cbd-reset-confirm').click();
          await mPage.waitForSelector('#course-reset-banner');
          assert(await mPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${name} ${width}px overflow after reset`);
          assert.deepEqual(mErrors, []);
          reportRows.push({ engine: name, mobileWidth: width, overflow: false, dialogFit: true, errors: 0 });
          await mCtx.close();
        }
      } finally {
        await browser.close();
      }
    }

    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({ ok: true, reportRows }, null, 2));
    console.log(JSON.stringify({ ok: true, checks: reportRows.length, screenshotsSaved: fs.readdirSync(SHOT_DIR).length }, null, 2));
  } finally {
    await srv.close();
  }
}

runSuite().catch(err => {
  console.error(err);
  process.exit(1);
});
