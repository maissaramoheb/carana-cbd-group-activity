/* CARANA CBD Course — standalone learner shell.
 * Original CARANA workbench is loaded UNMODIFIED from ../module1.html.
 * Separate storage keys prevent overwriting original exercise state.
 */
(function () {
  'use strict';
  const lesson = window.CARANA_LESSON1;
  const KEY = 'carana_cbd_course_v1';
  const LAB_KEY = 'carana_cbd_lab_v1';
  const SECTION_COUNT = lesson.sections.length;
  let mode = 'home';
  let position = { section: 0, screen: 0, kind: 'screen' };
  let answers = {};
  let checked = false;
  let missed = [];
  const $ = id => document.getElementById(id);
  const clean = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const initial = () => ({
    version: 1, completed: [], visited: [], activityOpened: false,
    lessonComplete: false, lastSection: 0, lastScreen: 0, lastKind: 'screen',
    startedAt: null, updatedAt: null
  });
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (!raw || raw.version !== 1 || !Array.isArray(raw.completed)) return initial();
      return {
        ...initial(), ...raw,
        completed: raw.completed.filter(x => Number.isInteger(x) && x >= 0 && x < SECTION_COUNT),
        visited: Array.isArray(raw.visited) ? raw.visited.filter(x => typeof x === 'string') : []
      };
    } catch (_) { return initial(); }
  }
  let progress = load();
  function save() {
    progress.updatedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(progress)); }
    catch (_) { $('save-status').textContent = 'This browser could not save progress. Please export a backup.'; }
    updateStatus();
  }
  function updateStatus() {
    const el = $('save-status');
    if (el) el.textContent = progress.updatedAt ? 'Saved on this device · ' + new Date(progress.updatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : 'Progress is stored on this device';
  }
  function isCleared(s) { return progress.completed.includes(s); }
  function canOpen(s) { return s === 0 || Array.from({length:s}, (_,i) => i).every(isCleared); }
  function isAllCleared() { return lesson.sections.every((_,i) => isCleared(i)); }
  function markVisited(s, n) {
    const k = s + ':' + n;
    if (!progress.visited.includes(k)) progress.visited.push(k);
  }
  function goHome() { mode = 'home'; document.body.classList.remove('is-learning'); render(); }
  function resume() {
    mode = 'lesson';
    document.body.classList.add('is-learning');
    if (isAllCleared() && progress.activityOpened) {
      position = {section:SECTION_COUNT - 1,screen:2,kind:progress.lessonComplete ? 'complete' : 'activity'};
    } else {
      const s = Math.min(Math.max(0,Number(progress.lastSection)||0),SECTION_COUNT-1);
      const allowed = canOpen(s) ? s : Math.max(0,progress.completed.length);
      position = { section: allowed, screen:Math.min(Math.max(0,Number(progress.lastScreen)||0),2), kind:'screen' };
      if (progress.lastKind === 'quiz' && canOpen(allowed)) position.kind = 'quiz';
    }
    render();
  }
  function navigate(s,n,kind) {
    if (!canOpen(s)) return;
    mode = 'lesson';
    document.body.classList.add('is-learning');
    position = {section:s,screen:n,kind:kind||'screen'};
    if (position.kind==='screen') markVisited(s,n);
    if (position.kind==='quiz') { answers = {}; checked = false; missed = []; }
    progress.lastSection=s; progress.lastScreen=n; progress.lastKind=position.kind;
    if (!progress.startedAt) progress.startedAt = new Date().toISOString();
    save(); render(); window.scrollTo({top:0,behavior:'instant'});
  }
  function openActivity() {
    if (!isAllCleared()) return;
    progress.activityOpened = true;
    progress.lastKind='activity';
    save();
    mode='lesson';
    position={section:SECTION_COUNT-1,screen:2,kind:'activity'};
    render(); window.scrollTo({top:0,behavior:'instant'});
  }
  function checkOriginalActivity() {
    try {
      const raw = localStorage.getItem(LAB_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      return !!(s && s.module1 && s.module1.confirmed === true);
    } catch (_) { return false; }
  }
  function verifyActivity() {
    const status = $('activity-status');
    if (!checkOriginalActivity()) {
      status.textContent = 'The original Module 1 workbench has not yet recorded participant confirmation. Finish and confirm it inside the workbench, then verify again.';
      status.className = 'inline-feedback warning';
      return;
    }
    progress.lessonComplete=true; progress.lastKind='complete'; save();
    position.kind='complete'; render();
  }
  function exportProgress() {
    const bundle = {course:'CARANA CBD E-Learning',lesson:lesson.title,progress,source:lesson.source,exportedAt:new Date().toISOString(),note:'Learner-side progress record, not a UN-issued certificate.'};
    const link=document.createElement('a');
    const blob=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    link.href=url; link.download='carana-cbd-lesson1-progress.json'; document.body.append(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function renderHome() {
    const started=!!progress.startedAt;
    const completed=progress.completed.length;
    $('root').innerHTML = '<div class="landing">' +
      '<header class="topbar shell"><a class="brand" href="#home" id="brand-home"><span class="brand-symbol">C</span><span><strong>CARANA</strong><small>CBD LEARNING EXPERIENCE</small></span></a><span class="topbar-right"><span class="eyebrow-light">SELF-PACED TRAINING</span><button class="text-link" id="course-about">About the course</button></span></header>' +
      '<main><section class="hero shell"><div class="hero-copy"><span class="overline"><span class="spark"></span> UNPOL CBD · JOB-SPECIFIC LEARNING</span><h1>Understand the situation.<br><em>Design meaningful change.</em></h1><p class="hero-lead">Explore the capacity-building cycle through structured learning, evidence-based decisions, and the preserved CARANA simulation.</p><div class="hero-actions"><button class="btn primary xl" id="start-course">' + (started?'Resume learning':'Start learning') + ' <span aria-hidden="true">→</span></button><a class="btn secondary xl" href="#course-map">Explore lessons</a></div><div class="hero-note">No account required · Progress saved locally · Built for independent learning</div></div><div class="hero-art" aria-label="Visual representation of the analytical learning journey" role="img"><div class="orbit-ring one"></div><div class="orbit-ring two"></div><div class="floating-tag tag-1">CONFLICT ANALYSIS</div><div class="floating-tag tag-2">RESPONSE ANALYSIS</div><div class="floating-tag tag-3">CBD ANALYSIS</div><div class="art-core"><span>01</span><strong>SITUATIONAL<br>ANALYSIS</strong><small>Evidence before intervention</small></div><div class="art-foot">THE FOUNDATION OF SUSTAINABLE REFORM</div></div></section>' +
      '<section class="metrics shell" aria-label="Learning model"><div><strong>06</strong><span>CBD phases</span></div><div><strong>18</strong><span>Instructional screens · Lesson 1</span></div><div><strong>36</strong><span>Knowledge-check questions</span></div><div><strong>01</strong><span>Preserved practical workbench</span></div></section>' +
      '<section id="course-map" class="lesson-section shell"><div class="section-heading"><div><span class="overline dark">THE LEARNING JOURNEY</span><h2>Choose your lesson</h2><p>Start with an evidence-based understanding of your counterpart and mission context.</p></div><div class="course-status">' + completed + ' of 6 checkpoints passed</div></div><div class="lesson-grid"><button class="lesson-feature" id="lesson-one"><span class="lesson-index">01 / READY TO LEARN</span><span class="lesson-graphic" aria-hidden="true"><i></i><i></i><i></i></span><strong>Situational Analysis</strong><span>Conflict scanning · Response mapping · Stakeholders · 5 × 6 CBD matrix · SWOT · Baseline</span><span class="lesson-meta">18 instructional screens <b>·</b> 6 checkpoints <b>·</b> Practical activity</span><span class="lesson-open">' + (started?'Continue lesson':'Enter lesson') + ' →</span></button>' +
      [ ['02','Objective Setting & Prioritisation'],['03','Planning Activities'],['04','Implementation'],['05','Evaluation & Adjustment'],['06','Transition & Handover'] ].map(x=>'<div class="lesson-locked"><div class="locked-head"><span>'+x[0]+'</span><span>FUTURE LESSON</span></div><strong>'+x[1]+'</strong><p>Planned for the next phase of course development.</p></div>').join('') +
      '</div></section>' +
      '<section class="about-band" id="about"><div class="shell about-content"><div><span class="overline dark">LEARNING DESIGN</span><h2>Learn. Prove understanding. Apply.</h2></div><div><p>Each short sequence is followed by a six-question checkpoint. All answers must be correct before you advance. At the end of Lesson 1, the existing CARANA workbench opens without changing its original exercises or data structure.</p><p class="fine-print">Independent instructional adaptation referencing UNPOL CBD JST Lesson 1. This is not an official United Nations learning platform or an endorsed certification.</p></div></div></section></main><footer class="footer shell"><span>CARANA CBD E-Learning · Prepared by Lt. Col. Maissara Selim</span><span>Original curriculum and scenario remain attributed to the United Nations.</span></footer></div>';
    $('start-course').addEventListener('click',resume);
    $('lesson-one').addEventListener('click',resume);
    $('course-about').addEventListener('click',()=>document.getElementById('about').scrollIntoView({behavior:'smooth'}));
    $('brand-home').addEventListener('click',e=>e.preventDefault());
  }
  function railHTML() {
    return lesson.sections.map((sec,i)=>{
      const locked=!canOpen(i), done=isCleared(i), active=position.section===i;
      return '<button class="rail-item ' + (active?'active ':'')+(done?'done ':'') + '" data-section="'+i+'" '+(locked?'disabled':'')+' aria-current="'+(active?'step':'false')+'"><span class="rail-number">'+(done?'✓':String(i+1).padStart(2,'0'))+'</span><span class="rail-label">'+clean(sec.title)+'</span>'+(locked?'<span class="lock-icon" aria-label="Locked">⌁</span>':'')+'</button>';
    }).join('');
  }
  function layout(content,heading) {
    const finished=progress.completed.length;
    const value=Math.round((finished/SECTION_COUNT)*100);
    $('root').innerHTML =
      '<div class="course-shell"><header class="course-header"><button class="back-home" id="back-home"><span aria-hidden="true">←</span> COURSE HOME</button><div class="header-title">CARANA <span>/</span> CBD E-LEARNING <span>/</span> LESSON 01</div><div class="header-right"><span id="save-status">Progress is stored on this device</span><button class="export-mini" id="export-mini">Export progress ↗</button></div></header>' +
      '<div class="workspace"><aside class="side-rail"><div class="rail-overline">LESSON 01</div><h2>Situational<br>Analysis</h2><p>Learn to diagnose before designing change.</p><div class="rail-divider"></div><div class="rail-overline">LEARNING PATH</div><nav aria-label="Course sections">'+railHTML()+'</nav><div class="rail-divider"></div><div class="rail-progress"><div class="rail-progress-row"><span>Knowledge checkpoints</span><strong>'+finished+' / 6</strong></div><div class="progress-track"><i style="width:'+value+'%"></i></div></div><div class="rail-note">Correct responses are required at each checkpoint before moving forward.</div></aside>' +
      '<main class="learning-content" id="learning-main"><div class="learning-frame"><div class="content-overline">'+clean(heading)+'</div>'+content+'</div></main>' +
      '<aside class="context-panel"><span class="context-overline">WHY THIS MATTERS</span><h3>Evidence before action.</h3><p>Effective capacity-building begins with a shared understanding of the context, existing assistance, and counterpart reality.</p><div class="context-divider"></div><span class="context-overline">LEARNING OUTCOMES</span><ul>'+lesson.objectives.slice(0,4).map(t=>'<li>'+clean(t)+'</li>').join('')+'</ul><div class="context-divider"></div><span class="context-overline">SOURCE</span><p class="source-small">UNPOL CBD Job-Specific Training · Lesson 1, 2021 / July 2023 file.</p></aside></div></div>';
    $('back-home').addEventListener('click',goHome);
    $('export-mini').addEventListener('click',exportProgress);
    document.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>navigate(+b.dataset.section,0)));
    updateStatus();
  }
  function renderScreen() {
    const {section,screen}=position;
    const sec=lesson.sections[section], item=sec.screens[screen];
    const absolute=section*3+screen+1;
    const visual='<div class="visual-card"><span class="visual-caption">'+clean(item.visualTitle)+'</span><div class="visual-flow '+(item.visual.length>5?'dense':'')+'">'+item.visual.map((x,i)=>'<div class="visual-node"><span>'+String(i+1).padStart(2,'0')+'</span>'+clean(x)+'</div>').join('')+'</div></div>';
    const outcomes=section===0&&screen===0?'<div class="learning-outcomes"><h2>By the end of this lesson, you will be able to</h2><ul>'+lesson.objectives.map(o=>'<li>'+clean(o)+'</li>').join('')+'</ul></div>':'';
    const content='<div class="learning-head"><span class="micro-label">SECTION '+String(section+1).padStart(2,'0')+' OF 06 <span>·</span> SCREEN '+String(screen+1)+' OF 03</span><span class="screen-count">'+String(absolute).padStart(2,'0')+' / 18</span></div><div class="section-rule"></div>' +
      '<div class="content-title"><span class="small-tag">'+clean(item.kicker)+'</span><h1>'+clean(item.title)+'</h1><p class="lead">'+clean(item.lead)+'</p></div>'+visual +
      '<div class="learning-points">'+item.points.map((p,i)=>'<div class="point"><span class="point-dot"></span><p>'+clean(p)+'</p></div>').join('')+'</div>' +
      '<div class="takeaway"><span>KEY IDEA</span><strong>'+clean(item.takeaway)+'</strong></div>'+outcomes +
      '<div class="lesson-foot"><span>Based on lesson plan pages '+clean(item.sourcePage)+'</span><span>Original instructional adaptation</span></div>' +
      '<div class="bottom-actions"><button class="btn outline" id="prev-screen" '+(section===0&&screen===0?'disabled':'')+'>← Back</button><button class="btn primary" id="next-screen">'+(screen===2&&!isCleared(section)?'Knowledge checkpoint →':screen===2&&section===5?'Open practice →':'Continue →')+'</button></div>';
    layout(content,sec.title);
    $('prev-screen').addEventListener('click',()=>{
      if(screen>0) navigate(section,screen-1);
      else if(section>0) navigate(section-1,2);
    });
    $('next-screen').addEventListener('click',()=>{
      if(screen<2) navigate(section,screen+1);
      else if(!isCleared(section)) navigate(section,2,'quiz');
      else if(section<5) navigate(section+1,0);
      else openActivity();
    });
  }
  function renderQuiz() {
    const s=position.section, sec=lesson.sections[s];
    const passed=isCleared(s);
    if(passed){
      layout('<div class="quiz-success"><div class="success-icon">✓</div><span class="micro-label">CHECKPOINT CLEARED</span><h1>Understanding confirmed.</h1><p>You passed all six questions in '+clean(sec.title)+'. You can now advance.</p><div class="bottom-actions center"><button class="btn outline" id="revisit">Review this section</button><button class="btn primary" id="continue-after-quiz">'+(s===SECTION_COUNT-1?'Open practical activity →':'Continue to next section →')+'</button></div></div>','Checkpoint '+(s+1)+' · Passed');
      $('revisit').addEventListener('click',()=>navigate(s,0));
      $('continue-after-quiz').addEventListener('click',()=>s===SECTION_COUNT-1?openActivity():navigate(s+1,0));
      return;
    }
    let html='<div class="learning-head"><span class="micro-label">KNOWLEDGE CHECKPOINT '+String(s+1).padStart(2,'0')+' / 06</span><span class="screen-count">6 QUESTIONS</span></div><div class="section-rule"></div>' +
      '<div class="content-title"><span class="small-tag">Demonstrate understanding</span><h1>Checkpoint: '+clean(sec.title)+'</h1><p class="lead">Answer all six questions correctly to unlock the next section. Review the previous screens whenever needed.</p></div><div class="quiz-rule"><span>PASS REQUIREMENT</span><strong>6 out of 6 correct</strong></div><form id="quiz-form" novalidate>';
    sec.quiz.forEach((q,i)=>{
      const wrong=checked&&missed.includes(i);
      html+='<fieldset class="question-card '+(wrong?'question-wrong':'')+'"><legend><span>Q'+(i+1)+'</span> '+clean(q.q)+'</legend><div class="choices">'+q.options.map((opt,j)=>'<label class="choice"><input type="radio" name="q'+i+'" value="'+j+'" '+(answers[i]===j?'checked':'')+'><span>'+clean(opt)+'</span></label>').join('')+'</div>' +
        (wrong?'<p class="answer-hint"><strong>Learning feedback:</strong> '+clean(q.why)+' Review the explanation above, then select the correct response.</p>':'')+'</fieldset>';
    });
    html+='</form><div id="quiz-feedback" class="inline-feedback '+(checked?'warning':'')+'" role="status" aria-live="polite">'+(checked?missed.length+' answer(s) still need attention. Correct them and check again.':'Your answers stay on this device during this attempt.')+'</div><div class="bottom-actions"><button class="btn outline" id="return-review">← Review learning screens</button><button class="btn primary" id="check-quiz">Check answers →</button></div>';
    layout(html,sec.title+' · Checkpoint');
    document.querySelectorAll('#quiz-form input').forEach(inp=>inp.addEventListener('change',()=>{
      answers[Number(inp.name.slice(1))]=Number(inp.value);
    }));
    $('return-review').addEventListener('click',()=>navigate(s,2));
    $('check-quiz').addEventListener('click',()=>{
      const unanswered=sec.quiz.map((_,i)=>i).filter(i=>answers[i]===undefined);
      if(unanswered.length){$('quiz-feedback').textContent='Please answer all six questions before checking.';$('quiz-feedback').className='inline-feedback warning';return;}
      missed=sec.quiz.map((q,i)=>answers[i]===q.answer?-1:i).filter(x=>x!==-1);
      checked=true;
      if(!missed.length){
        progress.completed=[...new Set([...progress.completed,s])].sort((a,b)=>a-b);
        progress.lastKind='quiz';save();render();window.scrollTo({top:0,behavior:'instant'});
      }else{
        render();
        $('quiz-feedback').scrollIntoView({block:'center',behavior:'smooth'});
      }
    });
  }
  function renderActivity() {
    if(!isAllCleared()){navigate(0,0);return;}
    const content='<div class="activity-header"><span class="small-tag">UNLOCKED · PRACTICAL APPLICATION</span><h1>The CARANA workbench</h1><p class="lead">You have completed the six knowledge checkpoints. Now apply the complete analytical sequence using the existing, unchanged Module 1 activity.</p><div class="activity-note"><strong>Preservation guarantee</strong><p>The exercise below loads the original Module 1 workbench from this copied repository. Its forms, interactions, original storage structure, and exports are not rewritten by the e-learning course.</p></div><div class="workbench-toolbar"><span>ORIGINAL ACTIVITY · SITUATIONAL ANALYSIS</span><a class="btn outline small" target="_blank" rel="noopener" href="../module1.html">Open in full window ↗</a></div><div class="workbench-wrap"><iframe id="workbench-frame" title="Original CARANA CBD Module 1 learning activity" src="../module1.html" loading="lazy"></iframe></div><p class="practice-help">Complete the original exercise and use its confirmation control. Then return here and verify your completion. Your exercise data is stored separately from your lesson checkpoint data.</p><div id="activity-status" class="inline-feedback" role="status" aria-live="polite">Confirmation is checked from the original workbench on this same website.</div><div class="bottom-actions"><button class="btn outline" id="back-to-lesson">← Review Lesson 1</button><button class="btn primary" id="verify-practice">Verify workbench completion →</button></div></div>';
    layout(content,'Lesson 1 · Practical application');
    $('back-to-lesson').addEventListener('click',()=>navigate(5,2));
    $('verify-practice').addEventListener('click',verifyActivity);
  }
  function renderComplete() {
    if(!progress.lessonComplete){openActivity();return;}
    const content='<div class="quiz-success complete"><div class="success-icon">✓</div><span class="micro-label">LESSON 01 · LEARNER COMPLETION</span><h1>Situational Analysis completed.</h1><p>You cleared six knowledge checkpoints and confirmed completion of the original Module 1 activity. Your progress is saved in this browser.</p><div class="completion-stats"><div><strong>18</strong><span>Instructional screens</span></div><div><strong>36 / 36</strong><span>Required answers correct</span></div><div><strong>01</strong><span>Workbench self-confirmation</span></div></div><p class="fine-print">This is a local learner progress record, not an official UN qualification or assessment certificate. Completion of the workbench is based on its existing participant-confirmation control.</p><div class="bottom-actions center"><button class="btn outline" id="review-again">Review lesson</button><button class="btn primary" id="export-completion">Export progress record ↗</button></div></div>';
    layout(content,'Lesson 1 · Complete');
    $('review-again').addEventListener('click',()=>navigate(0,0));
    $('export-completion').addEventListener('click',exportProgress);
  }
  function render() {
    if(mode==='home'){renderHome();return;}
    if(position.kind==='quiz')renderQuiz();
    else if(position.kind==='activity')renderActivity();
    else if(position.kind==='complete')renderComplete();
    else renderScreen();
  }
  window.addEventListener('storage', e => {
    if(e.key===LAB_KEY && mode==='lesson' && position.kind==='activity'){
      const el=$('activity-status');
      if(el && checkOriginalActivity()){el.textContent='The original workbench now reports participant confirmation. Select Verify completion to finish.';el.className='inline-feedback success';}
    }
  });
  render();
})();
