#!/usr/bin/env node
/* Live concurrency, cold-start, queue, overload, memory pressure, and idle-unload benchmark
 * against genuine local Ollama (gemma4:26b) through tutor/gateway.cjs.
 */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { createHandler, defaultMemoryCheck } = require('../tutor/gateway.cjs');
const { createAuthStore } = require('../tutor/auth-store.cjs');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'reviews', 'run06-intelligent-learning', 'followup-06');
const OUT_PATH = path.join(OUT_DIR, 'CONCURRENCY_BENCHMARK.json');
const MODEL = process.env.CARANA_MODEL || 'gemma4:26b';

const PROMPTS = [
  { lessonId: 'cbd-1', screenId: '01-01', mode: 'screen', question: 'Why is situational analysis necessary before designing support?' },
  { lessonId: 'cbd-1', screenId: '02-01', mode: 'screen', question: 'Explain PESTEL-S with a policing example.' },
  { lessonId: 'cbd-1', screenId: '02-02', mode: 'screen', question: 'Why distinguish symptoms from underlying root causes?' },
  { lessonId: 'cbd-3', screenId: '03-02', mode: 'screen', question: 'What is the difference between outputs and outcomes?' },
  { lessonId: 'cbd-3', screenId: '03-10', mode: 'screen', question: 'Why does a logframe indicator require a means of verification?' },
  { lessonId: 'cbd-4', screenId: '04-01', mode: 'screen', question: 'Why should an adviser avoid importing a policing solution unchanged?' }
];

function ollamaStop(model = MODEL) {
  const ollama = fs.existsSync('/usr/local/bin/ollama') ? '/usr/local/bin/ollama' : 'ollama';
  try { execFileSync(ollama, ['stop', model], { timeout: 10000, stdio: 'ignore' }); } catch (_) {}
}

function ollamaPs() {
  const ollama = fs.existsSync('/usr/local/bin/ollama') ? '/usr/local/bin/ollama' : 'ollama';
  try {
    const out = execFileSync(ollama, ['ps'], { encoding: 'utf8', timeout: 5000 }).trim();
    const lines = out.split('\n').slice(1).filter(Boolean);
    return lines;
  } catch (_) {
    return [];
  }
}

function snapshotHost() {
  return {
    ts: new Date().toISOString(),
    memory: defaultMemoryCheck(),
    ollamaPs: ollamaPs()
  };
}

function statsFor(arr) {
  if (!arr.length) return { count: 0, minMs: 0, medianMs: 0, p95Ms: 0, maxMs: 0, avgMs: 0 };
  const s = [...arr].sort((a, b) => a - b);
  const sum = s.reduce((a, b) => a + b, 0);
  const mid = Math.floor(s.length / 2);
  const median = s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
  const p95 = s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
  return {
    count: s.length,
    minMs: s[0],
    medianMs: median,
    p95Ms: p95,
    maxMs: s[s.length - 1],
    avgMs: Math.round(sum / s.length)
  };
}

async function sendNdjsonRequest(baseUrl, token, proxySecret, item) {
  const startedAt = Date.now();
  const res = await fetch(baseUrl + '/api/tutor', {
    method: 'POST',
    headers: {
      Origin: 'https://carana-cbd-elearning.vercel.app',
      'X-CARANA-Proxy-Secret': proxySecret,
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question: item.question,
      context: { lessonId: item.lessonId, screenId: item.screenId, mode: item.mode }
    }),
    signal: AbortSignal.timeout(150000)
  });

  if (res.status !== 200) {
    let errBody = {};
    try { errBody = await res.json(); } catch (_) {}
    return {
      status: res.status,
      code: errBody.code || '',
      message: errBody.message || '',
      totalMs: Date.now() - startedAt,
      events: []
    };
  }

  const raw = await res.text();
  const doneAt = Date.now();
  const events = raw
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(l => {
      try { return JSON.parse(l); } catch (_) { return { raw: l }; }
    });
  const done = events.find(e => e.type === 'done') || {};
  const errEv = events.find(e => e.type === 'error') || null;
  const queuedEvents = events.filter(e => e.type === 'queued');
  const fullText = events.filter(e => e.type === 'content' && typeof e.text === 'string').map(e => e.text).join('');
  return {
    status: res.status,
    ok: !errEv && done.kind === 'ai' && fullText.length > 0,
    kind: done.kind || null,
    errorCode: errEv ? (errEv.code || 'ERROR') : null,
    totalMs: doneAt - startedAt,
    queuedPositions: queuedEvents.map(q => q.position),
    sawStarted: events.some(e => e.type === 'started'),
    sourcesCount: Array.isArray(done.sources) ? done.sources.length : 0,
    answerChars: fullText.length
  };
}

async function getHealth(baseUrl, token, proxySecret) {
  const r = await fetch(baseUrl + '/api/health', {
    headers: { 'X-CARANA-Proxy-Secret': proxySecret, Authorization: 'Bearer ' + token }
  });
  const data = await r.json();
  if (r.status !== 200) throw Error('/api/health returned ' + r.status + ': ' + JSON.stringify(data));
  return data;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'carana-bench-'));
  let server;
  let handler;
  try {
    ollamaStop(MODEL);
    await new Promise(r => setTimeout(r, 2000));
    const idleBaseline = snapshotHost();

    const store = createAuthStore(path.join(tmpDir, 'users.json'));
    const owner = store.upsertUser({
      userId: 'bench-owner',
      displayName: 'Benchmark Runner',
      role: 'owner',
      rateLimitPerMin: 60
    });

    const proxySecret = crypto.randomBytes(16).toString('hex');
    const telemetryEvents = [];
    handler = createHandler({
      userStore: store,
      origins: ['https://carana-cbd-elearning.vercel.app'],
      proxySecret,
      model: MODEL,
      qualification: 'benchmark',
      timeoutMs: 90000,
      queueTimeoutMs: 120000,
      maxQueue: 4,
      rate: 60,
      idleUnloadMs: 8000,
      telemetry: ev => telemetryEvents.push(ev)
    });
    server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const baseUrl = 'http://127.0.0.1:' + server.address().port;

    console.log('1/6 Running Cold Start benchmark (model unloaded first)...');
    const coldRes = await sendNdjsonRequest(baseUrl, owner.token, proxySecret, PROMPTS[0]);
    const postColdSnap = snapshotHost();
    console.log('  Cold Start:', coldRes.status, coldRes.ok, coldRes.totalMs + 'ms', 'ps:', postColdSnap.ollamaPs);

    console.log('2/6 Running 5 Sequential Requests benchmark (warm resident model)...');
    const seqRows = [];
    for (let i = 0; i < 5; i++) {
      const r = await sendNdjsonRequest(baseUrl, owner.token, proxySecret, PROMPTS[(i + 1) % PROMPTS.length]);
      seqRows.push(r);
      console.log(`  Seq ${i + 1}: status=${r.status} ok=${r.ok} totalMs=${r.totalMs}`);
    }
    const postSeqSnap = snapshotHost();

    console.log('3/6 Running 2 Concurrent Requests benchmark...');
    const conc2 = await Promise.all([
      sendNdjsonRequest(baseUrl, owner.token, proxySecret, PROMPTS[0]),
      sendNdjsonRequest(baseUrl, owner.token, proxySecret, PROMPTS[1])
    ]);
    console.log('  2 Concurrent:', conc2.map(r => `${r.ok ? 'ok' : 'fail'}(q=${JSON.stringify(r.queuedPositions)},${r.totalMs}ms)`).join(', '));

    console.log('4/6 Running 4 Concurrent Requests benchmark (within maxQueue=4)...');
    const conc4WallStart = Date.now();
    const conc4 = await Promise.all([0, 1, 2, 3].map(i => sendNdjsonRequest(baseUrl, owner.token, proxySecret, PROMPTS[i])));
    const conc4WallMs = Date.now() - conc4WallStart;
    const postConc4Snap = snapshotHost();
    console.log('  4 Concurrent wall=' + conc4WallMs + 'ms:', conc4.map(r => `${r.ok ? 'ok' : 'fail'}(q=${JSON.stringify(r.queuedPositions)},${r.totalMs}ms)`).join(', '));

    console.log('5/6 Running 6-Request Overload Burst benchmark (1 active + 4 queued + 1 OVERLOAD 503)...');
    const burstWallStart = Date.now();
    const burst6 = await Promise.all(PROMPTS.map(p => sendNdjsonRequest(baseUrl, owner.token, proxySecret, p)));
    const burstWallMs = Date.now() - burstWallStart;
    const postBurstHealth = await getHealth(baseUrl, owner.token, proxySecret);
    const postBurstSnap = snapshotHost();
    const burstCompleted = burst6.filter(r => r.status === 200 && r.ok).length;
    const burstRejected = burst6.filter(r => r.status === 503).length;
    console.log(`  6-Burst wall=${burstWallMs}ms completed=${burstCompleted} rejected503=${burstRejected} codes=${burst6.map(r => r.status + (r.code ? ':' + r.code : '')).join(',')}`);

    console.log('6/6 Verifying 8s Idle Model Unload...');
    await new Promise(r => setTimeout(r, 11000));
    const postIdleHealth = await getHealth(baseUrl, owner.token, proxySecret);
    const postIdleSnap = snapshotHost();
    console.log('  Idle unload health:', postIdleHealth.stats.idleUnloads, 'ollamaPs after idle:', postIdleSnap.ollamaPs);

    const report = {
      generatedAt: new Date().toISOString(),
      model: MODEL,
      configuration: {
        activeSlots: 1,
        maxQueue: 4,
        requestTimeoutMs: 90000,
        queueTimeoutMs: 120000,
        idleUnloadMsForBenchmark: 8000,
        productionIdleUnloadMs: 240000
      },
      hostBaselineIdle: idleBaseline,
      scenarios: {
        coldStart: { ...coldRes, snapshotAfter: postColdSnap },
        sequential5: {
          rows: seqRows,
          latencySummary: statsFor(seqRows.filter(r => r.ok).map(r => r.totalMs)),
          snapshotAfter: postSeqSnap
        },
        concurrent2: {
          rows: conc2,
          latencySummary: statsFor(conc2.filter(r => r.ok).map(r => r.totalMs))
        },
        concurrent4: {
          wallTimeMs: conc4WallMs,
          rows: conc4,
          latencySummary: statsFor(conc4.filter(r => r.ok).map(r => r.totalMs)),
          snapshotAfter: postConc4Snap
        },
        overloadBurst6: {
          wallTimeMs: burstWallMs,
          completedCount: burstCompleted,
          rejectedOverloadCount: burstRejected,
          rows: burst6,
          snapshotAfter: postBurstSnap
        },
        idleUnload: {
          idleUnloadsRecorded: postIdleHealth.stats.idleUnloads,
          p95LatencyMs: postIdleHealth.stats.p95LatencyMs,
          stats: postIdleHealth.stats,
          snapshotAfter: postIdleSnap
        }
      },
      telemetryCount: telemetryEvents.length
    };
    fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
    console.log('Saved benchmark report to', OUT_PATH);
  } finally {
    if (handler) await handler.shutdown({ unload: true }).catch(() => {});
    if (server) await new Promise(r => server.close(r));
    ollamaStop(MODEL);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
})().catch(err => {
  console.error(err);
  ollamaStop(MODEL);
  process.exitCode = 1;
});
