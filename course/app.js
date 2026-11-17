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
  /* Separate, always-available activity collection.
   * These links open the unmodified modules from the SAME deployed origin,
   * not the independent course progress assessment.
   */
  const ACTIVITIES = [
    {num:'01',title:'Situational Analysis',tag:'CONTEXT & DIAGNOSIS',theme:'analysis',desc:'Examine Galasi through PESTEL-S, stakeholders, the CBD areas–dimensions matrix, SWOT and baseline evidence.',url:'../module1.html',steps:'PESTEL-S · 5×6 matrix · SWOT · Baseline'},
    {num:'02',title:'Objective Setting',tag:'FROM GAPS TO GOALS',theme:'objectives',desc:'Transform the evidence from situational analysis into prioritised, measurable capacity-development objectives.',url:'../module2.html',steps:'Prioritisation · SMART · Indicators'},
    {num:'03',title:'Planning Activities',tag:'DESIGN THE RESPONSE',theme:'planning',desc:'Explore structured planning tools to translate objectives into a practical CBD programme.',url:'../module3.html',steps:'Logframe · Risk · Budget'},
    {num:'04',title:'Implementation',tag:'PUT THE PLAN TO WORK',theme:'implementation',desc:'Practice implementation monitoring, mentoring, advising and adaptive problem-solving.',url:'../module4.html',steps:'MMA · Monitoring · Adaptation'},
    {num:'05',title:'Evaluation & Adjustment',tag:'EVIDENCE OF CHANGE',theme:'evaluation',desc:'Compare progress against the baseline, interpret results and consider responsible adjustments.',url:'../module5.html',steps:'Evidence · Evaluation · Adjustment'},
    {num:'06',title:'Transition & Handover',tag:'SUSTAIN THE REFORM',theme:'transition',desc:'Explore ownership, institutionalisation, sustainability and responsible handover.',url:'../module6.html',steps:'Ownership · Sustainability · Handover'}
  ];
  const activityQuickLink = '../CARANA_CBD_Group_Activity.html';
  function openActivities() {
    mode='activities'; document.body.classList.remove('is-learning');
    render();window.scrollTo({top:0,behavior:'instant'});
  }
  function renderHome() {
    const started=!!progress.startedAt;
    const completed=progress.completed.length;
    const percent=Math.round(completed / SECTION_COUNT * 100);
    $('root').innerHTML =
      '<div class="landing premium-landing">' +
      '<div class="opening-gradient"><header class="topbar shell premium-topbar">'+
      '<button class="brand brand-button" id="brand-home" aria-label="CARANA course home"><span class="brand-symbol"><span class="brand-mark">C</span></span><span><strong>CARANA</strong><small>CAPACITY BUILDING · LEARNING STUDIO</small></span></button>'+
      '<nav class="premium-navigation" aria-label="Main navigation"><a href="#course-map">Learning path</a><button id="header-activities">Activities <span class="nav-count">07</span></button><a href="#about">About</a></nav>'+
      '<div class="header-utility"><span class="utility-dot"></span> LEARN INDEPENDENTLY</div></header>'+
      '<section class="hero shell premium-hero"><div class="hero-copy"><div class="hero-overline"><span class="hero-line"></span> AN INTERACTIVE LEARNING EXPERIENCE <span class="hero-overline-number">/ 01—06</span></div>'+
      '<h1>Better analysis.<br><em>Stronger institutions.</em></h1>'+
      '<p class="hero-lead">Build the judgement behind effective police capacity development. Explore the evidence. Test your understanding. Put it into practice inside CARANA.</p>'+
      '<div class="hero-actions"><button class="btn primary xl main-cta" id="start-course">'+(started?'Resume Lesson 01':'Begin Lesson 01')+' <span class="cta-arrow" aria-hidden="true">↗</span></button><button class="btn secondary xl" id="hero-activities">Explore activities <span aria-hidden="true">→</span></button></div>'+
      '<div class="hero-trust"><span>NO LOGIN REQUIRED</span><span class="trust-divider"></span><span>SELF-PACED</span><span class="trust-divider"></span><span>PROGRESS STORED LOCALLY</span></div></div>'+
      '<div class="hero-art premium-visual" aria-label="Illustrated mission-analysis dashboard containing evidence, context and response lenses" role="img">'+
      '<div class="mission-grid"></div><div class="mission-top-label">FIELD ANALYSIS / CARANA</div><div class="mission-main"><div class="mission-top"><span>01</span><span class="mission-live"><i></i> ANALYSIS FIRST</span></div><div class="mission-emblem"><div class="emblem-core">C<span>BD</span></div><div class="emblem-rings"></div></div><div class="mission-title">SITUATIONAL<br>ANALYSIS</div><div class="mission-subtitle">An evidence-based foundation</div><div class="mission-chart"><span style="height:35%"></span><span style="height:68%"></span><span style="height:48%"></span><span style="height:87%"></span><span style="height:58%"></span><span style="height:76%"></span></div></div>'+
      '<div class="mission-callout callout-left"><span>01</span><strong>CONTEXT</strong><small>Read the environment</small></div><div class="mission-callout callout-right"><span>02</span><strong>STAKEHOLDERS</strong><small>Understand interests</small></div><div class="mission-callout callout-bottom"><span>03</span><strong>EVIDENCE</strong><small>Identify real gaps</small></div><div class="mission-bottom-label">A BETTER DECISION STARTS WITH A BETTER DIAGNOSIS</div></div></section></div><main>'+
      '<section class="highlights shell" aria-label="Your learning dashboard"><div class="highlight-title"><span class="highlight-kicker">YOUR COURSE DESK</span><strong>'+(started?'Keep your momentum.':'Start with the fundamentals.')+'</strong><span>'+(started?completed+' checkpoints completed so far':'Learn at your own pace, then apply what you know')+'</span></div>'+
      '<div class="highlight-stat"><strong>06<span>/ 06</span></strong><small>LEARNING BLOCKS</small></div>'+
      '<div class="highlight-stat"><strong>'+String(percent).padStart(2,'0')+'<span>%</span></strong><small>CHECKPOINT PROGRESS</small></div>'+
      '<div class="highlight-action"><button id="strip-activities"><span class="strip-icon">↗</span><span><strong>Activity library</strong><small>Open exercises directly</small></span><span aria-hidden="true">→</span></button></div></section>'+
      '<section id="course-map" class="lesson-section shell premium-lessons"><div class="section-heading"><div><div class="section-eyebrow">01 / CURRICULUM PATHWAY</div><h2>Master the CBD cycle,<br><em>one decision at a time.</em></h2><p>One complete lesson available now. The other five learning lessons will follow, while all original practice tools remain accessible.</p></div><div class="course-status"><span class="status-ring">'+percent+'%</span><span><strong>'+completed+' / 6</strong><small>Checkpoints passed</small></span></div></div>'+
      '<div class="premium-lesson-grid"><div class="lesson-showcase"><div class="showcase-overline"><span>01 / CORE COURSE</span><span class="showcase-status">● READY TO LEARN</span></div><div class="showcase-body"><div><span class="showcase-index">LESSON ONE</span><h3>Situational<br>Analysis</h3><p>Examine the situation you encounter, analyse stakeholders, understand institutional realities, and establish an evidence-based baseline.</p><div class="showcase-tags"><span>CONFLICT</span><span>RESPONSE</span><span>CBD</span><span>SWOT</span></div></div><div class="showcase-diagram" aria-hidden="true"><div class="diagram-ring a"></div><div class="diagram-ring b"></div><div class="diagram-orb">01<span>ASSESS</span></div><div class="diagram-point p1"></div><div class="diagram-point p2"></div></div></div><div class="showcase-bottom"><span><strong>18</strong> learning screens <b>·</b> <strong>36</strong> questions <b>·</b> <strong>01</strong> activity</span><button class="btn primary" id="lesson-one">'+(started?'Continue lesson':'Start lesson')+' <span aria-hidden="true">↗</span></button></div></div>'+
      '<div class="lesson-future-list">'+[
        ['02','Objective Setting','Define your destination.'],
        ['03','Planning Activities','Translate objectives into action.'],
        ['04','Implementation','Support meaningful change.'],
        ['05','Evaluation & Adjustment','Learn from results.'],
        ['06','Transition & Handover','Make progress sustainable.']
      ].map(x=>'<div class="future-lesson"><span>'+x[0]+'</span><div><strong>'+x[1]+'</strong><small>'+x[2]+'</small></div><span class="future-state">COMING LATER</span></div>').join('')+'</div></div></section>'+
      '<section class="activity-teaser"><div class="shell teaser-inner"><div class="teaser-copy"><span class="section-eyebrow">02 / THE PRACTICAL LIBRARY</span><h2>Theory becomes capability<br><em>when you put it to work.</em></h2><p>Six complete CARANA workbenches plus a 60-minute group exercise. Activities are directly accessible for trainers and independent practice—even before finishing a lesson.</p><button class="btn primary xl" id="teaser-activities">Open Activities Hub <span aria-hidden="true">↗</span></button></div><div class="teaser-graphic" aria-hidden="true"><div class="teaser-folder"><span>ACTIVE WORKBENCH</span><strong>CARANA</strong><div class="teaser-chart"><i></i><i></i><i></i></div></div><div class="teaser-ticket">06 <small>INTERACTIVE MODULES</small></div></div></div></section>'+
      '<section class="method-section shell" id="about"><span class="section-eyebrow">03 / HOW THE COURSE WORKS</span><h2>A focused learning sequence.</h2><div class="method-grid">'+[
        ['01','LEARN','Explore concise, interactive learning screens derived from the official lesson plan.'],
        ['02','CHECK','Demonstrate understanding through six-question checkpoints, with feedback and retries.'],
        ['03','APPLY','Open the preserved CARANA activity for hands-on analysis and practical application.']
      ].map(x=>'<div class="method-card"><span>'+x[0]+'</span><h3>'+x[1]+'</h3><p>'+x[2]+'</p></div>').join('')+'</div>'+
      '<p class="course-disclaimer">Independently developed instructional adaptation based on the UNPOL CBD Job-Specific Training curriculum. Not an official United Nations course, certification, or endorsement. Browser-based progress is not a formal training record.</p></section></main>'+
      '<footer class="footer shell"><span>© 2026 CARANA CBD E-Learning · Prepared by Lt. Col. Maissara Selim</span><span>UN curriculum and CARANA scenario acknowledged as their original institutional sources.</span></footer></div>';
    const bindings=[['start-course',resume],['lesson-one',resume],['header-activities',openActivities],['hero-activities',openActivities],['strip-activities',openActivities],['teaser-activities',openActivities]];
    bindings.forEach(([id,fn])=>$(id).addEventListener('click',fn));
    $('brand-home').addEventListener('click',goHome);
  }
  function renderActivities() {
    const openLink = (a,i) =>
      '<article class="activity-card activity-'+clean(a.theme)+'"><div class="activity-card-top"><span class="activity-num">MODULE '+a.num+'</span><span class="activity-open-status">AVAILABLE NOW</span></div><div class="activity-card-visual" aria-hidden="true"><div class="activity-emblem">0'+(i+1)+'</div><div class="activity-lines"><i></i><i></i><i></i></div></div><span class="activity-card-tag">'+clean(a.tag)+'</span><h3>'+clean(a.title)+'</h3><p>'+clean(a.desc)+'</p><div class="activity-steps">'+clean(a.steps)+'</div><div class="activity-card-footer"><a href="'+clean(a.url)+'" class="activity-launch" target="_blank" rel="noopener noreferrer">Launch activity <span aria-hidden="true">↗</span></a><span class="activity-external">OPENS IN NEW TAB</span></div></article>';
    $('root').innerHTML='<div class="activities-page"><header class="activities-header shell"><button class="brand brand-button" id="activities-brand"><span class="brand-symbol"><span class="brand-mark">C</span></span><span><strong>CARANA</strong><small>CAPACITY BUILDING · LEARNING STUDIO</small></span></button><nav class="activity-header-nav" aria-label="Activities navigation"><button id="activities-home">Course home</button><button id="activities-lesson">Go to Lesson 01</button></nav></header>'+
      '<main><section class="activities-hero"><div class="shell"><div class="activities-overline"><span class="mini-square"></span> CARANA FIELD LEARNING / PRACTICAL WORKBENCHES</div><div class="activities-hero-main"><div><h1>Practice is where<br><em>analysis becomes action.</em></h1><p>Use the original CARANA interactive activities independently. All six workbenches are available without completing the course first.</p><div class="hub-actions"><button class="btn primary" id="hub-resume">Continue Lesson 01 ↗</button><button class="btn secondary" id="hub-home">Back to course home</button></div></div><div class="hub-summary"><span>THE PRACTICE LIBRARY</span><strong>06 <small>MODULES</small></strong><div class="hub-summary-line"></div><strong>01 <small>GROUP EXERCISE</small></strong><p>Direct access · No login · Original workbenches preserved</p></div></div></div></section>'+
      '<section class="hub-body shell"><div class="hub-heading"><div><span class="section-eyebrow">01 / INTERACTIVE CBD ACTIVITIES</span><h2>Choose a workbench</h2><p>Each activity opens directly in a separate tab. Progress here does not bypass or mark completion of course checkpoints.</p></div><span class="hub-count">06 AVAILABLE</span></div><div class="activities-grid">'+ACTIVITIES.map(openLink).join('')+'</div>'+
      '<section class="quick-exercise-panel"><div class="quick-exercise-icon"><span>60</span><small>MIN</small></div><div class="quick-exercise-copy"><span class="activity-card-tag">FACILITATED LEARNING / SHORT FORMAT</span><h3>CARANA 60-minute Group Exercise</h3><p>The preserved short-format activity for facilitated syndicate discussions, rapid diagnosis, and a condensed CBD assessment.</p></div><a class="btn primary" target="_blank" rel="noopener noreferrer" href="'+activityQuickLink+'">Open quick exercise <span aria-hidden="true">↗</span></a></section>'+
      '<div class="hub-notice"><strong>Preservation and completion</strong><p>These are links to the unmodified original activity implementations included in the course deployment. All activities are accessible here for practice. To receive Lesson 1 local completion status, pass its six assessments and complete the workbench confirmation step in the guided learning pathway. No formal certificate is issued.</p></div></section></main>'+
      '<footer class="footer shell"><span>CARANA CBD E-Learning · Activities Hub</span><span>Independent instructional adaptation · No UN endorsement implied.</span></footer></div>';
    for(const id of ['activities-brand','activities-home','hub-home'])$(id).addEventListener('click',goHome);
    for(const id of ['activities-lesson','hub-resume'])$(id).addEventListener('click',resume);
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
      '<div class="course-shell"><header class="course-header"><button class="back-home" id="back-home"><span aria-hidden="true">←</span> COURSE HOME</button><div class="header-title">CARANA <span>/</span> CBD E-LEARNING <span>/</span> LESSON 01</div><div class="header-right"><button class="header-activities-link" id="course-activities" aria-label="Open activities hub">▦ Activities <span class="nav-count">07</span></button><span id="save-status">Progress is stored on this device</span><button class="export-mini" id="export-mini">Export progress ↗</button></div></header>' +
      '<div class="workspace"><aside class="side-rail"><div class="rail-overline">LESSON 01</div><h2>Situational<br>Analysis</h2><p>Learn to diagnose before designing change.</p><div class="rail-divider"></div><div class="rail-overline">LEARNING PATH</div><nav aria-label="Course sections">'+railHTML()+'</nav><div class="rail-divider"></div><div class="rail-progress"><div class="rail-progress-row"><span>Knowledge checkpoints</span><strong>'+finished+' / 6</strong></div><div class="progress-track"><i style="width:'+value+'%"></i></div></div><div class="rail-note">Correct responses are required at each checkpoint before moving forward.</div><button class="rail-activity-cta" id="rail-activity-cta"><span class="rail-cta-icon">↗</span><span><strong>Practice library</strong><small>All 7 activities · Quick access</small></span></button></aside>' +
      '<main class="learning-content" id="learning-main"><div class="learning-frame"><div class="content-overline">'+clean(heading)+'</div>'+content+'</div></main>' +
      '<aside class="context-panel"><span class="context-overline">WHY THIS MATTERS</span><h3>Evidence before action.</h3><p>Effective capacity-building begins with a shared understanding of the context, existing assistance, and counterpart reality.</p><div class="context-divider"></div><span class="context-overline">LEARNING OUTCOMES</span><ul>'+lesson.objectives.slice(0,4).map(t=>'<li>'+clean(t)+'</li>').join('')+'</ul><div class="context-divider"></div><span class="context-overline">SOURCE</span><p class="source-small">UNPOL CBD Job-Specific Training · Lesson 1, 2021 / July 2023 file.</p></aside></div></div>';
    $('back-home').addEventListener('click',goHome);
    $('export-mini').addEventListener('click',exportProgress);
    $('course-activities').addEventListener('click',openActivities);
    $('rail-activity-cta').addEventListener('click',openActivities);
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
    const content='<div class="activity-header"><div class="activity-breadcrumb"><span>LESSON 01</span><span>→</span><span>PRACTICAL APPLICATION</span></div><span class="small-tag">UNLOCKED · ORIGINAL INTERACTIVE ACTIVITY</span><h1>Put the evidence<br><em>to work.</em></h1><p class="lead">You have completed all six knowledge checkpoints. Now apply the analytical sequence in the original CARANA Situational Analysis workbench.</p>'+
      '<div class="activity-launch-hero"><div><span class="launch-eyebrow">01 / SITUATIONAL ANALYSIS ACTIVITY</span><strong>CARANA CBD Learning Lab</strong><p>PESTEL-S · Stakeholders · 5×6 CBD matrix · SWOT · Baseline</p><div class="launch-links"><a href="../module1.html" target="_blank" rel="noopener noreferrer" class="btn primary xl">Launch full activity <span aria-hidden="true">↗</span></a><button class="btn outline" id="open-other-activities">All activities →</button></div></div><div class="launch-symbol" aria-hidden="true">01<span>WORKBENCH</span></div></div>'+
      '<div class="activity-note"><strong>Your exercise stays unchanged</strong><p>These controls open the original Module 1 workbench from the source application. The activity, its data format, and its original exercises remain intact. For the best working experience, launch it in a full browser tab.</p></div>'+
      '<div class="activity-frame-head"><div><span>IN-PAGE WORKBENCH</span><p>An embedded option for learners who prefer to stay inside the course.</p></div><button id="toggle-workbench" class="btn outline small" aria-expanded="false" aria-controls="embedded-workbench">Show embedded activity ↓</button></div>'+
      '<div class="embedded-workbench" id="embedded-workbench" hidden><div class="workbench-toolbar"><span>ORIGINAL ACTIVITY · SITUATIONAL ANALYSIS</span><a class="btn outline small" target="_blank" rel="noopener noreferrer" href="../module1.html">Open full window ↗</a></div><div class="workbench-wrap"><iframe id="workbench-frame" title="Original CARANA CBD Module 1 learning activity" loading="lazy" data-src="../module1.html"></iframe></div></div>'+
      '<div class="practice-verification"><div><span class="small-tag">FINAL STEP</span><h2>Confirm your practical work</h2><p>When you complete the exercise in the workbench, use its existing participant confirmation control and return here. This records a self-confirmed completion, not independent performance assessment.</p></div><button class="btn primary" id="verify-practice">Verify completion →</button></div><div id="activity-status" class="inline-feedback" role="status" aria-live="polite">The guided course can check the original workbench confirmation only on this same website and browser.</div>'+
      '<div class="bottom-actions"><button class="btn outline" id="back-to-lesson">← Review Lesson 1</button><button class="btn outline" id="go-to-library">Browse other activities ↗</button></div></div>';
    layout(content,'Lesson 1 · Practical application');
    $('back-to-lesson').addEventListener('click',()=>navigate(5,2));
    $('verify-practice').addEventListener('click',verifyActivity);
    $('open-other-activities').addEventListener('click',openActivities);
    $('go-to-library').addEventListener('click',openActivities);
    $('toggle-workbench').addEventListener('click',()=>{
      const target=$('embedded-workbench'),button=$('toggle-workbench');
      const willOpen=target.hidden;
      target.hidden=!willOpen;
      button.setAttribute('aria-expanded',String(willOpen));
      button.textContent=willOpen?'Hide embedded activity ↑':'Show embedded activity ↓';
      if(willOpen){
        const frame=$('workbench-frame');
        if(!frame.getAttribute('src'))frame.setAttribute('src',frame.dataset.src);
      }
    });
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
    if(mode==='activities'){renderActivities();return;}
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
