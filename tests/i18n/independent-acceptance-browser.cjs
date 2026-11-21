/* Independent Run 08 coverage. Fresh synthetic browser storage only; audio muted. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium,webkit}=require((process.env.CBD_TEST_MODULES||'/tmp/cbd-test-modules')+'/playwright');
const {launchMutedBrowser}=require('../helpers/mute-browser.cjs');
const ROOT=path.resolve(__dirname,'../..'),OUT=process.env.CBD_TEST_OUTPUT||'/tmp/carana-run08-independent';
fs.mkdirSync(OUT,{recursive:true});
const base=process.env.CBD_TEST_URL||'http://127.0.0.1:8688';
const w={};vm.runInNewContext(fs.readFileSync(path.join(ROOT,'course/lesson1-data.js'),'utf8'),{window:w});
const lessons=[{...w.CARANA_LESSON1,id:'cbd-1',number:1},...['lessons-2-3','lessons-4-6'].flatMap(n=>require('../../curricula/cbd/'+n+'.json'))];
const packs=Object.fromEntries(['fr-FR','ar'].map(lang=>[lang,{l1:require('../../locales/'+lang+'/course-l1.json').lesson,expanded:require('../../locales/'+lang+'/lessons-2-6.json').lessons}]));
const localized=(l,lang)=>lang==='en'?l:l.number===1?packs[lang].l1:packs[lang].expanded[l.id];
let serial=0;const rows=[],errors=[];
async function language(p,lang){await p.locator('.carana-lang-switch [data-lang-choice="'+lang+'"]').first().click();await p.waitForFunction(l=>CARANA_I18N.getLang()===l,lang);}
async function layout(p,lang){assert.equal(await p.getAttribute('html','lang'),lang);assert.equal(await p.getAttribute('html','dir'),lang==='ar'?'rtl':'ltr');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'whole-page horizontal overflow');}
async function seed(p,l,s,n,quiz,lang){
 const completed=Array.from({length:s},(_,i)=>i);
 const state=l.number===1?{key:'carana_cbd_course_v1',value:{version:1,completed,visited:[],lastSection:s,lastScreen:n,lastKind:quiz?'quiz':'screen'}}:{key:'carana_learning_v1',value:{version:1,lessons:{[l.id]:{contentVersion:l.version,completed,section:s,screen:n,view:quiz?'quiz':'screen',drafts:{},revisionAck:true}}}};
 const route=(l.number===1?'/course/?':'/platform/?course=cbd&lesson='+l.id+'&')+'lang='+lang+'&audit='+(++serial)+'&audit-state='+encodeURIComponent(JSON.stringify(state))+(l.number===1?'#lesson-1':'');
 await p.goto(base+route);await p.waitForSelector(quiz?'fieldset':'h1');
 if(l.number!==1)await p.waitForFunction(()=>CARANA_PLATFORM.ready);
}
(async()=>{
 for(const [engine,profile,width] of [[chromium,'chromium-desktop',1440],[webkit,'webkit-desktop',1440],[webkit,'webkit-mobile',390]]){
 const browser=await launchMutedBrowser(engine);try{
 const context=await browser.newContext({viewport:{width,height:900},isMobile:width<450,hasTouch:width<450,reducedMotion:'reduce'}),p=await context.newPage();p.setDefaultTimeout(30000);
 await p.addInitScript(()=>{const sp=new URLSearchParams(location.search);if(sp.has('audit-state')){const state=JSON.parse(sp.get('audit-state'));localStorage.setItem(state.key,JSON.stringify(state.value));}});
 p.on('pageerror',e=>errors.push({profile,message:e.message}));await p.route('https://fonts.googleapis.com/**',r=>r.abort());await p.goto(base+'/course/');
 for(const lang of ['en','fr-FR','ar'])for(const l of lessons){
 const loc=localized(l,lang);
 for(let s=0;s<l.sections.length;s++){
 for(let n=0;n<l.sections[s].screens.length;n++){
 const screen=loc.sections[s].screens[n];await seed(p,l,s,n,false,lang);await p.waitForFunction(t=>document.querySelector('h1')?.textContent.trim()===t.trim(),screen.title).catch(async e=>{throw Error(JSON.stringify({lesson:l.id,lang,s,n,expected:screen.title,actual:await p.locator('h1').innerText(),url:p.url()}));});await layout(p,lang);
 
 rows.push({profile,lang,lesson:l.id,type:'screen',id:l.sections[s].screens[n].id,title:screen.title,lab:!!l.sections[s].screens[n].lab,pass:true});
 if(s===0&&n===0)await p.screenshot({path:path.join(OUT,profile+'-'+lang+'-'+l.id+'.png'),fullPage:true});
 // A real saved applied-tool field must survive language changes without changing its canonical draft.
 const field=p.locator('[data-field]').first();if(l.sections[s].screens[n].lab?.type==='builder'){
 await field.fill('Synthetic review — Français العربية 2026');const alternate=lang==='ar'?'en':'ar';await language(p,alternate);await p.waitForFunction(()=>document.querySelector('[data-field]')?.value==='Synthetic review — Français العربية 2026');assert.equal(await field.inputValue(),'Synthetic review — Français العربية 2026');await language(p,lang);await p.waitForFunction(t=>document.querySelector('h1')?.textContent.trim()===t.trim(),screen.title);
 }
 }
 await seed(p,l,s,0,true,lang);const qs=loc.sections[s].quiz,fieldset=p.locator('fieldset');assert.equal(await fieldset.count(),qs.length);
 for(let q=0;q<qs.length;q++){
 assert((await fieldset.nth(q).innerText()).includes(qs[q].q||qs[q].prompt));const opts=fieldset.nth(q).locator('input[type=radio]');assert.equal(await opts.count(),qs[q].options.length);
 for(let o=0;o<qs[q].options.length;o++){assert.equal(await opts.nth(o).getAttribute('value'),String(o));assert((await opts.nth(o).locator('..').innerText()).includes(qs[q].options[o]));}
 rows.push({profile,lang,lesson:l.id,type:'checkpoint-question',section:s,question:q,pass:true});
 }
 await p.locator('input[name=q0][value="0"]').check();const alternate=lang==='ar'?'en':'ar';await language(p,alternate);await p.waitForSelector('input[name=q0][value="0"]:checked');await language(p,lang);await p.waitForSelector('input[name=q0][value="0"]:checked');await layout(p,lang);
 }
 console.log(profile+' '+lang+' '+l.id+' passed');
 }
 for(let m=1;m<=6;m++){
 await p.goto(base+'/module'+m+'.html?lang=en');await p.waitForSelector('.stage-tab');let field;
 for(let i=0;i<await p.locator('.stage-tab').count();i++){
 await p.locator('.stage-tab').nth(i).click();const candidates=p.locator('input[type=text]:visible:not(#scenarioSearchInput),textarea:visible');if(await candidates.count()){field=candidates.first();break;}
 }
 assert(field,'Workbench '+m+' must provide an actual editable draft');const id=await field.getAttribute('id');await field.fill('Synthetic review — Français العربية 2026');await field.blur();
 for(const lang of ['fr-FR','ar','en']){await language(p,lang);await p.waitForFunction(()=>[...document.querySelectorAll('input,textarea')].some(e=>e.value==='Synthetic review — Français العربية 2026'));await layout(p,lang);assert.equal(await field.inputValue(),'Synthetic review — Français العربية 2026');rows.push({profile,lang,module:m,type:'workbench-draft-roundtrip',field:id||'first visible editable field',pass:true});await p.screenshot({path:path.join(OUT,profile+'-'+lang+'-module'+m+'.png'),fullPage:true});}
 }
 await context.close();
 }finally{await browser.close();}}
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'coverage.json'),JSON.stringify({rows,errors,summary:{screens:rows.filter(x=>x.type==='screen').length,questions:rows.filter(x=>x.type==='checkpoint-question').length,workbenchRoundtrips:rows.filter(x=>x.type==='workbench-draft-roundtrip').length}},null,2));
 console.log('PASS '+rows.length+' independent coverage records');
})().catch(e=>{fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({message:e.message,stack:e.stack,rows,errors},null,2));console.error(e);process.exitCode=1});
