'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../../platform/i18n.js'), 'utf8');
function fixture() {
  const pending = [], storage = new Map();
  const win = { localStorage: {getItem:k=>storage.get(k), setItem:(k,v)=>storage.set(k,v)},
    fetch: url => new Promise(resolve=>pending.push({url,resolve})) };
  vm.runInNewContext(source, {window:win,localStorage:win.localStorage,fetch:win.fetch});
  return {api:win.CARANA_I18N,pending,storage};
}
for (const target of ['ar','en']) test('last choice wins over delayed French: '+target, async()=>{
  const {api,pending}=fixture();let notifications=[];api.onChange(x=>notifications.push(x));
  const first=api.setLanguage('fr-FR'),last=api.setLanguage(target);
  for(const p of pending.filter(p=>p.url.includes('ar/')))p.resolve({ok:true,json:async()=>({})});
  await last;
  for(const p of pending.filter(p=>p.url.includes('fr-FR/')))p.resolve({ok:true,json:async()=>({})});
  assert.equal((await first).superseded,true);assert.equal(api.getLang(),target);
  assert.equal(notifications.includes('fr-FR'),false);assert.equal(api.getFallbackNotice(),null);
});
test('a failed superseded pack cannot add a fallback notice to the final language',async()=>{
 const {api,pending}=fixture();const first=api.setLanguage('fr-FR'),last=api.setLanguage('ar');
 for(const p of pending.filter(p=>p.url.includes('ar/')))p.resolve({ok:true,json:async()=>({})});await last;
 for(const p of pending.filter(p=>p.url.includes('fr-FR/')))p.resolve({ok:false,status:503});await first;
 assert.equal(api.getLang(),'ar');assert.equal(api.getFallbackNotice(),null);
});
test('one failed surface is not hidden by a later successful surface',async()=>{
 const {api,pending}=fixture();api.registerSurfaces(['workbenches']);const change=api.setLanguage('fr-FR');
 pending[0].resolve({ok:false,status:503});await Promise.resolve();
 pending[1].resolve({ok:true,json:async()=>({})});await change;
 assert.equal(api.getLang(),'en');assert.equal(api.getFallbackNotice().lang,'fr-FR');
});
