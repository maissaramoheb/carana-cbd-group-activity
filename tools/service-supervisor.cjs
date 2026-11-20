#!/usr/bin/env node
/* Always-on local supervisor for CARANA loopback gateway + persistent authenticated ngrok tunnel.
 * Designed for macOS launchd (KeepAlive, RunAtLoad) with crash recovery, active health probes,
 * persistent 0600 secrets/credentials outside the repo, and privacy-safe rotating JSONL health logs.
 */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const crypto = require('node:crypto');
const readline = require('node:readline');
const { spawn } = require('node:child_process');
const { createAuthStore, DEFAULT_DATA_DIR } = require('../tutor/auth-store.cjs');
const { defaultMemoryCheck } = require('../tutor/gateway.cjs');

const DEFAULT_PORT = 8766;
const DEFAULT_MODEL = 'carana-gemma4-text';
const DEFAULT_QUALIFICATION = 'controlled-pilot-review-pending';
const DEFAULT_TUNNEL_DOMAIN = 'pseudosymptomatic-nicola-bibliopolical.ngrok-free.dev';
const MAX_LOG_BYTES = 5 * 1024 * 1024;
const SENSITIVE_KEYS = new Set(['token', 'secret', 'authorization', 'question', 'answer', 'prompt', 'text', 'inviteToken', 'proxySecret']);

function ensureSecureDir(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(dir, 0o700); } catch (_) {}
}

function writeAtomic(filePath, content, mode = 0o600) {
  const tmp = `${filePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmp, content, { mode });
  fs.renameSync(tmp, filePath);
  try { fs.chmodSync(filePath, mode); } catch (_) {}
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err && err.code === 'EPERM';
  }
}

function sanitizeEvent(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (SENSITIVE_KEYS.has(k)) continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = sanitizeEvent(v);
    else out[k] = v;
  }
  return out;
}

function createHealthLogger(logsDir) {
  ensureSecureDir(logsDir);
  const logPath = path.join(logsDir, 'health.jsonl');
  function rotateIfNeeded() {
    try {
      const st = fs.statSync(logPath);
      if (st.size < MAX_LOG_BYTES) return;
      const b2 = logPath + '.2';
      const b1 = logPath + '.1';
      if (fs.existsSync(b2)) fs.unlinkSync(b2);
      if (fs.existsSync(b1)) fs.renameSync(b1, b2);
      fs.renameSync(logPath, b1);
    } catch (_) {}
  }
  return function log(event, fields = {}) {
    rotateIfNeeded();
    const record = sanitizeEvent({ ts: new Date().toISOString(), event, ...fields });
    fs.appendFileSync(logPath, JSON.stringify(record) + '\n', { mode: 0o600 });
    return record;
  };
}

function ensurePersistentSecrets(dataDir) {
  ensureSecureDir(dataDir);
  const proxySecretPath = path.join(dataDir, 'proxy-secret');
  let proxySecret = '';
  if (fs.existsSync(proxySecretPath)) {
    proxySecret = fs.readFileSync(proxySecretPath, 'utf8').trim();
  }
  if (!proxySecret || proxySecret.length < 32) {
    proxySecret = crypto.randomBytes(32).toString('hex');
    writeAtomic(proxySecretPath, proxySecret + '\n', 0o600);
  }
  const usersPath = path.join(dataDir, 'users.json');
  const store = createAuthStore(usersPath);
  const ownerTokenPath = path.join(dataDir, 'owner-access.txt');
  const existingOwner = store.listUsers().users.find(u => u.userId === 'owner-maissara' && u.status === 'active');
  if (!existingOwner || !fs.existsSync(ownerTokenPath)) {
    const created = store.upsertUser({
      userId: 'owner-maissara',
      displayName: 'Maissara (Course Owner)',
      role: 'owner',
      rateLimitPerMin: 20
    });
    writeAtomic(ownerTokenPath, created.token + '\n', 0o600);
  }
  return { proxySecret, proxySecretPath, usersPath, ownerTokenPath };
}

function defaultProbeGateway(port) {
  return new Promise(resolve => {
    const req = https.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/health',
        method: 'GET',
        rejectUnauthorized: false,
        timeout: 4000
      },
      res => {
        let body = '';
        res.on('data', d => { body += d; });
        res.on('end', () => {
          if (res.statusCode !== 200) return resolve({ ok: false, status: res.statusCode });
          try {
            const j = JSON.parse(body);
            resolve({ ok: !!j.ok, connected: !!j.connected, memory: j.memory || null, activeInference: !!j.activeInference, queueDepth: j.queueDepth || 0 });
          } catch (_) {
            resolve({ ok: false, status: 500 });
          }
        });
      }
    );
    req.on('error', () => resolve({ ok: false }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false }); });
    req.end();
  });
}

function defaultProbeTunnel(apiUrl, expectedUrl) {
  return new Promise(resolve => {
    let parsed;
    try { parsed = new URL(apiUrl); } catch (_) { return resolve({ ok: false }); }
    const mod = parsed.protocol === 'https:' ? https : http;
    const req = mod.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'GET',
        timeout: 3000
      },
      res => {
        let body = '';
        res.on('data', d => { body += d; });
        res.on('end', () => {
          if (res.statusCode !== 200) return resolve({ ok: false, status: res.statusCode });
          try {
            const j = JSON.parse(body);
            const tunnels = Array.isArray(j.tunnels) ? j.tunnels : [];
            const match = tunnels.find(t => String(t.public_url || '').toLowerCase() === expectedUrl.toLowerCase());
            resolve({ ok: !!match, publicUrl: match ? match.public_url : '' });
          } catch (_) {
            resolve({ ok: false });
          }
        });
      }
    );
    req.on('error', () => resolve({ ok: false }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false }); });
    req.end();
  });
}

async function runSupervisor(options = {}) {
  const dataDir = path.resolve(options.dataDir || process.env.CARANA_DATA_DIR || DEFAULT_DATA_DIR);
  const logsDir = path.join(dataDir, 'logs');
  const emergencyStopFile = path.join(dataDir, 'emergency-stop');
  const pidFile = path.join(dataDir, 'supervisor.pid');
  const stateFile = path.join(dataDir, 'supervisor-state.json');

  ensureSecureDir(dataDir);
  const log = createHealthLogger(logsDir);

  if (fs.existsSync(emergencyStopFile)) {
    log('supervisor_blocked', { component: 'supervisor', reason: 'emergency-stop' });
    return { started: false, reason: 'emergency-stop', stateFile, logPath: path.join(logsDir, 'health.jsonl') };
  }

  if (fs.existsSync(pidFile)) {
    const oldPid = Number(fs.readFileSync(pidFile, 'utf8').trim());
    if (oldPid && oldPid !== process.pid && isPidAlive(oldPid)) {
      throw Error('CARANA supervisor is already running with PID ' + oldPid);
    }
  }
  writeAtomic(pidFile, String(process.pid) + '\n', 0o600);

  const port = Number(options.port || process.env.CARANA_PORT || DEFAULT_PORT);
  const model = String(options.model || process.env.CARANA_MODEL || DEFAULT_MODEL);
  const qualification = String(options.qualification || process.env.CARANA_QUALIFICATION || DEFAULT_QUALIFICATION);
  const tunnelDomain = String(options.tunnelDomain || process.env.CARANA_TUNNEL_DOMAIN || DEFAULT_TUNNEL_DOMAIN);
  const tunnelUrl = 'https://' + tunnelDomain;
  const ngrokEnabled = options.ngrokEnabled !== undefined ? !!options.ngrokEnabled : process.env.CARANA_DISABLE_NGROK !== '1';
  const ngrokBin = String(
    options.ngrokBin ||
    process.env.NGROK_BIN ||
    (fs.existsSync('/opt/homebrew/bin/ngrok') ? '/opt/homebrew/bin/ngrok' : 'ngrok')
  );
  const ngrokApiUrl = String(options.ngrokApiUrl || process.env.CARANA_NGROK_API_URL || 'http://127.0.0.1:4040/api/tunnels');
  const gatewayScript = path.resolve(options.gatewayScript || path.join(__dirname, '..', 'tutor', 'gateway.cjs'));
  const maxQueue = Number(options.maxQueue ?? process.env.CARANA_MAX_QUEUE ?? 4);
  const idleUnloadMs = Number(options.idleUnloadMs ?? process.env.CARANA_IDLE_UNLOAD_MS ?? 240000);
  const allowedExtraHosts = String(options.allowedExtraHosts ?? process.env.CARANA_ALLOWED_PILOT_HOSTS ?? '');
  const probeIntervalMs = Number(options.probeIntervalMs || 20000);
  const probeGraceMs = Number(options.probeGraceMs || 15000);
  const backoffScheduleMs = Array.isArray(options.backoffScheduleMs) ? options.backoffScheduleMs : [1000, 2000, 5000, 10000, 30000];
  const probeGateway = options.probeGatewayFn || (() => defaultProbeGateway(port));
  const probeTunnel = options.probeTunnelFn || (() => defaultProbeTunnel(ngrokApiUrl, tunnelUrl));

  const secrets = ensurePersistentSecrets(dataDir);

  let stopping = false;
  let stopPromise = null;
  let probeTimer = null;
  let checks = 0;

  const state = {
    supervisorPid: process.pid,
    startedAt: new Date().toISOString(),
    stoppedAt: null,
    stopReason: null,
    port,
    model,
    qualification,
    tunnelUrl: ngrokEnabled ? tunnelUrl : null,
    gateway: { pid: null, restarts: 0, failures: 0, probeFailures: 0, healthy: false, spawnedAtMs: 0, lastHealthyAt: null, lastExitCode: null, lastExitSignal: null },
    tunnel: { enabled: ngrokEnabled, pid: null, restarts: 0, failures: 0, probeFailures: 0, healthy: false, spawnedAtMs: 0, lastHealthyAt: null, lastExitCode: null, lastExitSignal: null },
    lastMemory: null
  };

  const procs = { gateway: null, tunnel: null };
  const respawnTimers = { gateway: null, tunnel: null };

  function saveState() {
    const snapshot = {
      ...state,
      gateway: { ...state.gateway },
      tunnel: { ...state.tunnel }
    };
    try {
      writeAtomic(stateFile, JSON.stringify(snapshot, null, 2) + '\n', 0o600);
    } catch (_) {}
  }

  function scheduleRespawn(role) {
    if (stopping || respawnTimers[role]) return;
    if (fs.existsSync(emergencyStopFile)) {
      stop('emergency-stop').catch(() => {});
      return;
    }
    const entry = state[role];
    const idx = Math.min(Math.max(0, entry.failures - 1), backoffScheduleMs.length - 1);
    const delayMs = backoffScheduleMs[idx];
    log('respawn_scheduled', { component: role, delayMs, failures: entry.failures });
    respawnTimers[role] = setTimeout(() => {
      respawnTimers[role] = null;
      if (!stopping && !fs.existsSync(emergencyStopFile)) {
        entry.restarts++;
        spawnRole(role);
      }
    }, delayMs);
    if (respawnTimers[role].unref) respawnTimers[role].unref();
  }

  function killChild(role) {
    const child = procs[role];
    if (!child || child.exitCode !== null || child.killed) return Promise.resolve();
    return new Promise(resolve => {
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          clearTimeout(forceTimer);
          resolve();
        }
      };
      child.once('exit', finish);
      const forceTimer = setTimeout(() => {
        try { child.kill('SIGKILL'); } catch (_) {}
        finish();
      }, 4500);
      if (forceTimer.unref) forceTimer.unref();
      try { child.kill('SIGTERM'); } catch (_) { finish(); }
    });
  }

  function spawnRole(role) {
    if (stopping) return;
    if (role === 'tunnel' && !ngrokEnabled) return;
    let cmd;
    let args;
    let env = { ...process.env };
    if (role === 'gateway') {
      cmd = options.gatewayCmd || process.execPath;
      args = options.gatewayArgs || [gatewayScript];
      env = {
        ...env,
        CARANA_PORT: String(port),
        CARANA_MODEL: model,
        CARANA_QUALIFICATION: qualification,
        CARANA_PROXY_SECRET: secrets.proxySecret,
        CARANA_USERS_FILE: secrets.usersPath,
        CARANA_PERSISTENT_DIR: dataDir,
        CARANA_MAX_QUEUE: String(maxQueue),
        CARANA_IDLE_UNLOAD_MS: String(idleUnloadMs),
        CARANA_ALLOWED_PILOT_HOSTS: allowedExtraHosts
      };
    } else {
      cmd = options.tunnelCmd || ngrokBin;
      args = options.tunnelArgs || ['http', `https://127.0.0.1:${port}`, `--url=${tunnelDomain}`, '--log=stdout', '--log-format=json'];
    }

    const child = spawn(cmd, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    procs[role] = child;
    const entry = state[role];
    entry.pid = child.pid || null;
    entry.spawnedAtMs = Date.now();
    entry.probeFailures = 0;
    entry.healthy = false;
    saveState();
    log('child_started', { component: role, pid: child.pid });

    if (role === 'gateway') {
      const rlErr = readline.createInterface({ input: child.stderr });
      rlErr.on('line', line => {
        if (line.startsWith('[telemetry] ')) {
          try {
            const ev = JSON.parse(line.slice(12));
            log('gateway_telemetry', { component: 'gateway', ...ev });
          } catch (_) {}
        }
      });
      const rlOut = readline.createInterface({ input: child.stdout });
      rlOut.on('line', line => {
        if (line.startsWith('{')) {
          log('gateway_bound', { component: 'gateway', pid: child.pid });
        }
      });
    } else {
      const rlOut = readline.createInterface({ input: child.stdout });
      rlOut.on('line', line => {
        try {
          const parsed = JSON.parse(line);
          if (parsed.msg === 'started tunnel' && parsed.url) {
            log('tunnel_started_msg', { component: 'tunnel', url: parsed.url });
          } else if (parsed.lvl === 'eror' || parsed.lvl === 'crit') {
            log('tunnel_error_msg', { component: 'tunnel', err: String(parsed.err || parsed.msg || '').slice(0, 160) });
          }
        } catch (_) {}
      });
    }

    child.on('exit', (code, signal) => {
      if (procs[role] === child) procs[role] = null;
      const aliveMs = Date.now() - entry.spawnedAtMs;
      entry.pid = null;
      entry.healthy = false;
      entry.lastExitCode = code;
      entry.lastExitSignal = signal;
      if (aliveMs > 60000) entry.failures = code === 0 ? 0 : 1;
      else entry.failures++;
      saveState();
      log('child_exited', { component: role, code, signal, aliveMs });
      if (!stopping) scheduleRespawn(role);
    });
  }

  async function runHealthProbe() {
    if (stopping) return;
    if (fs.existsSync(emergencyStopFile)) {
      await stop('emergency-stop');
      return;
    }
    checks++;
    const now = Date.now();

    if (procs.gateway && procs.gateway.exitCode === null) {
      const g = await probeGateway();
      if (g.ok) {
        state.gateway.healthy = true;
        state.gateway.probeFailures = 0;
        if (now - state.gateway.spawnedAtMs > 60000) state.gateway.failures = 0;
        state.gateway.lastHealthyAt = new Date(now).toISOString();
        if (g.memory) state.lastMemory = g.memory;
      } else if (now - state.gateway.spawnedAtMs >= probeGraceMs) {
        state.gateway.healthy = false;
        state.gateway.probeFailures++;
        log('probe_failed', { component: 'gateway', consecutive: state.gateway.probeFailures, status: g.status || null });
        if (state.gateway.probeFailures >= 2) {
          log('unhealthy_kill', { component: 'gateway', pid: state.gateway.pid });
          await killChild('gateway');
        }
      }
    }

    if (ngrokEnabled && procs.tunnel && procs.tunnel.exitCode === null) {
      const t = await probeTunnel();
      if (t.ok) {
        state.tunnel.healthy = true;
        state.tunnel.probeFailures = 0;
        if (now - state.tunnel.spawnedAtMs > 60000) state.tunnel.failures = 0;
        state.tunnel.lastHealthyAt = new Date(now).toISOString();
      } else if (now - state.tunnel.spawnedAtMs >= probeGraceMs) {
        state.tunnel.healthy = false;
        state.tunnel.probeFailures++;
        log('probe_failed', { component: 'tunnel', consecutive: state.tunnel.probeFailures });
        if (state.tunnel.probeFailures >= 2) {
          log('unhealthy_kill', { component: 'tunnel', pid: state.tunnel.pid });
          await killChild('tunnel');
        }
      }
    }

    if (!state.lastMemory) {
      try { state.lastMemory = defaultMemoryCheck(); } catch (_) {}
    }
    if (checks % 15 === 0) {
      log('health_heartbeat', {
        component: 'supervisor',
        gatewayHealthy: state.gateway.healthy,
        gatewayRestarts: state.gateway.restarts,
        tunnelHealthy: state.tunnel.healthy,
        tunnelRestarts: state.tunnel.restarts,
        pressureLevel: state.lastMemory ? state.lastMemory.pressureLevel : null,
        reclaimableAvailGB: state.lastMemory ? state.lastMemory.reclaimableAvailGB : null
      });
    }
    saveState();
  }

  function stop(reason = 'signal') {
    if (stopPromise) return stopPromise;
    stopping = true;
    stopPromise = (async () => {
      if (probeTimer) clearInterval(probeTimer);
      for (const k of ['gateway', 'tunnel']) {
        if (respawnTimers[k]) {
          clearTimeout(respawnTimers[k]);
          respawnTimers[k] = null;
        }
      }
      log('supervisor_stopping', { component: 'supervisor', reason });
      await Promise.all([killChild('tunnel'), killChild('gateway')]);
      state.stoppedAt = new Date().toISOString();
      state.stopReason = reason;
      state.gateway.pid = null;
      state.gateway.healthy = false;
      state.tunnel.pid = null;
      state.tunnel.healthy = false;
      saveState();
      try {
        if (fs.existsSync(pidFile) && Number(fs.readFileSync(pidFile, 'utf8').trim()) === process.pid) {
          fs.unlinkSync(pidFile);
        }
      } catch (_) {}
      log('supervisor_stopped', { component: 'supervisor', reason });
    })();
    return stopPromise;
  }

  log('supervisor_starting', { component: 'supervisor', pid: process.pid, port, model, qualification, ngrokEnabled, tunnelUrl: ngrokEnabled ? tunnelUrl : null });
  spawnRole('gateway');
  if (ngrokEnabled) spawnRole('tunnel');

  probeTimer = setInterval(() => {
    runHealthProbe().catch(() => {});
  }, probeIntervalMs);
  if (probeTimer.unref) probeTimer.unref();

  return {
    started: true,
    dataDir,
    stateFile,
    pidFile,
    logPath: path.join(logsDir, 'health.jsonl'),
    getState: () => ({ ...state, gateway: { ...state.gateway }, tunnel: { ...state.tunnel } }),
    runHealthProbe,
    stop
  };
}

if (require.main === module) {
  (async () => {
    const sup = await runSupervisor();
    if (!sup.started) {
      console.error('Supervisor not started:', sup.reason);
      process.exit(0);
    }
    const handleSig = sig => {
      sup.stop(sig).then(() => process.exit(0), () => process.exit(1));
    };
    process.on('SIGTERM', () => handleSig('SIGTERM'));
    process.on('SIGINT', () => handleSig('SIGINT'));
  })().catch(err => {
    console.error(err.message || String(err));
    process.exit(1);
  });
}

module.exports = { runSupervisor, ensurePersistentSecrets, isPidAlive, DEFAULT_TUNNEL_DOMAIN };
