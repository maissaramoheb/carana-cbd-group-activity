const advance=require('../../tests/helpers/progression.cjs');
const {launchMutedBrowser}=require('../../tests/helpers/mute-browser.cjs');
/* Run against the built site or preview with an existing Playwright + axe-core installation.
 * CBD_TEST_MODULES=/path/to/node_modules CBD_TEST_URL=http://127.0.0.1:8642 node course/tests/browser.cjs
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium, webkit, devices } = require(path.join(process.env.CBD_TEST_MODULES, 'playwright'));
const axe = require.resolve(path.join(process.env.CBD_TEST_MODULES, 'axe-core/axe.min.js'));
const url = process.env.CBD_TEST_URL;
const output = process.env.CBD_TEST_OUTPUT || '/tmp/cbd-browser';
fs.mkdirSync(output, {recursive:true});
const id=(s,n)=>`0${s+1}-0${n+1}`;
const options='[data-vj-item],[data-vj-answer],[data-lab-option],[data-lab-area]';
const progress='carana_cbd_course_v1';

async function setup(browser, settings) {
  const page=await (await browser.newContext(settings)).newPage();
  page.setDefaultTimeout(8000);
  await page.route('https://fonts.googleapis.com/**', r=>r.abort()); // exercise offline font fallback
  return page;
}
async function reflow(page) {
  assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 2),
    `Page exceeds viewport on ${page.url()}`);
}
async function screenshot(page, name) {
  await page.screenshot({path:path.join(output,name+'.png'), animations:'disabled'});
}
async function accessibility(page, name) {
  await page.addScriptTag({path:axe});
  const result=await page.evaluate(()=>axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));
  const summary=result.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}));
  fs.writeFileSync(path.join(output,name+'-axe.json'),JSON.stringify(summary,null,2));
  console.log(name,'axe violations:',summary.map(v=>v.id).join(', ')||'none');
}
async function journey(browser, settings, name) {
  const page=await setup(browser,settings);
  const errors=[];
  page.on('pageerror', e=>errors.push(String(e)));
  await page.goto(url+'/course/');
  await reflow(page);
  await screenshot(page,name+'-home');
  if(name==='chromium')await accessibility(page,'home');
  await page.locator('#start-course').focus();
  await page.keyboard.press('Enter');
  assert.match(await page.locator('h1').textContent(), /decision before/i);
  assert(await page.locator('nav[aria-label="Course sections"] button').last().isDisabled());
  const lesson=await page.evaluate(()=>window.CARANA_LESSON1.sections);
  let cinematic=0, practices=0;
  for (let s=0;s<6;s++) {
    for (let n=0;n<3;n++) {
      assert.equal(await page.locator('h1').textContent(), lesson[s].screens[n].title);
      await reflow(page);
      const visual=page.locator(options);
      assert(await visual.count() > 0, id(s,n)+' has no visual control');
      await visual.first().click();
      assert.equal(await visual.first().getAttribute('aria-pressed'),'true');
      const image=page.locator('img[src*="illustrations/lesson1"]');
      if (await image.count()) {
        cinematic++;
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(el=>el.decode());
        assert((await image.getAttribute('alt')).length>15);
        await screenshot(page,name+'-'+id(s,n));
      }
      if (await page.locator('[data-decision]').count()) {
        await page.locator('[data-decision]').first().click();
        assert(await page.locator('#decision-feedback').isVisible());
        practices++;
      }
      if (await page.locator('[data-lab-area]').count()) {
        assert.equal(await page.locator('[data-lab-area]').count(),30);
        if(name==='chromium')await accessibility(page,'matrix');
      }
      await page.locator('#voice-transcript-toggle').click();
      assert(await page.locator('#voice-transcript').isVisible());
      assert((await page.locator('#voice-transcript').innerText()).length>300);
      await page.locator('#voice-play').click();
      await page.waitForFunction(()=>document.querySelector('audio').currentTime>0.05);
      await page.locator('#voice-speed').click();
      assert.equal(await page.locator('audio').evaluate(a=>a.playbackRate),1.15);
      await page.locator('#voice-play').click();
      assert(await page.locator('audio').evaluate(a=>a.paused));
      if (s===0 && n===0) {
        await page.locator('#voice-replay').click();
        await page.waitForFunction(()=>!document.querySelector('audio').paused);
      }
      await advance(page,'#next-screen');
      assert(await page.locator('h1').evaluate(e=>e===document.activeElement));
    }
    if(name==='chromium' && s===0)await accessibility(page,'checkpoint');
    await page.locator('#check-quiz').click();
    assert.match(await page.locator('#quiz-feedback').innerText(),/answer all six/i);
    const select=(i,v)=>page.locator(`input[name="q${i}"][value="${v}"]`).check();
    if(s===0) {
      for (const [i,q] of lesson[s].quiz.entries()) await select(i,(q.answer+1)%q.options.length);
      await page.locator('#check-quiz').click();
      assert.match(await page.locator('#quiz-feedback').innerText(),/6 answer/);
      await page.locator('#return-review').click();
      await advance(page,'#next-screen');
      assert.equal(await page.locator('input:checked').count(),6);
    }
    for (const [i,q] of lesson[s].quiz.entries()) await select(i,q.answer);
    await page.locator('#check-quiz').click();
    await page.reload();
    assert.match(await page.locator('h1').textContent(),/Checkpoint passed/);
    await page.locator('#continue-after-quiz').click();
  }
  assert.equal(cinematic,3);
  assert.equal(practices,7);
  await page.locator('#verify-practice').click();
  assert.match(await page.locator('#activity-status').innerText(),/has not yet recorded/);
  // Use a second tab in the same context; course observes original storage.
  const tab=await page.context().newPage();
  const link=await page.locator('a[href="../module1.html"]').first().getAttribute('href');
  await tab.goto(new URL(link,page.url()).href);
  const stage=tab.locator('[data-stage]').last();
  await stage.click();
  await tab.locator('#confirmModule1').check();
  await page.locator('#verify-practice').click();
  assert.match(await page.locator('h1').textContent(),/complete/i);
  await page.reload();
  assert.match(await page.locator('h1').textContent(),/complete/i);
  await page.goto(url+'/course/#activities');
  assert.equal(await page.locator('a[href^="../module"]').count(),6);
  assert(await page.locator('a[href="../CARANA_CBD_Group_Activity.html"]').count());
  assert.deepEqual(errors,[]);
  await page.context().close();
  console.log(name,'passed full 18-screen journey, narration playback, 36 checkpoint items, same-origin workbench confirmation and resume');
}
async function gallery(browser, width) {
  const page=await setup(browser,{viewport:{width,height:900}});
  await page.goto(url+'/course/visual-gallery.html');
  for(let s=0;s<6;s++) for(let n=0;n<3;n++) {
    await page.locator(`[data-id="${id(s,n)}"]`).click();
    await reflow(page);
    const button=page.locator(options).last();
    await button.focus();
    await page.keyboard.press('Space');
    assert.equal(await button.getAttribute('aria-pressed'),'true');
  }
  await screenshot(page,'gallery-'+width);
  await page.context().close();
  console.log('Gallery all 18 visuals keyboard exercised at width',width);
}
async function failures(browser) {
  const page=await setup(browser,{viewport:{width:390,height:844}});
  await page.addInitScript(key=>{
    localStorage.setItem(key,JSON.stringify({version:1,completed:[4,4,5],lastSection:4,lastScreen:1.5,lessonComplete:true,activityOpened:true}));
    Storage.prototype.setItem=function(){throw new DOMException('Test failure','QuotaExceededError')};
  },progress);
  await page.route('**/course/audio/**/*.mp3',r=>r.abort());
  await page.goto(url+'/course/#lesson-1');
  assert.match(await page.locator('h1').textContent(), /decision before/i);
  await page.locator('#voice-play').click();
  await page.locator('#voice-error').waitFor({state:'visible'});
  assert.match(await page.locator('#voice-error').innerText(),/transcript/);
  await page.locator('#voice-transcript-toggle').click();
  assert(await page.locator('#voice-transcript').isVisible());
  await advance(page,'#next-screen');
  assert.match(await page.locator('#save-status').textContent(),/could not be saved/);
  await page.context().close();
  console.log('Failure cases passed: invalid saved progress, media unavailable, storage write denied');
}
(async()=>{
  const c=await launchMutedBrowser(chromium);
  try {
    await journey(c,{viewport:{width:1440,height:950}},'chromium');
    await gallery(c,320); await gallery(c,768); await failures(c);
  } finally {await c.close();}
  const w=await launchMutedBrowser(webkit);
  try {
    await journey(w,{viewport:{width:1440,height:950}},'webkit-desktop');
    await journey(w,devices['iPhone 13'],'webkit-mobile');
  } finally {await w.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
