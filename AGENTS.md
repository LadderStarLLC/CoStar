# CoStar / LadderStar - Agent and AI Context

This document is read by AI coding agents working in this repository. `AGENTS.md`,
`CLAUDE.md`, `GEMINI.md`, and `CODEX.md` should stay synchronized unless there
is a specific reason for one agent to receive different instructions.

The repository/package is still named `costar`, but the product UI and public
brand are LadderStar.

---

## Project Overview

CoStar/LadderStar is a Next.js App Router web application for job discovery,
public professional profiles, account management, admin operations, messaging,
and AI interview practice using Google's Gemini Live API.

Core systems:
- Audition: real-time AI voice interview over Gemini Live API WebSocket.
- Job board: scraped and user-created job listings stored in Firestore.
- Auth: Firebase Authentication with Google, GitHub, and email sign-in paths.
- Profiles: private `users/{uid}` profiles and published `publicProfiles/{uid}`
  projections.
- Account settings: account/profile/privacy/wallet/security management.
- Admin console: user search, moderation, role management, wallet adjustments,
  support notes, and audit logs.
- Messaging: global Firestore-backed chat widget with TipTap rich text.

---

## Development and Test Workflow

### Required validation path

The official test workflow for real app behavior is:
1. Commit changes to a GitHub branch.
2. Open a GitHub PR.
3. GitHub Actions and the GitHub/Vercel integration take over automatically.
4. Vercel deploys the PR preview.
5. Test the PR preview for Firebase Auth, Firestore, Gemini, admin, and
   audition flows.
6. Merge only after PR preview validation.
7. Wait for the production Vercel redeploy, then test production.

Local checks are useful for fast feedback, but they are not the source of truth
for integration behavior because local secrets are placeholders.

### Incorrect validation paths and common pitfalls

Keep this list updated whenever a workflow mistake causes confusion or wasted
debugging time.

The following are not valid proof that real app behavior works:
- Starting or relying on a local dev server for audition, Firebase Auth,
  Firestore, Gemini, admin, wallet, billing, or messaging integration testing.
- Treating `npm.cmd run dev`, localhost, or local browser behavior as the
  acceptance environment for production or PR behavior.
- Debugging Gemini, Firebase Admin, Stripe, or auth connectivity from committed
  placeholder `.env.local` values.
- Assuming a successful local build proves live API, WebSocket, auth-domain,
  Firestore-rule, billing, or Vercel environment behavior.
- Skipping the GitHub PR preview because a feature appears to work locally.

If a change touches integration behavior, the required validation path remains
GitHub PR -> Vercel preview -> preview testing.

### Local commands

- Build/type/lint sanity check: `npm.cmd run build`
- Unit tests: `npm.cmd run test`
- Dev server for UI-only work: `npm.cmd run dev`
- Production start after build: `npm.cmd run start`

Known current build warnings may include existing `img` element warnings and
audition hook dependency warnings. Do not treat those as new failures unless
your change caused them.

### Local environment caveat

The committed `.env.local` contains placeholder values only, such as
`GEMINI_API_KEY=your_gemini_api_key_here`. Real secrets live in Vercel's
environment dashboard and must never be committed.

Implications:
- Local UI/layout work can run with `npm.cmd run dev`.
- Local calls to Gemini, Firebase Admin, or full auth-backed flows may fail
  unless real secrets are temporarily supplied locally.
- Do not debug production API connectivity from placeholder local env values.
- Never commit real env values.

---

## Critical: Gemini Live API WebSocket Protocol

This section documents battle-tested fixes. Do not revert these without strong
evidence from the official docs and a successful PR-preview test.

### 1. Do not use ephemeral tokens with gemini-3.1-flash-live-preview

The ephemeral token approach (`BidiGenerateContentConstrained` /
`access_token`) returns:

```text
1007 - token-based requests cannot use project-scoped features such as tuned models
```

`gemini-3.1-flash-live-preview` is treated as a project-scoped model and cannot
be accessed through ephemeral tokens in this project.

The working approach, confirmed against the Audition reference project at
`C:\Users\Sand\Desktop\Coding\Audition`, is:
- Use API version `v1beta`.
- Use `BidiGenerateContent`, not `BidiGenerateContentConstrained`.
- Authenticate with `?key=` by passing the Gemini API key in the WebSocket URL.

```text
wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={API_KEY}
```

### 2. Setup message format

The first message after `open` must use `setup` as the top-level key:

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
    "realtimeInputConfig": {
      "automaticActivityDetection": {
        "disabled": false,
        "startOfSpeechSensitivity": "START_SENSITIVITY_HIGH",
        "endOfSpeechSensitivity": "END_SENSITIVITY_HIGH",
        "prefixPaddingMs": 100,
        "silenceDurationMs": 700
      },
      "activityHandling": "START_OF_ACTIVITY_INTERRUPTS",
      "turnCoverage": "TURN_INCLUDES_ONLY_ACTIVITY"
    },
    "inputAudioTranscription": {},
    "outputAudioTranscription": {}
  }
}
```

The setup also includes a `tools` array with the `generate_feedback` function
declaration. See `src/hooks/useGeminiLiveSession.ts` for the full schema.

Do not use `{ "config": { ... } }`; that incorrect top-level key can cause
1007 failures.

### 3. All WebSocket message keys must be camelCase

Use camelCase keys in every Live API message:
- `systemInstruction`
- `generationConfig`
- `responseModalities`
- `speechConfig`
- `voiceConfig`
- `prebuiltVoiceConfig`
- `voiceName`
- `inputAudioTranscription`
- `outputAudioTranscription`
- `realtimeInput`
- `mimeType`

Do not use snake_case versions of those keys.

### 4. Audio chunk message format

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

### 5. Correct Live API model name

```text
models/gemini-3.1-flash-live-preview
```

The `models/` prefix and `-live-` variant are required.

### 6. `inputAudioTranscription` must be an empty object

```json
"inputAudioTranscription": {}
```

Do not include a `model` field inside `inputAudioTranscription`.

### 7. `/api/audition/token` route behavior

`POST /api/audition/token` is Firebase-auth-gated and returns `{ key, host }`.
The client uses those values to build the WebSocket URL. The route does not
mint ephemeral tokens. The client falls back to `GEMINI_CONFIG.liveModel` when
user settings do not override the live model.

### 8. WebSocket close codes in this project

- `1007`: invalid frame payload, wrong setup JSON structure, or model/auth
  mismatch.
- `1008`: policy violation, wrong endpoint, unsupported auth parameter, or
  unsupported operation.
- `1000` / `1005`: normal or clean close; not automatically an error.

### 9. `connect()` must await `onopen`

`connect()` in `useGeminiLiveSession.ts` returns a `Promise<void>` that resolves
only after `ws.onopen` fires. If `onerror` or `onclose` fires before `onopen`,
the promise must reject so the caller can reset UI phase.

### 10. Audio must be gated on `setupComplete`

Do not send audio chunks before `setupComplete` is received. `sendAudioChunk`
is gated by `setupReadyRef`, which starts false and becomes true only after
`setupComplete`.

After `setupComplete`, rely on microphone VAD and normal flow. Do not send a
synthetic `clientContent` text turn immediately on setup; mixing a text turn
with an ongoing `realtimeInput` audio stream on `v1beta` can cause
`1008: Operation is not implemented`.

### 11. Tool call audio gating

When Gemini Live API sends a `toolCall`, such as `generate_feedback`, halt all
outgoing audio immediately. Drop outgoing audio chunks until the `toolResponse`
has been sent. Sending input during tool calls can close the connection with an
"Input During Tool Calls" error.

### 12. Keep barge-in enabled for Gemini 3.1 Live

`gemini-3.1-flash-live-preview` is a low-latency audio-to-audio model and is
expected to support live interruption. Do not pause microphone capture merely
because Gemini audio playback is active. The Audition page must keep streaming
mic audio during AI speech so the server can detect user speech and emit
`interrupted` events.

Only stop or pause outgoing audio for explicit user mute, end/cancel flows, or
while a `toolCall` is unresolved. If the assistant is not responding to voice,
check the browser console for `[AudioCapture] mic signal` RMS/peak values and
`serverContent` diagnostics before changing protocol shape.

### 13. In-session text uses `realtimeInput.text`

For Gemini 3.1 Live, do not use `clientContent` for normal in-conversation text
updates. The End Interview instruction is sent as:

```json
{
  "realtimeInput": {
    "text": "The interview is now over. Please stop speaking and immediately call the generate_feedback tool to evaluate my performance."
  }
}
```

`clientContent` should not be sent immediately after setup and should not be
used as the normal way to steer an active Live conversation.

---

## Firebase Auth and Preview Deployments

Firebase Auth blocks sign-ins from unauthorized domains. If sign-in fails on a
Vercel PR preview, add the preview domain in Firebase Console:

Authentication -> Settings -> Authorized Domains.

For development previews, adding `vercel.app` authorizes all Vercel subdomains.
For production, only authorize the production domain.

---

## Account Model and Profiles

Account type is an immutable identity path stored on `users/{uid}`.

Public account types:
- `talent`
- `business`
- `agency`

Hidden privileged account types:
- `admin`
- `owner`

The legacy string `"user"` is normalized to `"talent"` for backward
compatibility. Do not use `"user"` in new code.

Public sign-up must expose only `talent`, `business`, and `agency`. Do not add
`admin` or `owner` to public onboarding or sign-up UI.

`kyletouchet@gmail.com` is the owner bootstrap email. `POST
/api/account/bootstrap` verifies the Firebase ID token server-side and forces
that email to:
- `accountType: "owner"`
- `role: "owner"`
- `accountTypeLocked: true`
- `accountTypeSource: "system"`

Admin/owner users should use `/admin` and `/account`, not normal onboarding.
Admin APIs must verify Firebase ID tokens and read authorization from Firestore;
never trust client UI state for admin authorization.

Profile storage:
- Private profile: `users/{uid}`
- Published public profile projection: `publicProfiles/{uid}`
- Operator preview profiles:
  `operatorPreviewProfiles/{operatorId}/paths/{accountType}`

Public profile documents contain only opted-in public fields. Private CRM,
wallet, audit, and support data must not be copied into public profile
projections.

---

## Account Settings

The user-facing account settings hub lives at `/dashboard/settings` and is
organized around:
- Account: identity, avatar, immutable account type, and role/status badges.
- Profile: type-specific profile fields for talent, business, and agency.
- Privacy: public profile visibility and links to detailed public field
  controls.
- Wallet: premium balance and recent transactions for wallet-backed account
  types.
- Security: connected providers and account deletion controls.

Detailed public-field publishing controls live on `/profile`.

---

## Public Footer, Company Pages, and Legal Pages

The public site uses a shared LadderStar footer with links to platform,
company, account, and legal resources. The footer is intended for public pages
and should not be shown on operational app surfaces where it would distract
from the workflow, such as admin, dashboard, account, onboarding, profile, and
active audition pages.

Company and legal pages include:
- `/about`
- `/contact`
- `/privacy`
- `/terms`
- `/cookies`
- `/acceptable-use`
- `/refund-policy`
- `/accessibility`
- `/security`
- `/ai-policy`

Legal operator identity:
- Ladder Star LLC
- 30 N Gould St, STE R, Sheridan, WY 82801, USA
- Support: `support@ladderstar.com`
- Privacy: `privacy@ladderstar.com`
- Legal: `legal@ladderstar.com`

Privacy and terms content should reflect the actual systems in this repo:
Firebase Auth, Firestore profiles and public profile projections, Gemini Live
API audition practice, TipTap messaging, Stripe billing, Vercel analytics and
speed insights, admin audit logs, and premium wallets. Do not claim compliance
certifications, audits, or security guarantees that are not implemented and
verified.

---

## Admin Console and Auditability

The admin console at `/admin` supports managed operations:
- User search and filtering.
- User detail inspection.
- Suspend/reactivate non-owner accounts.
- Hide/show public profiles.
- Adjust premium wallets with a required reason.
- Add internal support notes.
- View audit timeline.

Owner-only operations:
- Promote/demote admins.
- Disable accounts from admin UI.
- Run migration tools.

Owner accounts must not be moderated or role-edited from the admin UI.

Admin routes:
- `GET /api/admin/summary` - admin/owner summary counts and recent users.
- `GET /api/admin/users` - admin/owner user search and filters.
- `GET /api/admin/users/[uid]` - admin/owner user detail, public profile,
  wallet summary, and recent audit logs.
- `POST /api/admin/users/[uid]/status` - admin/owner suspend/reactivate;
  owner-only disable.
- `POST /api/admin/users/[uid]/public-profile` - admin/owner public profile
  visibility/searchability moderation.
- `POST /api/admin/users/[uid]/notes` - admin/owner internal support notes.
- `POST /api/admin/users/set-role` - owner-only admin promotion/demotion.
- `POST /api/admin/users/set-status` - legacy status/public-profile endpoint.
- `POST /api/admin/wallets/adjust` - admin/owner wallet adjustment.
- `POST /api/admin/migrate/talent` - owner-only legacy `"user"` to `talent`
  migration.

Admin mutation routes write immutable audit entries to `adminAuditLogs/{logId}`.
Client writes to `adminAuditLogs` are forbidden by Firestore rules.

---

## Premium Wallets

Premium balances are stored in `accountWallets/{uid}` with ledger entries in
`accountWallets/{uid}/transactions/{transactionId}`.

Wallet currency:
- `talent`: `minutes`
- `agency`: `minutes`
- `business`: `screenings`
- `admin` and `owner`: no wallet currency

Wallet balances and transactions are server-owned. Clients may read their own
wallets, but cannot create/update/delete balances or transactions directly.
Admin wallet adjustments must go through server routes and must include an
operator reason.

---

## Audition Settings and Session History

Per-user audition settings are stored at `auditionSettings/{uid}`:
- `geminiApiKey`
- `voiceName`
- `liveApiHost`
- `interviewerName`
- `interviewerTone`
- `interviewerStyle`
- `presets`

Interview sessions are stored at
`auditionSessions/{uid}/sessions/{sessionId}`. An `AuditionSession` includes:
- `status: "in-progress" | "completed" | "cancelled"`
- `startedAt`
- `endedAt`
- `transcript`
- `score`
- `feedback`
- `strengths`
- `improvements`
- `ultraFeedback`

Sessions are written server-side through `POST /api/audition/sessions` as the
authoritative path. A secondary client-side Firestore write may run afterward
for redundancy.

Audition API routes:
- `POST /api/audition/token`
- `POST /api/audition/sessions`
- `POST /api/audition/ultra-feedback`

---

## Recorded Business Screening Sessions

Recorded interviews are allowed only for explicit business screening sessions,
not for general candidate practice, profile-building interviews, job-specific
audition practice, or non-business flows.

Feature flags and defaults:
- `RECORDED_SCREENINGS_ENABLED=false`
- `RECORDED_SCREENING_RETENTION_DAYS=90`
- `RECORDED_SCREENING_MAX_BYTES=209715200`

Current MVP behavior:
- Business users may request recording when creating a screening link, but the
  server honors it only when `RECORDED_SCREENINGS_ENABLED=true`.
- Candidate recording consent is mandatory before camera/microphone access.
- Consent records store the text version and full text snapshot.
- Browser recording uses MediaRecorder and uploads media through server routes.
- Media is stored under private Firebase Storage paths, never public web paths
  or public bucket URLs.
- Reviewer playback and deletion go through authenticated API routes.
- Access is limited to the owning business account and platform admins/owners.
  Team-member access is not modeled yet; add it in the shared authorization
  helper before exposing team review.

Server-owned collections:
- `businessScreeningRecordingConsents`
- `businessScreeningRecordings`
- `businessScreeningRecordingEvents`

Recording routes:
- `POST /api/screening/recording/consent`
- `POST /api/screening/recording/init`
- `POST /api/screening/recording/upload`
- `POST /api/screening/recording/complete`
- `GET /api/business/screening-recordings`
- `GET /api/business/screening-recordings/[recordingId]/playback`
- `DELETE /api/business/screening-recordings/[recordingId]`

Do not add facial-expression scoring, emotion detection, biometric
identification, personality claims, or AI judgments based on appearance.

Expired recordings are selected by `cleanupExpiredScreeningRecordings` in
`src/lib/screeningRecording.ts`. There is no scheduler in this repo yet; wire
that helper to cron or a scheduled function before relying on automatic cleanup.

---

## Messaging System

Messaging is a global floating widget, not a standalone `/messages` route.

Storage:
- `conversations/{conversationId}` stores conversation metadata.
- `conversations/{conversationId}/messages/{messageId}` stores messages.

State is managed through `src/context/MessagingContext.tsx`, allowing actions
such as "Message Recruiter" to open the chat panel contextually.

Firestore rules require the caller to be listed in `participantIds` to read or
write conversation data.

Co-Star AI chat uses `gemini-3.1-flash-lite-preview` through
`/api/messaging/ai/respond` and AI conversation metadata. Do not replace,
downgrade, or "stabilize" this model to another Gemini text model unless the
user explicitly requests that change. This is separate from the Gemini Live
audition model.

Rich text uses TipTap. Store the TipTap document as serialized JSON, not raw
HTML. Render editor/read-only content with Tailwind Typography classes such as
`prose prose-invert`; `@tailwindcss/typography` must remain enabled in
`tailwind.config.ts`.

---

## Firestore Security Rules Notes

Important server-owned data:
- Wallet balances and wallet transaction writes.
- Admin audit logs.
- Admin/owner role changes.
- Account status changes made from admin routes.

Do not add client write access to server-owned operational collections unless
the security model is deliberately redesigned.

Users may read/write their own private profile within rule constraints.
Admins/owners may read operational profile data, but mutations should go
through server APIs so they can validate permissions and write audit logs.

---

## Deployment Configuration

Platform: Vercel.

Required environment variables:
- `GEMINI_API_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- Firebase client config variables: `NEXT_PUBLIC_FIREBASE_*`

`FIREBASE_PRIVATE_KEY` must have escaped `\n` converted to actual newlines at
runtime. Existing route handlers use `.replace(/\\n/g, '\n')` for this.

---

## Agent Editing Guidelines

- Prefer existing patterns in this repo over introducing new architecture.
- Keep account type immutability intact.
- Keep admin/owner authorization server-side.
- Keep public profile projections free of private/support/admin data.
- Update all three agent docs together when changing durable project context:
  `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`.
- For real workflow validation, use GitHub PR previews deployed by Vercel.
