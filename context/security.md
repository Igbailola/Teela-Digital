# Teela Digital — Security Guidelines

## 1. Purpose

This document defines security requirements for the Teela website.

Security requirements are mandatory and take priority over convenience or visual effects.

Never weaken security to implement a design or animation.

---

# 2. Secrets and Credentials

Never hardcode:

- API keys
- Authentication tokens
- Passwords
- Private keys
- Database credentials
- SMTP credentials
- Third-party service secrets

Secrets must be stored in environment variables.

Use local environment files such as:

```text
.env.local
```

Never commit secret environment files to source control.

Maintain a safe `.env.example` containing variable names without real values.

---

# 3. Client vs Server Secrets

Never expose server-only secrets to browser/client code.

Only public configuration values may be exposed to the client.

Any operation requiring a secret must happen server-side.

---

# 4. Contact Form Security

The contact form is an external input boundary and must be treated as untrusted input.

Requirements:

- Validate all fields
- Validate on the server
- Sanitize input
- Enforce sensible length limits
- Validate email format
- Rate-limit submissions
- Implement spam protection where appropriate
- Do not trust client-side validation alone

Never render submitted HTML directly into the page.

Never execute user-submitted content.

---

# 5. Error Handling

Never expose:

- Stack traces
- Database errors
- API keys
- Internal paths
- Server configuration
- Infrastructure details

to website visitors.

Use generic user-facing errors.

Detailed errors may be logged securely server-side.

---

# 6. API Security

If the website communicates with APIs:

- Validate requests
- Validate responses
- Use HTTPS
- Keep credentials server-side
- Limit permissions
- Avoid unnecessary endpoints
- Apply rate limiting where appropriate

Do not create an API endpoint unless it serves a real requirement.

---

# 7. Dependencies

Use dependencies intentionally.

Before adding a package:

1. Confirm it is necessary.
2. Prefer maintained packages.
3. Check compatibility.
4. Avoid duplicate libraries.
5. Check for known security issues.

Do not install a large library to implement a tiny interaction that can be handled with existing browser capabilities or existing project dependencies.

---

# 8. Security Headers

Where supported by the deployment environment, configure appropriate security headers.

Consider:

- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

Security headers must be configured carefully to avoid breaking legitimate functionality.

Do not add an unnecessarily restrictive CSP without testing all required assets and services.

---

# 9. HTTPS

The production website must use HTTPS.

Never send sensitive information over unsecured HTTP.

Redirect HTTP traffic to HTTPS where the hosting environment allows it.

---

# 10. Forms and Personal Data

Only collect information necessary for the project inquiry.

Do not collect:

- Passwords
- Financial account credentials
- Sensitive personal information
- Government identification
- Unnecessary demographic information

The contact form should only request information relevant to initiating a business conversation.

---

# 11. Data Storage

If contact submissions are stored:

- Store only necessary information
- Restrict access
- Use secure storage
- Avoid exposing submissions publicly
- Define appropriate retention practices

Do not store form submissions in client-side storage.

---

# 12. Third-Party Services

Any third-party service must be evaluated before integration.

Examples:

- Analytics
- Forms
- Email services
- CMS
- Chat tools
- CRM
- Payment services
- Marketing tools

Only integrate services that are actually required.

Third-party scripts should not be added simply because they are popular.

---

# 13. Analytics

Analytics should follow the rules defined in `05-cookie.md`.

Do not collect unnecessary user information.

Do not enable optional tracking before the required consent state has been established.

---

# 14. Authentication

The initial Teela website does not require user authentication.

If authentication is introduced later:

- Use secure session management
- Use HttpOnly cookies where appropriate
- Use Secure cookies in production
- Implement appropriate CSRF protections
- Enforce authorization server-side
- Never rely on client-side authorization

Authentication should be treated as a separate security project.

---

# 15. XSS Protection

Treat all external input as untrusted.

Avoid injecting arbitrary HTML.

Prefer:

- Text rendering
- Sanitized HTML where absolutely required
- Framework-safe rendering methods

Never use unsafe HTML injection for convenience.

---

# 16. CSRF

Any state-changing authenticated or sensitive server request must consider CSRF protection where applicable.

Do not assume a request is safe simply because it originates from the website.

---

# 17. Rate Limiting

Public endpoints, especially contact forms, should have reasonable rate limiting or spam protection.

The website must not allow trivial automated abuse of public endpoints.

---

# 18. File Uploads

The initial website should avoid user file uploads unless explicitly required.

If file uploads are introduced:

- Validate file type
- Validate file size
- Rename files safely
- Do not trust file extensions
- Scan where appropriate
- Store outside executable paths
- Restrict accessible file types

---

# 19. Accessibility and Security

Security implementation must not prevent:

- Keyboard navigation
- Screen-reader access
- Focus management
- Reduced-motion preferences
- Accessible form validation

---

# 20. Production Checklist

Before production:

- Remove development secrets
- Confirm `.env` files are ignored
- Verify HTTPS
- Test forms
- Test rate limiting
- Check security headers
- Audit dependencies
- Test error states
- Confirm no sensitive data appears in client bundles
- Confirm no private credentials are exposed
- Confirm analytics follows consent requirements
- Test on production configuration

---

# 21. Security Principle

> **Secure by default. Simple by design.**

If a feature is not necessary, do not build it.

If a dependency is not necessary, do not add it.

If data is not necessary, do not collect it.
