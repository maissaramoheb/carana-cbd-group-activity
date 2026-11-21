/* CARANA CBD: accessible visual review gallery. Only one visualization mounted at a time,
 * preserving exact original visual-journey behavior and course checkpoints.
 */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const baseLesson=window.CARANA_LESSON1;
 const journey=window.CARANA_VISUAL_JOURNEY;
 const labs=window.CARANA_LESSON1_LABS;
 const stories=window.CARANA_LESSON1_ILLUSTRATIONS;
 const i18n=window.CARANA_I18N;
 if(!baseLesson||!journey||!labs){$('vg-display').textContent='The lesson illustrations could not be loaded.';return;}
 const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
 const enTitle=document.title;
 function getList(){
  const isEn=!i18n||i18n.getLang()==='en';
  const locLesson=!isEn?i18n.getPack('course-l1')?.lesson:null;
  const src=(locLesson&&Array.isArray(locLesson.sections))?locLesson:baseLesson;
  return src.sections.flatMap((section,i)=>section.screens.map((screen,j)=>({
   id:String(i+1).padStart(2,'0')+'-'+String(j+1).padStart(2,'0'),
   number:(i+1)+'.'+(j+1),section:i,screen:j,title:screen.title,group:section.title
  })));
 }
 let list=getList();
 const defaultId='01-01';
 const byId=id=>list.findIndex(x=>x.id===id);
 let index=Math.max(0,byId(location.hash.substring(1)));
 if(!location.hash||byId(location.hash.substring(1))<0)index=byId(defaultId);
 const nav=$('vg-list'),display=$('vg-display'),locationText=$('vg-location');

 function buildSidebar(){
  const isEn=!i18n||i18n.getLang()==='en';
  list=getList();
  nav.innerHTML='';
  const cinemaTxt=isEn?'CINEMATIC + CONCEPT':i18n.t('gallery.cinemaBadge',null,'CINEMATIC + CONCEPT');
  for(let i=0;i<list.length;i++){
   const v=list[i];
   if(v.screen===0){
    const group=document.createElement('div');group.className='vg-section';group.setAttribute('aria-hidden','true');
    const label=document.createElement('div');label.className='vg-section-title';
    label.textContent=isEn?('SECTION '+(v.section+1)+' · '+v.group):i18n.t('gallery.sectionPrefix',{num:v.section+1,title:v.group},'SECTION '+(v.section+1)+' · '+v.group);
    group.append(label);nav.append(group);
   }
   const btn=document.createElement('button');btn.type='button';btn.className='vg-screen';btn.dataset.id=v.id;
   btn.innerHTML='<span>'+esc(v.number)+'</span><span class="vg-screen-text">'+esc(v.title)+(stories?.artwork?.[v.id]?'<small class="vg-cinema-label">'+esc(cinemaTxt)+'</small>':'')+'</span>';
   btn.addEventListener('click',()=>choose(i));
   nav.append(btn);
  }
 }

 function render(){
  const isEn=!i18n||i18n.getLang()==='en';
  document.title=isEn?enTitle:i18n.t('gallery.pageTitle',null,enTitle);
  if(i18n)i18n.applyStaticDom(document);
  const v=list[index];
  const concept=journey.html(v.section,v.screen)||labs.html(v.section,v.screen);
  const cinema=stories?stories.html(v.section,v.screen):'';
  const step01=isEn?'See the situation':i18n.t('gallery.hybridStep1',null,'See the situation');
  const step02=isEn?'Explore the underlying concept':i18n.t('gallery.hybridStep2',null,'Explore the underlying concept');
  const paired=cinema?'<div class="hybrid-visual-sequence"><div class="hybrid-visual-step"><span>01</span> '+esc(step01)+'</div>'+cinema+'<div class="hybrid-visual-step conceptual"><span>02</span> '+esc(step02)+'</div>'+concept+'</div>':concept;
  const screenEyebrow=isEn?('SCREEN '+v.number+(cinema?' · HYBRID VISUAL':'')):(i18n.t('gallery.screenPrefix',{num:v.number},'SCREEN '+v.number)+(cinema?i18n.t('gallery.hybridSuffix',null,' · HYBRID VISUAL'):''));
  const descTxt=cinema?(isEn?'Cinematic situation + interactive concept':i18n.t('gallery.hybridDesc',null,'')):(isEn?'Interactive conceptual illustration':i18n.t('gallery.conceptDesc',null,''));
  const tryLabel=isEn?'Try it:':i18n.t('gallery.tryLabel',null,'Try it:');
  const tryText=isEn?'Select a component of the visualization to reveal its meaning or feedback.':i18n.t('gallery.tryText',null,'');
  display.innerHTML='<div class="vg-card-header"><div class="vg-eyebrow">'+esc(screenEyebrow)+'</div><h2>'+esc(v.title)+'</h2><p>'+esc(v.group)+' · '+esc(descTxt)+'</p></div>'+paired+'<p class="vg-hint"><strong>'+esc(tryLabel)+'</strong> '+esc(tryText)+'</p>';
  if(journey.html(v.section,v.screen))journey.mount(v.section,v.screen);
  else labs.mount(v.section,v.screen);
  for(const btn of nav.querySelectorAll('.vg-screen'))btn.setAttribute('aria-current',String(btn.dataset.id===v.id));
  $('vg-prev').disabled=index===0;
  $('vg-next').disabled=index===list.length-1;
  locationText.textContent=isEn?('Screen '+(index+1)+' of '+list.length+' · '+v.number):i18n.t('gallery.location',{current:index+1,total:list.length,num:v.number},'Screen '+(index+1)+' of '+list.length+' · '+v.number);
  history.replaceState(null,'','#'+v.id);
 }
 function choose(i){index=Math.min(list.length-1,Math.max(0,i));render();}
 $('vg-prev').addEventListener('click',()=>choose(index-1));
 $('vg-next').addEventListener('click',()=>choose(index+1));
 window.addEventListener('hashchange',()=>{const n=byId(location.hash.slice(1));if(n>=0&&n!==index)choose(n)});
 function boot(){buildSidebar();render();}
 if(i18n){
  i18n.mountSwitcher('#vg-lang-slot',{variant:'dark'});
  i18n.onChange(boot);
  if(i18n.getLang()==='en')boot();
  else i18n.ready(['ui','course-l1']).then(boot);
 }else{boot();}
})();
