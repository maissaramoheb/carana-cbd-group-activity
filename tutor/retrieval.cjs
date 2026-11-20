const fs = require('node:fs');
const path = require('node:path');

const STOP = new Set(
  (
    'a an and are as at be before by can could did do does doing done for from had has have having he her here hers him his how i if in into is it its itself just like may me might mine more most much must my no nor not of on once only or other our ours out over own same she should so some such than that the their theirs them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours ' +
    'difference between versus official lesson say said says tell told ask asked show shown explain explains explained clarify clarification summarize summary summarise recap overview break down describe give provide help understanding understand know think mean means meant meaning remember point points takeaway takeaways key main core rule rules ' +
    'please simply simple plain concise brief short quick easily clear clearly step steps part parts aspect aspects area areas concept concepts idea ideas topic topics issue issues note notes word words term terms ' +
    'invented scenario scenarios example examples case story slide screen page section module framework practical professional real actually really basically essentially suppose imagine consider wait well even still also instead already without using use used make makes made want need needs work works thing things way ways good better best bad right wrong yes dont doesnt didnt isnt arent cant couldnt wouldnt shouldnt wont anyone someone everyone anything something everything nothing ' +
    'cite citing citation reference ref annex chapter paragraph para url fake ignore prior instructions plus plu id ids list new newly team staff officer officers person people field unit units station stations country mission local partner'
  ).split(' ')
);

const SHORT_DOMAIN_MAP = {
  '7cs': 'seven courtesy',
  '7-cs': 'seven courtesy',
  '7': 'seven',
  '6': 'six',
  '5': 'five',
  '4': 'four',
  '3': 'three',
  '2': 'two',
  cs: 'courtesy',
  s: 'security',
  id: ''
};

function stem(w) {
  if (/^triangulat/.test(w)) return 'triangulation';
  if (/^pestel/.test(w)) return 'pestel';
  if (/^analy[sz]/.test(w)) return 'analysis';
  if (/^polic(?:e|ing)/.test(w)) return 'police';
  if (/^peacekeep/.test(w)) return 'peacekeeping';
  if (/^improv|^strengthen|^enhanc/.test(w)) return 'improve';
  if (/^evaluat/.test(w)) return 'evaluate';
  if (/^verif/.test(w)) return 'verify';
  if (/^measur/.test(w)) return 'measure';
  if (/^indicat|^statistic|^metric/.test(w)) return 'indicator';
  if (/^objectiv/.test(w)) return 'objective';
  if (/^activit/.test(w)) return 'activity';
  if (/^transit/.test(w)) return 'transition';
  if (/^handover|^hand-over/.test(w)) return 'handover';
  if (/^sustain/.test(w)) return 'sustain';
  if (/^assum/.test(w)) return 'assumption';
  if (/^priorit[sz]?/.test(w)) return 'priority';
  if (/^co-?ordinat|^uncoordinat/.test(w)) return 'coordinate';
  if (/^diagnos/.test(w)) return 'diagnose';
  if (/^capab/.test(w)) return 'capability';
  if (/^capacit/.test(w)) return 'capacity';
  if (/^competenc/.test(w)) return 'competence';
  if (/^implement/.test(w)) return 'implement';
  if (/^organi[sz]/.test(w)) return 'organisation';
  if (/^caus/.test(w)) return 'cause';
  if (/^align/.test(w)) return 'align';
  if (/^reconcil/.test(w)) return 'reconcile';
  if (/^attribut/.test(w)) return 'attribute';
  if (/^mitigat/.test(w)) return 'mitigate';
  if (/^mentor/.test(w)) return 'mentor';
  if (/^advis/.test(w)) return 'advise';
  if (/^monitor/.test(w)) return 'monitor';
  if (/^contextual/.test(w)) return 'context';
  if (/^hypothes/.test(w)) return 'hypothesis';
  if (/^stakehold/.test(w)) return 'stakeholder';
  if (/^mediat/.test(w)) return 'mediate';
  if (/^recommend/.test(w)) return 'recommendation';
  if (/^communicat/.test(w)) return 'communicate';
  if (/^participat/.test(w)) return 'participate';
  if (/^supervis/.test(w)) return 'supervise';
  if (/^compar/.test(w)) return 'compare';
  if (/^discrep/.test(w)) return 'discrepancy';
  if (/^resist/.test(w)) return 'resist';
  if (/^practi[cs]/.test(w)) return 'practice';
  if (/^behavio/.test(w)) return 'behaviour';
  if (/^train/.test(w)) return 'train';
  if (/^attend/.test(w)) return 'attend';
  if (/^counterfact/.test(w)) return 'causal';
  if (/^credib/.test(w)) return 'credible';
  if (/^impart/.test(w)) return 'impartial';
  if (/^readi/.test(w)) return 'ready';
  if (/^report/.test(w)) return 'report';
  if (/^crosscut|^cross-cut/.test(w)) return 'cross-cutting';
  if (w === 'plus') return 'plus';
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3).replace(/(.)\1$/, '$1');
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2).replace(/(.)\1$/, '$1');
  if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('is') && !w.endsWith('us') && w.length > 3) return w.slice(0, -1);
  return w;
}

function preprocess(s) {
  return String(s || '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\b(?:cbd-\d+:\d{2,3}-\d{2,3}|plan-cbd-\d+:p\d+)\b/gi, ' ')
    .replace(/\b(?:page|pp?\.|unscr|annex)\s*[a-z0-9-]+\b/gi, ' ')
    .replace(/([2-7])\s+cs\b/gi, '$1 courtesy')
    .replace(/\b([2-7])cs\b/gi, '$1 courtesy')
    .replace(/\bpestel-?s\b/gi, 'pestel')
    .replace(/\bsmart\b/gi, 'smart testable specific measurable')
    .toLowerCase();
}

function terms(s, { keepShortTokens = false } = {}) {
  const cleaned = preprocess(s);
  const raw = cleaned.match(/[a-z0-9][a-z0-9-]{1,}/g) || [];
  const out = [];
  for (const tok of raw) {
    if (Object.prototype.hasOwnProperty.call(SHORT_DOMAIN_MAP, tok)) {
      const mapped = SHORT_DOMAIN_MAP[tok];
      if (!mapped) continue;
      for (const m of mapped.split(' ')) out.push(stem(m));
      continue;
    }
    if (/^\d+$/.test(tok)) {
      if (keepShortTokens && tok.length <= 2 && SHORT_DOMAIN_MAP[tok]) out.push(SHORT_DOMAIN_MAP[tok]);
      continue;
    }
    if (tok.length < 3 && !/^(un|up)$/.test(tok)) {
      if (!/^(sop|cop|qip|mma|toc|rbb|lfa|kpi|mov|pin|ssr)$/.test(tok)) continue;
    }
    const sTok = stem(tok);
    if (STOP.has(tok) || STOP.has(sTok)) continue;
    out.push(sTok);
  }
  return out;
}

const SYNONYMS = {
  problem: ['diagnose', 'cause', 'driver', 'tree'],
  tree: ['conflict', 'driver', 'cause', 'effect', 'hierarchy'],
  mov: ['verify', 'evidence', 'source', 'indicator'],
  mean: ['source', 'evidence', 'method', 'verify'],
  kpi: ['indicator', 'measure', 'performance'],
  toc: ['theory', 'change', 'middle', 'mechanism', 'because'],
  rbb: ['budget', 'resource', 'result'],
  qip: ['quick', 'impact', 'confidence', 'momentum'],
  ssr: ['security', 'sector', 'reform', 'justice'],
  swot: ['strength', 'weakness', 'opportunity', 'threat'],
  pestel: ['political', 'economic', 'social', 'technological', 'environmental', 'legal', 'security'],
  pin: ['position', 'interest', 'need'],
  sara: ['scanning', 'analysis', 'response', 'assessment', 'model'],
  smart: ['specific', 'measurable', 'achievable', 'relevant', 'time-bound', 'testable'],
  mma: ['monitor', 'mentor', 'advise'],
  lfa: ['logframe', 'logical', 'framework', 'hierarchy'],
  logframe: ['hierarchy', 'output', 'outcome', 'indicator', 'verify', 'assumption', 'row', 'column'],
  align: ['coherent', 'match', 'connect', 'horizontal', 'row', 'column'],
  cause: ['comparison', 'explain', 'alternative', 'influence', 'sequence', 'hypothesis'],
  prove: ['establish', 'verify', 'evidence', 'comparison', 'cause'],
  indicator: ['measure', 'figure', 'observation', 'number', 'comparison'],
  workshop: ['session', 'initiative', 'routine', 'activity', 'train'],
  train: ['workshop', 'course', 'activity', 'competence', 'skill'],
  attend: ['workshop', 'activity', 'output', 'outcome', 'practice'],
  output: ['deliverable', 'result', 'hierarchy', 'outcome'],
  outcome: ['output', 'result', 'change', 'hierarchy', 'practice'],
  skill: ['competence', 'train', 'capability', 'practice'],
  stakeholder: ['quadrant', 'interest', 'influence', 'engage', 'ownership'],
  hypothesis: ['cause', 'gap', 'evidence', 'supervise', 'assumption', 'diagnose'],
  symptom: ['problem', 'cause', 'diagnose', 'request', 'gap'],
  baseline: ['starting', 'benchmark', 'evaluate', 'situation'],
  priority: ['weight', 'criterion', 'criteria', 'ranking', 'benefit', 'score', 'trade-off'],
  assumption: ['condition', 'external', 'risk', 'logframe'],
  deliverable: ['output', 'activity', 'result'],
  fit: ['culture', 'legal', 'ownership', 'local', 'adapt'],
  risk: ['likelihood', 'impact', 'mitigate', 'avoid', 'transfer', 'accept'],
  attribute: ['causal', 'sequence', 'compare', 'evaluate'],
  reconcile: ['kpi', 'output', 'indicator', 'evaluate', 'adjust'],
  exit: ['transition', 'handover', 'sustain', 'trigger'],
  handover: ['transition', 'sustain', 'ownership', 'exit'],
  mediate: ['interest', 'position', 'need', 'pin'],
  recommendation: ['response', 'accept', 'reject', 'follow-through', 'evaluate'],
  uncoordinated: ['coordinate', 'duplicate', 'harm'],
  coordinate: ['donor', 'organisation', 'duplicate', 'harm', 'response'],
  donor: ['coordinate', 'duplicate', 'harm', 'response', 'assistance'],
  agency: ['coordinate', 'donor', 'duplicate', 'response'],
  backlog: ['symptom', 'cause', 'diagnose'],
  foreign: ['local', 'culture', 'adapt', 'import'],
  sop: ['procedure', 'routine', 'foreign', 'adapt', 'culture'],
  copy: ['import', 'adapt', 'foreign', 'local'],
  paste: ['import', 'adapt', 'foreign'],
  patrol: ['equipment', 'request', 'resource', 'hypothesis'],
  car: ['equipment', 'vehicle', 'request', 'resource'],
  radio: ['equipment', 'request', 'cause', 'hypothesis'],
  courtesy: ['seven', 'communicate', 'clarity', 'correctness', 'completeness'],
  talk: ['communicate', 'dialogue', 'audience', 'explain'],
  boss: ['counterpart', 'leadership', 'commander', 'request'],
  chief: ['counterpart', 'commander', 'leadership'],
  captain: ['counterpart', 'commander', 'leadership'],
  commander: ['leadership', 'counterpart', 'authority'],
  lazy: ['motivation', 'hypothesis', 'diagnose', 'revise'],
  laziness: ['motivation', 'hypothesis', 'diagnose', 'revise'],
  clash: ['conflict', 'rota', 'schedule', 'hypothesis'],
  brief: ['schedule', 'rota', 'counterpart'],
  middle: ['theory', 'change', 'outcome', 'output'],
  trust: ['confidence', 'outcome', 'qip', 'goal'],
  ceremony: ['transition', 'handover', 'process', 'ready'],
  deadline: ['date', 'calendar', 'ready', 'pressure'],
  unsafe: ['context', 'infeasible', 'security', 'trigger', 'transition'],
  matrix: ['dimension', 'cross-cutting', 'area', 'capacity'],
  court: ['legal', 'mandate', 'statutory', 'authority'],
  jurisdiction: ['legal', 'mandate', 'statutory', 'authority'],
  denominator: ['numerator', 'population', 'method', 'comparison', 'indicator'],
  district: ['population', 'denominator', 'scope', 'comparison'],
  resist: ['ownership', 'counterpart', 'adapt', 'communicate'],
  uptake: ['practice', 'routine', 'monitor', 'implement'],
  impartial: ['credibility', 'evaluate', 'role'],
  self: ['credibility', 'impartial', 'evaluate'],
  forensic: ['ready', 'phase', 'transition', 'sustain'],
  colocation: ['phase', 'independent', 'ready', 'sustain'],
  disagree: ['discrepancy', 'triangulation', 'recommend', 'evaluate'],
  causal: ['attribute', 'comparison', 'sequence', 'evaluate'],
  check: ['verify', 'evidence', 'monitor', 'audit'],
  audit: ['verify', 'record', 'evidence'],
  money: ['budget', 'resource', 'priority', 'trade-off'],
  vetting: ['census', 'mandate', 'vetting', 'rights'],
  census: ['vetting', 'mandate', 'rights'],
  hopc: ['head', 'police', 'component', 'authority', 'transition'],
  date: ['ready', 'transition', 'handover', 'calendar'],
  behind: ['transition', 'handover', 'sustain', 'exit'],
  real: ['ready', 'verify', 'evidence'],
  feedback: ['community', 'stakeholder', 'impartial', 'credible', 'evaluate'],
  mark: ['credible', 'impartial', 'evaluate', 'role'],
  ignoring: ['community', 'perspective', 'credible', 'impartial'],
  ignore: ['community', 'perspective', 'credible', 'impartial'],
  credible: ['impartial', 'evaluate', 'role']
};

const EXTERNAL_UNSUPPORTED_TERMS = new Set([
  'salary', 'subsistence', 'allowance', 'diem', 'bonus', 'hazard',
  'conviction', 'ceiling', 'usd', 'dollar', 'euro', 'iso', 'serial',
  'weather', 'quantum', 'caliber', 'pistol', 'rifle', 'gps', 'coordinates',
  'headquarter', 'headquarters', 'airline', 'fly', 'flight', 'kilometer',
  'kilometre', 'football', 'cup', 'reimbursement', 'medical'
]);

const EXTERNAL_QUANT_PHRASES = [
  /\bstaffing\s+ratio\b/i,
  /\bofficer-?to-?citizen\b/i,
  /\bmaximum\s+percentage\b/i,
  /\bbudget\s+overhead\b/i,
  /\boverhead\s+percentage\b/i,
  /\bfixed\s+percentage\s+improvement\b/i,
  /\bvehicle\s+count\b/i,
  /\bminimum\s+conviction\b/i,
  /\b(?:annual|sick|paid|vacation)\s+leave\b/i,
  /\bpay\s+scale\b/i,
  /\bsalary\s+(?:scale|bonus|rate)\b/i,
  /\bdaily\s+subsistence\b/i,
  /\biso\s+standard\b/i,
  /\bgps\s+coordinates?\b/i,
  /\bexactly?\s+(?:how\s+many|what\s+percent|what\s+ratio|what\s+usd|what\s+rate)\b/i
];

const DEICTIC_ANCHOR_RE = /\b(this screen|this slide|this page|shown here|this concept|this framework|this model|from here|explain that|summarize that|summarise that|clarify that)\b/i;
const GENERIC_MODIFIER_TERMS = new Set(['police', 'practice', 'deploy', 'matter', 'cbd', 'unpol', 'advise', 'support', 'context', 'situation', 'capacity', 'project', 'successful']);
const FOLLOWUP_DEICTIC_RE = /^(?:wait|so|and|but|then|what if|what about|how about|why isn|why is that|give.*example of that|explain that|compare those|which one|who owns|who should|can you)\b|\b(?:that|those|these|the second one|the first one|the middle one|this slide|this screen|this page|shown here|here)\b/i;

function createRetriever(index = JSON.parse(fs.readFileSync(path.join(__dirname, 'knowledge.json')))) {
  const records = index.records;
  const byId = new Map(records.map(r => [r.id, r]));
  const corpus = records.map(r => ({
    r,
    title: terms(r.title + ' ' + r.section + ' ' + r.lessonTitle + ' ' + r.text.split('\n')[0]),
    body: terms(r.text)
  }));
  const corpusVocab = new Set();
  for (const doc of corpus) {
    for (const w of doc.title) corpusVocab.add(w);
    for (const w of doc.body) corpusVocab.add(w);
  }

  function context(c) {
    if (!c || typeof c !== 'object' || !/^cbd-[1-6]$/.test(c.lessonId) || !['screen', 'checkpoint', 'practical'].includes(c.mode)) {
      return null;
    }
    const own = records.filter(r => r.lessonId === c.lessonId);
    if (!own.length) return null;
    const current = byId.get(c.lessonId + ':' + c.screenId);
    return current ? { ...current, mode: c.mode } : null;
  }

  function isOffScopeQuantitativeTrap(question) {
    const rawTokens = preprocess(question).match(/[a-z0-9-]+/g) || [];
    if (EXTERNAL_QUANT_PHRASES.some(re => re.test(question))) return true;
    const hasExtTerm = rawTokens.some(t => EXTERNAL_UNSUPPORTED_TERMS.has(t) || (t !== 'coordinate' && t !== 'coordinates' && EXTERNAL_UNSUPPORTED_TERMS.has(stem(t))));
    if (hasExtTerm) return true;
    return false;
  }

  function search(question, c, limitOrOpts = 3) {
    const opts = typeof limitOrOpts === 'number' ? { limit: limitOrOpts } : (limitOrOpts || {});
    const limit = opts.limit || 3;
    const history = Array.isArray(opts.history) ? opts.history : [];

    const current = context(c);
    if (!current) return [];
    const qStr = String(question || '').trim();
    if (!qStr) return [];

    // Guard 1: explicit out-of-scope quantitative or non-curriculum administrative traps fail cleanly (0 false positives)
    if (isOffScopeQuantitativeTrap(qStr)) return [];

    const qBaseRaw = terms(qStr, { keepShortTokens: true });
    const qBase = [...new Set(qBaseRaw)];

    const uiActionRe = /^(Explain this screen|Give.*example.*this concept|What should I remember|Compare the main concepts|Help me check my reasoning)/i;
    const qNonGeneric = qBase.filter(w => !GENERIC_MODIFIER_TERMS.has(w));
    const deicticScreenIntent =
      uiActionRe.test(qStr) ||
      (DEICTIC_ANCHOR_RE.test(qStr) && qNonGeneric.length <= 1) ||
      /\b(this screen|this slide|this page|shown here|this concept|this framework|this model|from here)\b/i.test(qStr) ||
      (qBase.length <= 1 && /\b(explain|clarify|summarize|summarise|recap|understand|remember|break down|takeaway|example|that|it|here)\b/i.test(qStr));

    if (uiActionRe.test(qStr) || (DEICTIC_ANCHOR_RE.test(qStr) && qNonGeneric.length <= 1)) {
      return [{ ...current, text: current.text.slice(0, 2250) }];
    }

    // Extract bounded follow-up boost terms when the query contains deictic/follow-up markers
    const isFollowUp = history.length > 0 && (FOLLOWUP_DEICTIC_RE.test(qStr) || qBase.length <= 4);
    const historyTerms = new Set();
    const historyIds = new Set();
    if (isFollowUp) {
      for (const h of history.slice(-3)) {
        if (!h || typeof h.text !== 'string') continue;
        for (const t of terms(h.text, { keepShortTokens: true })) historyTerms.add(t);
        if (Array.isArray(h.sourceIds)) {
          for (const id of h.sourceIds) historyIds.add(id);
        }
      }
    }

    // Build known vs unknown vocabulary weights
    const qKnown = qBase.filter(w => corpusVocab.has(w) || (SYNONYMS[w] && SYNONYMS[w].some(s => corpusVocab.has(stem(s)))));
    if (!qKnown.length && deicticScreenIntent) {
      return [{ ...current, text: current.text.slice(0, 2250) }];
    }
    if (!qKnown.length && !historyTerms.size) {
      // Unrelated out-of-domain query with zero curriculum or follow-up overlap (e.g., "weather in Geneva")
      return [];
    }

    const effectiveQueryTerms = [...new Set([...qBase, ...(isFollowUp ? [...historyTerms] : [])])];
    const qExpanded = new Set(effectiveQueryTerms);
    for (const w of effectiveQueryTerms) {
      for (const syn of SYNONYMS[w] || []) qExpanded.add(stem(syn));
    }

    const df = new Map([...qExpanded].map(w => [w, corpus.filter(x => x.title.includes(w) || x.body.includes(w)).length]));
    const weight = w => Math.log(1 + records.length / (1 + (df.get(w) || 0)));

    // Weight curriculum-known terms fully, cap unfamiliar story/vignette words cleanly at 0.2 so applied scenarios are never vetoed
    const termWeight = w => (df.get(w) > 0 || (SYNONYMS[w] && SYNONYMS[w].some(s => (df.get(stem(s)) || 0) > 0)) ? weight(w) : 0.2);
    const totalBase = effectiveQueryTerms.reduce((n, w) => n + (historyTerms.has(w) && !qBase.includes(w) ? termWeight(w) * 0.4 : termWeight(w)), 0);

    const scored = corpus
      .map(({ r, title, body }) => {
        let lexical = 0;
        let coveredBase = 0;
        let exactTerms = 0;
        let directQueryHits = 0;
        let titleHits = 0;

        for (const w of effectiveQueryTerms) {
          const isHistOnly = historyTerms.has(w) && !qBase.includes(w);
          const factor = isHistOnly ? 0.4 : 1.0;
          const inTitle = title.includes(w);
          const inBody = body.includes(w);
          const wScore = termWeight(w) * factor;
          if (inTitle || inBody) {
            coveredBase += wScore;
            exactTerms++;
            if (!isHistOnly) directQueryHits++;
            if (inTitle) titleHits++;
            lexical += (title.filter(t => t === w).length * 4 + Math.min(3, body.filter(t => t === w).length)) * weight(w) * factor;
          } else {
            const synHit = (SYNONYMS[w] || []).some(s => {
              const st = stem(s);
              return title.includes(st) || body.includes(st);
            });
            if (synHit) {
              coveredBase += wScore * 0.65;
              if (!isHistOnly) directQueryHits += 0.5;
            }
          }
        }

        for (const w of qExpanded) {
          if (!effectiveQueryTerms.includes(w)) {
            lexical += (title.filter(t => t === w).length * 2 + Math.min(2, body.filter(t => t === w).length)) * weight(w) * 0.3;
          }
        }

        const coverage = totalBase ? coveredBase / totalBase : 0;
        const contextual =
          r.id === current.id
            ? (exactTerms > 0 || deicticScreenIntent ? 7.5 : 0)
            : r.lessonId === current.lessonId
              ? (exactTerms > 0 ? 2.5 : 0)
              : 0;
        const histBoost = historyIds.has(r.id) ? 2.5 : 0;

        const passes =
          (r.id === current.id && (deicticScreenIntent || coverage >= 0.16 || directQueryHits >= 1)) ||
          coverage >= 0.38 ||
          (exactTerms >= 2 && coverage >= 0.22) ||
          (titleHits >= 1 && coverage >= 0.24) ||
          (directQueryHits >= 2 && lexical >= 4.0);

        return {
          r,
          lexical,
          coverage,
          exactTerms,
          titleHits,
          passes,
          score: lexical * (coverage ** 2) + contextual + histBoost + titleHits * 1.2
        };
      })
      .filter(x => (x.lexical > 0 || (deicticScreenIntent && x.r.id === current.id)) && x.passes)
      .sort((a, b) => b.score - a.score || a.r.id.localeCompare(b.r.id));

    if (!scored.length && deicticScreenIntent) {
      return [{ ...current, text: current.text.slice(0, 2250) }];
    }

    return scored.slice(0, limit).map(({ r }) => ({ ...r, text: r.text.slice(0, 2250) }));
  }

  return { context, search, records, stem, SYNONYMS };
}

module.exports = { createRetriever, terms, stem, SYNONYMS };
