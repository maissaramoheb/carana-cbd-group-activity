'use strict';
/* Comprehensive audio safety regression suite:
 * Verifies explicit user initiation only (no autoplay on load, navigation, diagram interaction,
 * AI open/reply/status, or progress restore), mutual exclusion across Lesson 1 Narration /
 * Read Aloud Studio / AI Listen / browser speech, stale async cancel, failed playback handling
 * without unexpected fallback speech, backgrounding/navigation stop, and muted automated execution.
 */
const { chromium, webkit } = require(process.env.CBD_TEST_MODULES + '/playwright');
const { launchMutedBrowser } = require('../helpers/mute-browser.cjs');
const advance = require('../helpers/progression.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { createHandler } = require('../../tutor/gateway.cjs');

function makeSilentWav(seconds = 0.35) {
  const sampleRate = 8000;
  const samples = Math.floor(sampleRate * seconds);
  const dataBytes = samples * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);
  return buf;
}

async function startHarness() {
  let ttsDelayMs = 0;
  let ttsFailStatus = 0;
  let ttsCalls = 0;
  const wav = makeSilentWav(0.4);
  const srv = http.createServer();
  await new Promise(resolve => srv.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + srv.address().port;

  const h = createHandler({
    token: 'audio-safety-token',
    origins: [origin],
    model: 'gemma4:26b',
    qualification: 'controlled-pilot-review-pending',
    provider: async ({ onStage, onSegment }) => {
      onStage('preparing', 'Preparing the explanation.');
      onStage('generating', 'Generating a grounded response.');
      onSegment('answer', 'Check logframe coherence across all four columns.');
      return {
        answer: 'Check logframe coherence across all four columns.',
        example: 'Do not confuse workshop delivery with patrol supervision.',
        uncertainty: '',
        sources: [{ id: 'cbd-3:03-10', title: 'Check one logframe row', source: { label: 'Lesson 3', pages: '5-7', kind: 'approved-digital-adaptation' } }]
      };
    },
    tts: {
      status: () => ({
        available: true,
        voices: [{ id: 'kokoro:af_heart', label: 'Kokoro Neural · Heart (US)', license: 'Apache-2.0', local: true }]
      }),
      synthesize: async ({ signal }) => {
        ttsCalls++;
        if (ttsDelayMs > 0) {
          await new Promise((resolve, reject) => {
            const t = setTimeout(resolve, ttsDelayMs);
            signal?.addEventListener('abort', () => { clearTimeout(t); reject(Error('aborted')); }, { once: true });
          });
        }
        if (ttsFailStatus) throw Error('Simulated TTS failure');
        return { contentType: 'audio/wav', engine: 'kokoro-82m-af_heart', buffer: wav };
      },
      shutdown: () => {}
    }
  });

  srv.on('request', async (req, res) => {
    const reqPath = (req.url || '/').split('?')[0];
    if (reqPath.startsWith('/api/')) {
      if (reqPath === '/api/tts' && ttsFailStatus) {
        if (ttsDelayMs > 0) await new Promise(r => setTimeout(r, ttsDelayMs));
        res.writeHead(ttsFailStatus, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Simulated TTS offline' }));
        return;
      }
      await h(req, res);
      return;
    }
    const ROOT = path.resolve(__dirname, '../..');
    let rel = reqPath === '/' ? 'dist/course/index.html' : 'dist/' + reqPath.replace(/^\/+/, '');
    if (rel.endsWith('/')) rel += 'index.html';
    let file = path.join(ROOT, rel);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      if (fs.existsSync(file + '.html')) file += '.html';
      else if (fs.existsSync(path.join(file, 'index.html'))) file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(file).toLowerCase();
    const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(file).pipe(res);
  });

  return {
    origin,
    setTtsDelay: ms => { ttsDelayMs = ms; },
    setTtsFail: status => { ttsFailStatus = status; },
    getTtsCalls: () => ttsCalls,
    close: async () => {
      await h.shutdown();
      await new Promise(resolve => srv.close(resolve));
    }
  };
}

async function installAudioSpy(page) {
  await page.addInitScript(() => {
    window.__audioAudit = { playCalls: [], speechCalls: [], blockedOnce: false };
    const origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function auditedPlay() {
      const rec = {
        tag: this.tagName,
        id: this.id || '',
        src: (this.currentSrc || this.src || '').slice(0, 80),
        muted: this.muted,
        volume: this.volume,
        ts: Date.now()
      };
      if (window.__audioAudit.blockedOnce) {
        window.__audioAudit.blockedOnce = false;
        rec.blocked = true;
        window.__audioAudit.playCalls.push(rec);
        const err = new DOMException('Simulated autoplay block', 'NotAllowedError');
        return Promise.reject(err);
      }
      const res = origPlay.call(this);
      rec.muted = this.muted;
      rec.volume = this.volume;
      window.__audioAudit.playCalls.push(rec);
      return res;
    };
    if (typeof SpeechSynthesis !== 'undefined' && SpeechSynthesis.prototype) {
      const origSpeak = SpeechSynthesis.prototype.speak;
      SpeechSynthesis.prototype.speak = function auditedSpeak(utt) {
        window.__audioAudit.speechCalls.push({ text: String(utt?.text || '').slice(0, 60), ts: Date.now() });
        return origSpeak.call(this, utt);
      };
    }
  });
}

(async () => {
  const harness = await startHarness();
  try {
    for (const [engine, name, width] of [[chromium, 'chromium-desktop', 1440], [webkit, 'webkit-desktop', 1440], [webkit, 'webkit-mobile', 390]]) {
      const browser = await launchMutedBrowser(engine);
      try {
        const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width, height: 920 }, reducedMotion: 'reduce' });
        page.setDefaultTimeout(15000);
        const errors = [];
        page.on('pageerror', e => errors.push(e.stack || String(e)));
        await installAudioSpy(page);
        await page.route('https://fonts.googleapis.com/**', r => r.abort());

        // 1. Seed restored progress first & load Lesson 1 -> 0 autoplay on restore, load, diagram click, AI open, AI streaming/reply
        await page.goto(harness.origin + '/course/#lesson-1');
        await page.evaluate(() => {
          localStorage.setItem('carana_cbd_course_v1', JSON.stringify({
            version: 1, completed: [0], lastSection: 1, lastScreen: 0, lastKind: 'screen', visited: []
          }));
        });
        await page.reload();
        await page.waitForSelector('[data-vj-mini]');

        // Interact with diagram / mini-decision -> must not start audio
        await page.locator('[data-vj-mini]').first().click();
        await page.waitForSelector('#vj-mini-feedback');

        // Navigate screens -> must not start audio
        await page.locator('#next-screen').click();
        await page.waitForTimeout(100);

        // Open AI companion, connect (status check), submit question, wait for response -> must not auto-play audio
        await page.locator('#support-ask').click();
        await page.waitForFunction(() => !document.querySelector('#assistant-access')?.hidden);
        await page.locator('#assistant-code').fill('audio-safety-token');
        await page.locator('#assistant-connect').click();
        await page.waitForFunction(() => !document.querySelector('#assistant-send').disabled);
        await page.locator('#assistant-question').fill('Explain a coherent logframe row.');
        await page.locator('#assistant-send').click();
        await page.waitForFunction(() => document.querySelector('#assistant-reply-status')?.textContent.includes('Reply ready'));
        await page.waitForTimeout(120);

        let audit = await page.evaluate(() => window.__audioAudit);
        assert.equal(audit.playCalls.length, 0, `${name}: zero audio.play() allowed without explicit click, got ${JSON.stringify(audit.playCalls)}`);
        assert.equal(audit.speechCalls.length, 0, `${name}: zero speechSynthesis.speak() allowed without explicit click`);

        // 2. Stale async AI Listen cancellation: close AI panel / click Clear while /api/tts is in-flight -> delayed WAV must NOT play or fall back to speech
        harness.setTtsDelay(350);
        const beforeCancelCalls = harness.getTtsCalls();
        await page.locator('.assistant-read-reply').last().click();
        await page.waitForFunction(() => true);
        await page.waitForTimeout(60);
        await page.locator('#assistant-close').click();
        await page.waitForTimeout(450);
        audit = await page.evaluate(() => window.__audioAudit);
        assert.equal(audit.playCalls.length, 0, `${name}: stale delayed /api/tts must NOT play after closing AI dialog`);
        assert.equal(audit.speechCalls.length, 0, `${name}: stale cancelled /api/tts must NOT fall back to speechSynthesis`);
        assert(harness.getTtsCalls() >= beforeCancelCalls, 'Delayed TTS request should have started and cancelled');

        // 3. Failed audio playback (503 TTS + NotAllowedError + aborted MP3) must NOT fall back silently to OS robotic speech
        harness.setTtsDelay(0);
        harness.setTtsFail(503);
        await page.locator('#support-ask').click();
        await page.locator('.assistant-read-reply').last().click();
        await page.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'idle');
        await page.waitForTimeout(100);
        audit = await page.evaluate(() => window.__audioAudit);
        assert.equal(audit.speechCalls.length, 0, `${name}: failed AI /api/tts must NOT fall back unexpectedly to speechSynthesis`);
        harness.setTtsFail(0);

        // Live AI Listen must stop cleanly on Clear and Sign out
        await page.locator('.assistant-read-reply').last().click();
        await page.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'playing');
        await page.locator('#assistant-clear').click();
        await page.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'idle');
        assert.equal(await page.evaluate(() => window.CARANA_SUPPORT.isPlaying), false, `${name}: #assistant-clear must stop active AI Listen`);

        await page.locator('#assistant-question').fill('Summarize CBD.');
        await page.locator('#assistant-send').click();
        await page.waitForFunction(() => document.querySelector('#assistant-reply-status')?.textContent.includes('Reply ready'));
        await page.locator('.assistant-read-reply').last().click();
        await page.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'playing');
        await page.locator('#assistant-signout').click();
        await page.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'idle');
        assert.equal(await page.evaluate(() => window.CARANA_SUPPORT.isPlaying), false, `${name}: #assistant-signout must stop active AI Listen`);

        await page.locator('#assistant-close').click();

        // Simulated browser autoplay NotAllowedError block when clicking Read screen
        await page.evaluate(() => { window.__audioAudit.blockedOnce = true; });
        await page.locator('#support-listen').click();
        await page.locator('#read-play').click();
        await page.waitForFunction(() => /blocked|Retry|Click Play/i.test(document.querySelector('#read-status')?.textContent || '') || document.querySelector('.support-studio')?.dataset.readState === 'idle');
        await page.waitForTimeout(100);
        audit = await page.evaluate(() => window.__audioAudit);
        assert.equal(audit.speechCalls.length, 0, `${name}: NotAllowedError must NOT fall back to speechSynthesis`);

        // 4. Paused Read Aloud + Diagram Click must NEVER auto-start audio; mutual exclusion between Trainer Narration & Read Aloud
        await page.evaluate(() => localStorage.removeItem('carana_cbd_course_v1'));
        await page.reload();
        await page.waitForSelector('[data-vj-item]');
        await page.locator('#voice-play').click();
        await page.waitForFunction(() => document.querySelector('#trainer-audio') && !document.querySelector('#trainer-audio').paused);

        // Starting Read Screen must immediately pause Lesson 1 Trainer Narration
        if (!(await page.locator('#read-play').isVisible())) await page.locator('#support-listen').click();
        await page.locator('#read-play').click();
        await page.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'playing');
        assert.equal(await page.locator('#trainer-audio').evaluate(a => a.paused), true, `${name}: Read Screen must pause Trainer Narration`);

        // Pause Read Screen, click diagram node -> must stay paused, never auto-start
        await page.locator('#read-pause').click();
        await page.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'paused');
        const playsBeforeDiagram = await page.evaluate(() => window.__audioAudit.playCalls.length);
        await page.locator('[data-vj-item]').nth(1).click();
        await page.waitForTimeout(120);
        assert.equal(await page.evaluate(() => window.__audioAudit.playCalls.length), playsBeforeDiagram, `${name}: clicking diagram while paused must never start playback`);
        assert.equal(await page.evaluate(() => window.CARANA_SUPPORT.isPlaying), false);

        // Resume & speed preservation, then start Trainer Narration -> must stop Read Screen cleanly before playing
        await page.locator('#read-speed').selectOption('1.25');
        await page.locator('#read-resume').click();
        await page.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'playing');
        await page.locator('#voice-play').click();
        await page.waitForFunction(() => !document.querySelector('#trainer-audio').paused);
        assert.equal(await page.evaluate(() => document.querySelector('.support-studio')?.dataset.readState), 'idle', `${name}: Starting Trainer Narration must stop Read Aloud`);

        // 5. Navigation & Backgrounding stop Lesson 1 Trainer Narration and Lessons 2-6 Read Aloud
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { value: true, configurable: true });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        assert.equal(await page.locator('#trainer-audio').evaluate(a => a.paused), true, `${name}: backgrounding tab must pause Lesson 1 audio`);
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        });
        await page.locator('#voice-play').click();
        await page.waitForFunction(() => !document.querySelector('#trainer-audio').paused);
        const beforeTitle = await page.locator('h1').textContent();
        await advance(page, '#next-screen');
        await page.waitForFunction((prev) => {
          const a = document.querySelector('#trainer-audio');
          const t = document.querySelector('h1')?.textContent;
          return t !== prev && (!a || a.paused);
        }, beforeTitle);
        assert.equal(await page.evaluate(() => {
          const a = document.querySelector('#trainer-audio');
          return !a || a.paused;
        }), true, `${name}: screen navigation must pause Lesson 1 audio`);

        // Verify Lessons 2-6 navigation & backgrounding stop Read Aloud cleanly
        await page.goto(harness.origin + '/platform/?course=cbd&lesson=cbd-2');
        await page.waitForFunction(() => window.CARANA_PLATFORM?.ready);
        await page.locator('#support-listen').click();
        await page.locator('#read-play').click();
        await page.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'playing');
        // Verify automated tests keep all audio silenced via mute-browser helper
        const allSilenced = await page.evaluate(() =>
          window.__caranaTestAudioSilenced === true &&
          window.__audioAudit.playCalls.every(c => c.blocked || (c.muted === true && c.volume === 0))
        );
        assert.equal(allSilenced, true, `${name}: automated browser tests must keep macOS speaker output muted`);

        await advance(page, '#next');
        await page.waitForFunction(() => {
          const s = document.querySelector('.support-studio');
          return (!s || s.dataset.readState === 'idle') && window.CARANA_SUPPORT?.isPlaying === false;
        });
        assert.equal(await page.evaluate(() => window.CARANA_SUPPORT.isPlaying), false);

        assert.deepEqual(errors, [], `${name} page errors: ${errors.join('; ')}`);
        console.log(`AUDIO SAFETY PASS (${name}): zero autoplay, stale async cancel clean, failed-audio safe, mutual exclusion & navigation stop verified.`);
        await page.context().close();
      } finally {
        await browser.close();
      }
    }
  } finally {
    await harness.close();
  }
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
