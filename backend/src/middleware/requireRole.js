import { getSession } from '../lib/auth.js';

function extractToken(req) {
  const header = req.headers['x-session-token'];
  if (header) return header;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return req.body?.token || req.query?.token || null;
}

/**
 * Attaches req.session if a valid token is present. Does not itself reject
 * the request — use requireRole() for that. Useful for endpoints (like the
 * shared payslip PDF download) where the required role differs per record.
 */
export function attachSession(req, res, next) {
  const token = extractToken(req);
  req.token = token;
  req.session = getSession(token);
  next();
}

/** Rejects the request unless a valid session with the given role is present. */
export function requireRole(role) {
  return (req, res, next) => {
    const token = extractToken(req);
    req.token = token;
    const session = getSession(token);
    if (!session) {
      return res.status(401).json({ message: 'SESSION_EXPIRED' });
    }
    if (session.role !== role) {
      return res.status(403).json({ message: 'UNAUTHORIZED' });
    }
    req.session = session;
    next();
  };
}
