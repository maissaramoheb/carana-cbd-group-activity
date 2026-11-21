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
  const i18n=window.CARANA_I18N;
  const enTitle=document.title;
  const headingEl=document.getElementById('va-heading');
  const enHeadingHtml=headingEl?headingEl.innerHTML:'';

  function render() {
    root.querySelectorAll('audio').forEach(a=>{try{a.pause();}catch(_){}});
    root.innerHTML='';
    const isEn=!i18n||i18n.getLang()==='en';
    document.title=isEn?enTitle:i18n.t('voicePages.auditionTitle',null,enTitle);
    if(headingEl)headingEl.textContent=isEn?'':i18n.t('voicePages.auditionHeading',null,'');
    if(headingEl&&isEn)headingEl.innerHTML=enHeadingHtml;
    if(i18n)i18n.applyStaticDom(document);
    const ui=i18n&&!isEn?(i18n.getPack('ui')||{}):{};
    const vp=ui.voicePages||{};
    const locTracks=i18n&&!isEn?(i18n.getPack('course-l1')?.experience?.tracks||{}):{};

    let ready=0;
    for(const spec of ids) {
      const enTrack=scripts.find(t=>t.id===spec.id);
      const locCard=vp.auditionCards&&vp.auditionCards[spec.id];
      const src=manifest[spec.id];
      const safe=typeof src==='string' && /^\.\/audio\/en\/lesson1\/[0-9]{2}-[0-9]{2}\.mp3$/.test(src);
      if(safe)ready++;
      const card=document.createElement('article');card.className='sample';
      const tag=document.createElement('div');tag.className='sample-tag';tag.textContent=(!isEn&&locCard?.label)||spec.label;card.append(tag);
      const title=document.createElement('h2');title.textContent=(!isEn&&locCard?.title)||spec.title;card.append(title);
      const purpose=document.createElement('p');purpose.className='purpose';purpose.textContent=(!isEn&&locCard?.purpose)||spec.purpose;card.append(purpose);
      const status=document.createElement('div');
      if(isEn){
        status.className='status'+(safe?' ready':'');
        status.textContent=safe?'AI VOICE SAMPLE · READY TO PLAY':'AUDIO UNAVAILABLE · TRANSCRIPT BELOW';card.append(status);
        if(safe){
          const audio=document.createElement('audio');audio.setAttribute('controls','');audio.preload='none';audio.src=src;audio.setAttribute('aria-label','Play narration sample: '+spec.title);
          audio.addEventListener('error',()=>{status.className='status';status.textContent='Audio could not be loaded. Please review the transcript.';});
          card.append(audio);
        }else{
          const notice=document.createElement('p');notice.className='audio-unavailable';notice.textContent='No verified MP3 was generated for this sample.';card.append(notice);
        }
        const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Read original narration script';details.append(summary);
        const script=document.createElement('p');script.textContent=enTrack?.script||'Narration script unavailable';details.append(script);card.append(details);
      }else{
        status.className='status';
        status.textContent=vp.auditionStatusPendingEnSelected||'TRANSLATED SCRIPT BELOW';card.append(status);
        const notice=document.createElement('p');notice.className='audio-unavailable';notice.textContent=vp.auditionMultilangNotice||'';card.append(notice);
        const details=document.createElement('details');details.open=true;
        const summary=document.createElement('summary');summary.textContent=vp.auditionScriptToggleFr||'Read translated script';details.append(summary);
        const locScript=locTracks[spec.id]?.script;
        if(locScript){const p1=document.createElement('p');p1.textContent=locScript;details.append(p1);}
        const pEn=document.createElement('p');pEn.setAttribute('dir','ltr');pEn.setAttribute('lang','en');pEn.textContent='[EN] '+(enTrack?.script||'');details.append(pEn);
        card.append(details);
        if(safe){
          const enDetails=document.createElement('details');
          const enSum=document.createElement('summary');enSum.textContent=vp.auditionEnSampleToggle||'EN reference audio sample';enDetails.append(enSum);
          const audio=document.createElement('audio');audio.setAttribute('controls','');audio.preload='none';audio.src=src;audio.setAttribute('aria-label','EN sample: '+spec.title);
          enDetails.append(audio);card.append(enDetails);
        }
      }
      root.append(card);
    }
    count.textContent=isEn?(ready+' of 3 sample recordings available'):i18n.t('voicePages.auditionCountSummary',{ready},ready+' of 3 sample recordings available');
  }

  if(i18n){
    i18n.mountSwitcher('#va-lang-slot',{variant:'dark'});
    i18n.onChange(render);
    if(i18n.getLang()==='en')render();
    else i18n.ready(['ui','course-l1']).then(render);
  }else{render();}
})();
