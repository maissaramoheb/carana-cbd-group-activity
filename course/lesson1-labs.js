/* CARANA CBD Lesson 1 — interactive conceptual explorations.
 * All examples/guiding questions are independently authored learning aids.
 * Never exposes facilitator-only Annex D or claims to give model exercise answers.
 */
(function(){
'use strict';
const esc=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const key=(s,n)=>String(s+1).padStart(2,'0')+'-'+String(n+1).padStart(2,'0');
const $=id=>document.getElementById(id);
const explorations={
 '01-02':{
  eyebrow:'INTERACTIVE ANALYSIS LENSES',title:'Look at the same case through three questions',
  intro:'Select a lens to explore what you would need to know before choosing a CBD response.',
  parts:[
   ['Conflict analysis','What is happening in the wider environment?','Review political, social, legal and security conditions, recognising that institutional performance is affected by its operating context.'],
   ['Response analysis','Who is already engaged?','Identify existing support, mandates, actors and incentives. Check for complementarity, duplication and counterpart fatigue.'],
   ['CBD analysis','What does the counterpart do in practice?','Investigate police services, enabling systems, policy, accountability and engagement using interviews, observation, documents and counterpart participation.']
  ]
 },
 '02-01':{
  eyebrow:'PESTEL-S EXPLORER',title:'Seven contextual dimensions',
  intro:'Choose each dimension to reveal an analytical question. These prompts guide inquiry; they are not findings about CARANA.',
  parts:[
   ['Political','How do political incentives affect policing reform?','Ask about decision-making authority, reform commitment and influences on the counterpart.'],
   ['Economic','Which resource and livelihood pressures matter?','Consider budgets, compensation, economic conditions and realistic capacity to sustain changes.'],
   ['Social','What does the community experience?','Explore trust, expectations, exclusion, relationships and access to police services.'],
   ['Technological','What information and technical systems exist?','Review technical infrastructure and whether it supports safe, reliable practice.'],
   ['Environmental','Which physical and environmental constraints affect service delivery?','Consider climate, infrastructure and environmental conditions where relevant.'],
   ['Legal','What authorities and safeguards govern practice?','Examine statutory powers, institutional rules and protections, including different legal traditions.'],
   ['Security','How do conflict and insecurity affect institutions?','Assess threats, access and the practical effects of security conditions on reform.']
  ]
 },
 '04-03':{
  eyebrow:'STAKEHOLDER ENGAGEMENT LENS',title:'Power and interest are not the whole person',
  intro:'Explore four commonly used analytical quadrants. The purpose is proportionate, respectful engagement—not rigid classification.',
  parts:[
   ['High influence · high interest','Engage closely','Understand expectations, invite participation where appropriate and revisit changes in their position or influence.'],
   ['High influence · lower interest','Keep appropriately informed','Consider decision authority and identify when consultation or engagement becomes necessary.'],
   ['Lower influence · high interest','Listen and involve meaningfully','People affected by reform may have important knowledge even without formal authority.'],
   ['Lower influence · lower interest','Monitor and keep channels open','Interest or influence may evolve; do not assume a group is permanently irrelevant.']
  ]
 },
 '06-02':{
  eyebrow:'BASELINE VS TARGET',title:'Do not confuse where you are with where you hope to go',
  intro:'Select each record to see how evidence, targets and limitations serve different purposes.',
  parts:[
   ['Current baseline','What was observed?','Illustrative only: a documented file-review sample shows 12 of 40 files with recorded supervisory review in the stated period. The numbers are not CARANA facts.'],
   ['Future target','What result is desired?','Illustrative only: a future agreed performance target might specify a verified level of timely supervisory review. It is not an as-is observation.'],
   ['Verification method','How would you know?','Define sampling, dates, records and review methods before the intervention so comparisons can be made later.']
  ]
 }
};
const areas=[
 ['Police services','Operations, service delivery and professional policing practice'],
 ['Enabling services','Human resources, training, finance, logistics and other support systems'],
 ['Police policy formulation','Institutional policy, rules and guidance development'],
 ['Accountability mechanisms','Oversight, review, responsibility and answerability'],
 ['Stakeholder engagement','Relationships with relevant internal and external actors']
];
const dimensions=[
 ['Policing practice','Examine the quality, appropriateness and execution of operational policing practices.'],
 ['Environmental sustainability','Check environmental consequences and sustainable resource use where relevant.'],
 ['Conflict prevention','Consider whether institutional practice reduces or aggravates conflict risks.'],
 ['Human rights','Examine respect for rights, lawful powers, safeguards and accountability.'],
 ['Gender','Assess equitable treatment, participation, gender-specific effects and access.'],
 ['Comprehensive protection of civilians','Consider how practices affect the broad protection of civilians.']
];
function html(section,screen) {
 const id=key(section,screen);
 if(id==='05-02'){
  return '<section class="concept-lab matrix-lab" aria-label="Five by six CBD capacity matrix explorer"><div class="concept-lab-top"><span class="concept-lab-eyebrow">THE 5 × 6 CBD MATRIX</span><h2>Explore every intersection</h2><p>Choose a cell to connect an institutional area with a cross-cutting dimension. This is an analytical prompt, not a completed CARANA matrix.</p></div>'+
    '<div class="matrix-scroll" role="region" tabindex="0" aria-label="Scrollable five by six CBD matrix"><table class="matrix-table"><caption>Five CBD areas and six cross-cutting dimensions</caption><thead><tr><th scope="col">CBD area ↓ / Dimension →</th>'+dimensions.map((d,i)=>'<th scope="col"><span>'+String(i+1).padStart(2,'0')+'</span>'+esc(d[0])+'</th>').join('')+'</tr></thead><tbody>'+
    areas.map((a,i)=>'<tr><th scope="row">'+esc(a[0])+'</th>'+dimensions.map((d,j)=>'<td><button type="button" class="matrix-cell" data-lab-area="'+i+'" data-lab-dimension="'+j+'" aria-label="Explore '+esc(a[0])+' and '+esc(d[0])+'">+</button></td>').join('')+'</tr>').join('')+'</tbody></table></div>'+
    '<div id="lab-response" class="concept-response" role="status" aria-live="polite"><strong>Select any of the 30 intersections</strong><p>Each cell invites a different, evidence-led analytical question.</p></div></section>';
 }
 const e=explorations[id];if(!e)return '';
 return '<section class="concept-lab" aria-label="'+esc(e.eyebrow)+'"><div class="concept-lab-top"><span class="concept-lab-eyebrow">'+esc(e.eyebrow)+'</span><h2>'+esc(e.title)+'</h2><p>'+esc(e.intro)+'</p></div>'+
  '<div class="concept-options" role="group" aria-label="Explore concepts">'+e.parts.map((p,i)=>'<button type="button" class="concept-option" data-lab-option="'+i+'" aria-pressed="false"><span>'+String(i+1).padStart(2,'0')+'</span>'+esc(p[0])+'</button>').join('')+'</div>'+
  '<div id="lab-response" class="concept-response" role="status" aria-live="polite"><strong>Choose a concept to explore</strong><p>Its analytical meaning and suggested line of inquiry will appear here.</p></div></section>';
}
function mount(section,screen){
 const id=key(section,screen),reply=$('lab-response');
 if(!reply)return;
 if(id==='05-02'){
  const buttons=Array.from(document.querySelectorAll('[data-lab-area]'));
  for(const button of buttons)button.addEventListener('click',()=>{
   const i=Number(button.dataset.labArea),j=Number(button.dataset.labDimension);
   if(!areas[i]||!dimensions[j])return;
   for(const node of buttons){node.classList.toggle('selected',node===button);node.setAttribute('aria-pressed',String(node===button))}
   reply.innerHTML='<strong>'+esc(areas[i][0])+' × '+esc(dimensions[j][0])+'</strong><p>'+esc(areas[i][1])+'. '+esc(dimensions[j][1])+' Ask which verified issue, if any, genuinely belongs at this intersection.</p>';
  });
  return;
 }
 const e=explorations[id];if(!e)return;
 const buttons=Array.from(document.querySelectorAll('[data-lab-option]'));
 for(const button of buttons)button.addEventListener('click',()=>{
   const i=Number(button.dataset.labOption);if(!e.parts[i])return;
   for(const node of buttons){node.classList.toggle('selected',node===button);node.setAttribute('aria-pressed',String(node===button))}
   reply.innerHTML='<strong>'+esc(e.parts[i][1])+'</strong><p>'+esc(e.parts[i][2])+'</p>';
 });
}
window.CARANA_LESSON1_LABS={html,mount,areas,dimensions};
})();