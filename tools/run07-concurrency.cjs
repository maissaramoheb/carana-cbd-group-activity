#!/usr/bin/env node
'use strict';
/* Run 07 Concurrency, Early-Streaming Latency & Simultaneous Kokoro TTS Stress Benchmark.
 * Exercises full createHandler -> retrieval -> generate -> Kokoro persistent daemon -> memoryCheck.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { createAuthStore } = require('../tutor/auth-store.cjs');
const { createHandler, defaultMemoryCheck } = require('../tutor/gateway.cjs');
const { unloadModel } = require('../tutor/provider.cjs');
const { createLocalTts } = require('../tutor/tts.cjs');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs/reviews/run07-ai-excellence');

const PROMPTS = [
  { lessonId: 'cbd-1', screenId: '02-01', mode: 'screen', question: 'Explain all seven PESTEL-S dimensions concisely with a policing example.' },
  { lessonId: 'cbd-3', screenId: '03-02', mode: 'screen', question: 'What is the difference between outputs and outcomes?' },
  { lessonId: 'cbd-4', screenId: '04-02', mode: 'screen', question: 'what is 7 cs for talk with local police chief' },
  { lessonId: 'cbd-3', screenId: '03-10', mode: 'screen', question: 'Can a procurement register verify whether officers actually use a review routine?' },
  { lessonId: 'cbd-5', screenId: '05-02', mode: 'screen', question: 'What does Lesson 5 say about balancing evaluation credibility, impartiality and stakeholder participation?' },
  { lessonId: 'cbd-6', screenId: '06-05', mode: 'screen', question: 'How should advisers structure phased responsibility and post-handover fallback support?' }
];

function statsFor(nums) {
  if (!nums.length) return { count: 0, minMs: 0, medianMs: 0, meanMs: 0, p95Ms: 0, maxMs: 0 };
  const s = [...nums].sort((a, b) => a - b);
  return {
    count: s.length,
    minMs: s[0],
    medianMs: s[Math.floor(s.length / 2)],
    meanMs: Math.round(s.reduce((a, b) => a + b, 0) / s.length),
    p95Ms: s[Math.min(s.length - 1, Math.floor(s.length * 0.95))],
    maxMs: s[s.length - 1]
  };
}

async function sendNdjson(baseUrl, token, proxySecret, item) {
  const t0 = Date.now();
  let firstStageMs = null;
  let answerSegmentMs = null;
  const res = await fetch(baseUrl + '/api/tutor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
      'X-CARANA-Proxy-Secret': proxySecret,
      'X-CARANA-Forwarded-Origin': 'https://e-learning.maissara.tech'
    },
    body: JSON.stringify({ question: item.question, context: { lessonId: item.lessonId, screenId: item.screenId, mode: item.mode } }),
    signal: AbortSignal.timeout(150000)
  });

  if (res.status !== 200) {
    let err = {};
    try { err = await res.json(); } catch (_) {}
    return { status: res.status, code: err.code || '', message: err.message || '', totalMs: Date.now() - t0 };
  }

  let buf = '';
  const events = [];
  const dec = new TextDecoder();
  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      const ev = JSON.parse(line);
      const elapsed = Date.now() - t0;
      if (ev.type === 'stage' && firstStageMs === null) firstStageMs = elapsed;
      if (ev.type === 'segment' && ev.segment === 'answer' && answerSegmentMs === null) answerSegmentMs = elapsed;
      events.push(ev);
    }
  }
  const totalMs = Date.now() - t0;
  const done = events.find(e => e.type === 'done') || {};
  const errEv = events.find(e => e.type === 'error');
  const fullText = events.filter(e => (e.type === 'segment' || e.type === 'content') && typeof e.text === 'string').map(e => e.text).join('');
  return {
    status: res.status,
    ok: !errEv && done.kind === 'ai' && fullText.length > 0,
    firstStageMs,
    answerSegmentMs: answerSegmentMs || totalMs,
    totalMs,
    queuedPositions: events.filter(e => e.type === 'queued').map(e => e.position),
    sawStarted: events.some(e => e.type === 'started'),
    sourcesCount: Array.isArray(done.sources) ? done.sources.length : 0,
    answerChars: fullText.length
  };
}

async function sendTts(baseUrl, token, proxySecret, text) {
  const t0 = Date.now();
  const res = await fetch(baseUrl + '/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
      'X-CARANA-Proxy-Secret': proxySecret,
      'X-CARANA-Forwarded-Origin': 'https://e-learning.maissara.tech'
    },
    body: JSON.stringify({ text, voice: 'kokoro:af_heart' }),
    signal: AbortSignal.timeout(50000)
  });
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    status: res.status,
    ms: Date.now() - t0,
    engine: res.headers.get('x-carana-tts-engine'),
    bytes: buf.length,
    isRiff: buf.subarray(0, 4).toString() === 'RIFF'
  };
}

(async () => {
  const args = process.argv.slice(2);
  const mIdx = args.indexOf('--model');
  const model = mIdx >= 0 && args[mIdx + 1] ? args[mIdx + 1] : 'carana-gemma4-text';
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'carana-r07-conc-'));
  let handler, server;
  try {
    await unloadModel(model);
    await unloadModel('gemma4:26b');
    const idleMem = defaultMemoryCheck();

    const store = createAuthStore(path.join(tmpDir, 'users.json'));
    const owner = store.upsertUser({ userId: 'bench-owner', displayName: 'Bench', role: 'owner', rateLimitPerMin: 60 });
    const proxySecret = crypto.randomBytes(16).toString('hex');
    const tts = createLocalTts();

    handler = createHandler({
      userStore: store,
      origins: ['https://e-learning.maissara.tech'],
      proxySecret,
      model,
      qualification: 'run07-benchmark',
      timeoutMs: 90000,
      queueTimeoutMs: 120000,
      maxQueue: 4,
      rate: 60,
      idleUnloadMs: 8000,
      tts
    });
    server = http.createServer(handler);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const baseUrl = 'http://127.0.0.1:' + server.address().port;

    console.log('1/5 Cold AI + Cold Kokoro TTS overlap check...');
    const coldAi = await sendNdjson(baseUrl, owner.token, proxySecret, PROMPTS[0]);
    const coldTts = await sendTts(baseUrl, owner.token, proxySecret, 'PESTEL-S checks Political, Economic, Social, Technological, Environmental, Legal, and Security factors.');
    const warmTtsWithModel = await sendTts(baseUrl, owner.token, proxySecret, 'Outputs are deliverables; outcomes reflect real operational change.');
    const memWithBoth = defaultMemoryCheck();
    console.log('  Cold AI:', coldAi);
    console.log('  Cold TTS (with model loaded):', coldTts);
    console.log('  Warm TTS (with model loaded):', warmTtsWithModel, 'mem:', memWithBoth);

    console.log('2/5 Concurrent AI + Warm Kokoro TTS simultaneous check...');
    const [simulAi, simulTts] = await Promise.all([
      sendNdjson(baseUrl, owner.token, proxySecret, PROMPTS[1]),
      sendTts(baseUrl, owner.token, proxySecret, 'Compare interviews with physical custody logs and observation.')
    ]);
    console.log('  Simultaneous AI:', simulAi, '| TTS:', simulTts);

    console.log('3/5 Two concurrent AI requests...');
    const conc2 = await Promise.all([
      sendNdjson(baseUrl, owner.token, proxySecret, PROMPTS[2]),
      sendNdjson(baseUrl, owner.token, proxySecret, PROMPTS[3])
    ]);
    console.log('  2-Concurrent:', conc2);

    console.log('4/5 Six-request Overload Burst (1 active + 4 queued + 1 OVERLOAD 503)...');
    const tBurst = Date.now();
    const burst6 = await Promise.all(PROMPTS.map(p => sendNdjson(baseUrl, owner.token, proxySecret, p)));
    const burstWallMs = Date.now() - tBurst;
    console.log('  Burst6 wall=' + burstWallMs + 'ms ok=' + burst6.filter(r => r.ok).length + ' rejected503=' + burst6.filter(r => r.status === 503).length);

    console.log('5/5 Idle 10s unload + ollama ps...');
    await new Promise(r => setTimeout(r, 10500));
    const finalMem = defaultMemoryCheck();
    let ps = '';
    try { ps = execFileSync('ollama', ['ps'], { encoding: 'utf8' }).trim(); } catch (_) {}

    const report = {
      generatedAt: new Date().toISOString(),
      model,
      idleMem,
      memWithModelAndKokoro: memWithBoth,
      coldAi,
      coldTtsWithModel: coldTts,
      warmTtsWithModel,
      simultaneousAiAndTts: { ai: simulAi, tts: simulTts },
      concurrent2: { summaryTotal: statsFor(conc2.filter(x => x.ok).map(x => x.totalMs)), summaryAns: statsFor(conc2.filter(x => x.ok).map(x => x.answerSegmentMs)), rows: conc2 },
      burst6: { wallMs: burstWallMs, completed: burst6.filter(x => x.ok).length, rejected503: burst6.filter(x => x.status === 503).length, rows: burst6 },
      afterIdleUnloadMem: finalMem,
      ollamaPsAfterIdle: ps
    };
    const safeName = model.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const outPath = path.join(OUT_DIR, `concurrency-${safeName}.json`);
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
    console.log('Saved concurrency report ->', outPath);
  } finally {
    if (handler) await handler.shutdown({ unload: true });
    if (server) await new Promise(r => server.close(r));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
})();
