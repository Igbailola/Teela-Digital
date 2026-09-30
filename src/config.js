/* ============================================================
   TEELA TECH — Runtime Configuration
   Single access point for build-time environment variables.
   Values come from VITE_* vars in .env.local, which is never
   committed. See .env.example for the full list.
   ============================================================ */

/**
 * Reads a Vite env var, trimmed, falling back to an empty string.
 * Vite statically replaces `import.meta.env.VITE_*` at build time,
 * so these must be written out in full rather than looked up
 * dynamically via bracket access.
 * @param {string} value
 * @returns {string}
 */
function read(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export const config = {
  /**
   * Origin that serves the `/api/*` functions. Empty string means
   * same-origin, which is correct on every host that deploys them
   * alongside the site. Point it elsewhere only if the functions
   * live on a different domain, and remember that domain must then
   * send permissive CORS headers.
   */
  apiBase: read(import.meta.env.VITE_API_BASE),

  /**
   * URL that contact enquiries are POSTed to (e.g. a Formspree form).
   * Empty string means "no endpoint configured" and the form
   * falls back to opening the visitor's email client.
   */
  contactEndpoint: read(import.meta.env.VITE_CONTACT_ENDPOINT),

  /**
   * Address used for the mailto fallback and shown in the footer.
   */
  contactEmail: read(import.meta.env.VITE_CONTACT_EMAIL),

  /**
   * URL that newsletter signups are POSTed to.
   * Empty string means demo mode: the signup is accepted locally
   * and nothing is transmitted.
   */
  newsletterEndpoint: read(import.meta.env.VITE_NEWSLETTER_ENDPOINT),
};
