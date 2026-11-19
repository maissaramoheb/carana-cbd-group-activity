'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { createAuthStore } = require('../../tutor/auth-store.cjs');
const { createHandler } = require('../../tutor/gateway.cjs');
const { createRemoteProxy } = require('../../tutor/remote-proxy.cjs');

async function listen(handler) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, origin: 'http://127.0.0.1:' + port, host: '127.0.0.1:' + port };
}

function rawRequest(origin, pathname, { method = 'GET', headers = {}, body = '' } = {}) {
  const u = new URL(origin);
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: u.hostname, port: u.port, path: pathname, method, headers }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

describe('Follow-up 06 operations: named auth, per-user rate limits, bounded queue, overload, idle unload', () => {
  it('enforces scrypt user auth, instant revocation, reinstate, and global reviewer kill switch', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'carana-auth-test-'));
    const storePath = path.join(tmp, 'users.json');
    try {
      const store = createAuthStore(storePath);
      const ownerCred = store.upsertUser({ userId: 'owner-maissara', displayName: 'Maissara', role: 'owner', rateLimitPerMin: 10 });
      const revCred = store.upsertUser({ userId: 'reviewer-01', displayName: 'Reviewer One', role: 'reviewer', rateLimitPerMin: 2 });

      const diskText = fs.readFileSync(storePath, 'utf8');
      assert(!diskText.includes(ownerCred.token) && !diskText.includes(revCred.token), 'Plaintext secrets must never be persisted');
      assert.equal(fs.statSync(storePath).mode & 0o777, 0o600);

      const { server, origin } = await listen(
        createHandler({
          userStore: store,
          origins: ['http://127.0.0.1:0'],
          model: 'gemma4:26b',
          provider: async ({ passages }) => ({ answer: 'Verified syllabus guidance.', sources: passages.slice(0, 1).map(p => ({ id: p.id, title: p.title, source: p.source })), example: '', uncertainty: '' })
        })
      );
      const actualOrigin = 'http://127.0.0.1:' + server.address().port;
      // Recreate with exact dynamic origin
      await new Promise(r => server.close(r));
      const { server: s2 } = await listen(
        (() => {
          const proxySecret = 'internal-sec';
          const h = createHandler({
            userStore: store,
            origins: [actualOrigin],
            proxySecret,
            model: 'gemma4:26b',
            provider: async ({ passages }) => ({ answer: 'Verified syllabus guidance.', sources: passages.slice(0, 1).map(p => ({ id: p.id, title: p.title, source: p.source })), example: '', uncertainty: '' })
          });
          return (req, res) => {
            req.headers['x-carana-proxy-secret'] = proxySecret;
            req.headers['x-carana-forwarded-origin'] = 'https://carana-cbd-elearning.vercel.app';
            return h(req, res);
          };
        })()
      );
      const base = 'http://127.0.0.1:' + s2.address().port;
      try {
        const post = (p, tok, body = '{}') =>
          fetch(base + p, {
            method: 'POST',
            headers: { Origin: 'https://carana-cbd-elearning.vercel.app', Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
            body
          });

        // 1. Wrong code -> 401
        assert.equal((await post('/api/tutor/auth', 'bad-invite-token')).status, 401);

        // 2. Valid reviewer auth -> 200 with displayName
        const okRev = await post('/api/tutor/auth', revCred.token);
        assert.equal(okRev.status, 200);
        const revData = await okRev.json();
        assert.equal(revData.userId, 'reviewer-01');
        assert.equal(revData.role, 'reviewer');

        // 3. Per-user rate limit (reviewer limit = 2/min -> 3rd call hits 429; owner limit unaffected!)
        const qBody = JSON.stringify({ question: 'Explain this screen', context: { lessonId: 'cbd-1', screenId: '01-01', mode: 'screen' } });
        assert.equal((await post('/api/tutor', revCred.token, qBody)).status, 200);
        assert.equal((await post('/api/tutor', revCred.token, qBody)).status, 200);
        assert.equal((await post('/api/tutor', revCred.token, qBody)).status, 429);
        assert.equal((await post('/api/tutor', ownerCred.token, qBody)).status, 200);

        // 4. Individual revocation -> immediate 403 ACCESS_REVOKED
        store.revokeUser('reviewer-01');
        const revokedAuth = await post('/api/tutor/auth', revCred.token);
        assert.equal(revokedAuth.status, 403);
        assert.equal((await revokedAuth.json()).code, 'ACCESS_REVOKED');

        // 5. Reinstate then toggle global reviewer kill switch -> 503 PILOT_DISABLED for reviewer, owner still works!
        store.reinstateUser('reviewer-01');
        store.setPilotDisabled(true);
        const disabledRev = await post('/api/tutor/auth', revCred.token);
        assert.equal(disabledRev.status, 503);
        assert.equal((await disabledRev.json()).code, 'PILOT_DISABLED');
        assert.equal((await post('/api/tutor/auth', ownerCred.token)).status, 200);

        // 6. Proxy-level CARANA_PILOT_DISABLED env blocks before upstream cleanly
        const pSrv = await listen(createRemoteProxy({ CARANA_AI_ENABLED: 'true', CARANA_UPSTREAM_URL: base, CARANA_ALLOW_TEST_UPSTREAM: '1', CARANA_PROXY_SECRET: 'x', CARANA_PILOT_DISABLED: 'true' }));
        try {
          const pStatus = await rawRequest(pSrv.origin, '/api/tutor/status', { headers: { Host: 'carana-cbd-elearning.vercel.app' } });
          assert.equal(pStatus.status, 200);
          assert.equal(JSON.parse(pStatus.text).pilotDisabled, true);
          const pAuth = await rawRequest(pSrv.origin, '/api/tutor/auth', {
            method: 'POST',
            headers: {
              Host: 'carana-cbd-elearning.vercel.app',
              Origin: 'https://carana-cbd-elearning.vercel.app',
              Authorization: 'Bearer ' + ownerCred.token,
              'Content-Type': 'application/json'
            },
            body: '{}'
          });
          assert.equal(pAuth.status, 503);
          assert.equal(JSON.parse(pAuth.text).code, 'PILOT_DISABLED');
        } finally {
          await new Promise(r => pSrv.server.close(r));
        }
      } finally {
        await new Promise(r => s2.close(r));
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('queues concurrent requests up to maxQueue, streams queued events, rejects overload, handles cancellation, and triggers idle unload', async () => {
    let releaseFirst;
    let calls = 0;
    let unloaded = 0;
    const h = createHandler({
      token: 'owner-secret',
      origins: ['http://127.0.0.1'],
      model: 'gemma4:26b',
      maxQueue: 2,
      queueTimeoutMs: 5000,
      idleUnloadMs: 40,
      unloadModel: async () => { unloaded++; return true; },
      provider: async ({ signal, passages }) => {
        const myCall = ++calls;
        if (myCall === 1) {
          await new Promise(resolve => {
            releaseFirst = resolve;
            signal.addEventListener('abort', resolve);
          });
        }
        return { answer: 'Answer #' + myCall, sources: passages.slice(0, 1).map(p => ({ id: p.id, title: p.title, source: p.source })), example: '', uncertainty: '' };
      }
    });
    const srv = await listen((req, res) => {
      req.headers.host = '127.0.0.1';
      req.headers.origin = 'http://127.0.0.1';
      return h(req, res);
    });
    const base = srv.origin;
    const ask = (q = 'Explain this screen', signal) =>
      fetch(base + '/api/tutor', {
        method: 'POST',
        headers: { Host: '127.0.0.1', Origin: 'http://127.0.0.1', Authorization: 'Bearer owner-secret', 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context: { lessonId: 'cbd-1', screenId: '01-01', mode: 'screen' } }),
        signal
      });

    try {
      // Req 1 occupies active slot
      const p1 = ask();
      while (!releaseFirst) await new Promise(r => setTimeout(r, 5));

      // Req 2 enters queue position 1, Req 3 enters queue position 2 (both receive 200 NDJSON with queued status)
      const p2 = ask();
      const abort3 = new AbortController();
      const p3 = ask('Explain this screen', abort3.signal).catch(() => null);
      await new Promise(r => setTimeout(r, 30));

      // Check /api/health reports active=1, queueDepth=2
      const hl = await (await fetch(base + '/api/health')).json();
      assert.equal(hl.activeInference, true);
      assert.equal(hl.queueDepth, 2);

      // Req 4 exceeds maxQueue=2 -> 503 OVERLOAD
      const overloadRes = await ask();
      assert.equal(overloadRes.status, 503);
      assert.equal((await overloadRes.json()).code, 'OVERLOAD');

      // Cancel Req 3 while queued -> frees queue slot, Req 4b can queue and complete
      abort3.abort();
      await p3;
      await new Promise(r => setTimeout(r, 20));
      const p4 = ask();
      await new Promise(r => setTimeout(r, 20));

      // Release active Req 1 -> Req 2 and Req 4 finish cleanly
      releaseFirst();
      const [r1, r2, r4] = await Promise.all([p1, p2, p4]);
      const t1 = await r1.text();
      const t2 = await r2.text();
      const t4 = await r4.text();
      assert.match(t1, /Answer #1/);
      assert.match(t2, /"type":"queued"/);
      assert.match(t2, /"type":"started"/);
      assert.match(t2, /Answer #2/);
      assert.match(t4, /Answer #3/); // Req 3 cancelled cleanly before calling provider!

      // Wait for idleUnloadMs (40ms) -> unloadModel triggered automatically
      await new Promise(r => setTimeout(r, 120));
      assert(unloaded >= 1, 'Expected automatic idle model unload after quiet interval');

      await h.shutdown();
    } finally {
      await new Promise(r => srv.server.close(r));
    }
  });

  it('rejects requests under host memory pressure before calling provider', async () => {
    let called = 0;
    const h = createHandler({
      token: 'sec',
      origins: ['http://127.0.0.1'],
      memoryCheck: () => ({ totalGB: 24, reclaimableAvailGB: 0.4, pressureLevel: 2, overloaded: true }),
      provider: async () => { called++; return { answer: 'never', sources: [], example: '', uncertainty: '' }; }
    });
    const srv = await listen((req, res) => {
      req.headers.host = '127.0.0.1';
      req.headers.origin = 'http://127.0.0.1';
      return h(req, res);
    });
    try {
      const res = await fetch(srv.origin + '/api/tutor', {
        method: 'POST',
        headers: { Host: '127.0.0.1', Origin: 'http://127.0.0.1', Authorization: 'Bearer sec', 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Explain this screen', context: { lessonId: 'cbd-1', screenId: '01-01', mode: 'screen' } })
      });
      assert.equal(res.status, 503);
      assert.equal((await res.json()).code, 'MEMORY_PRESSURE');
      assert.equal(called, 0);
    } finally {
      await new Promise(r => srv.server.close(r));
    }
  });
});
