#!/usr/bin/env node
/* Named-user pilot credential management CLI (stored outside repo in ~/.local/share/carana-ai/users.json). */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createAuthStore, DEFAULT_DATA_DIR, DEFAULT_STORE_PATH } = require('../tutor/auth-store.cjs');

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
  return { cmd: positional[0] || 'help', args: positional.slice(1), flags };
}

function usage() {
  return [
    'Usage: node tools/pilot-users.cjs <command> [args] [--store <path>]',
    '  init-owner [--name "Maissara"] [--rate 20] [--rotate] [--out <file>] [--print-token]',
    '  add <userId> "<displayName>" [role=reviewer] [rate=6] [--out <file>]',
    '  revoke <userId>',
    '  reinstate <userId>',
    '  remove <userId>',
    '  disable-reviewers',
    '  enable-reviewers',
    '  list'
  ].join('\n');
}

function main() {
  const { cmd, args, flags } = parseArgs(process.argv.slice(2));
  const storePath = flags.store ? path.resolve(flags.store) : DEFAULT_STORE_PATH;
  const store = createAuthStore(storePath);

  if (cmd === 'init-owner') {
    const existing = store.listUsers().users.find(u => u.userId === 'owner-maissara' && u.status === 'active');
    const outFile = flags.out ? path.resolve(flags.out) : path.join(path.dirname(storePath), 'owner-access.txt');
    if (existing && !flags.rotate && fs.existsSync(outFile)) {
      console.log(JSON.stringify({
        userId: existing.userId,
        displayName: existing.displayName,
        role: existing.role,
        rateLimitPerMin: existing.rateLimitPerMin,
        created: false,
        rotated: false,
        tokenFile: outFile
      }));
      return;
    }
    const rate = flags.rate ? Number(flags.rate) : 20;
    const res = store.upsertUser({
      userId: 'owner-maissara',
      displayName: flags.name ? String(flags.name) : 'Maissara (Course Owner)',
      role: 'owner',
      rateLimitPerMin: rate
    });
    fs.mkdirSync(path.dirname(outFile), { recursive: true, mode: 0o700 });
    fs.writeFileSync(outFile, res.token + '\n', { mode: 0o600 });
    try { fs.chmodSync(outFile, 0o600); } catch (_) {}
    const out = {
      userId: res.user.userId,
      displayName: res.user.displayName,
      role: res.user.role,
      rateLimitPerMin: res.user.rateLimitPerMin,
      created: !existing,
      rotated: !!existing,
      tokenFile: outFile
    };
    if (flags['print-token']) out.token = res.token;
    console.log(JSON.stringify(out));
    return;
  }

  if (cmd === 'add') {
    const userId = args[0];
    const displayName = args[1] || userId;
    const role = String(flags.role || args[2] || 'reviewer');
    const rate = flags.rate ? Number(flags.rate) : (args[3] ? Number(args[3]) : undefined);
    if (!userId) throw Error('Missing <userId>.');
    const res = store.upsertUser({ userId, displayName, role, rateLimitPerMin: rate });
    if (flags.out) {
      const outFile = path.resolve(flags.out);
      fs.mkdirSync(path.dirname(outFile), { recursive: true, mode: 0o700 });
      fs.writeFileSync(outFile, res.token + '\n', { mode: 0o600 });
      try { fs.chmodSync(outFile, 0o600); } catch (_) {}
      console.log(JSON.stringify({ user: res.user, tokenFile: outFile }));
    } else {
      console.log(JSON.stringify({ user: res.user, inviteToken: res.token }));
    }
    return;
  }

  if (cmd === 'revoke') {
    if (!args[0]) throw Error('Missing <userId>.');
    console.log(JSON.stringify(store.revokeUser(args[0])));
    return;
  }

  if (cmd === 'reinstate') {
    if (!args[0]) throw Error('Missing <userId>.');
    console.log(JSON.stringify(store.reinstateUser(args[0])));
    return;
  }

  if (cmd === 'remove') {
    if (!args[0]) throw Error('Missing <userId>.');
    console.log(JSON.stringify(store.removeUser(args[0])));
    return;
  }

  if (cmd === 'disable-reviewers') {
    console.log(JSON.stringify(store.setPilotDisabled(true)));
    return;
  }

  if (cmd === 'enable-reviewers') {
    console.log(JSON.stringify(store.setPilotDisabled(false)));
    return;
  }

  if (cmd === 'list') {
    console.log(JSON.stringify(store.listUsers(), null, 2));
    return;
  }

  console.error(usage());
  process.exitCode = cmd === 'help' ? 0 : 1;
}

try {
  main();
} catch (err) {
  console.error(err.message || String(err));
  process.exitCode = 1;
}
