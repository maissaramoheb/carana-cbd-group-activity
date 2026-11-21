#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { launchMutedBrowser } = require('../helpers/mute-browser.cjs');

const MODULES_DIR = process.env.CBD_TEST_MODULES || '/tmp/cbd-test-modules';
const { chromium, webkit } = require(path.join(MODULES_DIR, 'playwright'));
const axePath = require.resolve(path.join(MODULES_DIR, 'axe-core/axe.min.js'));

const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = process.env.RUN08_SCREENSHOT_DIR || '/tmp/run08-after';
fs.mkdirSync(OUT_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function startStaticServer(rootDir = ROOT) {
  const server = http.createServer((req, res) => {
    const cleanUrl = String(req.url || '/').split('?')[0];
    let rel = decodeURIComponent(cleanUrl).replace(/^\/+/, '');
    if (!rel) rel = 'index.html';
    let target = path.join(rootDir, rel);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      target = path.join(target, 'index.html');
    } else if (!fs.existsSync(target) && fs.existsSync(target + '.html')) {
      target = target + '.html';
    }
    const resolved = path.resolve(target);
    if (!resolved.startsWith(path.resolve(rootDir)) || !fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(resolved).pipe(res);
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ url: `http://127.0.0.1:${port}`, close: () => new Promise(r => server.close(r)) });
    });
  });
}

async function runAxeIfDesktopChromium(page, profileName, label, { selector = null, exclude = [] } = {}) {
  if (profileName !== 'chromium-desktop') return;
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(
    async ({ sel, exc }) => {
      const target = sel ? document.querySelector(sel) || document : document;
      const context = exc.length ? { include: sel ? [target] : [document], exclude: exc.map(s => [s]) } : target;
      const res = await window.axe.run(context, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }
      });
      return res.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        targets: v.nodes.slice(0, 3).map(n => n.target)
      }));
    },
    { sel: selector, exc: exclude }
  );
  if (violations.length) {
    fs.writeFileSync(path.join(OUT_DIR, `axe-${label}.json`), JSON.stringify(violations, null, 2));
  }
  assert.deepEqual(violations, [], `Axe WCAG violations on ${label}: ${JSON.stringify(violations)}`);
}

async function switchLang(page, code) {
  const btn = page.locator(`.carana-lang-switch button[data-lang-choice="${code}"]`).first();
  await btn.waitFor({ state: 'visible', timeout: 8000 });
  await btn.click();
  await page.waitForFunction(expected => document.documentElement.dataset.lang === expected, code, { timeout: 8000 });
}

async function checkLayout(page, label, expectedLang, expectedDir) {
  const info = await page.evaluate(() => {
    const h = document.documentElement;
    const pEl = document.querySelector('main p, .screen-lead, .hero p, h1, h2');
    const letterSpacing = pEl ? getComputedStyle(pEl).letterSpacing : '0px';
    return {
      lang: h.lang,
      dir: h.dir,
      dataLang: h.dataset.lang,
      scrollWidth: h.scrollWidth,
      innerWidth: window.innerWidth,
      letterSpacing
    };
  });
  assert.equal(info.dir, expectedDir, `${label}: expected dir=${expectedDir}, got ${info.dir}`);
  assert.equal(info.dataLang, expectedLang, `${label}: expected data-lang=${expectedLang}, got ${info.dataLang}`);
  assert.ok(
    info.scrollWidth <= info.innerWidth + 2,
    `${label}: horizontal overflow ${info.scrollWidth} > ${info.innerWidth}`
  );
  if (expectedDir === 'rtl') {
    assert.ok(info.lang.startsWith('ar'), `${label}: expected html[lang] starting with ar, got ${info.lang}`);
    assert.ok(
      info.letterSpacing === '0px' || info.letterSpacing === 'normal',
      `${label}: Arabic letterSpacing must be 0px or normal (got ${info.letterSpacing})`
    );
  }
}

async function verifyProfile(engine, size, profileName, baseUrl) {
  const browser = await launchMutedBrowser(engine);
  const context = await browser.newContext({
    viewport: size,
    reducedMotion: 'reduce',
    hasTouch: size.width < 450,
    isMobile: size.width < 450
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('https://fonts.gstatic.com/**', r => r.abort());

  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', err => pageErrors.push(String(err)));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Ignore benign 404/network from absent live local-pilot status on static test server and aborted external fonts
      if (!/status of 404|\/api\/tutor|fonts\.googleapis|ERR_FAILED/i.test(txt)) {
        consoleErrors.push(txt);
      }
    }
  });

  try {
    // 1. Course Home & Lesson 1 (#lesson-1) — EN -> FR -> AR -> EN state & audio isolation
    await page.goto(`${baseUrl}/course/`, { waitUntil: 'load' });
    await page.waitForSelector('.carana-lang-switch');
    await checkLayout(page, `${profileName}-course-home-en`, 'en', 'ltr');

    await switchLang(page, 'fr-FR');
    await checkLayout(page, `${profileName}-course-home-fr`, 'fr-FR', 'ltr');
    const frHomeHeading = await page.locator('h1').first().innerText();
    assert.match(frHomeHeading, /Capacités|UNPOL|Analyse|Programme|Former|Écosystème/i);

    await switchLang(page, 'ar');
    await checkLayout(page, `${profileName}-course-home-ar`, 'ar', 'rtl');
    const arHomeHeading = await page.locator('h1').first().innerText();
    assert.match(arHomeHeading, /[\u0600-\u06FF]/);
    await runAxeIfDesktopChromium(page, profileName, 'course-home-ar');
    if (profileName === 'chromium-desktop' || profileName === 'webkit-mobile') {
      await page.screenshot({ path: path.join(OUT_DIR, `${profileName}-course-home-ar.png`) });
    }

    await switchLang(page, 'en');
    await page.goto(`${baseUrl}/course/#lesson-1`, { waitUntil: 'load' });
    await page.waitForSelector('#exp-play, h1');
    // Advance to screen 2 & select/open Read Aloud bar
    const nextBtn = page.locator('button[data-nav="next"], .nav-btn-next, #nextBtn').first();
    if (await nextBtn.count()) await nextBtn.click();
    await switchLang(page, 'ar');
    await checkLayout(page, `${profileName}-lesson1-ar`, 'ar', 'rtl');
    // Ensure English neural studio voice never appears when AR is selected
    const listenBtnL1 = page.locator('#support-listen').first();
    if (await listenBtnL1.count()) {
      await listenBtnL1.click();
      const voiceTexts = await page.locator('#read-voice option').allInnerTexts();
      assert.ok(!voiceTexts.some(v => /Studio English|af_heart|Heart/i.test(v)), `English voice must not leak in AR: ${voiceTexts}`);
    }
    if (profileName === 'chromium-desktop') {
      await page.screenshot({ path: path.join(OUT_DIR, `${profileName}-lesson1-ar.png`) });
      await runAxeIfDesktopChromium(page, profileName, 'lesson1-ar');
    }

    // 2. Lessons 2-6 Platform — mid-lesson EN -> FR -> AR retaining screen & draft text
    await switchLang(page, 'en');
    await page.goto(`${baseUrl}/platform/?course=cbd&lesson=cbd-2`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.CARANA_PLATFORM?.ready);
    await page.waitForSelector('.carana-lang-switch');
    const draftBox = page.locator('.applied-lab textarea, .applied-lab input[type="text"]').first();
    if (await draftBox.count()) {
      await draftBox.fill('Learner draft EN — المختبر التحليلي');
    }
    await switchLang(page, 'fr-FR');
    await checkLayout(page, `${profileName}-platform-l2-fr`, 'fr-FR', 'ltr');
    const frTitleL2 = await page.locator('h1').first().innerText();
    assert.ok(frTitleL2.length > 3);
    if (await draftBox.count()) {
      assert.equal(await draftBox.inputValue(), 'Learner draft EN — المختبر التحليلي');
    }

    await switchLang(page, 'ar');
    await checkLayout(page, `${profileName}-platform-l2-ar`, 'ar', 'rtl');
    const arTitleL2 = await page.locator('h1').first().innerText();
    assert.match(arTitleL2, /[\u0600-\u06FF]/);
    if (await draftBox.count()) {
      assert.equal(await draftBox.inputValue(), 'Learner draft EN — المختبر التحليلي');
    }
    // Check companion dialog opens in RTL
    const askBtn = page.locator('#support-ask').first();
    if (await askBtn.count()) {
      await askBtn.click();
      await page.waitForSelector('dialog.carana-assistant[open]');
      const dlgDir = await page.locator('dialog.carana-assistant').getAttribute('dir');
      assert.equal(dlgDir, 'rtl');
      if (profileName === 'chromium-desktop') {
        await page.screenshot({ path: path.join(OUT_DIR, `${profileName}-companion-ar.png`) });
      }
      await page.locator('#assistant-close').click();
    }
    await runAxeIfDesktopChromium(page, profileName, 'platform-l2-ar');

    // 3. Workbenches Hub + Module 1 + Module 6 (in AR RTL & FR)
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'load' });
    await page.waitForSelector('.carana-lang-switch');
    await checkLayout(page, `${profileName}-wb-hub-ar`, 'ar', 'rtl');
    await runAxeIfDesktopChromium(page, profileName, 'wb-hub-ar', { exclude: ['.btn-primary'] });
    if (profileName === 'chromium-desktop') {
      await page.screenshot({ path: path.join(OUT_DIR, `${profileName}-wb-hub-ar.png`) });
    }

    await page.goto(`${baseUrl}/module1.html`, { waitUntil: 'load' });
    await page.waitForSelector('.carana-lang-switch');
    await checkLayout(page, `${profileName}-wb-mod1-ar`, 'ar', 'rtl');
    // Switch to FR then back to AR without losing mixed learner input
    const teamInput = page.locator('#teamName, #team-name').first();
    if (await teamInput.count()) {
      await teamInput.fill('Kalari Team — فريق كالاري');
      await switchLang(page, 'fr-FR');
      assert.equal(await teamInput.inputValue(), 'Kalari Team — فريق كالاري');
      await switchLang(page, 'ar');
      assert.equal(await teamInput.inputValue(), 'Kalari Team — فريق كالاري');
    }
    if (profileName === 'chromium-desktop' || profileName === 'webkit-mobile') {
      await page.screenshot({ path: path.join(OUT_DIR, `${profileName}-wb-mod1-ar.png`) });
    }
    await runAxeIfDesktopChromium(page, profileName, 'wb-mod1-ar', { exclude: ['.btn-primary', '.top-nav-left > a', '.track-num', '.badge'] });

    await page.goto(`${baseUrl}/module6.html`, { waitUntil: 'load' });
    await page.waitForSelector('.carana-lang-switch');
    await checkLayout(page, `${profileName}-wb-mod6-ar`, 'ar', 'rtl');

    // 4. Evidence-to-Decision Notebook
    await page.goto(`${baseUrl}/platform/notebook.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.CARANA_NOTEBOOK_PROTOTYPE?.ready);
    await checkLayout(page, `${profileName}-notebook-ar`, 'ar', 'rtl');
    const nbTitleInput = page.locator('#nb-thread-title');
    if (await nbTitleInput.count()) {
      await nbTitleInput.fill('Notebook Draft — مسودة الدليل');
      await switchLang(page, 'fr-FR');
      assert.equal(await nbTitleInput.inputValue(), 'Notebook Draft — مسودة الدليل');
      await switchLang(page, 'ar');
      assert.equal(await nbTitleInput.inputValue(), 'Notebook Draft — مسودة الدليل');
    }
    await runAxeIfDesktopChromium(page, profileName, 'notebook-ar');
    if (profileName === 'chromium-desktop') {
      await page.screenshot({ path: path.join(OUT_DIR, `${profileName}-notebook-ar.png`) });
    }

    // 5. Demo, Visual Gallery, Voice Audition & Comparison in AR & FR
    for (const relUrl of ['/platform/demo.html', '/platform/demo-showcase.html', '/course/visual-gallery.html', '/course/voice-audition.html', '/course/voice-comparison.html']) {
      await page.goto(`${baseUrl}${relUrl}`, { waitUntil: 'load' });
      await page.waitForSelector('.carana-lang-switch');
      await checkLayout(page, `${profileName}-${relUrl}-ar`, 'ar', 'rtl');
    }
    await switchLang(page, 'fr-FR');
    await checkLayout(page, `${profileName}-voice-comp-fr`, 'fr-FR', 'ltr');

    assert.deepEqual(pageErrors, [], `${profileName} page errors: ${pageErrors.join(' | ')}`);
    assert.deepEqual(consoleErrors, [], `${profileName} console errors: ${consoleErrors.join(' | ')}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  const ownsServer = !process.env.CBD_TEST_URL;
  const server = ownsServer ? await startStaticServer(ROOT) : { url: process.env.CBD_TEST_URL, close: async () => {} };
  const profiles = [
    { name: 'chromium-desktop', engine: chromium, size: { width: 1440, height: 900 } },
    { name: 'webkit-desktop', engine: webkit, size: { width: 1440, height: 900 } },
    { name: 'webkit-mobile', engine: webkit, size: { width: 390, height: 844 } }
  ];

  const report = { url: server.url, profiles: [], ok: true };
  try {
    for (const p of profiles) {
      const t0 = Date.now();
      await verifyProfile(p.engine, p.size, p.name, server.url);
      report.profiles.push({ profile: p.name, ok: true, elapsedMs: Date.now() - t0 });
      console.error(`✔ ${p.name} trilingual/RTL browser suite passed (${report.profiles.at(-1).elapsedMs}ms)`);
    }
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await server.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
