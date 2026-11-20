const advance=require('../helpers/progression.cjs');
const {launchMutedBrowser}=require('../helpers/mute-browser.cjs');
/* Run04 integration contract: real links, unchanged storage domains, review-first restore. */
const {chromium,webkit}=require(process.env.CBD_TEST_MODULES+'/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.CBD_TEST_URL||'http://127.0.0.1:8674';
const output=process.env.CBD_TEST_OUTPUT||'/tmp/run04-navigation';fs.mkdirSync(output,{recursive:true});
async function home(p){await p.waitForSelector('#home-backup-controls #import-progress');assert.equal(new URL(p.url()).pathname,'/course/');}
(async()=>{
 for(const [engine,name,size] of [[chromium,'chromium',{width:1440,height:1000}],[webkit,'webkit-mobile',{width:390,height:844}]]){
 const b=await launchMutedBrowser(engine);try{
 const p=await b.newPage({storageState:process.env.CBD_TEST_STORAGE_STATE,viewport:size,reducedMotion:'reduce',hasTouch:size.width<450,isMobile:size.width<450});
 p.setDefaultTimeout(9000);const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.route('https://fonts.googleapis.com/**',r=>r.abort());
 if(process.env.CBD_TEST_DISABLE_HOST_TOOLBAR==='1')await p.route('https://vercel.live/_next-live/feedback/feedback.js',r=>r.abort());
 for(const route of ['/','/course/','/course/#home','/platform/','/platform/?course=cbd']){
  await p.goto(base+route);await home(p);assert.equal(await p.locator('.curriculum-phase-card').count(),6);
  assert.equal(await p.locator('.main-cta').getAttribute('href'),'#course-map');
 }
 await p.screenshot({path:path.join(output,name+'-corrected.png'),fullPage:true});
 await p.locator('#start-course').focus();await p.keyboard.press('Enter');await advance(p,'#next-screen');
 await p.screenshot({path:path.join(output,name+'-lesson-1.png')});const l1=await p.locator('h1').innerText();await p.locator('#back-home').click();await home(p);
 await p.locator('#start-course').click();assert.equal(await p.locator('h1').innerText(),l1);
 await p.locator('#back-home').click();await home(p);
 for(let n=2;n<=6;n++){
  await p.locator('[data-home-lesson="cbd-'+n+'"]').click();await p.waitForFunction(()=>window.CARANA_PLATFORM?.ready);
  await advance(p,'#next');const heading=await p.locator('h1').innerText();await p.screenshot({path:path.join(output,name+'-lesson-'+n+'.png')});
  await p.locator('.rail-back').click();await home(p);
  assert.match(await p.locator('[data-home-lesson="cbd-'+n+'"]').innerText(),/Resume/);
  await p.locator('[data-home-lesson="cbd-'+n+'"]').click();await p.waitForFunction(()=>window.CARANA_PLATFORM?.ready);
  assert.equal(await p.locator('h1').innerText(),heading);await p.locator('.rail-back').click();await home(p);
 }
 const saved=await p.evaluate(()=>Object.fromEntries(['carana_learning_v1','carana_cbd_course_v1','carana_cbd_lab_v1'].map(k=>[k,localStorage.getItem(k)])));
 await p.locator('#import-file').setInputFiles({name:'wrong.json',mimeType:'application/json',buffer:Buffer.from('{"not":"a backup"}')});
 await p.locator('.restore-dismiss').waitFor();assert.match(await p.locator('#restore-preview').innerText(),/Restore did not apply/);
 assert.deepEqual(await p.evaluate(()=>Object.fromEntries(['carana_learning_v1','carana_cbd_course_v1','carana_cbd_lab_v1'].map(k=>[k,localStorage.getItem(k)]))),saved);
 await p.locator('.restore-dismiss').click();
 let pending=p.waitForEvent('download');await p.locator('#export-progress').click();let d=await pending;const backup=fs.readFileSync(await d.path());
 await p.locator('#import-file').setInputFiles({name:'saved.json',mimeType:'application/json',buffer:backup});
 await p.waitForFunction(()=>document.querySelector('#restore-preview')?.textContent.includes('Dry-run'));assert.match(await p.locator('#restore-preview').innerText(),/Dry-run/);await p.locator('#restore-cancel').click();
 const chooser=p.waitForEvent('filechooser');await p.locator('#home-restore-l1').click();await (await chooser).setFiles({name:'wrong-l1.json',mimeType:'application/json',buffer:backup});
 await p.locator('#l1-restore-close').waitFor();assert.match(await p.locator('#l1-restore-preview').innerText(),/Lessons 2–6/);await p.locator('#l1-restore-close').click();
 await p.locator('#export-study-sheet').focus();await p.keyboard.press('Enter');await p.locator('#study-summary-modal').waitFor();
 await p.screenshot({path:path.join(output,name+'-summary.png')});await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'export-study-sheet');
 await p.locator('#open-e08-notebook').click();await p.locator('#nb-observed').fill('Synthetic observed evidence for navigation regression.');
 await p.locator('#nb-save-draft').click();await p.screenshot({path:path.join(output,name+'-notebook.png')});pending=p.waitForEvent('download');await p.locator('#nb-export-json').click();d=await pending;const nb=fs.readFileSync(await d.path());
 await p.locator('#nb-import-file').setInputFiles({name:'notebook.json',mimeType:'application/json',buffer:nb});
 await p.locator('#nb-imp-cancel').click();await p.reload();assert.match(await p.locator('#nb-observed').inputValue(),/Synthetic observed/);
 assert.deepEqual(await p.evaluate(()=>Object.fromEntries(['carana_learning_v1','carana_cbd_course_v1','carana_cbd_lab_v1'].map(k=>[k,localStorage.getItem(k)]))),saved);
 await p.getByRole('link',{name:'CBD home',exact:true}).click();await home(p);
 await p.goto(base+'/course/#activities');assert.equal(await p.locator('.activity-card').count(),6);assert.equal(await p.locator('a[href="../CARANA_CBD_Group_Activity.html"]').count(),1);
 for(let n=1;n<=6;n++){const r=await p.request.get(base+'/module'+n+'.html');assert.equal(r.status(),200);}
 for(const route of ['/index.html','/CARANA_CBD_Group_Activity.html','/course/visual-gallery.html#05-02','/platform/demo.html','/platform/?view=curricula','/platform/?course=mma','/platform/?course=cop']){
  const r=await p.goto(base+route);assert.equal(r.status(),200);assert(!new URL(p.url()).pathname.endsWith('/course/'),'Standalone route must remain standalone '+route);
 }
 for(const width of [320,390,768,1440]){
  await p.setViewportSize({width,height:1000});await p.goto(base+'/course/');await home(p);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'home reflow '+width);
  if(name==='chromium'){
   await p.addScriptTag({path:require.resolve(process.env.CBD_TEST_MODULES+'/axe-core/axe.min.js')});
   const v=await p.evaluate(async()=>(await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations);
   fs.writeFileSync(path.join(output,'home-'+width+'-axe.json'),JSON.stringify(v,null,2));assert.deepEqual(v,[]);
  }
 }
 await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('carana_learning_v1'));s.lessons['cbd-2'].drafts={'02-03':{0:2,1:1,2:1}};localStorage.setItem('carana_learning_v1',JSON.stringify(s));});await p.reload();await home(p);await p.locator('#export-study-sheet').click();await p.waitForFunction(()=>document.querySelector('#study-summary-modal')?.textContent.includes('Illustrative totals'));await p.keyboard.press('Escape');
 assert.deepEqual(errors,[]);console.log(name+' navigation, all six resume paths, storage isolation, backup dry runs, notebook, standalone routes and home reflow passed');
 }finally{await b.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
