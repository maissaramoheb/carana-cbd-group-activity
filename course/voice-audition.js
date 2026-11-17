/* CARANA voice audition page: no unreviewed external media URLs. */
(() => {
  'use strict';
  const ids=[
    {id:'01-01',label:'01 · First judgement',title:'The decision before the decision',purpose:'Scene-setting / professional tone'},
    {id:'02-01',label:'02 · Context',title:'Structure the context with PESTEL-S',purpose:'Acronym pronunciation / analytical explanation'},
    {id:'05-02',label:'03 · Institutional diagnosis',title:'Six dimensions cross every area',purpose:'Technical explanation / steady pacing'}
  ];
  const root=document.getElementById('samples'), count=document.getElementById('sample-count');
  const scripts=window.CARANA_EXPERIENCE_V05?.narration?.tracks || [];
  const manifest=window.CARANA_LESSON1_AUDIO_MANIFEST || {};
  let ready=0;
  for(const spec of ids) {
    const track=scripts.find(t=>t.id===spec.id);
    const src=manifest[spec.id];
    const safe=typeof src==='string' && /^\.\/audio\/en\/lesson1\/[0-9]{2}-[0-9]{2}\.mp3$/.test(src);
    if(safe)ready++;
    const card=document.createElement('article');card.className='sample';
    const tag=document.createElement('div');tag.className='sample-tag';tag.textContent=spec.label;card.append(tag);
    const title=document.createElement('h2');title.textContent=spec.title;card.append(title);
    const purpose=document.createElement('p');purpose.className='purpose';purpose.textContent=spec.purpose;card.append(purpose);
    const status=document.createElement('div');status.className='status'+(safe?' ready':'');
    status.textContent=safe?'AI VOICE SAMPLE · READY TO PLAY':'AUDIO UNAVAILABLE · TRANSCRIPT BELOW';card.append(status);
    if(safe){
      const audio=document.createElement('audio');audio.setAttribute('controls','');audio.preload='none';audio.src=src;audio.setAttribute('aria-label','Play narration sample: '+spec.title);
      audio.addEventListener('error',()=>{status.className='status';status.textContent='Audio could not be loaded. Please review the transcript.'});
      card.append(audio);
    }else{
      const notice=document.createElement('p');notice.className='audio-unavailable';notice.textContent='No verified MP3 was generated for this sample.';card.append(notice);
    }
    const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Read original narration script';details.append(summary);
    const script=document.createElement('p');script.textContent=track?.script||'Narration script unavailable';details.append(script);card.append(details);
    root.append(card);
  }
  count.textContent=ready+' of 3 sample recordings available';
})();
