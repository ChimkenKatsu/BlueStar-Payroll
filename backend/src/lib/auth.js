import crypto from 'crypto';

// Static pepper mixed into every hash, same role as SALT in the Apps Script version.
const SALT = 'BlueStar-Payroll-v1';
const SESSION_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

export function hashPassword(plainText) {
  return crypto.createHash('sha256').update(SALT + plainText, 'utf8').digest('hex');
}

/**
 * Supports legacy plaintext rows too, so an admin can hand-type a password
 * straight into db.json and it still works on first login (auto-upgraded to
 * a hash the moment that account logs in successfully).
 */
export function verifyPassword(plainText, storedValue) {
  if (storedValue === plainText) return true;
  return hashPassword(plainText) === storedValue;
}

// ------------------------------------------------------------------
// SESSION MANAGEMENT
// ------------------------------------------------------------------
// The Apps Script version stored sessions in CacheService because Apps
// Script web apps are stateless per request. A plain Node/Express server is
// a long-lived process, so an in-memory Map is the direct equivalent and
// needs no extra infrastructure. Swap for Redis if you need multi-instance
// deployments.

const sessions = new Map(); // token -> { role, id, name, expiresAt }

export function createSession(role, id, name) {
  const token = crypto.randomUUID();
  sessions.set(token, { role, id, name, expiresAt: Date.now() + SESSION_DURATION_MS });
  return token;
}

export function getSession(token) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function destroySession(token) {
  if (token) sessions.delete(token);
}

/** Periodically sweep expired sessions so the Map doesn't grow unbounded. */
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now > session.expiresAt) sessions.delete(token);
  }
}, 15 * 60 * 1000).unref();
