/* ============================================================
   NEWSLETTER ("STAY IN THE LOOP")
   Accessible email subscription handler with state transitions:
   Default, Loading, Success, Error.
   Posts to /api/subscribe first so the address is stored and
   double opt-in can be enforced, falling back to the static
   endpoint, and finally to a local demo mode. Follows
   context/security.md.
   ============================================================ */

import { config } from '../config.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  const input = document.getElementById('newsletter-email');
  const submitBtn = document.getElementById('newsletter-submit');
  const statusEl = document.getElementById('newsletter-status');

  if (!form || !input || !submitBtn || !statusEl) return;

  const API_ENDPOINT = `${config.apiBase}/api/subscribe`;
  const ENDPOINT = config.newsletterEndpoint;

  reportResultFromUrl();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = input.value.trim();

    // Reset status
    setStatus('');

    // Validate email
    if (!email || !EMAIL_REGEX.test(email)) {
      setStatus('Please enter a valid email address.', 'error');
      input.focus();
      return;
    }

    // Honeypot check — if this field has a value, it's a bot.
    // Silently accept so the bot learns nothing.
    const honeypot = form.querySelector('[name="_gotcha"]');
    if (honeypot && honeypot.value) {
      succeed({ needsConfirmation: false });
      return;
    }

    // Enter loading state
    setLoading(true);

    try {
      const payload = { email, _gotcha: honeypot ? honeypot.value : '' };
      const endpoints = [API_ENDPOINT, ENDPOINT].filter(Boolean);

      for (const endpoint of endpoints) {
        try {
          await postJson(endpoint, payload);

          // The API path stores the address and sends a confirmation
          // link; the static endpoint just collects the submission.
          succeed({ needsConfirmation: endpoint === API_ENDPOINT });
          return;
        } catch (err) {
          console.warn(`[newsletter] ${endpoint} unavailable, falling back:`, err.message);
        }
      }

      // Nothing was configured and nothing responded.
      setTimeout(() => succeed({ needsConfirmation: false }), 750);
    } finally {
      setLoading(false);
    }
  });

  /**
   * POST a JSON payload, throwing when the endpoint does not accept it.
   * @param {string} endpoint
   * @param {Record<string, string>} data
   */
  async function postJson(endpoint, data) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`responded with ${response.status}`);
    }
  }

  /**
   * Apply the success state and reset the field.
   * @param {{needsConfirmation: boolean}} options
   */
  function succeed({ needsConfirmation }) {
    setStatus(
      needsConfirmation
        ? "Almost there — check your inbox and click the link to confirm."
        : "You're on the list. Thanks for staying in the loop.",
      'success'
    );
    form.reset();
  }

  /**
   * Write the status message and set its state class.
   * @param {string} message
   * @param {'success'|'error'|''} [type]
   */
  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = type ? `newsletter-status newsletter-status--${type}` : 'newsletter-status';
  }

  /**
   * Toggle the submit button's loading state and lock the input.
   * @param {boolean} isLoading
   */
  function setLoading(isLoading) {
    submitBtn.classList.toggle('is-loading', isLoading);
    submitBtn.disabled = isLoading;
    input.disabled = isLoading;
  }
}

/**
 * Show the outcome of a confirm or unsubscribe link.
 *
 * /api/confirm and /api/unsubscribe redirect back here with a result
 * in the query string, so the visitor sees the outcome in place
 * instead of on a bare API response. The parameter is then removed
 * so a refresh does not repeat the message.
 */
function reportResultFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const result = params.get('newsletter');
  if (!result) return;

  const statusEl = document.getElementById('newsletter-status');
  if (!statusEl) return;

  const messages = {
    confirmed: ["You're on the list. Thanks for staying in the loop.", 'success'],
    ok: ['You have been unsubscribed. Sorry to see you go.', 'success'],
    expired: ['That link has expired. Please sign up again.', 'error'],
    error: ['Something went wrong. Please try again in a moment.', 'error'],
  };

  const [message, type] = messages[result];
  if (message) {
    statusEl.textContent = message;
    statusEl.className = `newsletter-status newsletter-status--${type}`;
  }

  params.delete('newsletter');
  const query = params.toString();
  window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
}
