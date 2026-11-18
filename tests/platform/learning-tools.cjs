const {test}=require('node:test'),assert=require('node:assert/strict');
const tools=require('../../platform/learning-tools.js');
const lessons=['lessons-2-3','lessons-4-6'].flatMap(f=>require('../../curricula/cbd/'+f+'.json'));
test('drafts retain only bounded fields owned by the actual exercise',()=>{
 const b={type:'builder',fields:[{label:'one'},{label:'two'}]};
 assert.deepEqual(tools.validDraft(b,{0:'a'.repeat(1300),1:19,extra:'discard'}),{0:'a'.repeat(1200)});
 assert.deepEqual(tools.validDraft(b,null),{});
 const c={type:'classify',categories:['a','b'],items:[{},{}]};
 assert.deepEqual(tools.validDraft(c,{0:1,1:2,extra:0}),{0:1});
 assert.deepEqual(tools.validDraft({type:'risk'},{likelihood:Infinity,impact:3}),{impact:3});
});
test('changing weights changes the illustrative ranking without dropping constraints',()=>{
 const x=lessons[0].sections.flatMap(s=>s.screens).find(s=>s.lab?.type==='priority').lab;
 const first=tools.rank(x,[5,1,1,1]),second=tools.rank(x,[1,1,1,5]);
 assert.notEqual(first[0].label,second[0].label);
 assert(first.every(r=>r.constraint));
 assert.equal(first[0].score,21);
});
test('authored tool HTML escapes content rather than interpreting it as markup',()=>{
 const html=tools.html({type:'builder',title:'<img src=x>',context:'<script>bad</script>',fields:[{label:'<b>label</b>',prompt:'& hint'}],example:'example',review:'review',debrief:'debrief'});
 assert(!html.includes('<img src=x>'));assert(html.includes('&lt;img src=x&gt;'));
 assert(!html.includes('<script>bad'));assert(html.includes('&amp; hint'));
});
test('E14: priority ranking exposes ties explicitly and pauses numeric ordering when all weights are zero',()=>{
 const synth={type:'priority',criteria:['A','B'],alternatives:[{label:'Alpha',ratings:[2,2],constraint:'Req A'},{label:'Beta',ratings:[1,3],constraint:'Req B'},{label:'Gamma',ratings:[1,1],constraint:'Req C'}]};
 const tiedSummary=tools.summarizePriority(synth,[1,1]);
 assert.equal(tiedSummary.hasTies,true);
 assert.equal(tiedSummary.ranked[0].rankPosition,1);
 assert.equal(tiedSummary.ranked[1].rankPosition,1);
 assert.equal(tiedSummary.ranked[1].tied,true);
 assert.equal(tiedSummary.ranked[2].rankPosition,3);
 assert.equal(tiedSummary.ranked[2].tied,false);
 assert.match(tiedSummary.text,/Tie at rank #1/);
 const zeroSummary=tools.summarizePriority(synth,[0,0]);
 assert.equal(zeroSummary.allZero,true);
 assert.match(zeroSummary.text,/paused/i);
 assert(!zeroSummary.text.includes('weighted points'));
 assert.deepEqual(tools.validDraft(synth,{0:2,snapshot:[1,9]}),{0:2});
 assert.deepEqual(tools.validDraft(synth,{0:2,snapshot:[1,4]}),{0:2,snapshot:[1,4]});
});
test('E15: risk validation and analysis distinguish response strategies and asymmetric likelihood/impact pairs',()=>{
 assert.deepEqual(tools.validDraft({type:'risk'},{likelihood:1,impact:3,strategy:'contingency'}),{likelihood:1,impact:3,strategy:'contingency'});
 assert.deepEqual(tools.validDraft({type:'risk'},{likelihood:2,impact:2,strategy:'unknown_hack'}),{likelihood:2,impact:2});
 const r13=tools.formatRiskAnalysis(1,3,'contingency');
 assert.match(r13,/severe consequence/i);
 assert.match(r13,/\(1,3\) differs from \(3,1\)/);
 assert.match(r13,/Prepare contingency & escalation trigger/);
});
