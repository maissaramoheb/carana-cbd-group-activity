#!/usr/bin/env node
'use strict';
/* Builds unified Run 07 Evaluation Matrix JSON & interactive HTML Review Workbench
 * from all observed eval-*.json and concurrency-*.json artifacts without modifying Follow-up 01-06.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs/reviews/run07-ai-excellence');

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(OUT_DIR).filter(f => f.startsWith('eval-') && f.endsWith('.json')).sort();
  if (!files.length) throw Error('No eval-*.json files found in ' + OUT_DIR);

  const evals = files.map(f => JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), 'utf8')));
  const concurrencyByModel = {};
  for (const f of fs.readdirSync(OUT_DIR).filter(f => f.startsWith('concurrency-') && f.endsWith('.json')).sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), 'utf8'));
    concurrencyByModel[data.model] = data;
  }

  const phaseB = readJsonIfExists(path.join(OUT_DIR, 'phase-b-baseline.json'));
  const f05Summary = readJsonIfExists(path.join(ROOT, 'docs/reviews/run06-intelligent-learning/followup-05/MODEL_COMPARISON_SUMMARY.json'));
  const f06Conc = readJsonIfExists(path.join(ROOT, 'docs/reviews/run06-intelligent-learning/followup-06/CONCURRENCY_BENCHMARK.json'));

  const comparison = evals.map(e => ({
    model: e.model,
    evaluatedAtUTC: e.evaluatedAtUTC,
    totalCases: e.totalCases,
    overallFirstPassCount: e.overallFirstPassCount,
    overallFirstPassRate: e.overallFirstPassRate,
    overallFinalPassCount: e.overallFinalPassCount,
    overallFinalPassRate: e.overallFinalPassRate,
    falseRefusalsCount: e.falseRefusalsCount,
    falsePositiveOodCount: e.falsePositiveOodCount,
    repairedCount: e.repairedCount,
    failedAfterRepairCount: e.failedAfterRepairCount,
    midRunReloads: e.midRunReloads,
    coldStart: e.coldStart,
    warmAnswerReadyLatency: e.warmAnswerReadyLatency,
    warmTotalLatency: e.warmTotalLatency,
    memory: e.memory,
    ollamaPs: e.ollamaPs,
    bySuite: e.bySuite,
    concurrency: concurrencyByModel[e.model] || null
  }));

  const primary = evals[0];
  const mergedCases = primary.rows.map((baseRow, idx) => {
    const runs = {};
    for (const e of evals) {
      const r = e.rows[idx];
      if (r) {
        runs[e.model] = {
          status: r.status,
          firstPassOk: r.firstPassOk,
          finalOk: r.finalOk,
          repaired: !!r.repaired,
          answerReadyMs: r.answerReadyMs || null,
          totalMs: r.totalMs,
          loadMs: r.loadMs || 0,
          tokens: r.tokens || 0,
          answer: r.answer || '',
          example: r.example || '',
          uncertainty: r.uncertainty || '',
          sources: r.sources || [],
          retrieved: r.retrieved || [],
          note: r.note || r.error || ''
        };
      }
    }
    return {
      id: baseRow.id,
      suite: baseRow.suite,
      group: baseRow.group,
      question: baseRow.question,
      context: baseRow.context,
      expectRetrieve: baseRow.expectRetrieve,
      protectedIntercept: baseRow.protectedIntercept,
      runs
    };
  });

  const matrix = {
    generatedAtUTC: new Date().toISOString(),
    modelsEvaluated: comparison.map(c => c.model),
    phaseBBaselineRef: phaseB ? { evaluatedAtUTC: phaseB.measuredAt || phaseB.evaluatedAtUTC || phaseB.generatedAt || null, models: Array.isArray(phaseB.models) ? phaseB.models.map(x => x.model || x.id).filter(Boolean) : Object.keys(phaseB.models || {}) } : null,
    followup05Ref: f05Summary ? f05Summary.evaluatedAtUTC : null,
    followup06ConcurrencyRef: f06Conc ? { model: f06Conc.model, coldMs: f06Conc.scenarios?.coldStart?.totalMs, seqMedianMs: f06Conc.scenarios?.sequential5?.latencySummary?.medianMs } : null,
    comparison,
    cases: mergedCases
  };

  const matrixPath = path.join(OUT_DIR, 'EVALUATION_MATRIX.json');
  fs.writeFileSync(matrixPath, JSON.stringify(matrix, null, 2) + '\n');

  const safeJson = JSON.stringify({ comparison, cases: mergedCases }).replace(/</g, '\\u003c');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>CARANA Run 07 — 135-Case Quality, Latency &amp; Expert Review Workbench</title>
<style>
  :root { color-scheme: light; font-family: system-ui, -apple-system, sans-serif; }
  body { margin: 0; background: #f4f6f9; color: #162231; line-height: 1.5; }
  header { background: #102a43; color: #fff; padding: 20px 24px; border-bottom: 4px solid #1b7fa3; }
  header h1 { margin: 0 0 6px; font-size: 1.35rem; }
  header p { margin: 0; color: #d9e2ec; font-size: 0.92rem; }
  .toolbar { position: sticky; top: 0; z-index: 10; background: #fff; border-bottom: 1px solid #d9e2ec; padding: 12px 24px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; }
  .filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  select, button { font: inherit; padding: 7px 11px; border-radius: 6px; border: 1px solid #bcccdc; background: #fff; color: #102a43; }
  button.primary { background: #102a43; color: #fff; border-color: #102a43; cursor: pointer; font-weight: 600; }
  button.secondary { background: #f0f4f8; cursor: pointer; }
  .stats { display: flex; flex-wrap: wrap; gap: 10px; padding: 14px 24px 0; max-width: 1320px; margin: 0 auto; }
  .stat { background: #fff; border: 1px solid #d9e2ec; border-radius: 8px; padding: 10px 14px; font-size: 0.86rem; }
  .stat strong { display: block; font-size: 1.08rem; color: #102a43; }
  main { padding: 16px 24px 48px; display: grid; gap: 14px; max-width: 1320px; margin: 0 auto; }
  .card { background: #fff; border: 1px solid #d9e2ec; border-radius: 10px; padding: 16px 18px; }
  .card-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; border-bottom: 1px solid #eef2f6; padding-bottom: 8px; margin-bottom: 10px; }
  .badges { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .badge { font-size: 0.78rem; padding: 3px 8px; border-radius: 99px; font-weight: 600; background: #e6f0fa; color: #102a43; }
  .badge.ok { background: #e6ffed; color: #146c2e; }
  .badge.fail { background: #ffe3e3; color: #9b1c1c; }
  .badge.warn { background: #fff4db; color: #8c5a00; }
  .question { font-weight: 600; font-size: 1rem; margin: 0 0 8px; }
  .pane { border: 1px solid #e1e8f0; border-radius: 8px; padding: 12px; background: #fafcff; margin-top: 8px; }
  .review-bar { margin-top: 10px; padding-top: 10px; border-top: 1px solid #eef2f6; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .review-bar textarea { flex: 1 1 300px; font: inherit; font-size: 0.86rem; padding: 6px 9px; border: 1px solid #bcccdc; border-radius: 6px; min-height: 38px; }
  .rate-btn[aria-pressed="true"].approve { background: #146c2e; color: #fff; border-color: #146c2e; }
  .rate-btn[aria-pressed="true"].improve { background: #b45309; color: #fff; border-color: #b45309; }
  .rate-btn[aria-pressed="true"].reject { background: #9b1c1c; color: #fff; border-color: #9b1c1c; }
</style>
</head>
<body>
<header>
  <h1>CARANA Run 07 — 135-Case Quality, Performance &amp; Expert Review Workbench</h1>
  <p>Evaluates Follow-up 05 (42), Follow-up 06 (28), and Run 07 (65) = 135 cases · Automated technical checks remain distinct from human pedagogical judgement.</p>
</header>
<div class="toolbar">
  <div class="filters">
    <label>Model <select id="flt-model"></select></label>
    <label>Suite <select id="flt-suite"><option value="">All 135 Cases</option><option value="F05">F05 (42)</option><option value="F06">F06 (28)</option><option value="RUN07">Run 07 (65)</option></select></label>
    <label>Outcome <select id="flt-outcome"><option value="">All</option><option value="first">First-Pass OK</option><option value="repaired">Repaired OK</option><option value="fail">Failed</option></select></label>
    <label>SME Rating <select id="flt-rating"><option value="">All</option><option value="unrated">Unrated</option><option value="approve">Approve</option><option value="improve">Needs Improvement</option><option value="reject">Reject</option></select></label>
  </div>
  <div class="filters">
    <button type="button" class="primary" id="btn-export-json">Export SME Ratings JSON</button>
  </div>
</div>
<div class="stats" id="stats-bar"></div>
<main id="cards"></main>
<script>
const DATA = ${safeJson};
const KEY = 'carana-run07-sme-reviews-v1';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) {}
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (_) {} };
const modelSel = document.getElementById('flt-model');
for (const c of DATA.comparison) {
  const o = document.createElement('option');
  o.value = c.model; o.textContent = c.model;
  modelSel.appendChild(o);
}
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
function render() {
  const m = modelSel.value;
  const comp = DATA.comparison.find(c => c.model === m) || DATA.comparison[0];
  const bar = document.getElementById('stats-bar');
  bar.textContent = '';
  const items = [
    ['Cases', comp.totalCases],
    ['1st-Pass Contract', comp.overallFirstPassCount + '/' + comp.totalCases + ' (' + (comp.overallFirstPassRate * 100).toFixed(1) + '%)'],
    ['Final Contract', comp.overallFinalPassCount + '/' + comp.totalCases + ' (' + (comp.overallFinalPassRate * 100).toFixed(1) + '%)'],
    ['False Refusals', comp.falseRefusalsCount],
    ['Warm Median Ans', (comp.warmAnswerReadyLatency?.medianMs || 0) + ' ms'],
    ['Warm Median Total', (comp.warmTotalLatency?.medianMs || 0) + ' ms'],
    ['Warm P90 Total', (comp.warmTotalLatency?.p90Ms || 0) + ' ms'],
    ['Min Reclaimable RAM', (comp.memory?.minReclaimableAvailGB ?? '-') + ' GB']
  ];
  for (const [k, v] of items) {
    const b = el('div', 'stat'); b.appendChild(el('strong', '', String(v))); b.appendChild(document.createTextNode(k)); bar.appendChild(b);
  }
  const suite = document.getElementById('flt-suite').value;
  const outF = document.getElementById('flt-outcome').value;
  const ratF = document.getElementById('flt-rating').value;
  const cards = document.getElementById('cards');
  cards.textContent = '';
  for (const c of DATA.cases) {
    const r = c.runs[m]; if (!r) continue;
    if (suite && c.suite !== suite) continue;
    if (outF === 'first' && !r.firstPassOk) continue;
    if (outF === 'repaired' && !r.repaired) continue;
    if (outF === 'fail' && r.finalOk) continue;
    const ratKey = m + '::' + c.id;
    const cur = (saved[ratKey] && saved[ratKey].rating) || 'unrated';
    if (ratF && cur !== ratF) continue;
    const card = el('article', 'card');
    const head = el('div', 'card-head');
    const badges = el('div', 'badges');
    badges.appendChild(el('span', 'badge', c.suite + ' · ' + c.id + ' · ' + c.group));
    badges.appendChild(el('span', 'badge ' + (r.finalOk ? 'ok' : 'fail'), (r.firstPassOk ? '1st-Pass OK' : r.finalOk ? 'Repaired OK' : 'Fail') + ' · ' + r.status));
    if (r.answerReadyMs) badges.appendChild(el('span', 'badge warn', 'Ans ' + r.answerReadyMs + 'ms / Total ' + r.totalMs + 'ms'));
    else badges.appendChild(el('span', 'badge warn', r.totalMs + 'ms'));
    head.appendChild(badges);
    card.appendChild(head);
    card.appendChild(el('p', 'question', c.question));
    const pane = el('div', 'pane');
    pane.appendChild(el('p', '', r.answer || r.note || ('(' + r.status + ')')));
    if (r.example) pane.appendChild(el('p', '', 'Example: ' + r.example));
    if (r.uncertainty) pane.appendChild(el('p', '', 'Limits: ' + r.uncertainty));
    pane.appendChild(el('p', '', 'Sources: ' + (r.sources.map(s => s.id).join(', ') || 'none') + ' | Retrieved: ' + (r.retrieved.join(', ') || 'none')));
    card.appendChild(pane);
    const rb = el('div', 'review-bar');
    for (const [val, lbl] of [['approve', 'Approve'], ['improve', 'Needs Improvement'], ['reject', 'Reject']]) {
      const btn = el('button', 'rate-btn ' + val, lbl);
      btn.type = 'button';
      btn.setAttribute('aria-pressed', cur === val ? 'true' : 'false');
      btn.onclick = () => {
        saved[ratKey] = saved[ratKey] || { rating: '', note: '' };
        saved[ratKey].rating = saved[ratKey].rating === val ? '' : val;
        persist(); render();
      };
      rb.appendChild(btn);
    }
    const ta = el('textarea');
    ta.placeholder = 'Optional SME reviewer note (stored locally only)...';
    ta.value = (saved[ratKey] && saved[ratKey].note) || '';
    ta.onchange = () => { saved[ratKey] = saved[ratKey] || { rating: '', note: '' }; saved[ratKey].note = ta.value; persist(); };
    rb.appendChild(ta);
    card.appendChild(rb);
    cards.appendChild(card);
  }
}
for (const id of ['flt-model', 'flt-suite', 'flt-outcome', 'flt-rating']) document.getElementById(id).onchange = render;
document.getElementById('btn-export-json').onclick = () => {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ratings: saved }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'carana-run07-sme-ratings.json'; a.click();
};
render();
</script>
</body>
</html>`;

  const htmlPath = path.join(OUT_DIR, 'review-workbench.html');
  fs.writeFileSync(htmlPath, html);
  console.log('Generated:', matrixPath);
  console.log('Generated:', htmlPath);
}

main();
