const {chromium}=require(process.env.CBD_TEST_MODULES+'/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.CBD_TEST_URL||'http://127.0.0.1:8661';
const output=process.env.CBD_TEST_OUTPUT||'/tmp/carana-run02-browser';fs.mkdirSync(output,{recursive:true});
const data=['lessons-2-3','lessons-4-6'].flatMap(f=>require(process.cwd()+'/curricula/cbd/'+f+'.json'));
(async()=>{const b=await chromium.launch();try{
 for(const width of [320,768]){
  const page=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  for(const lesson of data){
   const payload={version:1,lessons:{[lesson.id]:{contentVersion:lesson.version,completed:lesson.sections.map((_,i)=>i),section:0,screen:0}}};
   await page.goto(base+'/platform/');
   await page.evaluate(v=>localStorage.setItem('carana_learning_v1',JSON.stringify(v)),payload);
   await page.goto(base+'/platform/?course=cbd&lesson='+lesson.id);
   await page.waitForFunction(()=>window.CARANA_PLATFORM?.ready);
   const h1Top=await page.locator('h1').evaluate(e=>Math.round(e.getBoundingClientRect().top+scrollY));
   assert(h1Top<350,'Expected first heading in initial mobile/tablet viewport on '+lesson.id+' width '+width+', got '+h1Top);
   for(let s=0;s<lesson.sections.length;s++){
    const toggle=page.locator('#rail-toggle');
    if(await toggle.isVisible()&&await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
    await page.locator('[data-section]').nth(s).click();
    for(let n=0;n<lesson.sections[s].screens.length;n++){
     for(const dir of ['ltr','rtl']){
      await page.evaluate(dir=>document.documentElement.dir=dir,dir);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),lesson.id+' '+s+' '+n+' '+width+' '+dir);
     }
     await page.locator('#next').click();
    }
   }
  }
  await page.goto(base+'/platform/demo.html');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  await page.screenshot({path:output+'/demo-'+width+'.png',fullPage:true});
  await page.close();
 }
 console.log('All 38 enhanced screens reflow at 320/768px in LTR/RTL; demo reflow and screenshots passed. English content only.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
