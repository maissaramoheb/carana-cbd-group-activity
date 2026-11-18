const {chromium,webkit}=require(process.env.CBD_TEST_MODULES+'/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.CBD_TEST_URL||'http://127.0.0.1:8650';
const output=process.env.CBD_TEST_OUTPUT||'/tmp/carana-run01-browser';
fs.mkdirSync(output,{recursive:true});
const data=['lessons-2-3','lessons-4-6'].flatMap(x=>require('../../curricula/cbd/'+x+'.json'));
async function pageFor(browser,size){
 const context=await browser.newContext({viewport:size,reducedMotion:'reduce'});
 const page=await context.newPage();page.setDefaultTimeout(7000);
 return page;
}
async function ready(page){await page.waitForFunction(()=>window.CARANA_PLATFORM?.ready);}
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
    await page.locator('[data-choice]').nth(screen.decision.answer).click();
    assert.match(await page.locator('#decision-feedback').innerText(),/defensible/);
    const transcript=page.locator('details').last();
    await transcript.locator('summary').click();assert((await transcript.locator('.transcript').innerText()).length>300);
    if(i===0&&s===0){
     await page.screenshot({path:path.join(output,name+'-'+lesson.id+'.png'),fullPage:true});
     if(name==='chromium'){
      await page.addScriptTag({path:require.resolve(process.env.CBD_TEST_MODULES+'/axe-core/axe.min.js')});
      const violations=await page.evaluate(async()=> (await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(x=>({id:x.id,impact:x.impact,nodes:x.nodes.map(n=>n.target)})));
      fs.writeFileSync(path.join(output,lesson.id+'-axe.json'),JSON.stringify(violations,null,2));assert.equal(violations.length,0,JSON.stringify(violations));
     }
    }
    await page.locator('#next').click();
    assert(await page.locator('h1').evaluate(e=>document.activeElement===e));
   }
   await page.locator('#check').click();assert.match(await page.locator('#quiz-status').innerText(),/Answer every/);
   for(let i=0;i<section.quiz.length;i++)await page.locator('input[name="q'+i+'"][value="'+((section.quiz[i].answer+1)%3)+'"]').check();
   await page.locator('#check').click();assert.equal(await page.locator('.quiz-hint').count(),section.quiz.length);
   await page.locator('#review').click();await page.locator('#next').click();
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
  assert.match(await page.locator('.rail .status').first().innerText(),new RegExp(lesson.sections.length+' / '+lesson.sections.length));
 }
 await page.goto(base+'/platform/?course=cbd');await ready(page);
 assert.equal(await page.locator('.lesson-row').count(),6);
 await page.goto(base+'/platform/?course=mma');await ready(page);assert.equal(await page.locator('.lesson-row').count(),0);assert.match(await page.locator('main').innerText(),/no digital course available/i);
 assert.deepEqual(errors,[]);
 await page.context().close();console.log(name,'all 5 lessons: 30 screens, 42 checkpoint questions, reveal nodes, decisions, review/retake, reload, activity links passed');
}
const sectionCount=l=>l.sections.length;
async function edgeCases(browser){
 let page=await pageFor(browser,{width:320,height:800});
 await page.addInitScript(()=>{localStorage.setItem('carana_learning_v1',JSON.stringify({version:1,lessons:{'cbd-2':{contentVersion:'2026.11-run01',completed:[2,2],section:Infinity,screen:4.5}}}));Storage.prototype.setItem=()=>{throw Error('Write denied')};});
 await page.goto(base+'/platform/?course=cbd&lesson=cbd-2');await ready(page);assert.equal(await page.locator('h1').innerText(),data[0].sections[0].screens[0].title);
 await page.locator('#next').click();assert.match(await page.locator('#save-status').innerText(),/Could not save/);
 await page.context().close();
 page=await pageFor(browser,{width:768,height:1024});
 await page.route('**/curricula/cbd/*.json',r=>r.abort());
 await page.goto(base+'/platform/?course=cbd&lesson=cbd-2');await ready(page);assert.match(await page.locator('h1').innerText(),/could not open/);
 await page.context().close();
 page=await pageFor(browser,{width:768,height:1024});
 await page.goto(base+'/platform/demo.html');
 await page.locator('#scene').selectOption('02-01');
 assert.match(await page.locator('#learning-demo').getAttribute('src'),/02-01$/);
 await page.screenshot({path:path.join(output,'demo-tablet.png'),fullPage:true});
 await page.context().close();
 console.log('Malformed progress, storage denial, missing content and live demo switching passed');
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
 await page.locator('#next').click();await page.locator('input[value="0"]').check();await page.locator('#check').click();
 assert.match(await page.locator('h1').innerText(),/Carry your work/);
 await page.reload();await ready(page);assert.match(await page.locator('.rail .status').first().innerText(),/1 \/ 1/);
 await page.context().close();
 console.log('Unpublished verified MMA orientation fixture passed on the unchanged shared runtime; not a released MMA course');
}
(async()=>{
 for(const [engine,size,name] of [[chromium,{width:1440,height:950},'chromium'],[webkit,{width:390,height:844},'webkit-mobile']]){
  const b=await engine.launch();try{await flow(b,size,name);if(name==='chromium'){await edgeCases(b);await secondCurriculum(b);}}finally{await b.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
