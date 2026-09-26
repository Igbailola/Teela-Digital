/* ============================================================
   CONTACT FORM
   Client-side validation + mailto submission
   Follows 04-security.md guidelines
   ============================================================ */

export function initContactForm() {
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit');
  const statusEl = document.getElementById('form-status');

  if (!form || !submitBtn || !statusEl) return;

  const MAILTO_ADDRESS = 'teeladesignacademy@gmail.com';

  // Rate limiting — simple client-side throttle
  let lastSubmitTime = 0;
  const RATE_LIMIT_MS = 10000; // 10 seconds between submissions

  form.addEventListener('submit', (e) => {
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

    // Collect form data
    const name = sanitize(form.querySelector('[name="name"]').value.trim());
    const email = sanitize(form.querySelector('[name="email"]').value.trim());
    const company = sanitize(form.querySelector('[name="company"]').value.trim());
    const projectType = form.querySelector('[name="projectType"]').value;
    const message = sanitize(form.querySelector('[name="message"]').value.trim());

    // Build email subject and body
    const subject = encodeURIComponent(`New Project Enquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Company: ${company || 'Not provided'}\n` +
      `Project Type: ${formatProjectType(projectType)}\n\n` +
      `Project Description:\n${message}\n`
    );

    // Open mailto
    const mailtoUrl = `mailto:${MAILTO_ADDRESS}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;

    lastSubmitTime = Date.now();
    showStatus('Your email client should open shortly. If not, email us directly at ' + MAILTO_ADDRESS, 'success');
  });

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

  /**
   * Sanitize input — strip HTML tags.
   */
  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Clear validation on input
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('is-invalid');
      clearStatus();
    });
  });
}
