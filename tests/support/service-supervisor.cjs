'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { runSupervisor } = require('../../tools/service-supervisor.cjs');

const ROOT = path.resolve(__dirname, '../..');
const WAIT_SLEEP = 'setInterval(() => {}, 10000); process.on("SIGTERM", () => process.exit(0));';

async function waitFor(fn, timeoutMs = 4000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await fn()) return true;
    await new Promise(r => setTimeout(r, 40));
  }
  return false;
}

describe('Always-on service supervisor recovery & pilot-users CLI', () => {
  it('auto-restarts crashed gateway and tunnel children, triggers unhealthy probe kill, respects emergency-stop, and keeps logs clean', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'carana-sup-test-'));
    let sup = null;
    try {
      // 1. Respects emergency-stop guard at startup
      fs.writeFileSync(path.join(tmp, 'emergency-stop'), '2026-11-19T00:00:00Z\n', { mode: 0o600 });
      const blocked = await runSupervisor({
        dataDir: tmp,
        port: 18766,
        gatewayCmd: process.execPath,
        gatewayArgs: ['-e', WAIT_SLEEP],
        tunnelCmd: process.execPath,
        tunnelArgs: ['-e', WAIT_SLEEP]
      });
      assert.equal(blocked.started, false);
      assert.equal(blocked.reason, 'emergency-stop');
      fs.unlinkSync(path.join(tmp, 'emergency-stop'));

      // 2. Starts supervisor cleanly with fast test backoffs & controllable probe
      let gwHealthy = true;
      sup = await runSupervisor({
        dataDir: tmp,
        port: 18766,
        gatewayCmd: process.execPath,
        gatewayArgs: ['-e', WAIT_SLEEP],
        tunnelCmd: process.execPath,
        tunnelArgs: ['-e', WAIT_SLEEP],
        probeIntervalMs: 60000,
        probeGraceMs: 1,
        backoffScheduleMs: [40, 80, 120],
        probeGatewayFn: async () => (gwHealthy ? { ok: true, connected: true, memory: { pressureLevel: 1, reclaimableAvailGB: 8 } } : { ok: false, status: 500 }),
        probeTunnelFn: async () => ({ ok: true, publicUrl: 'https://pseudosymptomatic-nicola-bibliopolical.ngrok-free.dev' })
      });
      assert.equal(sup.started, true);

      const firstGwPid = sup.getState().gateway.pid;
      const firstTunPid = sup.getState().tunnel.pid;
      assert.ok(firstGwPid > 0 && firstTunPid > 0);

      // Verify secret & store permissions
      const proxyStat = fs.statSync(path.join(tmp, 'proxy-secret')).mode & 0o777;
      const usersStat = fs.statSync(path.join(tmp, 'users.json')).mode & 0o777;
      assert.equal(proxyStat, 0o600);
      assert.equal(usersStat, 0o600);

      // 3. Kill gateway child -> supervisor respawns automatically
      process.kill(firstGwPid, 'SIGKILL');
      assert.equal(await waitFor(() => sup.getState().gateway.restarts >= 1 && sup.getState().gateway.pid && sup.getState().gateway.pid !== firstGwPid), true);

      // 4. Kill tunnel child -> supervisor respawns automatically
      process.kill(firstTunPid, 'SIGKILL');
      assert.equal(await waitFor(() => sup.getState().tunnel.restarts >= 1 && sup.getState().tunnel.pid && sup.getState().tunnel.pid !== firstTunPid), true);

      // 5. Two failed active health probes -> supervisor kills & respawns hung gateway
      const preProbePid = sup.getState().gateway.pid;
      const preRestarts = sup.getState().gateway.restarts;
      gwHealthy = false;
      await sup.runHealthProbe();
      await sup.runHealthProbe();
      gwHealthy = true;
      assert.equal(await waitFor(() => sup.getState().gateway.restarts > preRestarts && sup.getState().gateway.pid && sup.getState().gateway.pid !== preProbePid), true);

      // 6. Clean graceful drain & stop removes pidFile and writes no secrets to health logs
      await sup.stop('test-complete');
      assert.equal(fs.existsSync(sup.pidFile), false);
      const finalState = JSON.parse(fs.readFileSync(sup.stateFile, 'utf8'));
      assert.equal(finalState.stopReason, 'test-complete');

      const logContent = fs.readFileSync(sup.logPath, 'utf8');
      const proxySecret = fs.readFileSync(path.join(tmp, 'proxy-secret'), 'utf8').trim();
      const ownerToken = fs.readFileSync(path.join(tmp, 'owner-access.txt'), 'utf8').trim();
      assert.equal(logContent.includes(proxySecret), false);
      assert.equal(logContent.includes(ownerToken), false);
      assert.match(logContent, /"event":"child_exited"/);
      assert.match(logContent, /"event":"unhealthy_kill"/);
      assert.match(logContent, /"event":"supervisor_stopped"/);
    } finally {
      if (sup && sup.started) await sup.stop('cleanup').catch(() => {});
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('manages named owner and reviewer credentials cleanly via tools/pilot-users.cjs', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'carana-users-cli-'));
    const storePath = path.join(tmp, 'users.json');
    const cli = path.join(ROOT, 'tools', 'pilot-users.cjs');
    const runCli = args => JSON.parse(execFileSync(process.execPath, [cli, ...args, '--store', storePath], { encoding: 'utf8' }));
    try {
      const init1 = runCli(['init-owner', '--name', 'Owner']);
      assert.equal(init1.userId, 'owner-maissara');
      assert.equal(init1.created, true);
      assert.ok(fs.existsSync(init1.tokenFile));

      const added = runCli(['add', 'denis-rev', 'Denis Reviewer', 'reviewer', '4']);
      assert.equal(added.user.userId, 'denis-rev');
      assert.equal(added.user.rateLimitPerMin, 4);
      assert.ok(added.inviteToken.startsWith('carana-rev-'));

      const listed = runCli(['list']);
      assert.equal(listed.users.length, 2);
      assert.equal(JSON.stringify(listed).includes('tokenHash'), false);
      assert.equal(JSON.stringify(listed).includes(added.inviteToken), false);

      assert.equal(runCli(['revoke', 'denis-rev']).status, 'revoked');
      assert.equal(runCli(['reinstate', 'denis-rev']).status, 'active');
      assert.equal(runCli(['disable-reviewers']).pilotDisabled, true);
      assert.equal(runCli(['enable-reviewers']).pilotDisabled, false);
      assert.equal(runCli(['remove', 'denis-rev']).removed, true);
      assert.equal(runCli(['list']).users.length, 1);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
