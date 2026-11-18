const {test}=require('node:test'),assert=require('node:assert/strict'),validate=require('../../tools/validate-content.cjs');
test('additional CBD lessons have variable source-mapped sections, media specifications and assessments',()=>{
 assert.deepEqual(validate(),{lessons:5,screens:32,quizzes:42});
});
test('sponsor budget reconciles every item and demo uses the same totals',()=>{
 const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'../..');
 const budget=JSON.parse(fs.readFileSync(path.join(root,'docs/institutional/budget-model.json')));
 const demo=fs.readFileSync(path.join(root,'platform/demo.html'),'utf8');
 for(const s of budget.scenarios){
  let total=0;for(const i of s.items){assert.equal(i.unitRateUSD*i.quantity,i.subtotalUSD);total+=i.subtotalUSD;}
  assert.equal(s.subtotalUSD,total);
  assert.equal(s.totalUSD,Math.round(total*1.1));
  assert(demo.includes('$'+s.totalUSD.toLocaleString('en-US')));
 }
});
