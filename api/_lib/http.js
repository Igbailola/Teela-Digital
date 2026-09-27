/* ============================================================
   HTTP — shared plumbing for the /api functions
   Response helpers, body parsing, origin checks and a small
   in-memory rate limiter. No dependencies: Node 18+ fetch only.
   ============================================================ */

/**
 * Send a JSON response.
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {object} payload
 */
export function json(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

/**
 * Reject any method outside the allowed set.
 * @param {object} req
 * @param {import('node:http').ServerResponse} res
 * @param {string[]} methods
 * @returns {boolean} true when the request may proceed
 */
export function allowMethods(req, res, methods) {
  if (methods.includes(req.method)) return true;

  res.setHeader('Allow', methods.join(', '));
  json(res, 405, { error: 'method_not_allowed' });
  return false;
}

/**
 * Read and parse a JSON request body. Handles hosts that pre-parse
 * the body (Vercel, Netlify) and raw Node streams alike.
 * @param {object} req
 * @returns {Promise<object|null>}
 */
export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  if (typeof req.body === 'string' && req.body) {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return null;

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
}

const LOOPBACK = /^(localhost|127\.(\d+\.){2}\d+|\[?::1\]?|0\.0\.0\.0)(:\d+)?$/;

/**
 * The origin this request was made to, used to build the links that
 * go out in emails. Derived from the request so it is correct on every
 * host and on preview deployments without any configuration.
 * @param {object} req
 * @returns {string}
 */
export function originOf(req) {
  const headers = req.headers || {};
  const host = headers['x-forwarded-host'] || headers.host;

  if (host) {
    const hostname = String(host).split(',')[0].trim();
    const forwardedProto = headers['x-forwarded-proto'];
    const proto = String(forwardedProto || '').split(',')[0].trim()
      || (LOOPBACK.test(hostname) ? 'http' : 'https');
    return `${proto}://${hostname}`;
  }

  return process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
}

/**
 * Whether the request came from a page on this same origin. Blocks
 * cross-site form posts from third-party pages.
 * @param {object} req
 * @returns {boolean}
 */
export function isSameOrigin(req) {
  const origin = req.headers?.origin;
  if (!origin) return true; // same-origin fetches may omit it

  try {
    return new URL(origin).host === originOf(req).replace(/^https?:\/\//, '');
  } catch {
    return false;
  }
}

/**
 * Best-effort client identifier for rate limiting.
 * @param {object} req
 * @returns {string}
 */
export function clientKey(req) {
  const headers = req.headers || {};
  const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown';
  return String(ip).split(',')[0].trim();
}

const buckets = new Map();

/**
 * Fixed-window rate limiter, held in memory.
 *
 * This is per-instance, so it is a speed bump rather than a hard
 * guarantee: on serverless each instance keeps its own counters.
 * That is acceptable here because the forms also carry a honeypot
 * and the upstream provider does its own throttling.
 *
 * @param {string} key
 * @param {number} limit  Max requests per window
 * @param {number} windowMs
 * @returns {{ok: boolean, retryAfter: number}} retryAfter is in seconds
 */
export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * Read a query string parameter. Hosted platforms usually populate
 * `req.query`; a plain Node server does not, so fall back to parsing
 * `req.url`.
 * @param {object} req
 * @param {string} name
 * @returns {string|null}
 */
export function queryParam(req, name) {
  const provided = req.query?.[name];
  if (typeof provided === 'string' && provided) return provided;

  try {
    const url = new URL(req.url, 'http://localhost');
    return url.searchParams.get(name);
  } catch {
    return null;
  }
}

/**
 * Send the visitor's browser somewhere else.
 * @param {import('node:http').ServerResponse} res
 * @param {string} location
 */
export function redirect(res, location) {
  res.writeHead(302, { Location: location, 'Cache-Control': 'no-store' });
  res.end();
}

/**
 * Escape a value for safe interpolation into email HTML.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Normalise free text from a form into a plain, single-line-ish string.
 * @param {unknown} value
 * @param {number} maxLength
 * @returns {string}
 */
export function cleanText(value, maxLength) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/**
 * Normalise a multi-line message, capping each line's length.
 * @param {unknown} value
 * @param {number} maxLength
 * @returns {string}
 */
export function cleanMessage(value, maxLength) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Pragmatic email shape check. Deliberately permissive — real
 * verification is the confirmation email, not a regex.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email);
}
