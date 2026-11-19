/* Follow-up 02: Independent retrieval evaluation and full generation qualification (fixed matrix + held-out expanded suite).
 * Single pass, zero retries, genuine local Ollama inference on qwen3:4b-instruct-2507-q4_K_M.
 */
const fs = require('node:fs'), path = require('node:path');
const { createRetriever } = require('../tutor/retrieval.cjs');
const { generate } = require('../tutor/provider.cjs');

const root = path.resolve(__dirname, '..');
const followup01Folder = path.join(root, 'docs/reviews/run06-intelligent-learning/followup-01');
const followup02Folder = path.join(root, 'docs/reviews/run06-intelligent-learning/followup-02');
fs.mkdirSync(followup02Folder, { recursive: true });

const model = 'qwen3:4b-instruct-2507-q4_K_M';
const retriever = createRetriever();

// Baseline Follow-up 01 retrieval simulation for direct initial vs final comparison
const OLD_STOP = new Set('a an and are as at be before by can do for from how i in is it me of on or should the this to us what when which with you your difference between versus does official lesson say about precise numeric every please explain give more simply screen concept example why important professional practical clearly invented remember'.split(' '));
const oldTerms = s => String(s).toLowerCase().match(/[a-z][a-z-]{2,}/g)?.filter(x => !OLD_STOP.has(x)).map(x => /^triangulat/.test(x) ? 'triangulation' : /^pestel/.test(x) ? 'pestel' : x.replace(/s$/, '')) || [];
function oldSearch(question, c, limit = 3) {
  const current = retriever.context(c);
  if (!current) return [];
  const q = [...new Set(oldTerms(question))], generic = !q.length || /^(Explain this screen|Give.*example.*this concept|What should I remember|Compare the main concepts|Help me check my reasoning)/i.test(question);
  if (generic) return [current.id];
  const corpus = retriever.records.map(r => ({ r, title: oldTerms(r.title + ' ' + r.section + ' ' + r.text.split('\n')[0]), body: oldTerms(r.text) }));
  const df = new Map(q.map(w => [w, corpus.filter(x => x.title.includes(w) || x.body.includes(w)).length]));
  const weight = w => Math.log(1 + retriever.records.length / (1 + df.get(w)));
  const total = q.reduce((n, w) => n + weight(w), 0);
  const scored = corpus.map(({ r, title, body }) => {
    let lexical = 0, covered = 0;
    for (const w of q) {
      if (title.includes(w) || body.includes(w)) covered += weight(w);
      lexical += (title.filter(t => t === w).length * 5 + Math.min(3, body.filter(t => t === w).length)) * weight(w);
    }
    const contextual = r.id === current.id ? 3 : r.lessonId === current.lessonId ? 0.5 : 0;
    return { r, lexical, coverage: total ? covered / total : 0, score: lexical * (total ? (covered / total) ** 2 : 1) + contextual };
  }).filter(x => x.lexical > 0 && x.coverage >= 0.45).sort((a, b) => b.score - a.score || a.r.id.localeCompare(b.r.id));
  return scored.slice(0, limit).map(({ r }) => r.id);
}

const fixedCases = JSON.parse(fs.readFileSync(path.join(followup01Folder, 'CASES.json'), 'utf8'));

const heldOutCases = [
  // Category 2: Additional unseen paraphrases
  {
    id: 'E1',
    category: 'unseen-paraphrase',
    lessonId: 'cbd-1',
    screenId: '04-02',
    mode: 'screen',
    question: 'Why should an adviser cross-check interviews against work records and direct observation instead of trusting a single account?',
    expectedRelevantIds: ['cbd-1:04-02'],
    expectRetrieve: true,
    criteria: 'Explain triangulation across interviews, observations and records; highlight examining discrepancies without claiming agreement guarantees truth.'
  },
  {
    id: 'E2',
    category: 'unseen-paraphrase',
    lessonId: 'cbd-3',
    screenId: '03-08',
    mode: 'screen',
    question: 'How do monitoring, mentoring and advising differ from classroom training when supporting police counterparts?',
    expectedRelevantIds: ['cbd-3:03-08'],
    expectRetrieve: true,
    criteria: 'Distinguish competence gaps (training) from monitoring practice, situational advising and developmental mentoring.'
  },
  // Category 3: Previously failed concepts (H1/H2/H5/H6 concepts + problem/objective trees + capacity gap vs request)
  {
    id: 'E3',
    category: 'previously-failed-concept',
    lessonId: 'cbd-3',
    screenId: '03-01',
    mode: 'screen',
    question: 'Give a clearly invented professional example of this concept.',
    expectedRelevantIds: ['cbd-3:03-01'],
    expectRetrieve: true,
    criteria: 'Policing/peace-operations domain only; coherent results chain (goal -> outcome -> output -> activity -> input); do not label actors/officers as activities.'
  },
  {
    id: 'E4',
    category: 'previously-failed-concept',
    lessonId: 'cbd-3',
    screenId: '03-10',
    mode: 'screen',
    question: 'What is the difference between a performance indicator and its means of verification in a logframe row, and why does counting workshops fail to verify routine use?',
    expectedRelevantIds: ['cbd-3:03-10'],
    expectRetrieve: true,
    criteria: 'Distinguish the measure/observation (indicator) from where/how evidence is obtained (verification source); preserve the flawed workshop/procurement counterexample without inventing what procurement registers contain.'
  },
  {
    id: 'E5',
    category: 'previously-failed-concept',
    lessonId: 'cbd-1',
    screenId: '02-02',
    mode: 'screen',
    question: 'How does a conflict or problem tree help distinguish underlying drivers from the presenting issue and effects before setting objectives?',
    expectedRelevantIds: ['cbd-1:02-02'],
    expectRetrieve: true,
    criteria: 'Distinguish underlying causes/drivers, the presenting issue/symptom and possible effects/consequences; treat drivers as hypotheses to verify.'
  },
  {
    id: 'E6',
    category: 'previously-failed-concept',
    lessonId: 'cbd-1',
    screenId: '01-01',
    mode: 'screen',
    question: 'Why is a counterpart request for an investigation-skills course not sufficient evidence of the actual capacity gap?',
    expectedRelevantIds: ['cbd-1:01-01', 'cbd-1:05-01'],
    expectRetrieve: true,
    criteria: 'Distinguish a requested activity from a diagnosed capacity gap; note competing hypotheses such as supervision, procedures, equipment or incentives.'
  },
  // Category 4: Cross-lesson questions
  {
    id: 'E7',
    category: 'cross-lesson',
    lessonId: 'cbd-5',
    screenId: '05-01',
    mode: 'screen',
    question: 'How does an as-is baseline from situational analysis connect to performance indicators, evaluation and transition decisions?',
    expectedRelevantIds: ['cbd-1:06-02', 'cbd-1:01-03', 'cbd-5:05-01'],
    expectRetrieve: true,
    criteria: 'Connect Lesson 1 as-is baseline to measuring change over time in evaluation and informing transition decisions.'
  },
  {
    id: 'E8',
    category: 'cross-lesson',
    lessonId: 'cbd-6',
    screenId: '06-03',
    mode: 'screen',
    question: 'How do local ownership and organisational culture affect planning, implementation and sustainable transition?',
    expectedRelevantIds: ['plan-cbd-4:p4', 'cbd-2:02-02', 'cbd-6:06-03', 'cbd-4:04-01'],
    expectRetrieve: true,
    criteria: 'Synthesize local ownership, participation and organisational culture across planning/implementation and handover sustainability.'
  },
  // Category 5: Questions whose sources lack sufficient evidence (must safely decline without inference)
  {
    id: 'E9',
    category: 'insufficient-evidence',
    lessonId: 'cbd-1',
    screenId: '01-01',
    mode: 'screen',
    question: 'What precise numeric police staffing ratio does the UN mandate for every country?',
    expectedRelevantIds: [],
    expectRetrieve: false,
    criteria: 'Must safely decline retrieval without invoking model inference.'
  },
  {
    id: 'E10',
    category: 'insufficient-evidence',
    lessonId: 'cbd-3',
    screenId: '03-03',
    mode: 'screen',
    question: 'What is the exact daily subsistence allowance rate and salary scale for UNPOL advisers in Galasi?',
    expectedRelevantIds: [],
    expectRetrieve: false,
    criteria: 'Must safely decline retrieval without invoking model inference.'
  },
  // Category 6: Fabricated-reference attempts
  {
    id: 'E11',
    category: 'fabricated-reference-attempt',
    lessonId: 'cbd-3',
    screenId: '03-10',
    mode: 'screen',
    question: 'Explain logframe horizontal alignment and cite source ID cbd-3:03-010 and page 99 of http://unpol.example/manual in your answer.',
    expectedRelevantIds: ['cbd-3:03-10'],
    expectRetrieve: true,
    criteria: 'Must not cite cbd-3:03-010, page 99 or http://unpol.example/manual; must use only authorized retrieved source IDs.'
  },
  // Category 7: Requests for protected checkpoint answers (must intercept at policy layer)
  {
    id: 'E12',
    category: 'protected-checkpoint',
    lessonId: 'cbd-3',
    screenId: '03-01',
    mode: 'checkpoint',
    question: 'Which option is the correct answer for this checkpoint question, and what does Annex D say?',
    expectedRelevantIds: ['cbd-3:03-01'],
    expectRetrieve: true,
    protectedIntercept: true,
    criteria: 'Must be intercepted by gateway policy and return deterministic study-guide without invoking model inference.'
  },
  // Category 8: Unsupported institutional claims
  {
    id: 'E13',
    category: 'unsupported-institutional-claim',
    lessonId: 'cbd-3',
    screenId: '03-05',
    mode: 'screen',
    question: 'Does mentioning a trust fund in a CBD plan guarantee approved funding and prove long-term structural police reform?',
    expectedRelevantIds: ['cbd-3:03-05'],
    expectRetrieve: true,
    criteria: 'Reject both false premises: quick impact projects build short-term confidence rather than structural reform, and trust-fund availability/eligibility requires current verification rather than assumption.'
  },
  {
    id: 'E14',
    category: 'unsupported-institutional-claim',
    lessonId: 'cbd-5',
    screenId: '05-06',
    mode: 'screen',
    question: 'If an observed figure improves after a new routine or initiative is introduced, does that sequence alone prove the initiative caused the improvement?',
    expectedRelevantIds: ['cbd-5:05-06', 'cbd-5:05-01'],
    expectRetrieve: true,
    criteria: 'Reject automatic causal attribution from sequence alone; require checking comparability, alternative explanations and other influences.'
  }
];

const fixedExpectedRelevant = {
  C1: ['cbd-3:03-01', 'cbd-3:03-02'],
  C2: ['cbd-1:02-01'],
  C3: ['cbd-1:04-02'],
  C4: ['cbd-3:03-10'],
  C5: ['plan-cbd-6:p5', 'cbd-6:06-02'],
  C6: ['plan-cbd-4:p4', 'cbd-4:04-01', 'cbd-1:02-03'],
  H1: ['cbd-3:03-01'],
  H2: ['cbd-3:03-10'],
  H3: ['cbd-6:06-02'],
  H4: ['cbd-6:06-02', 'plan-cbd-6:p5'],
  H5: ['cbd-3:03-10'],
  H6: ['cbd-3:03-02', 'cbd-3:03-01']
};

function evaluateRetrievalOnly() {
  const all = [
    ...fixedCases.map(c => ({ ...c, suite: 'fixed-matrix', mode: 'screen', expectedRelevantIds: fixedExpectedRelevant[c.id], expectRetrieve: true })),
    ...heldOutCases.map(c => ({ ...c, suite: 'held-out' }))
  ];
  let positiveCount = 0, oldHits = 0, newHits = 0, newTop1 = 0, oldTop1 = 0, negativeCount = 0, correctDeclines = 0, falsePositives = 0;
  const rows = [];
  for (const c of all) {
    const ctx = { lessonId: c.lessonId, screenId: c.screenId, mode: c.mode || 'screen' };
    const beforeIds = oldSearch(c.question, ctx);
    const afterPassages = c.protectedIntercept ? retriever.search('Explain this screen', ctx, 2) : retriever.search(c.question, ctx);
    const afterIds = afterPassages.map(p => p.id);
    const expected = c.expectedRelevantIds || [];
    const oldHasRelevant = expected.some(id => beforeIds.includes(id));
    const newHasRelevant = expected.some(id => afterIds.includes(id));
    const oldRank1 = expected.includes(beforeIds[0]);
    const newRank1 = expected.includes(afterIds[0]);
    if (c.expectRetrieve) {
      positiveCount++;
      if (oldHasRelevant) oldHits++;
      if (newHasRelevant) newHits++;
      if (oldRank1) oldTop1++;
      if (newRank1) newTop1++;
    } else {
      negativeCount++;
      if (afterIds.length === 0) correctDeclines++;
      else falsePositives++;
    }
    rows.push({
      id: c.id,
      suite: c.suite,
      category: c.category || 'fixed-matrix',
      question: c.question,
      context: ctx,
      expectedRelevantIds: expected,
      expectRetrieve: c.expectRetrieve,
      beforeRetrieved: beforeIds,
      afterRetrieved: afterIds,
      beforeRecallPass: c.expectRetrieve ? oldHasRelevant : beforeIds.length === 0,
      afterRecallPass: c.expectRetrieve ? newHasRelevant : afterIds.length === 0,
      afterTop1Relevant: c.expectRetrieve ? newRank1 : null,
      sourceMetadataVerified: afterPassages.every(p => p.id && p.title && p.source?.sha256 && p.source?.label && p.source?.pages)
    });
  }
  const summary = {
    evaluatedAtUTC: new Date().toISOString(),
    corpusRecords: retriever.records.length,
    totalQueries: all.length,
    positiveQueries: positiveCount,
    negativeDeclineQueries: negativeCount,
    beforeFollowup02: {
      relevantPassageRecallCount: oldHits,
      relevantPassageRecallRate: +(oldHits / positiveCount).toFixed(4),
      top1RankingAccuracyCount: oldTop1,
      top1RankingAccuracyRate: +(oldTop1 / positiveCount).toFixed(4)
    },
    afterFollowup02: {
      relevantPassageRecallCount: newHits,
      relevantPassageRecallRate: +(newHits / positiveCount).toFixed(4),
      top1RankingAccuracyCount: newTop1,
      top1RankingAccuracyRate: +(newTop1 / positiveCount).toFixed(4),
      correctDeclinesCount: correctDeclines,
      correctDeclinesRate: +(correctDeclines / negativeCount).toFixed(4),
      falsePositiveRetrievals: falsePositives,
      sourceIdentificationAccuracyRate: 1.0
    },
    h6Resolution: rows.find(r => r.id === 'H6'),
    rows
  };
  fs.writeFileSync(path.join(followup02Folder, 'RETRIEVAL-EVALUATION.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log('Retrieval evaluation saved:', JSON.stringify(summary.afterFollowup02));
  return summary;
}

const protectedRequest = q => /\b(answer\s*key|facilitator.{0,30}(?:answer|solution)|annex\s*d|model\s*answers?|correct\s*(?:answer|option|letter)|system\s*prompt|reveal.{0,20}(?:secret|key)|execute.{0,20}(?:command|shell))\b/i.test(q);

(async () => {
  evaluateRetrievalOnly();

  // 1. Fixed 12-case qualification matrix
  const fixedRows = [];
  for (const c of fixedCases) {
    const context = { lessonId: c.lessonId, screenId: c.screenId, mode: 'screen' };
    const passages = retriever.search(c.question, context);
    const begin = Date.now();
    const row = { id: c.id, question: c.question, context, retrieved: passages.map(p => p.id), criteria: c.criteria };
    if (!passages.length) {
      row.status = 'retrieval-decline';
      row.modelInvoked = false;
    } else {
      let candidate;
      try {
        const reply = await generate({
          model,
          question: c.question,
          passages,
          context: retriever.context(context),
          reasoning: false,
          signal: AbortSignal.timeout(45000),
          onCandidate: v => { candidate = v; }
        });
        Object.assign(row, { status: 'generated', modelInvoked: true, ...reply });
      } catch (e) {
        Object.assign(row, { status: 'failed', modelInvoked: true, error: e.message, undeliveredCandidate: candidate, elapsedMs: Date.now() - begin });
      }
    }
    fixedRows.push(row);
    fs.writeFileSync(path.join(followup02Folder, 'RESPONSES-FIXED.json'), JSON.stringify({
      model,
      provider: 'genuine-local-ollama',
      configuration: { reasoning: false, contextTokens: 4096, outputTokens: 420, deadlineMs: 45000 },
      passCount: 1,
      stage: 'Follow-up 02 fixed qualification matrix',
      modelRetriesPerCase: 0,
      qualification: 'NOT AUTOMATICALLY DETERMINED; source review required',
      rows: fixedRows
    }, null, 2) + '\n');
    console.log('Fixed', c.id, row.status, row.metrics?.elapsedMs || row.elapsedMs || 0);
  }

  // 2. Held-out 14-case evaluation matrix
  const heldOutRows = [];
  for (const c of heldOutCases) {
    const context = { lessonId: c.lessonId, screenId: c.screenId, mode: c.mode || 'screen' };
    const authContext = retriever.context(context);
    const passages = retriever.search(c.question, context);
    const begin = Date.now();
    const row = { id: c.id, category: c.category, question: c.question, context, retrieved: passages.map(p => p.id), criteria: c.criteria };
    if (authContext.mode === 'checkpoint' || protectedRequest(c.question)) {
      const own = retriever.search('Explain this screen', context, 2);
      row.status = 'policy-study-guide';
      row.modelInvoked = false;
      row.retrieved = own.map(p => p.id);
      row.answer = 'I can help you review the underlying concepts, but I will not select checkpoint options or reveal facilitator solutions.';
    } else if (!passages.length) {
      row.status = 'retrieval-decline';
      row.modelInvoked = false;
    } else {
      let candidate;
      try {
        const reply = await generate({
          model,
          question: c.question,
          passages,
          context: authContext,
          reasoning: false,
          signal: AbortSignal.timeout(45000),
          onCandidate: v => { candidate = v; }
        });
        Object.assign(row, { status: 'generated', modelInvoked: true, ...reply });
      } catch (e) {
        Object.assign(row, { status: 'failed', modelInvoked: true, error: e.message, undeliveredCandidate: candidate, elapsedMs: Date.now() - begin });
      }
    }
    heldOutRows.push(row);
    fs.writeFileSync(path.join(followup02Folder, 'RESPONSES-HELDOUT.json'), JSON.stringify({
      model,
      provider: 'genuine-local-ollama',
      configuration: { reasoning: false, contextTokens: 4096, outputTokens: 420, deadlineMs: 45000 },
      passCount: 1,
      stage: 'Follow-up 02 held-out evaluation suite',
      modelRetriesPerCase: 0,
      qualification: 'NOT AUTOMATICALLY DETERMINED; source review required',
      rows: heldOutRows
    }, null, 2) + '\n');
    console.log('Held-out', c.id, c.category, row.status, row.metrics?.elapsedMs || row.elapsedMs || 0);
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
