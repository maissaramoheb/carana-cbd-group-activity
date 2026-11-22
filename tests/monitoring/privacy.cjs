'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const code=fs.readFileSync('js/monitoring.js','utf8');
test('shipped configuration prohibits metered Web Analytics collection',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync('js/monitoring-config.js','utf8'),context);
 assert.equal(context.window.CARANA_MONITORING_CONFIG.webAnalytics,false);
 assert(Object.isFrozen(context.window.CARANA_MONITORING_CONFIG));
});
function harness(url='https://e-learning.maissara.tech/course/?code=PRIVATE#home',config={webAnalytics:false,speedInsights:true}){
 const scripts=[],listeners={},clicks={},document={documentElement:{lang:'en'},head:{appendChild:s=>scripts.push(s)},getElementById:id=>scripts.find(s=>s.id===id),createElement:()=>({dataset:{}}),addEventListener:(n,f)=>clicks[n]=f};
 const window={location:new URL(url),CARANA_MONITORING_CONFIG:config,addEventListener:(n,f)=>listeners[n]=f};
 const context=vm.createContext({window,document,URL});vm.runInContext(code,context);return{window,scripts,listeners,context};
}
test('zero-cost configuration never initializes Web Analytics or queues educational events',()=>{
 const h=harness();assert.equal(h.window.va,undefined);assert.deepEqual(h.scripts.map(s=>s.id),['carana-speed-insights']);assert.equal(h.window.CARANA_MONITORING.event('lesson_started','cbd-1'),false);assert.equal(h.window.vaq,undefined);assert.equal(h.scripts[0].dataset.sampleRate,'0.1');
 const hook=h.window.siq[0][1];assert.equal(hook({type:'vital',url:'https://cbd.maissara.tech/course/?access_code=PRIVATE#PRIVATE'}).url,'https://e-learning.maissara.tech/cbd/home');
});
test('offline, unrelated hosts and owner-only pages never collect',()=>{
 for(const url of ['http://localhost/course/','file:///course/index.html','https://unrelated.example/course/','https://e-learning.maissara.tech/platform/review/run09/'])assert.equal(harness(url).scripts.length,0);
});
test('SDK and logical pageviews are initialized once; hash changes are handled without language duplicates',()=>{
 const h=harness(undefined,{webAnalytics:true,speedInsights:true});vm.runInContext(code,h.context);assert.equal(h.scripts.length,2);assert.equal(h.scripts[0].dataset.disableAutoTrack,'1');
 const pages=()=>h.window.vaq.filter(x=>x[0]==='pageview');assert.equal(pages().length,1);h.listeners.hashchange();assert.equal(pages().length,1);
 h.window.location.hash='#lesson-1';h.listeners.hashchange();assert.equal(pages().length,2);h.listeners['carana:lang-change']();assert.equal(pages().length,2);
 h.window.location.hash='#activities';h.listeners.hashchange();assert.equal(pages().length,3);
 assert.equal(h.scripts[1].dataset.route,'/cbd/home');
 assert.equal(h.window.siq[0][1]({route:'/cbd/home',url:'https://cbd.maissara.tech/?private=value'}).url,'https://e-learning.maissara.tech/cbd/home');
});
test('only finite names and two approved metadata properties can be sent; duplicate completion is suppressed',()=>{
 const h=harness('https://cbd.maissara.tech/platform/?lesson=cbd-3&name=PRIVATE',{webAnalytics:true});const api=h.window.CARANA_MONITORING;
 assert.equal(api.event('checkpoint_completed','cbd-3:checkpoint-1'),true);assert.equal(api.event('checkpoint_completed','cbd-3:checkpoint-1'),false);
 assert.equal(api.event('learner_answer','PRIVATE'),false);assert.equal(api.event('language_selected','PRIVATE'),false);
 const events=h.window.vaq.filter(x=>x[0]==='event');for(const e of events)assert.deepEqual(Object.keys(e[1].data).sort(),['language','target']);assert(!JSON.stringify(events).includes('PRIVATE'));
 assert.equal(api.route().path,'/cbd/lessons/cbd-3');
});
test('both aliases share fixed reporting routes without cookie, fingerprint or learner-storage access',()=>{
 for(const origin of ['https://e-learning.maissara.tech','https://cbd.maissara.tech']){
  const h=harness(origin+'/module2.html?name=PRIVATE',{webAnalytics:false,speedInsights:true});assert.equal(h.window.siq[0][1]({url:origin+'/module2.html?name=PRIVATE'}).url,origin+'/cbd/workbenches/2');
 }
});
