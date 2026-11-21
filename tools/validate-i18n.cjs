#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const LANGS = ['fr-FR', 'ar'];
const PACKS = ['ui', 'course-l1', 'lessons-2-6', 'workbenches'];

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

function collectLeafEntries(obj, prefix = '', out = new Map()) {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => collectLeafEntries(v, `${prefix}[${i}]`, out));
    return out;
  }
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj).sort()) {
      collectLeafEntries(obj[k], prefix ? `${prefix}.${k}` : k, out);
    }
    return out;
  }
  out.set(prefix, obj);
  return out;
}

function extractVars(str) {
  const matches = String(str || '').match(/\{(\w+)\}/g) || [];
  return [...new Set(matches)].sort().join(',');
}

function runSandbox(relPath) {
  const code = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const sb = {
    window: {
      location: { hash: '', pathname: '/', search: '' },
      addEventListener() {},
      removeEventListener() {}
    },
    document: {
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      documentElement: { lang: 'en', dir: 'ltr', getAttribute: () => 'en' },
      addEventListener() {}
    },
    console
  };
  sb.self = sb.window;
  sb.globalThis = sb.window;
  vm.runInNewContext(code, sb);
  return sb.window;
}

function normalizeCmp(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/[’']/g, "'")
    .trim();
}

function isUrlOrCodeOnly(s) {
  const t = String(s || '').trim();
  if (/^https?:\/\/\S+$/i.test(t)) return true;
  if (/^(?:CARANA|UNPOL|CBD|MMA|COP|PESTEL-S|SMART|RBB|QIP|PIN|LFA|CPOC|SGBV|OHCHR|DPO|UNSCR|SSR|MOV|KPI|SOP)$/i.test(t)) return true;
  if (/^(?:p\.|pp\.|S\/RES\/|Annex|UNSCR|Phase|Module|Lesson)\s*[\d\-–]+$/i.test(t)) return true;
  return false;
}

function main() {
  const failures = [];
  const warnings = [];
  const summary = {
    packsChecked: PACKS.length * LANGS.length,
    uiLeaves: 0,
    courseL1Screens: 0,
    courseL1Quizzes: 0,
    courseL1Decisions: 0,
    lessons26Count: 0,
    lessons26Screens: 0,
    lessons26Quizzes: 0,
    lessons26Decisions: 0,
    lessons26Labs: 0,
    workbenchStrings: 0,
    workbenchDomKeys: 0,
    glossaryEntries: 0,
    htmlPagesChecked: 0,
    englishLeaks: [],
    missingArabicScript: []
  };

  const packsByLang = {};
  for (const lang of LANGS) {
    packsByLang[lang] = {};
    for (const pack of PACKS) {
      const rel = `locales/${lang}/${pack}.json`;
      try {
        packsByLang[lang][pack] = readJson(rel);
      } catch (err) {
        failures.push(`Invalid JSON in ${rel}: ${err.message}`);
      }
    }
  }
  if (failures.length) {
    console.error(JSON.stringify({ ok: false, failures }, null, 2));
    process.exit(1);
  }

  // 1. Key parity & placeholder consistency across fr-FR and ar
  const ALLOWED_LANG_SPECIFIC_LEAVES = new Set([
    'course.narrationMetaFr',
    'course.narrationSubFr',
    'course.narrationMetaAr',
    'course.narrationSubAr'
  ]);

  for (const pack of PACKS) {
    const frLeaves = collectLeafEntries(packsByLang['fr-FR'][pack]);
    const arLeaves = collectLeafEntries(packsByLang['ar'][pack]);
    if (pack === 'ui') summary.uiLeaves = frLeaves.size;

    for (const [k, v] of frLeaves) {
      if (!arLeaves.has(k) && !ALLOWED_LANG_SPECIFIC_LEAVES.has(k)) {
        failures.push(`[${pack}] Key present in fr-FR but missing in ar: ${k}`);
      }
      if (typeof v === 'string' && v.trim() === '') {
        failures.push(`[fr-FR/${pack}] Empty string translation at: ${k}`);
      }
      if (typeof v === 'string' && arLeaves.has(k)) {
        const av = arLeaves.get(k);
        if (extractVars(v) !== extractVars(av)) {
          failures.push(`[${pack}] Interpolation variable mismatch at ${k}: fr={${extractVars(v)}} ar={${extractVars(av)}}`);
        }
      }
    }
    for (const [k, v] of arLeaves) {
      if (!frLeaves.has(k) && !ALLOWED_LANG_SPECIFIC_LEAVES.has(k)) {
        failures.push(`[${pack}] Key present in ar but missing in fr-FR: ${k}`);
      }
      if (typeof v === 'string' && v.trim() === '') {
        failures.push(`[ar/${pack}] Empty string translation at: ${k}`);
      }
    }
  }

  // 2. Lesson 1 canonical coverage vs course/lesson1-data.js, experience, visual-journey, labs, illustrations
  const l1Win = runSandbox('course/lesson1-data.js');
  const l1En = l1Win.CARANA_LESSON1_DATA || Object.values(l1Win).find(v => v && Array.isArray(v.sections));
  const l1Exp = runSandbox('course/lesson1-experience.js').CARANA_EXPERIENCE_V05;
  const l1VjWin = runSandbox('course/visual-journey.js');
  const l1Vj = l1VjWin.CARANA_VISUAL_JOURNEY;

  if (!l1En || !l1Exp || !l1Vj) {
    failures.push('Unable to load canonical English Lesson 1 scripts for comparison.');
  } else {
    // Check audio preservation invariants
    const l1Mp3s = fs.readdirSync(path.join(ROOT, 'course/audio/en/lesson1')).filter(f => f.endsWith('.mp3'));
    if (l1Mp3s.length !== 18) failures.push(`Expected 18 Lesson 1 EN mp3s, found ${l1Mp3s.length}`);
    const raMp3s = fs.readdirSync(path.join(ROOT, 'course/audio/en/readaloud/clips')).filter(f => f.endsWith('.mp3'));
    if (raMp3s.length !== 1185) failures.push(`Expected 1185 Read Aloud EN mp3s, found ${raMp3s.length}`);

    // Check narration lock SHA-256 unchanged (script & MP3 audio)
    const lock = readJson('tools/narration-lock.json');
    for (const track of l1Exp.narration.tracks) {
      const lockEntry = lock.tracks?.[track.id];
      const sha = crypto.createHash('sha256').update(String(track.script || '')).digest('hex');
      if (lockEntry?.scriptSha256 && lockEntry.scriptSha256 !== sha) {
        failures.push(`Narration lock scriptSha256 changed for Lesson 1 track ${track.id}`);
      }
      if (lockEntry?.audioSha256 && track.audio) {
        const audioPath = path.join(ROOT, 'course', track.audio.replace(/^\.\//, ''));
        if (!fs.existsSync(audioPath)) {
          failures.push(`Missing Lesson 1 English audio file: ${track.audio}`);
        } else {
          const audioSha = crypto.createHash('sha256').update(fs.readFileSync(audioPath)).digest('hex');
          if (lockEntry.audioSha256 !== audioSha) {
            failures.push(`Narration lock audioSha256 changed for Lesson 1 track ${track.id}`);
          }
        }
      }
    }

    for (const lang of LANGS) {
      const loc = packsByLang[lang]['course-l1'];
      if (!loc.lesson || !loc.lesson.sections) {
        failures.push(`[${lang}/course-l1] Missing lesson.sections`);
        continue;
      }
      let sCount = 0;
      let qCount = 0;
      // Check Lesson 1 sections, screens, and section.quiz
      l1En.sections.forEach((sec, sIdx) => {
        const lSec = loc.lesson.sections[String(sIdx)];
        if (!lSec || !lSec.title) failures.push(`[${lang}/course-l1] Missing section ${sIdx}`);
        (sec.screens || []).forEach((scr, scrIdx) => {
          sCount++;
          const lScr = lSec?.screens?.[String(scrIdx)];
          if (!lScr) {
            failures.push(`[${lang}/course-l1] Missing screen ${sIdx}.${scrIdx} (${scr.title})`);
          } else {
            if (!lScr.title || !lScr.lead || !lScr.takeaway) {
              failures.push(`[${lang}/course-l1] Incomplete core fields at screen ${sIdx}.${scrIdx}`);
            }
            if (Array.isArray(scr.points) && (!Array.isArray(lScr.points) || lScr.points.length !== scr.points.length)) {
              failures.push(`[${lang}/course-l1] Points array mismatch at screen ${sIdx}.${scrIdx}`);
            }
            if (lang === 'fr-FR' && scr.lead && scr.lead.length > 35 && normalizeCmp(lScr.lead) === normalizeCmp(scr.lead)) {
              summary.englishLeaks.push(`${lang}/course-l1:section.${sIdx}.screen.${scrIdx}.lead`);
            }
            if (lang === 'ar' && lScr.lead && lScr.lead.length > 20 && !/[\u0600-\u06FF]/.test(lScr.lead)) {
              summary.missingArabicScript.push(`${lang}/course-l1:section.${sIdx}.screen.${scrIdx}.lead`);
            }
          }
        });
        (sec.quiz || []).forEach((qItem, qIdx) => {
          qCount++;
          const lq = lSec?.quiz?.[String(qIdx)] || lSec?.quiz?.[qIdx];
          const qText = qItem.q || qItem.question || qItem.prompt;
          if (!lq || !(lq.q || lq.question || lq.prompt) || !Array.isArray(lq.options) || lq.options.length !== qItem.options.length) {
            failures.push(`[${lang}/course-l1] Quiz mismatch at section ${sIdx} item ${qIdx} (${qText?.slice(0, 30)})`);
          } else {
            if (!(Number.isInteger(qItem.answer) && qItem.answer >= 0 && qItem.answer < lq.options.length)) {
              failures.push(`[${lang}/course-l1] Canonical quiz answer index out of bounds at ${sIdx}.${qIdx}`);
            }
          }
        });
      });

      // Check 18 narration tracks
      for (const tr of l1Exp.narration.tracks) {
        const ltr = loc.experience?.tracks?.[tr.id];
        if (!ltr || !ltr.script || !ltr.title) {
          failures.push(`[${lang}/course-l1] Missing transcript/title localization for track ${tr.id}`);
        }
      }
      // Check decisions (keyed by dv.id)
      let dCount = 0;
      for (const [dk, dv] of Object.entries(l1Exp.decisions || {})) {
        dCount++;
        const ld = loc.experience?.decisions?.[dv.id || dk];
        if (!ld || !Array.isArray(ld.options) || ld.options.length !== dv.options.length) {
          failures.push(`[${lang}/course-l1] Decision mismatch for ${dv.id || dk}`);
        } else if (Number.isInteger(dv.best) && !(dv.best >= 0 && dv.best < ld.options.length)) {
          failures.push(`[${lang}/course-l1] Decision best index out of bounds for ${dv.id || dk}`);
        }
      }
      // Check visualJourney scenes/exercises/microCases and labs
      if (l1Vj?.scenes) {
        for (const sid of Object.keys(l1Vj.scenes)) {
          if (!loc.visualJourney?.scenes?.[sid]) {
            failures.push(`[${lang}/course-l1] Missing visualJourney scene ${sid}`);
          }
        }
      }
      if (l1Vj?.exercises) {
        for (const eid of Object.keys(l1Vj.exercises)) {
          if (!loc.visualJourney?.exercises?.[eid]) {
            failures.push(`[${lang}/course-l1] Missing visualJourney exercise ${eid}`);
          }
        }
      }
      if (l1Vj?.microCases) {
        for (const mcid of Object.keys(l1Vj.microCases)) {
          if (!loc.visualJourney?.microCases?.[mcid]) {
            failures.push(`[${lang}/course-l1] Missing visualJourney microCase ${mcid}`);
          }
        }
      }
      if (!loc.labs?.areas || Object.keys(loc.labs.areas).length < 5 || !loc.labs?.dimensions || Object.keys(loc.labs.dimensions).length < 6) {
        failures.push(`[${lang}/course-l1] Incomplete labs matrix localization`);
      }

      if (lang === 'fr-FR') {
        summary.courseL1Screens = sCount;
        summary.courseL1Quizzes = qCount;
        summary.courseL1Decisions = dCount;
      }
    }
  }

  // 3. Lessons 2-6 canonical coverage vs curricula/cbd/lessons-2-3.json + lessons-4-6.json
  const cbdEn = {
    lessons: [
      ...readJson('curricula/cbd/lessons-2-3.json'),
      ...readJson('curricula/cbd/lessons-4-6.json')
    ]
  };
  for (const lang of LANGS) {
    const loc = packsByLang[lang]['lessons-2-6'];
    let lCount = 0;
    let sCount = 0;
    let qCount = 0;
    let dCount = 0;
    let labCount = 0;

    for (const lesson of cbdEn.lessons || []) {
      lCount++;
      const ll = loc.lessons?.[lesson.id];
      if (!ll || !ll.title) {
        failures.push(`[${lang}/lessons-2-6] Missing lesson ${lesson.id}`);
        continue;
      }
      (lesson.sections || []).forEach((sec, sIdx) => {
        const lSec = ll.sections?.[String(sIdx)];
        if (!lSec || !lSec.title) failures.push(`[${lang}/lessons-2-6] Missing section ${lesson.id}:${sIdx}`);
        (sec.screens || []).forEach((scr, scrIdx) => {
          sCount++;
          const lScr = lSec?.screens?.[String(scrIdx)] || lSec?.screens?.[scr.id];
          if (!lScr) {
            failures.push(`[${lang}/lessons-2-6] Missing screen ${lesson.id}:${scr.id}`);
            return;
          }
          if (lang === 'fr-FR' && scr.lead && scr.lead.length > 40 && normalizeCmp(lScr.lead) === normalizeCmp(scr.lead)) {
            summary.englishLeaks.push(`${lang}/lessons-2-6:${lesson.id}.${scr.id}.lead`);
          }
          if (lang === 'ar' && lScr.lead && lScr.lead.length > 20 && !/[\u0600-\u06FF]/.test(lScr.lead)) {
            summary.missingArabicScript.push(`${lang}/lessons-2-6:${lesson.id}.${scr.id}.lead`);
          }
          if (scr.decision) {
            dCount++;
            if (!lScr.decision || !Array.isArray(lScr.decision.options) || lScr.decision.options.length !== scr.decision.options.length) {
              failures.push(`[${lang}/lessons-2-6] Decision options mismatch at ${lesson.id}:${scr.id}`);
            }
          }
          if (scr.lab) {
            labCount++;
            if (!lScr.lab) failures.push(`[${lang}/lessons-2-6] Missing lab localization at ${lesson.id}:${scr.id}`);
          }
        });
        (sec.quiz || []).forEach((qItem, qIdx) => {
          qCount++;
          const lq = lSec?.quiz?.[String(qIdx)] || lSec?.quiz?.[qIdx];
          if (!lq || !(lq.q || lq.question || lq.prompt) || !Array.isArray(lq.options) || lq.options.length !== qItem.options.length) {
            failures.push(`[${lang}/lessons-2-6] Quiz options mismatch at ${lesson.id}:${sIdx}.${qIdx}`);
          } else if (!(Number.isInteger(qItem.answer) && qItem.answer >= 0 && qItem.answer < lq.options.length)) {
            failures.push(`[${lang}/lessons-2-6] Canonical answer index out of bounds at ${lesson.id}:${sIdx}.${qIdx}`);
          }
        });
      });
    }
    if (lang === 'fr-FR') {
      summary.lessons26Count = lCount;
      summary.lessons26Screens = sCount;
      summary.lessons26Quizzes = qCount;
      summary.lessons26Decisions = dCount;
      summary.lessons26Labs = labCount;
    }
  }

  // 4. Workbenches coverage & leak checks
  const scenarioEn = require('../js/data/carana-scenario.js');
  const glossaryEn = require('../js/data/curriculum-glossary.js');
  for (const lang of LANGS) {
    const wb = packsByLang[lang].workbenches;
    if (!wb.strings || !wb.dom || !wb.scenario || !wb.glossary) {
      failures.push(`[${lang}/workbenches] Missing required top-level object.`);
      continue;
    }
    if (lang === 'fr-FR') {
      summary.workbenchStrings = Object.keys(wb.strings).length;
      summary.workbenchDomKeys = Object.keys(wb.dom).length;
    }
    for (const [k, v] of Object.entries(wb.strings)) {
      if (lang === 'ar' && typeof v === 'string' && v.trim().length > 25 && !isUrlOrCodeOnly(v) && !/[\u0600-\u06FF]/.test(v) && !/^\{[\w]+\}$/.test(v.trim())) {
        // Allow intentional proper nouns/acronyms or short format templates
        if (!/(?:CARANA|UNPOL|ISO|JSON|KPI|SMART|PESTEL|PIN|RBB|QIP|Logframe|As-Is|To-Be|S\/RES|5\s*[×x]\s*6)/i.test(v)) {
          summary.missingArabicScript.push(`ar/workbenches.strings.${k}: "${v}"`);
        }
      }
      if (lang === 'fr-FR' && typeof v === 'string' && k.length > 40 && !isUrlOrCodeOnly(k) && normalizeCmp(v) === normalizeCmp(k)) {
        if (!/(?:CARANA|UNPOL|S\/RES|http|\.html)/i.test(k)) {
          summary.englishLeaks.push(`fr-FR/workbenches.strings.${k}`);
        }
      }
    }
    if ((wb.scenario.BACKGROUND || []).length !== (scenarioEn.BACKGROUND || []).length) {
      failures.push(`[${lang}/workbenches] Scenario BACKGROUND length mismatch`);
    }
    const enParaIds = Object.keys(scenarioEn.PARAGRAPHS || {}).map(String);
    for (const pid of enParaIds) {
      if (!wb.scenario.PARAGRAPHS?.[pid]) {
        failures.push(`[${lang}/workbenches] Missing Scenario paragraph ${pid}`);
      }
    }
    if ((wb.glossary.TERMS || []).length !== (glossaryEn.TERMS || []).length) {
      failures.push(`[${lang}/workbenches] Glossary TERMS length mismatch`);
    }
  }

  // 4b. Verify all literal tw()/wbT() keys in js/modules/*.js & lab-storage.js exist in both FR & AR workbenches.json
  const wbFiles = [
    'js/modules/module1.js', 'js/modules/module2.js', 'js/modules/module3.js',
    'js/modules/module4.js', 'js/modules/module5.js', 'js/modules/module6.js', 'js/storage/lab-storage.js'
  ];
  for (const wf of wbFiles) {
    const src = fs.readFileSync(path.join(ROOT, wf), 'utf8');
    for (const m of src.matchAll(/\b(?:tw|wbT)\(\s*(['"])([^'"]+)\1/g)) {
      const k = m[2];
      for (const lang of LANGS) {
        const wb = packsByLang[lang].workbenches;
        if (!Object.prototype.hasOwnProperty.call(wb.strings, k) && !Object.prototype.hasOwnProperty.call(wb.dom, k)) {
          failures.push(`[${lang}/workbenches] Missing literal key used in ${wf}: ${k}`);
        }
      }
    }
  }
  // Verify all data-i18n* attributes in HTML pages resolve in ui.json
  const resolveDot = (obj, k) => k.split('.').reduce((o, p) => (o && typeof o === 'object' ? o[p] : undefined), obj);
  for (const hf of [
    'course/visual-gallery.html', 'course/voice-audition.html', 'course/voice-comparison.html',
    'platform/index.html', 'platform/notebook.html', 'platform/demo.html', 'platform/demo-showcase.html'
  ]) {
    const html = fs.readFileSync(path.join(ROOT, hf), 'utf8');
    for (const m of html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)) {
      const k = m[1];
      for (const lang of LANGS) {
        if (resolveDot(packsByLang[lang].ui, k) === undefined) {
          failures.push(`[${lang}/ui] Missing HTML data-i18n key in ${hf}: ${k}`);
        }
      }
    }
  }

  // 5. UNPOL Terminology Glossary validation
  const gloss = readJson('docs/localization/TERMINOLOGY_GLOSSARY.json');
  const validStatuses = new Set(Object.keys(gloss.statuses || {}));
  summary.glossaryEntries = (gloss.entries || []).length;
  for (const entry of gloss.entries || []) {
    if (!entry.id || !entry.en || !entry.fr || !entry.ar || !validStatuses.has(entry.status)) {
      failures.push(`Invalid glossary entry: ${JSON.stringify(entry)}`);
    }
  }
  const requiredTermIds = ['capacity_gap', 'output', 'outcome', 'indicator', 'verification_sources', 'assumption', 'risk', 'local_ownership', 'transition_arrangements'];
  const glossIds = new Set((gloss.entries || []).map(e => e.id));
  for (const tid of requiredTermIds) {
    if (!glossIds.has(tid)) failures.push(`Glossary missing critical CBD concept: ${tid}`);
  }
  // Check terminology consistency spot check on Lessons 2-6
  const frL26Str = JSON.stringify(packsByLang['fr-FR']['lessons-2-6']);
  const arL26Str = JSON.stringify(packsByLang['ar']['lessons-2-6']);
  if (!/produit/i.test(frL26Str) || !/r[ée]alisation/i.test(frL26Str)) {
    failures.push('French Lessons 2-6 missing expected UNPOL output/outcome distinction (produit / réalisation).');
  }
  if (!/مخرج/.test(arL26Str) || !/نتيجة/.test(arL26Str)) {
    failures.push('Arabic Lessons 2-6 missing expected UNPOL output/outcome distinction (مخرج / نتيجة).');
  }

  // 6. All 15 HTML entry pages must include i18n-rtl.css and platform/i18n.js
  const htmlPages = [
    'index.html', 'module1.html', 'module2.html', 'module3.html', 'module4.html', 'module5.html', 'module6.html',
    'platform/index.html', 'platform/notebook.html', 'platform/demo.html', 'platform/demo-showcase.html',
    'course/index.html', 'course/visual-gallery.html', 'course/voice-audition.html', 'course/voice-comparison.html'
  ];
  summary.htmlPagesChecked = htmlPages.length;
  for (const hp of htmlPages) {
    const content = fs.readFileSync(path.join(ROOT, hp), 'utf8');
    if (!content.includes('i18n-rtl.css')) failures.push(`HTML missing css/i18n-rtl.css link: ${hp}`);
    if (!content.includes('i18n.js')) failures.push(`HTML missing platform/i18n.js script: ${hp}`);
  }

  // 7. Arabic RTL stylesheet guard (no letter-spacing breaking connected glyphs)
  const rtlCss = fs.readFileSync(path.join(ROOT, 'css/i18n-rtl.css'), 'utf8');
  if (!/\[dir="rtl"\][\s\S]*letter-spacing:\s*0\b/.test(rtlCss)) {
    failures.push('css/i18n-rtl.css must reset letter-spacing: 0 in [dir="rtl"] to prevent broken Arabic glyphs.');
  }

  if (summary.englishLeaks.length) {
    warnings.push(`Potential untranslated EN strings in fr-FR: ${summary.englishLeaks.slice(0, 10).join(', ')}`);
  }
  if (summary.missingArabicScript.length) {
    failures.push(`Arabic strings missing Arabic script: ${summary.missingArabicScript.slice(0, 10).join(', ')}`);
  }

  const ok = failures.length === 0;
  console.log(JSON.stringify({ ok, summary, warnings, failures }, null, 2));
  if (!ok) process.exit(1);
}

main();
