/* ============================================================
   POST /api/subscribe
   Double opt-in newsletter signup.

   The address is added to the provider's contact list already
   unsubscribed, then a signed confirmation link is emailed. The
   subscriber only becomes list-active once they click it, so an
   address that was typed by someone else never starts receiving
   mail.
   ============================================================ */

import { allowMethods, cleanText, clientKey, isEmail, isSameOrigin, json, originOf, rateLimit, readBody } from './_lib/http.js';
import { addContact, configurationError, sendEmail } from './_lib/email.js';
import { signToken } from './_lib/tokens.js';
import { optInConfirmation } from './_lib/templates.js';

/** Confirmation links are valid for a week. */
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Per-IP burst limit. */
const IP_RATE = { limit: 10, windowMs: 60 * 60 * 1000 };

/** Per-address limit, so one address cannot be used to spam others. */
const EMAIL_RATE = { limit: 3, windowMs: 60 * 60 * 1000 };

/**
 * @param {object} req
 * @param {import('node:http').ServerResponse} res
 */
export async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  if (!isSameOrigin(req)) {
    json(res, 403, { error: 'forbidden_origin' });
    return;
  }

  const body = await readBody(req);
  if (!body) {
    json(res, 400, { error: 'invalid_body' });
    return;
  }

  // Honeypot: pretend it worked.
  if (cleanText(body._gotcha, 200)) {
    json(res, 200, { ok: true });
    return;
  }

  const email = cleanText(body.email, 254).toLowerCase();
  if (!isEmail(email)) {
    json(res, 422, { error: 'invalid_email' });
    return;
  }

  const ipLimit = rateLimit(`subscribe:ip:${clientKey(req)}`, IP_RATE.limit, IP_RATE.windowMs);
  const emailLimit = rateLimit(`subscribe:email:${email}`, EMAIL_RATE.limit, EMAIL_RATE.windowMs);
  if (!ipLimit.ok || !emailLimit.ok) {
    res.setHeader('Retry-After', String(Math.max(ipLimit.retryAfter, emailLimit.retryAfter)));
    json(res, 429, { error: 'rate_limited' });
    return;
  }

  const secret = process.env.EMAIL_TOKEN_SECRET;
  const configError = configurationError();
  if (configError || !secret) {
    console.error('[api/subscribe] not configured:', configError || 'EMAIL_TOKEN_SECRET is not set');
    json(res, 503, { error: 'not_configured' });
    return;
  }

  // Start the subscriber in the unsubscribed state: present but
  // excluded from broadcasts until they confirm.
  const listed = await addContact({ email, unsubscribed: true });
  if (!listed.ok) {
    console.error('[api/subscribe] contact store failed:', listed.status);
    json(res, 502, { error: 'storage_failed' });
    return;
  }

  const origin = originOf(req);
  const confirmUrl = `${origin}/api/confirm?token=${signToken({ action: 'confirm', email }, secret, TOKEN_TTL_MS)}`;
  const unsubscribeUrl = `${origin}/api/unsubscribe?token=${signToken({ action: 'unsubscribe', email }, secret, TOKEN_TTL_MS)}`;

  const message = optInConfirmation({ confirmUrl, unsubscribeUrl });
  const sent = await sendEmail({ to: email, subject: message.subject, html: message.html, text: message.text });

  if (!sent.ok) {
    console.error('[api/subscribe] confirmation email failed:', sent.status, sent.error);
    json(res, 502, { error: 'delivery_failed' });
    return;
  }

  json(res, 200, { ok: true });
}

export default handler;
