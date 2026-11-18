/* Shared preview runtime. It deliberately does not mutate Lesson 1's legacy state. */
(function(){
'use strict';
const catalog=window.CARANA_CATALOG, root=document.getElementById('app');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parameters=new URLSearchParams(location.search);
const course=catalog.find(x=>x.id===parameters.get('course'));
const ref=course?.lessons.find(x=>x.id===parameters.get('lesson'));
const key='carana_learning_v1';
const attempts=new Map();
const learningTools=window.CARANA_LEARNING_TOOLS;
let lesson, state, selected=0, index=0, quiz=false, answers={}, checked=false, storageFailed=false, ready=false;
const initial=()=>({version:1,lessons:{}});
function load(){
 try {
  const raw=JSON.parse(localStorage.getItem(key));
  if(raw?.version!==1 || !raw.lessons || typeof raw.lessons!=='object' || Array.isArray(raw.lessons)) return initial();
  return {version:1,lessons:raw.lessons};
 }catch(_){return initial();}
}
let store=load();
function safeProgress(data){
 const raw=store.lessons[data.id];
 const previous=Array.isArray(raw?.previousProgress)?raw.previousProgress.filter(p=>typeof p?.contentVersion==='string'&&Array.isArray(p.completed)).slice(-4):[];
 const oldRecord=raw&&typeof raw.contentVersion==='string'&&Array.isArray(raw.completed)?{
  contentVersion:raw.contentVersion.slice(0,80),completed:raw.completed.filter(n=>Number.isInteger(n)&&n>=0&&n<100),
  section:Number.isInteger(raw.section)?raw.section:0,screen:Number.isInteger(raw.screen)?raw.screen:0}:null;
 if(!raw || raw.contentVersion!==data.version) return {contentVersion:data.version,completed:[],section:0,screen:0,drafts:{},previousProgress:oldRecord?[...previous,oldRecord].slice(-5):previous};
 const completed=[];
 while(completed.length<data.sections.length && Array.isArray(raw.completed) && raw.completed.includes(completed.length))completed.push(completed.length);
 const section=Number.isInteger(raw.section)&&raw.section>=0?Math.min(raw.section,completed.length,data.sections.length-1):0;
 const screen=Number.isInteger(raw.screen)&&raw.screen>=0?Math.min(raw.screen,data.sections[section].screens.length-1):0;
 const drafts={};
 for(const part of data.sections)for(const item of part.screens)if(item.lab&&learningTools)drafts[item.id]=learningTools.validDraft(item.lab,raw.drafts?.[item.id]);
 return {contentVersion:data.version,completed,section,screen,drafts,previousProgress:previous};
}
function save(){
 state.section=selected;state.screen=index;store.lessons[lesson.id]=state;
 try{localStorage.setItem(key,JSON.stringify(store));storageFailed=false;}catch(_){storageFailed=true;}
 const el=document.getElementById('save-status');if(el)el.textContent=storageFailed?'Could not save progress. Export before closing.':'Progress saved in this browser.';
}
function focus(){const h=root.querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}window.scrollTo({top:0});}
function exportProgress(){
 const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),progress:store,note:'Formative browser-local record; no certificate or demonstrated competence.'},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='carana-learning-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function catalogHTML(){
 if(!course) {
  root.innerHTML='<span class="eyebrow">Professional practice · connected learning</span><h1>From understanding a situation to improving practice.</h1><p class="lead">Explore source-based police learning, meaningful decisions and practical workbenches. Begin with CBD or inspect the next curriculum pathways.</p><div class="banner">Independent learning environment. Institutional approval, curriculum permissions and field validation are pending. No compulsory account.</div><div class="cards">'+catalog.map(c=>'<article class="card"><span class="eyebrow">'+esc(c.short)+'</span><h2>'+esc(c.title)+'</h2><p>'+esc(c.description)+'</p><p class="status">'+esc(c.status)+'</p><a class="action" href="'+esc(c.href)+'">Explore '+esc(c.short)+'</a></article>').join('')+'</div><a href="./demo.html">View the institutional demonstration →</a>';return;
 }
 const available=course.lessons.length;
 root.innerHTML='<a href="./">← All curricula</a><h1>'+esc(course.title)+'</h1><p class="lead">'+esc(course.description)+'</p><div class="banner">'+esc(course.status)+'. '+esc(course.source)+'.</div>'+
 (available?'<p>Each lesson can be explored independently. Checkpoints guide study within a lesson; screen completion is not demonstrated workplace competence. Lesson 1 retains its own saved progress.</p><div class="lesson-list">'+course.lessons.map(l=>'<article class="panel lesson-row"><span class="number">'+l.number+'</span><div><h2>'+esc(l.title)+'</h2><p class="status">'+esc((!!l.version&&store.lessons[l.id]?.contentVersion===l.version&&Array.isArray(store.lessons[l.id].completed) ? store.lessons[l.id].completed.length+' checkpoints recorded · ' : '')+(l.status||'Review adaptation · transcript available · recording and expert validation pending'))+'</p></div><a class="action" href="'+esc(l.href||'./?course='+course.id+'&lesson='+l.id)+'">'+(l.href?'Open Lesson 1':!!l.version&&store.lessons[l.id]?.contentVersion===l.version?'Resume / review lesson':'Explore lesson')+'</a></article>').join('')+'</div>':
 '<section class="panel"><h2>Sources verified; conversion not yet released.</h2><p>The official 2023 curriculum has been inventoried. No complete digital course is claimed here. Content review, activity integration, media and learner validation remain separate work.</p><p><a href="./demo.html#partnership">Explore the conversion programme</a></p></section>');
}
function layout(content) {
 root.innerHTML='<div class="workspace"><aside class="rail panel"><a href="./?course='+esc(course.id)+'">← '+esc(course.short)+' lessons</a><h2>Lesson '+lesson.number+'</h2><p>'+esc(lesson.title)+'</p><nav aria-label="Lesson sections">'+lesson.sections.map((s,i)=>'<button type="button" data-section="'+i+'" '+(i>state.completed.length?'disabled':'')+' '+(i===selected?'aria-current="step"':'')+'>'+esc((state.completed.includes(i)?'✓ ':'')+s.title)+'</button>').join('')+'</nav><p class="status">'+state.completed.length+' / '+lesson.sections.length+' checkpoints passed</p><button id="export-progress">Export progress</button><p class="status" id="save-status" role="status">'+(storageFailed?'Could not save progress. Export before closing.':'Progress stays in this browser.')+'</p></aside><article class="screen">'+content+'</article></div>';
 root.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{selected=+b.dataset.section;index=0;quiz=false;answers={};checked=false;save();render();focus();});
 document.getElementById('export-progress').onclick=exportProgress;
}
function render(){
 const section=lesson.sections[selected];
 const count=lesson.sections.reduce((n,s)=>n+s.screens.length,0);
 const ordinal=lesson.sections.slice(0,selected).reduce((n,s)=>n+s.screens.length,0)+index+1;
 const banner=(state.previousProgress?.length?'<p class="version-note">This lesson has been revised. Earlier checkpoint records are retained in your export; review the updated material to record the new checkpoints.</p>':'')+'<p class="status">REVIEW ADAPTATION · English transcript · Independent, not UN-endorsed</p>';
 if(quiz){renderQuiz(section,banner);return;}
 const screen=section.screens[index];
 layout(banner+'<div class="progress"><span>'+esc(section.title)+'</span><span>Screen '+ordinal+' of '+count+'</span><progress value="'+ordinal+'" max="'+count+'" aria-label="Current screen"></progress></div><h1>'+esc(screen.title)+'</h1><p class="lead">'+esc(screen.lead)+'</p>'+
 (selected===0&&index===0?'<details open><summary>Learning orientation</summary><ul>'+lesson.objectives.map(o=>'<li>'+esc(o)+'</li>').join('')+'</ul><p>Explore the relationships, make a decision, check your understanding and apply your own reasoning in the original practical activity. English text is the current review language.</p></details>':'')+
 '<div class="visual" data-kind="'+esc(screen.visual.kind||'explore')+'"><span class="eyebrow">Explore the relationship</span><h2>'+esc(screen.visual.title)+'</h2><div class="nodes">'+screen.visual.nodes.map((n,i)=>'<button data-node="'+i+'" aria-pressed="false">'+esc(n.label)+'</button>').join('')+'</div><div id="concept-feedback" class="reveal" role="status">Select a component to explore its meaning and relationship to the whole.</div></div>'+
 (screen.worked?'<div class="worked-contrast"><div><h3>Initial proposal</h3><p>'+esc(screen.worked.before)+'</p><p class="status">'+esc(screen.worked.beforeWhy)+'</p></div><div class="improved"><h3>A more defensible approach</h3><p>'+esc(screen.worked.after)+'</p><p class="status">'+esc(screen.worked.afterWhy)+'</p></div></div>':'')+
 '<ul class="points">'+screen.points.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ul>'+
 '<details><summary>Read the trainer explanation</summary><p class="transcript">'+esc(screen.transcript)+'</p><p class="status">Recording pending review. No synthetic playback has been substituted.</p></details>'+
 (screen.lab&&learningTools?learningTools.html(screen.lab):'')+
 '<section class="decision"><span class="eyebrow">Decide · invented teaching example</span><h2>'+esc(screen.decision.prompt)+'</h2><div class="choices">'+screen.decision.options.map((o,i)=>'<button data-choice="'+i+'" aria-pressed="false">'+esc(o.label)+'</button>').join('')+'</div><div id="decision-feedback" class="feedback" role="status" hidden></div></section>'+
 '<div class="banner"><strong>Carry this forward</strong><p>'+esc(screen.takeaway)+'</p></div><p class="status">Source: '+esc(lesson.source.file)+' · printed pages '+esc(screen.sourcePages)+'.</p>'+
 '<div class="actions"><button id="back" '+(selected===0&&index===0?'disabled':'')+'>← Back</button><button id="next" class="primary">'+(index===section.screens.length-1?'Knowledge checkpoint →':'Continue →')+'</button></div>');
 if(screen.lab&&learningTools)learningTools.mount(screen.lab,state.drafts?.[screen.id],draft=>{state.drafts=state.drafts||{};state.drafts[screen.id]=draft;save();});
 root.querySelectorAll('[data-node]').forEach(b=>b.onclick=()=>{
  root.querySelectorAll('[data-node]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));
  document.getElementById('concept-feedback').textContent=screen.visual.nodes[+b.dataset.node].detail;
 });
 root.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{
  root.querySelectorAll('[data-choice]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));
  const i=+b.dataset.choice,el=document.getElementById('decision-feedback');el.hidden=false;
  el.className='feedback'+(i===screen.decision.answer?'':' warning');
  el.textContent=(i===screen.decision.answer?'A defensible choice. ':'Consider the implications. ')+screen.decision.options[i].feedback;
 });
 document.getElementById('next').onclick=()=>{if(index<section.screens.length-1)index++;else{quiz=true;if(!attempts.has(selected))attempts.set(selected,{});answers=attempts.get(selected);checked=false;}save();render();focus();};
 document.getElementById('back').onclick=()=>{if(index)index--;else{selected--;index=lesson.sections[selected].screens.length-1;}save();render();focus();};
}
function renderQuiz(section,banner) {
 if(state.completed.includes(selected)){
  const last=selected===lesson.sections.length-1;
  layout(banner+'<span class="eyebrow">Checkpoint passed</span><h1>'+esc(last?'Carry your work into practice.':'Understanding checked.')+'</h1><p>You corrected all '+section.quiz.length+' questions. This records guided study, not professional certification.</p>'+
  (last?'<p>Apply your own analysis in the original practical activity, and ask a peer or facilitator to challenge your reasoning. The digital checkpoint does not assess your workbench output.</p><a class="action primary" href="'+esc(lesson.activity)+'" target="_blank" rel="noopener noreferrer">Open original Lesson '+lesson.number+' activity ↗</a><p class="status">Cinematic artwork is specified for this lesson; new images and narration are pending authorised production and review.</p>':'')+
  (last&&lesson.number<6?'<p><a class="action" href="./?course=cbd&lesson=cbd-'+(lesson.number+1)+'">Continue to Lesson '+(lesson.number+1)+' →</a></p>':'')+'<div class="actions"><button id="review">Review this section</button>'+(last?'<a class="action" href="./?course='+course.id+'">Return to CBD catalog</a>':'<button id="continue" class="primary">Next section →</button>')+'</div>');
  document.getElementById('review').onclick=()=>{quiz=false;index=0;render();focus();};
  if(!last)document.getElementById('continue').onclick=()=>{selected++;index=0;quiz=false;answers={};checked=false;save();render();focus();};
  return;
 }
 layout(banner+'<span class="eyebrow">Formative knowledge checkpoint</span><h1>'+esc(section.title)+'</h1><p>Correct all '+section.quiz.length+' questions to continue. Retry without penalty. This is the adaptation’s study rule, not an official UN qualification standard.</p><form id="quiz">'+section.quiz.map((q,i)=>'<fieldset><legend>'+esc(q.prompt)+'</legend>'+q.options.map((option,j)=>'<label class="choice"><input type="radio" name="q'+i+'" value="'+j+'" '+(answers[i]===j?'checked':'')+'><span>'+esc(option)+'</span></label>').join('')+(checked&&answers[i]!==q.answer?'<p class="quiz-hint">'+esc((q.optionFeedback?.[answers[i]]||'')+' '+q.feedback)+'</p>':'')+'</fieldset>').join('')+'</form><p id="quiz-status" role="status">'+(checked?'Review the feedback and correct the remaining answers.':'Select an answer for every question.')+'</p><div class="actions"><button id="review">Review learning screens</button><button id="check" class="primary">Check answers</button></div>');
 root.querySelectorAll('#quiz input').forEach(inp=>inp.onchange=()=>answers[+inp.name.slice(1)]=+inp.value);
 document.getElementById('review').onclick=()=>{quiz=false;render();focus();};
 document.getElementById('check').onclick=()=>{
  const missing=section.quiz.some((_,i)=>answers[i]===undefined);
  if(missing){document.getElementById('quiz-status').textContent='Answer every question before checking.';return;}
  checked=true;
  if(section.quiz.every((q,i)=>answers[i]===q.answer)){state.completed=[...new Set([...state.completed,selected])].sort((a,b)=>a-b);save();}
  render();focus();
 };
}
async function start(){
 if(!ref?.file){catalogHTML();ready=true;return;}
 try{
  const response=await fetch(ref.file);if(!response.ok)throw Error('Lesson file unavailable.');
  const data=await response.json();lesson=data.find(x=>x.id===ref.id);
  if(!lesson?.sections?.length || !lesson.sections.every(s=>s.screens?.length&&s.quiz?.length))throw Error('Lesson structure is invalid.');
  state=safeProgress(lesson);selected=state.section;index=state.screen;
  render();ready=true;
 }catch(error){
  root.innerHTML='<h1>This lesson could not open.</h1><p>Check your connection and try again. Your existing progress has not been changed.</p><a class="action" href="./?course='+esc(course.id)+'">Return to lessons</a>';
  ready=true;
 }
}
window.CARANA_PLATFORM={get lesson(){return lesson;},get ready(){return ready;}};
start();
})();
