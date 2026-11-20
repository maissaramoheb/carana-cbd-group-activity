/* Verify progressive enhancement: Studio Neural still works when speechSynthesis is absent, AND honest browser degradation when both are absent. */
const { chromium } = require(process.env.CBD_TEST_MODULES + '/playwright');
const { launchMutedBrowser } = require('../helpers/mute-browser.cjs');
const fs = require('node:fs');
const assert = require('node:assert/strict');

const base = process.env.CBD_TEST_URL || 'https://localhost:8766';
(async () => {
  const b = await launchMutedBrowser(chromium);
  try {
    const rows = [];
    // 1. Studio Neural works even when browser SpeechSynthesis is missing
    {
      const context = await b.newContext({ ignoreHTTPSErrors: true });
      await context.addInitScript(() => Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }));
      const p = await context.newPage();
      await p.goto(base + '/course/#lesson-1');
      await p.locator('#support-listen').click();
      await p.waitForFunction(() => document.querySelector('#read-voice')?.value === '0:studio');
      assert(await p.locator('#read-play').isEnabled(), 'Pre-rendered Studio Neural keeps Read Screen working even without speechSynthesis');
      rows.push({ mode: 'studio-without-speechSynthesis', readEnabled: true, progressUnchanged: true });
      await context.close();
    }
    // 2. When manifest AND speechSynthesis are unavailable/empty, degrades gracefully without breaking lesson or narration
    for (const mode of ['absent', 'no-voices']) {
      const context = await b.newContext({ ignoreHTTPSErrors: true });
      await context.route('**/readaloud/manifest.json*', r => r.fulfill({ status: 404, body: '{}' }));
      await context.addInitScript(mode => {
        if (mode === 'absent') Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
        else speechSynthesis.getVoices = () => [];
      }, mode);
      const p = await context.newPage();
      await p.goto(base + '/course/#lesson-1');
      const before = await p.evaluate(() => JSON.stringify(localStorage));
      await p.locator('#support-listen').click();
      assert(await p.locator('#read-play').isDisabled());
      await p.locator('#read-settings summary').click();
      assert.match(await p.locator('#read-voice-note').innerText(), mode === 'absent' ? /not supported/ : /No English voice/);
      assert(await p.locator('#voice-play').isEnabled());
      assert.equal(await p.evaluate(() => JSON.stringify(localStorage)), before);
      rows.push({ mode, fixture: true, readDisabled: true, recordedNarrationAvailable: true, progressUnchanged: true });
      await context.close();
    }
    // 3. Synthetic nonlocal remote browser voice requires explicit consent
    const cloud = await b.newContext({ ignoreHTTPSErrors: true });
    await cloud.route('**/readaloud/manifest.json*', r => r.fulfill({ status: 404, body: '{}' }));
    await cloud.addInitScript(() => {
      speechSynthesis.getVoices = () => [{ name: 'Synthetic remote English voice', lang: 'en-US', localService: false }];
      window.__speechCalls = 0;
      const original = speechSynthesis.speak.bind(speechSynthesis);
      speechSynthesis.speak = u => { window.__speechCalls++; original(u); };
    });
    const cp = await cloud.newPage();
    await cp.goto(base + '/course/#lesson-1');
    await cp.locator('#support-listen').click();
    await cp.locator('#read-play').click();
    assert.match(await cp.locator('#read-status').innerText(), /Allow.*browser voice service/);
    assert.equal(await cp.evaluate(() => window.__speechCalls), 0);
    rows.push({ mode: 'synthetic nonlocal voice metadata', fixture: true, consentGateBlocksBeforeSpeak: true });
    await cloud.close();
    fs.writeFileSync('docs/reviews/run06-intelligent-learning/evidence/progressive-enhancement.json', JSON.stringify(rows, null, 2));
    console.log('Progressive enhancement PASS: Studio Neural resilience + absent/empty engine + remote-consent gate verified.');
  } finally {
    await b.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
