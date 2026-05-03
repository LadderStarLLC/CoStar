# Ladder Star

Ladder Star is an AI-powered career platform for practicing interviews, discovering jobs, building public professional profiles, and messaging recruiters or agencies. It combines a live AI audition room, a job board, profile pages, admin tooling, blog publishing, and real-time messaging into one Next.js app.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/Gemini-Live_API-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini Live API">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel">
</p>

## What Is Inside

Ladder Star is part career platform, part practice room, part recruiter inbox, and part AI interview coach. The app has a few important wires under the floorboards, mostly around Gemini Live API and Firebase authorization, so this README is the map before you start moving things around.

- **Audition**: real-time AI voice interviews through Google's Gemini Multimodal Live API.
- **Job Board**: searchable jobs, job detail pages, save/apply actions, and job-specific audition entry points.
- **Profiles**: public profile pages for talent, businesses, and agencies.
- **Messaging**: a global floating chat widget with safe rich-text messages.
- **Admin Console**: owner/admin platform summary, role management, and account moderation.
- **Blog**: TipTap-powered editing and publishing.
- **Search**: discovery across talent, agencies, businesses, and jobs.
- **Settings & History**: per-user Gemini settings, interviewer presets, saved audition sessions, feedback, and ultra feedback.

## Architecture

```text
Browser
  -> Next.js App Router pages and components
  -> Next.js API routes
  -> Firebase Auth / Firestore / Firebase Admin SDK
  -> Gemini Live API, Gemini text generation, job APIs
```

- **Framework**: Next.js 14 App Router
- **Language**: TypeScript and React 18
- **Styling**: Tailwind CSS with shared UI primitives in `src/components/ui`
- **Auth**: Firebase Authentication with Google sign-in
- **Database**: Firestore
- **Storage**: Firebase Storage for profile images
- **AI**: Gemini Live API for real-time interview audio, Gemini text generation for extended feedback
- **Messaging editor**: TipTap, stored as serialized JSON rather than raw HTML
- **Deployment**: Vercel preview and production deployments

## Product Concepts

### Account Types

Ladder Star has five account types:

- `talent`
- `business`
- `agency`
- `admin`
- `owner`

Public sign-up only exposes `talent`, `business`, and `agency`. The privileged `admin` and `owner` paths are hidden and must not be added to public account selection UI.

Account type is treated as an immutable identity path once locked. The old legacy string `user` is normalized to `talent`, but new code should use `talent`.

### Admin And Owner Access

Admin and owner users use `/admin`, not normal onboarding. Admin APIs verify the Firebase ID token server-side and read the caller profile from Firestore. Do not trust client UI state for authorization.

`kyletouchet@gmail.com` is the hardcoded owner bootstrap email. `POST /api/account/bootstrap` verifies the Firebase ID token and forces that email to:

- `accountType: "owner"`
- `role: "owner"`
- `accountTypeLocked: true`
- `accountTypeSource: "system"`

## Gemini Live API Guardrails

The audition flow depends on a very specific Gemini Live WebSocket protocol. This section is intentionally blunt because most mysterious audition failures come from changing one of these details.

- Use API version `v1beta`.
- Use `BidiGenerateContent`, not `BidiGenerateContentConstrained`.
- Authenticate with `?key=` in the WebSocket URL.
- Do not use ephemeral tokens with `models/gemini-3.1-flash-live-preview`.
- The model name must include the `models/` prefix.
- The first WebSocket message must use top-level `setup`, not `config`.
- WebSocket message keys must be camelCase.
- `inputAudioTranscription` must be an empty object.
- Do not send audio until the server sends `setupComplete`.
- Do not send synthetic `clientContent` text turns immediately after setup.
- When Gemini sends a `toolCall`, halt outgoing audio until the `toolResponse` is sent.

Working WebSocket URL shape:

```text
wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={API_KEY}
```

Example setup shape:

```json
{
  "setup": {
    "model": "models/gemini-3.1-flash-live-preview",
    "systemInstruction": { "parts": [{ "text": "..." }] },
    "generationConfig": {
      "responseModalities": ["AUDIO"],
      "speechConfig": {
        "voiceConfig": {
          "prebuiltVoiceConfig": { "voiceName": "Aoede" }
        }
      }
    },
    "inputAudioTranscription": {},
    "outputAudioTranscription": {}
  }
}
```

Audio chunks use this shape:

```json
{
  "realtimeInput": {
    "audio": {
      "mimeType": "audio/pcm;rate=16000",
      "data": "<base64-encoded PCM>"
    }
  }
}
```

For deeper implementation notes, read `AGENTS.md`.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

Build for production:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

### Local Secrets Note

The committed `.env.local` values are placeholders. Local UI and layout work can run normally, but anything that hits Gemini or Firebase Admin routes needs real credentials. The real secrets live in Vercel's environment variable dashboard and should never be committed.

If you need full local API testing, temporarily copy the real values into `.env.local` and keep that file out of commits.

## Environment Variables

Client-side Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Server-side Firebase Admin config:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

AI and job integrations:

```env
GEMINI_API_KEY=
CAREERJET_API_KEY=
JOOBLE_API_KEY=
```

Stripe billing:

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

`GEMINI_API_KEY` is the fallback key used when a user has not saved a personal Gemini API key in Settings. In Vercel, `FIREBASE_PRIVATE_KEY` must be configured so escaped `\n` sequences can be converted back to real newlines by the route handler.

## Firestore Data Model

The major collections are:

- `users/{uid}`: account type, role, profile, public profile state, moderation state, business/agency details, and profile completion.
- `auditionSettings/{uid}`: per-user Gemini key override, voice, live API host, interviewer name/tone/style, and saved presets.
- `auditionSessions/{uid}/sessions/{sessionId}`: interview status, timestamps, transcript, score, feedback, strengths, improvements, and optional ultra feedback.
- `conversations/{id}`: participant IDs, latest message metadata, and unread state for the messaging inbox.
- `conversations/{id}/messages/{messageId}`: individual chat messages, including TipTap JSON content.
- `jobs`: scraped or imported job listings.
- `companies`: company profile data used by business pages and jobs.
- `blogPosts`: draft and published blog posts.

Firestore security rules are in `firestore.rules`. The messaging rules are intentionally strict: a user must be listed in a conversation's `participantIds` array to read or write that conversation or its messages.

## API Routes

### Account

- `POST /api/account/bootstrap`: Firebase-auth-gated profile bootstrap and owner enforcement.

### Admin

- `GET /api/admin/summary`: admin/owner only, returns counts and recent users.
- `POST /api/admin/users/set-role`: owner only, promotes or demotes admins by email.
- `POST /api/admin/users/set-status`: admin/owner only, suspends/reactivates users and toggles public profile visibility.
- `POST /api/admin/migrate/talent`: admin migration helper.

### Audition

- `POST /api/audition/token`: Firebase-auth-gated, returns `{ key, host }` for the Gemini Live WebSocket. This does not mint ephemeral tokens.
- `POST /api/audition/sessions`: Firebase-auth-gated, server-side session persistence with `merge: true`.
- `POST /api/audition/ultra-feedback`: generates extended post-interview analysis from transcript and initial feedback.

### Content, Jobs, And Search

- `GET /api/jobs`: fetches job listings through configured providers.
- `GET /api/search`: unified site search.
- `POST /api/blog`: privileged blog creation.
- `PATCH /api/blog/[postId]`: privileged blog updates.

Blog listing and post reads currently happen through Firestore client queries, with privileged writes handled by the API routes above.

## Project Map

```text
src/app                 Next.js routes and API handlers
src/app/audition        Main audition route
src/app/jobs            Job board, job detail, and job audition routes
src/app/admin           Admin console
src/app/blog            Blog index and post pages
src/app/u               Public talent profiles
src/app/companies       Public business profiles
src/app/agencies        Public agency profiles
src/components          Shared UI, public pages, jobs, search, profile components
src/components/audition Audition screens, settings, history, feedback UI
src/components/blog     Blog renderer and editor
src/components/messaging Rich-text editor, inbox, chat window, floating widget
src/context             Firebase auth and global messaging context
src/hooks               Audition, audio, transcript, timer, video, and settings hooks
src/lib                 Firebase, Admin SDK, jobs, profiles, search, messaging, blog helpers
src/lib/audition        Audition config, prompts, serialization, audio utilities, types
firestore.rules         Firestore authorization rules
AGENTS.md               Deep implementation notes for AI coding agents
```

## Deployment

Ladder Star deploys on Vercel.

Recommended workflow:

1. Create a branch.
2. Commit changes.
3. Open a GitHub pull request.
4. Let the GitHub/Vercel integration create a preview deployment.
5. Test the preview.
6. Merge after review.
7. Wait for production redeploy.
8. Test the live site.

### Firebase Auth On Preview Deployments

If Google sign-in fails on a Vercel preview URL, Firebase Auth probably blocked the domain. Add the preview domain in Firebase Console under Authentication -> Settings -> Authorized domains. For development previews, adding `vercel.app` allows Vercel subdomains. For production, prefer the exact production domain.

## Contributor Notes

- Read `AGENTS.md` before changing audition, auth, admin, or messaging behavior.
- Do not expose `admin` or `owner` in public sign-up.
- Admin APIs must verify Firebase ID tokens and check Firestore profiles server-side.
- Do not store TipTap messages as raw HTML; store serialized JSON.
- Do not loosen messaging rules unless the privacy model is being deliberately redesigned.
- Do not switch the Gemini Live API audition flow back to ephemeral tokens.

## License

This repository is private. Add license details here if the project is published externally.
