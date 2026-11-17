/* CARANA CBD · Lesson 1 premium explanatory storyboards.
 * Independent instructional adaptations, not source photographs or UN material.
 * Illustrations complement existing analytical diagrams, narration and activities.
 */
(function(){
  'use strict';
  const artwork=Object.freeze({
    '01-01':{
      image:'./illustrations/lesson1/01-01-diagnose-first.jpg',
      title:'First investigate the problem; then select the response.',
      caption:'A request for training is the beginning of an inquiry—not proof that training will address the underlying capacity problem.',
      alt:'In a fictional police office, a CBD adviser examines case records and work processes with a counterpart who is considering a training proposal. The scene contrasts evidence gathering with immediately prescribing training.'
    },
    '03-03':{
      image:'./illustrations/lesson1/03-03-counterpart-fatigue.jpg',
      title:'Good intentions can still create competing demands.',
      caption:'Two assistance activities may appear useful individually, yet together they can duplicate effort and overload the same counterpart team.',
      alt:'An adviser and an overextended police counterpart review a crowded schedule while two parallel workshops take place behind them. Duplicate projectors, binders and overlapping calendar appointments illustrate counterpart fatigue.'
    },
    '04-02':{
      image:'./illustrations/lesson1/04-02-triangulation.jpg',
      title:'Test an account against observed practice and records.',
      caption:'Interviews, direct observations and case documents reveal different parts of the same institutional reality; apparent inconsistencies need follow-up.',
      alt:'An adviser and a police officer compare detailed case records in the foreground, with an interview happening through an open doorway and officers reviewing files behind glass in the background.'
    }
  });
  const escapeHTML=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  function html(section,screen){
    const id=String(section+1).padStart(2,'0')+'-'+String(screen+1).padStart(2,'0');
    const item=artwork[id];
    if(!item)return '';
    return '<figure class="cbd-storyboard" aria-label="Illustrated learning scenario">'+
      '<div class="cbd-storyboard-head"><span class="cbd-storyboard-eyebrow">ILLUSTRATED CASE / '+escapeHTML(String(section+1)+'.'+String(screen+1))+'</span><span class="cbd-storyboard-type">Fictional CARANA scenario</span></div>'+
      '<img src="'+escapeHTML(item.image)+'" alt="'+escapeHTML(item.alt)+'" width="1672" height="941" loading="lazy" decoding="async">'+
      '<figcaption><strong>'+escapeHTML(item.title)+'</strong><span>'+escapeHTML(item.caption)+'</span></figcaption>'+
      '</figure>';
  }
  window.CARANA_LESSON1_ILLUSTRATIONS={html,artwork};
})();
