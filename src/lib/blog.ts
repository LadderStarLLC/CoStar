import type { JSONContent } from '@tiptap/react';

export type BlogPostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentJson: string;
  status: BlogPostStatus;
  authorUid: string;
  authorName: string;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  canonicalPath?: string;
  source?: 'static' | 'firestore';
}


export const EMPTY_BLOG_CONTENT: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
};

export function createBlogSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || 'post';
}

export function safeParseBlogContent(contentJson?: string | null): JSONContent {
  if (!contentJson) return EMPTY_BLOG_CONTENT;

  try {
    const parsed = JSON.parse(contentJson);
    if (parsed && typeof parsed === 'object') return parsed as JSONContent;
  } catch {
    return EMPTY_BLOG_CONTENT;
  }

  return EMPTY_BLOG_CONTENT;
}

export function serializeBlogTimestamp(value: any): string | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}


const BLOG_PUBLISH_DATE = '2026-05-14T00:00:00.000Z';

const linkMark = (href: string) => ({ type: 'link', attrs: { href, target: null, rel: null, class: null } });
const textNode = (text: string, marks?: Array<Record<string, unknown>>): JSONContent => marks ? { type: 'text', text, marks } : { type: 'text', text };
const paragraph = (...content: JSONContent[]): JSONContent => ({ type: 'paragraph', content });
const heading = (level: 2 | 3, text: string): JSONContent => ({ type: 'heading', attrs: { level }, content: [textNode(text)] });
const bulletList = (items: JSONContent[][]): JSONContent => ({
  type: 'bulletList',
  content: items.map((item) => ({ type: 'listItem', content: [paragraph(...item)] })),
});
const orderedList = (items: JSONContent[][]): JSONContent => ({
  type: 'orderedList',
  attrs: { start: 1, type: null },
  content: items.map((item) => ({ type: 'listItem', content: [paragraph(...item)] })),
});
const blockquote = (...content: JSONContent[]): JSONContent => ({ type: 'blockquote', content: [paragraph(...content)] });

const practiceInterviewAfterYearsContent: JSONContent = {
  type: 'doc',
  content: [
    paragraph(
      textNode('If you need to '),
      textNode('practice for a job interview when you have not interviewed in years'),
      textNode(', you are not behind. You are just rusty. The fastest way back is to rebuild your interview muscles with current role research, a few clear stories, and repeated answer practice out loud.')
    ),
    blockquote(
      textNode('Short answer: Start by choosing one target role, update your career story, prepare five proof-based examples, practice common questions out loud, and run at least one realistic mock interview before you apply or speak with a recruiter.')
    ),
    heading(2, 'Why interviews feel harder after a long break'),
    paragraph(
      textNode('Interviewing changes when you have been stable in a role, out of the market, freelancing, caregiving, studying, recovering, or switching fields. You may still be capable, but your examples can feel scattered because you have not had to explain them recently.')
    ),
    paragraph(
      textNode('That does not mean you need a perfect resume. It means you need a current, practiced way to connect your experience to the role in front of you.')
    ),
    heading(2, 'Step 1: Pick one target role before you practice'),
    paragraph(
      textNode('Do not practice for every job at once. Choose one role family, such as customer success, operations coordinator, junior analyst, project manager, support specialist, sales development, or administrative manager.')
    ),
    paragraph(
      textNode('Then compare three to five postings on the '),
      textNode('LadderStar jobs page', [linkMark('/jobs')]),
      textNode(' or another job board. Write down the repeated skills, tools, and responsibilities. Those repeated signals become your practice map.')
    ),
    heading(2, 'Step 2: Rebuild your career story in plain language'),
    paragraph(
      textNode('Your career story is the short explanation of where you have been, what you can do, and why this role makes sense now. It should sound like a person, not a resume summary.')
    ),
    paragraph(
      textNode('Use this three-part shape: past context, present strengths, next direction.')
    ),
    bulletList([
      [textNode('Past context: “For the last few years, I have been focused on...”')],
      [textNode('Present strengths: “The work I am strongest at is...”')],
      [textNode('Next direction: “Now I am looking for a role where I can...”')],
    ]),
    heading(2, 'Example answer for “Tell me about yourself” after time away'),
    blockquote(
      textNode('“For the last few years, I have been focused on operations and customer support work where accuracy, follow-through, and calm communication mattered every day. I have handled scheduling, issue tracking, documentation, and coordination across different people and deadlines. Now I am looking for a role where I can bring that structure into a team that needs reliable execution and clear communication. This position stood out because it combines problem solving, organization, and direct support for customers or internal teams.”')
    ),
    paragraph(
      textNode('This answer does not apologize. It names useful strengths, explains direction, and connects to the role.')
    ),
    heading(2, 'Step 3: Build five proof stories before memorizing answers'),
    paragraph(
      textNode('Most interview answers improve when you stop trying to sound impressive and start proving one point at a time. A proof story is a real example that shows how you work.')
    ),
    paragraph(
      textNode('Prepare one story for each of these areas:')
    ),
    orderedList([
      [textNode('Solving a problem when the next step was unclear.')],
      [textNode('Working with a difficult person, customer, client, or teammate.')],
      [textNode('Learning a new tool, process, policy, or industry quickly.')],
      [textNode('Handling pressure, competing deadlines, or a mistake.')],
      [textNode('Making work easier, faster, clearer, or more organized.')],
    ]),
    heading(2, 'Step 4: Use the simple RISE framework'),
    paragraph(
      textNode('RISE is a practical framework for behavioral interview answers. It keeps you from rambling and helps your examples sound complete.')
    ),
    bulletList([
      [textNode('R, role: What was your responsibility in the situation?')],
      [textNode('I, issue: What problem, goal, or constraint mattered?')],
      [textNode('S, steps: What specific actions did you take?')],
      [textNode('E, effect: What changed because of your work?')],
    ]),
    paragraph(
      textNode('If you do not have a dramatic result, use a grounded effect: fewer missed details, faster response time, cleaner documentation, a calmer customer, a smoother handoff, or a manager who could make a better decision.')
    ),
    heading(2, 'Mini worksheet: prepare one strong interview example'),
    paragraph(textNode('Copy this into a note and fill it out before you practice:')),
    bulletList([
      [textNode('Question I am preparing for:')],
      [textNode('Role I played:')],
      [textNode('Issue or goal:')],
      [textNode('Steps I took:')],
      [textNode('Result or useful change:')],
      [textNode('Skill this proves:')],
      [textNode('One sentence that connects it to the job:')],
    ]),
    heading(2, 'Step 5: Practice out loud before you polish the words'),
    paragraph(
      textNode('Silent practice feels easier, but interviews happen out loud. Record yourself answering one question in 60 to 90 seconds. Listen once for clarity, not perfection. Then try again.')
    ),
    paragraph(
      textNode('Focus on these checks:')
    ),
    bulletList([
      [textNode('Did I answer the question in the first two sentences?')],
      [textNode('Did I include a real example instead of a general claim?')],
      [textNode('Did I explain my own actions clearly?')],
      [textNode('Did I stop after the point was made?')],
      [textNode('Did I sound like myself?')],
    ]),
    heading(2, 'Step 6: Update your public profile while you practice'),
    paragraph(
      textNode('If you have not interviewed in years, your public profile can do some early trust-building before a conversation starts. Keep it simple and specific.')
    ),
    bulletList([
      [textNode('Headline: Name the role direction you want next.')],
      [textNode('Summary: Explain the problems you are good at solving.')],
      [textNode('Skills: Match the repeated language from target roles without exaggerating.')],
      [textNode('Proof: Add projects, outcomes, tools, certifications, or examples that support your story.')],
    ]),
    paragraph(
      textNode('You can work on your LadderStar profile from '),
      textNode('the profile page', [linkMark('/profile')]),
      textNode(' after creating an account.')
    ),
    heading(2, 'How LadderStar can help'),
    paragraph(
      textNode('LadderStar is built for job seekers who want more than a pile of applications. You can build a public professional profile, browse high-signal roles, and use AI interview practice to get clearer before a real conversation.')
    ),
    paragraph(
      textNode('For interview reps, go to '),
      textNode('AI interview practice', [linkMark('/audition')]),
      textNode('. To explore opportunities, browse '),
      textNode('open jobs', [linkMark('/jobs')]),
      textNode('. To compare free and paid options, review '),
      textNode('pricing', [linkMark('/pricing')]),
      textNode('. If you are ready to save your profile and start practicing, you can '),
      textNode('create an account', [linkMark('/sign-up')]),
      textNode('.')
    ),
    heading(2, 'FAQ'),
    heading(3, 'How long should I practice if I have not interviewed in years?'),
    paragraph(
      textNode('Start with three focused sessions. Use the first to update your career story, the second to prepare examples, and the third to run a mock interview. More practice helps, but three serious sessions can reduce the rusty feeling.')
    ),
    heading(3, 'Should I memorize interview answers?'),
    paragraph(
      textNode('No. Memorized answers often sound stiff. Memorize the structure and key points instead. Know your opening sentence, your example, and the skill you want the interviewer to remember.')
    ),
    heading(3, 'What if my recent experience does not match the job exactly?'),
    paragraph(
      textNode('Focus on transferable proof. Show where you solved similar problems, learned quickly, communicated clearly, handled responsibility, or improved a process. Then explain why those strengths fit the role you want now.')
    ),
    heading(3, 'How do I explain being out of the workforce?'),
    paragraph(
      textNode('Keep it brief, neutral, and forward-looking. You can say you took time for caregiving, health, study, family, relocation, contract work, or personal priorities, then move quickly to what you are ready to do next.')
    ),
    heading(3, 'Can AI interview practice make my answers sound fake?'),
    paragraph(
      textNode('It can if you copy polished language that does not sound like you. Use AI practice to find gaps, organize examples, and rehearse. Keep your wording natural and anchored in real experience.')
    ),
    heading(2, 'Key takeaway'),
    paragraph(
      textNode('When you have not interviewed in years, the goal is not to become a different person. The goal is to make your real experience easy to understand. Choose a target role, prepare five proof stories, practice out loud, and make your profile match the direction you want next.')
    ),
    paragraph(
      textNode('Create a free LadderStar profile and start practicing before your next interview.', [linkMark('/sign-up')])
    ),
  ],
};

export const STATIC_BLOG_POSTS: BlogPost[] = [
  {
    id: 'static-practice-interview-after-years',
    title: 'How to Practice for a Job Interview When You Have Not Interviewed in Years',
    slug: 'practice-interview-after-years',
    excerpt: 'A practical interview refresh plan for job seekers who feel rusty, anxious, or unsure how to explain their experience after time away.',
    contentJson: JSON.stringify(practiceInterviewAfterYearsContent),
    status: 'published',
    authorUid: 'ladderstar',
    authorName: 'LadderStar Team',
    createdAt: BLOG_PUBLISH_DATE,
    updatedAt: BLOG_PUBLISH_DATE,
    publishedAt: BLOG_PUBLISH_DATE,
    metaTitle: 'How to Practice for an Interview After Years Away',
    metaDescription: 'Feel rusty after years away from interviews? Use this practical plan to rebuild your story, prepare examples, and practice clear answers.',
    tags: ['Interview Practice', 'Job Search', 'Career Momentum'],
    canonicalPath: '/blog/practice-interview-after-years',
    source: 'static',
  },
];

export function getStaticBlogPostBySlug(slug: string): BlogPost | undefined {
  return STATIC_BLOG_POSTS.find((post) => post.slug === slug && post.status === 'published');
}

export function getStaticBlogPosts(): BlogPost[] {
  return [...STATIC_BLOG_POSTS];
}
