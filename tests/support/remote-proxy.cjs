'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const { createHandler } = require('../../tutor/gateway.cjs');
const { createRemoteProxy } = require('../../tutor/remote-proxy.cjs');

async function listen(handler) {
  const srv = http.createServer(handler);
  await new Promise(resolve => srv.listen(0, '127.0.0.1', resolve));
  const { port } = srv.address();
  return { server: srv, url: 'http://127.0.0.1:' + port };
}

function request(baseUrl, path, { method = 'GET', headers = {}, body = '' } = {}) {
  const u = new URL(baseUrl);
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: u.hostname, port: u.port, path, method, headers },
      res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          resolve({ status: res.statusCode, headers: res.headers, buf, text: buf.toString('utf8') });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

describe('Remote owner-preview proxy and gateway tunnel security', () => {
  it('fails closed 404 when CARANA_AI_ENABLED is unset or not true, and rejects non-https upstream without test flag', async () => {
    const p1 = await listen(createRemoteProxy({}));
    const p2 = await listen(createRemoteProxy({ CARANA_AI_ENABLED: 'true', CARANA_UPSTREAM_URL: 'http://127.0.0.1:8766', CARANA_PROXY_SECRET: 'sec' }));
    try {
      const r1 = await request(p1.url, '/api/tutor/status', { headers: { Host: 'carana-cbd-elearning.vercel.app' } });
      assert.equal(r1.status, 404);
      assert.equal(r1.headers['access-control-allow-origin'], undefined);

      const r2 = await request(p2.url, '/api/tutor/status', { headers: { Host: 'carana-cbd-elearning.vercel.app' } });
      assert.equal(r2.status, 404);
    } finally {
      await Promise.all([new Promise(r => p1.server.close(r)), new Promise(r => p2.server.close(r))]);
    }
  });

  it('proxies end-to-end across remote proxy -> gateway -> retrieval + grounded AI + TTS while blocking abuse and offline cleanly', async () => {
    const proxySecret = crypto.randomBytes(24).toString('hex');
    const accessToken = crypto.randomBytes(18).toString('base64url');
    const previewOrigin = 'https://carana-cbd-elearning-git-preview-delta4ce20-5830s-projects.vercel.app';
    const previewHost = new URL(previewOrigin).host;

    const gateway = await listen(
      createHandler({
        token: accessToken,
        origins: ['https://localhost:8766'],
        model: 'qwen3:14b',
        qualification: 'owner-pilot',
        proxySecret,
        provider: async ({ question, context, passages }) => ({
          answer: `Grounded answer on ${context.title}: ${passages[0].title}`,
          sourceIds: [passages[0].id],
          sources: passages.slice(0, 1).map(p => ({ id: p.id, title: p.title, source: p.source })),
          example: '',
          uncertainty: 'None on this screen.'
        }),
        tts: {
          status: () => ({ available: true, voices: [{ id: 'apple:nora', name: 'Nora (Enhanced)' }] }),
          synthesize: async () => ({ contentType: 'audio/wav', engine: 'apple-neural-nora', buffer: Buffer.from('RIFFtestwavdata') })
        }
      })
    );

    const proxy = await listen(
      createRemoteProxy({
        CARANA_AI_ENABLED: 'true',
        CARANA_UPSTREAM_URL: gateway.url,
        CARANA_ALLOW_TEST_UPSTREAM: '1',
        CARANA_PROXY_SECRET: proxySecret,
        CARANA_MODEL: 'qwen3:14b',
        CARANA_QUALIFICATION: 'owner-pilot'
      })
    );

    try {
      // 1. Direct request to gateway spoofing preview Host without proxy secret MUST fail 403
      const directSpoof = await request(gateway.url, '/api/tutor/status', { headers: { Host: previewHost } });
      assert.equal(directSpoof.status, 403);

      // 2. Proxy blocks wrong Host, wrong Origin, OPTIONS preflight, missing auth, oversize body, bad method
      assert.equal((await request(proxy.url, '/api/tutor/status', { headers: { Host: 'evil.example' } })).status, 403);
      assert.equal((await request(proxy.url, '/api/tutor/status', { headers: { Host: previewHost, Origin: 'https://evil.example' } })).status, 403);
      assert.equal((await request(proxy.url, '/api/tutor', { method: 'OPTIONS', headers: { Host: previewHost, Origin: previewOrigin } })).status, 405);
      assert.equal((await request(proxy.url, '/api/tutor', { method: 'POST', headers: { Host: previewHost, Origin: previewOrigin, 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
      assert.equal((await request(proxy.url, '/api/tutor', { method: 'POST', headers: { Host: previewHost, Origin: previewOrigin, Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' }, body: '{"x":"' + 'a'.repeat(9000) + '"}' })).status, 413);

      // 3. Valid remote status & health check (no leaked internal URLs or proxy secret; detailed stats suppressed without auth)
      const st = await request(proxy.url, '/api/tutor/status', { headers: { Host: previewHost } });
      assert.equal(st.status, 200);
      assert.equal(st.headers['access-control-allow-origin'], undefined);
      const stJson = JSON.parse(st.text);
      assert.equal(stJson.connected, true);
      assert.equal(stJson.remoteOwnerPreview, true);
      assert.equal(stJson.model, 'qwen3:14b');
      assert.equal(stJson.tts.available, true);
      assert(!st.text.includes(proxySecret) && !st.text.includes(gateway.url));

      const hlAnon = await request(proxy.url, '/api/health', { headers: { Host: previewHost } });
      assert.equal(hlAnon.status, 200);
      assert.equal(JSON.parse(hlAnon.text).stats, undefined);

      // 4. Valid proxied tutor NDJSON streaming question
      const qRes = await request(proxy.url, '/api/tutor', {
        method: 'POST',
        headers: {
          Host: previewHost,
          Origin: previewOrigin,
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: 'Explain PESTEL-S conflict analysis',
          context: { lessonId: 'cbd-1', screenId: '02-01', mode: 'screen' }
        })
      });
      assert.equal(qRes.status, 200);
      assert.match(qRes.headers['content-type'], /application\/x-ndjson/);
      assert.match(qRes.text, /Grounded answer on/);
      assert.match(qRes.text, /"type":"done"/);

      // 5. Valid proxied neural TTS WAV
      const ttsRes = await request(proxy.url, '/api/tts', {
        method: 'POST',
        headers: {
          Host: previewHost,
          Origin: previewOrigin,
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: 'Possible causes: inspect supervision.', voice: 'apple:nora' })
      });
      assert.equal(ttsRes.status, 200);
      assert.equal(ttsRes.headers['content-type'], 'audio/wav');
      assert.equal(ttsRes.headers['x-carana-tts-engine'], 'apple-neural-nora');
      assert.equal(ttsRes.buf.slice(0, 4).toString(), 'RIFF');

      // 6. Wrong owner access code passes proxy format check but gateway rejects with 401
      const badCode = await request(proxy.url, '/api/tutor', {
        method: 'POST',
        headers: {
          Host: previewHost,
          Origin: previewOrigin,
          Authorization: 'Bearer wrong-owner-code',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: 'Explain this screen', context: { lessonId: 'cbd-1', screenId: '01-01', mode: 'screen' } })
      });
      assert.equal(badCode.status, 401);

      // 7. Shut down local gateway -> proxy handles offline cleanly (status -> 200 connected:false, POST -> 503)
      await new Promise(r => gateway.server.close(r));
      const offlineStatus = await request(proxy.url, '/api/tutor/status', { headers: { Host: previewHost } });
      assert.equal(offlineStatus.status, 200);
      assert.equal(JSON.parse(offlineStatus.text).connected, false);
      const offlinePost = await request(proxy.url, '/api/tutor', {
        method: 'POST',
        headers: { Host: previewHost, Origin: previewOrigin, Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Explain this screen', context: { lessonId: 'cbd-1', screenId: '01-01', mode: 'screen' } })
      });
      assert.equal(offlinePost.status, 503);
      assert.match(offlinePost.text, /offline|unreachable/i);
    } finally {
      await new Promise(r => proxy.server.close(r)).catch(() => {});
      await new Promise(r => gateway.server.close(r)).catch(() => {});
    }
  });
});
