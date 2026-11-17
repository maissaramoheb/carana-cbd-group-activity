/* CARANA Lesson 1 — Visual Learning Journey v0.7 (independent instructional adaptation).
 * Standalone concept-first diagrams: no illustrated people, logos, Annex D solutions,
 * fabricated CARANA facts or browser speech synthesis.
 * All interactions are formative, keyboard-operable and do not change course progress.
 */
(function(){
'use strict';
const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const key=(s,n)=>String(s+1).padStart(2,'0')+'-'+String(n+1).padStart(2,'0');
const node=(label,question,explain,mark)=>({label,question,explain,mark:mark||'•'});
const scenes={
'01-01':{type:'path',eyebrow:'DIAGNOSTIC DECISION PATH',title:'A request is not a diagnosis',intro:'Select each step to follow the reasoning before committing to training.',nodes:[
 node('Reported concern','What has the counterpart asked for?','A request for investigation-skills training tells us what someone proposes—not why performance is weak.','01'),
 node('Possible causes','What else might explain the problem?','Consider supervision, case-file procedures, equipment, incentives and skills. These are competing hypotheses, not established facts.','02'),
 node('Verify evidence','What would distinguish the causes?','Compare records, observed practice and perspectives from the institution before making a diagnosis.','03'),
 node('Select response','Which intervention genuinely fits?','Only then consider training or another response, in line with mandate and local ownership.','04')
]},
'01-02':{type:'lenses',eyebrow:'THREE COMPLEMENTARY ANALYTICAL LENSES',title:'One situation, three questions',intro:'Explore how each analytical lens changes what you need to find out.',nodes:[
 node('Conflict','What shapes the operating environment?','Political, economic, social, legal, technological, environmental and security dynamics influence what is possible.','C'),
 node('Response','Who is already engaged and doing what?','Understand other actors, mandates and assistance before proposing new activities.','R'),
 node('CBD','How does the counterpart function today?','Investigate institutional performance and capacity in practice, with local participation.','D')
]},
'01-03':{type:'timeline',eyebrow:'EVIDENCE TO EVALUATION',title:'A baseline makes change observable',intro:'Follow the sequence used to make later assessment credible.',nodes:[
 node('As-is baseline','What is the evidenced starting state?','Document the situation before intervention, with sources, period, method and limitations.','01'),
 node('Intervention','What change is undertaken?','Record what was actually implemented. Activities do not automatically demonstrate improved capacity.','02'),
 node('Later measurement','How will conditions be checked again?','Use comparable evidence sources and clearly document any changes in method.','03'),
 node('Comparison','Can change credibly be assessed?','Compare with the baseline before making claims about outcomes or impact.','04')
]},
'02-01':{type:'wheel',eyebrow:'PESTEL-S CONTEXT EXPLORER',title:'Seven dimensions around one policing environment',intro:'Select each dimension. The questions are analytical prompts, not findings about the fictional CARANA context.',nodes:[
 node('Political','Who authorises, supports or constrains reform?','Consider governance, decision-making authority, incentives and commitment.','P'),
 node('Economic','Which financial pressures affect practice?','Look at resources, budgets, livelihoods and long-term sustainability.','E'),
 node('Social','Who experiences the institution’s services?','Examine trust, inclusion, expectations and community relationships.','S'),
 node('Technological','Which systems enable or impede work?','Consider information flow, equipment and the reliability of technical systems.','T'),
 node('Environmental','What physical conditions affect service delivery?','Examine relevant environmental conditions and infrastructure constraints.','E'),
 node('Legal','What legal authorities and safeguards apply?','Check powers, procedures, legal traditions and rights protections.','L'),
 node('Security','How does insecurity change the context?','Examine conflict, accessibility and constraints affecting reform.','S')
]},
'02-02':{type:'tree',eyebrow:'CONFLICT TREE',title:'Distinguish drivers, the presenting issue and effects',intro:'A conceptual conflict tree reveals why treating one symptom may not resolve its drivers.',nodes:[
 node('Underlying drivers','What lies beneath the visible problem?','Incentives, exclusion, resource disputes or institutional conditions may be contributing drivers, to be verified in the setting.','ROOTS'),
 node('Presenting issue','What is actually happening now?','Describe the current tension or operational problem without mistaking it for its cause.','TRUNK'),
 node('Possible effects','What consequences might follow?','Document observed consequences and plausible escalation pathways. Do not treat predictions as facts.','BRANCHES')
]},
'02-03':{type:'gates',eyebrow:'LOCAL-FIT FILTER',title:'A good practice elsewhere is not automatically a good fit here',intro:'Explore four gates before recommending a practice from another jurisdiction.',nodes:[
 node('Lawful authority','Does host-country law permit it?','Check the legal powers, institutional mandate and required safeguards.','01'),
 node('Rights and legitimacy','Does it protect affected people?','Consider human rights, due process, accountability and public legitimacy.','02'),
 node('Local ownership','Who will own the change?','Engage counterpart leadership and practitioners; ensure local priorities and practical realities are understood.','03'),
 node('Feasibility','Can it be supported and sustained?','Consider budgets, staffing, organisational incentives and implementation conditions.','04')
]},
'03-01':{type:'orbit',eyebrow:'RESPONSE LANDSCAPE',title:'The institution is rarely starting from zero',intro:'Explore the types of actors whose existing assistance and interests should be mapped.',nodes:[
 node('National counterparts','Which host authorities are involved?','Clarify institutional responsibilities, priorities and national decision-making.','N'),
 node('UN and mission','What support already exists?','Map relevant mission efforts and mandates without assuming they all operate in one way.','U'),
 node('Bilateral and donor','What other assistance is under way?','Identify programme objectives, resources, sequencing and possible overlaps.','B'),
 node('Civil society','Who else is affected or engaged?','Listen to relevant organisations and communities, respecting context and authority.','C')
]},
'03-02':{type:'iceberg',eyebrow:'POSITION · INTEREST · NEED',title:'What is said may be only the visible layer',intro:'Reveal the three layers of a PIN analysis. They are hypotheses to explore, never assumptions about a person.',nodes:[
 node('Position','What has the actor explicitly said?','Record the publicly stated request or viewpoint without embellishment.','VISIBLE'),
 node('Interest','What goal might motivate that position?','Explore potential priorities or incentives through respectful dialogue and evidence.','EXPLORE'),
 node('Need','What fundamental requirement may underlie it?','Consider legitimate security, recognition, resources or institutional conditions. Validate rather than infer.','VERIFY')
]},
'03-03':{type:'overlap',eyebrow:'COORDINATION AND UNINTENDED HARM',title:'Two good programmes can still compete for one team',intro:'Examine the two programme streams, then reveal the coordination bridge.',nodes:[
 node('Programme A','What is Programme A already delivering?','Verify objectives, participants, schedule, dependencies and resource demands.','A'),
 node('Programme B','Where might Programme B duplicate effort?','Compare intended beneficiaries, outcomes, dates and reporting demands with existing assistance.','B'),
 node('Coordination bridge','What changes when partners coordinate?','With counterpart agreement, align needs, sequencing and information-sharing to reduce duplication and fatigue.','↔')
]},
'04-01':{type:'tiers',eyebrow:'THREE LEVELS OF CAPACITY',title:'Performance is shaped by more than individual skills',intro:'Explore three analytical levels before attributing a weakness to staff training.',nodes:[
 node('Enabling environment','Which external conditions shape the mandate?','Consider legal frameworks, policy constraints, political context and wider resources.','03'),
 node('Institution / unit','Which organisational systems affect practice?','Investigate supervision, processes, accountability, staffing and logistics.','02'),
 node('Practitioner','What can staff do in real working conditions?','Examine individual competencies and behaviour, while recognising organisational constraints.','01')
]},
'04-02':{type:'triangle',eyebrow:'EVIDENCE TRIANGULATION',title:'Three sources. One more defensible finding.',intro:'Select each source and see what it contributes—and what it cannot establish alone.',nodes:[
 node('Interviews','What do different people report?','Ask staff and supervisors about actual procedures; statements require corroboration.','I'),
 node('Observation','What happens in practice?','Observe work in context, with permission and safeguards; one visit may not be representative.','O'),
 node('Records','What do work products show?','Review file samples, registers or reports for documented practice and exceptions.','R')
]},
'04-03':{type:'quadrant',eyebrow:'POWER / INTEREST MATRIX',title:'Choose engagement proportionate to power and interest',intro:'The horizontal axis is interest; the vertical axis is influence. Explore each quadrant.',nodes:[
 node('High influence · lower interest','Maintain appropriate engagement','Monitor key decisions, understand barriers and consult when necessary.','H/L'),
 node('High influence · high interest','Engage closely','Involve relevant decision-makers appropriately and revisit changing positions.','H/H'),
 node('Lower influence · lower interest','Monitor and keep access open','Do not dismiss perspectives or assume influence and interest are fixed.','L/L'),
 node('Lower influence · high interest','Listen and involve','Affected groups may have essential information despite limited formal influence.','L/H')
]},
'05-01':{type:'pillars',eyebrow:'FIVE CBD CAPACITY AREAS',title:'Institutional capacity has five connected areas',intro:'Explore each area before deciding where a verified issue belongs.',nodes:[
 node('Police services','How well are core policing services delivered?','Consider professional policing practice, command and control and actual service performance.','01'),
 node('Enabling services','Which support systems enable delivery?','Investigate staffing, training systems, finance, logistics and other administrative support.','02'),
 node('Police policy formulation','How is institutional policy developed?','Examine how rules and guidance are formulated and maintained.','03'),
 node('Accountability mechanisms','How is conduct and performance reviewed?','Consider responsibility, internal review, oversight and answerability.','04'),
 node('Stakeholder engagement','How does the institution engage others?','Examine working relationships, participation and relevant external interaction.','05')
]},
'06-02':{type:'compare',eyebrow:'AS-IS BASELINE ≠ FUTURE TARGET',title:'Keep observed reality separate from desired results',intro:'The illustration uses invented teaching numbers, not actual CARANA findings.',nodes:[
 node('As-is evidence','What was verified before change?','Illustrative only: 12 of 40 sampled files recorded a supervisory review in a specified period. The baseline is a measured starting point, with stated limitations.','12 / 40'),
 node('Desired future','What would an agreed result look like?','A target is set through later planning. It must not be substituted for observed baseline evidence.','TO-BE'),
 node('Comparable measure','Can the same indicator be tracked later?','Document the sampling frame, reporting period, definitions and verification method so outcomes can be compared.','METHOD')
]},
'06-03':{type:'route',eyebrow:'YOUR NEXT STEP IS AN EVIDENCE-LED WORKBENCH',title:'Carry findings into the CARANA activity',intro:'Explore the handover from analysis to practical planning. The example does not disclose exercise answers.',nodes:[
 node('Context','What broader conditions matter?','Bring forward verified conflict-environment observations.','01'),
 node('Responses','Who is already involved?','Map actors, objectives, overlaps, stakeholder interest and influence.','02'),
 node('Institution','What does the counterpart do?','Document capacity issues across relevant areas and dimensions.','03'),
 node('Synthesis','What findings are defensible?','Ground SWOT and an as-is baseline in the available evidence.','04'),
 node('Workbench','How will you practise?','Apply the analytical tools to the fictional CARANA exercise before selecting future objectives.','05')
]}
};
const exercises={
'05-03':{
 type:'classify',eyebrow:'CLASSIFY AN INSTITUTIONAL ISSUE',title:'Move from an observation to its primary CBD area',
 intro:'Practice with invented examples. These are not CARANA exercise findings or Annex D solutions.',
 options:['Police services','Enabling services','Police policy formulation','Accountability mechanisms','Stakeholder engagement'],
 cases:[
  ['Repeated procurement delays prevent replacement of essential office equipment.',1,'The immediate issue concerns procurement and logistics: enabling services. A fuller assessment can identify related dimensions.'],
  ['Complaint review decisions are not consistently documented or communicated internally.',3,'The primary issue concerns review and answerability: accountability mechanisms. Confirm it with evidence before final classification.'],
  ['No routine consultation channel exists for community representatives affected by the service.',4,'The primary issue concerns institutional relationships and participation: stakeholder engagement.']
 ]
},
'06-01':{
 type:'swot',eyebrow:'EVIDENCE-LED SWOT SORTING',title:'Classify the evidence, not your first impression',
 intro:'Choose the quadrant for each invented observation. Strengths and weaknesses are internal; opportunities and threats are external.',
 options:['Strength · internal','Weakness · internal','Opportunity · external','Threat · external'],
 cases:[
  ['A documented case-review procedure is consistently followed by the unit.',0,'A functioning internal practice is a strength, once evidence supports the claim.'],
  ['Case-file tracking inside the unit remains inconsistent across shifts.',1,'An internal performance constraint is a weakness, not an external threat.'],
  ['An external partner offers a new coordination platform that may support the institution.',2,'A potentially favourable external condition is an opportunity, subject to verification.'],
  ['Insecurity prevents access to several outlying service areas.',3,'An adverse external security condition is a threat to service delivery.']
 ]
}};
function head(e){
 return '<div class="vj-heading"><span class="vj-eyebrow">'+esc(e.eyebrow)+'</span><h2>'+esc(e.title)+'</h2><p>'+esc(e.intro)+'</p></div>';
}
function sceneHTML(id,e){
 const body='<div class="vj-nodes vj-'+esc(e.type)+'" role="group" aria-label="'+esc(e.title)+'">'+
  e.nodes.map((n,i)=>'<button type="button" class="vj-node" data-vj-item="'+i+'" aria-pressed="false">'+
    '<span class="vj-node-mark" aria-hidden="true">'+esc(n.mark)+'</span><span class="vj-node-label">'+esc(n.label)+'</span></button>').join('')+
   ((e.type==='wheel'||e.type==='triangle'||e.type==='orbit'||e.type==='overlap')?'<div class="vj-center" aria-hidden="true">'+(e.type==='wheel'?'OPERATING<br>CONTEXT':e.type==='triangle'?'COMPARE<br>EVIDENCE':e.type==='orbit'?'POLICE<br>COUNTERPART':'SHARED<br>TEAM')+'</div>':'')+'</div>';
 return '<section class="vj-stage" aria-label="Interactive explanatory visual">'+head(e)+body+
  '<div class="vj-result" id="vj-result" role="status" aria-live="polite"><strong>Choose one part of the illustration</strong><p>Reveal its analytical question and meaning.</p></div>'+
  '<div class="vj-foot"><span>Explore the diagram, then continue with the lesson.</span><span id="vj-count">0 of '+e.nodes.length+' explored</span></div></section>';
}
function exerciseHTML(id,e){
 return '<section class="vj-stage vj-exercise" aria-label="Interactive classification exercise">'+head(e)+
  '<div class="vj-case"><span id="vj-case-number">EXAMPLE 1 OF '+e.cases.length+'</span><strong id="vj-case-text">'+esc(e.cases[0][0])+'</strong></div>'+
  '<div class="vj-answers '+(e.type==='swot'?'vj-swot':'vj-classify')+'" role="group" aria-label="Choose a classification">'+e.options.map((o,i)=>'<button type="button" class="vj-answer" data-vj-answer="'+i+'" aria-pressed="false"><span class="vj-answer-tag">'+(e.type==='swot'?['S','W','O','T'][i]:String(i+1).padStart(2,'0'))+'</span>'+esc(o)+'</button>').join('')+'</div>'+
  '<div class="vj-result" id="vj-result" role="status" aria-live="polite"><strong>Make a classification</strong><p>Choose one option to reveal source-aware feedback.</p></div>'+
  '<div class="vj-foot"><span>Formative practice · Not an official CARANA answer key</span><button type="button" class="vj-next" id="vj-next" hidden>Next example →</button></div></section>';
}
function html(section,screen){
 const id=key(section,screen);
 const e=scenes[id]||exercises[id];
 return e?(e.cases?exerciseHTML(id,e):sceneHTML(id,e)):'';
}
function mount(section,screen){
 const id=key(section,screen),e=scenes[id]||exercises[id];
 const root=document.querySelector('.vj-stage');
 if(!root||!e)return;
 const response=root.querySelector('#vj-result');
 if(e.cases){
  let current=0,answered=false;
  const answers=[...root.querySelectorAll('[data-vj-answer]')];
  const next=root.querySelector('#vj-next'),label=root.querySelector('#vj-case-number'),question=root.querySelector('#vj-case-text');
  const choose=index=>{
   const c=e.cases[current],correct=index===c[1];answered=true;
   answers.forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===index));b.classList.toggle('chosen',i===index);});
   response.classList.toggle('vj-good',correct);
   response.classList.toggle('vj-reflect',!correct);
   response.innerHTML='<strong>'+(correct?'A defensible classification.':'Look again at the analytical boundary.')+'</strong><p>'+esc(c[2])+'</p>';
   if(current<e.cases.length-1){next.hidden=false;next.textContent='Next example →';}
   else {next.hidden=true;}
  };
  answers.forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.vjAnswer))));
  next.addEventListener('click',()=>{
   if(!answered||current>=e.cases.length-1)return;
   current++;answered=false;next.hidden=true;
   answers.forEach(b=>{b.setAttribute('aria-pressed','false');b.classList.remove('chosen')});
   response.className='vj-result';
   response.innerHTML='<strong>Make a classification</strong><p>Choose one option to reveal why it fits.</p>';
   label.textContent='EXAMPLE '+(current+1)+' OF '+e.cases.length;
   question.textContent=e.cases[current][0];
  });
  return;
 }
 const selected=new Set();
 const buttons=[...root.querySelectorAll('[data-vj-item]')];
 const count=root.querySelector('#vj-count');
 buttons.forEach(button=>button.addEventListener('click',()=>{
  const i=Number(button.dataset.vjItem),n=e.nodes[i];if(!n)return;
  selected.add(i);
  buttons.forEach((b,j)=>{b.classList.toggle('chosen',j===i);b.setAttribute('aria-pressed',String(j===i))});
  response.innerHTML='<strong>'+esc(n.question)+'</strong><p>'+esc(n.explain)+'</p>';
  count.textContent=selected.size+' of '+buttons.length+' explored';
 }));
}
window.CARANA_VISUAL_JOURNEY={html,mount,scenes,exercises};
})();
