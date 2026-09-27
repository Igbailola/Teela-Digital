/* ============================================================
   TOKENS — signed links for double opt-in and unsubscribe
   Stateless: the payload travels in the URL, signed with HMAC-SHA256
   and given an expiry. No session storage, no database.
   ============================================================ */

import crypto from 'node:crypto';

const ALGORITHM = 'sha256';

/**
 * @param {Buffer} buf
 * @returns {string}
 */
function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * @param {string} value
 * @returns {Buffer}
 */
function unb64url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded + '='.repeat((4 - (padded.length % 4)) % 4), 'base64');
}

/**
 * Create a signed, expiring token.
 * @param {Record<string, unknown>} payload
 * @param {string} secret
 * @param {number} ttlMs
 * @returns {string} token of the form base64url(json).base64url(sig)
 */
export function signToken(payload, secret, ttlMs) {
  const body = b64url(Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlMs }), 'utf8'));
  const signature = b64url(crypto.createHmac(ALGORITHM, secret).update(body).digest());
  return `${body}.${signature}`;
}

/**
 * Verify a token and return its payload.
 * @param {string} token
 * @param {string} secret
 * @returns {Record<string, unknown>|null} null when invalid, forged or expired
 */
export function verifyToken(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return null;

  const [body, signature] = token.split('.', 2);
  if (!body || !signature) return null;

  const expected = b64url(crypto.createHmac(ALGORITHM, secret).update(body).digest());

  // Constant-time compare so a forged signature cannot be probed
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(unb64url(body).toString('utf8'));
  } catch {
    return null;
  }

  if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;

  return payload;
}
