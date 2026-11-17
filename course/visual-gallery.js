/* CARANA CBD: accessible visual review gallery. Only one visualization mounted at a time,
 * preserving exact original visual-journey behavior and course checkpoints.
 */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const lesson=window.CARANA_LESSON1;
 const journey=window.CARANA_VISUAL_JOURNEY;
 const labs=window.CARANA_LESSON1_LABS;
 const stories=window.CARANA_LESSON1_ILLUSTRATIONS;
 if(!lesson||!journey||!labs){$('vg-display').textContent='The lesson illustrations could not be loaded.';return;}
 const list=lesson.sections.flatMap((section,i)=>section.screens.map((screen,j)=>({
  id:String(i+1).padStart(2,'0')+'-'+String(j+1).padStart(2,'0'),
  number:(i+1)+'.'+(j+1),section:i,screen:j,title:screen.title,group:section.title
 })));
 const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
 const defaultId='01-01';
 const byId=id=>list.findIndex(x=>x.id===id);
 let index=Math.max(0,byId(location.hash.substring(1)));
 if(!location.hash||byId(location.hash.substring(1))<0)index=byId(defaultId);
 const nav=$('vg-list'),display=$('vg-display'),locationText=$('vg-location');
 nav.innerHTML='';
 for(let i=0;i<list.length;i++){
  const v=list[i];
  if(v.screen===0){
   const group=document.createElement('div');group.className='vg-section';group.setAttribute('aria-hidden','true');
   const label=document.createElement('div');label.className='vg-section-title';label.textContent='SECTION '+(v.section+1)+' · '+v.group;group.append(label);nav.append(group);
  }
  const btn=document.createElement('button');btn.type='button';btn.className='vg-screen';btn.dataset.id=v.id;
  btn.innerHTML='<span>'+esc(v.number)+'</span><span class="vg-screen-text">'+esc(v.title)+(stories?.artwork?.[v.id]?'<small class="vg-cinema-label">CINEMATIC + CONCEPT</small>':'')+'</span>';
  btn.addEventListener('click',()=>choose(i));
  nav.append(btn);
 }
 function render(){
  const v=list[index];
  const concept=journey.html(v.section,v.screen)||labs.html(v.section,v.screen);
  const cinema=stories?stories.html(v.section,v.screen):'';
  const paired=cinema?'<div class="hybrid-visual-sequence"><div class="hybrid-visual-step"><span>01</span> See the situation</div>'+cinema+'<div class="hybrid-visual-step conceptual"><span>02</span> Explore the underlying concept</div>'+concept+'</div>':concept;
  display.innerHTML='<div class="vg-card-header"><div class="vg-eyebrow">SCREEN '+esc(v.number)+(cinema?' · HYBRID VISUAL':'')+'</div><h2>'+esc(v.title)+'</h2><p>'+esc(v.group)+' · '+(cinema?'Cinematic situation + interactive concept':'Interactive conceptual illustration')+'</p></div>'+paired+'<p class="vg-hint"><strong>Try it:</strong> Select a component of the visualization to reveal its meaning or feedback.</p>';
  if(journey.html(v.section,v.screen))journey.mount(v.section,v.screen);
  else labs.mount(v.section,v.screen);
  for(const btn of nav.querySelectorAll('.vg-screen'))btn.setAttribute('aria-current',String(btn.dataset.id===v.id));
  $('vg-prev').disabled=index===0;
  $('vg-next').disabled=index===list.length-1;
  locationText.textContent='Screen '+(index+1)+' of '+list.length+' · '+v.number;
  history.replaceState(null,'','#'+v.id);
 }
 function choose(i){index=Math.min(list.length-1,Math.max(0,i));render();}
 $('vg-prev').addEventListener('click',()=>choose(index-1));
 $('vg-next').addEventListener('click',()=>choose(index+1));
 window.addEventListener('hashchange',()=>{const n=byId(location.hash.slice(1));if(n>=0&&n!==index)choose(n)});
 render();
})();
