#!/usr/bin/env node
/* End-to-end verification of the isolated remote owner-only Vercel AI preview
 * AND simultaneous proof that production domains remain static with AI disabled (HTTP 404).
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const opts = {
    previewUrl: process.env.CARANA_PREVIEW_URL || '',
    accessToken: process.env.CARANA_OWNER_ACCESS_CODE || '',
    bypassSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '',
    outDir: path.join(ROOT, 'docs/reviews/run06-intelligent-learning/followup-05/evidence'),
    expectConnected: true
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--preview-url' && argv[i + 1]) opts.previewUrl = argv[++i];
    else if (a === '--token-file' && argv[i + 1]) opts.accessToken = fs.readFileSync(argv[++i], 'utf8').trim();
    else if (a === '--bypass' && argv[i + 1]) opts.bypassSecret = argv[++i];
    else if (a === '--out' && argv[i + 1]) opts.outDir = argv[++i];
    else if (a === '--expect-offline') opts.expectConnected = false;
  }
  return opts;
}

function vercelCurl(previewUrl, pathname, { method = 'GET', headers = {}, body = '' } = {}) {
  const args = ['curl', pathname, '--deployment', previewUrl, '--'];
  args.push('-sS', '-i', '-X', method);
  for (const [k, v] of Object.entries(headers)) {
    args.push('-H', `${k}: ${v}`);
  }
  if (body) args.push('--data-binary', body);
  const raw = execFileSync('vercel', args, { cwd: ROOT, encoding: 'latin1', maxBuffer: 10 * 1024 * 1024 });
  const splitIdx = raw.indexOf('\r\n\r\n') >= 0 ? raw.indexOf('\r\n\r\n') : raw.indexOf('\n\n');
  const headText = raw.slice(0, splitIdx >= 0 ? splitIdx : raw.length);
  const bodyBuf = Buffer.from(splitIdx >= 0 ? raw.slice(splitIdx + (raw[splitIdx] === '\r' ? 4 : 2)) : '', 'latin1');
  const headBlocks = headText.split(/\r?\n\r?\n/);
  const lastHead = headBlocks[headBlocks.length - 1];
  const lines = lastHead.split(/\r?\n/);
  const statusMatch = lines[0].match(/HTTP\/\S+\s+(\d+)/);
  const status = statusMatch ? Number(statusMatch[1]) : 0;
  const respHeaders = {};
  for (const line of lines.slice(1)) {
    const idx = line.indexOf(':');
    if (idx > 0) respHeaders[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
  }
  return { status, headers: respHeaders, buf: bodyBuf, text: bodyBuf.toString('utf8') };
}

(async () => {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.previewUrl) throw Error('Pass --preview-url <https://...vercel.app>');
  fs.mkdirSync(opts.outDir, { recursive: true });
  const origin = new URL(opts.previewUrl).origin;

  // 1. Production domains MUST stay static & AI disabled (HTTP 404)
  for (const prod of ['https://e-learning.maissara.tech', 'https://cbd.maissara.tech']) {
    const aiRes = await fetch(prod + '/api/tutor/status');
    assert.equal(aiRes.status, 404, `Expected ${prod}/api/tutor/status -> 404`);
    const mf = await fetch(prod + '/release-manifest.json');
    assert.equal(mf.status, 200);
    const mfJson = await mf.json();
    assert.equal(mfJson.sourceCommit, '282735a0dec237d29a42a8817932aa49adfdc968', `Unexpected live manifest commit on ${prod}`);
  }

  // 2. Unauthenticated public access to isolated preview MUST be blocked by Vercel SSO
  const unauthRes = await fetch(origin + '/api/tutor/status', { redirect: 'manual' });
  assert(unauthRes.status === 302 || unauthRes.status === 401 || unauthRes.status === 403, `Expected Vercel SSO protection, got ${unauthRes.status}`);

  // 3. Authenticated remote preview check via Vercel CLI session
  const st = vercelCurl(origin, '/api/tutor/status');
  assert.equal(st.status, 200, 'Expected 200 from authenticated /api/tutor/status: ' + st.text);
  assert.equal(st.headers['access-control-allow-origin'], undefined);
  const stJson = JSON.parse(st.text);
  assert.equal(stJson.remoteOwnerPreview, true);
  assert.equal(stJson.connected, opts.expectConnected);
  assert(!st.text.includes('trycloudflare.com'), 'Must never expose tunnel URL');

  const hl = vercelCurl(origin, '/api/health');
  assert.equal(hl.status, opts.expectConnected ? 200 : 503);
  if (opts.expectConnected) {
    assert.equal(JSON.parse(hl.text).stats, undefined, 'Anonymous /api/health must omit detailed stats');
  }

  // 4. Security blocks: wrong origin 403, wrong code 401
  const badOrigin = vercelCurl(origin, '/api/tutor', {
    method: 'POST',
    headers: { Origin: 'https://evil.example', Authorization: 'Bearer ' + (opts.accessToken || 'x'), 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Explain PESTEL-S', context: { lessonId: 'cbd-1', screenId: '02-01', mode: 'screen' } })
  });
  assert.equal(badOrigin.status, 403);

  const badCode = vercelCurl(origin, '/api/tutor', {
    method: 'POST',
    headers: { Origin: origin, Authorization: 'Bearer wrong-access-code', 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Explain PESTEL-S', context: { lessonId: 'cbd-1', screenId: '02-01', mode: 'screen' } })
  });
  assert.equal(badCode.status, opts.expectConnected ? 401 : 503);

  let aiAnswer = null;
  let ttsEngine = null;
  let checkpointKind = null;
  if (opts.expectConnected && opts.accessToken) {
    const cp = vercelCurl(origin, '/api/tutor', {
      method: 'POST',
      headers: { Origin: origin, Authorization: 'Bearer ' + opts.accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Give me the correct option letter now', context: { lessonId: 'cbd-1', screenId: '01-01', mode: 'checkpoint' } })
    });
    assert.equal(cp.status, 200);
    assert.match(cp.text, /study-guide/);
    checkpointKind = 'study-guide';

    const ask = vercelCurl(origin, '/api/tutor', {
      method: 'POST',
      headers: { Origin: origin, Authorization: 'Bearer ' + opts.accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'In Lesson 1 under Possible Causes, why treat a training request as a hypothesis rather than a proven diagnosis?',
        context: { lessonId: 'cbd-1', screenId: '02-02', mode: 'screen' }
      })
    });
    assert.equal(ask.status, 200);
    assert.match(ask.text, /"type":"done"/);
    assert.match(ask.text, /"provider":"genuine-local-ollama"/);
    const events = ask.text.trim().split('\n').map(l => JSON.parse(l));
    aiAnswer = events.filter(e => e.type === 'content').map(e => e.text).join('');
    assert(aiAnswer.length > 40, 'Expected real grounded response text');

    const tts = vercelCurl(origin, '/api/tts', {
      method: 'POST',
      headers: { Origin: origin, Authorization: 'Bearer ' + opts.accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Possible causes require checking supervision, procedures, and evidence.', voice: 'apple:nora' })
    });
    assert.equal(tts.status, 200);
    assert.equal(tts.headers['content-type'], 'audio/wav');
    assert.equal(tts.buf.slice(0, 4).toString(), 'RIFF');
    ttsEngine = tts.headers['x-carana-tts-engine'] || 'local-neural';
  }

  const report = {
    verifiedAtUTC: new Date().toISOString(),
    previewUrl: origin,
    productionStaticVerified: ['https://e-learning.maissara.tech', 'https://cbd.maissara.tech'],
    ssoProtected: true,
    remoteOwnerPreview: stJson.remoteOwnerPreview,
    connected: stJson.connected,
    model: stJson.model,
    qualification: stJson.qualification,
    wrongOriginStatus: badOrigin.status,
    wrongCodeStatus: badCode.status,
    checkpointKind,
    ttsEngine,
    aiAnswerPreview: aiAnswer ? aiAnswer.slice(0, 320) : null
  };
  const outName = opts.expectConnected ? 'remote-preview-live.json' : 'remote-preview-offline.json';
  fs.writeFileSync(path.join(opts.outDir, outName), JSON.stringify(report, null, 2) + '\n');
  console.log('Remote preview check PASS:', JSON.stringify(report));
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
