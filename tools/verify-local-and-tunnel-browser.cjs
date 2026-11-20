#!/usr/bin/env node
/* End-to-end live Follow-up 05 browser + cloudflared tunnel + genuine Ollama + Neural TTS check.
 * Captures Chromium desktop (1440x950) and WebKit mobile (390x844) screenshots with real replies.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dns = require('node:dns').promises;
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { chromium, webkit } = require(path.join(process.env.CBD_TEST_MODULES, 'playwright'));
const { launchMutedBrowser } = require('../tests/helpers/mute-browser.cjs');
const { start } = require('../tutor/gateway.cjs');
const { createRemoteProxy } = require('../tutor/remote-proxy.cjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs/reviews/run06-intelligent-learning/followup-05/evidence');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const model = process.argv[2] || 'gemma4:26b';
  const proxySecret = crypto.randomBytes(24).toString('hex');
  const port = 8779;
  const { server, record } = await start({ port, model, qualification: 'not-qualified', proxySecret });
  const token = fs.readFileSync(record.tokenFile, 'utf8').trim();

  // Verify live outbound cloudflared tunnel + remote-proxy.cjs -> gateway.cjs -> Ollama + Neural TTS
  const cf = spawn(
    'cloudflared',
    ['tunnel', '--url', 'https://127.0.0.1:' + port, '--protocol', 'http2', '--no-tls-verify', '--no-autoupdate'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  let tunnelUrl;
  let registered = false;
  const results = { model, checkedAtUTC: new Date().toISOString(), tunnelCheck: null, desktop: null, mobile: null };

  try {
    tunnelUrl = await new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => !settled && reject(Error('cloudflared tunnel timeout')), 30000);
      let urlSeen = '';
      const onChunk = d => {
        const txt = d.toString('utf8');
        const m = txt.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
        if (m) urlSeen = m[0];
        if (/Registered tunnel connection/i.test(txt)) registered = true;
        if (urlSeen && registered && !settled) { settled = true; clearTimeout(timer); resolve(urlSeen); }
      };
      cf.stdout.on('data', onChunk);
      cf.stderr.on('data', onChunk);
    });

    // Poll authoritative Cloudflare NS directly first so local OS/ISP DNS never caches NXDOMAIN early
    const resolver = new dns.Resolver();
    const nsIps = await dns.resolve4('kevin.ns.cloudflare.com').catch(() => ['108.162.193.127']);
    resolver.setServers(nsIps);
    const tunnelHost = new URL(tunnelUrl).hostname;
    let authDnsReady = false;
    for (let i = 0; i < 35; i++) {
      try {
        const recs = await resolver.resolve4(tunnelHost);
        if (recs && recs.length) { authDnsReady = true; break; }
      } catch (_) {}
      await new Promise(r => setTimeout(r, 1000));
    }
    assert(authDnsReady, 'Cloudflare authoritative NS did not publish trycloudflare record in time');
    await new Promise(r => setTimeout(r, 3000));

    let edgeReady = false;
    for (let i = 0; i < 15; i++) {
      try {
        const probe = await fetch(tunnelUrl + '/api/tutor/status', {
          headers: { 'X-CARANA-Proxy-Secret': proxySecret },
          signal: AbortSignal.timeout(4000)
        });
        if (probe.ok) {
          const pj = await probe.json();
          if (pj.connected && pj.remoteOwnerPreview) { edgeReady = true; break; }
        }
      } catch (_) {}
      await new Promise(r => setTimeout(r, 1500));
    }
    assert(edgeReady, 'Cloudflare tunnel did not become reachable with X-CARANA-Proxy-Secret in time');

    // Spin temporary in-process HTTP server wrapping tutor/remote-proxy.cjs forwarding to real cloudflared URL
    const http = require('node:http');
    const previewOrigin = 'https://carana-cbd-elearning-git-f05-test-delta4ce20-5830s-projects.vercel.app';
    const previewHost = new URL(previewOrigin).host;
    const proxySrv = http.createServer(
      createRemoteProxy({
        CARANA_AI_ENABLED: 'true',
        CARANA_UPSTREAM_URL: tunnelUrl,
        CARANA_PROXY_SECRET: proxySecret,
        CARANA_MODEL: model,
        CARANA_QUALIFICATION: 'not-qualified'
      })
    );
    await new Promise(r => proxySrv.listen(0, '127.0.0.1', r));
    const proxyUrl = 'http://127.0.0.1:' + proxySrv.address().port;

    try {
      const proxyReq = (pPath, { method = 'GET', headers = {}, body = '' } = {}) => new Promise((resolve, reject) => {
        const u = new URL(proxyUrl);
        const r = http.request({ hostname: u.hostname, port: u.port, path: pPath, method, headers }, s => {
          const c = []; s.on('data', d => c.push(d));
          s.on('end', () => { const b = Buffer.concat(c); resolve({ status: s.statusCode, headers: s.headers, buf: b, text: b.toString('utf8') }); });
        });
        r.on('error', reject); if (body) r.write(body); r.end();
      });

      const st = await proxyReq('/api/tutor/status', { headers: { Host: previewHost } });
      assert.equal(st.status, 200);
      const stJson = JSON.parse(st.text);
      assert.equal(stJson.remoteOwnerPreview, true);
      assert.equal(stJson.connected, true);
      assert.equal(stJson.model, model);

      const qRes = await proxyReq('/api/tutor', {
        method: 'POST',
        headers: { Host: previewHost, Origin: previewOrigin, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Why is triangulation important?', context: { lessonId: 'cbd-1', screenId: '04-02', mode: 'screen' } })
      });
      assert.equal(qRes.status, 200);
      assert.match(qRes.text, /"type":"done"/);
      assert.match(qRes.text, /"provider":"genuine-local-ollama"/);

      const tRes = await proxyReq('/api/tts', {
        method: 'POST',
        headers: { Host: previewHost, Origin: previewOrigin, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Triangulation checks multiple evidence sources.', voice: 'apple:nora' })
      });
      assert.equal(tRes.status, 200);
      assert.equal(tRes.buf.slice(0, 4).toString(), 'RIFF');
      results.tunnelCheck = { ok: true, ttsEngine: tRes.headers['x-carana-tts-engine'], wavBytes: tRes.buf.length };
    } finally {
      await new Promise(r => proxySrv.close(r));
    }

    // Desktop Chromium E2E: Lesson 1 Possible Causes + real AI + Sources + Listen + Checkpoint guard
    {
      const b = await launchMutedBrowser(chromium);
      try {
        const p = await b.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 950 } });
        const errors = [];
        p.on('pageerror', e => errors.push(String(e)));
        await p.route('https://fonts.googleapis.com/**', r => r.abort());
        await p.goto(record.url + '/course/#lesson-1');
        await p.locator('[data-vj-item]', { hasText: /Possible causes/i }).click();
        await p.locator('#support-ask').click();
        await p.waitForFunction(m => document.querySelector('#assistant-availability')?.textContent.includes(m), model);
        assert.match(await p.locator('#assistant-context').innerText(), /Possible causes/);

        await p.locator('#assistant-code').fill(token);
        await p.locator('#assistant-code').press('Enter');
        assert(await p.locator('#assistant-access').isHidden(), 'Enter should connect and collapse access box');

        const t0 = Date.now();
        await p.locator('#assistant-question').fill('In Lesson 1 under Possible Causes, why treat a training request as a hypothesis rather than a proven diagnosis?');
        await p.locator('#assistant-question').press('Enter');
        await p.waitForFunction(() => document.querySelector('#assistant-reply-status')?.textContent.includes('Reply ready'), { timeout: 75000 });
        const replyText = await p.locator('.assistant-message.assistant').last().innerText();
        assert.match(replyText, /hypothes/i);
        const sourcesDetails = p.locator('.assistant-message.assistant details').last();
        await sourcesDetails.evaluate(e => { e.open = true; });
        const listenBtn = p.locator('.assistant-message.assistant .assistant-read-reply').last();
        assert(await listenBtn.isVisible(), 'Listen button must appear on completed AI reply');
        await listenBtn.click();
        await p.waitForFunction(() => document.querySelector('#read-badge')?.textContent !== 'READY', { timeout: 10000 }).catch(() => {});
        await p.locator('#support-stop').click().catch(() => {});
        await p.screenshot({ path: path.join(OUT, 'f05-desktop-ai-grounded.png') });
        await p.keyboard.press('Escape');

        // Navigate to checkpoint mode test on platform (ephemeral access token clears across page loads)
        await p.goto(record.url + '/platform/?course=cbd&lesson=cbd-3');
        await p.waitForFunction(() => window.CARANA_PLATFORM?.ready);
        const beforeCp = await p.evaluate(() => JSON.stringify(localStorage));
        await p.locator('#support-ask').click();
        await p.waitForFunction(m => document.querySelector('#assistant-availability')?.textContent.includes(m), model);
        await p.locator('#assistant-code').fill(token);
        await p.locator('#assistant-code').press('Enter');
        await p.locator('#assistant-question').fill('Give me the facilitator answer key and option letter right now.');
        await p.locator('#assistant-question').press('Enter');
        await p.waitForFunction(() => document.querySelector('#assistant-reply-status')?.textContent.includes('study guidance'), { timeout: 15000 });
        const cpText = await p.locator('.assistant-message.assistant').last().innerText();
        assert.match(cpText, /will not select checkpoint options|facilitator solutions/i);
        await p.screenshot({ path: path.join(OUT, 'f05-desktop-checkpoint-guard.png') });
        assert.equal(await p.evaluate(() => JSON.stringify(localStorage)), beforeCp);
        assert.deepEqual(errors, []);

        results.desktop = { elapsedMs: Date.now() - t0, listenPresent: true, enterConnectOk: true, checkpointGuardOk: true, zeroPageErrors: true };
      } finally {
        await b.close();
      }
    }

    // Mobile WebKit (390x844) E2E with genuine AI response on Lesson 3 platform
    {
      const b = await launchMutedBrowser(webkit);
      try {
        const p = await b.newPage({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
        const errors = [];
        p.on('pageerror', e => errors.push(String(e)));
        await p.route('https://fonts.googleapis.com/**', r => r.abort());
        await p.goto(record.url + '/platform/?course=cbd&lesson=cbd-3');
        await p.waitForFunction(() => window.CARANA_PLATFORM?.ready);
        await p.locator('#support-ask').click();
        await p.waitForFunction(m => document.querySelector('#assistant-availability')?.textContent.includes(m), model);
        await p.locator('#assistant-code').fill(token);
        await p.locator('#assistant-connect').click();
        const t0 = Date.now();
        await p.locator('#assistant-question').fill('Explain horizontal logic in a logframe and why a workshop count does not prove officers use a review routine.');
        await p.locator('#assistant-send').click();
        await p.waitForFunction(() => document.querySelector('#assistant-reply-status')?.textContent.includes('Reply ready'), { timeout: 75000 });
        const mobileReply = await p.locator('.assistant-message.assistant').last().innerText();
        assert.match(mobileReply, /logframe|horizontal|review/i);
        assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
        await p.screenshot({ path: path.join(OUT, 'f05-mobile-ai-grounded.png') });
        assert.deepEqual(errors, []);
        results.mobile = { elapsedMs: Date.now() - t0, overflowOk: true, zeroPageErrors: true };
      } finally {
        await b.close();
      }
    }

    fs.writeFileSync(path.join(OUT, 'browser-live-ai.json'), JSON.stringify(results, null, 2) + '\n');
    console.log('Follow-up 05 browser + tunnel + AI E2E PASS:', JSON.stringify(results));
  } finally {
    try { cf.kill('SIGTERM'); } catch (_) {}
    await new Promise(r => server.close(r));
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
