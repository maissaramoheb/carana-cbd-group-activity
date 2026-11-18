const {chromium}=require(process.env.CBD_TEST_MODULES+'/playwright');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.CBD_TEST_URL,output=process.env.CBD_TEST_OUTPUT;
const lessons=['lessons-2-3','lessons-4-6'].flatMap(f=>require(path.resolve(__dirname,'../../../curricula/cbd/'+f+'.json')));
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const b=await chromium.launch();const c=await b.newContext({viewport:{width:1440,height:950}});const p=await c.newPage();
 const records={};
 async function gotoTool(id,screenId){
  const l=lessons.find(l=>l.id===id);let section,screen;
  l.sections.forEach((s,i)=>s.screens.forEach((x,j)=>{if(x.id===screenId){section=i;screen=j;}}));
  await p.goto(base+'/platform/');
  await p.evaluate(x=>localStorage.setItem('carana_learning_v1',JSON.stringify(x)),{version:1,lessons:{[id]:{contentVersion:l.version,completed:l.sections.map((_,i)=>i).slice(0,section),section,screen}}});
  await p.goto(base+'/platform/?course=cbd&lesson='+id);await p.waitForFunction(()=>window.CARANA_PLATFORM?.ready);
 }
 await gotoTool('cbd-2','02-04');
 for(const field of await p.locator('[data-field]').all())await field.fill('x');
 await p.locator('#lab-check').click();records.nonsenseDraftFeedback=await p.locator('#lab-feedback').innerText();
 await p.locator('.applied-lab').screenshot({path:path.join(output,'probe-draft-x.png')});
 records.importControls=await p.locator('input[type=file]').count();
 await gotoTool('cbd-2','02-03');
 for(const el of await p.locator('[data-weight]').all()){await el.focus();await p.keyboard.press('Home');}
 records.zeroWeightFeedback=await p.locator('#priority-result').innerText();
 await p.locator('.applied-lab').screenshot({path:path.join(output,'probe-priority-tie.png')});
 await p.goto(base+'/platform/');
 await p.evaluate(()=>localStorage.setItem('carana_learning_v1',JSON.stringify({version:1,lessons:{'cbd-2':{contentVersion:'previous-fixture',completed:[0],section:1,screen:0,drafts:{'02-04':{0:'Synthetic prior-version draft to preserve'}}}}})));
 await p.goto(base+'/platform/?course=cbd&lesson=cbd-2');await p.waitForFunction(()=>window.CARANA_PLATFORM?.ready);
 await p.locator('#next').click();
 const download=p.waitForEvent('download');await p.locator('#export-progress').click();const file=await download;
 const saved=JSON.parse(fs.readFileSync(await file.path(),'utf8'));
 records.versionChangeExport=saved.progress.lessons['cbd-2'];
 records.oldDraftRetained=JSON.stringify(saved).includes('Synthetic prior-version draft');
 await p.goto(base+'/platform/?course=cbd');await p.locator('a', {hasText:'Open Lesson 1'}).click();await p.locator('#back-home').click();
 records.homeCopyComingLater=await p.getByText('Self-paced lesson coming later',{exact:true}).count();
 records.hasPlatformReturnLink=await p.locator('a[href*="platform"]').count();
 await p.screenshot({path:path.join(output,'probe-old-home.jpg'),type:'jpeg',quality:72,fullPage:true});
 for(const width of [390,768]){
  await p.setViewportSize({width,height:900});await gotoTool('cbd-3','03-10');
  records['mobileLeadDistance'+width]=await p.locator('h1').evaluate(e=>Math.round(e.getBoundingClientRect().top+scrollY));
  await p.screenshot({path:path.join(output,'probe-mobile-'+width+'.jpg'),type:'jpeg',quality:72,fullPage:true});
 }
 await p.setViewportSize({width:1440,height:950});
 await p.goto(base+'/platform/demo.html');await p.locator('#scene').selectOption('cbd2');
 records.demoFrameSource=await p.locator('#learning-demo').getAttribute('src');
 await p.screenshot({path:path.join(output,'probe-demo.jpg'),type:'jpeg',quality:72,fullPage:true});
 const nav=await p.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {domContentLoaded:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd),transfer:n.transferSize};});
 records.singleLocalDemoNavigation=nav;
 fs.writeFileSync(path.join(output,'targeted-probes.json'),JSON.stringify(records,null,2));
 console.log(JSON.stringify(records,null,2));
 await b.close();
})().catch(e=>{console.error(e);process.exitCode=1});
