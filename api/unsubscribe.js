/* ============================================================
   GET|POST /api/unsubscribe
   Honours both the link in a sent email and the RFC 8058
   one-click header that mail clients POST to automatically.

   RFC 8058 requests are answered with a plain 200: a redirect there
   would surface as a navigation error inside the mail client.
   ============================================================ */

import { allowMethods, json, originOf, queryParam, redirect } from './_lib/http.js';
import { updateContact } from './_lib/email.js';
import { verifyToken } from './_lib/tokens.js';

/**
 * @param {object} req
 * @param {import('node:http').ServerResponse} res
 */
export async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  // A one-click POST is fired by the mail client, not a visitor.
  const isOneClick = req.method === 'POST';

  /**
   * @param {string} result
   */
  function finish(result) {
    if (isOneClick) {
      res.writeHead(result === 'ok' ? 200 : 400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(result === 'ok' ? 'Unsubscribed' : 'Could not unsubscribe');
      return;
    }
    redirect(res, `${originOf(req)}/?newsletter=${result}#newsletter`);
  }

  const secret = process.env.EMAIL_TOKEN_SECRET;
  if (!secret) {
    console.error('[api/unsubscribe] EMAIL_TOKEN_SECRET is not set');
    if (!isOneClick) {
      json(res, 503, { error: 'not_configured' });
      return;
    }
    finish('error');
    return;
  }

  const payload = verifyToken(queryParam(req, 'token'), secret);
  if (!payload || payload.action !== 'unsubscribe' || !payload.email) {
    finish('expired');
    return;
  }

  const updated = await updateContact({ email: payload.email, unsubscribed: true });
  if (!updated.ok) {
    console.error('[api/unsubscribe] could not unsubscribe:', payload.email, updated.status);
    finish('error');
    return;
  }

  finish('ok');
}

export default handler;
