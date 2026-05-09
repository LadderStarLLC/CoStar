import crypto from 'crypto';
import { PREVIEW_AUTH_COOKIE, PREVIEW_AUTH_UID, isPreviewAuthEnabled } from './deploymentMode';

type PreviewSessionPayload = {
  uid: string;
  iat: number;
};

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function createPreviewSessionToken(secret: string, now = Date.now()): string {
  const payload: PreviewSessionPayload = { uid: PREVIEW_AUTH_UID, iat: now };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyPreviewSessionToken(
  token: string | null | undefined,
  secret: string | undefined,
  now = Date.now(),
): PreviewSessionPayload | null {
  if (!token || !secret) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;
  const expectedSignature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  if (signature.length !== expectedSignature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as PreviewSessionPayload;
    if (payload.uid !== PREVIEW_AUTH_UID) return null;
    if (!Number.isFinite(payload.iat) || now - payload.iat > SESSION_TTL_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const prefix = `${name}=`;
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

export function getPreviewSessionFromRequest(req: Request, env: NodeJS.ProcessEnv = process.env): PreviewSessionPayload | null {
  if (!isPreviewAuthEnabled(env)) return null;
  const cookieToken = readCookie(req.headers.get('cookie'), PREVIEW_AUTH_COOKIE);
  return verifyPreviewSessionToken(cookieToken, env.PREVIEW_AUTH_SECRET);
}
