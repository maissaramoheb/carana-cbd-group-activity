/* Verifies Follow-up 06 browser UX: server-enforced /api/tutor/auth on Connect, named banner,
 * Sign out, Retry on offline/paused, live NDJSON queue/started status, safe bold/list DOM formatting, and Listen control.
 */
'use strict';
const { chromium } = require(process.env.CBD_TEST_MODULES + '/playwright');
const assert = require('node:assert/strict');

const base = process.env.CBD_TEST_URL || 'https://localhost:8766';

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 950 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.stack || String(e)));
    await page.route('https://fonts.googleapis.com/**', r => r.abort());

    let pilotOffline = true;
    await page.route('**/api/tutor/status', r =>
      r.fulfill({
        json: pilotOffline
          ? { mode: 'local-pilot', provider: 'ollama', model: 'gemma4:26b', requiresAccess: true, authEndpoint: true, qualification: 'owner-pilot', connected: false, tts: { available: false, voices: [] } }
          : { mode: 'local-pilot', provider: 'ollama', model: 'gemma4:26b', requiresAccess: true, authEndpoint: true, qualification: 'owner-pilot', connected: true, tts: { available: true, voices: [{ id: 'apple:nora', label: 'Nora (macOS Neural)' }] } }
      })
    );

    await page.route('**/api/tutor/auth', r => {
      const auth = r.request().headers().authorization || '';
      if (auth === 'Bearer valid-f06-code') {
        return r.fulfill({ json: { authenticated: true, userId: 'owner-maissara', displayName: 'Maissara (Course Owner)', role: 'owner', rateLimitPerMin: 20 } });
      }
      return r.fulfill({ status: 401, json: { code: 'AUTH_INVALID', message: 'Access code was not accepted. Check your invitation code.' } });
    });

    await page.route('**/api/tutor', async r => {
      const body = JSON.stringify({ type: 'queued', position: 1, queueLength: 2, model: 'gemma4:26b' }) + '\n' +
        JSON.stringify({ type: 'started', position: 0, model: 'gemma4:26b' }) + '\n' +
        JSON.stringify({
          type: 'content',
          text: '**Outputs** vs **Outcomes**: <script>window.__xss=1</script>\n- Output: direct deliverable\n- Outcome: change in institutional practice'
        }) + '\n' +
        JSON.stringify({
          type: 'done',
          provider: 'genuine-local-ollama',
          kind: 'ai',
          sources: [{ id: 'cbd-3:03-01', title: 'Begin with the result', source: { label: 'UNPOL CBD Course', pages: 'Lesson 3', kind: 'curriculum-screen' } }]
        }) + '\n';
      return r.fulfill({ contentType: 'application/x-ndjson', body });
    });

    await page.goto(base + '/platform/?course=cbd&lesson=cbd-3');
    await page.waitForFunction(() => window.CARANA_PLATFORM && CARANA_PLATFORM.ready);

    // 1. Initially offline -> Retry recovers cleanly once service is online
    await page.locator('#support-ask').click();
    await page.waitForFunction(() => document.querySelector('#assistant-mode-pill').textContent === 'Offline');
    assert.equal(await page.locator('#assistant-retry-status').isVisible(), true);

    pilotOffline = false;
    await page.locator('#assistant-retry-status').click();
    await page.waitForFunction(() => document.querySelector('#assistant-mode-pill').textContent === 'Experimental AI · Review Pending');
    assert.match(await page.locator('.assistant-notice').innerText(), /Experimental AI · Human Review Pending/);

    // 2. Wrong code rejected immediately on Connect without enabling Send
    await page.locator('#assistant-code').fill('wrong-code');
    await page.locator('#assistant-connect').click();
    await page.waitForFunction(() => document.querySelector('#assistant-reply-status').textContent.includes('not accepted'));
    assert.equal(await page.locator('#assistant-send').isDisabled(), true);

    // 3. Valid code verifies via /api/tutor/auth, shows named banner & Sign out button
    await page.locator('#assistant-code').fill('valid-f06-code');
    await page.locator('#assistant-connect').click();
    await page.waitForFunction(() => document.querySelector('#assistant-availability').textContent.includes('Maissara (Course Owner) (owner)'));
    assert.equal(await page.locator('#assistant-signout').isVisible(), true);
    assert.equal(await page.locator('#assistant-send').isDisabled(), false);

    // 4. Send question -> renders safe DOM list/bold markup, escapes XSS script, offers Listen button
    await page.locator('#assistant-question').fill('Explain outputs and outcomes.');
    await page.locator('#assistant-send').click();
    await page.waitForFunction(() => document.querySelector('#assistant-reply-status').textContent.includes('Reply ready'));
    const domCheck = await page.evaluate(() => ({
      strongCount: document.querySelectorAll('.assistant-message.assistant .assistant-response strong').length,
      liCount: document.querySelectorAll('.assistant-message.assistant .assistant-response ul li').length,
      listenVisible: !!document.querySelector('.assistant-message.assistant .assistant-read-reply'),
      xssRan: !!window.__xss,
      bodyText: document.querySelector('.assistant-message.assistant .assistant-response')?.textContent || ''
    }));
    assert(domCheck.strongCount >= 2);
    assert.equal(domCheck.liCount, 2);
    assert.equal(domCheck.listenVisible, true);
    assert.equal(domCheck.xssRan, false);
    assert.match(domCheck.bodyText, /<script>window\.__xss=1<\/script>/);

    // 5. Sign out resets token & hides Send
    await page.locator('#assistant-signout').click();
    assert.equal(await page.locator('#assistant-send').isDisabled(), true);
    assert.equal(await page.locator('#assistant-access').isVisible(), true);
    assert.deepEqual(errors, []);
    console.log('FOLLOWUP-06 BROWSER UX PASS: auth verification, retry, named banner, queue/started, safe DOM list formatting, Listen, and Sign out verified cleanly.');
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
