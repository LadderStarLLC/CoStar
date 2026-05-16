import type { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { COSTAR_MODEL } from './messagingServer';
import { createBlogSlug, getBlogPermissions } from './blog';
import { getCallerProfile } from './firebaseAdmin';

export interface BlogCaller {
  decoded: DecodedIdToken;
  profile: any;
  db: Firestore;
  permissions: ReturnType<typeof getBlogPermissions>;
}

export async function requireBlogWriter(req: Request): Promise<BlogCaller> {
  const caller = await getCallerProfile(req);
  const permissions = getBlogPermissions(caller.profile);
  if (!permissions.canWriteDrafts) {
    throw new Response(JSON.stringify({ error: 'Blog writer access required.' }), { status: 403 });
  }
  return { ...caller, permissions };
}

export async function requireBlogPublisher(req: Request): Promise<BlogCaller> {
  const caller = await getCallerProfile(req);
  const permissions = getBlogPermissions(caller.profile);
  if (!permissions.canPublish) {
    throw new Response(JSON.stringify({ error: 'Blog publisher access required.' }), { status: 403 });
  }
  return { ...caller, permissions };
}

export async function callerCanManageBlog(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  try {
    const { profile } = await getCallerProfile(req);
    return getBlogPermissions(profile).canReadDrafts;
  } catch {
    return false;
  }
}

export async function createUniqueBlogSlug(db: Firestore, title: string): Promise<string> {
  const baseSlug = createBlogSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (counter < 100) {
    const snap = await db.collection('blogPosts').where('slug', '==', slug).limit(1).get();
    if (snap.empty) return slug;
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

export function getAuthorName(profile: any, decoded: DecodedIdToken): string {
  return profile?.displayName || profile?.email || decoded.name || decoded.email || 'LadderStar Blog Team';
}

export function buildHumanBlogMetadata(decoded: DecodedIdToken, publishNow: boolean) {
  return {
    source: 'human',
    reviewStatus: publishNow ? 'approved' : 'needs_review',
    lastEditedByUid: decoded.uid,
    publishedByUid: publishNow ? decoded.uid : null,
    publishedAt: publishNow ? FieldValue.serverTimestamp() : null,
  };
}

export const BLOG_AI_MODEL = process.env.BLOG_AI_MODEL || COSTAR_MODEL;

export function normalizeAiDraftInput(body: any) {
  const topic = normalizeText(body?.topic, 180);
  const audience = normalizeText(body?.audience, 180);
  const goal = normalizeText(body?.goal, 240);
  const keywords = normalizeList(body?.keywords, 12, 60);
  const internalLinks = normalizeList(body?.internalLinks, 10, 120);
  const sourceNotes = normalizeText(body?.sourceNotes, 3000);

  if (!topic) {
    throw new Response(JSON.stringify({ error: 'Topic is required.' }), { status: 400 });
  }

  return { topic, audience, goal, keywords, internalLinks, sourceNotes };
}

export function buildAiPromptSummary(input: ReturnType<typeof normalizeAiDraftInput>): string {
  return [
    `Topic: ${input.topic}`,
    input.audience ? `Audience: ${input.audience}` : null,
    input.goal ? `Goal: ${input.goal}` : null,
    input.keywords.length ? `Keywords: ${input.keywords.join(', ')}` : null,
  ].filter(Boolean).join(' | ').slice(0, 900);
}

export async function generateAiBlogDraft(input: ReturnType<typeof normalizeAiDraftInput>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Response(JSON.stringify({ error: 'No Gemini API key configured for AI blog drafts.' }), { status: 500 });
  }

  const systemInstruction = `You write LadderStar blog drafts for a job discovery and AI interview practice platform.
Return only valid JSON with this shape:
{
  "title": "string",
  "excerpt": "string",
  "sections": [
    { "type": "paragraph", "text": "string" },
    { "type": "heading", "level": 2, "text": "string" },
    { "type": "bulletList", "items": ["string"] },
    { "type": "orderedList", "items": ["string"] }
  ]
}
Rules:
- Write practical, accurate career or hiring content.
- Do not claim certifications, guarantees, legal compliance, or outcomes LadderStar cannot verify.
- Include natural mentions of LadderStar only where useful.
- Keep links as plain path text if provided, not HTML.
- Do not include markdown fences.`;

  const prompt = `Create a publish-ready draft that a human editor can review before publishing.

Topic: ${input.topic}
Audience: ${input.audience || 'Job seekers, hiring teams, or LadderStar users'}
Goal: ${input.goal || 'Educate readers and support LadderStar discovery'}
Keywords: ${input.keywords.join(', ') || 'None provided'}
Internal links to consider: ${input.internalLinks.join(', ') || 'None provided'}
Source notes:
${input.sourceNotes || 'None provided'}

Produce 900-1400 words with clear headings and concrete advice.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${BLOG_AI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.45,
        topP: 0.9,
        maxOutputTokens: 5000,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('[blog/ai-drafts] Gemini error:', errorText);
    throw new Response(JSON.stringify({ error: `Gemini draft generation failed with HTTP ${res.status}.` }), { status: 502 });
  }

  const payload = await res.json();
  const text = extractGeminiText(payload);
  const draft = parseAiDraft(text);
  return {
    title: normalizeText(draft.title, 180),
    excerpt: normalizeText(draft.excerpt, 300),
    contentJson: JSON.stringify(aiDraftToTipTap(draft)),
  };
}

function normalizeText(value: unknown, maxLength: number): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeList(value: unknown, maxItems: number, maxLength: number): string[] {
  const raw = Array.isArray(value) ? value : String(value ?? '').split(/[\n,]/);
  return raw.map((item) => normalizeText(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

function extractGeminiText(payload: any): string {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((part) => part?.text).filter(Boolean).join('\n').trim();
}

function parseAiDraft(text: string): any {
  const jsonText = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed?.title || !Array.isArray(parsed.sections)) {
      throw new Error('AI draft JSON missing title or sections.');
    }
    return parsed;
  } catch (err) {
    console.error('[blog/ai-drafts] Invalid AI draft JSON:', text.slice(0, 500));
    throw new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'AI draft response was not valid JSON.' }), { status: 502 });
  }
}

function aiDraftToTipTap(draft: any) {
  const content = draft.sections.flatMap((section: any) => {
    if (section?.type === 'heading') {
      const text = normalizeText(section.text, 240);
      if (!text) return [];
      const level = section.level === 3 ? 3 : 2;
      return [{ type: 'heading', attrs: { level }, content: [{ type: 'text', text }] }];
    }
    if (section?.type === 'bulletList' || section?.type === 'orderedList') {
      const items = normalizeList(section.items, 12, 240);
      if (!items.length) return [];
      return [{
        type: section.type,
        ...(section.type === 'orderedList' ? { attrs: { start: 1, type: null } } : {}),
        content: items.map((item) => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }],
        })),
      }];
    }
    const text = normalizeText(section?.text, 1200);
    if (!text) return [];
    return [{ type: 'paragraph', content: [{ type: 'text', text }] }];
  });

  return {
    type: 'doc',
    content: content.length ? content : [{ type: 'paragraph', content: [] }],
  };
}
