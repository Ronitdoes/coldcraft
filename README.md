# ColdCraft

> **Stop getting ignored. Your next internship or job starts with one email.**

ColdCraft is an AI-powered cold email platform built specifically for **Indian engineering students**. It turns your resume into a fully personalized, recruiter-ready cold email in under 60 seconds — no fluff, no generic templates, no "I hope this email finds you well."

---

## Table of Contents

- [Overview](#overview)
- [Live Demo & Screenshots](#live-demo--screenshots)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Security Model](#security-model)
- [Design System](#design-system)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Development Notes](#development-notes)

---

## Overview

ColdCraft solves one specific, painful problem: engineering students send generic, forgettable emails and never hear back. The platform uses **Groq's LLaMA models** to generate sharp, personalized cold emails that feel human — because the AI is trained to avoid every cliché in the recruiter's mental spam filter.

The user flow is simple:
1. **Sign in** with Google (OAuth)
2. **Upload your resume** (PDF) — the AI parses it automatically
3. **Review your profile** — name, college, year, skills, projects
4. **Compose** — choose the target company, role, tone, and word limit
5. **Get your email** — copy, send, follow up from your history

---

## Core Features

### 🤖 AI-Powered Email Generation
- Powered by **Gemini 3.1 Flash Lite** (Primary) and **Groq LLaMA 3.3 70B Versatile** (Fallback)
- Built-in provider abstraction layer ensures high availability — if Gemini hits a rate limit, Groq takes over automatically.
- System prompt engineered specifically for the Indian engineering student job-hunting context
- Supports **4 tones**: Professional, Casual, Bold, Concise
- Supports **2 mail types**: Fresh cold email, Follow-up email
- Supports **3 word limits**: 80, 120, 160 words
- AI temperature is dynamically tuned per tone (e.g., `bold` uses 0.85 temperature, `concise` uses 0.4)

### 📄 Automated Resume Parsing
- Upload a PDF resume — no manual form filling
- Powered by **Groq LLaMA 3.1 8B Instant** (Primary for speed) and **Gemini 3.1 Flash Lite** (Fallback)
- PDF text extracted server-side using **`unpdf`** (no client-side PDF.js)
- Magic byte validation ensures uploaded files are actually PDFs
- Extracts: name, college, year, GitHub, LinkedIn, portfolio, up to 8 skills, up to 5 projects
- Resume stored in Supabase Storage bucket (`resumes/`) for audit trail

### 📬 Mail History Dashboard
- Every generated email is automatically saved to the user's history
- View full email body inline (expandable rows)
- One-click **Resend** — pre-fills the compose form with the original parameters
- **Delete** with confirmation modal
- Chronological sort (newest first)

### 🔐 Authentication
- Google OAuth via Supabase Auth
- Server-side session management using `@supabase/ssr`
- Protected routes via middleware
- Secure auth callback with open-redirect prevention

### 👤 User Profile
- Auto-populated from resume parsing
- Fully editable from `/profile/edit`
- Profile data powers all email generation (no re-entering info per email)
- Skills and projects rendered as brutalist chip components

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 |
| **Animation** | GSAP 3.15 + `@gsap/react` |
| **Smooth Scroll** | Lenis |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Google OAuth) |
| **Storage** | Supabase Storage |
| **AI Inference** | `@google/genai` (Gemini) + `groq-sdk` (Groq) |
| **LLM (Email)** | Gemini 3.1 Flash Lite (Primary) / LLaMA 3.3 70B (Fallback) |
| **LLM (Resume)** | LLaMA 3.1 8B Instant (Primary) / Gemini 3.1 Flash Lite (Fallback) |
| **PDF Parsing** | `unpdf` |
| **Fonts** | Space Grotesk (headlines), Inter (body), Caveat (accents) |
| **Runtime** | Node.js / Vercel Edge |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                     │
│  Next.js App Router — React Server + Client Components      │
│  GSAP Animations · Lenis Smooth Scroll · Tailwind CSS       │
└───────────────────────────┬─────────────────────────────────┘
                            │  HTTP / Server Actions
┌───────────────────────────▼──────────────────────────────────┐
│                    Next.js API Routes                        │
│  /api/generate-mail   →  Input validation → Rate limit →     │
│                           AI Provider Abstraction Layer →    │
│                           DB save                            │
│  /api/parse-resume    →  PDF validation → unpdf extract →    │
│                           AI Provider Abstraction Layer →    │
│                           Sanitize → DB upsert               │
└───────────┬─────────────────────────────┬────────────────────┘
            │                             │
┌───────────▼──────────────────────┐ ┌────▼────────────────────┐
│      Google Cloud (Gemini)       │ │     Groq Cloud          │
│ Gemini 3.1 Flash Lite (Emails)   │ │ LLaMA 3.1 8B (Resumes)  │
│ (Primary Email / Fallback Parse) │ │ (Fallback Emails)       │
└──────────────────────────────────┘ └─────────────────────────┘
            │                             │
┌───────────▼─────────────────────────────▼────────────────────┐
│                      Supabase Backend                        │
│  Auth (Google OAuth)   Storage (resumes bucket)              │
│  PostgreSQL: profiles, mail_history, rate_limits (RPC)       │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

**Multi-Provider AI Layer**: To guarantee high availability, all AI calls pass through a custom abstraction layer (`lib/ai/providers.ts`). If the primary provider (Gemini for emails, Groq for parsing) encounters a rate limit or 503 error, the system automatically retries with the fallback provider before failing.

**Server Components by Default**: Data fetching happens on the server using `createClient()` from `@supabase/ssr`. Client components (`"use client"`) are used only for interactivity and GSAP animations.

**No Streaming**: Email generation uses a single-shot API call with a 15-second timeout, not streaming. This keeps the implementation simple and avoids partial-render complexity.

**One Supabase Client Per Context**: Three client factories exist:
- `utils/supabase/client.ts` — browser-side (uses anon key, respects RLS)
- `utils/supabase/server.ts` — server-side (uses anon key, respects RLS)
- `utils/supabase/admin.ts` — server-side admin (uses service role key, bypasses RLS — used only for rate limiting)

---

## Project Structure

```
coldapril/
├── app/
│   ├── api/
│   │   ├── generate-mail/route.ts   # AI email generation endpoint
│   │   └── parse-resume/route.ts    # PDF upload & AI parsing endpoint
│   ├── auth/callback/route.ts       # Supabase OAuth callback handler
│   ├── compose/
│   │   ├── page.tsx                 # Compose page (server, fetches profile)
│   │   └── client.tsx               # Compose form (client component)
│   ├── dashboard/
│   │   ├── page.tsx                 # Dashboard entry (server)
│   │   └── client.tsx               # Dashboard UI (client, GSAP animations)
│   ├── login/page.tsx               # Login page with Google OAuth
│   ├── onboarding/
│   │   ├── resume/client.tsx        # Step 1: PDF upload
│   │   └── profile/client.tsx       # Step 2: Review parsed profile
│   ├── profile/edit/client.tsx      # Profile edit page
│   ├── globals.css                  # Global styles + design tokens
│   ├── layout.tsx                   # Root layout (fonts, scrollbar, viewport fix)
│   └── page.tsx                     # Landing page
│
├── components/
│   ├── ui/                          # Reusable design system components
│   │   ├── BrandHeader.tsx          # "COLDCRAFT" logo/brand mark
│   │   ├── Chip.tsx                 # Tag/skill chip
│   │   ├── ChipGroup.tsx            # Multi-select chip group
│   │   ├── FormInput.tsx            # Styled text input
│   │   ├── FormLabel.tsx            # Uppercase label
│   │   ├── Preloader.tsx            # Full-screen loading state
│   │   ├── PrimaryButton.tsx        # Brutalist CTA button
│   │   ├── StepIndicator.tsx        # Onboarding progress bar
│   │   └── ToggleGroup.tsx          # Exclusive option selector
│   ├── utils/
│   │   └── ViewportFix.tsx          # Mobile viewport height stabilizer
│   ├── BentoStats.tsx               # Landing page stats section
│   ├── CustomScrollbar.tsx          # Styled scrollbar overlay
│   ├── EmailFlowAnimation.tsx       # Landing page SVG animation
│   ├── Footer.tsx                   # Site footer
│   ├── Hero.tsx                     # Landing page hero section
│   ├── NavBar.tsx                   # Landing page navigation
│   ├── SmoothScroll.tsx             # Lenis smooth scroll wrapper
│   └── TextRollover.tsx             # GSAP text swap animation
│
├── lib/
│   ├── ai/                          # AI Provider Abstraction Layer
│   │   ├── generate.ts              # Exported generator functions
│   │   ├── providers.ts             # Gemini & Groq fallback runner
│   │   └── types.ts                 # Provider interfaces
│   ├── greeting.ts                  # Dynamic greeting generator
│   ├── groq.ts                      # Groq SDK singleton
│   ├── gsap.ts                      # GSAP singleton (prevents re-registration)
│   ├── prompts.ts                   # AI system prompts
│   └── security.ts                  # Rate limiting, origin validation, sanitization
│
├── utils/supabase/
│   ├── admin.ts                     # Service-role Supabase client (server only)
│   ├── client.ts                    # Browser Supabase client
│   ├── proxy.ts                     # Session update middleware proxy
│   └── server.ts                    # Server Supabase client
│
├── supabase/migrations/             # SQL migration files
├── ENVIRONMENT.example              # Environment variable template
├── next.config.ts                   # Next.js config + security headers
├── DESIGN_SYSTEM.md                 # Visual design spec
└── package.json
```

---

## Database Schema

### `profiles`
Stores parsed resume data for each user. One row per user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | References `auth.users.id` (primary key) |
| `email` | `text` | User's email address |
| `name` | `text` | Full name parsed from resume |
| `college` | `text` | College/university name |
| `year` | `text` | Year of study (e.g., "2nd Year B.Tech CSE") |
| `github` | `text` | GitHub profile URL |
| `linkedin` | `text` | LinkedIn profile URL |
| `portfolio` | `text` | Portfolio website URL |
| `skills` | `text[]` | Up to 8 technical skills |
| `projects` | `jsonb` | Array of up to 5 project objects (name, description, tech, link) |
| `onboarding_completed` | `boolean` | Whether the user has finished the initial setup |
| `updated_at` | `timestamptz` | Last profile update timestamp |
| `created_at` | `timestamptz` | Row creation timestamp |

### `mail_history`
Stores every generated email. One row per generation.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | References `auth.users.id` |
| `recipient` | `text` | Recipient's name |
| `company` | `text` | Target company name |
| `role` | `text` | Target role/position |
| `tone` | `text` | Tone used (professional/casual/bold/concise) |
| `mail_type` | `text` | Type (fresh/follow-up) |
| `position_type` | `text` | Position type (internship/full-time) |
| `word_limit` | `integer` | Word limit used (80/120/160) |
| `extra_context` | `text` | Optional extra context provided |
| `subject` | `text` | Generated email subject line |
| `body` | `text` | Generated email body |
| `created_at` | `timestamptz` | Generation timestamp |

### `rate_limits` (managed by RPC)
Tracks API usage per user per action per time window.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | `uuid` | User reference |
| `action` | `text` | Action name (generate-mail / parse-resume) |
| `count` | `integer` | Requests made in current window |
| `window_start` | `timestamptz` | Start of the rate limit window |

---

## API Reference

### `POST /api/generate-mail`

Generates a cold email using the user's profile and the provided inputs.

**Authentication**: Required (Supabase session cookie)

**Request Body**:
```json
{
  "recipient": "John Doe",
  "company": "Razorpay",
  "role": "Backend Engineer",
  "positionType": "internship",
  "mailType": "fresh",
  "tone": "professional",
  "wordLimit": 120,
  "extraContext": "I interned at their competitor last summer"
}
```

**Field Validation**:
- `positionType`: Must be `"internship"` or `"full-time"`
- `mailType`: Must be `"fresh"` or `"follow-up"`
- `tone`: Must be `"professional"`, `"casual"`, `"bold"`, or `"concise"`
- `wordLimit`: Must be `80`, `120`, or `160`
- All text fields are sanitized and length-capped server-side

**Rate Limit**: 20 requests per hour per user

**Response** (`200 OK`):
```json
{
  "subject": "Building payments at scale — SDE Intern",
  "body": "Your checkout SDK handles 5M transactions a day..."
}
```

**Error Responses**:
- `401` — Not authenticated
- `400` — Invalid input
- `403` — Disallowed request origin (CSRF protection)
- `404` — Profile not found (complete onboarding first)
- `429` — Rate limit exceeded
- `500` — AI generation failure

---

### `POST /api/parse-resume`

Uploads and parses a PDF resume, saving the extracted data to the user's profile.

**Authentication**: Required (Supabase session cookie)

**Request**: `multipart/form-data` with a `file` field containing the PDF.

**Constraints**:
- File size: Max 5 MB
- File type: `application/pdf` only
- Magic bytes: Validated server-side (checks `%PDF-` header)
- Pages: Max 5 pages
- Extracted text: Max 20,000 characters

**Rate Limit**: 5 requests per hour per user

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "name": "Rahul Sharma",
    "college": "IIT Delhi",
    "year": "3rd Year B.Tech CSE",
    "github": "github.com/rahulsharma",
    "linkedin": "linkedin.com/in/rahulsharma",
    "portfolio": "",
    "skills": ["React", "Node.js", "PostgreSQL", "Docker"],
    "projects": [
      {
        "name": "SmartHire",
        "description": "An AI-powered recruitment platform.",
        "tech": "React, Supabase",
        "link": "https://github.com/rahul/smarthire"
      }
    ]
  }
}
```

**Error Responses**:
- `400` — Invalid file, not a PDF, or unreadable text
- `401` — Not authenticated
- `403` — Disallowed request origin
- `413` — File too large
- `429` — Rate limit exceeded
- `500` — AI parsing failure

---

## Security Model

ColdCraft implements a multi-layer security architecture across all sensitive routes.

### 1. Authentication Guard
Every API route calls `supabase.auth.getUser()` — never `getSession()`. This verifies the JWT against Supabase's auth server, preventing session replay attacks.

### 2. Rate Limiting
Implemented via a Postgres RPC function (`consume_rate_limit`) and the admin Supabase client. Limits are enforced server-side, cannot be bypassed by the client.

| Action | Limit | Window |
|--------|-------|--------|
| `generate-mail` | 20 requests | 1 hour |
| `parse-resume` | 5 uploads | 1 hour |

### 3. Origin Protection (CSRF Prevention)
`requireAllowedOrigin(req)` checks the `Origin` request header against a whitelist. Only requests from your own domain are accepted. Configure via:
- `APP_ORIGIN` — your primary domain
- `ALLOWED_REDIRECT_ORIGINS` — additional trusted domains (comma-separated)

### 4. Open Redirect Prevention
`getSafeRedirectOrigin(req)` in the auth callback validates redirect targets. If the target is not in the allowed origins list, it falls back to `APP_ORIGIN`. This prevents attackers from using your login flow to redirect users to malicious sites.

### 5. PDF Validation (Defense in Depth)
Resume uploads go through three validation layers:
1. **MIME type check** — Content-Type must be `application/pdf`
2. **Extension check** — Filename must end with `.pdf`
3. **Magic byte check** — First 5 bytes must be `%PDF-` (prevents disguised files)

### 6. Input Sanitization
All user inputs to AI prompts are sanitized via `trimText()` and `sanitizeStringArray()` to enforce maximum lengths and prevent prompt injection through oversized payloads.

### 7. Content Security Policy (CSP)
Enforced via HTTP headers in `next.config.ts`:
```
default-src 'self'
img-src 'self' data: blob: https://lh3.googleusercontent.com *.googleusercontent.com
script-src 'self' 'unsafe-inline' 'unsafe-eval'
connect-src 'self' <SUPABASE_URL>
frame-ancestors 'none'
```

### 8. Additional Security Headers
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

---

## Design System

ColdCraft follows a **brutalist design philosophy** — raw, typographically bold, and intentionally stripped of decoration. Every element earns its place.

### Typography
| Role | Font | Usage |
|------|------|-------|
| Headlines | Space Grotesk | Page titles, CTAs, labels (always uppercase) |
| Body / Mono | Inter | Metadata, timestamps, input labels |
| Accent | Caveat | Handwritten-style accents (landing page) |

### Color Palette
All colors are dark-mode-first and defined as CSS custom properties:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-background` | `#131313` | Page background |
| `--color-primary` | `#ffffff` | Primary text, CTA buttons |
| `--color-on-surface-variant` | `#c6c6c6` | Secondary labels, metadata |
| `--color-surface-container` | `#1f1f1f` | Card/panel backgrounds |
| `--color-outline-variant` | `#474747` | Borders, dividers |

### Design Principles
- **No border-radius** — `--radius-DEFAULT: 0px`. Sharp corners everywhere.
- **Uppercase everything** — Labels, buttons, and metadata use `uppercase` + `tracking-[0.2em]`
- **Glassmorphism headers** — `backdrop-blur-md` + `bg-black/60` for navigation bars
- **GSAP animations** — Character-by-character greeting reveals, fade-in content waves
- **Stable viewport** — A custom `--vh` CSS variable (set by `ViewportFix.tsx`) replaces `100vh` across all full-screen sections to prevent mobile browser UI jumping

### Stable Viewport Utilities
Three custom CSS classes handle mobile browser chrome:
```css
.h-screen-stable      { height: calc(var(--vh, 1vh) * 100); }
.min-h-screen-stable  { min-height: calc(var(--vh, 1vh) * 100); }
.max-h-screen-stable  { max-height: calc(var(--vh, 1vh) * 100); }
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- A Supabase project
- A Groq API key ([console.groq.com](https://console.groq.com))
- Google OAuth configured in your Supabase Auth settings

### 1. Clone and Install

```bash
git clone https://github.com/Ronitdoes/coldcraft-v1.git
cd coldcraft-v1/coldapril
npm install
```

### 2. Set Up Environment Variables

```bash
cp ENVIRONMENT.example .env.local
```

Fill in your `.env.local` (see [Environment Variables](#environment-variables) below).

### 3. Set Up Supabase

Run the migrations to create all required tables:

```bash
# If you have Supabase CLI installed:
supabase db push

# Or apply migration files manually from supabase/migrations/
```

Enable Google OAuth in your Supabase project:
- Go to **Authentication → Providers → Google**
- Add your Google OAuth Client ID and Secret

Create the `resumes` storage bucket:
- Go to **Storage → New Bucket**
- Name: `resumes`
- Set to **private** (not public)

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `ENVIRONMENT.example` to `.env.local` and fill in all values.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL (e.g., `https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Your Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Your Supabase service role key (**never expose to client**) |
| `GROQ_API_KEY` | ✅ | Your Groq API key for LLaMA inference |
| `GEMINI_API_KEY` | ✅ | Your Google Gemini API key |
| `APP_ORIGIN` | ✅ (production) | Your primary domain (e.g., `https://coldcraft.app`) — used for security validation |
| `ALLOWED_REDIRECT_ORIGINS` | Optional | Additional trusted origins, comma-separated (e.g., Vercel preview URLs) |

### Local Development Example
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=gsk_xxxxxxxxxxxx
GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxx
APP_ORIGIN=http://localhost:3000
```

> ⚠️ **Never commit `.env.local`** — it contains your service role key, which has admin access to your database. It is already in `.gitignore`.

---

## Deployment

ColdCraft is designed to deploy to **Vercel** with zero configuration.

### Vercel Deployment Steps

1. Push your code to GitHub
2. Import the repository on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `coldapril` (the Next.js project directory)
4. Add all environment variables from your `.env.local`
5. Set `APP_ORIGIN` to your production Vercel URL
6. Deploy

### Supabase Auth Redirect URLs

In your Supabase project under **Authentication → URL Configuration**:
- **Site URL**: `https://your-domain.vercel.app`
- **Redirect URLs**: `https://your-domain.vercel.app/auth/callback`

For local development, also add:
- `http://localhost:3000/auth/callback`

---

## Development Notes

### Adding New Email Tones

1. Add the new tone string to `TONES` set in `/api/generate-mail/route.ts`
2. Add a temperature mapping in `getToneTemperature()`
3. Add a tone rule to `MAIL_GENERATION_PROMPT` in `lib/prompts.ts`
4. Add the option to the `ToggleGroup` in `app/compose/client.tsx`

### Modifying Rate Limits

Rate limits are defined in `lib/security.ts`:
```typescript
const RATE_LIMITS: Record<RateLimitAction, number> = {
  "generate-mail": 20,   // requests per hour
  "parse-resume": 5,     // requests per hour
};
```

The time window (`p_window_seconds`) is set to `3600` (1 hour) in `consumeRateLimit()`.

### GSAP Animation Pattern

All GSAP animations follow a singleton pattern via `lib/gsap.ts` to prevent plugin double-registration in React Strict Mode. Always import from `@/lib/gsap`, never directly from `gsap`:

```typescript
import { gsap, useGSAP } from "@/lib/gsap";
```

### Viewport Height on Mobile

Never use `100vh` or `100dvh` in new components. Always use the stable variants:

```tsx
// ✅ Correct
<div className="min-h-screen-stable">

// ❌ Avoid
<div className="min-h-screen">
<div className="h-[100dvh]">
```

The `ViewportFix` component (mounted globally in `layout.tsx`) sets `--vh` on page load and on orientation change only — not on scroll — to avoid layout thrashing.

### AI Prompt Engineering

Both AI prompts are centralized in `lib/prompts.ts`. The email generation prompt is highly opinionated and battle-tested. Key constraints enforced by the prompt:
- Opens with something specific about the **company or role**, not the candidate
- Mentions exactly 1-2 projects, never more
- **Project Link Rule**: If a project has a link in the profile, it is automatically included in parentheses immediately after the project name inline.
- Ends with exactly one ask (call or portfolio link, not both)
- Bans specific clichés: "passionate", "keen", "eager", "excited", "leverage"
- **Follow-up emails** must be between 60-75 words regardless of the selected word limit and must reference the previous lack of response.

---

## Contributing

This is a personal project by [@Ronitdoes](https://github.com/Ronitdoes). Feel free to fork and build on it.

---

## License

MIT
