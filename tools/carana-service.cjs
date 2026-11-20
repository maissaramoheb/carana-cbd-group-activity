#!/usr/bin/env node
/* Owner operational control CLI for CARANA always-on local AI service, launchd agent,
 * emergency shutdown, Ollama memory unloading, and persistent isolated Vercel Owner Pilot sync.
 */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const https = require('node:https');
const { execFileSync } = require('node:child_process');
const { DEFAULT_DATA_DIR, createAuthStore } = require('../tutor/auth-store.cjs');
const { defaultMemoryCheck } = require('../tutor/gateway.cjs');
const { ensurePersistentSecrets, isPidAlive, DEFAULT_TUNNEL_DOMAIN } = require('./service-supervisor.cjs');

const ROOT = path.resolve(__dirname, '..');
const LABEL = 'com.carana.cbd.ai';
const DEFAULT_PORT = 8766;
const DEFAULT_MODEL = 'carana-gemma4-text';
const DEFAULT_QUALIFICATION = 'controlled-pilot-review-pending';
const PRODUCTION_DOMAINS = ['e-learning.maissara.tech', 'cbd.maissara.tech'];

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (argv[i + 1] && !argv[i + 1].startsWith('--')) flags[k] = argv[++i];
      else flags[k] = true;
    } else {
      positional.push(a);
    }
  }
  return { cmd: positional[0] || 'status', args: positional.slice(1), flags };
}

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function resolveBin(name, candidates) {
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return name;
}

function pathsFor(dataDir = DEFAULT_DATA_DIR) {
  const dir = path.resolve(dataDir);
  return {
    dataDir: dir,
    runtimeDir: path.join(dir, 'runtime'),
    logsDir: path.join(dir, 'logs'),
    healthLog: path.join(dir, 'logs', 'health.jsonl'),
    stdoutLog: path.join(dir, 'logs', 'launchd-stdout.log'),
    stderrLog: path.join(dir, 'logs', 'launchd-stderr.log'),
    emergencyFile: path.join(dir, 'emergency-stop'),
    pidFile: path.join(dir, 'supervisor.pid'),
    stateFile: path.join(dir, 'supervisor-state.json'),
    proxySecretFile: path.join(dir, 'proxy-secret'),
    ownerTokenFile: path.join(dir, 'owner-access.txt'),
    usersFile: path.join(dir, 'users.json'),
    previewMetaFile: path.join(dir, 'owner-pilot-preview.json'),
    plistPath: path.join(os.homedir(), 'Library', 'LaunchAgents', LABEL + '.plist'),
    domainTarget: 'gui/' + process.getuid(),
    serviceTarget: 'gui/' + process.getuid() + '/' + LABEL
  };
}

function copyTreeClean(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true, mode: 0o700 });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      if (entry.name.startsWith('.DS_Store')) continue;
      copyTreeClean(path.join(src, entry.name), path.join(dst, entry.name));
    }
  } else if (st.isFile()) {
    fs.mkdirSync(path.dirname(dst), { recursive: true, mode: 0o700 });
    fs.writeFileSync(dst, fs.readFileSync(src), { mode: st.mode & 0o777 });
  }
}

function syncRuntimeMirror(runtimeDir) {
  const staging = runtimeDir + '.staging-' + process.pid;
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(path.join(staging, 'tools'), { recursive: true, mode: 0o700 });
  for (const rel of ['package.json', 'tools/service-supervisor.cjs', 'tools/pilot-users.cjs', 'tools/kokoro-synth.py']) {
    copyTreeClean(path.join(ROOT, rel), path.join(staging, rel));
  }
  copyTreeClean(path.join(ROOT, 'tutor'), path.join(staging, 'tutor'));
  if (fs.existsSync(path.join(ROOT, 'dist'))) {
    copyTreeClean(path.join(ROOT, 'dist'), path.join(staging, 'dist'));
  }
  fs.rmSync(runtimeDir, { recursive: true, force: true });
  fs.renameSync(staging, runtimeDir);
  return runtimeDir;
}

function buildPlistXml(cfg) {
  const runtimeRoot = cfg.runtimeDir || ROOT;
  const supervisorScript = path.join(runtimeRoot, 'tools', 'service-supervisor.cjs');
  const nodeDir = path.dirname(process.execPath);
  const env = {
    HOME: os.homedir(),
    PATH: [nodeDir, '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'].join(':'),
    CARANA_DATA_DIR: cfg.dataDir,
    CARANA_PORT: String(cfg.port),
    CARANA_MODEL: cfg.model,
    CARANA_QUALIFICATION: cfg.qualification,
    CARANA_TUNNEL_DOMAIN: cfg.tunnelDomain,
    CARANA_MAX_QUEUE: String(cfg.maxQueue),
    CARANA_IDLE_UNLOAD_MS: String(cfg.idleUnloadMs)
  };
  const envXml = Object.entries(env)
    .map(([k, v]) => `      <key>${xmlEscape(k)}</key>\n      <string>${xmlEscape(v)}</string>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${xmlEscape(process.execPath)}</string>
    <string>${xmlEscape(supervisorScript)}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${xmlEscape(runtimeRoot)}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>15</integer>
  <key>ExitTimeOut</key>
  <integer>20</integer>
  <key>ProcessType</key>
  <string>Background</string>
  <key>StandardOutPath</key>
  <string>${xmlEscape(cfg.stdoutLog)}</string>
  <key>StandardErrorPath</key>
  <string>${xmlEscape(cfg.stderrLog)}</string>
  <key>EnvironmentVariables</key>
  <dict>
${envXml}
  </dict>
</dict>
</plist>
`;
}

function launchctlQuiet(args) {
  try {
    return { ok: true, out: execFileSync('launchctl', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (err) {
    return { ok: false, out: String(err.stderr || err.message || '') };
  }
}

function runOllamaStop(model) {
  const ollama = resolveBin('ollama', ['/usr/local/bin/ollama', '/opt/homebrew/bin/ollama']);
  try {
    execFileSync(ollama, ['stop', model], { encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'pipe'] });
    return { unloaded: true, model };
  } catch (err) {
    return { unloaded: false, model, detail: String(err.stderr || err.message || '').trim() };
  }
}

function ensureTextOnlyModel(model) {
  if (model !== 'carana-gemma4-text') return { ensured: false, reason: 'stock-model' };
  const ollama = resolveBin('ollama', ['/usr/local/bin/ollama', '/opt/homebrew/bin/ollama']);
  try {
    execFileSync(ollama, ['show', model], { encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'ignore'] });
    return { ensured: true, created: false };
  } catch (_) {}
  const modelsRoot = process.env.OLLAMA_MODELS || path.join(os.homedir(), '.ollama', 'models');
  const manifestFile = path.join(modelsRoot, 'manifests', 'registry.ollama.ai', 'library', 'gemma4', '26b');
  if (!fs.existsSync(manifestFile)) throw Error('Cannot build carana-gemma4-text: gemma4:26b manifest not found');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const layer = (manifest.layers || []).find(l => l.mediaType === 'application/vnd.ollama.image.model');
  if (!layer || !/^sha256:[0-9a-f]{64}$/i.test(layer.digest || '')) throw Error('Invalid gemma4:26b model layer digest');
  const blobPath = path.join(modelsRoot, 'blobs', layer.digest.replace(':', '-'));
  if (!fs.existsSync(blobPath)) throw Error('Missing gemma4:26b primary blob: ' + blobPath);
  const tmpFile = path.join(os.tmpdir(), 'carana-Modelfile-' + process.pid);
  try {
    fs.writeFileSync(
      tmpFile,
      `FROM ${blobPath}\nTEMPLATE {{ .Prompt }}\nRENDERER gemma4\nPARSER gemma4\nPARAMETER temperature 0\nPARAMETER num_ctx 3072\n`,
      { mode: 0o600 }
    );
    execFileSync(ollama, ['create', model, '-f', tmpFile], { encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] });
    return { ensured: true, created: true };
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

function getOllamaPs() {
  const ollama = resolveBin('ollama', ['/usr/local/bin/ollama', '/opt/homebrew/bin/ollama']);
  try {
    const out = execFileSync(ollama, ['ps'], { encoding: 'utf8', timeout: 5000 }).trim();
    const lines = out.split('\n').slice(1).filter(Boolean);
    return { reachable: true, loadedModels: lines };
  } catch (err) {
    return { reachable: false, loadedModels: [], error: String(err.message || '').trim() };
  }
}

function probeLocalHealth(port) {
  return new Promise(resolve => {
    const req = https.request(
      { hostname: '127.0.0.1', port, path: '/api/health', method: 'GET', rejectUnauthorized: false, timeout: 3000 },
      res => {
        let b = '';
        res.on('data', d => { b += d; });
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(b) }); }
          catch (_) { resolve({ status: res.statusCode, body: null }); }
        });
      }
    );
    req.on('error', () => resolve({ status: 0, body: null }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: null }); });
    req.end();
  });
}

async function probeRemoteTunnel(tunnelUrl, proxySecretFile) {
  const headers = { 'ngrok-skip-browser-warning': '1' };
  if (proxySecretFile && fs.existsSync(proxySecretFile)) {
    const sec = fs.readFileSync(proxySecretFile, 'utf8').trim();
    if (sec) headers['X-CARANA-Proxy-Secret'] = sec;
  }
  try {
    const res = await fetch(tunnelUrl + '/api/tutor/status', {
      headers,
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return { ok: false, status: res.status };
    const body = await res.json();
    return { ok: true, status: res.status, connected: !!body.connected, model: body.model, qualification: body.qualification };
  } catch (_) {
    return { ok: false, status: 0 };
  }
}

async function waitForReady(port, tunnelUrl, proxySecretFile, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const local = await probeLocalHealth(port);
    if (local.status === 200 && local.body && local.body.ok) {
      if (!tunnelUrl) return { local, remote: null };
      const remote = await probeRemoteTunnel(tunnelUrl, proxySecretFile);
      if (remote.ok && remote.connected) return { local, remote };
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return { local: await probeLocalHealth(port), remote: tunnelUrl ? await probeRemoteTunnel(tunnelUrl, proxySecretFile) : null };
}

function terminateRecordedProcesses(p) {
  const pids = new Set();
  if (fs.existsSync(p.pidFile)) {
    const n = Number(fs.readFileSync(p.pidFile, 'utf8').trim());
    if (Number.isInteger(n) && n > 0) pids.add(n);
  }
  if (fs.existsSync(p.stateFile)) {
    try {
      const s = JSON.parse(fs.readFileSync(p.stateFile, 'utf8'));
      for (const id of [s.supervisorPid, s.gateway && s.gateway.pid, s.tunnel && s.tunnel.pid]) {
        if (Number.isInteger(id) && id > 0) pids.add(id);
      }
    } catch (_) {}
  }
  const killed = [];
  for (const pid of pids) {
    if (isPidAlive(pid)) {
      try {
        process.kill(pid, 'SIGTERM');
        killed.push(pid);
      } catch (_) {}
    }
  }
  return killed;
}

function setVercelEnv(name, value, targetEnv = 'preview') {
  const vercel = resolveBin('vercel', ['/opt/homebrew/bin/vercel', '/usr/local/bin/vercel']);
  try {
    execFileSync(vercel, ['env', 'rm', name, targetEnv, '-y'], { cwd: ROOT, stdio: 'ignore' });
  } catch (_) {}
  execFileSync(vercel, ['env', 'add', name, targetEnv], {
    cwd: ROOT,
    input: String(value),
    stdio: ['pipe', 'ignore', 'pipe']
  });
}

function syncVercelEnvironment(targetEnv, { proxySecret, tunnelUrl, model, qualification }) {
  const vercel = resolveBin('vercel', ['/opt/homebrew/bin/vercel', '/usr/local/bin/vercel']);
  setVercelEnv('CARANA_AI_ENABLED', 'true', targetEnv);
  setVercelEnv('CARANA_UPSTREAM_URL', tunnelUrl, targetEnv);
  setVercelEnv('CARANA_PROXY_SECRET', proxySecret, targetEnv);
  setVercelEnv('CARANA_MODEL', model, targetEnv);
  setVercelEnv('CARANA_QUALIFICATION', qualification, targetEnv);
  try { execFileSync(vercel, ['env', 'rm', 'CARANA_PILOT_DISABLED', targetEnv, '-y'], { cwd: ROOT, stdio: 'ignore' }); } catch (_) {}
}

function runVercelDeploy({ p, tunnelUrl, model, qualification, isProd, targetLabel }) {
  const { proxySecret } = ensurePersistentSecrets(p.dataDir);
  const vercel = resolveBin('vercel', ['/opt/homebrew/bin/vercel', '/usr/local/bin/vercel']);
  const targetEnv = isProd ? 'production' : 'preview';
  syncVercelEnvironment(targetEnv, { proxySecret, tunnelUrl, model, qualification });

  const prepArgs = ['tools/release/prepare-ai-preview.cjs'];
  if (isProd) prepArgs.push('--production');
  else if (targetLabel) prepArgs.push('--target', targetLabel);
  execFileSync(process.execPath, prepArgs, { cwd: ROOT, stdio: 'inherit' });

  const deployArgs = isProd ? ['deploy', '--prebuilt', '--prod', '--yes'] : ['deploy', '--prebuilt', '--yes'];
  const deployOut = execFileSync(vercel, deployArgs, { cwd: ROOT, encoding: 'utf8' });
  const urls = deployOut.match(/https:\/\/[a-z0-9.-]+\.vercel\.app/gi);
  if (!urls || !urls.length) throw Error('Could not parse Vercel deployment URL from output: ' + deployOut);
  const deploymentUrl = urls[urls.length - 1];

  const aliasedDomains = [];
  if (isProd) {
    for (const domain of PRODUCTION_DOMAINS) {
      execFileSync(vercel, ['alias', 'set', deploymentUrl, domain], { cwd: ROOT, stdio: 'inherit' });
      aliasedDomains.push(domain);
    }
  }

  const meta = {
    deployedAt: new Date().toISOString(),
    deploymentUrl,
    previewUrl: deploymentUrl,
    tunnelUrl,
    model,
    qualification,
    environment: isProd ? 'production (both custom domains updated)' : 'preview-only (production untouched)',
    domains: aliasedDomains
  };
  const outMetaFile = isProd ? path.join(p.dataDir, 'production-release.json') : p.previewMetaFile;
  fs.writeFileSync(outMetaFile, JSON.stringify(meta, null, 2) + '\n', { mode: 0o600 });
  return meta;
}

async function gatherStatus(p, port, tunnelUrl) {
  const loaded = launchctlQuiet(['print', p.serviceTarget]).ok;
  const emergencyStopped = fs.existsSync(p.emergencyFile);
  let state = null;
  if (fs.existsSync(p.stateFile)) {
    try { state = JSON.parse(fs.readFileSync(p.stateFile, 'utf8')); } catch (_) {}
  }
  const supervisorPid = fs.existsSync(p.pidFile) ? Number(fs.readFileSync(p.pidFile, 'utf8').trim()) : null;
  const supervisorAlive = !!supervisorPid && isPidAlive(supervisorPid);
  const localHealth = await probeLocalHealth(port);
  const remoteStatus = tunnelUrl ? await probeRemoteTunnel(tunnelUrl, p.proxySecretFile) : null;
  const ollama = getOllamaPs();
  const memory = defaultMemoryCheck();
  const auth = fs.existsSync(p.usersFile) ? createAuthStore(p.usersFile).statusSummary() : { configured: false };
  let preview = null;
  if (fs.existsSync(p.previewMetaFile)) {
    try { preview = JSON.parse(fs.readFileSync(p.previewMetaFile, 'utf8')); } catch (_) {}
  }
  return {
    label: LABEL,
    launchdLoaded: loaded,
    plistInstalled: fs.existsSync(p.plistPath),
    emergencyStopped,
    supervisorAlive,
    supervisorPid: supervisorAlive ? supervisorPid : null,
    localHealth: localHealth.status === 200 ? localHealth.body : { ok: false, status: localHealth.status },
    remoteTunnel: tunnelUrl ? { url: tunnelUrl, ...remoteStatus } : null,
    ollama,
    memory,
    authSummary: auth,
    ownerTokenFile: fs.existsSync(p.ownerTokenFile) ? p.ownerTokenFile : null,
    healthLog: fs.existsSync(p.healthLog) ? p.healthLog : null,
    state,
    preview
  };
}

async function main() {
  const { cmd, flags } = parseArgs(process.argv.slice(2));
  const dataDir = flags['data-dir'] || process.env.CARANA_DATA_DIR || DEFAULT_DATA_DIR;
  const port = Number(flags.port || process.env.CARANA_PORT || DEFAULT_PORT);
  const model = String(flags.model || process.env.CARANA_MODEL || DEFAULT_MODEL);
  const qualification = String(flags.qualification || process.env.CARANA_QUALIFICATION || DEFAULT_QUALIFICATION);
  const tunnelDomain = String(flags['tunnel-domain'] || process.env.CARANA_TUNNEL_DOMAIN || DEFAULT_TUNNEL_DOMAIN);
  const tunnelUrl = 'https://' + tunnelDomain;
  const maxQueue = Number(flags['max-queue'] || process.env.CARANA_MAX_QUEUE || 4);
  const idleUnloadMs = Number(flags['idle-unload-ms'] || process.env.CARANA_IDLE_UNLOAD_MS || 240000);
  const p = pathsFor(dataDir);

  if (cmd === 'enable') {
    fs.mkdirSync(p.dataDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(p.logsDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(path.dirname(p.plistPath), { recursive: true });
    if (fs.existsSync(p.emergencyFile)) fs.unlinkSync(p.emergencyFile);
    ensurePersistentSecrets(p.dataDir);
    ensureTextOnlyModel(model);
    if (model !== 'gemma4:26b') runOllamaStop('gemma4:26b');
    launchctlQuiet(['bootout', p.serviceTarget]);
    terminateRecordedProcesses(p);
    await new Promise(r => setTimeout(r, 800));
    syncRuntimeMirror(p.runtimeDir);
    const xml = buildPlistXml({ ...p, port, model, qualification, tunnelDomain, maxQueue, idleUnloadMs });
    fs.writeFileSync(p.plistPath, xml, { mode: 0o644 });
    launchctlQuiet(['enable', p.serviceTarget]);
    const boot = launchctlQuiet(['bootstrap', p.domainTarget, p.plistPath]);
    if (!boot.ok) throw Error('launchctl bootstrap failed: ' + boot.out);
    const ready = await waitForReady(port, tunnelUrl, p.proxySecretFile, 35000);
    const st = await gatherStatus(p, port, tunnelUrl);
    console.log(JSON.stringify({ action: 'enable', ready, status: st }, null, 2));
    return;
  }

  if (cmd === 'disable') {
    launchctlQuiet(['bootout', p.serviceTarget]);
    launchctlQuiet(['disable', p.serviceTarget]);
    if (fs.existsSync(p.plistPath)) fs.unlinkSync(p.plistPath);
    const killed = terminateRecordedProcesses(p);
    await new Promise(r => setTimeout(r, 800));
    console.log(JSON.stringify({ action: 'disable', plistRemoved: true, signaledPids: killed }));
    return;
  }

  if (cmd === 'emergency-stop') {
    fs.mkdirSync(p.dataDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(p.emergencyFile, new Date().toISOString() + '\n', { mode: 0o600 });
    launchctlQuiet(['bootout', p.serviceTarget]);
    launchctlQuiet(['disable', p.serviceTarget]);
    if (fs.existsSync(p.plistPath)) fs.unlinkSync(p.plistPath);
    const killed = terminateRecordedProcesses(p);
    await new Promise(r => setTimeout(r, 1200));
    const unload = runOllamaStop(model);
    console.log(JSON.stringify({
      action: 'emergency-stop',
      emergencyFile: p.emergencyFile,
      signaledPids: killed,
      ollamaUnload: unload,
      note: 'Service stopped and auto-start disabled. Run "npm run ai:enable" to re-authorize.'
    }, null, 2));
    return;
  }

  if (cmd === 'start' || cmd === 'restart') {
    if (!fs.existsSync(p.plistPath)) {
      throw Error('LaunchAgent is not installed. Run "node tools/carana-service.cjs enable" first.');
    }
    if (fs.existsSync(p.emergencyFile)) {
      throw Error('Emergency stop guard is active. Run "node tools/carana-service.cjs enable" to clear and start.');
    }
    const isLoaded = launchctlQuiet(['print', p.serviceTarget]).ok;
    const res = isLoaded
      ? launchctlQuiet(cmd === 'restart' ? ['kickstart', '-k', p.serviceTarget] : ['kickstart', p.serviceTarget])
      : launchctlQuiet(['bootstrap', p.domainTarget, p.plistPath]);
    if (!res.ok) throw Error('launchctl ' + cmd + ' failed: ' + res.out);
    const ready = await waitForReady(port, tunnelUrl, p.proxySecretFile, 35000);
    console.log(JSON.stringify({ action: cmd, ready }, null, 2));
    return;
  }

  if (cmd === 'stop') {
    launchctlQuiet(['bootout', p.serviceTarget]);
    const killed = terminateRecordedProcesses(p);
    await new Promise(r => setTimeout(r, 800));
    console.log(JSON.stringify({ action: 'stop', signaledPids: killed }));
    return;
  }

  if (cmd === 'unload') {
    const unload = runOllamaStop(model);
    console.log(JSON.stringify({ action: 'unload', ...unload, memory: defaultMemoryCheck(), ollama: getOllamaPs() }, null, 2));
    return;
  }

  if (cmd === 'logs') {
    const lines = Math.max(1, Math.min(500, Number(flags.lines || 40)));
    if (!fs.existsSync(p.healthLog)) {
      console.log('[]');
      return;
    }
    const raw = fs.readFileSync(p.healthLog, 'utf8').trim().split('\n').filter(Boolean);
    console.log(raw.slice(-lines).join('\n'));
    return;
  }

  if (cmd === 'deploy-owner-pilot' || cmd === 'deploy-candidate') {
    const meta = runVercelDeploy({
      p,
      tunnelUrl,
      model,
      qualification,
      isProd: false,
      targetLabel: cmd === 'deploy-candidate' ? 'controlled-production-pilot-candidate' : 'isolated-owner-ai-preview'
    });
    console.log(JSON.stringify(meta, null, 2));
    return;
  }

  if (cmd === 'deploy-production') {
    const meta = runVercelDeploy({
      p,
      tunnelUrl,
      model,
      qualification,
      isProd: true,
      targetLabel: 'controlled-production-pilot'
    });
    console.log(JSON.stringify(meta, null, 2));
    return;
  }

  if (cmd === 'status') {
    console.log(JSON.stringify(await gatherStatus(p, port, tunnelUrl), null, 2));
    return;
  }

  throw Error('Unknown command: ' + cmd);
}

main().catch(err => {
  console.error(err.message || String(err));
  process.exit(1);
});
