# Supabase Auth Configuration — Google Provider and Branded Auth Emails

This document defines the Supabase dashboard configuration expectations
for Google OAuth, callback safety, and branded auth email delivery.
These are manual setup steps — they cannot be done via code.

The matching application boundary lives in
`src/lib/auth/auth-boundary.ts`. Keep provider identifiers, approved return
paths, callback origins, and Supabase auth-email branding expectations aligned
there before changing dashboard configuration.

## 1. Google Provider Configuration

### Supabase Dashboard → Authentication → Providers → Google

1. **Enable** the Google provider.
2. Set the **Client ID** and **Client Secret** from the Google Cloud Console OAuth 2.0 credentials.
3. Leave **Authorized Client IDs** empty (Supabase handles this).

### Google Cloud Console → APIs & Services → Credentials

1. Create an **OAuth 2.0 Client ID** (Web application).
2. **Authorized JavaScript origins:**
   - `http://localhost:3000` (development)
   - `https://mentorib.com` (production)
   - Vercel preview URL pattern if needed
3. **Authorized redirect URIs:**
   - `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
   - If using Supabase custom domain later: `https://auth.mentorib.com/auth/v1/callback`
4. **OAuth consent screen:**
   - App name: **Mentor IB**
   - User support email: support@mentorib.com
   - Authorized domain: `mentorib.com`
   - Logo: upload Mentor IB logo
   - Scopes: `email`, `profile`, `openid` (defaults)

### PKCE

Supabase uses PKCE by default for OAuth flows. No additional configuration is needed.

## 2. Callback and Redirect Allowlist

### Supabase Dashboard → Authentication → URL Configuration

1. **Site URL:**
   - Development: `http://localhost:3000`
   - Production: `https://mentorib.com`

2. **Redirect URLs (allowlist):**
   - `http://localhost:3000/auth/callback`
   - `https://mentorib.com/auth/callback`
   - Vercel preview pattern: `https://*-mentorib.vercel.app/auth/callback`

Only the `/auth/callback` route is an approved return path from Supabase Auth.
The application validates the `next` parameter server-side against an internal
allowlist before redirecting (see `src/lib/auth/allowed-redirects.ts`).

**Do not add** broad wildcards or non-callback paths to the Supabase allowlist.

## 3. Auth Email Configuration (Branded via Resend SMTP)

### Why

Supabase's default SMTP is not production-ready:
- Rate-limited to ~2 messages/hour
- Only sends to pre-authorized addresses
- Sends from a generic Supabase domain

### Supabase Dashboard → Authentication → SMTP Settings

1. **Enable Custom SMTP.**
2. **SMTP Host:** `smtp.resend.com`
3. **SMTP Port:** `465` (TLS)
4. **SMTP User:** `resend`
5. **SMTP Password:** the Resend API key
6. **Sender name:** `Mentor IB`
7. **Sender email:** `auth@mentorib.com` (must be verified in Resend)

### Resend Setup

1. Verify the `mentorib.com` domain in Resend (DNS records: SPF, DKIM, DMARC).
2. The Resend API key used here can be the same one used for transactional emails later.

### Auth Email Templates

Supabase Dashboard → Authentication → Email Templates:

Customise the following templates to use Mentor IB branding:

1. **Magic Link** — subject: "Sign in to Mentor IB", body should include the Mentor IB name and a clear call-to-action button.
2. **Confirm signup** (if auto-confirm is off) — same branding.
3. **Change Email Address** — same branding.

Template content should be:
- Branded with "Mentor IB" name
- Clean, simple HTML (Supabase template editor is limited)
- Include a clear action button/link
- State that the link expires (Supabase default: 1 hour for magic links)

**Do not** customise recovery/password templates — Mentor IB uses passwordless auth only.

## 4. Auth Settings

### Supabase Dashboard → Authentication → Settings

- **Enable email confirmations:** OFF for magic-link flow (OTP auto-confirms)
- **Enable email signup:** ON
- **Secure email change:** ON
- **Minimum password length:** N/A (passwordless only)
- **User signups:** ON (new users are auto-created on first magic-link use)
- **OTP Expiry:** 3600 seconds (1 hour) — default is fine

## 5. Environment Separation

- **Development and preview** deployments use the same Supabase project but may use the default Supabase auth domain.
- **Production** should use a paid Supabase plan with custom auth domain (`auth.mentorib.com`) when available.
- Do not share production Google OAuth credentials with development. Use separate OAuth client IDs per environment.
