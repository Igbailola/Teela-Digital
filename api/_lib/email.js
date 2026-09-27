/* ============================================================
   EMAIL PROVIDER — Resend adapter
   Talks to the REST API directly with global fetch, so the project
   gains no new dependency. Swapping providers means replacing only
   the three functions in this file.
   ============================================================ */

const BASE = 'https://api.resend.com';

/**
 * Config problem to surface to the operator, if any.
 * @returns {string|null}
 */
export function configurationError() {
  if (!process.env.RESEND_API_KEY) return 'RESEND_API_KEY is not set';
  if (!process.env.EMAIL_FROM) return 'EMAIL_FROM is not set';
  return null;
}

/**
 * @param {string} path
 * @param {string} method
 * @param {object} [body]
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
async function request(path, method, body) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { ok: response.ok, status: response.status, data };
}

/**
 * Send a transactional email.
 *
 * @param {object} message
 * @param {string|string[]} message.to
 * @param {string} message.subject
 * @param {string} message.html
 * @param {string} [message.text]
 * @param {string} [message.replyTo]
 * @param {Record<string,string>} [message.headers]
 * @param {string} [message.idempotencyKey]
 * @returns {Promise<{ok: boolean, status: number, id: string|null, error: any}>}
 */
export async function sendEmail({ to, subject, html, text, replyTo, headers, idempotencyKey }) {
  const payload = {
    from: process.env.EMAIL_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };

  if (text) payload.text = text;
  if (replyTo) payload.reply_to = replyTo;
  if (headers) payload.headers = headers;

  const requestHeaders = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined;
  const response = await requestWithIdempotency(payload, requestHeaders);

  return {
    ok: response.ok,
    status: response.status,
    id: response.data?.id ?? null,
    error: response.ok ? null : response.data,
  };
}

/**
 * POST /emails with an optional Idempotency-Key header, so a retry
 * after a network timeout cannot deliver the same mail twice.
 * @param {object} payload
 * @param {Record<string,string>} [extraHeaders]
 */
async function requestWithIdempotency(payload, extraHeaders) {
  const response = await fetch(`${BASE}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { ok: response.ok, status: response.status, data };
}

/**
 * Add a contact to the global audience list.
 *
 * Resend stores this list, so newsletters can be sent to it as a
 * Broadcast from the dashboard, and so the list survives deploys.
 *
 * @param {object} contact
 * @param {string} contact.email
 * @param {boolean} contact.unsubscribed  true while awaiting opt-in
 * @returns {Promise<{ok: boolean, status: number}>}
 */
export async function addContact({ email, unsubscribed }) {
  // POST is create-only; a repeat signup has to fall through to update.
  const created = await request('/contacts', 'POST', { email, unsubscribed });
  if (created.ok) return { ok: true, status: created.status };

  const updated = await updateContact({ email, unsubscribed });
  return updated.ok ? updated : { ok: false, status: created.status };
}

/**
 * Update a contact's global subscription status.
 * @param {object} contact
 * @param {string} contact.email
 * @param {boolean} contact.unsubscribed
 * @returns {Promise<{ok: boolean, status: number}>}
 */
export async function updateContact({ email, unsubscribed }) {
  const response = await request(
    `/contacts/${encodeURIComponent(email)}`,
    'PATCH',
    { unsubscribed }
  );
  return { ok: response.ok, status: response.status };
}
