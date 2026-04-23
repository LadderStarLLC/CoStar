# CoStar – Agent & AI Context

This document is read by all AI coding agents (Claude, Gemini CLI, etc.) working in this repository.
It documents hard-won lessons, gotchas, and non-obvious decisions to prevent regression.

---

## Project Overview

CoStar is a Next.js (App Router) web application that helps users practice job interviews using Google's Gemini Multimodal Live API. Key features:
- **Audition** – Real-time AI voice interview via WebSocket (Gemini Live API)
- **Job Board** – Scraped job listings stored in Firestore
- **Auth** – Firebase Authentication (Google sign-in)
- **Settings** – Per-user Gemini API key, voice, model stored in Firestore (`auditionSettings/{uid}`)

---

## Critical: Gemini Live API WebSocket Protocol

> ⚠️ This section documents battle-tested fixes. Do NOT revert these without strong evidence from the official docs.

### 1. Correct Endpoint for Ephemeral Tokens

When using **ephemeral tokens**, you MUST use the `BidiGenerateContentConstrained` endpoint with `access_token`:

```
wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token={token}
```

**Wrong** (causes 1008/1007 close codes):
- `BidiGenerateContent?bearer_token=...`
- `BidiGenerateContent?access_token=...`
- `BidiGenerateContentConstrained?bearer_token=...`

The `Constrained` suffix is mandatory for ephemeral token connections. The `access_token` query param is mandatory (not `bearer_token`, not `key`).

### 2. Setup Message Top-Level Key

The first message sent after the WebSocket opens must use `setup` as the top-level key:

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

**Wrong** (causes 1007 Invalid frame payload error):
- `{ "config": { ... } }` — the get-started WebSocket docs incorrectly show `config`; the actual working format confirmed by the official [gemini-live-api-examples](https://github.com/google-gemini/gemini-live-api-examples) repo uses `setup`

### 3. All WebSocket Message Keys Must Be camelCase

The Gemini Live API uses **camelCase** for all JSON field names. Do NOT use snake_case.

| ❌ Wrong (snake_case) | ✅ Correct (camelCase) |
|---|---|
| `system_instruction` | `systemInstruction` |
| `generation_config` | `generationConfig` |
| `response_modalities` | `responseModalities` |
| `speech_config` | `speechConfig` |
| `voice_config` | `voiceConfig` |
| `prebuilt_voice_config` | `prebuiltVoiceConfig` |
| `voice_name` | `voiceName` |
| `input_audio_transcription` | `inputAudioTranscription` |
| `output_audio_transcription` | `outputAudioTranscription` |
| `realtime_input` | `realtimeInput` |
| `mime_type` | `mimeType` |

### 4. Audio Chunk Message Format

```json
{
  "realtimeInput": {
    "audio": {
      "data": "<base64-encoded PCM>",
      "mimeType": "audio/pcm;rate=16000"
    }
  }
}
```

### 5. Correct Live API Model Names

Live API (WebSocket/streaming) requires the `-live-` model variant:

| ✅ Correct | ❌ Wrong |
|---|---|
| `models/gemini-3.1-flash-live-preview` | `models/gemini-3.1-flash-lite-preview` |

The model name must always include the `models/` prefix in the setup config.

### 6. `inputAudioTranscription` Must Be an Empty Object

Do NOT pass a `model` field inside `inputAudioTranscription`. The server rejects it:

```json
"inputAudioTranscription": {}
```

**Wrong**:
```json
"inputAudioTranscription": { "model": "models/gemini-3.1-flash-live-preview" }
```

### 7. Ephemeral Token Minting (Backend)

The backend mints tokens via `@google/genai` SDK (`ai.authTokens.create`). The token's `.name` field (e.g. `auth_tokens/abc123`) is what gets passed to the frontend and used as `access_token` in the WebSocket URL. The token is only valid for the `v1alpha` API version.

```ts
const token = await ai.authTokens.create({ config: { uses: 1, expireTime, ... } });
// token.name is the value to pass to the client
```

### 8. WebSocket Close Codes Reference

| Code | Meaning in this context |
|---|---|
| `1007` | Invalid frame payload — usually means the setup JSON message has wrong keys/structure |
| `1008` | Policy violation — usually means wrong endpoint, wrong auth parameter, or unsupported model |
| `1000` / `1005` | Normal/clean close — not an error |

### 9. `connect()` Must Be a Promise That Awaits `onopen`

The `connect()` function in `useGeminiLiveSession.ts` returns a `Promise<void>` that **only resolves after `ws.onopen` fires**. This is critical — without this, the app transitions to the `interviewing` phase before the WebSocket is actually open, causing a silent hang.

If `onerror` or `onclose` fires before `onopen`, the promise must **reject** (not just call an error callback), so the caller can properly handle it and reset the UI phase.

---

## Firebase Auth: Preview Deployment Logins

**Problem**: Signing in on Vercel preview URLs fails because Firebase Auth blocks sign-ins from unlisted domains.

**Fix**: Go to Firebase Console → Authentication → Settings → Authorized Domains → Add the preview domain.

For Vercel preview deployments, you can add `vercel.app` to authorize all Vercel subdomains (acceptable for dev/test). For production, only add your specific production domain.

---

## Architecture Notes

### Audition Flow (phase state machine)

```
setup → requesting-permission → connecting → interviewing → ending → results
```

- `setup`: SetupScreen shown. Mic permission pre-loaded silently.
- `requesting-permission`: Await `audioCapture.requestPermission()`.
- `connecting`: Token fetched from `/api/audition/token`, WebSocket connecting.
- `interviewing`: WebSocket open & setup sent, audio capture streaming.
- `ending`: Interview stopped, feedback API called.
- `results`: ResultsScreen shown.

On any error after `connecting`, the phase must reset to `setup` and the error must be surfaced.

### Per-User Settings (Firestore)

Stored at `auditionSettings/{uid}`:
- `geminiApiKey` — user's personal Gemini API key (overrides env var)
- `voiceName` — AI voice (Aoede, Charon, Fenrir, Kore, Puck)
- `liveModel` — override for Live model name
- `liveApiHost` — override for WebSocket host
- `presets` — saved interview config presets (array)

### API Routes

- `POST /api/audition/token` — Mints an ephemeral Gemini token. Requires Firebase `Authorization: Bearer <idToken>` header. Reads user API key from Firestore. Returns `{ token: string }`.
- `POST /api/audition/feedback` — Generates post-interview score/feedback via standard Gemini REST API.

---

## Deployment

- **Platform**: Vercel
- **Environment variables required**:
  - `GEMINI_API_KEY` — fallback API key
  - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — Firebase Admin SDK credentials
  - Firebase client config vars (`NEXT_PUBLIC_FIREBASE_*`)
- `FIREBASE_PRIVATE_KEY` must have `\n` replaced with actual newlines in Vercel (the route handler does `.replace(/\\n/g, '\n')`)
