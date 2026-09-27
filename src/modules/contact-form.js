/* ============================================================
   CONTACT FORM
   Client-side validation + submission
   Posts to VITE_CONTACT_ENDPOINT when configured, otherwise
   falls back to a mailto link. Follows context/security.md.
   ============================================================ */

import { config } from '../config.js';

export function initContactForm() {
  applyContactEmail();

  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit');
  const statusEl = document.getElementById('form-status');

  if (!form || !submitBtn || !statusEl) return;

  // Tried in order. The first transport that accepts the enquiry
  // wins, so a host without serverless functions — or a provider
  // outage — costs a moment of latency instead of losing the lead.
  const API_ENDPOINT = `${config.apiBase}/api/contact`;
  const ENDPOINT = config.contactEndpoint;
  const MAILTO_ADDRESS = config.contactEmail;

  // Rate limiting — simple client-side throttle
  let lastSubmitTime = 0;
  const RATE_LIMIT_MS = 10000; // 10 seconds between submissions

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous status
    clearStatus();

    // Rate limit check
    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
      showStatus('Please wait before submitting again.', 'error');
      return;
    }

    // Honeypot check — if this field has a value, it's a bot
    const honeypot = form.querySelector('[name="website"]');
    if (honeypot && honeypot.value) {
      // Silently reject — don't tell bots what went wrong
      showStatus('Thanks for reaching out. We\'ll be in touch soon.', 'success');
      return;
    }

    // Validate fields
    const isValid = validateForm(form);
    if (!isValid) return;

    // Collect form data. Sent as plain text: the server escapes on
    // render, so encoding here would only mangle the enquiry.
    const data = {
      name: form.querySelector('[name="name"]').value.trim(),
      email: form.querySelector('[name="email"]').value.trim(),
      company: form.querySelector('[name="company"]').value.trim(),
      projectType: form.querySelector('[name="projectType"]').value,
      message: form.querySelector('[name="message"]').value.trim(),
      website: honeypot ? honeypot.value : '',
    };

    lastSubmitTime = Date.now();

    await submitWithFallback(data);
  });

  /**
   * Try the API function, then the static endpoint, then give up and
   * open the visitor's mail client.
   * @param {Record<string, string>} data
   */
  async function submitWithFallback(data) {
    setLoading(true);
    showStatus('Sending your enquiry...', 'pending');

    const endpoints = [API_ENDPOINT, ENDPOINT].filter(Boolean);

    for (const endpoint of endpoints) {
      try {
        await postJson(endpoint, data);
        form.reset();
        showStatus('Thanks — your enquiry is on its way. We\'ll reply within one business day.', 'success');
        setLoading(false);
        return;
      } catch (err) {
        console.warn(`[contact-form] ${endpoint} unavailable, falling back:`, err.message);
      }
    }

    setLoading(false);
    submitViaMailto(data);
  }

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
   * Open the visitor's email client as a no-endpoint fallback.
   * @param {Record<string, string>} data
   */
  function submitViaMailto({ name, email, company, projectType, message }) {
    if (!MAILTO_ADDRESS) {
      showStatus('Enquiries are unavailable right now. Please try again later.', 'error');
      return;
    }

    const subject = encodeURIComponent(`New Project Enquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Company: ${company || 'Not provided'}\n` +
      `Project Type: ${formatProjectType(projectType)}\n\n` +
      `Project Description:\n${message}\n`
    );

    window.location.href = `mailto:${MAILTO_ADDRESS}?subject=${subject}&body=${body}`;
    showStatus('Your email client should open shortly. If not, email us directly at ' + MAILTO_ADDRESS, 'success');
  }

  /**
   * Toggle the submit button's loading state and lock the fields.
   * @param {boolean} isLoading
   */
  function setLoading(isLoading) {
    submitBtn.classList.toggle('is-loading', isLoading);
    submitBtn.disabled = isLoading;
    form.querySelectorAll('input, select, textarea').forEach((el) => {
      el.disabled = isLoading;
    });
  }

  /**
   * Format project type value to readable label.
   */
  function formatProjectType(value) {
    const map = {
      'website': 'Website',
      'product-design': 'Product Design',
      'ui-ux-design': 'UI/UX Design',
      'ux-research': 'UX Research',
      'usability-testing': 'Usability Testing',
      'product-analysis': 'Product Analysis',
      'software-development': 'Software Development',
      'design-system-development': 'Design System Development',
      'other': 'Other',
    };
    return map[value] || value;
  }

  /**
   * Validate form fields.
   * @returns {boolean}
   */
  function validateForm(form) {
    let valid = true;

    // Name
    const name = form.querySelector('[name="name"]');
    if (!name.value.trim()) {
      markInvalid(name);
      valid = false;
    } else {
      markValid(name);
    }

    // Email
    const email = form.querySelector('[name="email"]');
    if (!email.value.trim() || !isValidEmail(email.value)) {
      markInvalid(email);
      valid = false;
    } else {
      markValid(email);
    }

    // Project type
    const projectType = form.querySelector('[name="projectType"]');
    if (!projectType.value) {
      markInvalid(projectType);
      valid = false;
    } else {
      markValid(projectType);
    }

    // Message
    const message = form.querySelector('[name="message"]');
    if (!message.value.trim()) {
      markInvalid(message);
      valid = false;
    } else {
      markValid(message);
    }

    if (!valid) {
      showStatus('Please fill in all required fields.', 'error');
    }

    return valid;
  }

  function isValidEmail(email) {
    // Simple email format check
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function markInvalid(el) {
    el.classList.add('is-invalid');
  }

  function markValid(el) {
    el.classList.remove('is-invalid');
  }

  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = `form-status form-status--${type}`;
  }

  function clearStatus() {
    statusEl.textContent = '';
    statusEl.className = 'form-status';
  }

  // Clear validation on input
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('is-invalid');
      clearStatus();
    });
  });
}

/**
 * Point the footer's direct-inquiry link at the configured address.
 * Falls back to whatever address is already in the markup.
 */
function applyContactEmail() {
  if (!config.contactEmail) return;

  const link = document.querySelector('[data-contact-email]');
  if (!link) return;

  link.href = `mailto:${config.contactEmail}`;
  link.textContent = config.contactEmail;
}
