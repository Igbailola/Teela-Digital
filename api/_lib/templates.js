/* ============================================================
   EMAIL TEMPLATES
   Inline-styled HTML so the messages render correctly in Outlook
   and Gmail without a web font or stylesheet request. Same design
   language as the site: Manrope-ish system stack, warm off-white
   surfaces, near-black text, gold accent.
   ============================================================ */

import { escapeHtml } from './http.js';

const INK = '#111111';
const MUTED = '#6E6E68';
const ACCENT = '#8A6D00';
const SURFACE = '#F7F7F4';
const BORDER = '#D9D9D4';

/**
 * Wrap body content in the shared shell.
 * @param {string} preheader  Hidden inbox preview text
 * @param {string} heading
 * @param {string} body  Already-escaped HTML
 * @param {string} [footerNote]
 * @returns {string}
 */
function shell(preheader, heading, body, footerNote) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${SURFACE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid ${BORDER};border-radius:12px;">

<tr><td style="padding:28px 32px 8px;">
  <p style="margin:0;font-size:12px;letter-spacing:0.18em;font-weight:700;color:${INK};">TEELA TECH</p>
</td></tr>

<tr><td style="padding:8px 32px 0;">
  <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:700;color:${INK};">${escapeHtml(heading)}</h1>
</td></tr>

<tr><td style="padding:16px 32px 0;font-size:15px;line-height:1.65;color:${MUTED};">
  ${body}
</td></tr>

<tr><td style="padding:24px 32px 28px;border-top:1px solid ${BORDER};margin-top:24px;">
  <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
    ${footerNote ? escapeHtml(footerNote) : 'Teela Tech — Ideas, engineered beautifully.'}
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * A tappable call-to-action button.
 * @param {string} label
 * @param {string} url
 * @returns {string}
 */
function button(label, url) {
  return `<p style="margin:24px 0 0;">
    <a href="${escapeHtml(url)}" style="display:inline-block;background:${INK};color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;">${escapeHtml(label)}</a>
  </p>`;
}

/**
 * Acknowledgement sent to the person who submitted an enquiry.
 * @param {object} details
 * @param {string} details.name
 * @param {string} details.email
 * @param {string} details.projectType
 * @param {string} details.replyTo
 * @returns {{subject: string, html: string, text: string}}
 */
export function enquiryAcknowledgement({ name, email, projectType, replyTo }) {
  const firstName = name.split(' ')[0];

  const html = shell(
    `Thanks for reaching out, ${firstName}. We have your enquiry.`,
    'We have your enquiry',
    `<p>Hi ${escapeHtml(firstName)},</p>
     <p>Thanks for getting in touch about your ${escapeHtml(projectType)} project. Your enquiry has reached us and someone on the team will reply to you at this address within one business day.</p>
     <p>If it is urgent, you can reach us directly at
        <a href="mailto:${escapeHtml(replyTo)}" style="color:${ACCENT};">${escapeHtml(replyTo)}</a>.</p>`
      + button('Reply to Teela Tech', `mailto:${replyTo}`),
    'You are receiving this because you submitted an enquiry on the Teela Tech website.'
  );

  const text = [
    `Hi ${firstName},`,
    '',
    `Thanks for getting in touch about your ${projectType} project.`,
    'Your enquiry has reached us and someone will reply within one business day.',
    '',
    `Urgent? Email us directly at ${replyTo}`,
  ].join('\n');

  return { subject: 'We have your enquiry — Teela Tech', html, text };
}

/**
 * Internal notification carrying a new enquiry.
 * @param {object} details
 * @param {string} details.name
 * @param {string} details.email
 * @param {string} details.company
 * @param {string} details.projectType
 * @param {string} details.message
 * @returns {{subject: string, html: string, text: string}}
 */
export function enquiryNotification({ name, email, company, projectType, message }) {
  const rows = [
    ['Name', name],
    ['Email', email],
    ['Company', company || 'Not provided'],
    ['Project type', projectType],
  ]
    .map(
      ([label, value]) => `<tr>
        <td style="padding:6px 16px 6px 0;font-size:13px;color:${MUTED};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:6px 0;font-size:14px;color:${INK};font-weight:600;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join('');

  const html = shell(
    `New ${projectType} enquiry from ${name}`,
    'New website enquiry',
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${rows}</table>
     <p style="margin:0;font-size:15px;line-height:1.7;color:${INK};">${escapeHtml(message).replace(/\n/g, '<br>')}</p>`
      + button('Reply to ' + name.split(' ')[0], `mailto:${email}?subject=${encodeURIComponent(`Re: your Teela Tech enquiry`)}`),
    'Sent by the Teela Tech website contact form.'
  );

  const text = [
    'New website enquiry',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || 'Not provided'}`,
    `Project type: ${projectType}`,
    '',
    'Message:',
    message,
    '',
    `Reply: ${email}`,
  ].join('\n');

  return { subject: `New enquiry — ${name} (${projectType})`, html, text };
}

/**
 * Double opt-in confirmation for a newsletter signup.
 * @param {object} details
 * @param {string} details.confirmUrl
 * @param {string} details.unsubscribeUrl
 * @returns {{subject: string, html: string, text: string}}
 */
export function optInConfirmation({ confirmUrl, unsubscribeUrl }) {
  const html = shell(
    'Confirm your subscription to Teela Tech.',
    'Confirm your subscription',
    `<p>One click and you are on the list. We will send occasional dispatches on digital product work — no noise, and you can leave at any time.</p>`
      + button('Confirm subscription', confirmUrl)
      + `<p style="margin:20px 0 0;font-size:13px;">If the button does not work, paste this link into your browser:<br>
         <a href="${escapeHtml(confirmUrl)}" style="color:${ACCENT};word-break:break-all;">${escapeHtml(confirmUrl)}</a></p>
         <p style="margin:12px 0 0;font-size:13px;">Not interested?
         <a href="${escapeHtml(unsubscribeUrl)}" style="color:${ACCENT};">Unsubscribe</a>.</p>`,
    'You are receiving this because someone entered this address on the Teela Tech website.'
  );

  const text = [
    'Confirm your subscription',
    '',
    'Open this link to confirm:',
    confirmUrl,
    '',
    'To opt out instead, open:',
    unsubscribeUrl,
  ].join('\n');

  return { subject: 'Confirm your subscription — Teela Tech', html, text };
}

/**
 * Confirmation that the subscription is now active.
 * @returns {{subject: string, html: string, text: string}}
 */
export function optInSuccess() {
  const html = shell(
    'You are on the list.',
    'You are on the list',
    `<p>Thanks for confirming. You will hear from us when we have something worth sending.</p>`,
    'You can unsubscribe at any time using the link in any email we send.'
  );

  return {
    subject: 'You are on the list — Teela Tech',
    html,
    text: 'Thanks for confirming. You are on the Teela Tech list.',
  };
}
