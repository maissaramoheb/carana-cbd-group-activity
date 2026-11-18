const advance=require('../helpers/progression.cjs');
const {chromium,webkit}=require(process.env.CBD_TEST_MODULES+'/playwright');
const axePath=require.resolve(process.env.CBD_TEST_MODULES+'/axe-core/axe.min.js');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.CBD_TEST_URL||'http://127.0.0.1:8650';
const output=process.env.CBD_TEST_OUTPUT||'/tmp/carana-run01-browser';
fs.mkdirSync(output,{recursive:true});
const data=['lessons-2-3','lessons-4-6'].flatMap(x=>require('../../curricula/cbd/'+x+'.json')).filter(l=>!process.env.CBD_LESSON_FILTER||l.id===process.env.CBD_LESSON_FILTER);
async function pageFor(browser,size){
 const context=await browser.newContext({viewport:size,reducedMotion:'reduce',hasTouch:size.width<450,isMobile:size.width<450});
 const page=await context.newPage();page.setDefaultTimeout(7000);
 return page;
}
async function ready(page){await page.waitForFunction(()=>window.CARANA_PLATFORM?.ready);}
async function exercise(page,screen,name){
 const x=screen.lab;
 if(x.type==='builder'){
  await page.locator('#lab-check').click();assert.match(await page.locator('#lab-feedback').innerText(),/fields still open/);
  assert(await page.locator('#lab-check-item-0').isVisible(),'Field-specific self-check criterion must be visible');
  for(let i=0;i<x.fields.length;i++)await page.locator('[data-field]').nth(i).fill('Invented draft '+i+': evidence, responsibility and uncertainty for review.');
  assert.match(await page.locator('#lab-count-0').innerText(),/\/ 1200 characters/);
  await page.locator('#lab-check').click();assert.match(await page.locator('#lab-feedback').innerText(),/not automatically approved/);
  await page.reload();await ready(page);assert.match(await page.locator('[data-field]').first().inputValue(),/Invented draft/);
 }
 if(x.type==='classify'){
  await page.locator('#lab-check').click();assert.match(await page.locator('#lab-feedback').innerText(),/need a choice/);
  for(let i=0;i<x.items.length;i++)await page.locator('[data-class]').nth(i).selectOption(String((x.items[i].answer+1)%x.categories.length));
  await page.locator('#lab-check').click();assert.match(await page.locator('#lab-feedback').innerText(),/0 of/);
  for(let i=0;i<x.items.length;i++)await page.locator('[data-class]').nth(i).selectOption(String(x.items[i].answer));
  await page.locator('#lab-check').click();assert.match(await page.locator('#lab-feedback').innerText(),new RegExp(x.items.length+' of '+x.items.length));
 }
 if(x.type==='priority'){
  const first=page.locator('[data-weight]').first();await first.focus();await page.keyboard.press('End');
  assert.equal(await first.inputValue(),'5');assert.match(await page.locator('#priority-result').innerText(),/weighted points/);
  await page.reload();await ready(page);assert.equal(await page.locator('[data-weight]').first().inputValue(),'5');
 }
 if(x.type==='risk'){
  await page.locator('#risk-likelihood').selectOption('1');await page.locator('#risk-impact').selectOption('3');
  assert.match(await page.locator('#risk-result').innerText(),/severe consequence/);
  assert.equal(await page.locator('[data-risk="1-3"]').getAttribute('aria-current'),'true');
 }
 await page.locator('.applied-lab').screenshot({path:path.join(output,name+'-tool-'+screen.id+'.png')});
 if(name==='chromium'){
  await page.addScriptTag({path:require.resolve(process.env.CBD_TEST_MODULES+'/axe-core/axe.min.js')});
  const v=await page.evaluate(async()=> (await axe.run('.applied-lab',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(x=>({id:x.id,targets:x.nodes.map(n=>n.target)})));
  fs.writeFileSync(path.join(output,screen.id+'-tool-axe.json'),JSON.stringify(v,null,2));assert.deepEqual(v,[]);
 }
}
async function flow(browser,size,name){
 const page=await pageFor(browser,size);let errors=[];page.on('pageerror',e=>errors.push(String(e)));
 for(const lesson of data){
  await page.goto(base+'/platform/?course=cbd&lesson='+lesson.id);await ready(page);
  assert.equal(await page.locator('.rail button[data-section]:disabled').count(),lesson.sections.length-1);
  for(const [s,section] of lesson.sections.entries()){
   for(const [i,screen] of section.screens.entries()){
    assert.equal(await page.locator('h1').innerText(),screen.title);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
    assert.equal(await page.locator('[data-node]').count(),screen.visual.nodes.length);
    for(let n=0;n<screen.visual.nodes.length;n++){
     await page.locator('[data-node]').nth(n).focus();await page.keyboard.press('Enter');
     assert.equal(await page.locator('#concept-feedback').innerText(),screen.visual.nodes[n].detail);
    }
    await page.locator('[data-choice]').nth((screen.decision.answer+1)%3).click();
    assert(await page.locator('#decision-feedback').isVisible());
    if(name==='webkit-mobile')await page.locator('[data-choice]').nth(screen.decision.answer).tap();
    else await page.locator('[data-choice]').nth(screen.decision.answer).click();
    assert.match(await page.locator('#decision-feedback').innerText(),/defensible/);
    const transcript=page.locator('details:has(.transcript)');
    await transcript.locator('summary').click();assert((await transcript.locator('.transcript').innerText()).length>300);
    if(screen.lab)await exercise(page,screen,name);
    if(i===0&&s===0){
     await page.screenshot({path:path.join(output,name+'-'+lesson.id+'.png'),fullPage:true});
     if(name==='chromium'){
      await page.addScriptTag({path:require.resolve(process.env.CBD_TEST_MODULES+'/axe-core/axe.min.js')});
      const violations=await page.evaluate(async()=> (await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(x=>({id:x.id,impact:x.impact,nodes:x.nodes.map(n=>n.target)})));
      fs.writeFileSync(path.join(output,lesson.id+'-axe.json'),JSON.stringify(violations,null,2));assert.equal(violations.length,0,JSON.stringify(violations));
     }
    }
    await advance(page,'#next');
    assert(await page.locator('h1').evaluate(e=>document.activeElement===e));
   }
   await page.locator('#check').click();assert.match(await page.locator('#quiz-status').innerText(),/Answer every/);
   for(let i=0;i<section.quiz.length;i++)await page.locator('input[name="q'+i+'"][value="'+((section.quiz[i].answer+1)%3)+'"]').check();
   await page.locator('#check').click();assert.equal(await page.locator('.quiz-hint').count(),section.quiz.length);
   await page.locator('#review').click();await advance(page,'#next');
   assert.equal(await page.locator('input:checked').count(),section.quiz.length);
   for(let i=0;i<section.quiz.length;i++)await page.locator('input[name="q'+i+'"][value="'+section.quiz[i].answer+'"]').check();
   await page.locator('#check').click();
   if(s<sectionCount(lesson)-1)await page.locator('#continue').click();
   else{
    const a=page.getByRole('link',{name:'Open original Lesson '+lesson.number+' activity'});
    assert.equal(await a.getAttribute('href'),lesson.activity);
    const res=await page.request.get(new URL(lesson.activity,page.url()).href);assert.equal(res.status(),200);
   }
  }
  await page.reload();await ready(page);
  assert.match(await page.locator('h1').innerText(),/Carry your work/);
  assert.match(await page.locator('.rail .status').first().innerText(),new RegExp(lesson.sections.length+' / '+lesson.sections.length));
 }
 await page.goto(base+'/platform/?course=cbd');await ready(page);
 assert.equal(await page.locator('.curriculum-phase-card').count(),6);
 assert(page.url().includes('/course/'),'CBD catalog bookmark must resolve to approved home');
 await page.goto(base+'/platform/?course=mma');await ready(page);assert.equal(await page.locator('.lesson-row').count(),0);assert.match(await page.locator('main').innerText(),/no digital course available/i);
 assert.deepEqual(errors,[]);
 await page.context().close();console.log(name,'selected lessons passed: content, applied tools, decisions, checkpoints, resume and practical links');
}
const sectionCount=l=>l.sections.length;
async function edgeCases(browser){
 let page=await pageFor(browser,{width:320,height:800});
 await page.addInitScript(()=>{localStorage.setItem('carana_learning_v1',JSON.stringify({version:1,lessons:{'cbd-2':{contentVersion:'2026.11-run02',completed:[2,2],section:Infinity,screen:4.5}}}));Storage.prototype.setItem=()=>{throw Error('Write denied')};});
 await page.goto(base+'/platform/?course=cbd&lesson=cbd-2');await ready(page);assert.equal(await page.locator('h1').innerText(),data[0].sections[0].screens[0].title);
 await advance(page,'#next');assert.match(await page.locator('#save-status').innerText(),/Could not save/);
 await page.context().close();
 page=await pageFor(browser,{width:768,height:1024});
 await page.addInitScript(()=>localStorage.setItem('carana_learning_v1',JSON.stringify({version:1,lessons:{'cbd-2':{contentVersion:'2026.11-run01',completed:[0,1,2],section:2,screen:1,drafts:{'02-04':{0:'Archived prior SMART objective'}}}}})));
 await page.goto(base+'/platform/?course=cbd&lesson=cbd-2');await ready(page);
 assert.match(await page.locator('.version-note').innerText(),/Earlier checkpoint records/);
 assert.match(await page.locator('.rail .status').first().innerText(),/0 \/ 3/);
 await page.locator('#ack-revision').click();assert.equal(await page.locator('.version-note').count(),0);
 await advance(page,'#next');
 const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('carana_learning_v1')).lessons['cbd-2'].previousProgress);
 assert.deepEqual(history[0].completed,[0,1,2]);assert.equal(history[0].contentVersion,'2026.11-run01');
 assert.equal(history[0].drafts['02-04'][0],'Archived prior SMART objective');
 // Navigate to 02-04 via completed=0? Jump using section 1 unlocked state after passing or verify export & restore first:
 const railToggle=page.locator('#rail-toggle');
 if(await railToggle.isVisible()&&await railToggle.getAttribute('aria-expanded')==='false')await railToggle.click();
 const download=page.waitForEvent('download');await page.locator('#export-progress').click();const file=await download;
 const exportedPath=await file.path();
 const exportedText=fs.readFileSync(exportedPath,'utf8');
 const exported=JSON.parse(exportedText);
 const savedExportCopy=path.join(output,'test-stage1-export.json');
 fs.writeFileSync(savedExportCopy,exportedText);
 assert.deepEqual(exported.progress.lessons['cbd-2'].previousProgress[0].completed,[0,1,2]);
 assert.equal(exported.progress.lessons['cbd-2'].previousProgress[0].drafts['02-04'][0],'Archived prior SMART objective');
 // Test E03 dry-run restore on clean browser context + invalid file rejection
 await page.context().close();
 page=await pageFor(browser,{width:768,height:1024});
 await page.goto(base+'/platform/?course=cbd');await ready(page);
 await page.locator('#import-file').setInputFiles(savedExportCopy);
 assert(await page.locator('#restore-preview').isVisible());
 assert.match(await page.locator('#restore-preview').innerText(),/Dry-run restore preview/);
 await page.locator('#restore-merge').click();
 assert.match(await page.locator('#backup-status').innerText(),/Progress restored/);
 assert.match(await page.locator('.curriculum-phase-card').nth(1).innerText(),/Resume lesson/);
 // Test E02 read-only archived draft copy-forward inside 02-04 (complete section 0 honestly first)
 await page.goto(base+'/platform/?course=cbd&lesson=cbd-2');await ready(page);
 assert(await page.locator('.revision-badge').isVisible());
 await advance(page,'#next');
 for(let i=0;i<data[0].sections[0].quiz.length;i++)await page.locator('input[name="q'+i+'"][value="'+data[0].sections[0].quiz[i].answer+'"]').check();
 await page.locator('#check').click();await page.locator('#continue').click();
 await advance(page,'#next');
 assert(await page.locator('.archived-drafts').isVisible());
 await page.locator('.archived-drafts summary').click();
 await page.locator('.archived-fill-empty').click();
 assert.equal(await page.locator('#lab-field-0').inputValue(),'Archived prior SMART objective');
 // Test E07 study summary modal
 await page.goto(base+'/platform/?course=cbd');await ready(page);
 await page.locator('#export-study-sheet').click();
 await page.locator('#study-summary-modal').waitFor({state:'visible'});
 assert.match(await page.locator('#study-summary-modal').innerText(),/Archived prior SMART objective/);
 await page.locator('#study-close').click();
 // Run04: canonical course-home return from Lesson 1 -> approved /course/#home
 await page.locator('#start-course').click();
 await page.locator('#back-home').click();
 assert(page.url().endsWith('/course/#home'),'Expected Lesson 1 Course Home to return to approved /course/#home, got '+page.url());
 await page.context().close();
 page=await pageFor(browser,{width:768,height:1024});
 await page.route('**/curricula/cbd/*.json',r=>r.abort());
 await page.goto(base+'/platform/?course=cbd&lesson=cbd-2');await ready(page);assert.match(await page.locator('h1').innerText(),/could not open/);
 await page.context().close();
 page=await pageFor(browser,{width:768,height:1024});
 await page.goto(base+'/platform/demo.html');
 assert.match(await page.locator('#learning-demo').getAttribute('src'),/demo-showcase\.html/);
 const frame=page.frameLocator('#learning-demo');
 await frame.locator('#tab-logframe').waitFor();
 await frame.locator('#tab-logframe').click();
 assert.equal(await frame.locator('[data-node]').count(),4);
 await frame.locator('[data-node]').nth(1).click();
 assert.match(await frame.locator('#concept-feedback').innerText(),/Verification|Indicator/);
 await page.locator('#scene').selectOption('cbd2');
 assert.match(await page.locator('#learning-demo').getAttribute('src'),/lesson=cbd-2/);
 await page.locator('#scene').selectOption('02-01');
 assert.match(await page.locator('#learning-demo').getAttribute('src'),/02-01$/);
 await page.locator('#scene').selectOption('showcase');
 assert.match(await page.locator('#learning-demo').getAttribute('src'),/demo-showcase\.html/);
 await page.screenshot({path:path.join(output,'demo-tablet.png'),fullPage:true});
 await page.context().close();
 console.log('Malformed progress, storage denial, missing content and live demo switching passed');
}
async function runAxe(page,label){
 await page.addScriptTag({path:axePath});
 const res=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
 assert.equal(res.violations.length,0,'Axe violations on '+label+': '+JSON.stringify(res.violations.map(v=>v.id)));
}
async function stage2Checks(browser){
 const page=await pageFor(browser,{width:1280,height:900});
 await page.goto(base+'/platform/?course=cbd');await ready(page);
 await runAxe(page,'platform-catalog');

 // Keyboard modal open, Escape close & focus return check (E22)
 await page.locator('#export-study-sheet').focus();
 await page.keyboard.press('Enter');
 await page.locator('#study-summary-modal').waitFor();
 await page.keyboard.press('Escape');
 await page.waitForSelector('#study-summary-modal',{state:'detached'});
 const focusedId=await page.evaluate(()=>document.activeElement?.id);
 assert.equal(focusedId,'export-study-sheet','Expected Escape from Study Summary to return focus to trigger button');

 // E14 all-zero pause & snapshot compare + E10 + E09 + Axe on cbd-2
 await page.goto(base+'/platform/');
 await page.evaluate(()=>localStorage.setItem('carana_learning_v1',JSON.stringify({
  version:1,lessons:{'cbd-2':{contentVersion:'2026.11-run02',completed:[0,1,2],section:1,screen:0,view:'screen',drafts:{'02-04':{0:'Sample verified baseline scope',1:'Sample intake log measure'}}}}
 })));
 await page.goto(base+'/platform/?course=cbd&lesson=cbd-2');await ready(page);
 await runAxe(page,'cbd2-priority-investigate');
 assert.equal(await page.locator('article.screen').getAttribute('data-rhythm'),'investigate');
 for(const sl of await page.locator('[data-weight]').all()){await sl.fill('0');}
 assert.match(await page.locator('#priority-result').innerText(),/paused/);
 await page.locator('#priority-reset').click();
 await page.locator('#priority-save-snapshot').click();
 await page.locator('[data-weight]').first().fill('5');
 assert.match(await page.locator('#priority-compare').innerText(),/Snapshot A vs Current/);

 // Jump to 02-06 -> verify E09 handoff staging & rollback
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('carana_learning_v1'));s.lessons['cbd-2'].section=2;s.lessons['cbd-2'].screen=2;localStorage.setItem('carana_learning_v1',JSON.stringify(s));});
 await page.reload();await ready(page);
 await page.locator('#handoff-preview-btn').click();
 await page.locator('#handoff-confirm').click();
 const storedLab=await page.evaluate(()=>JSON.parse(localStorage.getItem('carana_cbd_lab_v1')));
 assert.equal(storedLab.module2.smartObjectives[0].specific,'Sample verified baseline scope');
 assert.equal(storedLab.module2.smartObjectives[0].measurable,'Sample intake log measure');
 await page.locator('#handoff-preview-btn').click();
 await page.locator('#handoff-undo').click();
 const rolledBack=await page.evaluate(()=>localStorage.getItem('carana_cbd_lab_v1'));
 assert.equal(rolledBack,null,'Expected handoff rollback to restore clean prior empty state');

 // E11 bespoke Logframe row + E20 source disclosure on cbd-3 03-10
 await page.evaluate(()=>localStorage.setItem('carana_learning_v1',JSON.stringify({
  version:1,lessons:{'cbd-3':{contentVersion:'2026.11-run02',completed:[0,1,2],section:0,screen:1,view:'screen',drafts:{}}}
 })));
 await page.goto(base+'/platform/?course=cbd&lesson=cbd-3');await ready(page);
 await runAxe(page,'cbd3-logframe-construct');
 assert.equal(await page.locator('article.screen').getAttribute('data-rhythm'),'construct');
 assert.equal(await page.locator('.visual').getAttribute('data-layout'),'logframe-row');
 assert.match(await page.locator('.source-summary').innerText(),/UNPOL Job-Specific Training/);

 // E18 Demo & Showcase Axe checks
 await page.goto(base+'/platform/demo.html');
 await runAxe(page,'demo');
 await page.goto(base+'/platform/demo-showcase.html');
 await runAxe(page,'demo-showcase');

 // E08 Isolated Connected Notebook interactive workflow, upstream alignment propagation & Axe check
 await page.goto(base+'/platform/?course=cbd');await ready(page);
 await page.locator('#open-e08-notebook').click();
 await page.waitForFunction(()=>window.CARANA_NOTEBOOK_PROTOTYPE?.ready);
 await runAxe(page,'e08-notebook');
 await page.fill('#nb-observed','Phase 1 observed evidence: custody book audit completed.');
 await page.fill('#nb-assumptions','Night shift reporting accuracy unverified.');
 await page.locator('#nb-save-snapshot').click();
 await page.locator('[data-phase="phase2"]').click();
 await page.fill('#nb-observed','Phase 2 objective: standardise intake log across 2 stations.');
 await page.locator('#nb-save-draft').click();
 await page.locator('[data-phase="phase1"]').click();
 await page.fill('#nb-observed','Phase 1 updated observed evidence: night shift audit added.');
 await page.locator('#nb-save-draft').click();
 await page.locator('[data-phase="phase2"]').click();
 assert.match(await page.locator('.nb-align-alert').innerText(),/Upstream Phase 1 was updated/);
 await page.locator('#nb-mark-aligned').click();
 assert.equal(await page.locator('.nb-align-alert').count(),0);
 assert.equal(await page.evaluate(()=>localStorage.getItem('carana_cbd_lab_v1')),null,'E08 notebook must never alter practical workbench data');

 // E16 Lesson 1 option-specific quiz feedback
 await page.goto(base+'/course/');
 await page.locator('#start-course').click();
 for(let step=0;step<3;step++)await advance(page,'#next-screen');
 await page.locator('input[name="q0"][value="0"]').check();
 for(let q=1;q<6;q++)await page.locator('input[name="q'+q+'"][value="0"]').check();
 await page.locator('#check-quiz').click();
 assert.match(await page.locator('.answer-hint').first().innerText(),/Approving training immediately/);

 await page.context().close();
 console.log('Stage 2 checks passed: E09 handoff/rollback, E10/E11/E20, E14/E15, E16 optionFeedback, E18 ungated demo, E22 zero Axe WCAG 2.1 AA violations');
}
async function secondCurriculum(browser){
 const page=await pageFor(browser,{width:1024,height:800});
 const source=fs.readFileSync(path.resolve(__dirname,'../../platform/catalog.js'),'utf8');
 const extra="\nwindow.CARANA_CATALOG.find(c=>c.id==='mma').lessons=[{id:'mma-orientation-rehearsal',number:0,title:'MMA source orientation rehearsal',file:'../curricula/mma-rehearsal.json'}];";
 await page.route('**/platform/catalog.js',r=>r.fulfill({contentType:'application/javascript',body:source+extra}));
 await page.route('**/curricula/mma-rehearsal.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify([require('./mma-orientation.json')])}));
 await page.goto(base+'/platform/?course=mma&lesson=mma-orientation-rehearsal');await ready(page);
 assert.equal(await page.locator('h1').innerText(),'Know the learning process before beginning');
 await page.locator('[data-node]').nth(1).click();assert.match(await page.locator('#concept-feedback').innerText(),/pre-work/);
 await advance(page,'#next');await page.locator('input[value="0"]').check();await page.locator('#check').click();
 assert.match(await page.locator('h1').innerText(),/Carry your work/);
 await page.reload();await ready(page);assert.match(await page.locator('.rail .status').first().innerText(),/1 \/ 1/);
 await page.context().close();
 console.log('Unpublished verified MMA orientation fixture passed on the unchanged shared runtime; not a released MMA course');
}
(async()=>{
 for(const [engine,size,name] of [[webkit,{width:1366,height:950},'webkit-desktop'],[chromium,{width:1440,height:950},'chromium'],[webkit,{width:390,height:844},'webkit-mobile']]){
  const b=await engine.launch();try{await flow(b,size,name);if(name==='chromium'){await edgeCases(b);await stage2Checks(b);await secondCurriculum(b);}}finally{await b.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
