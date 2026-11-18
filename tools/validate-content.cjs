const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
function validate(root=path.resolve(__dirname,'..')){
 const context={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'platform/catalog.js'),'utf8'),context);
 const courses=context.window.CARANA_CATALOG;
 assert.equal(courses.length,3);
 assert.deepEqual(Array.from(courses.map(c=>c.id)),['cbd','mma','cop']);
 const lessons=['lessons-2-3.json','lessons-4-6.json'].flatMap(f=>JSON.parse(fs.readFileSync(path.join(root,'curricula/cbd',f),'utf8')));
 assert.equal(lessons.length,5);
 assert.equal(new Set(lessons.map(l=>l.id)).size,5);
 let screens=0,quizzes=0;
 for(const lesson of lessons){
  assert.match(lesson.version,/^2026/);
  assert.equal(lesson.status,'review-adaptation');
  assert(lesson.objectives.length>=3);
  assert(lesson.source.file.endsWith('.pdf'));
  assert.match(lesson.source.sha256,/^[a-f0-9]{64}$/);
  assert.equal(lesson.activity,'../../module'+lesson.number+'.html');
  assert(fs.existsSync(path.join(root,'module'+lesson.number+'.html')));
  assert(lesson.artwork.length>=2 && lesson.artwork.length<=3);
  const ids=new Set();
  for(const section of lesson.sections){
   assert(section.screens.length>0 && section.quiz.length>0);
   for(const s of section.screens){
    assert(!ids.has(s.id));ids.add(s.id);
    assert(s.sourcePages && s.lead.length>40 && s.points.length>=3 && s.takeaway.length>30);
    assert(s.transcript.split(/\s+/).length>=65,'Missing substantive transcript '+s.id);
    assert(s.visual.nodes.length>=3);
    assert(s.visual.nodes.every(n=>n.label&&n.detail.length>=15));
    assert(s.decision.options.length>=3);
    assert(Number.isInteger(s.decision.answer)&&s.decision.options[s.decision.answer]);
    assert(s.decision.options.every(o=>o.label&&o.feedback));
    screens++;
   }
   for(const q of section.quiz){
    assert(q.prompt && q.feedback && q.options.length>=3);
    assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length);
    assert.equal(new Set(q.options).size,q.options.length);
    quizzes++;
   }
  }
  for(const art of lesson.artwork)assert(ids.has(art.screenId)&&art.status==='specification-only');
 }
 for(const c of courses.slice(1))assert.equal(c.lessons.length,0,'Readiness curriculum must not be presented as an available course');
 return {lessons:lessons.length,screens,quizzes};
}
if(require.main===module)console.log('Content structure verified',validate());
module.exports=validate;
