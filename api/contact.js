/* ============================================================
   POST /api/contact
   Receives a website enquiry, emails the business inbox and sends
   the enquirer an acknowledgement.

   The client falls back to Formspree whenever this returns a
   non-2xx status, so a provider outage degrades instead of
   silently swallowing the enquiry.
   ============================================================ */

import { allowMethods, cleanMessage, cleanText, clientKey, isEmail, isSameOrigin, json, rateLimit, readBody } from './_lib/http.js';
import { sendEmail, configurationError } from './_lib/email.js';
import { enquiryAcknowledgement, enquiryNotification } from './_lib/templates.js';

const RATE = { limit: 5, windowMs: 10 * 60 * 1000 };

const PROJECT_TYPES = new Set([
  'website',
  'product-design',
  'ui-ux-design',
  'ux-research',
  'usability-testing',
  'product-analysis',
  'software-development',
  'design-system-development',
  'other',
]);

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

  const limit = rateLimit(`contact:${clientKey(req)}`, RATE.limit, RATE.windowMs);
  if (!limit.ok) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    json(res, 429, { error: 'rate_limited' });
    return;
  }

  const body = await readBody(req);
  if (!body) {
    json(res, 400, { error: 'invalid_body' });
    return;
  }

  // Honeypot: the field is hidden from humans. Answer as if it worked
  // so a bot learns nothing about why it was rejected.
  if (cleanText(body.website, 200)) {
    json(res, 200, { ok: true });
    return;
  }

  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 254).toLowerCase();
  const company = cleanText(body.company, 160);
  const projectType = cleanText(body.projectType, 64);
  const message = cleanMessage(body.message, 5000);

  if (!name || !isEmail(email) || !PROJECT_TYPES.has(projectType) || !message) {
    json(res, 422, { error: 'invalid_fields' });
    return;
  }

  const configError = configurationError();
  const recipient = process.env.CONTACT_TO_EMAIL;
  if (configError || !recipient) {
    console.error('[api/contact] not configured:', configError || 'CONTACT_TO_EMAIL is not set');
    json(res, 503, { error: 'not_configured' });
    return;
  }

  const ack = enquiryAcknowledgement({
    name,
    email,
    projectType: formatProjectType(projectType),
    replyTo: recipient,
  });
  const notice = enquiryNotification({ name, email, company, projectType, message });

  // Notification first: it is the one that must not be lost. If it
  // fails, tell the client so it can fall back to Formspree.
  const delivered = await sendEmail({
    to: recipient,
    subject: notice.subject,
    html: notice.html,
    text: notice.text,
    replyTo: email,
    headers: { 'X-Entity-Ref-ID': `enquiry-${name}-${email}` },
  });

  if (!delivered.ok) {
    console.error('[api/contact] notification failed:', delivered.status, delivered.error);
    json(res, 502, { error: 'delivery_failed' });
    return;
  }

  // The enquiry is safely delivered, so a failed acknowledgement must
  // not turn into a duplicate submission via the fallback path.
  const acknowledged = await sendEmail({
    to: email,
    subject: ack.subject,
    html: ack.html,
    text: ack.text,
    replyTo: recipient,
  });

  if (!acknowledged.ok) {
    console.error('[api/contact] acknowledgement failed:', acknowledged.status, acknowledged.error);
  }

  json(res, 200, { ok: true });
}

export default handler;

/**
 * @param {string} value
 * @returns {string}
 */
function formatProjectType(value) {
  const map = {
    website: 'Website',
    'product-design': 'Product Design',
    'ui-ux-design': 'UI/UX Design',
    'ux-research': 'UX Research',
    'usability-testing': 'Usability Testing',
    'product-analysis': 'Product Analysis',
    'software-development': 'Software Development',
    'design-system-development': 'Design System Development',
    other: 'Other',
  };
  return map[value] || value;
}
