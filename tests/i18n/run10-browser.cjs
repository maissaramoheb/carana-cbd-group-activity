'use strict';
/* Run 10: The Living CBD Orbit — direct navigation, spatial depth states,
 * trilingual RTL/LTR, responsive 320px/390px/200%-zoom, reduced motion, and Axe WCAG checks.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium, webkit } = require(path.join(
  process.env.CBD_TEST_MODULES || '/Users/maissaraselim/.npm/_npx/e41f203b7505f1fb/node_modules',
  'playwright'
));
const { launchMutedBrowser } = require('../helpers/mute-browser.cjs');

const ROOT = path.resolve(__dirname, '../..');
const OUT = process.env.CBD_TEST_OUTPUT || '/tmp/carana-run10-browser';
fs.mkdirSync(OUT, { recursive: true });
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
    res.writeHead(200, { 'Content-Type': MIME[path.extname(resolved)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(resolved).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    resolve({ url: 'http://127.0.0.1:' + server.address().port, close: () => new Promise(r => server.close(r)) });
  }));
}

const english = [
  'Situational Analysis',
  'Objective Setting',
  'Planning Activities',
  'Implementation',
  'Evaluation & Adjustment',
  'Transition & Handover'
];

async function noErrorsOrPlay(page) {
  assert.equal(await page.locator('#carana-release-notice,.carana-release-notice').count(), 0);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'Horizontal overflow detected');
  assert.equal(await page.evaluate(() => window.__run10PlayCalls || 0), 0, 'Unrequested media playback');
}

async function auditAxe(page, label, rows) {
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async () => {
    const res = await window.axe.run({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
    return res.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }));
  });
  rows.push({ type: 'accessibility', label, violations });
  assert.deepEqual(violations, [], label + ' Axe WCAG violations');
}

async function checkCardGeometry(page, isMobile, label) {
  const issues = await page.evaluate(mobile => {
    const out = [];
    const links = Array.from(document.querySelectorAll('a.cycle-stage'));
    if (links.length !== 6) out.push('Expected 6 phase anchor links, got ' + links.length);
    for (const el of links) {
      const r = el.getBoundingClientRect();
      const minSize = mobile ? 44 : 24;
      if (r.width < minSize || r.height < minSize) out.push(`Target too small (${r.width}x${r.height}) on ${el.dataset.cyclePhase}`);
      if (r.left < -1 || r.right > window.innerWidth + 1) out.push(`Card out of viewport horizontally on ${el.dataset.cyclePhase}`);
      const arrow = el.querySelector('.cycle-stage-launch');
      const textEls = [el.querySelector('.cycle-stage-copy'), el.querySelector('.cycle-stage-copy strong'), el.querySelector('.cycle-stage-copy small')].filter(Boolean);
      if (arrow) {
        const ar = arrow.getBoundingClientRect();
        const isRtl = document.documentElement.dir === 'rtl';
        for (const t of textEls) {
          const cr = t.getBoundingClientRect();
          const overlap = isRtl ? (cr.left < ar.right - 1 && cr.top < ar.bottom) : (cr.right > ar.left + 1 && cr.top < ar.bottom);
          if (overlap) out.push(`${t.tagName} (${cr.left}..${cr.right}) overlaps launch arrow (${ar.left}..${ar.right}) on ${el.dataset.cyclePhase}`);
        }
      }
    }
    return out;
  }, isMobile);
  assert.deepEqual(issues, [], label + ': ' + issues.join('; '));
}

const rows = [];
const errors = [];

(async () => {
  const ownServer = process.env.CBD_TEST_URL ? null : await startServer();
  const base = process.env.CBD_TEST_URL || ownServer.url;

  try {
    const profiles = [
      [chromium, 'chromium-desktop', 1440, 'no-preference'],
      [webkit, 'webkit-desktop', 1440, 'no-preference'],
      [chromium, 'chromium-zoom200', 720, 'no-preference'],
      [chromium, 'chromium-tablet-reduced', 900, 'reduce'],
      [webkit, 'webkit-mobile', 390, 'reduce'],
      [webkit, 'webkit-narrow', 320, 'no-preference']
    ];

    for (const [engine, profile, width, motion] of profiles) {
      const browser = await launchMutedBrowser(engine);
      try {
        const isMobile = width < 500;
        const ctx = await browser.newContext({
          viewport: { width, height: 900 },
          isMobile,
          hasTouch: isMobile,
          reducedMotion: motion
        });
        if (process.env.VERCEL_OIDC_TOKEN && new URL(base).hostname.endsWith('.vercel.app')) {
          await ctx.route(new URL(base).origin + '/**', r => r.continue({
            headers: { ...r.request().headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN }
          }));
        }
        await ctx.addInitScript(() => {
          window.__run10PlayCalls = 0;
          const original = HTMLMediaElement.prototype.play;
          HTMLMediaElement.prototype.play = function (...args) {
            window.__run10PlayCalls++;
            return original.apply(this, args);
          };
          if (new URLSearchParams(location.search).has('run10-seed')) {
            localStorage.setItem('carana_cbd_course_v1', JSON.stringify({
              version: 1, completed: [0], visited: ['0:0'], lastSection: 1, lastScreen: 1, lastKind: 'screen', startedAt: '2026-11-22T09:00:00.000Z'
            }));
            localStorage.setItem('carana_learning_v1', JSON.stringify({
              version: 1,
              lessons: {
                'cbd-2': { contentVersion: 1, completed: [0], section: 1, screen: 0, view: 'screen', drafts: { '02-01': { synthetic: 'keep' } }, revisionAck: true }
              }
            }));
          }
        });

        const page = await ctx.newPage();
        page.setDefaultTimeout(25000);
        page.on('pageerror', e => errors.push({ profile, message: e.message }));
        await page.route('https://fonts.googleapis.com/**', r => r.abort());

        await page.goto(base + '/course/?lang=en&run10-seed=1#home');
        await page.waitForSelector('a.cycle-stage');

        for (const lang of ['en', 'fr-FR', 'ar']) {
          await page.goto(base + '/course/?lang=' + lang + '#home');
          await page.waitForSelector('a.cycle-stage');
          await page.waitForFunction(l => window.CARANA_I18N?.getLang() === l, lang);
          await noErrorsOrPlay(page);
          assert.equal(await page.getAttribute('html', 'dir'), lang === 'ar' ? 'rtl' : 'ltr');
          await checkCardGeometry(page, isMobile, `${profile} ${lang}`);

          const expected = lang === 'en' ? english : require('../../locales/' + lang + '/ui.json').course.phasesMeta.map(x => x.name);

          // Check semantic hrefs, hover/focus supporting panel, and reduced-motion behavior
          for (let i = 0; i < 6; i++) {
            const link = page.locator('a.cycle-stage[data-cycle-phase="' + i + '"]');
            const href = await link.getAttribute('href');
            assert(href && href.includes(i === 0 ? '#lesson-1' : ('lesson=cbd-' + (i + 1))), 'Unexpected href on phase ' + i + ': ' + href);
            if (i > 0 && lang !== 'en') assert(href.includes('lang=' + encodeURIComponent(lang)), 'Missing lang param in href: ' + href);

            const beforeTransform = await link.evaluate(el => getComputedStyle(el).transform);
            await link.focus();
            assert.equal(await page.locator('.cycle-orbit').getAttribute('data-active-phase'), String(i));
            assert.equal(await page.locator('a.cycle-stage[data-active="true"]').count(), 1);
            assert.equal(await page.locator('#cycle-caption-title').innerText(), expected[i]);
            const capHref = await page.locator('#cycle-caption-action').getAttribute('href');
            assert(capHref && capHref.includes(i === 0 ? '#lesson-1' : ('lesson=cbd-' + (i + 1))));

            const outline = await link.evaluate(el => parseFloat(getComputedStyle(el).outlineWidth) || 0);
            assert(outline >= 2, `Missing visible focus outline on ${profile} ${lang} phase ${i}`);

            if (motion === 'reduce') {
              assert.equal(await link.evaluate(el => getComputedStyle(el).transitionDuration), '0s');
              assert.equal(await link.evaluate(el => getComputedStyle(el).animationName), 'none');
              assert.equal(await link.evaluate(el => getComputedStyle(el).transform), beforeTransform, 'Reduced motion moved element');
            }
          }

          // Tabbing from Phase 6 card to #cycle-caption-action preserves Phase 6 preview
          await page.locator('a.cycle-stage[data-cycle-phase="5"]').focus();
          if (profile.startsWith('chromium')) {
            await page.keyboard.press('Tab');
          } else {
            await page.locator('#cycle-caption-action').focus();
          }
          assert.equal(await page.evaluate(() => document.activeElement?.id), 'cycle-caption-action');
          assert.equal(await page.locator('#cycle-caption-title').innerText(), expected[5]);

          if (profile === 'chromium-desktop' || (profile === 'webkit-mobile' && lang === 'ar')) {
            await auditAxe(page, `${profile} ${lang}`, rows);
          }

          // Verify desktop hover resets on mouseleave (when not focused)
          if (!isMobile) {
            await page.locator('h1').focus().catch(() => {});
            await page.evaluate(() => document.activeElement?.blur?.());
            await page.locator('a.cycle-stage[data-cycle-phase="1"]').hover();
            assert.equal(await page.locator('#cycle-caption-title').innerText(), expected[1]);
            assert.equal(await page.locator('.cycle-orbit').getAttribute('data-active-phase'), '1');
            await page.mouse.move(10, 10);
            await page.waitForFunction(() => document.querySelector('.cycle-orbit')?.getAttribute('data-active-phase') === '');
          }
        }

        // Direct navigation verification for ALL 6 stations on desktop & mobile (1-click / 1-tap!)
        if (profile === 'chromium-desktop' || profile === 'webkit-mobile') {
          const testLang = profile === 'webkit-mobile' ? 'ar' : 'fr-FR';
          await page.goto(base + '/course/?lang=' + testLang + '#home');
          await page.waitForSelector('a.cycle-stage');

          // Phase 01 direct navigation -> Lesson 1 + return home + progress preserved
          const p1 = page.locator('a.cycle-stage[data-cycle-phase="0"]');
          if (isMobile) await p1.tap(); else await p1.click();
          await page.waitForSelector('#learning-main h1');
          assert.equal(await page.evaluate(() => window.CARANA_I18N?.getLang()), testLang);
          assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('carana_cbd_course_v1')).completed), [0]);
          await noErrorsOrPlay(page);
          await page.locator('#back-home').click();
          await page.waitForSelector('a.cycle-stage');

          // Phases 02..06 direct navigation -> Platform lesson 2..6 + return home + progress preserved
          for (let i = 1; i < 6; i++) {
            const link = page.locator('a.cycle-stage[data-cycle-phase="' + i + '"]');
            if (isMobile) await link.tap(); else await link.click();
            await page.waitForURL(new RegExp('lesson=cbd-' + (i + 1)));
            await page.waitForFunction(() => window.CARANA_PLATFORM?.ready);
            assert.equal(await page.evaluate(() => window.CARANA_I18N?.getLang()), testLang);
            assert.equal(await page.getAttribute('html', 'dir'), testLang === 'ar' ? 'rtl' : 'ltr');
            assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('carana_learning_v1')).lessons['cbd-2']?.drafts?.['02-01']?.synthetic), 'keep');
            await noErrorsOrPlay(page);
            await page.locator('.rail-back').click();
            await page.waitForSelector('a.cycle-stage');
            assert.equal(await page.evaluate(() => window.CARANA_I18N?.getLang()), testLang);
          }

          // Switch language interactively via UI switcher and test direct nav preserves the switched language
          await page.locator('#home-lang-slot [data-lang-choice="en"]').click();
          await page.waitForFunction(() => window.CARANA_I18N?.getLang() === 'en');
          const p3 = page.locator('a.cycle-stage[data-cycle-phase="2"]');
          await p3.focus();
          await Promise.all([page.waitForURL(/lesson=cbd-3/), page.keyboard.press('Enter')]);
          await page.waitForFunction(() => window.CARANA_PLATFORM?.ready);
          assert.equal(await page.evaluate(() => window.CARANA_I18N?.getLang()), 'en');
          await page.locator('.rail-back').click();
          await page.waitForSelector('a.cycle-stage');
        }

        rows.push({ type: 'functional', profile, status: 'PASS' });
        console.log(profile + ' passed all Run 10 checks');
        await ctx.close();
      } finally {
        await browser.close();
      }
    }

    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUT, 'RESULTS.json'), JSON.stringify({ status: 'PASS', base, rows, errors }, null, 2));
    console.log('ALL RUN 10 CHECKS PASSED.');
  } finally {
    if (ownServer) await ownServer.close();
  }
})().catch(err => {
  fs.writeFileSync(path.join(OUT, 'FAILURE.json'), JSON.stringify({ message: err.message, stack: err.stack, rows, errors }, null, 2));
  console.error(err);
  process.exitCode = 1;
});
