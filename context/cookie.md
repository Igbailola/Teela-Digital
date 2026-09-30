# Teela Tech — Cookie & Tracking Guidelines

## 1. Purpose

This document defines how cookies, analytics and optional tracking should be handled on the Teela website.

The implementation must follow applicable privacy and data-protection requirements for Teela's visitors and target markets.

When legal requirements are uncertain, obtain appropriate legal advice rather than assuming a particular consent requirement.

---

# 2. Cookie Categories

Cookies and similar technologies should be grouped into clear categories.

## Essential

Required for the website to function properly.

Examples may include:

- Security-related cookies
- Session cookies
- Consent preference storage
- Essential functionality

Essential cookies do not require the same treatment as optional analytics/marketing cookies, but the implementation must still follow applicable requirements.

---

## Analytics

Used to understand:

- Website traffic
- Popular pages
- User interactions
- General website performance
- Conversion behaviour

Analytics should only be activated according to the consent requirements applicable to the visitor.

---

## Marketing

Used for advertising, remarketing or marketing measurement.

Examples may include:

- Advertising pixels
- Retargeting technologies
- Marketing attribution tools

Marketing tracking must not be added by default.

Only implement marketing tracking if Teela actually needs it.

---

# 3. Consent Banner

If non-essential cookies or tracking are used, provide a clear consent interface.

Suggested copy:

> ## We use cookies
>
> We use essential cookies to make Teela work and optional analytics cookies to understand how visitors use our website.
>
> **Accept all**
>
> **Reject optional**
>
> **Manage preferences**

Do not design the banner to manipulate users into accepting.

Do not hide the rejection option.

---

# 4. Consent Preferences

Users should be able to:

- Accept optional cookies
- Reject optional cookies
- Change their preferences later

The preference interface should clearly explain what each category does.

---

# 5. Default State

Optional analytics and marketing technologies should not load before the appropriate consent state has been established.

The exact implementation must follow the requirements applicable to the user's jurisdiction.

---

# 6. Analytics Implementation

If analytics is added:

1. Identify the provider.
2. Document what information it collects.
3. Determine whether it uses cookies or similar technologies.
4. Configure the appropriate consent behaviour.
5. Avoid collecting unnecessary information.
6. Do not send sensitive personal information to analytics providers.

---

# 7. Third-Party Services

Any third-party tracking service must be documented before integration.

Possible future services include:

- Google Analytics
- Microsoft Clarity
- Hotjar
- Meta Pixel
- LinkedIn Insight Tag

Do not add these automatically.

Only use a service if Teela has a clear business reason for it.

---

# 8. Privacy

The website should avoid collecting unnecessary personal information.

For the contact form, only collect information needed to understand and respond to a project inquiry.

Potential data:

- Name
- Work email
- Company
- Project type
- Budget range
- Project description

Do not collect sensitive information unless there is a specific legitimate requirement.

---

# 9. Cookie Preferences Storage

If the site stores a visitor's cookie preference:

- Store only what is necessary
- Do not store sensitive information
- Respect the selected preference
- Provide a mechanism to change the preference

---

# 10. Cookie Policy

If Teela uses non-essential cookies, the website should provide a dedicated cookie policy explaining:

- What cookies are
- Which cookies are used
- Why they are used
- Cookie categories
- Third-party providers
- How users can change preferences

Do not claim that a specific cookie exists unless it is actually implemented.

---

# 11. Privacy Policy

A privacy policy should explain applicable personal-data processing separately from the cookie policy.

The cookie policy should not attempt to replace a full privacy notice.

---

# 12. Development Rules

During development:

- Do not add analytics without documenting it.
- Do not add tracking scripts directly into components without understanding their consent requirements.
- Keep third-party scripts centralized where possible.
- Do not load marketing scripts by default.
- Do not invent cookie names or providers.
- Do not fabricate legal claims.

---

# 13. Performance

Third-party scripts can negatively affect website performance.

Only load tracking services when required.

Avoid unnecessary trackers.

Where possible:

- Defer non-critical scripts
- Minimize third-party requests
- Avoid duplicate tracking
- Monitor performance after installing analytics

---

# 14. Accessibility

Cookie consent interfaces must be accessible.

Requirements:

- Keyboard accessible
- Visible focus states
- Proper button labels
- Readable text
- Sufficient contrast
- Screen-reader compatible
- No inaccessible modal traps

Users should be able to interact with the consent interface without a mouse.

---

# 15. Future Tracking Changes

Whenever a new analytics, advertising or tracking service is introduced:

1. Update this file.
2. Document the provider.
3. Document the purpose.
4. Update the consent implementation.
5. Update the privacy/cookie policy where required.
6. Test the experience.

---

# 16. Principle

> **Collect less. Explain clearly. Give users meaningful control.**

The Teela website should use analytics and tracking intentionally rather than collecting data simply because a tool makes it possible.
