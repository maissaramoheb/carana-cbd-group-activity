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
