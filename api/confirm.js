/* ============================================================
   GET /api/confirm
   Second half of the double opt-in. Validates the signed link,
   activates the subscription, then sends the visitor back to the
   site with a result the newsletter module can read.
   ============================================================ */

import { allowMethods, json, originOf, queryParam, redirect } from './_lib/http.js';
import { sendEmail, updateContact } from './_lib/email.js';
import { verifyToken } from './_lib/tokens.js';
import { optInSuccess } from './_lib/templates.js';

/**
 * Send the visitor back to the site carrying a result the
 * newsletter module renders in place.
 * @param {object} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} result
 */
function backToSite(req, res, result) {
  redirect(res, `${originOf(req)}/?newsletter=${result}#newsletter`);
}

/**
 * @param {object} req
 * @param {import('node:http').ServerResponse} res
 */
export async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;

  const secret = process.env.EMAIL_TOKEN_SECRET;
  if (!secret) {
    console.error('[api/confirm] EMAIL_TOKEN_SECRET is not set');
    json(res, 503, { error: 'not_configured' });
    return;
  }

  const token = queryParam(req, 'token');
  const payload = verifyToken(token, secret);

  if (!payload || payload.action !== 'confirm' || !payload.email) {
    backToSite(req, res, 'expired');
    return;
  }

  const activated = await updateContact({ email: payload.email, unsubscribed: false });
  if (!activated.ok) {
    console.error('[api/confirm] could not activate:', payload.email, activated.status);
    backToSite(req, res, 'error');
    return;
  }

  const message = optInSuccess();
  const sent = await sendEmail({ to: payload.email, subject: message.subject, html: message.html, text: message.text });
  if (!sent.ok) {
    console.error('[api/confirm] welcome email failed:', sent.status, sent.error);
  }

  backToSite(req, res, 'confirmed');
}

export default handler;
