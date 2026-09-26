/* ============================================================
   NEWSLETTER ("STAY IN THE LOOP")
   Accessible email subscription handler with state transitions:
   Default, Loading, Success, Error.
   Architecture is ready to wire into a live provider (Mailchimp/ConvertKit/Resend).
   ============================================================ */

export function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  const input = document.getElementById('newsletter-email');
  const submitBtn = document.getElementById('newsletter-submit');
  const statusEl = document.getElementById('newsletter-status');

  if (!form || !input || !submitBtn || !statusEl) return;

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = input.value.trim();

    // Reset status
    statusEl.textContent = '';
    statusEl.className = 'newsletter-status';

    // Validate email
    if (!email || !EMAIL_REGEX.test(email)) {
      statusEl.textContent = 'Please enter a valid email address.';
      statusEl.className = 'newsletter-status newsletter-status--error';
      input.focus();
      return;
    }

    // Enter loading state
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;
    input.disabled = true;

    // Simulate clean dispatch with UI feedback
    setTimeout(() => {
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
      input.disabled = false;

      // Success state per specification
      statusEl.textContent = "You're on the list. Thanks for staying in the loop.";
      statusEl.className = 'newsletter-status newsletter-status--success';
      form.reset();
    }, 750);
  });
}
