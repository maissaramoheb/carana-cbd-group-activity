const {chromium,webkit}=require(process.env.CBD_TEST_MODULES+'/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.CBD_TEST_URL||'http://127.0.0.1:8675',out=process.env.CBD_TEST_OUTPUT||'/tmp/run05-exploration';fs.mkdirSync(out,{recursive:true});
const l1key='carana_cbd_course_v1',newkey='carana_learning_v1',aux='carana_exploration_v1';
async function pageFor(b,width){const p=await b.newPage({storageState:process.env.CBD_TEST_STORAGE_STATE,viewport:{width,height:950},reducedMotion:'reduce',hasTouch:width<450,isMobile:width<450});p.setDefaultTimeout(9000);p.on('pageerror',e=>b.runErrors.push(String(e)));await p.route('https://fonts.googleapis.com/**',r=>r.abort());if(process.env.CBD_TEST_DISABLE_HOST_TOOLBAR==='1')await p.route('https://vercel.live/_next-live/feedback/feedback.js',r=>r.abort());return p;}
async function ready(p){await p.waitForFunction(()=>window.CARANA_PLATFORM?.ready);}
async function download(p,button){const wait=p.waitForEvent('download');await p.locator(button).click();const d=await wait;return fs.readFileSync(await d.path());}
async function l1Import(p,buffer){const wait=p.waitForEvent('filechooser');await p.locator('#home-restore-l1').click();await(await wait).setFiles({name:'l1-backup.json',mimeType:'application/json',buffer});}
(async()=>{for(const [engine,name,width]of[[chromium,'chromium',1440],[webkit,'webkit-mobile',390]]){const b=await engine.launch();b.runErrors=[];try{
 let p=await pageFor(b,width);const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(base+'/course/#lesson-1');const before=await p.evaluate(k=>localStorage.getItem(k),l1key);
 await p.locator('[data-vj-item]').nth(2).focus();await p.keyboard.press('Enter');assert.match(await p.locator('#vj-count').innerText(),/1 of 4/);
 assert.match(await p.locator('[data-vj-item]').nth(2).ariaSnapshot(),/Viewing/);
 assert.equal(await p.evaluate(k=>localStorage.getItem(k),l1key),before,'Opening explanations must not mutate checkpoints or position');
 await p.locator('[data-decision]').first().click();assert.match(await p.locator('.practice-history').innerText(),/Practice attempted/);
 await p.reload();assert.match(await p.locator('#vj-count').innerText(),/1 of 4/);assert.equal(await p.locator('[data-vj-item]').nth(2).getAttribute('aria-pressed'),'true');
 await p.locator('#next-screen').click();assert(await p.locator('.exploration-reminder').isVisible());
 await p.locator('.exploration-review').click();assert.equal(await p.locator('[data-vj-item]').first().evaluate(e=>e===document.activeElement),true);
 await p.locator('#next-screen').click();await p.locator('.exploration-anyway').click();await p.locator('#prev-screen').click();
 const backup=await download(p,'#export-mini'),parsed=JSON.parse(backup);assert.equal(parsed.progress.version,1);assert.equal(parsed.progress.completed.length,0);assert(parsed.exploration.records);
 await p.locator('#next-screen').click();assert.match(await p.locator('h1').innerText(),/Three lenses/);await p.locator('#prev-screen').click();
 assert.equal(await p.locator('nav[aria-label="Course sections"] button').nth(1).isDisabled(),true,'Exploration and practice must not unlock checkpoints');
 await p.context().close();p=await pageFor(b,width);await p.goto(base+'/course/');
 const invalid={...parsed,exploration:{version:999,records:{}}};await l1Import(p,Buffer.from(JSON.stringify(invalid)));await p.locator('#l1-restore-close').waitFor();assert.match(await p.locator('#l1-restore-preview').innerText(),/Invalid exploration/);assert.equal(await p.evaluate(k=>localStorage.getItem(k),l1key),null);await p.locator('#l1-restore-close').click();
 await l1Import(p,backup);await p.locator('#l1-restore-merge').waitFor();assert.equal(await p.evaluate(k=>localStorage.getItem(k),aux),null,'Dry-run restore must not write exploration');await p.locator('#l1-restore-cancel').click();
 await l1Import(p,backup);await p.locator('#l1-restore-merge').click();await p.locator('#start-course').click();assert.match(await p.locator('#vj-count').innerText(),/1 of 4/);assert.match(await p.locator('.practice-history').innerText(),/Practice attempted/);
 await p.locator('#next-screen').click();assert.match(await p.locator('h1').innerText(),/Three lenses/);
 // Legacy export remains usable and does not erase supplemental history.
 await p.goto(base+'/course/#home');const legacy={...parsed};delete legacy.exploration;await l1Import(p,Buffer.from(JSON.stringify(legacy)));await p.locator('#l1-restore-replace').click();await p.locator('#start-course').click();assert.match(await p.locator('#vj-count').innerText(),/1 of 4/);
 await p.context().close();p=await pageFor(b,width);await p.goto(base+'/course/');
 const old={version:1,lessons:{'cbd-2':{contentVersion:'2026.11-run02',completed:[0],section:1,screen:1,view:'screen',drafts:{'02-04':{0:'Existing evidence-led draft; preserve exactly',1:'Existing indicator'}},previousProgress:[{contentVersion:'2026.11-run01',completed:[0],drafts:{'02-04':{0:'Prior version preserved'}}}]}}};
 await p.evaluate(v=>{localStorage.setItem('carana_learning_v1',JSON.stringify(v));localStorage.setItem('carana_cbd_lab_v1','{"sentinel":"original practical"}');localStorage.setItem('carana_notebook_v1','{"sentinel":"notebook"}');},old);
 await p.goto(base+'/platform/?course=cbd&lesson=cbd-2');await ready(p);
 assert.equal(await p.locator('#lab-field-0').inputValue(),old.lessons['cbd-2'].drafts['02-04'][0]);const stateBefore=await p.evaluate(k=>localStorage.getItem(k),newkey);
 await p.locator('[data-node]').last().click();assert.match(await p.locator('#visual-progress').innerText(),/Explanations 1 of/);assert.equal(await p.evaluate(k=>localStorage.getItem(k),newkey),stateBefore,'Node history must not rewrite existing drafts or checkpoint state');
 await p.reload();await ready(p);assert.equal(await p.locator('[data-node]').last().getAttribute('aria-pressed'),'true');assert.match(await p.locator('#visual-progress').innerText(),/Explanations 1 of/);
 await p.locator('#lab-field-0').fill('Updated synthetic draft kept with its own save state.');assert.match(await p.locator('#draft-save-status').innerText(),/Practice draft saved/);
 if(await p.locator('#rail-toggle').isVisible())await p.locator('#rail-toggle').click();
 const expanded=await download(p,'#export-progress'),data=JSON.parse(expanded);assert.equal(data.version,1);assert(data.exploration.records);assert.equal(data.progress.lessons['cbd-2'].previousProgress[0].drafts['02-04'][0],'Prior version preserved');
 const unrelated=await p.evaluate(()=>[localStorage.getItem('carana_cbd_lab_v1'),localStorage.getItem('carana_notebook_v1')]);
 // Changed explanatory content gets a separate history; course version, drafts and checkpoints stay intact.
 await p.route('**/curricula/cbd/lessons-2-3.json',async r=>{const response=await r.fetch();const lessons=await response.json();const sc=lessons.find(l=>l.id==='cbd-2').sections.flatMap(s=>s.screens).find(s=>s.id==='02-04');sc.visual.nodes[0].detail+=' Synthetic version-change fixture.';await r.fulfill({json:lessons});});
 await p.reload();await ready(p);assert.match(await p.locator('#visual-progress').innerText(),/Explanations 0 of/);assert.equal(await p.locator('#lab-field-0').inputValue(),'Updated synthetic draft kept with its own save state.');assert.equal((await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),newkey)).lessons['cbd-2'].completed.length,1);assert.deepEqual(await p.evaluate(()=>[localStorage.getItem('carana_cbd_lab_v1'),localStorage.getItem('carana_notebook_v1')]),unrelated);
 await p.context().close();p=await pageFor(b,width);await p.goto(base+'/course/');await p.locator('#import-file').setInputFiles({name:'expanded.json',mimeType:'application/json',buffer:expanded});await p.locator('#restore-merge').click();await p.goto(base+'/platform/?course=cbd&lesson=cbd-2');await ready(p);assert.match(await p.locator('#visual-progress').innerText(),/Explanations 1 of/);assert.equal(await p.locator('#lab-field-0').inputValue(),'Updated synthetic draft kept with its own save state.');
 await p.locator('.visual').screenshot({path:path.join(out,name+'-restored-diagram.png')});assert.equal(await p.locator('[data-node]').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
 await p.context().close();p=await pageFor(b,width);await p.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='carana_exploration_v1')throw Error('Synthetic exploration quota denial');return original.call(this,k,v);};});
 await p.goto(base+'/course/#lesson-1');await p.locator('[data-vj-item]').first().click();assert.match(await p.locator('.exploration-storage').innerText(),/could not save/);const denied=JSON.parse(await download(p,'#export-mini'));assert.equal(Object.values(denied.exploration.records)[0].seen.length,1);assert.equal(denied.progress.completed.length,0);await p.locator('#back-home').click();assert.match(await p.locator('#backup-status').innerText(),/Exploration history could not save/);assert.deepEqual(b.runErrors,[]);
 await p.context().close();console.log(name+' PASS: separate history, review/skip, unchanged gating, L1/expanded import-export, legacy imports, malformed auxiliary rejection, revised-content isolation, draft/Notebook/workbench preservation, reduced motion and denied storage');
 }finally{await b.close();}}})().catch(e=>{console.error(e);process.exitCode=1});
