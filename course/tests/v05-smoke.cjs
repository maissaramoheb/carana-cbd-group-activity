/* CARANA CBD E-Learning · v0.5 data and safeguard regression checks.
 * Run from repository root: node course/tests/v05-smoke.cjs
 * No external packages, internet access, audio provider, or credentials needed.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const context={window:{},document:{getElementById(){return null}}};
let checked=0;
const ok=(condition,message)=>{assert(condition,message);checked++};
for(const p of ['lesson1-data.js','lesson1-experience.js','lesson1-audio-manifest.js','lesson1-player.js','lesson1-labs.js']){
  const content=read(p);new Function(content);vm.runInNewContext(content,context,{filename:p});
  checked++;
}
const lesson=context.window.CARANA_LESSON1;
const experience=context.window.CARANA_EXPERIENCE_V05;
const tools=context.window.CARANA_LESSON1_LABS;
const html=read('index.html');
const app=read('app.js');
const player=read('lesson1-player.js');
ok(lesson.sections.length===6,'Expected six CBD analysis blocks');
ok(lesson.sections.every(s=>s.screens.length===3),'Expected 18 teaching screens');
ok(lesson.sections.every(s=>s.quiz.length===6),'Expected six checkpoint questions per block');
ok(lesson.sections.every(s=>s.quiz.every(q=>q.answer>=0&&q.answer<q.options.length)),'Quiz answer indexes valid');
ok(lesson.sections.every(s=>s.screens.every(screen=>screen.sourcePage&&screen.points.length>0)),'Every screen has documented curricular source page');
const tracks=experience.narration.tracks;
ok(tracks.length===18,'Expected 18 English narration scripts');
ok(tracks.every(t=>typeof t.script==='string'&&t.script.trim().split(/\s+/).length>=65),'Scripts are nontrivial English trainer explanations');
ok(new Set(tracks.map(t=>t.id)).size===18,'Narration IDs unique');
ok(tracks.every(t=>t.src===null),'Audio is correctly marked pending: no unapproved audio files');
ok(experience.narration.language===undefined||experience.language==='en','English is current narration language');
ok(Object.keys(context.window.CARANA_LESSON1_AUDIO_MANIFEST).length===0,'Audio manifest intentionally empty until recordings approved');
ok(experience.decisions.length===7,'Expected seven formative applied decisions');
ok(experience.decisions.every(d=>d.options.length>=3&&Number.isInteger(d.best)&&d.best<d.options.length),'Formative decisions have valid feedback and answer keys');
ok(tools.areas.length===5&&tools.dimensions.length===6,'Five institutional areas by six cross-cutting dimensions');
ok(!/speechSynthesis|SpeechSynthesisUtterance/.test(player),'No unapproved robotic browser synthesis');
ok(!/Annex D outcome|facilitator.*answer/i.test(experience.narration.tracks.map(t=>t.script).join(' ')),'Scripts do not refer to facilitator answer keys');
ok(html.indexOf('lesson1-experience.js')<html.indexOf('lesson1-player.js')&&html.indexOf('lesson1-player.js')<html.indexOf('lesson1-labs.js')&&html.indexOf('lesson1-labs.js')<html.indexOf('app.js'),'Correct script load order');
ok(html.includes('experience.css')&&html.includes('labs.css'),'Component styles included');
ok(app.includes('experience.narrationHTML(section,screen)')&&app.includes('learningLab.html(section,screen)'),'Teaching screens integrate narration and labs');
ok(app.includes("const KEY = 'carana_cbd_course_v1'")&&app.includes("const LAB_KEY = 'carana_cbd_lab_v1'"),'Lesson and original activity storage remain separate');
ok(app.includes('6 out of 6 correct'),'Checkpoint gating retained');
for(const file of ['app.js','lesson1-data.js','lesson1-experience.js','lesson1-player.js','lesson1-labs.js','lesson1-audio-manifest.js']){new Function(read(file));checked++;}
console.log('CARANA CBD v0.5 smoke PASS · '+checked+' assertions');
