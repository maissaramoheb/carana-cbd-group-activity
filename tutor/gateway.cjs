/* Loopback HTTPS/local AI gateway with named-user auth, bounded FIFO queue,
 * memory/overload protection, idle model unload, and privacy-safe telemetry.
 * This service and its credentials are never staged for Vercel static output.
 */
'use strict';
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { createRetriever } = require('./retrieval.cjs');
const { generate, unloadModel: defaultUnloadModel } = require('./provider.cjs');
const { createLocalTts } = require('./tts.cjs');
const { createAuthStore } = require('./auth-store.cjs');

const ROOT = path.resolve(__dirname, '..');
const ALLOWED_MODELS = /^(?:qwen3:(?:0\.6b|1\.7b|4b|4b-instruct-2507-q4_K_M|14b)|gemma4:26b)$/;
const REMOTE_ORIGIN_RE = /^https:\/\/(?:carana-cbd-elearning(?:-[a-z0-9-]+)?\.vercel\.app|e-learning\.maissara\.tech|cbd\.maissara\.tech)$/i;

function defaultMemoryCheck() {
  const totalBytes = os.totalmem();
  let pressureLevel = 1;
  let reclaimableBytes = os.freemem();
  if (process.platform === 'darwin') {
    try {
      const pOut = execFileSync('sysctl', ['-n', 'kern.memorystatus_vm_pressure_level'], { encoding: 'utf8', timeout: 1000 }).trim();
      if (/^\d+$/.test(pOut)) pressureLevel = Number(pOut);
      const vs = execFileSync('vm_stat', { encoding: 'utf8', timeout: 1000 });
      const pageSize = Number(vs.match(/page size of (\d+) bytes/)?.[1] || 16384);
      const count = key => Number(vs.match(new RegExp(key + ':\\s+(\\d+)'))?.[1] || 0) * pageSize;
      reclaimableBytes = count('Pages free') + count('Pages inactive') + count('Pages purgeable');
    } catch (_) {}
  }
  const reclaimableGB = +(reclaimableBytes / 1073741824).toFixed(2);
  const totalGB = +(totalBytes / 1073741824).toFixed(2);
  return {
    totalGB,
    reclaimableAvailGB: reclaimableGB,
    pressureLevel,
    // macOS unified memory normally reports WARN (2) with ~1.0 GB free while gemma4:26b (18 GB) is resident.
    // Reserve OVERLOAD for CRITICAL kernel pressure (4) or sub-0.35 GB reclaimable exhaustion.
    overloaded: pressureLevel >= 4 || (pressureLevel >= 2 && reclaimableGB < 0.35) || reclaimableGB < 0.2
  };
}

function createHandler({
  token = '',
  userStore = null,
  origins = [],
  model = 'qwen3:4b',
  qualification = 'not-qualified',
  retriever = createRetriever(),
  provider = generate,
  tts = createLocalTts(),
  statusCheck = async () => true,
  dist = path.join(ROOT, 'dist'),
  timeoutMs = 55000,
  queueTimeoutMs = 45000,
  maxQueue = 0,
  rate = 12,
  clock = Date.now,
  proxySecret = '',
  remoteOriginPattern = REMOTE_ORIGIN_RE,
  allowedExtraHosts = [],
  telemetry = null,
  idleUnloadMs = 0,
  unloadModel = defaultUnloadModel,
  memoryCheck = defaultMemoryCheck,
  ollamaBase = 'http://127.0.0.1:11434'
}) {
  let busy = false;
  let ttsBusy = false;
  let shuttingDown = false;
  let idleTimer = null;
  let memCache = { ts: -60000, value: null };
  const queue = [];
  const latencies = [];
  const buckets = new Map();
  const publicFiles = new Set();

  function scan(dir, prefix = '') {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix + item.name;
      if (item.isDirectory()) scan(path.join(dir, item.name), rel + '/');
      else if (item.isFile()) publicFiles.add(rel);
    }
  }
  if (fs.existsSync(dist)) scan(dist);

  const startedAtMs = clock();
  const stats = {
    startedAt: new Date(startedAtMs).toISOString(),
    totalRequests: 0,
    authChecks: 0,
    aiSuccess: 0,
    validationDeclines: 0,
    retrievalDeclines: 0,
    policyIntercepts: 0,
    queuePeak: 0,
    queueCancelled: 0,
    queueTimeouts: 0,
    overloadRejects: 0,
    ttsRequests: 0,
    errors: 0,
    idleUnloads: 0,
    latencySumMs: 0,
    latencyCount: 0
  };

  const recordLatency = ms => {
    stats.latencySumMs += ms;
    stats.latencyCount++;
    latencies.push(ms);
    if (latencies.length > 120) latencies.shift();
  };

  const p95LatencyMs = () => {
    if (!latencies.length) return 0;
    const s = [...latencies].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
  };

  const getMemory = () => {
    const now = clock();
    if (!memCache.value || now - memCache.ts > 5000) {
      try {
        memCache = { ts: now, value: memoryCheck() };
      } catch (_) {
        memCache = { ts: now, value: { totalGB: 0, reclaimableAvailGB: 0, pressureLevel: 1, overloaded: false } };
      }
    }
    return memCache.value;
  };

  const recordOp = (route, status, kind, extra = {}) => {
    if (telemetry) telemetry({ ts: new Date(clock()).toISOString(), route, status, kind, ...extra });
  };

  const json = (res, status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  };

  const protectedRequest = q =>
    /\b(answer\s*key|facilitator.{0,30}(?:answer|solution)|annex\s*d|model\s*answers?|correct\s*(?:answer|option|letter)|system\s*prompt|reveal.{0,20}(?:secret|key)|execute.{0,20}(?:command|shell))\b/i.test(q);

  const clip = (t, n = 320) => {
    const s = String(t || '').trim();
    if (s.length <= n) return s;
    const c = s.slice(0, n);
    const e = Math.max(c.lastIndexOf('. '), c.lastIndexOf('! '), c.lastIndexOf('? '));
    return e > 100 ? c.slice(0, e + 1) : c.replace(/\s+\S*$/, '') + '…';
  };

  function limited(key, max) {
    const now = clock();
    const b = buckets.get(key);
    if (b && b.until > now) {
      b.n++;
      return b.n > max;
    }
    if (buckets.size > 200) buckets.clear();
    buckets.set(key, { n: 1, until: now + 60000 });
    return false;
  }

  function safeEqual(aStr, bStr) {
    const a = Buffer.from(String(aStr || ''));
    const b = Buffer.from(String(bStr || ''));
    return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  function authenticate(header) {
    const value = String(header || '').replace(/^Bearer\s+/i, '').trim();
    if (userStore) {
      const check = userStore.verify(value);
      if (check.ok || check.status === 403 || check.status === 503) return check;
      if (token && safeEqual(value, token)) {
        return { ok: true, user: { userId: 'owner', displayName: 'Course Owner', role: 'owner', rateLimitPerMin: rate } };
      }
      return check;
    }
    if (token && safeEqual(value, token)) {
      return { ok: true, user: { userId: 'pilot', displayName: 'Course Pilot', role: 'owner', rateLimitPerMin: rate } };
    }
    return { ok: false, status: 401, code: 'AUTH_INVALID', message: 'Pilot access code was not accepted. Re-enter the code.' };
  }

  function originIsAllowed(effectiveOrigin) {
    if (remoteOriginPattern.test(effectiveOrigin)) return true;
    try {
      const u = new URL(effectiveOrigin);
      return u.protocol === 'https:' && allowedExtraHosts.includes(u.hostname.toLowerCase());
    } catch (_) {
      return false;
    }
  }

  function clearIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  function scheduleIdleUnload() {
    clearIdleTimer();
    if (shuttingDown || busy || queue.length > 0 || idleUnloadMs <= 0 || !unloadModel) return;
    idleTimer = setTimeout(async () => {
      if (shuttingDown || busy || queue.length > 0) return;
      const ok = await unloadModel(model, ollamaBase).catch(() => false);
      if (ok) {
        stats.idleUnloads++;
        recordOp('system', 200, 'idle-unload', { model });
      }
    }, idleUnloadMs);
    if (typeof idleTimer.unref === 'function') idleTimer.unref();
  }

  function writeNdjson(res, obj) {
    if (!res.destroyed && !res.writableEnded) {
      res.write(JSON.stringify(obj) + '\n');
    }
  }

  function emitNdjsonResult(res, text, sources, kind, writeHeadFirst = true) {
    if (res.destroyed || res.writableEnded) return;
    if (writeHeadFirst) res.writeHead(200, { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' });
    for (let n = 0; n < text.length; n += 100) {
      writeNdjson(res, { type: 'content', text: text.slice(n, n + 100) });
    }
    writeNdjson(res, {
      type: 'done',
      sources,
      kind,
      provider: kind === 'ai' ? 'genuine-local-ollama' : 'curriculum-policy',
      model: kind === 'ai' ? model : undefined
    });
    res.end();
  }

  function notifyQueuePositions() {
    for (let i = 0; i < queue.length; i++) {
      writeNdjson(queue[i].res, { type: 'queued', position: i + 1, queueLength: queue.length, model });
    }
  }

  async function executeInference({ question, passages, context, abort, userId }) {
    const started = clock();
    const reply = await provider({ model, question, passages, context, signal: abort.signal, ollamaBase });
    if (abort.signal.aborted) throw Error('cancelled');
    const elapsed = clock() - started;
    stats.aiSuccess++;
    recordLatency(elapsed);
    const text =
      reply.answer +
      (reply.example ? '\n\nInvented teaching example: ' + reply.example : '') +
      (reply.uncertainty ? '\n\nEvidence limits: ' + reply.uncertainty : '');
    recordOp('/api/tutor', 200, 'ai', { lessonId: context.lessonId, screenId: context.screenId, model, elapsedMs: elapsed, userId });
    return { text, sources: reply.sources };
  }

  function processNext() {
    if (busy || shuttingDown) return;
    while (queue.length > 0) {
      const nextJob = queue.shift();
      if (nextJob.cancelled || nextJob.res.destroyed || nextJob.res.writableEnded) continue;
      notifyQueuePositions();
      nextJob.start();
      return;
    }
    scheduleIdleUnload();
  }

  const handler = async (req, res) => {
    stats.totalRequests++;
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Cache-Control', 'no-store');

    const host = String(req.headers.host || '');
    const allowedHosts = origins.map(o => new URL(o).host);
    const isProxied = !!proxySecret && safeEqual(req.headers['x-carana-proxy-secret'], proxySecret);
    if (!isProxied && !allowedHosts.includes(host)) return json(res, 403, { message: 'Host is not permitted.' });

    const effectiveOrigin = isProxied
      ? String(req.headers['x-carana-forwarded-origin'] || req.headers.origin || '')
      : String(req.headers.origin || '');
    if (effectiveOrigin && !(isProxied ? originIsAllowed(effectiveOrigin) : origins.includes(effectiveOrigin))) {
      return json(res, 403, { message: 'Origin is not permitted.' });
    }
    const originOkForPost = !!effectiveOrigin && (isProxied ? originIsAllowed(effectiveOrigin) : origins.includes(effectiveOrigin));

    const url = new URL(req.url, 'https://' + (host || 'localhost'));
    const ip = String(isProxied ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'remote') : (req.socket.remoteAddress || 'local'))
      .split(',')[0]
      .trim();

    if (url.pathname === '/api/health') {
      if (req.method !== 'GET') return json(res, 405, { message: 'Method not allowed.' });
      if (limited(ip + ':health', 60)) return json(res, 429, { message: 'Pause before trying again.' });
      let connected = false;
      try { connected = await statusCheck(); } catch (_) {}
      const mem = getMemory();
      const base = {
        ok: true,
        connected,
        shuttingDown,
        model,
        qualification,
        remoteOwnerPreview: isProxied,
        activeInference: busy,
        queueDepth: queue.length,
        maxQueue,
        activeTts: ttsBusy,
        uptimeSec: Math.round((clock() - startedAtMs) / 1000)
      };
      if (!isProxied || authenticate(req.headers.authorization).ok) {
        base.memory = mem;
        base.stats = {
          ...stats,
          avgLatencyMs: stats.latencyCount ? Math.round(stats.latencySumMs / stats.latencyCount) : 0,
          p95LatencyMs: p95LatencyMs()
        };
      }
      return json(res, 200, base);
    }

    if (url.pathname === '/api/tutor/status') {
      if (req.method !== 'GET') return json(res, 405, { message: 'Method not allowed.' });
      if (limited(ip + ':status', 60)) return json(res, 429, { message: 'Pause before trying again.' });
      let connected = false;
      try { connected = await statusCheck(); } catch (_) {}
      const storeMeta = userStore ? userStore.statusSummary() : { pilotDisabled: false };
      return json(res, 200, {
        mode: 'local-pilot',
        remoteOwnerPreview: isProxied,
        provider: 'ollama',
        model,
        requiresAccess: true,
        authEndpoint: true,
        qualification,
        connected: !shuttingDown && connected,
        busy,
        queueDepth: queue.length,
        maxQueue,
        reviewerPilotEnabled: !storeMeta.pilotDisabled,
        tts: tts ? tts.status() : { available: false, voices: [] }
      });
    }

    if (url.pathname === '/api/tutor/auth') {
      if (req.method !== 'POST') return json(res, 405, { message: 'Method not allowed.' });
      if (!originOkForPost) return json(res, 403, { message: 'A same-origin browser request is required.' });
      if (limited(ip + ':auth', 20)) return json(res, 429, { message: 'Too many sign-in attempts. Wait a minute.' });
      stats.authChecks++;
      const authRes = authenticate(req.headers.authorization);
      if (!authRes.ok) {
        recordOp('/api/tutor/auth', authRes.status, authRes.code);
        return json(res, authRes.status, { code: authRes.code, message: authRes.message });
      }
      recordOp('/api/tutor/auth', 200, authRes.user.role, { userId: authRes.user.userId });
      return json(res, 200, {
        authenticated: true,
        userId: authRes.user.userId,
        displayName: authRes.user.displayName,
        role: authRes.user.role,
        model,
        qualification,
        limits: { ratePerMin: authRes.user.rateLimitPerMin }
      });
    }

    if (url.pathname === '/api/tts') {
      if (req.method !== 'POST') return json(res, 405, { message: 'Method not allowed.' });
      if (!originOkForPost) return json(res, 403, { message: 'A same-origin browser request is required.' });
      if (limited(ip + ':all', 60)) return json(res, 429, { message: 'Too many requests. Wait a minute.' });
      const authRes = authenticate(req.headers.authorization);
      if (!authRes.ok) return json(res, authRes.status, { code: authRes.code, message: authRes.message });
      if (!String(req.headers['content-type'] || '').startsWith('application/json')) return json(res, 415, { message: 'JSON requests only.' });
      if (+req.headers['content-length'] > 4096) return json(res, 413, { message: 'Speech request is too large.' });
      let raw = '';
      try {
        for await (const chunk of req) {
          raw += chunk.toString('utf8');
          if (Buffer.byteLength(raw) > 4096) return json(res, 413, { message: 'Speech request is too large.' });
        }
      } catch (_) {
        return;
      }
      let payload;
      try { payload = JSON.parse(raw); } catch (_) { return json(res, 400, { message: 'Invalid JSON request.' }); }
      if (!payload || typeof payload.text !== 'string' || !payload.text.trim() || payload.text.length > 1200) {
        return json(res, 400, { message: 'Speech text is invalid.' });
      }
      if (!tts) return json(res, 503, { message: 'Local speech engine is unavailable.' });
      if (ttsBusy) return json(res, 429, { message: 'Speech synthesis is already running.' });
      ttsBusy = true;
      stats.ttsRequests++;
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), 25000);
      res.on('close', () => { if (!res.writableEnded) abort.abort(); });
      try {
        const result = await tts.synthesize({ text: payload.text, voice: typeof payload.voice === 'string' ? payload.voice : 'kokoro:af_heart', signal: abort.signal });
        if (!res.destroyed && !res.writableEnded) {
          res.writeHead(200, {
            'Content-Type': result.contentType,
            'Content-Length': result.buffer.length,
            'X-CARANA-TTS-Engine': result.engine,
            'Cache-Control': 'no-store'
          });
          res.end(result.buffer);
          recordOp('/api/tts', 200, result.engine, { userId: authRes.user.userId });
        }
      } catch (_) {
        stats.errors++;
        if (!res.destroyed && !res.writableEnded) json(res, 503, { message: 'Local neural speech synthesis could not complete.' });
      } finally {
        clearTimeout(timer);
        ttsBusy = false;
      }
      return;
    }

    if (url.pathname === '/api/tutor') {
      if (req.method !== 'POST') return json(res, 405, { message: 'Method not allowed.' });
      if (!originOkForPost) return json(res, 403, { message: 'A same-origin browser request is required.' });
      if (limited(ip + ':all', 40)) return json(res, 429, { message: 'Too many requests. Wait a minute.' });
      const authRes = authenticate(req.headers.authorization);
      if (!authRes.ok) return json(res, authRes.status, { code: authRes.code, message: authRes.message });
      if (limited('user:' + authRes.user.userId, authRes.user.rateLimitPerMin || rate)) {
        return json(res, 429, { code: 'USER_RATE_LIMIT', message: 'Per-user request rate limit reached. Wait a moment.' });
      }
      if (limited('pilot', Math.max(rate, authRes.user.rateLimitPerMin || rate))) {
        return json(res, 429, { message: 'Pilot request limit reached. Wait a minute.' });
      }
      if (!String(req.headers['content-type'] || '').startsWith('application/json')) return json(res, 415, { message: 'JSON requests only.' });
      if (+req.headers['content-length'] > 8192) return json(res, 413, { message: 'Question request is too large.' });
      let raw = '';
      try {
        for await (const chunk of req) {
          raw += chunk.toString('utf8');
          if (Buffer.byteLength(raw) > 8192) return json(res, 413, { message: 'Question request is too large.' });
        }
      } catch (_) {
        return;
      }
      let payload;
      try { payload = JSON.parse(raw); } catch (_) { return json(res, 400, { message: 'Invalid JSON request.' }); }
      if (
        !payload ||
        Object.keys(payload).some(k => !['question', 'context'].includes(k)) ||
        typeof payload.question !== 'string' ||
        !payload.question.trim() ||
        payload.question.length > 1200 ||
        !payload.context ||
        Object.keys(payload.context).some(k => !['lessonId', 'screenId', 'mode'].includes(k)) ||
        typeof payload.context.screenId !== 'string' ||
        !/^\d{2}-\d{2}$/.test(payload.context.screenId)
      ) {
        return json(res, 400, { message: 'Question or context is invalid.' });
      }

      const context = retriever.context(payload.context);
      if (!context) return json(res, 400, { message: 'Current lesson context was not recognized.' });

      const passages = retriever.search(payload.question, payload.context);
      const sourceRows = rows => rows.map(p => ({ id: p.id, title: p.title, source: p.source }));

      if (context.mode === 'checkpoint' || protectedRequest(payload.question)) {
        stats.policyIntercepts++;
        recordOp('/api/tutor', 200, 'study-guide', { lessonId: context.lessonId, screenId: context.screenId, userId: authRes.user.userId });
        const own = retriever.search('Explain this screen', payload.context, 2);
        return emitNdjsonResult(
          res,
          'I can help you review the underlying concepts, but I will not select checkpoint options or reveal facilitator solutions.\n\nReview: ' +
            own.map(p => p.title).join('; ') +
            '.\n\n' +
            own.map(p => clip(p.text)).join('\n\n') +
            '\n\nUse the source references and your own reasoning before returning to the checkpoint.',
          sourceRows(own),
          'study-guide',
          true
        );
      }

      if (!passages.length) {
        stats.retrievalDeclines++;
        recordOp('/api/tutor', 200, 'source-check-decline', { lessonId: context.lessonId, screenId: context.screenId, userId: authRes.user.userId });
        return emitNdjsonResult(
          res,
          'I could not retrieve enough authorized evidence for that wording on "' +
            context.title +
            '" (Lesson ' +
            context.lessonNumber +
            '). Try Explain this screen, or rephrase using terms from the CBD curriculum.',
          [],
          'source-check',
          true
        );
      }

      if (shuttingDown) {
        return json(res, 503, { code: 'SHUTTING_DOWN', message: 'The local AI service is restarting or shutting down. Try again in a moment.' });
      }

      const mem = getMemory();
      if (mem.overloaded && !busy) {
        stats.overloadRejects++;
        recordOp('/api/tutor', 503, 'memory-overload', { pressureLevel: mem.pressureLevel, reclaimableAvailGB: mem.reclaimableAvailGB });
        return json(res, 503, {
          code: 'MEMORY_PRESSURE',
          message: 'The Mac host is under memory pressure right now. Wait a moment and retry.'
        });
      }

      const validationErrorRe = /^(?:Model response failed source validation|Model inserted|Model made an unsupported|Model example violated|Model overstated)/;

      // Fast path when model slot is immediately free: keep HTTP status uncommitted until model responds cleanly (allows true HTTP 503 on offline Ollama)
      if (!busy) {
        clearIdleTimer();
        busy = true;
        const started = clock();
        const abort = new AbortController();
        const timer = setTimeout(() => abort.abort(), timeoutMs);
        res.on('close', () => { if (!res.writableEnded) abort.abort(); });
        try {
          const out = await executeInference({ question: payload.question, passages, context, abort, userId: authRes.user.userId });
          emitNdjsonResult(res, out.text, out.sources, 'ai', true);
        } catch (e) {
          const elapsed = clock() - started;
          if (validationErrorRe.test(e.message)) {
            stats.validationDeclines++;
            recordOp('/api/tutor', 200, 'validation-decline', { lessonId: context.lessonId, screenId: context.screenId, model, elapsedMs: elapsed, reason: e.message });
            emitNdjsonResult(
              res,
              'I could not deliver an evidence-checked reply for that question without risking unverified claims. Review the retrieved source excerpts below and rephrase using exact concepts from this screen.\n\nEvidence limits: Server validation blocked a draft response (' +
                e.message +
                ').',
              sourceRows(passages),
              'source-check',
              true
            );
          } else {
            stats.errors++;
            recordOp('/api/tutor', 503, 'error', { lessonId: context.lessonId, screenId: context.screenId, elapsedMs: elapsed });
            if (!res.destroyed && !res.writableEnded) {
              json(res, 503, {
                message: abort.signal.aborted
                  ? 'The local reply timed out or was cancelled. No answer was supplied.'
                  : 'The local model was unavailable or its response did not pass source checks. Try again later; the course remains available.'
              });
            }
          }
        } finally {
          clearTimeout(timer);
          busy = false;
          processNext();
        }
        return;
      }

      // Busy path: either reject 429 (maxQueue===0) or enqueue up to maxQueue with live NDJSON queue feedback
      if (maxQueue <= 0) {
        return json(res, 429, { message: 'The local model is answering another question. Try again shortly.' });
      }
      if (queue.length >= maxQueue) {
        stats.overloadRejects++;
        recordOp('/api/tutor', 503, 'queue-overload', { queueDepth: queue.length, maxQueue });
        return json(res, 503, {
          code: 'OVERLOAD',
          message: 'Several questions are already waiting in line (' + queue.length + '/' + maxQueue + '). Please wait a moment and try again.'
        });
      }

      res.writeHead(200, { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' });
      const job = {
        res,
        cancelled: false,
        queueTimer: null,
        start: null
      };
      queue.push(job);
      if (queue.length > stats.queuePeak) stats.queuePeak = queue.length;
      writeNdjson(res, { type: 'queued', position: queue.length, queueLength: queue.length, model });

      const removeFromQueue = reason => {
        if (job.cancelled) return;
        job.cancelled = true;
        if (job.queueTimer) clearTimeout(job.queueTimer);
        const idx = queue.indexOf(job);
        if (idx >= 0) {
          queue.splice(idx, 1);
          notifyQueuePositions();
        }
        if (reason === 'timeout') {
          stats.queueTimeouts++;
          writeNdjson(res, { type: 'error', message: 'Queue wait timed out before the local model became free. Please try again.' });
          if (!res.destroyed && !res.writableEnded) res.end();
        } else {
          stats.queueCancelled++;
        }
      };

      res.on('close', () => {
        if (!res.writableEnded && queue.includes(job)) removeFromQueue('client-closed');
      });

      job.queueTimer = setTimeout(() => {
        if (queue.includes(job)) removeFromQueue('timeout');
      }, queueTimeoutMs);

      job.start = async () => {
        if (job.queueTimer) clearTimeout(job.queueTimer);
        if (job.cancelled || res.destroyed || res.writableEnded) {
          processNext();
          return;
        }
        clearIdleTimer();
        busy = true;
        const started = clock();
        const abort = new AbortController();
        const timer = setTimeout(() => abort.abort(), timeoutMs);
        res.on('close', () => { if (!res.writableEnded) abort.abort(); });
        writeNdjson(res, { type: 'started', position: 0, model });
        try {
          const out = await executeInference({ question: payload.question, passages, context, abort, userId: authRes.user.userId });
          emitNdjsonResult(res, out.text, out.sources, 'ai', false);
        } catch (e) {
          const elapsed = clock() - started;
          if (validationErrorRe.test(e.message)) {
            stats.validationDeclines++;
            recordOp('/api/tutor', 200, 'validation-decline', { lessonId: context.lessonId, screenId: context.screenId, model, elapsedMs: elapsed, reason: e.message });
            emitNdjsonResult(
              res,
              'I could not deliver an evidence-checked reply for that question without risking unverified claims. Review the retrieved source excerpts below and rephrase using exact concepts from this screen.\n\nEvidence limits: Server validation blocked a draft response (' +
                e.message +
                ').',
              sourceRows(passages),
              'source-check',
              false
            );
          } else {
            stats.errors++;
            recordOp('/api/tutor', 503, 'error', { lessonId: context.lessonId, screenId: context.screenId, elapsedMs: elapsed });
            writeNdjson(res, {
              type: 'error',
              message: abort.signal.aborted
                ? 'The local reply timed out or was cancelled. No answer was supplied.'
                : 'The local model was unavailable or did not pass source checks. Retry shortly.'
            });
            if (!res.destroyed && !res.writableEnded) res.end();
          }
        } finally {
          clearTimeout(timer);
          busy = false;
          processNext();
        }
      };
      return;
    }

    if (url.pathname.startsWith('/api/')) return json(res, 404, { message: 'No live AI endpoint is configured for this route.' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { message: 'Method not allowed.' });
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch (_) { return json(res, 400, { message: 'Invalid path.' }); }
    if (pathname === '/' || pathname === '/course') {
      res.writeHead(307, { Location: '/course/' });
      res.end();
      return;
    }
    let rel = pathname.replace(/^\//, '');
    if (rel.endsWith('/')) rel += 'index.html';
    if (!publicFiles.has(rel) && publicFiles.has(rel + '.html')) rel += '.html';
    if (!publicFiles.has(rel) || rel.split('/').some(x => x === '..' || x.startsWith('.'))) return json(res, 404, { message: 'Not found.' });
    const file = path.join(dist, rel);
    const mime =
      {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.mp3': 'audio/mpeg',
        '.jpg': 'image/jpeg',
        '.png': 'image/png'
      }[path.extname(rel)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(file).pipe(res);
  };

  handler.shutdown = async ({ unload = false } = {}) => {
    shuttingDown = true;
    clearIdleTimer();
    while (queue.length > 0) {
      const item = queue.shift();
      item.cancelled = true;
      if (item.queueTimer) clearTimeout(item.queueTimer);
      writeNdjson(item.res, { type: 'error', message: 'Local AI service is shutting down. Please retry after restart.' });
      if (!item.res.destroyed && !item.res.writableEnded) item.res.end();
    }
    const deadline = Date.now() + 3000;
    while (busy && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (unload && unloadModel) {
      await unloadModel(model, ollamaBase).catch(() => {});
    }
  };

  return handler;
}

function ensureTlsFiles(dir) {
  const key = path.join(dir, 'key.pem');
  const cert = path.join(dir, 'cert.pem');
  let regen = !fs.existsSync(key) || !fs.existsSync(cert);
  if (!regen) {
    try {
      const mtime = fs.statSync(cert).mtimeMs;
      if (Date.now() - mtime > 5 * 24 * 3600 * 1000) regen = true;
    } catch (_) {
      regen = true;
    }
  }
  if (regen) {
    execFileSync(
      'openssl',
      ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '7', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1'],
      { stdio: 'ignore' }
    );
    fs.chmodSync(key, 0o600);
  }
  return { key, cert };
}

async function start({
  port = 8766,
  model = 'qwen3:4b',
  qualification = 'not-qualified',
  proxySecret = '',
  token: fixedToken = '',
  userStorePath = '',
  persistentDir = '',
  maxQueue = 4,
  queueTimeoutMs = 45000,
  idleUnloadMs = 240000,
  allowedExtraHosts = [],
  ollamaBase = 'http://127.0.0.1:11434',
  telemetry = line => console.error('[telemetry]', JSON.stringify(line))
} = {}) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || !ALLOWED_MODELS.test(model)) {
    throw Error('Use an approved local pilot model and an unprivileged loopback port.');
  }
  const dir = persistentDir || fs.mkdtempSync(path.join(os.tmpdir(), 'carana-run06-pilot-'));
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.chmodSync(dir, 0o700);
  const { key, cert } = ensureTlsFiles(dir);
  const userStore = userStorePath ? createAuthStore(userStorePath) : null;
  const tokenFile = path.join(dir, 'pilot-access.txt');
  const token = userStore && !fixedToken ? '' : (fixedToken || (fs.existsSync(tokenFile) && persistentDir ? fs.readFileSync(tokenFile, 'utf8').trim() : '') || crypto.randomBytes(24).toString('base64url'));
  if ((!userStore || fixedToken) && token) {
    fs.writeFileSync(tokenFile, token, { mode: 0o600 });
  }
  const origins = ['https://localhost:' + port, 'https://127.0.0.1:' + port];
  const handler = createHandler({
    token,
    userStore,
    origins,
    model,
    qualification,
    proxySecret,
    allowedExtraHosts,
    maxQueue,
    queueTimeoutMs,
    idleUnloadMs,
    ollamaBase,
    telemetry,
    statusCheck: async () => {
      const r = await fetch(ollamaBase + '/api/tags', { signal: AbortSignal.timeout(2500) });
      return r.ok && (await r.json()).models.some(m => m.name === model);
    }
  });
  const server = https.createServer({ key: fs.readFileSync(key), cert: fs.readFileSync(cert), minVersion: 'TLSv1.2' }, handler);
  await new Promise((resolve, reject) => server.once('error', reject).listen(port, '127.0.0.1', resolve));
  const record = {
    url: origins[0],
    model,
    privateDirectory: dir,
    tokenFile,
    certificate: cert,
    remoteProxyEnabled: !!proxySecret,
    userStoreEnabled: !!userStore,
    qualification: qualification === 'not-qualified' ? 'not-qualified; engineering prototype only' : qualification,
    scope: proxySecret ? 'loopback-only + authenticated remote tunnel' : 'loopback-only; self-signed local review certificate; no public connection'
  };
  fs.writeFileSync(path.join(dir, 'runtime.json'), JSON.stringify(record, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(record));
  const shutdown = async opts => {
    await handler.shutdown(opts);
    await new Promise(r => server.close(r));
  };
  return { server, record, handler, shutdown, userStore };
}

if (require.main === module) {
  const extraHosts = String(process.env.CARANA_ALLOWED_PILOT_HOSTS || '')
    .split(',')
    .map(h => h.trim().toLowerCase())
    .filter(Boolean);
  start({
    port: Number(process.argv[2] || process.env.CARANA_PORT || 8766),
    model: process.argv[3] || process.env.CARANA_MODEL || 'gemma4:26b',
    qualification: process.env.CARANA_QUALIFICATION || 'not-qualified',
    proxySecret: process.env.CARANA_PROXY_SECRET || '',
    token: process.env.CARANA_OWNER_ACCESS_CODE || '',
    userStorePath: process.env.CARANA_USERS_FILE || '',
    persistentDir: process.env.CARANA_PERSISTENT_DIR || '',
    maxQueue: Number(process.env.CARANA_MAX_QUEUE || 4),
    idleUnloadMs: Number(process.env.CARANA_IDLE_UNLOAD_MS || 240000),
    allowedExtraHosts: extraHosts
  })
    .then(({ record, shutdown }) => {
      console.error('\nCARANA Local Studio Ready (Loopback Only)');
      console.error('  Model       : ' + record.model);
      console.error('  Course URL  : ' + record.url + '/course/#lesson-1');
      console.error('  User Store  : ' + (record.userStoreEnabled ? 'enabled' : 'single-token'));
      const onSig = async () => { await shutdown({ unload: false }); process.exit(0); };
      process.on('SIGINT', onSig);
      process.on('SIGTERM', onSig);
    })
    .catch(e => {
      console.error(e.message);
      process.exitCode = 1;
    });
}

module.exports = { createHandler, start, ALLOWED_MODELS, defaultMemoryCheck };
