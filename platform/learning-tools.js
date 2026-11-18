/* Formative construction and reasoning tools. No text grading, remote calls or official keys. */
(function(global){
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rank(exercise,weights){
 return exercise.alternatives.map(a=>({label:a.label,score:a.ratings.reduce((n,r,i)=>n+r*Number(weights[i]??1),0),constraint:a.constraint}))
  .sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));
}
function validDraft(exercise,draft={}){
 const result={};
 if(!draft||typeof draft!=='object')return result;
 if(exercise.type==='builder')exercise.fields.forEach((f,i)=>{if(typeof draft[i]==='string')result[i]=draft[i].slice(0,1200);});
 if(exercise.type==='classify')exercise.items.forEach((_,i)=>{if(Number.isInteger(draft[i])&&draft[i]>=0&&draft[i]<exercise.categories.length)result[i]=draft[i];});
 if(exercise.type==='priority')exercise.criteria.forEach((_,i)=>{if(Number.isInteger(draft[i])&&draft[i]>=0&&draft[i]<=5)result[i]=draft[i];});
 if(exercise.type==='risk')for(const k of ['likelihood','impact'])if(Number.isInteger(draft[k])&&draft[k]>=1&&draft[k]<=3)result[k]=draft[k];
 return result;
}
function html(x){
 const prefix='<section class="applied-lab" aria-labelledby="lab-title"><span class="eyebrow">Practise · independently authored example</span><h2 id="lab-title">'+esc(x.title)+'</h2><p>'+esc(x.context)+'</p>';
 if(x.type==='builder')return prefix+'<p class="status">Use invented or non-sensitive details. Drafts stay in this browser and are included in your progress export. Text is not automatically graded.</p><div class="draft-grid">'+x.fields.map((f,i)=>'<div><label for="lab-field-'+i+'">'+esc(f.label)+'</label><p class="field-hint" id="lab-hint-'+i+'">'+esc(f.prompt)+'</p><textarea id="lab-field-'+i+'" data-field="'+i+'" maxlength="1200" rows="3" aria-describedby="lab-hint-'+i+'"></textarea></div>').join('')+'</div><button id="lab-check">Review my draft</button><div id="lab-feedback" class="feedback" role="status" hidden></div><details class="worked-example"><summary>Compare with an illustrative approach</summary><p>'+esc(x.example)+'</p><p><strong>Debrief:</strong> '+esc(x.debrief)+'</p></details></section>';
 if(x.type==='classify')return prefix+'<div class="classification">'+x.items.map((item,i)=>'<div class="classify-row"><label for="lab-class-'+i+'">'+esc(item.text)+'</label><select id="lab-class-'+i+'" data-class="'+i+'"><option value="">Choose a category</option>'+x.categories.map((c,j)=>'<option value="'+j+'">'+esc(c)+'</option>').join('')+'</select><p id="lab-item-'+i+'" class="quiz-hint" hidden></p></div>').join('')+'</div><button id="lab-check">Check my reasoning</button><div id="lab-feedback" class="feedback" role="status" hidden></div></section>';
 if(x.type==='priority')return prefix+'<p class="status">Invented ratings, not the official participant scoring chart. Move a weighting to examine sensitivity; a high total never overrides a prerequisite.</p><div class="weights">'+x.criteria.map((c,i)=>'<label>'+esc(c)+' <output id="weight-'+i+'">1</output><input aria-label="'+esc(c)+' weighting" type="range" min="0" max="5" value="1" data-weight="'+i+'"></label>').join('')+'</div><div class="table-scroll"><table><caption>Illustrative options, ratings and constraints</caption><thead><tr><th scope="col">Option</th>'+x.criteria.map(c=>'<th scope="col">'+esc(c)+'</th>').join('')+'<th scope="col">Constraint</th></tr></thead><tbody>'+x.alternatives.map(a=>'<tr><th scope="row">'+esc(a.label)+'</th>'+a.ratings.map(r=>'<td>'+r+'</td>').join('')+'<td>'+esc(a.constraint)+'</td></tr>').join('')+'</tbody></table></div><div id="priority-result" class="reveal" role="status"></div><p><strong>Discuss:</strong> '+esc(x.debrief)+'</p></section>';
 if(x.type==='risk')return prefix+'<div class="risk-inputs"><label>Likelihood<select id="risk-likelihood"><option value="1">1 · low</option><option value="2" selected>2 · medium</option><option value="3">3 · high</option></select></label><label>Impact<select id="risk-impact"><option value="1">1 · low</option><option value="2" selected>2 · medium</option><option value="3">3 · high</option></select></label></div><div id="risk-grid" class="risk-grid" aria-label="Three by three likelihood and impact matrix">'+[3,2,1].flatMap(impact=>[1,2,3].map(likelihood=>'<span data-risk="'+likelihood+'-'+impact+'">Likelihood '+likelihood+'<br>Impact '+impact+'</span>')).join('')+'</div><div id="risk-result" class="reveal" role="status"></div><p><strong>Debrief:</strong> '+esc(x.debrief)+'</p></section>';
 return '';
}
function mount(x,draft,onSave,doc=document){
 const saved=validDraft(x,draft),feedback=doc.getElementById('lab-feedback');
 if(x.type==='builder'){
  doc.querySelectorAll('[data-field]').forEach(el=>{el.value=saved[el.dataset.field]||'';el.oninput=()=>{saved[el.dataset.field]=el.value;onSave(saved);};});
  doc.getElementById('lab-check').onclick=()=>{
   const missing=x.fields.filter((f,i)=>!String(saved[i]||'').trim()).map(f=>f.label);
   feedback.hidden=false;feedback.textContent=missing.length?'Draft fields still open: '+missing.join('; ')+'. No judgement score has been assigned.':'Your draft is ready for self-review, not automatically approved. '+x.review;
  };
 }
 if(x.type==='classify'){
  doc.querySelectorAll('[data-class]').forEach(el=>{el.value=saved[el.dataset.class]??'';el.onchange=()=>{if(el.value==='')delete saved[el.dataset.class];else saved[el.dataset.class]=+el.value;onSave(saved);};});
  doc.getElementById('lab-check').onclick=()=>{
   let correct=0,unanswered=0;x.items.forEach((item,i)=>{
    const el=doc.getElementById('lab-item-'+i);el.hidden=false;
    if(saved[i]===undefined){el.textContent='Choose a category before comparing your reasoning.';unanswered++;}
    else{const ok=saved[i]===item.answer;if(ok)correct++;el.textContent=(ok?'This fits. ':'Reconsider the distinction. ')+item.feedback;}
   });
   feedback.hidden=false;feedback.textContent=unanswered?unanswered+' item(s) still need a choice.':correct+' of '+x.items.length+' classifications fit the teaching example. Explain the evidence for your choices; this does not alter checkpoint scores.';
  };
 }
 if(x.type==='priority'){
  const inputs=[...doc.querySelectorAll('[data-weight]')];
  const refresh=()=>{const weights=inputs.map(el=>+el.value);inputs.forEach((el,i)=>{doc.getElementById('weight-'+i).textContent=weights[i];saved[i]=weights[i];});
   doc.getElementById('priority-result').textContent=rank(x,weights).map(a=>a.label+': '+a.score+' weighted points. '+a.constraint).join(' ');
  };
  inputs.forEach(el=>{el.value=saved[el.dataset.weight]??1;el.oninput=()=>{refresh();onSave(saved);};});refresh();
 }
 if(x.type==='risk'){
  const likelihood=doc.getElementById('risk-likelihood'),impact=doc.getElementById('risk-impact');
  likelihood.value=saved.likelihood??2;impact.value=saved.impact??2;
  const refresh=()=>{const l=+likelihood.value,i=+impact.value;saved.likelihood=l;saved.impact=i;
   doc.querySelectorAll('[data-risk]').forEach(el=>{const active=el.dataset.risk===l+'-'+i;el.classList.toggle('selected',active);if(active)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');});
   doc.getElementById('risk-result').textContent='Selected likelihood '+l+', impact '+i+'. Illustrative product '+l*i+'; this is a discussion aid, not an authorised acceptance threshold. '+(i===3?'A severe consequence still needs attention even if unlikely.':'Consider both prevention and impact reduction, and identify who will review the response.');
  };
  for(const input of [likelihood,impact])input.onchange=()=>{refresh();onSave(saved);};refresh();
 }
}
const api={html,mount,validDraft,rank};global.CARANA_LEARNING_TOOLS=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
