/* Vercel isolated owner/pilot proxy -> persistent authenticated Mac mini tunnel.
 * Fails closed (HTTP 404 / 503) unless CARANA_AI_ENABLED=true and not killed via CARANA_PILOT_DISABLED.
 * Supports streaming NDJSON queue/inference events, /api/tutor/auth server verification, and /api/tts WAV.
 * Never logs or exposes CARANA_UPSTREAM_URL or CARANA_PROXY_SECRET.
 */
'use strict';
const { URL } = require('node:url');

const DEFAULT_ORIGIN_RE = /^https:\/\/(?:carana-cbd-elearning(?:-[a-z0-9-]+)?\.vercel\.app|e-learning\.maissara\.tech|cbd\.maissara\.tech)$/i;
const DEFAULT_HOST_RE = /^(?:carana-cbd-elearning(?:-[a-z0-9-]+)?\.vercel\.app|e-learning\.maissara\.tech|cbd\.maissara\.tech)$/i;
const ALLOWED_ROUTES = new Set(['/api/tutor/status', '/api/tutor/auth', '/api/tutor', '/api/tts', '/api/health']);
const LIMITS = { '/api/tutor': 8192, '/api/tts': 4096, '/api/tutor/auth': 512 };
const TIMEOUTS = { '/api/tutor': 58000, '/api/tts': 28000, '/api/tutor/auth': 8000, '/api/tutor/status': 6000, '/api/health': 6000 };

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store');
}

function sendJson(res, status, data) {
  applySecurityHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function buildAllowlists(env) {
  const extraHosts = String(env.CARANA_ALLOWED_PILOT_HOSTS || '')
    .split(',')
    .map(h => h.trim().toLowerCase())
    .filter(h => /^[a-z0-9.-]+$/.test(h));
  const hostAllowed = host => DEFAULT_HOST_RE.test(host) || extraHosts.includes(String(host || '').toLowerCase());
  const originAllowed = origin => {
    if (DEFAULT_ORIGIN_RE.test(origin)) return true;
    try {
      const u = new URL(origin);
      return u.protocol === 'https:' && extraHosts.includes(u.hostname.toLowerCase());
    } catch (_) {
      return false;
    }
  };
  return { hostAllowed, originAllowed };
}

function offlineStatusPayload(env, disabled = false) {
  return {
    mode: 'local-pilot',
    remoteOwnerPreview: true,
    provider: 'ollama',
    model: String(env.CARANA_MODEL || 'gemma4:26b'),
    requiresAccess: true,
    authEndpoint: true,
    qualification: String(env.CARANA_QUALIFICATION || 'not-qualified'),
    connected: false,
    pilotDisabled: !!disabled,
    tts: { available: false, voices: [] }
  };
}

async function readLimitedJsonBody(req, maxBytes) {
  const headerLen = Number(req.headers['content-length'] || 0);
  if (headerLen > maxBytes) {
    return { errorStatus: 413, message: 'Request payload is too large.' };
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) {
      return { errorStatus: 413, message: 'Request payload is too large.' };
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return { raw: '{}' };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { errorStatus: 400, message: 'Invalid JSON request.' };
    }
    return { raw };
  } catch (_) {
    return { errorStatus: 400, message: 'Invalid JSON request.' };
  }
}

function createRemoteProxy(env = process.env, fetchImpl = globalThis.fetch) {
  return async function handleRemoteProxy(req, res) {
    applySecurityHeaders(res);

    if (env.CARANA_AI_ENABLED !== 'true' || !env.CARANA_UPSTREAM_URL || !env.CARANA_PROXY_SECRET) {
      return sendJson(res, 404, { message: 'No public AI endpoint' });
    }

    let upstreamUrl;
    try {
      upstreamUrl = new URL(String(env.CARANA_UPSTREAM_URL).trim());
    } catch (_) {
      return sendJson(res, 404, { message: 'No public AI endpoint' });
    }

    const allowTestHttp =
      env.CARANA_ALLOW_TEST_UPSTREAM === '1' &&
      /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(upstreamUrl.origin);
    if (upstreamUrl.protocol !== 'https:' && !allowTestHttp) {
      return sendJson(res, 404, { message: 'No public AI endpoint' });
    }

    const reqUrl = new URL(req.url || '/', 'https://carana.invalid');
    const pathname = reqUrl.pathname;
    if (!ALLOWED_ROUTES.has(pathname)) {
      return sendJson(res, 404, { message: 'Not found.' });
    }

    const { hostAllowed, originAllowed } = buildAllowlists(env);
    const host = String(req.headers.host || '').split(':')[0].trim();
    if (host && !hostAllowed(host)) {
      return sendJson(res, 403, { message: 'Host is not permitted.' });
    }

    const origin = String(req.headers.origin || '').trim();
    if (origin && !originAllowed(origin)) {
      return sendJson(res, 403, { message: 'Origin is not permitted.' });
    }

    const isPost = pathname === '/api/tutor' || pathname === '/api/tts' || pathname === '/api/tutor/auth';
    if (isPost) {
      if (req.method !== 'POST') return sendJson(res, 405, { message: 'Method not allowed.' });
      if (!origin || !originAllowed(origin)) {
        return sendJson(res, 403, { message: 'A same-origin browser request is required.' });
      }
      if (env.CARANA_PILOT_DISABLED === 'true') {
        return sendJson(res, 503, { code: 'PILOT_DISABLED', message: 'The remote AI pilot has been paused by the course administrator.' });
      }
      const authHeader = String(req.headers.authorization || '').trim();
      if (!authHeader.startsWith('Bearer ') || authHeader.length <= 7) {
        return sendJson(res, 401, { message: 'Access code was not accepted. Re-enter the code.' });
      }
      const ctype = String(req.headers['content-type'] || '').toLowerCase();
      if (!ctype.startsWith('application/json')) {
        return sendJson(res, 415, { message: 'JSON requests only.' });
      }
    } else if (req.method !== 'GET') {
      return sendJson(res, 405, { message: 'Method not allowed.' });
    }

    if (env.CARANA_PILOT_DISABLED === 'true') {
      if (pathname === '/api/tutor/status') return sendJson(res, 200, offlineStatusPayload(env, true));
      return sendJson(res, 503, { ok: false, connected: false, pilotDisabled: true, message: 'The remote AI pilot has been paused by the course administrator.' });
    }

    let rawBody;
    if (isPost) {
      const read = await readLimitedJsonBody(req, LIMITS[pathname]);
      if (read.errorStatus) {
        return sendJson(res, read.errorStatus, { message: read.message });
      }
      rawBody = read.raw;
    }

    const forwardedOrigin = origin || 'https://' + (host || 'carana-cbd-elearning.vercel.app');
    const forwardHeaders = {
      'X-CARANA-Proxy-Secret': env.CARANA_PROXY_SECRET,
      'X-CARANA-Forwarded-Origin': forwardedOrigin,
      'ngrok-skip-browser-warning': '1'
    };
    if (req.headers.authorization) forwardHeaders.Authorization = String(req.headers.authorization);
    if (isPost) forwardHeaders['Content-Type'] = 'application/json';
    if (req.headers['x-forwarded-for']) {
      forwardHeaders['X-Forwarded-For'] = String(req.headers['x-forwarded-for']).slice(0, 128);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUTS[pathname] || 15000);
    res.on('close', () => {
      if (!res.writableEnded) controller.abort();
    });

    try {
      const upstreamRes = await fetchImpl(upstreamUrl.origin + pathname, {
        method: req.method,
        headers: forwardHeaders,
        body: isPost ? rawBody : undefined,
        signal: controller.signal
      });

      const contentType = String(upstreamRes.headers.get('content-type') || '').toLowerCase();

      if (pathname === '/api/tutor' && upstreamRes.ok && contentType.includes('application/x-ndjson')) {
        res.writeHead(200, { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' });
        if (upstreamRes.body && typeof upstreamRes.body.getReader === 'function') {
          const reader = upstreamRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value && value.length && !res.destroyed && !res.writableEnded) {
              res.write(Buffer.from(value));
            }
          }
        } else {
          res.write(Buffer.from(await upstreamRes.arrayBuffer()));
        }
        if (!res.destroyed && !res.writableEnded) res.end();
        return;
      }

      if (pathname === '/api/tts' && upstreamRes.ok && contentType.startsWith('audio/')) {
        const audio = Buffer.from(await upstreamRes.arrayBuffer());
        const outHeaders = {
          'Content-Type': contentType,
          'Content-Length': audio.length,
          'Cache-Control': 'no-store'
        };
        const engine = upstreamRes.headers.get('x-carana-tts-engine');
        if (engine) outHeaders['X-CARANA-TTS-Engine'] = String(engine).slice(0, 64);
        res.writeHead(200, outHeaders);
        res.end(audio);
        return;
      }

      if (contentType.includes('application/json')) {
        const payload = await upstreamRes.text();
        res.writeHead(upstreamRes.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(payload);
        return;
      }

      if (pathname === '/api/tutor/status') {
        return sendJson(res, 200, offlineStatusPayload(env));
      }
      if (pathname === '/api/health') {
        return sendJson(res, 503, { ok: false, connected: false, message: 'Local AI tunnel is offline.' });
      }
      return sendJson(res, 503, {
        message: 'Local AI service is offline or unreachable right now. Retry shortly or continue using the course.'
      });
    } catch (_) {
      if (res.destroyed || res.writableEnded) return;
      if (pathname === '/api/tutor/status') {
        return sendJson(res, 200, offlineStatusPayload(env));
      }
      if (pathname === '/api/health') {
        return sendJson(res, 503, { ok: false, connected: false, message: 'Local AI tunnel is offline.' });
      }
      return sendJson(res, 503, {
        message: 'Local AI service is offline or timed out. Retry shortly or continue reading the course.'
      });
    } finally {
      clearTimeout(timer);
    }
  };
}

const defaultHandler = createRemoteProxy();
defaultHandler.createRemoteProxy = createRemoteProxy;
defaultHandler.ALLOWED_ORIGIN_RE = DEFAULT_ORIGIN_RE;
defaultHandler.ALLOWED_HOST_RE = DEFAULT_HOST_RE;
defaultHandler.buildAllowlists = buildAllowlists;
module.exports = defaultHandler;
