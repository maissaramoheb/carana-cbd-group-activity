/* Workstream A + B verification: Tests default CARANA Neural Studio playback + Browser fallback engine in Chromium and WebKit desktop/mobile. */
const { chromium, webkit } = require(process.env.CBD_TEST_MODULES + '/playwright');
const { launchMutedBrowser } = require('../helpers/mute-browser.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.CBD_TEST_URL || 'https://localhost:8766';
const out = process.env.CBD_TEST_OUTPUT || '/tmp/run06-read-aloud';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const rows = [];
  for (const [engine, name, width] of [[chromium, 'chromium-desktop', 1440], [webkit, 'webkit-desktop', 1440], [webkit, 'webkit-mobile', 390]]) {
    const b = await launchMutedBrowser(engine);
    try {
      const p = await b.newPage({ viewport: { width, height: 950 }, ignoreHTTPSErrors: true, reducedMotion: 'reduce' });
      p.setDefaultTimeout(15000);
      const errors = [];
      const studioMp3s = [];
      p.on('pageerror', e => errors.push(e.stack || String(e)));
      p.on('response', r => {
        if (r.url().includes('/course/audio/en/readaloud/clips/') && r.status() === 200) {
          studioMp3s.push(r.url());
        }
      });
      await p.route('https://fonts.googleapis.com/**', r => r.abort());
      await p.goto(base + '/course/#lesson-1');
      await p.locator('#support-listen').click();
      await p.waitForFunction(() => document.querySelector('#read-voice')?.options.length > 1);
      assert.equal(await p.locator('#read-voice').inputValue(), '0:studio', 'Natural Kokoro Neural Studio should be default voice');

      const untouched = await p.evaluate(() => ({
        course: localStorage.getItem('carana_cbd_course_v1'),
        exploration: localStorage.getItem('carana_exploration_v1')
      }));

      // 1. Default Neural Studio playback (HTML5 Audio + Kokoro MP3 clips)
      await p.locator('#read-settings').evaluate(e => { e.open = true; });
      const firstClipPromise = p.waitForResponse(r => r.url().includes('/course/audio/en/readaloud/clips/') && r.status() < 400);
      await p.locator('#read-play').click();
      const firstClip = await firstClipPromise;
      assert(firstClip.ok(), 'Neural Studio must fetch valid Kokoro MP3 clip');
      await p.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'playing' && document.querySelector('[data-read-current]') !== null);
      assert(studioMp3s.length > 0, 'Neural Studio must fetch real pre-rendered MP3 audio');
      await p.locator('#read-pause').click();
      await p.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'paused');
      await p.locator('#read-speed').selectOption('1.25');
      await p.locator('#read-resume').click();
      await p.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'playing');
      await p.locator('#read-stop').click();
      await p.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'idle');
      assert.equal(await p.locator('[data-read-current]').count(), 0);

      // 2. Trainer Narration mutual exclusion & Resume fallback selection
      await p.locator('#voice-play').click();
      await p.waitForFunction(() => document.querySelector('#trainer-audio') && document.querySelector('#trainer-audio').currentTime > 0);
      await p.locator('#read-play').click();
      await p.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'playing');
      assert.equal(await p.locator('#trainer-audio').evaluate(a => a.paused), true);
      await p.locator('#read-stop').click();

      // 3. Browser fallback engine check (robotic Eloquence exclusion + pause/resume + rate)
      const browserOption = await p.locator('#read-voice option').evaluateAll(opts => opts.find(o => o.value.startsWith('1:'))?.value);
      let nativeUtterances = [];
      if (browserOption) {
        await p.evaluate(() => {
          window.__nativeSpeech = [];
          const speak = speechSynthesis.speak.bind(speechSynthesis);
          speechSynthesis.speak = u => {
            const r = { text: u.text, rate: u.rate, voice: u.voice?.name, started: false };
            window.__nativeSpeech.push(r);
            u.addEventListener('start', () => { r.started = true; });
            speak(u);
          };
        });
        const optionLabels = await p.locator('#read-voice option').evaluateAll(opts => opts.map(o => o.textContent));
        assert(!optionLabels.some(t => /^(Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)\b/i.test(t)), 'Eloquence voices must be filtered');
        await p.locator('#read-voice').selectOption(browserOption);
        await p.locator('#read-speed').selectOption('1.75');
        await p.locator('#read-play').click();
        await p.waitForFunction(() => window.__nativeSpeech.some(r => r.started));
        assert.equal((await p.evaluate(() => window.__nativeSpeech.at(-1))).rate, 1.75);
        await p.locator('#read-stop').click();
        nativeUtterances = await p.evaluate(() => window.__nativeSpeech);
      }

      // 4. Scope check: hidden keys, navigation and drafts never enter ordinary screen reading.
      const extraction = await p.evaluate(() => {
        const root = document.querySelector('#learning-main'), privateBox = document.createElement('div');
        privateBox.innerHTML = '<p hidden>HIDDEN_ANSWER_SENTINEL</p><textarea>PRIVATE_DRAFT_SENTINEL</textarea><nav><p>MENU_SENTINEL</p></nav>';
        root.append(privateBox);
        return CARANA_SUPPORT.blocks(root).map(b => b.text).join('\n');
      });
      assert(!/HIDDEN_ANSWER_SENTINEL|PRIVATE_DRAFT_SENTINEL|MENU_SENTINEL/.test(extraction));
      assert.deepEqual(await p.evaluate(() => ({
        course: localStorage.getItem('carana_cbd_course_v1'),
        exploration: localStorage.getItem('carana_exploration_v1')
      })), untouched, 'Support controls must leave all stored progress untouched');

      await p.locator('#read-voice').selectOption('0:studio');
      await p.locator('#read-play').click();
      await p.waitForFunction(() => document.querySelector('[data-read-current]') !== null);
      await p.screenshot({ path: path.join(out, name + '-reading.png') });
      await p.locator('#next-screen').click();
      if (await p.locator('.exploration-anyway').isVisible()) await p.locator('.exploration-anyway').click();
      await p.waitForFunction(() => document.querySelector('.support-studio')?.dataset.readState === 'idle');
      assert.equal(await p.locator('[data-read-current]').count(), 0);

      const old = JSON.parse(untouched.course || '{"completed":[]}'), now = await p.evaluate(() => JSON.parse(localStorage.getItem('carana_cbd_course_v1')));
      assert.deepEqual(now.completed, old.completed);

      await p.locator('#support-ask').click();
      await p.locator('#assistant-question').waitFor();
      await p.screenshot({ path: path.join(out, name + '-assistant.png') });
      await p.keyboard.press('Escape');
      assert.equal(await p.evaluate(() => document.activeElement.id), 'support-ask');
      assert.deepEqual(errors, []);
      rows.push({ name, studioMp3s: studioMp3s.length, nativeUtterances, passed: true });
      await p.context().close();
    } finally {
      await b.close();
    }
  }
  fs.writeFileSync(path.join(out, 'native-playback.json'), JSON.stringify(rows, null, 2));
  console.log('Read Aloud Studio PASS: Kokoro-82M Neural default + browser fallback, pause/resume/stop, speed, highlighting, trainer exclusion, scope and navigation.');
})().catch(e => { console.error(e); process.exitCode = 1; });
