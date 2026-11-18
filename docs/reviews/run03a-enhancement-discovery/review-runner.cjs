/* Read-only instrumentation of existing browser journeys. Writes review evidence only. */
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=path.resolve(__dirname,'../../..');
const kind=process.argv[2]||'expanded';
const sourceFile=path.join(root,kind==='legacy'?'course/tests/browser.cjs':'tests/platform/browser.cjs');
let source=fs.readFileSync(sourceFile,'utf8');
const output=process.env.CBD_TEST_OUTPUT;
if(!output)throw Error('CBD_TEST_OUTPUT is required');
fs.mkdirSync(output,{recursive:true});
const helper=String.raw`
async function reviewCapture(page,id,profile){
 const metric=await page.evaluate(()=>{
  const main=document.querySelector('.screen,.learning-content')||document.querySelector('main');
  return {title:document.querySelector('h1')?.innerText,words:main.innerText.trim().split(/\s+/).length,
   height:Math.round(main.getBoundingClientRect().height),viewport:innerHeight,
   fields:main.querySelectorAll('textarea').length,buttons:main.querySelectorAll('button').length,
   headingFont:getComputedStyle(document.querySelector('h1')).fontFamily,
   bodyFont:getComputedStyle(main).fontFamily,bodySize:getComputedStyle(main).fontSize,
   overflow:document.documentElement.scrollWidth>innerWidth+2};
 });
 require('node:fs').appendFileSync(require('node:path').join(process.env.CBD_TEST_OUTPUT,'screen-metrics.jsonl'),JSON.stringify({id,profile,...metric})+'\n');
 if(profile==='chromium')await page.screenshot({path:require('node:path').join(process.env.CBD_TEST_OUTPUT,'screen-'+id+'.jpg'),type:'jpeg',quality:72,fullPage:true});
}
`;
source=helper+String.fromCharCode(10)+source;
if(kind==='legacy')source=source.replace("assert.equal(await page.locator('h1').textContent(), lesson[s].screens[n].title);",
"assert.equal(await page.locator('h1').textContent(), lesson[s].screens[n].title); await reviewCapture(page,'L1-'+id(s,n),name);");
else source=source.replace("assert.equal(await page.locator('h1').innerText(),screen.title);",
"assert.equal(await page.locator('h1').innerText(),screen.title); await reviewCapture(page,'L'+lesson.number+'-'+screen.id,name);");
const instance=new Module(sourceFile,module);instance.filename=sourceFile;instance.paths=Module._nodeModulePaths(path.dirname(sourceFile));instance._compile(source,sourceFile);
