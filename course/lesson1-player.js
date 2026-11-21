/* CARANA CBD v0.5 — narrated lesson and formative interaction layer.
 * Trainer Narration remains recorded audio. Browser Read Screen is a separate,
 * explicitly initiated support capability. Existing course and original exercise storage are untouched.
 */
(function () {
  'use strict';
  const model = window.CARANA_EXPERIENCE_V05;
  if (!model || !model.narration || !Array.isArray(model.narration.tracks)) return;
  const byTrack = new Map(model.narration.tracks.map(t => [t.id,t]));
  const byDecision = new Map(model.decisions.map(t => [t.id,t]));
  const esc = x => String(x == null ? '' : x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const $ = id => document.getElementById(id);
  const key = (section,screen) => String(section+1).padStart(2,'0') + '-' + String(screen+1).padStart(2,'0');
  const manifest = () => window.CARANA_LESSON1_AUDIO_MANIFEST || {};
  function safeAudioPath(value) {
    if (typeof value !== 'string') return null;
    // Only same-origin, reviewed audio files. Avoid untrusted external streams.
    return /^\.\/audio\/en\/lesson1\/[a-z0-9-]+\.(mp3|m4a|ogg|wav)$/i.test(value) ? value : null;
  }
  const voiceStatus = (section,screen) => {
    const t = byTrack.get(key(section,screen));
    if (!t) return null;
    const i18n = window.CARANA_I18N;
    const lang = i18n ? i18n.getLang() : 'en';
    if (lang === 'en') {
      return { ...t, lang: 'en', src: safeAudioPath(manifest()[t.id]) };
    }
    const loc = i18n.getPack('course-l1')?.experience?.tracks?.[t.id];
    // Strict language safety: never return English MP3 src for FR or AR
    return {
      ...t,
      title: (loc && loc.title) || t.title,
      script: (loc && loc.script) || t.script,
      lang,
      src: null,
      translatedPendingAudio: true
    };
  };
  function localizedDecision(section,screen) {
    const id = key(section,screen);
    const base = byDecision.get(id);
    if (!base) return null;
    const i18n = window.CARANA_I18N;
    if (!i18n || i18n.getLang() === 'en') return base;
    const loc = i18n.getPack('course-l1')?.experience?.decisions?.[id];
    if (!loc) return base;
    return {
      ...base,
      label: loc.label || base.label,
      prompt: loc.prompt || base.prompt,
      options: base.options.map((opt, idx) => ({
        label: (loc.options && loc.options[idx] && loc.options[idx].label) || opt.label,
        feedback: (loc.options && loc.options[idx] && loc.options[idx].feedback) || opt.feedback
      }))
    };
  }
  function narrationHTML(section,screen) {
    const tr=voiceStatus(section,screen);
    if (!tr) return '';
    const i18n=window.CARANA_I18N;
    const lang=tr.lang||'en';
    if (lang==='en') {
      const ready=!!tr.src;
      const audition=ready&&!!window.CARANA_LESSON1_AUDIO_SAMPLE_MODE;
      const aiNarration=ready&&!!window.CARANA_LESSON1_AUDIO_AI_MODE;
      return '<section class="trainer-voice" aria-label="English trainer explanation"><div class="trainer-voice-heading">'+
        '<div class="voice-emblem" aria-hidden="true">◉</div><div class="voice-meta"><strong>Trainer narration</strong><span>English · '+(audition?'AI-generated audition clip':aiNarration?'AI-generated narration':ready?'Recorded narration':'Editorial transcript')+' · Optional</span></div>'+
        (ready?'<div class="voice-availability live">'+(audition?'AI VOICE SAMPLE':aiNarration?'NARRATION READY':'AUDIO AVAILABLE')+'</div>':'<div class="voice-availability pending">AUDIO PENDING REVIEW</div>')+'</div>'+
        (ready?'<audio id="trainer-audio" preload="none" src="'+esc(tr.src)+'"></audio><div class="voice-controls">'+
          '<button type="button" class="voice-button primary" id="voice-play" aria-label="Play explanation">▶ Play explanation</button>'+
          '<button type="button" class="voice-button" id="voice-replay" aria-label="Replay narration from the beginning">↺ Replay</button>'+
          '<button type="button" class="voice-button voice-speed" id="voice-speed">1× speed</button>'+
          '<span id="voice-time" class="voice-time" role="timer" aria-live="off">0:00 / --:--</span></div>'+
          '<p id="voice-error" class="voice-production-note" role="status" hidden></p><div class="voice-progress-track" aria-hidden="true"><i id="voice-progress-fill"></i></div>'+(audition?'<p class="voice-production-note">AI-generated voice audition, not a human recording or approved final course narration. <a href="./voice-audition.html">Compare the three audition samples</a>.</p>':aiNarration?'<p class="voice-production-note">AI-generated English explanation · Independent instructional adaptation.</p>':''):
          '<p class="voice-production-note">The natural-voice recording is being prepared. The complete spoken explanation is available as a transcript; no synthetic browser voice will be substituted.</p>')+
        '<button type="button" id="voice-transcript-toggle" class="voice-transcript-toggle" aria-expanded="false" aria-controls="voice-transcript">Read the trainer’s explanation <span aria-hidden="true">＋</span></button>'+
        '<div class="voice-transcript" id="voice-transcript" hidden><p>'+esc(tr.script)+'</p><div class="voice-transcript-foot">Narration script · '+esc(tr.title)+' · Independent instructional adaptation</div></div></section>';
    }
    const subKey = lang === 'fr-FR' ? 'course.narrationSubFr' : 'course.narrationSubAr';
    return '<section class="trainer-voice" aria-label="'+esc(i18n.t('course.narrationHeading',null,'Trainer narration'))+'"><div class="trainer-voice-heading">'+
      '<div class="voice-emblem" aria-hidden="true">◉</div><div class="voice-meta"><strong>'+esc(i18n.t('course.narrationHeading',null,'Trainer narration'))+'</strong><span>'+esc(i18n.t(subKey,null,''))+'</span></div>'+
      '<div class="voice-availability pending">'+esc(i18n.t('course.narrationBadgePending',null,'AUDIO PENDING'))+'</div></div>'+
      '<p class="voice-production-note">'+esc(i18n.t('course.narrationNotePending',null,''))+'</p>'+
      '<div class="voice-controls"><button type="button" class="voice-button" id="voice-readaloud-screen">▶ '+esc(i18n.t('course.narrationUseReadAloud',null,'Listen with Read Screen'))+'</button></div>'+
      '<button type="button" id="voice-transcript-toggle" class="voice-transcript-toggle" aria-expanded="false" aria-controls="voice-transcript">'+i18n.t('course.narrationTranscriptClosed',null,'Read transcript <span aria-hidden="true">＋</span>')+'</button>'+
      '<div class="voice-transcript" id="voice-transcript" hidden><p>'+esc(tr.script)+'</p><div class="voice-transcript-foot">'+esc(i18n.t('course.narrationScriptFoot',null,''))+' · '+esc(tr.title)+'</div></div></section>';
  }
  function practiceHTML(section,screen) {
    const activity=localizedDecision(section,screen);
    if(!activity)return '';
    const i18n=window.CARANA_I18N;
    const isEn=!i18n||i18n.getLang()==='en';
    const eyebrow=isEn?'FIELD JUDGEMENT / FORMATIVE PRACTICE':i18n.t('course.decisionEyebrow',null,'FIELD JUDGEMENT');
    const groupAria=isEn?'Choose your response':i18n.t('course.decisionAria',null,'Choose your response');
    const footnote=isEn?'Practice only · Your choice does not alter the six-question knowledge checkpoint.':i18n.t('course.decisionFootnote',null,'Practice only');
    return '<section class="learner-decision" aria-labelledby="decision-heading"><div class="decision-heading"><span class="decision-eyebrow">'+esc(eyebrow)+'</span><h2 id="decision-heading">'+esc(activity.label)+'</h2><p>'+esc(activity.prompt)+'</p></div>'+
      '<div class="decision-options" role="group" aria-label="'+esc(groupAria)+'">'+activity.options.map((opt,i)=>
      '<button type="button" class="decision-option" data-decision="'+i+'" aria-pressed="false"><span class="decision-option-index">'+String.fromCharCode(65+i)+'</span><span>'+esc(opt.label)+'</span></button>').join('')+'</div>'+
      '<div id="decision-feedback" class="decision-feedback" role="status" aria-live="polite" hidden></div>'+
      '<p class="decision-footnote">'+esc(footnote)+'</p></section>';
  }
  function formatTime(n) {
    if(!Number.isFinite(n)||n<0)return '--:--';
    return Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
  }
  function mount(section,screen) {
    const i18n=window.CARANA_I18N;
    const isEn=!i18n||i18n.getLang()==='en';
    const transcript=$('voice-transcript-toggle'),transcriptBox=$('voice-transcript');
    if(transcript && transcriptBox) {
      transcript.addEventListener('click',()=>{
        const open=transcriptBox.hidden;
        transcriptBox.hidden=!open;
        transcript.setAttribute('aria-expanded',String(open));
        if(isEn) {
          transcript.innerHTML=open?'Hide the transcript <span aria-hidden="true">−</span>':'Read the trainer’s explanation <span aria-hidden="true">＋</span>';
        } else {
          transcript.innerHTML=open?i18n.t('course.narrationTranscriptOpen',null,'Hide <span aria-hidden="true">−</span>'):i18n.t('course.narrationTranscriptClosed',null,'Read <span aria-hidden="true">＋</span>');
        }
        transcriptBox.dispatchEvent(new CustomEvent('carana:explanation-updated',{bubbles:true,detail:{toggled:true,target:transcriptBox}}));
      });
    }
    const readAloudBtn=$('voice-readaloud-screen');
    if(readAloudBtn){
      readAloudBtn.addEventListener('click',()=>window.CARANA_SUPPORT?.readScreen?.());
    }
    window.__caranaLesson1AudioAC?.abort();
    const ac = new AbortController();
    window.__caranaLesson1AudioAC = ac;
    const track=$('trainer-audio');
    if(track) {
      const play=$('voice-play'),replay=$('voice-replay'),speed=$('voice-speed'),time=$('voice-time'),fill=$('voice-progress-fill');
      let speedIndex=1;const rates=[.85,1,1.15,1.3];
      const refresh=()=>{
        if(!track.isConnected)return;
        const running=!track.paused&&!track.ended;
        const nextLabel=running?'Ⅱ Pause narration':'▶ Play explanation';
        if(play.textContent!==nextLabel){
          play.textContent=nextLabel;
          play.setAttribute('aria-label',running?'Pause narration':'Play explanation');
        }
        if(time)time.textContent=formatTime(track.currentTime)+' / '+formatTime(track.duration);
        if(fill)fill.style.width=(Number.isFinite(track.duration)&&track.duration>0?(track.currentTime/track.duration)*100:0)+'%';
      };
      const status=$('voice-error');
      const showError=(unavailable=false)=>{
        if(!track.isConnected||ac.signal.aborted)return;
        status.hidden=false;
        status.textContent=unavailable?'Recording unavailable. Read the transcript below.':'Playback did not start. Try again or read the transcript below.';
        if(unavailable){play.disabled=true;replay.disabled=true;speed.disabled=true;}
      };
      const stopTrack=()=>{
        try{track.pause();}catch(_){}
        refresh();
      };
      const start=async()=>{
        if(!track.isConnected||ac.signal.aborted)return;
        status.hidden=true;
        window.CARANA_SUPPORT?.stop?.('Trainer narration is playing. Read Screen has stopped.');
        document.querySelectorAll('audio, video').forEach(node=>{if(node!==track)try{node.pause();}catch(_){}});
        try{
          await track.play();
          if(!track.isConnected||ac.signal.aborted){try{track.pause();}catch(_){}}
        }catch(_){showError(!!track.error)}
        refresh();
      };
      play.addEventListener('click',()=>{if(track.paused)start();else track.pause()},{signal:ac.signal});
      replay.addEventListener('click',()=>{track.currentTime=0;start()},{signal:ac.signal});
      speed.addEventListener('click',()=>{speedIndex=(speedIndex+1)%rates.length;track.playbackRate=rates[speedIndex];speed.textContent=rates[speedIndex]+'× speed'},{signal:ac.signal});
      for(const event of ['play','pause','ended','timeupdate','durationchange'])track.addEventListener(event,refresh,{signal:ac.signal});
      track.addEventListener('error',()=>showError(true),{signal:ac.signal});
      window.addEventListener('pagehide',stopTrack,{signal:ac.signal});
      window.addEventListener('hashchange',stopTrack,{signal:ac.signal});
      document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTrack();},{signal:ac.signal});
      if(track.error)showError(true);
      refresh();
    }
    const decision=localizedDecision(section,screen),feedback=$('decision-feedback');
    if(decision&&feedback) {
      document.querySelectorAll('[data-decision]').forEach(button=>button.addEventListener('click',()=>{
        const chosen=Number(button.dataset.decision);
        if(!Number.isInteger(chosen)||!decision.options[chosen])return;
        document.querySelectorAll('[data-decision]').forEach(node=>{
          const selected=node===button;
          node.setAttribute('aria-pressed',String(selected));
          node.classList.toggle('chosen',selected);
        });
        const ideal=chosen===decision.best;
        feedback.hidden=false;
        feedback.className='decision-feedback '+(ideal?'good':'reflect');
        feedback.dataset.readExplanation='true';
        feedback.dataset.readTitle=decision.options[chosen].label;
        const headingTxt=isEn?(ideal?'A defensible choice.':'Consider the implications.'):i18n.t(ideal?'course.decisionGood':'course.decisionReflect',null,'');
        const tailTxt=isEn?(ideal?'Continue when ready.':'You may reconsider your response without penalty.'):i18n.t(ideal?'course.decisionContinueNote':'course.decisionRetryNote',null,'');
        feedback.innerHTML='<strong>'+esc(headingTxt)+'</strong><p>'+esc(decision.options[chosen].feedback)+'</p><span>'+esc(tailTxt)+'</span>';
        feedback.dispatchEvent(new CustomEvent('carana:explanation-updated',{bubbles:true,detail:{id:decision.options[chosen].label,target:feedback}}));
      }));
    }
  }
  window.CARANA_LESSON1_PLAYER={narrationHTML,practiceHTML,mount,voiceStatus};
})();