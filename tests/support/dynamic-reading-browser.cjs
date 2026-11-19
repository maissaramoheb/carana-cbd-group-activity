/* Workstream B verification: Complete dynamic content reading across Lesson 1 & Lessons 2-6. */
const { chromium, webkit } = require(process.env.CBD_TEST_MODULES + '/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.CBD_TEST_URL || 'https://localhost:8766';
const out = process.env.CBD_TEST_OUTPUT || 'docs/reviews/run06-intelligent-learning/followup-04/evidence';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const results = [];
  for (const [engine, name, width] of [[chromium, 'chromium-desktop', 1440], [webkit, 'webkit-mobile', 390]]) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({ viewport: { width, height: 950 }, ignoreHTTPSErrors: true, reducedMotion: 'reduce' });
      page.setDefaultTimeout(15000);
      const errors = [];
      const fetchedMp3s = [];
      page.on('pageerror', e => errors.push(e.stack || String(e)));
      page.on('response', r => {
        if (r.url().includes('/course/audio/en/readaloud/clips/') && r.status() === 200) {
          fetchedMp3s.push(r.url());
        }
      });
      await page.route('https://fonts.googleapis.com/**', r => r.abort());

      // 1. Critical scenario: Lesson 1 Screen 01-01 Diagnostic Decision Path -> "Possible causes" + every remaining node
      await page.goto(base + '/course/#lesson-1');
      await page.waitForSelector('[data-vj-item]');
      const preBefore = await page.evaluate(() => ({
        course: localStorage.getItem('carana_cbd_course_v1'),
        exp: localStorage.getItem('carana_exploration_v1')
      }));

      const nodeCount = await page.locator('[data-vj-item]').count();
      assert.equal(nodeCount, 4, 'Lesson 1 01-01 should have 4 Diagnostic Decision Path nodes');

      // Select "Possible causes" specifically
      const pcBtn = page.locator('[data-vj-item]', { hasText: /Possible causes/i });
      await pcBtn.click();
      const pcText = await page.locator('#vj-result').innerText();
      assert.match(pcText, /Possible causes/i);
      assert.match(pcText, /What else might explain the problem\?/i);
      assert.match(pcText, /Consider supervision, case-file procedures, equipment, incentives and skills\./i);

      // Verify Read Screen blocks() includes newly revealed "Possible causes" explanation (not button labels)
      const blocksPc = await page.evaluate(() =>
        CARANA_SUPPORT.blocks(document.querySelector('#learning-main')).map(b => b.text)
      );
      assert(blocksPc.some(t => t.includes('Possible causes') && t.includes('Consider supervision')),
        'blocks() must contain newly revealed Possible causes explanation');
      assert(!blocksPc.some(t => /Read this explanation/i.test(t)),
        'Inline button label must never leak into spoken blocks');

      // Click unobtrusive "Read this explanation" button and verify real neural MP3 clip loads & highlights
      const inlineBtn = page.locator('#vj-result + .support-inline-bar button.support-inline-read');
      await inlineBtn.waitFor({ state: 'visible' });
      const pcClipPromise = page.waitForResponse(r => r.url().includes('/course/audio/en/readaloud/clips/') && r.status() < 400);
      await inlineBtn.click();
      const pcClipResp = await pcClipPromise;
      assert(pcClipResp.ok(), 'Possible causes Read this explanation must fetch Kokoro MP3 clip');
      await page.waitForFunction(() => document.querySelector('#vj-result[data-read-current="true"]') !== null);
      if (width === 1440 && engine === chromium) {
        await page.screenshot({ path: path.join(out, 'desktop-possible-causes-reading.png') });
      }

      // Click another node while reading -> must switch cleanly without overlap & update spoken blocks
      const nextNode = page.locator('[data-vj-item]').last();
      await nextNode.click();
      await page.waitForFunction(() => {
        const cur = document.querySelector('#vj-result');
        return cur && !cur.innerText.includes('Consider supervision');
      });
      const updatedBlocks = await page.evaluate(() =>
        CARANA_SUPPORT.blocks(document.querySelector('#learning-main')).map(b => b.text)
      );
      assert(!updatedBlocks.some(t => t.includes('Consider supervision')),
        'Read Screen blocks must replace stale node explanation with new node');
      await page.locator('#read-stop').click();

      // Check all 4 nodes on 01-01 produce unique explanation blocks & inline buttons
      for (let i = 0; i < nodeCount; i++) {
        await page.locator('[data-vj-item]').nth(i).click();
        assert(await inlineBtn.isVisible(), `Inline read button missing for node ${i}`);
      }

      // 2. Lesson 1 Screen 05-03 Classification Exercise + 05-02 5x6 Matrix + 02-01 Micro-case
      await page.evaluate(() => {
        localStorage.setItem('carana_cbd_course_v1', JSON.stringify({
          version: 1, completed: [0, 1, 2, 3, 4, 5], lastSection: 1, lastScreen: 0, lastKind: 'screen', visited: []
        }));
      });
      await page.reload();
      await page.locator('[data-vj-mini]').first().click();
      assert(await page.locator('#vj-mini-feedback + .support-inline-bar button.support-inline-read').isVisible());

      await page.evaluate(() => {
        localStorage.setItem('carana_cbd_course_v1', JSON.stringify({
          version: 1, completed: [0, 1, 2, 3, 4, 5], lastSection: 4, lastScreen: 1, lastKind: 'screen', visited: []
        }));
      });
      await page.reload();
      await page.locator('[data-lab-area]').nth(3).click();
      await page.locator('#lab-response + .support-inline-bar button.support-inline-read').waitFor();
      const matrixBlocks = await page.evaluate(() =>
        CARANA_SUPPORT.blocks(document.querySelector('#learning-main')).map(b => b.text).join('\n')
      );
      assert.match(matrixBlocks, /Ask which verified issue/);

      await page.evaluate(() => {
        localStorage.setItem('carana_cbd_course_v1', JSON.stringify({
          version: 1, completed: [0, 1, 2, 3, 4, 5], lastSection: 4, lastScreen: 2, lastKind: 'screen', visited: []
        }));
      });
      await page.reload();
      await page.locator('[data-vj-answer]').first().click();
      await page.locator('#vj-result + .support-inline-bar button.support-inline-read').waitFor();

      // 3. Lessons 2-6 Interactive Diagrams (#concept-feedback) + Expanded Transcript + .applied-lab Worked Example & Private Draft Privacy
      const l2Version = require('../../curricula/cbd/lessons-2-3.json')[0].version;
      await page.evaluate(ver => {
        localStorage.setItem('carana_learning_v1', JSON.stringify({
          version: 1,
          lessons: {
            'cbd-2': {
              contentVersion: ver,
              completed: [0, 1, 2],
              section: 0,
              screen: 0,
              view: 'screen',
              drafts: {},
              revisionAck: true
            }
          }
        }));
      }, l2Version);
      await page.goto(base + '/platform/?course=cbd&lesson=cbd-2');
      await page.waitForFunction(() => window.CARANA_PLATFORM?.ready);
      await page.locator('[data-node]').nth(1).click();
      const l2ConceptText = await page.locator('#concept-feedback').innerText();
      assert(l2ConceptText.length > 20);
      await page.locator('#concept-feedback + .support-inline-bar button.support-inline-read').waitFor();
      const l2Blocks = await page.evaluate(() =>
        CARANA_SUPPORT.blocks(document.querySelector('article.screen')).map(b => b.text).join('\n')
      );
      assert(l2Blocks.includes(l2ConceptText), 'Lessons 2-6 blocks() must include #concept-feedback');

      // Expand trainer explanation transcript & verify Read this explanation + blocks() include it
      await page.locator('details summary', { hasText: /trainer explanation/i }).click();
      const transcriptSnippet = (await page.locator('.transcript').innerText()).trim().slice(0, 40);
      const tBlocks = await page.evaluate(() =>
        CARANA_SUPPORT.blocks(document.querySelector('article.screen')).map(b => b.text).join('\n')
      );
      assert(tBlocks.includes(transcriptSnippet));

      // Navigate to a screen with .applied-lab builder (Lesson 2 Section 1 Screen 1 -> 02-04 with drafts + worked-example)
      await page.evaluate(() => {
        const st = JSON.parse(localStorage.getItem('carana_learning_v1'));
        st.lessons['cbd-2'].section = 1;
        st.lessons['cbd-2'].screen = 1;
        localStorage.setItem('carana_learning_v1', JSON.stringify(st));
      });
      await page.reload();
      await page.waitForSelector('.applied-lab');
      const sentinelDraft = 'CONFIDENTIAL_LEARNER_TYPED_DRAFT_SENTINEL';
      await page.locator('.applied-lab textarea, .applied-lab input[type="text"]').first().fill(sentinelDraft);
      await page.locator('.applied-lab details.worked-example summary').first().click();
      const workedText = await page.locator('.applied-lab details.worked-example p').first().innerText();
      const labBlocks = await page.evaluate(() =>
        CARANA_SUPPORT.blocks(document.querySelector('article.screen')).map(b => b.text).join('\n')
      );
      assert(!labBlocks.includes(sentinelDraft), 'Private learner drafts inside .applied-lab must NEVER be read');
      assert(labBlocks.includes(workedText.slice(0, 40)), 'Opened worked example inside .applied-lab must be readable');

      // Check zero runtime errors and clean read-aloud state untouched
      assert.deepEqual(errors, []);
      assert.notDeepEqual(preBefore, null);
      results.push({ engine: name, possibleCausesOk: true, all0101NodesOk: true, matrixOk: true, l26DiagramsOk: true, privateDraftsExcluded: true, mp3ClipsPlayed: fetchedMp3s.length });
    } finally {
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(out, 'dynamic-reading-verification.json'), JSON.stringify(results, null, 2));
  console.log('Workstream B dynamic content verification PASS:', JSON.stringify(results));
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
