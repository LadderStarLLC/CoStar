import { createHash, timingSafeEqual } from 'crypto';

export const AI_CONTENT_API_TOKEN_ENV = 'AI_CONTENT_API_TOKEN';

export function isAiContentApiConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env[AI_CONTENT_API_TOKEN_ENV]?.trim());
}

export function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const [scheme, ...tokenParts] = authHeader.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer') return null;

  const token = tokenParts.join(' ').trim();
  return token || null;
}

export function isValidAiContentToken(providedToken: string | null, env: NodeJS.ProcessEnv = process.env): boolean {
  const expectedToken = env[AI_CONTENT_API_TOKEN_ENV]?.trim();
  if (!expectedToken || !providedToken) return false;

  const expectedDigest = createHash('sha256').update(expectedToken).digest();
  const providedDigest = createHash('sha256').update(providedToken).digest();
  return timingSafeEqual(expectedDigest, providedDigest);
}

export function requireAiContentAccess(req: Request, env: NodeJS.ProcessEnv = process.env): Response | null {
  if (!isAiContentApiConfigured(env)) {
    return Response.json({ error: 'AI content API is not configured.' }, { status: 404 });
  }

  if (!isValidAiContentToken(getBearerToken(req), env)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
