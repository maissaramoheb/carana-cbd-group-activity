'use strict';
const { chromium, webkit } = require(process.env.CBD_TEST_MODULES + '/playwright');
const { launchMutedBrowser } = require('../helpers/mute-browser.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { createHandler } = require('../../tutor/gateway.cjs');

const out = process.env.CBD_TEST_OUTPUT || '/tmp/run07-browser';
fs.mkdirSync(out, { recursive: true });

async function startHarness() {
  const srv = http.createServer();
  await new Promise(resolve => srv.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + srv.address().port;
  const seenRequests = [];
  const h = createHandler({
    token: 'run07-ui-token',
    origins: [origin],
    model: 'gemma4:26b',
    qualification: 'run07-ui-test',
    tts: {
      status: () => ({
        available: true,
        voices: [{ id: 'kokoro:af_heart', label: 'Kokoro Neural · Heart (US)', license: 'Apache-2.0', local: true }]
      }),
      synthesize: async () => ({
        contentType: 'audio/wav',
        engine: 'kokoro-82m-af_heart',
        // Minimal valid 1-sample RIFF/PCM WAV header
        buffer: Buffer.from('524946462600000057415645666d742010000000010001002256000044ac00000200100064617461020000000000', 'hex')
      })
    },
    provider: async ({ question, passages, history, onStage, onSegment }) => {
      seenRequests.push({ question, historyLen: Array.isArray(history) ? history.length : 0, hasHistoryArg: Array.isArray(history) && history.length > 0 });
      onStage('preparing', 'Preparing the explanation.');
      await new Promise(r => setTimeout(r, 320));
      onStage('generating', 'Generating a grounded response.');
      await new Promise(r => setTimeout(r, 320));
      const answer =
        history && history.length
          ? '1. PESTEL-S scans seven operational dimensions.\n2. Pair each finding with verified field evidence.'
          : 'PESTEL-S helps UNPOL advisers scan Political, Economic, Social, Technological, Environmental, Legal, and Security dynamics together.';
      const sources = passages.slice(0, 1).map(p => ({ id: p.id, title: p.title, source: p.source }));
      onSegment({ segment: 'answer', answer, sourceIds: sources.map(s => s.id), sources });
      await new Promise(r => setTimeout(r, 420));
      return {
        answer,
        sourceIds: sources.map(s => s.id),
        sources,
        example: history && history.length ? '' : 'A station adviser cross-checks community safety data with fuel-shortage patterns before recommending joint patrols.',
        uncertainty: ''
      };
    }
  });
  srv.on('request', (req, res) => h(req, res));
  return {
    origin,
    seenRequests,
    close: async () => {
      await h.shutdown();
      await new Promise(resolve => srv.close(resolve));
    }
  };
}

(async () => {
  const harness = await startHarness();
  try {
    for (const [engine, name, width] of [[chromium, 'chromium-desktop', 1440], [webkit, 'webkit-mobile', 390]]) {
      const idxBefore = harness.seenRequests.length;
      const b = await launchMutedBrowser(engine);
      try {
        const p = await b.newPage({ ignoreHTTPSErrors: true, viewport: { width, height: 920 }, reducedMotion: 'reduce' });
        const errors = [];
        p.on('pageerror', e => errors.push(e.stack || String(e)));
        await p.route('https://fonts.googleapis.com/**', r => r.abort());
        await p.goto(harness.origin + '/platform/?course=cbd&lesson=cbd-1');
        await p.waitForFunction(() => window.CARANA_PLATFORM?.ready);

        await p.locator('#support-ask').click();
        await p.waitForFunction(() => document.querySelector('#assistant-availability')?.dataset.state !== 'offline' && !document.querySelector('#assistant-access')?.hidden);
        await p.locator('#assistant-code').fill('run07-ui-token');
        await p.locator('#assistant-connect').click();
        await p.waitForFunction(() => !document.querySelector('#assistant-send').disabled);

        // Turn 1: observe progressive stages + early verified answer segment BEFORE example finishes
        await p.evaluate(() => {
          const el = document.querySelector('#assistant-reply-status');
          window.__stageLog = [];
          new MutationObserver(() => window.__stageLog.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true });
        });
        await p.locator('#assistant-question').fill('Explain PESTEL-S concisely.');
        await p.locator('#assistant-send').click();

        await p.waitForFunction(() => document.querySelector('#assistant-reply-status')?.textContent.includes('Showing answer'));
        const earlyText = await p.locator('.assistant-response').last().innerText();
        assert.match(earlyText, /Political, Economic, Social/);
        assert(!earlyText.includes('station adviser'), 'Example should still be streaming after early answer appears');

        await p.waitForFunction(() => document.querySelector('#assistant-reply-status')?.textContent.includes('Reply ready'));
        const stageLog = await p.evaluate(() => window.__stageLog.join('\n'));
        assert(stageLog.includes('Preparing the explanation.') || stageLog.includes('Generating a grounded response.'), 'Expected live stage transitions, got: ' + stageLog);
        const finalText = await p.locator('.assistant-response').last().innerText();
        assert.match(finalText, /station adviser/);
        const occurrences = (finalText.match(/Political, Economic, Social/g) || []).length;
        assert.equal(occurrences, 1, 'Streamed answer must not duplicate after trailing content/done');
        assert.equal(await p.locator('.assistant-message.assistant').last().locator('.assistant-sources').count(), 1, 'Sources details must appear once');

        // Verify /api/tts Listen triggers 200 audio/wav cleanly
        const ttsPromise = p.waitForResponse(r => r.url().includes('/api/tts') && r.request().method() === 'POST');
        await p.locator('.assistant-read-reply').last().click();
        const ttsRes = await ttsPromise;
        assert.equal(ttsRes.status(), 200);
        assert.equal(ttsRes.headers()['content-type'], 'audio/wav');

        // Turn 2: follow-up sends bounded prior history to gateway
        await p.locator('#assistant-question').fill('In 2 concise bullet points, summarize that simply for an officer.');
        await p.locator('#assistant-send').click();
        await p.waitForFunction(() => document.querySelectorAll('.assistant-message.assistant').length >= 2 && document.querySelector('#assistant-reply-status')?.textContent.includes('Reply ready'));
        const turn2Text = await p.locator('.assistant-response').last().innerText();
        assert.match(turn2Text, /seven operational dimensions/);

        const noOverflow = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2);
        assert(noOverflow, 'Horizontal overflow detected with assistant open at width ' + width);
        await p.screenshot({ path: path.join(out, name + '-run07-streaming.png') });
        await p.keyboard.press('Escape');
        assert.equal(await p.evaluate(() => document.activeElement?.id), 'support-ask');

        const reqs = harness.seenRequests.slice(idxBefore);
        assert.equal(reqs.length, 2);
        assert.equal(reqs[0].hasHistoryArg, false, 'Turn 1 must omit empty history');
        assert.equal(reqs[1].hasHistoryArg, true, 'Turn 2 must forward prior conversation history');
        assert.equal(reqs[1].historyLen, 2);
        assert.deepEqual(errors, []);
        console.log(name, 'Run 07 UI PASS: stages, early verified answer segment, no duplication, Listen WAV, follow-up history.');
      } finally {
        await b.close();
      }
    }
  } finally {
    await harness.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
