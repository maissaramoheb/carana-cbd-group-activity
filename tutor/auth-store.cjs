/* Server-enforced credential & user registry for controlled pilot access.
 * Stores scrypt password hashes + per-user metadata in mode 0o600 JSON outside the repo.
 * Plaintext access codes are never written cleanly to repo or server config after creation.
 */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const DEFAULT_DATA_DIR = path.join(os.homedir(), '.local', 'share', 'carana-ai');
const DEFAULT_STORE_PATH = path.join(DEFAULT_DATA_DIR, 'users.json');
const USER_ID_RE = /^[a-z0-9][a-z0-9._-]{1,39}$/;

const SCRYPT_OPTS = { N: 4096, r: 8, p: 1 };

function hashSecret(rawSecret, saltHex = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(rawSecret), saltHex, 32, SCRYPT_OPTS).toString('hex');
  return `${saltHex}:${hash}`;
}

function verifySecret(rawSecret, storedHash) {
  const parts = String(storedHash || '').split(':');
  if (parts.length !== 2) return false;
  const [saltHex, expectedHex] = parts;
  if (!saltHex || !expectedHex) return false;
  let actual;
  let expected;
  try {
    actual = crypto.scryptSync(String(rawSecret), saltHex, 32, SCRYPT_OPTS);
    expected = Buffer.from(expectedHex, 'hex');
  } catch (_) {
    return false;
  }
  return expected.length === 32 && actual.length === 32 && crypto.timingSafeEqual(actual, expected);
}

function emptyStore() {
  return {
    version: 1,
    pilotDisabled: false,
    users: []
  };
}

function createAuthStore(storePath = DEFAULT_STORE_PATH) {
  const dir = path.dirname(storePath);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(dir, 0o700); } catch (_) {}

  function load() {
    if (!fs.existsSync(storePath)) return emptyStore();
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.users)) {
      throw Error('Invalid user store structure');
    }
    return {
      version: 1,
      pilotDisabled: !!parsed.pilotDisabled,
      users: parsed.users
    };
  }

  function save(data) {
    const tmp = `${storePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 });
    fs.renameSync(tmp, storePath);
    try { fs.chmodSync(storePath, 0o600); } catch (_) {}
  }

  function upsertUser({ userId, displayName, role = 'reviewer', rateLimitPerMin, token = '' }) {
    if (!USER_ID_RE.test(String(userId || ''))) {
      throw Error('Invalid userId (use 2-40 lowercase alphanumeric, dot, underscore, or hyphen characters).');
    }
    if (!['owner', 'reviewer'].includes(role)) {
      throw Error('Invalid role (use owner or reviewer).');
    }
    const cleanName = String(displayName || userId).trim().slice(0, 80);
    const rate = Number.isInteger(rateLimitPerMin) && rateLimitPerMin > 0
      ? Math.min(60, rateLimitPerMin)
      : role === 'owner' ? 20 : 6;
    const rawToken = token || `carana-${role === 'owner' ? 'own' : 'rev'}-${crypto.randomBytes(18).toString('base64url')}`;
    const data = load();
    const now = new Date().toISOString();
    const idx = data.users.findIndex(u => u.userId === userId);
    const record = {
      userId,
      displayName: cleanName,
      role,
      status: 'active',
      rateLimitPerMin: rate,
      tokenHash: hashSecret(rawToken),
      createdAt: idx >= 0 ? data.users[idx].createdAt : now,
      rotatedAt: idx >= 0 ? now : null,
      revokedAt: null,
      lastSeenAt: idx >= 0 ? data.users[idx].lastSeenAt || null : null
    };
    if (idx >= 0) data.users[idx] = record;
    else data.users.push(record);
    save(data);
    return {
      token: rawToken,
      user: {
        userId: record.userId,
        displayName: record.displayName,
        role: record.role,
        status: record.status,
        rateLimitPerMin: record.rateLimitPerMin
      }
    };
  }

  function revokeUser(userId) {
    const data = load();
    const user = data.users.find(u => u.userId === userId);
    if (!user) throw Error('Unknown userId: ' + userId);
    user.status = 'revoked';
    user.revokedAt = new Date().toISOString();
    save(data);
    return { userId: user.userId, status: user.status, revokedAt: user.revokedAt };
  }

  function reinstateUser(userId) {
    const data = load();
    const user = data.users.find(u => u.userId === userId);
    if (!user) throw Error('Unknown userId: ' + userId);
    user.status = 'active';
    user.revokedAt = null;
    save(data);
    return { userId: user.userId, status: user.status };
  }

  function removeUser(userId) {
    const data = load();
    const next = data.users.filter(u => u.userId !== userId);
    if (next.length === data.users.length) throw Error('Unknown userId: ' + userId);
    data.users = next;
    save(data);
    return { userId, removed: true };
  }

  function setPilotDisabled(disabled) {
    const data = load();
    data.pilotDisabled = !!disabled;
    save(data);
    return { pilotDisabled: data.pilotDisabled };
  }

  function listUsers() {
    const data = load();
    return {
      pilotDisabled: data.pilotDisabled,
      users: data.users.map(u => ({
        userId: u.userId,
        displayName: u.displayName,
        role: u.role,
        status: u.status,
        rateLimitPerMin: u.rateLimitPerMin,
        createdAt: u.createdAt,
        rotatedAt: u.rotatedAt || null,
        revokedAt: u.revokedAt || null,
        lastSeenAt: u.lastSeenAt || null
      }))
    };
  }

  let lastTouchWrite = 0;
  function verify(rawToken) {
    const candidate = String(rawToken || '').trim();
    if (!candidate || candidate.length < 8 || candidate.length > 256) {
      return {
        ok: false,
        status: 401,
        code: 'AUTH_INVALID',
        message: 'Access code was not accepted. Check your invitation code.'
      };
    }
    const data = load();
    let matched = null;
    for (const u of data.users) {
      if (verifySecret(candidate, u.tokenHash)) {
        matched = u;
        break;
      }
    }
    if (!matched) {
      return {
        ok: false,
        status: 401,
        code: 'AUTH_INVALID',
        message: 'Access code was not accepted. Check your invitation code.'
      };
    }
    if (matched.status === 'revoked') {
      return {
        ok: false,
        status: 403,
        code: 'ACCESS_REVOKED',
        message: 'Your access code has been revoked by the course administrator.'
      };
    }
    if (data.pilotDisabled && matched.role !== 'owner') {
      return {
        ok: false,
        status: 503,
        code: 'PILOT_DISABLED',
        message: 'The invited reviewer pilot is currently disabled by the course owner.'
      };
    }
    const now = Date.now();
    if (now - lastTouchWrite > 30000) {
      lastTouchWrite = now;
      matched.lastSeenAt = new Date(now).toISOString();
      try { save(data); } catch (_) {}
    }
    return {
      ok: true,
      user: {
        userId: matched.userId,
        displayName: matched.displayName,
        role: matched.role,
        rateLimitPerMin: matched.rateLimitPerMin || 6
      }
    };
  }

  function statusSummary() {
    const data = load();
    return {
      configured: data.users.length > 0,
      pilotDisabled: data.pilotDisabled,
      activeReviewers: data.users.filter(u => u.role === 'reviewer' && u.status === 'active').length,
      activeOwners: data.users.filter(u => u.role === 'owner' && u.status === 'active').length
    };
  }

  return {
    storePath,
    upsertUser,
    revokeUser,
    reinstateUser,
    removeUser,
    setPilotDisabled,
    listUsers,
    verify,
    statusSummary
  };
}

module.exports = {
  createAuthStore,
  hashSecret,
  verifySecret,
  DEFAULT_DATA_DIR,
  DEFAULT_STORE_PATH
};
