#!/usr/bin/env node
/* Owner remote preview launcher:
 * 1. Generates CSPRNG owner access code + server-side proxy secret (stored 0600 in OS tmpdir; never committed).
 * 2. Starts loopback HTTPS gateway (127.0.0.1:8766) with Ollama & Mac neural TTS.
 * 3. Opens outbound-only encrypted cloudflared quick tunnel -> 127.0.0.1:8766.
 * 4. Optionally syncs Vercel PREVIEW-ONLY env vars (CARANA_AI_ENABLED, CARANA_UPSTREAM_URL, CARANA_PROXY_SECRET,
 *    CARANA_MODEL, CARANA_QUALIFICATION) via stdin so nothing touches production or process args.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dns = require('node:dns').promises;
const { spawn, execFileSync } = require('node:child_process');
const { start, ALLOWED_MODELS } = require('../tutor/gateway.cjs');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const opts = {
    port: Number(process.env.CARANA_PORT || 8766),
    model: process.env.CARANA_MODEL || 'gemma4:26b',
    qualification: process.env.CARANA_QUALIFICATION || 'owner-pilot',
    syncVercel: false,
    deploy: false,
    keepProductionOff: true
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--port' && argv[i + 1]) opts.port = Number(argv[++i]);
    else if (a === '--model' && argv[i + 1]) opts.model = argv[++i];
    else if (a === '--qualification' && argv[i + 1]) opts.qualification = argv[++i];
    else if (a === '--sync-vercel') opts.syncVercel = true;
    else if (a === '--deploy') { opts.syncVercel = true; opts.deploy = true; }
  }
  return opts;
}

function setVercelPreviewEnv(name, value) {
  try {
    execFileSync('vercel', ['env', 'rm', name, 'preview', '-y'], { cwd: ROOT, stdio: 'ignore' });
  } catch (_) {}
  execFileSync('vercel', ['env', 'add', name, 'preview'], {
    cwd: ROOT,
    input: String(value),
    stdio: ['pipe', 'ignore', 'pipe']
  });
}

(async () => {
  const opts = parseArgs(process.argv.slice(2));
  if (!ALLOWED_MODELS.test(opts.model)) {
    throw Error('Unsupported model: ' + opts.model);
  }

  const proxySecret = crypto.randomBytes(32).toString('hex');
  const accessToken = process.env.CARANA_OWNER_ACCESS_CODE || crypto.randomBytes(20).toString('base64url');
  const { server, record } = await start({
    port: opts.port,
    model: opts.model,
    qualification: opts.qualification,
    proxySecret,
    token: accessToken
  });

  const secretFile = path.join(record.privateDirectory, 'proxy-secret.txt');
  fs.writeFileSync(secretFile, proxySecret, { mode: 0o600 });

  const cloudflaredBin = process.env.CLOUDFLARED_BIN || 'cloudflared';
  const cf = spawn(
    cloudflaredBin,
    ['tunnel', '--url', 'https://127.0.0.1:' + opts.port, '--protocol', 'http2', '--no-tls-verify', '--no-autoupdate'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  const tunnelUrl = await new Promise((resolve, reject) => {
    let settled = false, urlSeen = '', registered = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(Error('Timed out waiting for cloudflared tunnel URL.'));
      }
    }, 30000);
    const onChunk = chunk => {
      const s = chunk.toString('utf8');
      const m = s.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (m) urlSeen = m[0];
      if (/Registered tunnel connection/i.test(s)) registered = true;
      if (urlSeen && registered && !settled) {
        settled = true;
        clearTimeout(timer);
        resolve(urlSeen);
      }
    };
    cf.stdout.on('data', onChunk);
    cf.stderr.on('data', onChunk);
    cf.on('exit', code => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(Error('cloudflared exited unexpectedly with code ' + code));
      }
    });
  });

  // Poll authoritative Cloudflare NS directly first so OS/ISP DNS never negative-caches NXDOMAIN early
  const resolver = new dns.Resolver();
  const nsIps = await dns.resolve4('kevin.ns.cloudflare.com').catch(() => ['108.162.193.127']);
  resolver.setServers(nsIps);
  const tunnelHost = new URL(tunnelUrl).hostname;
  for (let i = 0; i < 35; i++) {
    try {
      const recs = await resolver.resolve4(tunnelHost);
      if (recs && recs.length) break;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 1000));
  }
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
  if (!edgeReady) throw Error('Tunnel URL allocated but did not propagate on Cloudflare edge in time.');

  const remoteInfo = {
    localUrl: record.url,
    tunnelUrl,
    model: opts.model,
    qualification: opts.qualification,
    privateDirectory: record.privateDirectory,
    tokenFile: record.tokenFile,
    proxySecretFile: secretFile,
    startedAt: new Date().toISOString()
  };
  const infoPath = path.join(record.privateDirectory, 'tunnel-runtime.json');
  fs.writeFileSync(infoPath, JSON.stringify(remoteInfo, null, 2), { mode: 0o600 });

  if (opts.syncVercel) {
    setVercelPreviewEnv('CARANA_AI_ENABLED', 'true');
    setVercelPreviewEnv('CARANA_UPSTREAM_URL', tunnelUrl);
    setVercelPreviewEnv('CARANA_PROXY_SECRET', proxySecret);
    setVercelPreviewEnv('CARANA_MODEL', opts.model);
    setVercelPreviewEnv('CARANA_QUALIFICATION', opts.qualification);
    console.error('[remote-tutor] Synced Vercel PREVIEW-ONLY env vars (production untouched).');
  }

  let deployedPreviewUrl = null;
  if (opts.deploy) {
    execFileSync(process.execPath, ['tools/release/prepare-ai-preview.cjs'], { cwd: ROOT, stdio: 'inherit' });
    deployedPreviewUrl = execFileSync('vercel', ['deploy', '--prebuilt', '--yes'], { cwd: ROOT, encoding: 'utf8' }).trim().split(/\s+/).pop();
    remoteInfo.deployedPreviewUrl = deployedPreviewUrl;
    fs.writeFileSync(infoPath, JSON.stringify(remoteInfo, null, 2), { mode: 0o600 });
  }

  console.log(JSON.stringify({
    ready: true,
    localUrl: record.url,
    tunnelUrl,
    deployedPreviewUrl,
    model: opts.model,
    qualification: opts.qualification,
    tokenFile: record.tokenFile,
    infoFile: infoPath,
    syncedVercelPreview: opts.syncVercel
  }));

  console.error('\nCARANA Remote Owner Tunnel Ready (Mac mini Loopback + Outbound HTTPS Tunnel)');
  console.error('  Model         : ' + opts.model + ' (' + opts.qualification + ')');
  console.error('  Local URL     : ' + record.url + '/platform/?course=cbd&lesson=cbd-1');
  if (deployedPreviewUrl) console.error('  Remote Preview: ' + deployedPreviewUrl + '/platform/?course=cbd&lesson=cbd-1');
  console.error('  Copy Code Cmd : pbcopy < ' + record.tokenFile);
  console.error('  Press Ctrl+C to close both the tunnel and local AI gateway.\n');

  let closing = false;
  const shutdown = async () => {
    if (closing) return;
    closing = true;
    try { cf.kill('SIGTERM'); } catch (_) {}
    await new Promise(r => server.close(r));
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})().catch(e => {
  console.error(e.message || String(e));
  process.exit(1);
});
