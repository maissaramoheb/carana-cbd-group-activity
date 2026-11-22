/* CARANA CBD Course — standalone learner shell.
 * Original CARANA workbench is loaded UNMODIFIED from ../module1.html.
 * Separate storage keys prevent overwriting original exercise state.
 */
(function () {
  'use strict';
  const baseLesson = window.CARANA_LESSON1;
  const i18n = window.CARANA_I18N;
  if (i18n && typeof i18n.registerSurfaces === 'function') {
    i18n.registerSurfaces(['ui', 'course-l1']);
  }
  const KEY = 'carana_cbd_course_v1';
  const LAB_KEY = 'carana_cbd_lab_v1';
  const SECTION_COUNT = baseLesson.sections.length;
  function getCourseStrings() {
    const isEn = !i18n || i18n.getLang() === 'en';
    const ui = !isEn ? (i18n.getPack('ui') || {}) : {};
    return { isEn, ui, c: ui.course || {}, act: ui.activities || {} };
  }
  function getLocalizedLesson() {
    const isEn = !i18n || i18n.getLang() === 'en';
    const loc = !isEn ? i18n.getPack('course-l1')?.lesson : null;
    if (!loc) return baseLesson;
    return {
      ...baseLesson,
      title: loc.title || baseLesson.title,
      subtitle: loc.subtitle || baseLesson.subtitle,
      source: loc.source || baseLesson.source,
      objectives: Array.isArray(loc.objectives) ? loc.objectives : baseLesson.objectives,
      sections: baseLesson.sections.map((sec, sIdx) => {
        const lSec = loc.sections && loc.sections[sIdx];
        if (!lSec) return sec;
        return {
          ...sec,
          title: lSec.title || sec.title,
          duration: lSec.duration || sec.duration,
          screens: sec.screens.map((sc, scIdx) => {
            const lSc = lSec.screens && lSec.screens[scIdx];
            return lSc ? { ...sc, ...lSc } : sc;
          }),
          quiz: sec.quiz.map((q, qIdx) => {
            const lQ = lSec.quiz && lSec.quiz[qIdx];
            return lQ ? { ...q, q: lQ.q || q.q, options: lQ.options || q.options, why: lQ.why || q.why, optionFeedback: lQ.optionFeedback || q.optionFeedback } : q;
          })
        };
      })
    };
  }
  let lesson = getLocalizedLesson();
  let mode = window.location && window.location.hash === '#activities' ? 'activities' : 'home';
  let position = { section: 0, screen: 0, kind: 'screen' };
  let answers = {};
  const attempts = new Map();
  let saveFailed = false;
  let checked = false;
  let missed = [];
  const $ = id => document.getElementById(id);
  const pathMedia=window.matchMedia?.('(min-width:901px)');
  pathMedia?.addEventListener?.('change',e=>{const menu=document.querySelector('.l1-path-menu');if(menu)menu.open=e.matches;});
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
      const completed = [];
      while (completed.length < SECTION_COUNT && raw.completed.includes(completed.length)) completed.push(completed.length);
      const section = Number.isInteger(raw.lastSection) && raw.lastSection >= 0 ? Math.min(raw.lastSection, completed.length, SECTION_COUNT - 1) : 0;
      const canResume = section === raw.lastSection;
      const activityOpened = completed.length === SECTION_COUNT && raw.activityOpened === true;
      const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
      return {
        ...initial(), completed, activityOpened, lessonComplete: activityOpened && raw.lessonComplete === true,
        visited: Array.isArray(raw.visited) ? [...new Set(raw.visited.filter(x => typeof x === 'string' && /^[0-5]:[0-2]$/.test(x)))] : [],
        lastSection: section,
        lastScreen: canResume && Number.isInteger(raw.lastScreen) && raw.lastScreen >= 0 && raw.lastScreen < lesson.sections[section].screens.length ? raw.lastScreen : 0,
        lastKind: canResume && raw.lastKind === 'quiz' ? 'quiz' : 'screen',
        startedAt: date(raw.startedAt), updatedAt: date(raw.updatedAt)
      };
    } catch (_) { return initial(); }
  }
  let progress = load();
  function save() {
    progress.updatedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(progress)); saveFailed = false; }
    catch (_) { saveFailed = true; }
    updateStatus();
  }
  function updateStatus() {
    const el = $('save-status');
    if (!el) return;
    const { isEn, c } = getCourseStrings();
    if (isEn) {
      el.textContent = saveFailed ? 'Progress could not be saved. Export your progress record before closing.' : progress.updatedAt ? 'Saved on this device · ' + new Date(progress.updatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : 'Progress is stored on this device';
    } else {
      el.textContent = saveFailed ? (c.saveFailed || 'Save failed') : progress.updatedAt ? ((c.saveSavedAt || 'Saved') + ' · ' + new Date(progress.updatedAt).toLocaleTimeString(i18n.getLocaleMeta().bcp47, {hour:'2-digit',minute:'2-digit'})) : (c.saveStored || 'Progress stored locally');
    }
  }
  function isCleared(s) { return progress.completed.includes(s); }
  function canOpen(s) { return s === 0 || Array.from({length:s}, (_,i) => i).every(isCleared); }
  function isAllCleared() { return lesson.sections.every((_,i) => isCleared(i)); }
  function markVisited(s, n) {
    const k = s + ':' + n;
    if (!progress.visited.includes(k)) progress.visited.push(k);
  }
  function focusHeading() {
    const heading = document.querySelector('#root main h1, #root h1');
    if (heading) { heading.tabIndex = -1; heading.focus({preventScroll:true}); }
  }
  function restoreAttempt(section) {
    if (!attempts.has(section)) attempts.set(section, {});
    answers = attempts.get(section);
    checked = false;
    missed = [];
  }
  function goHome() { mode = 'home'; document.body.classList.remove('is-learning'); if(window.location && window.location.hash !== '#home')window.location.hash='#home'; render(); focusHeading(); window.scrollTo({top:0,behavior:'instant'}); }
  function resume() {
    mode = 'lesson';
    if(window.location && window.location.hash !== '#lesson-1')window.location.hash='#lesson-1';
    document.body.classList.add('is-learning');
    if (isAllCleared() && progress.activityOpened) {
      position = {section:SECTION_COUNT - 1,screen:2,kind:progress.lessonComplete ? 'complete' : 'activity'};
    } else {
      const s = progress.lastSection;
      position = { section: s, screen: progress.lastScreen, kind: progress.lastKind };
      if (position.kind === 'quiz') restoreAttempt(s);
    }
    render(); focusHeading(); window.scrollTo({top:0,behavior:'instant'});
  }
  function navigate(s,n,kind) {
    if (!canOpen(s)) return;
    mode = 'lesson';
    document.body.classList.add('is-learning');
    position = {section:s,screen:n,kind:kind||'screen'};
    if (position.kind==='screen') markVisited(s,n);
    if (position.kind==='quiz') restoreAttempt(s);
    progress.lastSection=s; progress.lastScreen=n; progress.lastKind=position.kind;
    if (!progress.startedAt) progress.startedAt = new Date().toISOString();
    save(); render(); focusHeading(); window.scrollTo({top:0,behavior:'instant'});
  }
  function openActivity() {
    if (!isAllCleared()) return;
    progress.activityOpened = true;
    progress.lastKind='activity';
    save();
    mode='lesson';
    position={section:SECTION_COUNT-1,screen:2,kind:'activity'};
    render(); focusHeading(); window.scrollTo({top:0,behavior:'instant'});
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
      const { isEn, c } = getCourseStrings();
      status.textContent = isEn ? 'The original Module 1 workbench has not yet recorded participant confirmation. Finish and confirm it inside the workbench, then verify again.' : (c.practiceNotRecorded || '');
      status.className = 'inline-feedback warning';
      return;
    }
    const newlyComplete = !progress.lessonComplete;
    progress.lessonComplete=true; progress.lastKind='complete'; save();
    if (newlyComplete) window.CARANA_MONITORING?.event('lesson_completed', 'cbd-1');
    position.kind='complete'; render(); focusHeading();
  }
  function exportProgress(filename = 'carana-cbd-lesson1-progress.json', data = progress) {
    const bundle = {course:'CARANA CBD E-Learning',lesson:baseLesson.title,progress:data,exploration:window.CARANA_EXPLORATION?.store.exportFor(['cbd-1']),source:baseLesson.source,exportedAt:new Date().toISOString(),note:'Learner-side progress record, not a UN-issued certificate.'};
    const link=document.createElement('a');
    const blob=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    link.href=url; link.download=filename; document.body.append(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const FORBIDDEN_KEYS=new Set(['__proto__','constructor','prototype']);
  function validateL1Backup(text) {
    const { isEn, c } = getCourseStrings();
    if(typeof text!=='string'||text.length>2*1024*1024)return {ok:false,message:isEn?'File exceeds the 2 MB local restore limit.':(c.restoreErrSize||'File exceeds 2 MB limit.')};
    let parsed;
    try{parsed=JSON.parse(text,(k,v)=>FORBIDDEN_KEYS.has(k)?undefined:v);}catch(_){return {ok:false,message:isEn?'The selected file is not valid JSON. Existing Lesson 1 progress was not changed.':(c.restoreErrJson||'Invalid JSON.')};}
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return {ok:false,message:isEn?'Invalid backup format: expected a JSON object.':(c.restoreErrObject||'Expected JSON object.')};
    if(parsed.app==='CARANA CBD Learning Lab'&&parsed.module1)return {ok:false,message:isEn?'This file is an original CARANA Practical Workbench export (carana_cbd_lab_v1). Open Module 1–6 to restore workbench data.':(c.restoreErrWbFile||'Workbench file detected.')};
    if(parsed.version===1&&parsed.progress?.version===1&&parsed.progress?.lessons)return {ok:false,message:isEn?'This file is a Lessons 2–6 platform export (carana_learning_v1). Use Restore progress in the CBD home study support section or Lessons 2–6 rail.':(c.restoreErrPlatformFile||'Lessons 2–6 file detected.')};
    const p=parsed.progress;
    if(parsed.course!=='CARANA CBD E-Learning'||!p||typeof p!=='object'||p.version!==1||!Array.isArray(p.completed))return {ok:false,message:isEn?'Unrecognized Lesson 1 export schema. Expected a CARANA CBD Lesson 1 progress JSON file.':(c.restoreErrSchema||'Unrecognized schema.')};
    const exploration=parsed.exploration===undefined?null:window.CARANA_EXPLORATION?.validate(parsed.exploration);
    if(parsed.exploration!==undefined&&!exploration?.ok)return {ok:false,message:isEn?'Invalid exploration history. Existing Lesson 1 progress was not changed.':(c.restoreErrExplore||'Invalid exploration history.')};
    const completed=[];while(completed.length<SECTION_COUNT&&p.completed.includes(completed.length))completed.push(completed.length);
    const visited=Array.isArray(p.visited)?[...new Set(p.visited.filter(x=>typeof x==='string'&&/^[0-5]:[0-2]$/.test(x)))]:[];
    const lastSection=Number.isInteger(p.lastSection)&&p.lastSection>=0?Math.min(p.lastSection,completed.length,SECTION_COUNT-1):0;
    const lastScreen=Number.isInteger(p.lastScreen)&&p.lastScreen>=0&&p.lastScreen<baseLesson.sections[lastSection].screens.length?p.lastScreen:0;
    const lastKind=['screen','quiz','activity','complete'].includes(p.lastKind)?p.lastKind:'screen';
    const activityOpened=completed.length===SECTION_COUNT&&p.activityOpened===true;
    const lessonComplete=activityOpened&&p.lessonComplete===true;
    const dateOrNull=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))?v:null;
    return {ok:true,exploration:exploration?.value,exportedAt:typeof parsed.exportedAt==='string'?parsed.exportedAt:null,sanitized:{version:1,completed,visited,activityOpened,lessonComplete,lastSection,lastScreen,lastKind,startedAt:dateOrNull(p.startedAt),updatedAt:dateOrNull(p.updatedAt)}};
  }
  function applyL1Restore(sanitized, restoreMode, exploration) {
    if(progress.startedAt||progress.completed.length>0||progress.visited.length>0){
      try{localStorage.setItem(KEY+'_pre_restore',JSON.stringify(progress));}catch(_){}
      exportProgress('carana-cbd-lesson1-pre-restore.json',progress);
    }
    if(restoreMode==='replace'||!progress.startedAt){
      progress=sanitized;
    }else{
      const completed=[];const mergedSet=new Set([...progress.completed,...sanitized.completed]);
      while(completed.length<SECTION_COUNT&&mergedSet.has(completed.length))completed.push(completed.length);
      const visited=[...new Set([...progress.visited,...sanitized.visited])];
      const activityOpened=completed.length===SECTION_COUNT&&(progress.activityOpened||sanitized.activityOpened);
      const lessonComplete=activityOpened&&(progress.lessonComplete||sanitized.lessonComplete);
      const lastSection=Math.min(Math.max(progress.lastSection||0,sanitized.lastSection||0),completed.length,SECTION_COUNT-1);
      progress={
        version:1,completed,visited,activityOpened,lessonComplete,
        lastSection,
        lastScreen:sanitized.lastSection>progress.lastSection?sanitized.lastScreen:progress.lastScreen,
        lastKind:lessonComplete?'complete':activityOpened?'activity':(sanitized.lastSection>progress.lastSection?sanitized.lastKind:progress.lastKind),
        startedAt:progress.startedAt||sanitized.startedAt,updatedAt:new Date().toISOString()
      };
    }
    save();
    if(exploration)window.CARANA_EXPLORATION.store.importFor(exploration,['cbd-1'],restoreMode);
    if(mode==='lesson'){
      if(isAllCleared()&&progress.activityOpened){position={section:SECTION_COUNT-1,screen:2,kind:progress.lessonComplete?'complete':'activity'};}
      else{position={section:progress.lastSection,screen:progress.lastScreen,kind:progress.lastKind};if(position.kind==='quiz')restoreAttempt(position.section);}
    }
  }
  function openL1RestoreDialog(previewEl, fileInput) {
    if(!previewEl||!fileInput)return;
    fileInput.value='';
    fileInput.onchange=async()=>{
      const { isEn, ui, c } = getCourseStrings();
      const closeTxt = isEn ? 'Close' : ((ui.common && ui.common.close) || 'Close');
      const file=fileInput.files&&fileInput.files[0];if(!file)return;
      const text=await file.text().catch(()=>'');
      const plan=validateL1Backup(text);
      previewEl.hidden=false;
      if(!plan.ok){
        previewEl.className='l1-restore-preview warning';
        previewEl.innerHTML='<strong>'+clean(isEn?'Restore did not apply':(c.restoreErrorTitle||'Restore did not apply'))+'</strong><p>'+clean(plan.message)+'</p><button type="button" class="btn outline small" id="l1-restore-close">'+clean(closeTxt)+'</button>';
        $('l1-restore-close').onclick=()=>{previewEl.hidden=true;previewEl.innerHTML='';};
        return;
      }
      const inc=plan.sanitized;
      previewEl.className='l1-restore-preview';
      const diagCount = plan.exploration ? Object.keys(plan.exploration.records).filter(k=>k.startsWith('cbd-1/')).length : 0;
      const diagNote = plan.exploration ? (isEn
        ? ('<p class="fine-print">Includes explanatory history for '+diagCount+' saved diagram revision(s), separate from checkpoint achievement.</p>')
        : ('<p class="fine-print">'+clean(i18n.t('course.restoreDiagCount',{count:diagCount},''))+'</p>')) : '';
      const summaryLine = isEn
        ? ('<p>File contains <strong>'+inc.completed.length+' / 6</strong> checkpoints, '+inc.visited.length+' visited screen(s)'+(inc.lessonComplete?', and confirmed practical completion.':'.')+' Current browser has <strong>'+progress.completed.length+' / 6</strong> checkpoints.</p>')
        : ('<p>'+i18n.t('course.restoreSummaryHtml',{completed:inc.completed.length,visited:inc.visited.length,doneSuffix:inc.lessonComplete?(c.restoreDoneSuffix||''):'',localCompleted:progress.completed.length},'')+'</p>');
      const preBackup = (progress.completed.length||progress.visited.length)
        ? ('<p class="fine-print">'+clean(isEn?'An automatic pre-restore backup JSON will download before applying changes.':(c.restorePreBackupNote||''))+'</p>') : '';
      previewEl.innerHTML='<strong>'+clean(isEn?('Dry-run restore preview · '+file.name):i18n.t('course.restoreDryRun',{file:file.name},''))+'</strong>'+
        diagNote + summaryLine + preBackup +
        '<div class="l1-restore-actions"><button type="button" class="btn primary small" id="l1-restore-merge">'+clean(isEn?'Merge with current progress':(c.restoreMerge||'Merge'))+'</button><button type="button" class="btn outline small" id="l1-restore-replace">'+clean(isEn?'Replace Lesson 1 progress':(c.restoreReplace||'Replace'))+'</button><button type="button" class="btn outline small" id="l1-restore-cancel">'+clean(isEn?'Cancel':(c.restoreCancel||'Cancel'))+'</button></div>';
      $('l1-restore-merge').onclick=()=>{applyL1Restore(inc,'merge',plan.exploration);previewEl.hidden=true;render();focusHeading();};
      $('l1-restore-replace').onclick=()=>{applyL1Restore(inc,'replace',plan.exploration);previewEl.hidden=true;render();focusHeading();};
      $('l1-restore-cancel').onclick=()=>{previewEl.hidden=true;previewEl.innerHTML='';};
    };
    fileInput.click();
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
    mode='activities'; if(window.location && window.location.hash !== '#activities')window.location.hash='#activities'; document.body.classList.remove('is-learning');
    render();focusHeading();window.scrollTo({top:0,behavior:'instant'});
  }
  /* Canonical CBD six-phase storyline for the home and curriculum pathway.
   * Each phase's original workbench exists. Phase 1 is narrated; Phases 2–6 are review adaptations.
   */
  const CURRICULUM_PHASES = [
    {num:'01',name:'Situational Analysis',lines:'Situational<br>Analysis',lens:'UNDERSTAND THE CONTEXT',summary:'Understand the operating environment, the counterpart institution, and the actual capacity gaps before designing support.',question:'What is happening, and what really needs to change?',status:'LESSON AVAILABLE',activity:'Original workbench available'},
    {num:'02',name:'Objective Setting',lines:'Objective<br>Setting',lens:'SET THE DIRECTION',summary:'Translate evidence and identified capacity gaps into prioritised objectives and measurable results.',question:'What should capacity development achieve?',status:'REVIEW ADAPTATION AVAILABLE',activity:'Original workbench available'},
    {num:'03',name:'Planning Activities',lines:'Planning<br>Activities',lens:'DESIGN THE APPROACH',summary:'Choose coherent activities, resources, responsibilities and risk responses to support the agreed objectives.',question:'How will the intended results be delivered?',status:'REVIEW ADAPTATION AVAILABLE',activity:'Original workbench available'},
    {num:'04',name:'Implementation',lines:'Implementation',lens:'PUT PLANS INTO PRACTICE',summary:'Deliver support, monitor implementation, work with counterparts, and adapt when operating realities change.',question:'How do we make change happen responsibly?',status:'REVIEW ADAPTATION AVAILABLE',activity:'Original workbench available'},
    {num:'05',name:'Evaluation & Adjustment',lines:'Evaluation &<br>Adjustment',lens:'LEARN AND ADAPT',summary:'Use evidence to judge progress, identify what is and is not working, and adjust the approach accordingly.',question:'What is changing, and what should improve?',status:'REVIEW ADAPTATION AVAILABLE',activity:'Original workbench available'},
    {num:'06',name:'Transition & Handover',lines:'Transition &<br>Handover',lens:'SUSTAIN THE OUTCOMES',summary:'Strengthen national ownership and continuity so that institutional capability remains after external support ends.',question:'How will progress endure beyond the mission?',status:'REVIEW ADAPTATION AVAILABLE',activity:'Original workbench available'}
  ];
  function getLocalizedPhases() {
    const { isEn, c } = getCourseStrings();
    if (isEn || !Array.isArray(c.phasesMeta)) return CURRICULUM_PHASES;
    return CURRICULUM_PHASES.map((p, idx) => ({ ...p, ...(c.phasesMeta[idx] || {}) }));
  }

  function renderHome() {
    const { isEn, ui, c } = getCourseStrings();
    const phases = getLocalizedPhases();
    document.title = isEn ? 'CARANA · CBD E-Learning | The Six-Phase Learning Journey' : (c.pageTitleHome || document.title);
    const started=!!progress.startedAt;
    const completed=progress.completed.length;
    const tr = (key, vars, fb) => isEn ? fb : i18n.t(key, vars, fb);
    const langParam = isEn ? '' : ('&amp;lang=' + encodeURIComponent(i18n.getLang()));
    const rawLangParam = isEn ? '' : ('&lang=' + encodeURIComponent(i18n.getLang()));
    const stageHref = i => i === 0 ? '#lesson-1' : ('../platform/?course=cbd&lesson=cbd-' + (i + 1) + rawLangParam);
    const defaultMeta = {
      eyebrow: tr('course.orbitDefaultEyebrow', null, 'THE FULL CURRICULUM'),
      title: tr('course.orbitDefaultTitle', null, 'Six phases. One connected journey.'),
      copy: tr('course.orbitDefaultCopy', null, 'Select any phase to explore its purpose and available practical activity.'),
      action: tr('course.orbitDefaultAction', null, 'Explore all phases')
    };
    const getDetailState = indexOrNull => {
      if (indexOrNull === null || !phases[indexOrNull]) {
        return { eyebrow: defaultMeta.eyebrow, title: defaultMeta.title, copy: defaultMeta.copy, action: defaultMeta.action, href: '#course-map' };
      }
      const phase = phases[indexOrNull];
      return {
        eyebrow: isEn ? ('PHASE ' + phase.num + ' / ' + phase.lens) : i18n.t('course.orbitPhasePrefix', { num: phase.num, lens: phase.lens }, ''),
        title: phase.name,
        copy: phase.summary,
        action: indexOrNull === 0
          ? (isEn ? 'Enter lesson 01' : (c.orbitEnterL1 || 'Enter lesson 01'))
          : (isEn ? ('Open phase ' + phase.num + ' review lesson') : i18n.t('course.orbitOpenPhase', { num: phase.num }, '')),
        href: stageHref(indexOrNull)
      };
    };
    const renderDetailLayer = (state, isLive) => isLive
      ? '<div class="cycle-detail-layer cycle-detail-live"><div class="cycle-detail-copy"><span id="cycle-caption-phase">' + clean(state.eyebrow) + '</span><strong id="cycle-caption-title">' + clean(state.title) + '</strong><p id="cycle-caption-copy">' + clean(state.copy) + '</p></div><a id="cycle-caption-action" href="' + clean(state.href) + '" class="cycle-detail-action">' + clean(state.action) + ' <span aria-hidden="true">↗</span></a></div>'
      : '<div class="cycle-detail-layer cycle-detail-sizer" aria-hidden="true" inert><div class="cycle-detail-copy"><span>' + clean(state.eyebrow) + '</span><strong>' + clean(state.title) + '</strong><p>' + clean(state.copy) + '</p></div><span class="cycle-detail-action">' + clean(state.action) + ' <span aria-hidden="true">↗</span></span></div>';
    const detailSizers = [null, 0, 1, 2, 3, 4, 5].map(idx => renderDetailLayer(getDetailState(idx), false)).join('');
    const launchIcon = '<span class="cycle-stage-launch" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 9.5L9.5 2.5M4 2.5H9.5V8"/></svg></span>';
    const stageLinks = phases.map((phase, i) =>
      '<a class="cycle-stage stage-' + phase.num + '" data-cycle-phase="' + i + '" href="' + (i === 0 ? '#lesson-1' : ('../platform/?course=cbd&amp;lesson=cbd-' + (i + 1) + langParam)) + '">' +
      '<span class="cycle-stage-number">' + phase.num + '</span><span class="cycle-stage-copy"><strong>' + phase.lines + '</strong><small>' + (i === 0 ? clean(tr('course.orbitStageBadgeLive', null, 'SELF-PACED LESSON LIVE')) : clean(tr('course.orbitStageBadgeReview', null, 'REVIEW + PRACTICE'))) + '</small></span>' + launchIcon + '</a>'
    ).join('');
    const orbitCx = 280, orbitCy = 242, pt = (r, deg) => {
      const rad = deg * Math.PI / 180;
      return [+(orbitCx + r * Math.cos(rad)).toFixed(1), +(orbitCy + r * Math.sin(rad)).toFixed(1)];
    };
    const phaseAngles = [-90, -27.2, 27.9, 90, 152.1, -152.8];
    const orbitConnectors = phaseAngles.map((deg, i) => {
      const [x1, y1] = pt(104, deg), [nx, ny] = pt(149, deg), [x2, y2] = pt(172, deg);
      const [sx, sy] = pt(149, deg - 16), [ex, ey] = pt(149, deg + 16);
      return '<g class="orbit-connector" data-orbit-phase="' + i + '">' +
        '<path class="orbit-arc-glow" d="M ' + sx + ' ' + sy + ' A 149 149 0 0 1 ' + ex + ' ' + ey + '"/>' +
        '<line class="orbit-spoke-base" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>' +
        '<line class="orbit-spoke-beam" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>' +
        '<circle class="orbit-node-socket" cx="' + nx + '" cy="' + ny + '" r="7.5"/>' +
        '<circle class="orbit-node-core" cx="' + nx + '" cy="' + ny + '" r="3.4"/>' +
        '</g>';
    }).join('');
    const orbitChevrons = [-58.6, 0.35, 58.95, 121.05, 180, -121.4].map(deg => {
      const [cx, cy] = pt(149, deg);
      return '<path class="orbit-flow-chevron" d="M -3.2 -4.5 L 2.2 0 L -3.2 4.5" transform="translate(' + cx + ' ' + cy + ') rotate(' + (deg + 90) + ')"/>';
    }).join('');
    const phaseCards=phases.map((phase,i)=>
      '<article class="curriculum-phase-card curriculum-phase-'+phase.num+'"><div class="curriculum-card-header">'+
      '<span class="curriculum-card-number">'+phase.num+'</span><span class="curriculum-availability '+(i===0?'ready':'review')+'">'+(i===0?clean(tr('course.cardBadgeLive',null,'SELF-PACED LESSON READY')):clean(tr('course.cardBadgeReview',null,'REVIEW LESSON READY')))+'</span></div>'+
      '<span class="curriculum-lens">'+clean(phase.lens)+'</span><h3>'+clean(phase.name)+'</h3>'+
      '<p>'+clean(phase.summary)+'</p><p class="curriculum-progress" data-home-progress="cbd-'+(i+1)+'"></p>'+
      '<div class="curriculum-key-question"><span>'+clean(tr('course.cardCoreQLabel',null,'THE CORE QUESTION'))+'</span><strong>'+clean(phase.question)+'</strong></div>'+
      '<div class="curriculum-card-foot">'+
      (i===0?'<button id="lesson-one" class="curriculum-learn" type="button">'+(started?clean(tr('course.cardBtnResume',null,'Resume learning')):clean(tr('course.cardBtnBegin',null,'Begin learning')))+' <span aria-hidden="true">↗</span></button>':
      '<a class="curriculum-learn secondary-link" data-home-lesson="cbd-'+(i+1)+'" href="../platform/?course=cbd&amp;lesson=cbd-'+(i+1)+'">'+clean(tr('course.cardBtnReview',null,'Explore review lesson'))+' <span aria-hidden="true">↗</span></a>')+
      '<a href="'+clean(ACTIVITIES[i].url)+'" target="_blank" rel="noopener noreferrer" class="curriculum-activity-link">'+clean(tr('course.cardBtnActivity',null,'Open activity'))+' <span aria-hidden="true">↗</span></a></div></article>'
    ).join('');
    const routeSteps = isEn ? ['UNDERSTAND','PRIORITISE','PLAN','DELIVER','LEARN','SUSTAIN'] : (i18n.rawList('course.routeSteps',['UNDERSTAND','PRIORITISE','PLAN','DELIVER','LEARN','SUSTAIN']));
    const methodCards = isEn ? [
       ['01','UNDERSTAND','Work through short, structured learning screens aligned with the corresponding CBD lesson plan.'],
       ['02','TEST YOUR JUDGEMENT','Answer formative checkpoints, review feedback, and demonstrate understanding before progressing.'],
       ['03','APPLY','Open the original CARANA exercise and transfer your knowledge to a practical scenario.']
    ] : (i18n.rawList('course.methodCards',[]));
    $('root').innerHTML=
      '<div class="landing premium-landing curriculum-landing">'+
      '<div class="opening-gradient curriculum-opening"><header class="topbar shell premium-topbar">'+
      '<a class="brand brand-button" id="brand-home" href="#home"><span class="brand-symbol" aria-hidden="true"><span class="brand-mark">C</span></span><span><strong>'+clean(tr('common.brand',null,'CARANA'))+'</strong><small>'+clean(tr('course.brandSub',null,'CAPACITY BUILDING · LEARNING STUDIO'))+'</small></span></a>'+
      '<nav class="premium-navigation" aria-label="Main navigation"><a href="#course-map">'+clean(tr('course.navCycle',null,'The CBD cycle'))+'</a><button id="header-activities">'+clean(tr('course.navActivities',null,'Activities'))+' <span class="nav-count">07</span></button><a href="#about">'+clean(tr('course.navHowItWorks',null,'How it works'))+'</a></nav>'+
      '<div class="header-utility"><span class="utility-dot"></span> '+clean(tr('course.utilityPill',null,'SELF-PACED · PRACTICE-DRIVEN'))+'</div><span id="home-lang-slot"></span></header>'+
      '<section class="hero shell premium-hero curriculum-hero"><div class="hero-copy">'+

      '<h1>'+tr('course.heroHeadingHtml',null,'Build capability.<br><em>Strengthen institutions.</em>')+'</h1>'+
      '<p class="hero-lead">'+clean(tr('course.heroLeadFull',null,'Explore the full cycle of police Capacity Building and Development—from understanding the situation and setting priorities to implementation, evaluation, and sustainable handover.'))+'</p>'+
      '<div class="hero-actions"><a class="btn primary xl main-cta" href="#course-map">'+clean(tr('course.heroBtnCycle',null,'Explore the CBD cycle'))+' <span class="cta-arrow" aria-hidden="true">↗</span></a>'+
      '<button class="btn secondary xl" id="start-course">'+(started?clean(tr('course.heroBtnResumeL1',null,'Resume Lesson 01')):clean(tr('course.heroBtnStartL1',null,'Start with Lesson 01')))+' <span aria-hidden="true">↗</span></button></div>'+

      '</div>'+
      '<div class="hero-art premium-visual curriculum-visual" role="group" aria-label="Interactive diagram of the six phases of the CBD cycle">'+

      '<div class="cycle-orbit"><div class="cycle-grid" aria-hidden="true"></div>'+
      '<svg class="cycle-orbit-svg" viewBox="0 0 560 484" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">'+
      '<circle class="orbit-atmosphere-band" cx="280" cy="242" r="200"/>'+
      '<circle class="orbit-outer-ring" cx="280" cy="242" r="181"/>'+
      '<circle class="orbit-recessed-well" cx="280" cy="242" r="115"/>'+
      '<circle class="orbit-recessed-trough" cx="280" cy="242" r="124"/>'+
      '<circle class="orbit-recessed-ticks" cx="280" cy="242" r="122"/>'+
      '<circle class="orbit-recessed-lip" cx="280" cy="242" r="129"/>'+
      '<circle class="orbit-pathway-shadow" cx="280" cy="246" r="149"/>'+
      '<circle class="orbit-pathway-base" cx="280" cy="242" r="149"/>'+
      '<circle class="orbit-pathway-highlight" cx="280" cy="242" r="149"/>'+
      orbitConnectors+orbitChevrons+
      '</svg>'+
      '<div class="cycle-core"><span class="cycle-core-dial" aria-hidden="true"></span><div class="cycle-core-title">'+clean(tr('course.orbitCenterTitle',null,'CBD'))+'</div><span class="cycle-core-full">'+tr('course.orbitCenterSub',null,'CAPACITY BUILDING<br>& DEVELOPMENT')+'</span></div>'+
      stageLinks+
      '</div>'+
      '<div class="cycle-detail">' + renderDetailLayer(getDetailState(null), true) + detailSizers + '</div>'+
      '</div></section></div><main>'+
      '<section class="highlights shell curriculum-highlights" aria-label="CBD course and activity availability"><div class="highlight-title"><span class="highlight-kicker">'+clean(tr('course.deskKicker',null,'YOUR CBD LEARNING DESK'))+'</span><strong>'+(started?clean(tr('course.deskTitleStarted',null,'Continue your learning journey.')):clean(tr('course.deskTitleFresh',null,'Explore the complete curriculum.')))+'</strong><span>'+(started?clean(tr('course.deskSubStarted',{done:completed},'Lesson 1: '+completed+' of 6 checkpoints passed')):clean(tr('course.deskSubFresh',null,'Six phases, each connected to practical application')))+'</span></div>'+
      '<div class="highlight-stat"><strong>06</strong><small>'+clean(tr('course.statPhases',null,'CURRICULUM PHASES'))+'</small></div>'+
      '<div class="highlight-stat"><strong>01<span>+05</span></strong><small>'+clean(tr('course.statLessons',null,'LIVE + REVIEW LESSONS'))+'</small></div>'+
      '<div class="highlight-stat curriculum-checkpoints"><strong>'+completed+'<span>/06</span></strong><small>'+clean(tr('course.statCheckpoints',null,'LESSON 01 CHECKPOINTS'))+'</small></div>'+
      '<div class="highlight-action"><button id="strip-activities"><span class="strip-icon">↗</span><span><strong>'+clean(tr('course.stripLibTitle',null,'Practical library'))+'</strong><small>'+clean(tr('course.stripLibSub',null,'7 activities · Available now'))+'</small></span><span aria-hidden="true">→</span></button></div></section>'+
      '<section id="course-map" class="lesson-section shell curriculum-lessons"><div class="section-heading"><div><div class="section-eyebrow">'+clean(tr('course.mapEyebrow',null,'01 / THE COMPLETE CBD CURRICULUM'))+'</div>'+
      '<h2>'+tr('course.mapHeadingHtml',null,'Six phases. <em>One mission: lasting capacity.</em>')+'</h2>'+
      '<p>'+clean(tr('course.mapLead',null,'The CBD process is interconnected. Each phase informs the next, and lessons learned can lead back to renewed analysis and priorities. Explore the full pathway below. Each lesson retains its own progress and practical connection.'))+'</p></div>'+
      '<div class="curriculum-roadmap-note"><span class="roadmap-dot"></span><strong>'+clean(tr('course.mapRoadmapTag',null,'L1 LIVE · L2–6 IN REVIEW'))+'</strong><small>'+clean(tr('course.mapRoadmapSub',null,'All six practical workbenches available'))+'</small></div></div>'+
      '<div class="curriculum-route" tabindex="0" role="group" aria-label="The six phases of the CBD cycle">'+routeSteps.map(s=>'<span>'+clean(s)+'</span>').join('<b>›</b>')+'<b class="route-loop">↺</b></div>'+
      '<div class="curriculum-phase-grid">'+phaseCards+'</div>'+
      '<div class="curriculum-continuum"><span class="continuum-icon" aria-hidden="true">↺</span><div><strong>'+clean(tr('course.continuumTitle',null,'The cycle does not end at handover.'))+'</strong><p>'+clean(tr('course.continuumBody',null,'Evaluation, institutional learning and ownership feed future situational analysis, making capacity development a continuous process rather than a one-off intervention.'))+'</p></div><a href="#about">'+clean(tr('course.continuumLink',null,'How learning works'))+' <span aria-hidden="true">↗</span></a></div></section>'+
      '<section class="activity-teaser"><div class="shell teaser-inner"><div class="teaser-copy"><span class="section-eyebrow">'+clean(tr('course.teaserEyebrow',null,'02 / THE PRACTICAL LIBRARY'))+'</span><h2>'+tr('course.teaserHeadingHtml',null,'Knowledge becomes capability<br><em>when you put it to work.</em>')+'</h2><p>'+clean(tr('course.teaserBody',null,'Six original CARANA CBD workbenches and a 60-minute facilitated group exercise are available for practice directly alongside the guided self-paced lessons.'))+'</p>'+
      '<button class="btn primary xl" id="teaser-activities">'+clean(tr('course.teaserBtn',null,'Open Activities Hub'))+' <span aria-hidden="true">↗</span></button></div><div class="teaser-graphic" aria-hidden="true"><div class="teaser-folder"><span>'+clean(tr('course.teaserFolderEyebrow',null,'CBD ACTIVITY LIBRARY'))+'</span><strong>CARANA</strong><div class="teaser-chart"><i></i><i></i><i></i></div></div><div class="teaser-ticket">06 <small>'+clean(tr('course.teaserTicketLabel',null,'INTERACTIVE MODULES'))+'</small></div></div></div></section>'+
      '<section class="method-section shell" id="about"><span class="section-eyebrow">'+clean(tr('course.methodEyebrow',null,'03 / THE LEARNING MODEL'))+'</span><h2>'+clean(tr('course.methodHeading',null,'Learn the process. Practise the decisions.'))+'</h2><div class="method-grid">'+methodCards.map(x=>'<div class="method-card"><span>'+clean(x[0])+'</span><h3>'+clean(x[1])+'</h3><p>'+clean(x[2])+'</p></div>').join('')+'</div>'+
      '<section class="home-support" id="study-support" aria-labelledby="home-support-title"><span class="section-eyebrow">'+clean(tr('course.homeSupportKicker',null,'YOUR STUDY SUPPORT'))+'</span><h2 id="home-support-title">'+clean(tr('course.homeSupportHeading',null,'Keep your work. Continue your journey.'))+'</h2><div id="home-backup-controls"></div><div class="home-supplements"><article><h3>'+clean(tr('course.notebookCardTitle',null,'Evidence-to-Decision Notebook'))+'</h3><p>'+clean(tr('course.notebookCardBody',null,'Supplementary prototype: connect observations, assumptions and decisions across the six phases.'))+'</p><a id="open-e08-notebook" href="../platform/notebook.html">'+clean(tr('course.notebookCardBtn',null,'Open Connected Notebook prototype →'))+'</a></article><article><h3>'+clean(tr('course.demoCardTitle',null,'Institutional demonstration'))+'</h3><p>'+clean(tr('course.demoCardBody',null,'A separate presentation resource for exploring the learning approach and future curriculum pathways.'))+'</p><a href="../platform/demo.html">'+clean(tr('course.demoCardBtn',null,'View institutional demonstration →'))+'</a></article></div></section>'+
      '<p class="course-disclaimer">'+clean(tr('course.homeDisclaimer',null,'Independent instructional adaptation referencing the UNPOL CBD Job-Specific Training curriculum. Lesson 1 is implemented with narration; Lessons 2–6 are available as review adaptations alongside the narrated lesson; all six original workbenches remain accessible. This is not an official United Nations learning platform, certification, or endorsement. Progress is stored locally in this browser.'))+'</p></section></main>'+
      '<footer class="footer shell"><span>'+clean(tr('course.footerHomeLeft',null,'© 2026 CARANA CBD E-Learning · Prepared by Lt. Col. Maissara Selim'))+'</span><span>'+clean(tr('course.footerHomeRight',null,'UN curriculum and CARANA scenario remain attributed to their institutional sources.'))+'</span></footer></div>';

    if (i18n) i18n.mountSwitcher('#home-lang-slot', { variant: 'dark' });
    const bindings=[['start-course',resume],['lesson-one',resume],['header-activities',openActivities],['strip-activities',openActivities],['teaser-activities',openActivities]];
    bindings.forEach(([id,fn])=>$(id).addEventListener('click',fn));
    window.CARANA_PLATFORM?.mountHome($('home-backup-controls'));
    $('home-export-l1').addEventListener('click',()=>exportProgress());
    $('home-restore-l1').addEventListener('click',()=>openL1RestoreDialog($('l1-restore-preview'),$('home-import-l1-file')));
    const visualBox = document.querySelector('.curriculum-visual');
    const orbitBox = document.querySelector('.cycle-orbit');
    const cycleLinks = Array.from(document.querySelectorAll('[data-cycle-phase]'));
    function previewPhase(indexOrNull) {
      const phaseEl = $('cycle-caption-phase'), titleEl = $('cycle-caption-title'), copyEl = $('cycle-caption-copy'), action = $('cycle-caption-action');
      if (!phaseEl || !titleEl || !copyEl || !action) return;
      const isPhase = indexOrNull !== null && !!phases[indexOrNull];
      if (orbitBox) orbitBox.dataset.activePhase = isPhase ? String(indexOrNull) : '';
      cycleLinks.forEach((node, idx) => {
        if (isPhase && idx === indexOrNull) node.setAttribute('data-active', 'true');
        else node.removeAttribute('data-active');
      });
      const detail = getDetailState(isPhase ? indexOrNull : null);
      phaseEl.textContent = detail.eyebrow;
      titleEl.textContent = detail.title;
      copyEl.textContent = detail.copy;
      action.removeAttribute('target');
      action.removeAttribute('rel');
      action.setAttribute('href', detail.href);
      action.innerHTML = clean(detail.action) + ' <span aria-hidden="true">↗</span>';
    }
    cycleLinks.forEach(link => {
      const i = Number(link.dataset.cyclePhase);
      link.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') previewPhase(i); });
      link.addEventListener('focus', () => previewPhase(i));
      if (i === 0) {
        link.addEventListener('click', e => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          if (mode !== 'lesson') { e.preventDefault(); resume(); }
        });
      }
    });
    orbitBox?.addEventListener('mouseleave', () => {
      if (!orbitBox.isConnected) return;
      const focused = document.activeElement?.closest?.('[data-cycle-phase]');
      previewPhase(focused && orbitBox.contains(focused) ? Number(focused.dataset.cyclePhase) : null);
    });
    visualBox?.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        if (!visualBox.isConnected) return;
        const active = document.activeElement;
        const focusedStage = active?.closest?.('[data-cycle-phase]');
        if (focusedStage && orbitBox?.contains(focusedStage)) {
          previewPhase(Number(focusedStage.dataset.cyclePhase));
        } else if (!active || !visualBox.contains(active)) {
          previewPhase(null);
        }
      });
    });
  }
  function renderActivities() {
    const { isEn, c } = getCourseStrings();
    const hub = (!isEn && c.activitiesHub) ? c.activitiesHub : {};
    const tr = (key, fb) => isEn ? fb : (hub[key] || fb);
    const modPrefix = isEn ? 'MODULE ' : (hub.modulePrefix || 'MODULE {num}').replace('{num}', '');
    const openLink = (a,i) => {
      const cardMeta = (!isEn && Array.isArray(hub.cards) && hub.cards[i]) ? hub.cards[i] : a;
      return '<article class="activity-card activity-'+clean(a.theme)+'"><div class="activity-card-top"><span class="activity-num">'+clean(isEn?('MODULE '+a.num):i18n.t('course.activitiesHub.modulePrefix',{num:a.num},''))+'</span><span class="activity-open-status">'+clean(tr('statusOpen','AVAILABLE NOW'))+'</span></div><div class="activity-card-visual" aria-hidden="true"><div class="activity-emblem">0'+(i+1)+'</div><div class="activity-lines"><i></i><i></i><i></i></div></div><span class="activity-card-tag">'+clean(cardMeta.tag)+'</span><h3>'+clean(cardMeta.title)+'</h3><p>'+clean(cardMeta.desc)+'</p><div class="activity-steps">'+clean(cardMeta.steps)+'</div><div class="activity-card-footer"><a href="'+clean(a.url)+'" class="activity-launch" target="_blank" rel="noopener noreferrer">'+clean(tr('launchLink','Launch activity'))+' <span aria-hidden="true">↗</span></a><span class="activity-external">'+clean(tr('opensNewTab','OPENS IN NEW TAB'))+'</span></div></article>';
    };
    $('root').innerHTML='<div class="activities-page"><header class="activities-header shell"><a class="brand brand-button" id="activities-brand" href="#home"><span class="brand-symbol" aria-hidden="true"><span class="brand-mark">C</span></span><span><strong>CARANA</strong><small>'+clean(tr('brandSub',c.brandSub||'CAPACITY BUILDING · LEARNING STUDIO'))+'</small></span></a><nav class="activity-header-nav" aria-label="Activities navigation"><a class="nav-platform-link" id="activities-home" href="#home">'+clean(tr('navHome','Course home'))+'</a><button id="activities-lesson">'+clean(tr('navLesson','Go to Lesson 01'))+'</button><span id="activities-lang-slot"></span></nav></header>'+
      '<main><section class="activities-hero"><div class="shell"><div class="activities-overline"><span class="mini-square"></span> '+clean(tr('overline','CARANA FIELD LEARNING / PRACTICAL WORKBENCHES'))+'</div><div class="activities-hero-main"><div><h1>'+(isEn?'Practice is where<br><em>analysis becomes action.</em>':(hub.headingHtml||''))+'</h1><p>'+clean(tr('lead','Use the original CARANA interactive activities independently. All six workbenches are available without completing the course first.'))+'</p><div class="hub-actions"><button class="btn primary" id="hub-resume">'+clean(tr('btnResume','Continue Lesson 01 ↗'))+'</button><a class="btn secondary" id="hub-home" href="#home">'+clean(tr('btnHome','Back to CBD home'))+'</a></div></div><div class="hub-summary"><span>'+clean(tr('libLabel','THE PRACTICE LIBRARY'))+'</span><strong>06 <small>'+clean(tr('libModules','MODULES'))+'</small></strong><div class="hub-summary-line"></div><strong>01 <small>'+clean(tr('libGroupEx','GROUP EXERCISE'))+'</small></strong><p>'+clean(tr('libNote','Direct access · No login · Original workbenches preserved'))+'</p></div></div></div></section>'+
      '<section class="hub-body shell"><div class="hub-heading"><div><span class="section-eyebrow">'+clean(tr('bodyEyebrow','01 / INTERACTIVE CBD ACTIVITIES'))+'</span><h2>'+clean(tr('bodyHeading','Choose a workbench'))+'</h2><p>'+clean(tr('bodySub','Each activity opens directly in a separate tab. Progress here does not bypass or mark completion of course checkpoints.'))+'</p></div><span class="hub-count">'+clean(isEn?'06 AVAILABLE':i18n.t('course.activitiesHub.availableTag',{count:'06'},'06 AVAILABLE'))+'</span></div><div class="activities-grid">'+ACTIVITIES.map(openLink).join('')+'</div>'+
      '<section class="quick-exercise-panel"><div class="quick-exercise-icon"><span>60</span><small>MIN</small></div><div class="quick-exercise-copy"><span class="activity-card-tag">'+clean(tr('quickTag','FACILITATED LEARNING / SHORT FORMAT'))+'</span><h3>'+clean(tr('quickTitle','CARANA 60-minute Group Exercise'))+'</h3><p>'+clean(tr('quickDesc','The preserved short-format activity for facilitated syndicate discussions, rapid diagnosis, and a condensed CBD assessment.'))+'</p></div><a class="btn primary" target="_blank" rel="noopener noreferrer" href="'+activityQuickLink+'">'+clean(tr('quickBtn','Open quick exercise'))+' <span aria-hidden="true">↗</span></a></section>'+
      '<div class="hub-notice"><strong>'+clean(tr('noticeTitle','Preservation and completion'))+'</strong><p>'+clean(tr('noticeBody','These are links to the unmodified original activity implementations included in the course deployment. All activities are accessible here for practice. To receive Lesson 1 local completion status, pass its six assessments and complete the workbench confirmation step in the guided learning pathway. No formal certificate is issued.'))+'</p></div></section></main>'+
      '<footer class="footer shell"><span>'+clean(tr('footerLeft','CARANA CBD E-Learning · Activities Hub'))+'</span><span>'+clean(tr('footerRight','Independent instructional adaptation · No UN endorsement implied.'))+'</span></footer></div>';
    if (i18n) i18n.mountSwitcher('#activities-lang-slot');
    for(const id of ['activities-lesson','hub-resume'])$(id).addEventListener('click',resume);
  }
  function railHTML() {
    const { isEn, c } = getCourseStrings();
    const curPrefix = isEn ? 'Current · ' : ((c.railCurrent || 'Current') + ' · ');
    const doneTxt = isEn ? 'Checkpoint passed' : (c.railDone || 'Checkpoint passed');
    const lockedTxt = isEn ? 'Not yet available' : (c.railLocked || 'Not yet available');
    const availTxt = isEn ? 'Available to study' : (c.railDone ? '' : 'Available to study');
    return lesson.sections.map((sec,i)=>{
      const locked=!canOpen(i), done=isCleared(i), active=position.section===i;
      const stateLabel = isEn
        ? ((active?'Current · ':'')+(done?'Checkpoint passed':locked?'Not yet available':'Available to study'))
        : ((active?curPrefix:'')+(done?doneTxt:locked?lockedTxt:(c.railCurrent?i18n.t('common.yes',null,'✓'):'Disponible')));
      return '<button class="rail-item ' + (active?'active ':'')+(done?'done ':'') + '" data-section="'+i+'" '+(locked?'disabled':'')+' aria-current="'+(active?'step':'false')+'"><span class="rail-number">'+(done?'✓':String(i+1).padStart(2,'0'))+'</span><span class="rail-label">'+clean(sec.title)+'<small class="section-state">'+clean(stateLabel)+'</small></span>'+(locked?'<span class="lock-icon" aria-label="'+clean(isEn?'Locked':(c.railLocked||'Locked'))+'">⌁</span>':'')+'</button>';
    }).join('');
  }
  function layout(content,heading) {
    const { isEn, c } = getCourseStrings();
    const tr = (key, vars, fb) => isEn ? fb : i18n.t(key, vars, fb);
    if (!isEn) document.title = c.pageTitleLesson1 || document.title;
    else document.title = 'CARANA · CBD E-Learning | The Six-Phase Learning Journey';
    const finished=progress.completed.length;
    const value=Math.round((finished/SECTION_COUNT)*100);
    const arrowBack = isEn || !i18n.isRTL() ? '←' : '→';
    $('root').innerHTML =
      '<div class="course-shell"><header class="course-header"><a class="back-home" id="back-home" href="#home"><span aria-hidden="true">'+arrowBack+'</span> '+clean(tr('nav.courseHome',null,'COURSE HOME'))+'</a><div class="header-title">'+tr('course.headerTitle',null,'CARANA <span>/</span> CBD E-LEARNING <span>/</span> LESSON 01')+'</div><div class="header-right"><span id="lesson-lang-slot"></span><button class="header-activities-link" id="course-activities">▦ '+clean(tr('course.activitiesBtn',null,'Activities'))+' <span class="nav-count">07</span></button><span id="save-status" role="status">Progress is stored on this device</span><button class="export-mini" id="export-mini">'+clean(tr('course.exportMini',null,'Export progress ↗'))+'</button><button class="export-mini" id="import-mini">'+clean(tr('course.importMini',null,'Restore'))+'</button><input type="file" id="import-l1-file" accept=".json,application/json" hidden></div></header>' +
      '<div class="workspace"><aside class="side-rail"><div class="rail-overline">'+clean(tr('course.railOverline',null,'LESSON 01'))+'</div><h2>'+(isEn?'Situational<br>Analysis':clean(tr('course.railTitle',null,'Situational Analysis')))+'</h2><p>'+clean(tr('course.railDesc',null,'Learn to diagnose before designing change.'))+'</p><div class="rail-divider"></div><div class="rail-overline">'+clean(tr('course.railPathOverline',null,'LEARNING PATH'))+'</div><details class="l1-path-menu" open><summary>'+clean(isEn?('Lesson sections · current section '+(position.section+1)+' of 6'):i18n.t('course.railSummary',{current:position.section+1},''))+'</summary><nav aria-label="'+clean(tr('course.railSectionsAria',null,'Course sections'))+'">'+railHTML()+'</nav></details><div class="rail-divider"></div><div class="rail-progress"><div class="rail-progress-row"><span>'+clean(tr('course.railCheckpointsLabel',null,'Knowledge checkpoints'))+'</span><strong>'+finished+' / 6</strong></div><div class="progress-track"><i style="width:'+value+'%"></i></div></div><div class="rail-note">'+clean(tr('course.railNoteText',null,'Correct responses are required at each checkpoint before moving forward.'))+'</div><button class="rail-activity-cta" id="rail-activity-cta"><span class="rail-cta-icon">↗</span><span><strong>'+clean(tr('course.railLibTitle',null,'Practice library'))+'</strong><small>'+clean(tr('course.railLibSub',null,'All 7 activities · Quick access'))+'</small></span></button></aside>' +
      '<main class="learning-content" id="learning-main"><div class="learning-frame"><div id="l1-restore-preview" class="l1-restore-preview" hidden></div><div class="content-overline">'+clean(heading)+'</div>'+content+'</div></main>' +
      '<aside class="context-panel" tabindex="0"><span class="context-overline">'+clean(tr('course.contextWhyTitle',null,'WHY THIS MATTERS'))+'</span><h3>'+clean(tr('course.contextWhyHeading',null,'Evidence before action.'))+'</h3><p>'+clean(tr('course.contextWhyBody',null,'Effective capacity-building begins with a shared understanding of the context, existing assistance, and counterpart reality.'))+'</p><div class="context-divider"></div><span class="context-overline">'+clean(tr('course.contextOutcomesTitle',null,'LEARNING OUTCOMES'))+'</span><ul>'+lesson.objectives.slice(0,4).map(t=>'<li>'+clean(t)+'</li>').join('')+'</ul><div class="context-divider"></div><span class="context-overline">'+clean(tr('course.contextSourceTitle',null,'SOURCE'))+'</span><p class="source-small">'+clean(tr('course.contextSourceBody',null,'UNPOL CBD Job-Specific Training · Lesson 1, 2021 / July 2023 file.'))+'</p></aside></div></div>';
    if (i18n) i18n.mountSwitcher('#lesson-lang-slot', { variant: 'light' });
    $('export-mini').addEventListener('click',()=>exportProgress());
    $('import-mini').addEventListener('click',()=>openL1RestoreDialog($('l1-restore-preview'),$('import-l1-file')));
    $('course-activities').addEventListener('click',openActivities);
    $('rail-activity-cta').addEventListener('click',openActivities);
    document.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>navigate(+b.dataset.section,0)));
    window.CARANA_SUPPORT?.mount({root:$('learning-main'),lessonId:'cbd-1',lessonNumber:1,lessonTitle:lesson.title,section:lesson.sections[position.section]?.title||'Lesson overview',screenId:String(position.section+1).padStart(2,'0')+'-'+String(position.screen+1).padStart(2,'0'),screenTitle:document.querySelector('#learning-main h1')?.textContent||lesson.title,mode:position.kind==='quiz'?'checkpoint':position.kind==='screen'?'screen':'practical'});
    const menu=document.querySelector('.l1-path-menu');
    if(menu && window.matchMedia)menu.open=window.matchMedia('(min-width:901px)').matches;
    updateStatus();
  }
  function renderScreen() {
    const { isEn, c } = getCourseStrings();
    const tr = (key, vars, fb) => isEn ? fb : i18n.t(key, vars, fb);
    const {section,screen}=position;
    const experience=window.CARANA_LESSON1_PLAYER;
    const learningLab=window.CARANA_LESSON1_LABS;
    const sec=lesson.sections[section], item=sec.screens[screen];
    const absolute=section*3+screen+1;
    const visual='<div class="visual-card"><span class="visual-caption">'+clean(item.visualTitle)+'</span><div class="visual-flow '+(item.visual.length>5?'dense':'')+'">'+item.visual.map((x,i)=>'<div class="visual-node"><span>'+String(i+1).padStart(2,'0')+'</span>'+clean(x)+'</div>').join('')+'</div></div>';
    const outcomes=section===0&&screen===0?'<div class="learning-outcomes"><h2>'+clean(tr('course.outcomesHeading',null,'By the end of this lesson, you will be able to'))+'</h2><ul>'+lesson.objectives.map(o=>'<li>'+clean(o)+'</li>').join('')+'</ul></div>':'';
    const trainerNarration=experience?experience.narrationHTML(section,screen):'';
    const fieldPractice=experience?experience.practiceHTML(section,screen):'';
    const conceptExplorer=learningLab?learningLab.html(section,screen):'';
    const visualJourney=window.CARANA_VISUAL_JOURNEY?window.CARANA_VISUAL_JOURNEY.html(section,screen):'';
    const storyIllustration=window.CARANA_LESSON1_ILLUSTRATIONS?window.CARANA_LESSON1_ILLUSTRATIONS.html(section,screen):'';
    const analyticalVisual=visualJourney||conceptExplorer||visual;
    const visualSequence=storyIllustration?'<div class="hybrid-visual-sequence" aria-label="'+clean(tr('course.hybridAria',null,'Illustrated situation and interactive analytical explanation'))+'"><div class="hybrid-visual-step"><span>01</span> '+clean(tr('course.step01Short',null,'See the situation'))+'</div>'+storyIllustration+'<div class="hybrid-visual-step conceptual"><span>02</span> '+clean(tr('course.step02Short',null,'Explore the underlying concept'))+'</div>'+analyticalVisual+'</div>':analyticalVisual;
    const secHead = isEn
      ? ('SECTION '+String(section+1).padStart(2,'0')+' OF 06 <span>·</span> SCREEN '+String(screen+1)+' OF 03')
      : (clean(i18n.t('course.sectionOf',{section:String(section+1).padStart(2,'0')},''))+' <span>·</span> '+clean(i18n.t('course.screenWord',{screen:String(screen+1)},'')));
    const footSrc = isEn ? ('Based on lesson plan pages '+item.sourcePage) : i18n.t('course.pointsFootSource',{pages:item.sourcePage},'');
    const footNote = isEn ? 'Original instructional adaptation' : (c.pointsFootNote || 'Original instructional adaptation');
    const backLbl = isEn ? '← Back' : (c.btnBack || '← Back');
    const nextLbl = screen===2&&!isCleared(section) ? tr('course.btnToCheckpoint',null,'Knowledge checkpoint →') : screen===2&&section===5 ? tr('course.btnToPractice',null,'Open practice →') : tr('course.btnContinue',null,'Continue →');
    const content='<div class="learning-head"><span class="micro-label">'+secHead+'</span><span class="screen-count">'+String(absolute).padStart(2,'0')+' / 18</span></div><div class="section-rule"></div>' +
      '<div class="content-title"><span class="small-tag">'+clean(item.kicker)+'</span><h1>'+clean(item.title)+'</h1><p class="lead">'+clean(item.lead)+'</p></div>'+trainerNarration+visualSequence +
      '<div class="learning-points">'+item.points.map((p,i)=>'<div class="point"><span class="point-dot"></span><p>'+clean(p)+'</p></div>').join('')+'</div>' +fieldPractice+
      '<div class="takeaway"><span>'+clean(tr('course.takeawayLabel',null,'KEY IDEA'))+'</span><strong>'+clean(item.takeaway)+'</strong></div>'+outcomes +
      '<div class="lesson-foot"><span>'+clean(footSrc)+'</span><span>'+clean(footNote)+'</span></div>' +
      '<div class="bottom-actions"><button class="btn outline" id="prev-screen" '+(section===0&&screen===0?'disabled':'')+'>'+clean(backLbl)+'</button><button class="btn primary" id="next-screen">'+clean(nextLbl)+'</button></div>';
    layout(content,sec.title);
    if(experience)experience.mount(section,screen);
    if(learningLab)learningLab.mount(section,screen);
    if(window.CARANA_VISUAL_JOURNEY)window.CARANA_VISUAL_JOURNEY.mount(section,screen);
    $('prev-screen').addEventListener('click',()=>{
      if(screen>0) navigate(section,screen-1);
      else if(section>0) navigate(section-1,2);
    });
    $('next-screen').addEventListener('click',()=>{
      const advance=()=>{
      if(screen<2) navigate(section,screen+1);
      else if(!isCleared(section)) navigate(section,2,'quiz');
      else if(section<5) navigate(section+1,0);
      else openActivity();
      };
      const exploration=window.CARANA_VISUAL_JOURNEY?.active||window.CARANA_LESSON1_LABS?.active;
      if(exploration)exploration.advance(advance);else advance();
    });
  }
  function renderQuiz() {
    const { isEn, c } = getCourseStrings();
    const tr = (key, vars, fb) => isEn ? fb : i18n.t(key, vars, fb);
    const s=position.section, sec=lesson.sections[s];
    const passed=isCleared(s);
    if(passed){
      const revBtn = isEn ? 'Review this section' : (c.quizRevisit || 'Review this section');
      const contBtn = s===SECTION_COUNT-1 ? tr('course.quizOpenPractice',null,'Open practical activity →') : tr('course.quizContinueNext',null,'Continue to next section →');
      layout('<div class="quiz-success"><div class="success-icon">✓</div><span class="micro-label">'+clean(tr('course.quizClearedBadge',null,'CHECKPOINT CLEARED'))+'</span><h1>'+clean(tr('course.quizPassedHeading',null,'Checkpoint passed.'))+'</h1><p>'+clean(isEn?('You passed all six questions in '+sec.title+'. You can now advance.'):i18n.t('course.quizPassedDesc',{title:sec.title},''))+'</p>'+(s===SECTION_COUNT-1?'<div class="completion-activity-banner"><span>'+clean(tr('course.quizFinalBannerKicker',null,'LESSON 01 / PRACTICAL APPLICATION'))+'</span><strong>'+clean(tr('course.quizFinalBannerTitle',null,'Put your analysis into practice.'))+'</strong><p>'+clean(tr('course.quizFinalBannerBody',null,'The original CARANA situational-analysis exercise is ready. Launch it directly in a full window or open it inside the learning studio.'))+'</p><a class="btn primary" href="../module1.html" target="_blank" rel="noopener noreferrer">'+clean(tr('course.quizFinalBannerLaunch',null,'Launch Lesson 1 Activity ↗'))+'</a></div>':'')+'<div class="bottom-actions center"><button class="btn outline" id="revisit">'+clean(revBtn)+'</button><button class="btn primary" id="continue-after-quiz">'+clean(contBtn)+'</button></div></div>',sec.title);
      $('revisit').addEventListener('click',()=>navigate(s,0));
      $('continue-after-quiz').addEventListener('click',()=>s===SECTION_COUNT-1?openActivity():navigate(s+1,0));
      return;
    }
    const qPrefix = isEn ? ('POINT DE CONTRÔLE'.replace('POINT DE CONTRÔLE','KNOWLEDGE CHECKPOINT')+' '+String(s+1).padStart(2,'0')+' / 06') : i18n.t('course.quizHeaderPrefix',{num:String(s+1).padStart(2,'0')},'');
    let html='<div class="learning-head"><span class="micro-label">'+clean(qPrefix)+'</span><span class="screen-count">'+clean(tr('course.quizHeaderCount',null,'6 QUESTIONS'))+'</span></div><div class="section-rule"></div>' +
      '<div class="content-title"><span class="small-tag">'+clean(tr('course.quizSmallTag',null,'Demonstrate understanding'))+'</span><h1>'+clean(isEn?('Checkpoint: '+sec.title):i18n.t('course.quizHeadingPrefix',{title:sec.title},''))+'</h1><p class="lead">'+clean(tr('course.quizSubRule',null,'Answer all six questions correctly to unlock the next section. Review the previous screens whenever needed.'))+'</p></div><div class="quiz-rule"><span>'+clean(tr('course.quizPassReqLabel',null,'PASS REQUIREMENT'))+'</span><strong>'+clean(tr('course.quizPassReqVal',null,'6 out of 6 correct'))+'</strong></div><form id="quiz-form" novalidate>';
    sec.quiz.forEach((q,i)=>{
      const wrong=checked&&missed.includes(i);
      const chosenNote=wrong&&Array.isArray(q.optionFeedback)&&Number.isInteger(answers[i])?q.optionFeedback[answers[i]]:'';
      html+='<fieldset class="question-card '+(wrong?'question-wrong':'')+'"><legend><span>Q'+(i+1)+'</span> '+clean(q.q)+'</legend><div class="choices">'+q.options.map((opt,j)=>'<label class="choice"><input type="radio" name="q'+i+'" value="'+j+'" '+(answers[i]===j?'checked':'')+'><span>'+clean(opt)+'</span></label>').join('')+'</div>' +
        (wrong?'<p class="answer-hint"><strong>'+clean(tr('course.quizFeedbackPrefix',null,'Learning feedback:'))+'</strong> '+(chosenNote?clean(chosenNote)+' ':'')+clean(q.why)+' '+clean(tr('course.quizFeedbackSuffix',null,'Review the explanation above, then select the correct response.'))+'</p>':'')+'</fieldset>';
    });
    const missedMsg = isEn ? (missed.length+' answer(s) still need attention. Correct them and check again.') : i18n.t('course.quizMissedNotice',{count:missed.length},'');
    const keepMsg = tr('course.quizHintKeepChoices',null,'Your choices are kept while you review screens in this tab. Reloading starts a fresh attempt.');
    html+='</form><div id="quiz-feedback" class="inline-feedback '+(checked?'warning':'')+'" role="status" aria-live="polite">'+clean(checked?missedMsg:keepMsg)+'</div><div class="bottom-actions"><button class="btn outline" id="return-review">'+clean(tr('course.quizReviewScreens',null,'← Review learning screens'))+'</button><button class="btn primary" id="check-quiz">'+clean(tr('course.quizCheckAnswers',null,'Check answers →'))+'</button></div>';
    layout(html,sec.title);
    document.querySelectorAll('#quiz-form input').forEach(inp=>inp.addEventListener('change',()=>{
      answers[Number(inp.name.slice(1))]=Number(inp.value);
    }));
    $('return-review').addEventListener('click',()=>navigate(s,2));
    $('check-quiz').addEventListener('click',()=>{
      const unanswered=sec.quiz.map((_,i)=>i).filter(i=>answers[i]===undefined);
      if(unanswered.length){$('quiz-feedback').textContent=tr('course.quizIncompleteSix',null,'Please answer all six questions before checking.');$('quiz-feedback').className='inline-feedback warning';return;}
      missed=sec.quiz.map((q,i)=>answers[i]===q.answer?-1:i).filter(x=>x!==-1);
      checked=true;
      if(!missed.length){
        const newlyPassed = !progress.completed.includes(s);
        progress.completed=[...new Set([...progress.completed,s])].sort((a,b)=>a-b);
        if (newlyPassed) window.CARANA_MONITORING?.event('checkpoint_completed', 'cbd-1:checkpoint-' + (s + 1));
        progress.lastKind='quiz';save();render();focusHeading();window.scrollTo({top:0,behavior:'instant'});
      }else{
        render();
        const feedback = $('quiz-feedback');
        feedback.tabIndex = -1;
        feedback.focus();
        feedback.scrollIntoView({block:'center'});
      }
    });
  }
  function renderActivity() {
    if(!isAllCleared()){navigate(0,0);return;}
    const { isEn, c } = getCourseStrings();
    const tr = (key, fb) => isEn ? fb : (c[key] || fb);
    const content='<div class="activity-header"><div class="activity-breadcrumb"><span>'+clean(tr('activityBreadcrumbLeft','LESSON 01'))+'</span><span>→</span><span>'+clean(tr('activityBreadcrumbRight','PRACTICAL APPLICATION'))+'</span></div><span class="small-tag">'+clean(tr('activitySmallTag','UNLOCKED · ORIGINAL INTERACTIVE ACTIVITY'))+'</span><h1>'+(isEn?'Put the evidence<br><em>to work.</em>':tr('activityHeadingHtml',''))+'</h1><p class="lead">'+clean(tr('activityLead','You have completed all six knowledge checkpoints. Now apply the analytical sequence in the original CARANA Situational Analysis workbench.'))+'</p>'+
      '<div class="activity-launch-hero"><div><span class="launch-eyebrow">'+clean(tr('activityLaunchEyebrow','01 / SITUATIONAL ANALYSIS ACTIVITY'))+'</span><strong>'+clean(tr('activityLaunchTitle','CARANA CBD Learning Lab'))+'</strong><p>'+clean(tr('activityLaunchSteps','PESTEL-S · Stakeholders · 5×6 CBD matrix · SWOT · Baseline'))+'</p><div class="launch-links"><a href="../module1.html" target="_blank" rel="noopener noreferrer" class="btn primary xl">'+clean(tr('activityLaunchBtn','Launch full activity ↗'))+'</a><button class="btn outline" id="open-other-activities">'+clean(tr('activityAllBtn','All activities →'))+'</button></div></div><div class="launch-symbol" aria-hidden="true">01<span>WORKBENCH</span></div></div>'+
      '<div class="activity-note"><strong>'+clean(tr('activityUnchangedTitle','Your exercise stays unchanged'))+'</strong><p>'+clean(tr('activityUnchangedBody','These controls open the original Module 1 workbench from the source application. The activity, its data format, and its original exercises remain intact. For the best working experience, launch it in a full browser tab.'))+'</p></div>'+
      '<div class="activity-frame-head"><div><span>'+clean(tr('activityFrameOverline','IN-PAGE WORKBENCH'))+'</span><p>'+clean(tr('activityFrameDesc','An embedded option for learners who prefer to stay inside the course.'))+'</p></div><button id="toggle-workbench" class="btn outline small" aria-expanded="false" aria-controls="embedded-workbench">'+clean(tr('activityFrameShow','Show embedded activity ↓'))+'</button></div>'+
      '<div class="embedded-workbench" id="embedded-workbench" hidden><div class="workbench-toolbar"><span>'+clean(tr('activityToolbarLabel','ORIGINAL ACTIVITY · SITUATIONAL ANALYSIS'))+'</span><a class="btn outline small" target="_blank" rel="noopener noreferrer" href="../module1.html">'+clean(tr('activityToolbarOpen','Open full window ↗'))+'</a></div><div class="workbench-wrap"><iframe id="workbench-frame" title="'+clean(tr('activityFrameTitle','Original CARANA CBD Module 1 learning activity'))+'" loading="lazy" data-src="../module1.html"></iframe></div></div>'+
      '<div class="practice-verification"><div><span class="small-tag">'+clean(tr('activityFinalTag','FINAL STEP'))+'</span><h2>'+clean(tr('activityConfirmHeading','Confirm your practical work'))+'</h2><p>'+clean(tr('activityConfirmBody','When you complete the exercise in the workbench, use its existing participant confirmation control and return here. This records a self-confirmed completion, not independent performance assessment.'))+'</p></div><button class="btn primary" id="verify-practice">'+clean(tr('practiceVerifyBtn','Verify completion →'))+'</button></div><div id="activity-status" class="inline-feedback" role="status" aria-live="polite">'+clean(tr('activityInitialStatus','The guided course can check the original workbench confirmation only on this same website and browser.'))+'</div>'+
      '<div class="bottom-actions"><button class="btn outline" id="back-to-lesson">'+clean(tr('activityBackBtn','← Review Lesson 1'))+'</button><button class="btn outline" id="go-to-library">'+clean(tr('activityBrowseBtn','Browse other activities ↗'))+'</button></div></div>';
    layout(content,lesson.title);
    $('back-to-lesson').addEventListener('click',()=>navigate(5,2));
    $('verify-practice').addEventListener('click',verifyActivity);
    $('open-other-activities').addEventListener('click',openActivities);
    $('go-to-library').addEventListener('click',openActivities);
    $('toggle-workbench').addEventListener('click',()=>{
      const target=$('embedded-workbench'),button=$('toggle-workbench');
      const willOpen=target.hidden;
      target.hidden=!willOpen;
      button.setAttribute('aria-expanded',String(willOpen));
      button.textContent=willOpen?tr('activityFrameHide','Hide embedded activity ↑'):tr('activityFrameShow','Show embedded activity ↓');
      if(willOpen){
        const frame=$('workbench-frame');
        if(!frame.getAttribute('src'))frame.setAttribute('src',frame.dataset.src);
      }
    });
  }
  function renderComplete() {
    if(!progress.lessonComplete){openActivity();return;}
    const { isEn, c } = getCourseStrings();
    const tr = (key, fb) => isEn ? fb : (c[key] || fb);
    const content='<div class="quiz-success complete"><div class="success-icon">✓</div><span class="micro-label">'+clean(tr('completeKicker','LESSON 01 · LEARNER COMPLETION'))+'</span><h1>'+clean(tr('completeHeading','Situational Analysis completed.'))+'</h1><p>'+clean(tr('completeBody','Six knowledge checkpoints completed, and the original Module 1 workbench has recorded your self-confirmation. Your learning progress is stored in this browser.'))+'</p><div class="completion-stats"><div><strong>18</strong><span>'+clean(tr('completeStatScreens','Instructional screens'))+'</span></div><div><strong>36 / 36</strong><span>'+clean(tr('completeStatQuiz','Knowledge-check answers'))+'</span></div><div><strong>01</strong><span>'+clean(tr('completeStatWb','Workbench self-confirmed'))+'</span></div></div>'+
      '<div class="completion-activity-banner"><span>'+clean(tr('completeAnytimeTag','PRACTICE ANYTIME'))+'</span><strong>'+clean(tr('completeAnytimeTitle','Return to your practical work.'))+'</strong><p>'+clean(tr('completeAnytimeBody','Review the original Situational Analysis workbench, or explore the other five CBD workbenches in the activity library.'))+'</p><div class="completion-links"><a class="btn primary" href="../module1.html" target="_blank" rel="noopener noreferrer">'+clean(tr('completeReopen','Reopen Lesson 1 Activity ↗'))+'</a><button class="btn outline" id="complete-activities">'+clean(tr('completeAllBtn','All activities →'))+'</button></div></div>'+
      '<p class="fine-print">'+clean(tr('completeDisclaimer','This is a local learner record, not a UN qualification or externally verified certificate. The workbench confirmation is participant-generated.'))+'</p><div class="bottom-actions center"><button class="btn outline" id="review-again">'+clean(tr('completeReviewLesson','Review lesson'))+'</button><button class="btn primary" id="export-completion">'+clean(tr('completeExport','Export progress record ↗'))+'</button></div></div>';
    layout(content,lesson.title);
    $('review-again').addEventListener('click',()=>navigate(0,0));
    $('export-completion').addEventListener('click',()=>exportProgress());
    $('complete-activities').addEventListener('click',openActivities);
  }
  function render() {
    lesson = getLocalizedLesson();
    window.CARANA_SUPPORT?.dispose();
    $('trainer-audio')?.pause();
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
      const { isEn, c } = getCourseStrings();
      if(el && checkOriginalActivity()){el.textContent=isEn?'The original workbench now reports participant confirmation. Select Verify completion to finish.':(c.activityLiveConfirmed||'');el.className='inline-feedback success';}
    }
  });
  window.addEventListener('hashchange', () => {
    if (!window.location) return;
    if(window.location.hash === '#activities' && mode !== 'activities')openActivities();
    else if(window.location.hash === '#home' && mode !== 'home')goHome();
    else if(window.location.hash === '#lesson-1' && mode !== 'lesson')resume();
  });
  if (i18n) {
    i18n.onChange(async newLang => {
      if (newLang !== 'en') {
        await i18n.ready(['ui', 'course-l1']);
      }
      render();
    });
    if (i18n.getLang() === 'en') {
      if (window.location?.hash === '#lesson-1') resume();
      else render();
    } else {
      i18n.ready(['ui', 'course-l1']).then(() => {
        if (window.location?.hash === '#lesson-1') resume();
        else render();
      });
    }
  } else {
    if (window.location?.hash === '#lesson-1') resume();
    else render();
  }
})();
