const {chromium}=require(process.env.CBD_TEST_MODULES+'/playwright'),fs=require('node:fs');
(async()=>{const b=await chromium.launch();const records=[];
for(const target of ['/platform/?course=cbd','/course/']){
 for(let trial=1;trial<=3;trial++){
  const c=await b.newContext({viewport:{width:1366,height:900}});
  const p=await c.newPage();await p.route('https://fonts.googleapis.com/**',r=>r.abort());
  const d=await c.newCDPSession(p);await d.send('Network.enable');await d.send('Network.setCacheDisabled',{cacheDisabled:true});
  await d.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200*1024,uploadThroughput:50*1024});
  await d.send('Emulation.setCPUThrottlingRate',{rate:4});
  await p.addInitScript(()=>{window.reviewLcp=0;window.reviewCls=0;new PerformanceObserver(l=>l.getEntries().forEach(e=>window.reviewLcp=e.startTime)).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.reviewCls+=e.value})).observe({type:'layout-shift',buffered:true});});
  await p.goto(process.env.CBD_TEST_URL+target,{waitUntil:'networkidle'});
  const m=await p.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {dom:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd),lcp:Math.round(window.reviewLcp),cls:window.reviewCls,resourceBytes:performance.getEntriesByType('resource').reduce((s,r)=>s+r.transferSize,0),requests:performance.getEntriesByType('resource').length}});
  records.push({target,trial,...m});await c.close();
 }
}
fs.writeFileSync(process.env.CBD_TEST_OUTPUT+'/performance.json',JSON.stringify({conditions:'Local loopback, cold cache, 150ms emulated latency, 200KiB/s download, 4x CPU, web fonts blocked; not field CWV or a Lighthouse score',records},null,2));
console.log(records);await b.close();})().catch(e=>{console.error(e);process.exitCode=1});
