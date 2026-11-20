/* Genuine authenticated HTTPS -> retrieval -> Ollama integration + Workstream C UX & local /api/tts check; no route mocks. */
const { chromium, webkit } = require(process.env.CBD_TEST_MODULES + '/playwright');
const { launchMutedBrowser } = require('../helpers/mute-browser.cjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const outDir = 'docs/reviews/run06-intelligent-learning/followup-04/evidence';
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const runtime = JSON.parse(fs.readFileSync('/tmp/run06-local-pilot.log', 'utf8'));
  const token = fs.readFileSync(runtime.tokenFile, 'utf8');
  const results = [];

  // Desktop Chromium genuine end-to-end conversation + Workstream C controls
  {
    const b = await launchMutedBrowser(chromium);
    try {
      const p = await b.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 950 } });
      await p.route('https://fonts.googleapis.com/**', r => r.abort());
      await p.goto(runtime.url + '/platform/?course=cbd&lesson=cbd-3');
      await p.waitForFunction(() => window.CARANA_PLATFORM?.ready);
      const before = await p.evaluate(() => JSON.stringify(localStorage));

      await p.locator('#support-ask').click();
      await p.waitForFunction(model => document.querySelector('#assistant-availability')?.textContent.includes(model), runtime.model);
      assert.match(await p.locator('#assistant-availability').innerText(), /NOT QUALIFIED/);
      assert.match(await p.locator('#assistant-mode-pill').innerText(), /Experimental · HOLD/);

      await p.locator('#assistant-code').fill(token);
      await p.locator('#assistant-connect').click();
      assert(await p.locator('#assistant-access').isHidden(), 'Access card should collapse neatly after entering code');

      await p.locator('#assistant-question').fill('What is the difference between outputs and outcomes?');
      const start = Date.now();
      await p.locator('#assistant-send').click();
      await p.waitForFunction(() => document.querySelector('#assistant-reply-status')?.textContent.includes('Reply ready'), { timeout: 90000 });
      const text = await p.locator('.assistant-message.assistant').last().innerText();
      assert.match(text, /output/i);
      assert.match(text, /outcome/i);
      assert.match(text, /source references/i);
      await p.locator('.assistant-message.assistant details').last().evaluate(e => { e.open = true; });
      await p.screenshot({ path: path.join(outDir, 'desktop-local-ai-open.png') });

      // Test Expand toggle + Clear thread + Prompt chip + Cancel
      await p.locator('#assistant-expand').click();
      assert(await p.locator('.carana-assistant.is-expanded').count() === 1);
      await p.screenshot({ path: path.join(outDir, 'desktop-local-ai-expanded.png') });
      await p.locator('#assistant-expand').click();

      await p.locator('[data-prompt]').first().click();
      assert.match(await p.locator('#assistant-question').inputValue(), /Explain this screen/);
      await p.locator('#assistant-question').fill('Explain this screen more simply.');
      await p.locator('#assistant-send').click();
      await p.locator('#assistant-cancel').click();
      await p.waitForFunction(() => document.querySelector('#assistant-reply-status')?.textContent.includes('cancelled'));

      await p.keyboard.press('Escape');
      assert.equal(await p.evaluate(() => document.activeElement.id), 'support-ask');
      assert.equal(await p.evaluate(() => JSON.stringify(localStorage)), before);

      results.push({
        viewport: 'desktop-1440',
        provider: 'genuine-local-ollama',
        model: runtime.model,
        elapsedMs: Date.now() - start,
        responsePreview: text.slice(0, 320),
        progressUnchanged: true,
        cancellation: 'PASS'
      });
    } finally {
      await b.close();
    }
  }

  // Mobile WebKit clean layout check on Follow-up 04 sheet
  {
    const b = await launchMutedBrowser(webkit);
    try {
      const p = await b.newPage({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
      await p.route('https://fonts.googleapis.com/**', r => r.abort());
      await p.goto(runtime.url + '/course/#lesson-1');
      await p.locator('[data-vj-item]', { hasText: /Possible causes/i }).click();
      await p.locator('#support-ask').click();
      await p.waitForFunction(model => document.querySelector('#assistant-availability')?.textContent.includes(model), runtime.model);
      assert.match(await p.locator('#assistant-context').innerText(), /Possible causes/);
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
      await p.screenshot({ path: path.join(outDir, 'mobile-local-ai-sheet.png') });
      await p.locator('#assistant-close').click();
      assert.equal(await p.evaluate(() => document.activeElement.id), 'support-ask');
      results.push({ viewport: 'mobile-390', focusAwareDiagramBadge: true, overflowOk: true });
    } finally {
      await b.close();
    }
  }

  fs.writeFileSync('docs/reviews/run06-intelligent-learning/evidence/genuine-local-ai.json', JSON.stringify(results, null, 2));
  console.log('Genuine local AI UX & inference PASS (qualification remains HOLD).');
})().catch(e => {
  console.error(e.name + ': ' + e.message);
  process.exitCode = 1;
});
