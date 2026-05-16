#!/usr/bin/env node

const DEFAULT_BASE_URL = 'https://www.ladderstar.com';
const API_BASE_URL = (process.env.BLOG_API_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const FIREBASE_ID_TOKEN = process.env.FIREBASE_ID_TOKEN || process.env.BLOG_FIREBASE_ID_TOKEN || process.env.ID_TOKEN;
const BLOG_POST_ID = process.env.BLOG_POST_ID || '';
const REQUEST_METHOD = BLOG_POST_ID ? 'PATCH' : 'POST';
const API_PATH = BLOG_POST_ID ? `/api/blog/${BLOG_POST_ID}` : '/api/blog';
const DRY_RUN = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run');

const linkMark = (href) => ({ type: 'link', attrs: { href, target: null, rel: null, class: null } });
const text = (value, marks) => (marks ? { type: 'text', text: value, marks } : { type: 'text', text: value });
const paragraph = (...content) => ({ type: 'paragraph', content });
const heading = (level, value) => ({ type: 'heading', attrs: { level }, content: [text(value)] });
const bulletList = (items) => ({
  type: 'bulletList',
  content: items.map((item) => ({ type: 'listItem', content: [paragraph(...item)] })),
});
const orderedList = (items) => ({
  type: 'orderedList',
  attrs: { start: 1, type: null },
  content: items.map((item) => ({ type: 'listItem', content: [paragraph(...item)] })),
});
const blockquote = (...content) => ({ type: 'blockquote', content: [paragraph(...content)] });

const contentDoc = {
  type: 'doc',
  content: [
    paragraph(
      text('If you need to practice for a job interview after years away from the process, you are not starting over. You are rebuilding a skill you have not had to use recently.')
    ),
    paragraph(
      text('Interviews can feel strange after a long break because you have to turn real experience into clear, spoken answers. The goal is not to sound perfect. The goal is to help an employer quickly understand what you have done, how you think, and why you are ready for the role in front of you.')
    ),
    blockquote(
      text('Short answer: choose one target role, refresh your career story, prepare a few proof-based examples, practice out loud, and complete at least one realistic mock interview before a recruiter call or hiring conversation.')
    ),
    heading(2, 'Why interviews feel harder after a long break'),
    paragraph(
      text('You may have been steady in one job, freelancing, caregiving, studying, recovering, relocating, switching careers, or simply not looking for work. Whatever the reason, your skills may still be strong while your interview answers feel unorganized.')
    ),
    paragraph(text('That is normal.')),
    paragraph(
      text('Interviewing is a translation exercise. You are translating your work history into concise examples that match what a hiring team needs now. If you have not done that in a while, your first answers may come out too long, too vague, or too apologetic.')
    ),
    paragraph(text('Practice helps you make the useful parts of your experience easier to hear.')),
    heading(2, 'Step 1: Pick one target role before you practice'),
    paragraph(
      text('Do not practice for every possible job at once. Start with one role family, such as customer support, operations coordinator, project manager, sales development, administrative manager, junior analyst, or account manager.')
    ),
    paragraph(
      text('Then review three to five job descriptions for that kind of role. Look for repeated words, tools, responsibilities, and outcomes. Those repeated patterns are your practice map.')
    ),
    paragraph(text('Ask:')),
    bulletList([
      [text('What problems does this role solve?')],
      [text('What skills appear in multiple postings?')],
      [text('What experience do I already have that proves I can do similar work?')],
      [text('What examples would help someone trust me in this role?')],
    ]),
    paragraph(
      text('You can browse open roles on '),
      text('LadderStar jobs', [linkMark('/jobs')]),
      text(' or compare postings from other job boards.')
    ),
    heading(2, 'Step 2: Rebuild your career story in plain language'),
    paragraph(
      text('Your career story is the short explanation of where you have been, what you are good at, and what you want next. It should sound like a person talking, not a resume summary.')
    ),
    paragraph(text('Use this simple structure:')),
    bulletList([
      [text('Past context: “For the last few years, I have been focused on…”')],
      [text('Present strengths: “The work I am strongest at is…”')],
      [text('Next direction: “Now I am looking for a role where I can…”')],
    ]),
    heading(2, 'Example answer for “Tell me about yourself” after time away'),
    blockquote(
      text('“For the last few years, I have been focused on operations and customer support work where accuracy, follow-through, and calm communication mattered every day. I have handled scheduling, issue tracking, documentation, and coordination across different people and deadlines. Now I am looking for a role where I can bring that structure into a team that needs reliable execution and clear communication.”')
    ),
    paragraph(text('This answer does not apologize for your path. It explains the value you bring and points it toward the job.')),
    heading(2, 'Step 3: Prepare five proof stories'),
    paragraph(
      text('Strong interview answers usually need evidence. Instead of trying to memorize dozens of responses, prepare five stories you can adapt.')
    ),
    paragraph(text('Choose examples for:')),
    bulletList([
      [text('Solving a problem')],
      [text('Handling a difficult person or situation')],
      [text('Learning something quickly')],
      [text('Organizing work or improving a process')],
      [text('Delivering a result under pressure')],
    ]),
    paragraph(text('For each story, write a short version using this structure:')),
    orderedList([
      [text('Situation: What was happening?')],
      [text('Task: What were you responsible for?')],
      [text('Action: What did you do?')],
      [text('Result: What changed because of your work?')],
      [text('Relevance: Why does this matter for the job?')],
    ]),
    paragraph(
      text('The relevance step is important. Do not make the interviewer guess why your example matters. Connect it directly to the role.')
    ),
    heading(2, 'Step 4: Practice common questions out loud'),
    paragraph(
      text('Silent practice can help you organize ideas, but interviews happen out loud. Your answers need to feel natural when spoken.')
    ),
    paragraph(text('Start with these questions:')),
    bulletList([
      [text('Tell me about yourself.')],
      [text('Why are you interested in this role?')],
      [text('Walk me through your recent experience.')],
      [text('Tell me about a time you solved a problem.')],
      [text('Tell me about a time you handled conflict or pressure.')],
      [text('What are your strengths?')],
      [text('Why should we consider you for this position?')],
      [text('Do you have any questions for us?')],
    ]),
    paragraph(
      text('Record yourself answering one question in 60 to 90 seconds. Listen once for clarity, not perfection. Then answer again.')
    ),
    paragraph(text('Focus on:')),
    bulletList([
      [text('Did I answer the question early?')],
      [text('Did I include a real example?')],
      [text('Did I explain my own actions clearly?')],
      [text('Did I stop after making the point?')],
      [text('Did I sound like myself?')],
    ]),
    heading(2, 'Step 5: Do one realistic mock interview'),
    paragraph(
      text('Once your stories are ready, run a mock interview. Treat it like a real conversation. Do not pause every few seconds to edit yourself. Let the answer happen, then review it afterward.')
    ),
    paragraph(text('A useful mock interview should test:')),
    bulletList([
      [text('Whether your opening answer is clear')],
      [text('Whether your examples are specific')],
      [text('Whether you can recover after a messy answer')],
      [text('Whether your tone feels confident and conversational')],
      [text('Whether you can connect your experience to the target role')],
    ]),
    paragraph(
      text('LadderStar’s '),
      text('AI interview practice', [linkMark('/audition')]),
      text(' can help you rehearse before a real recruiter or hiring manager conversation.')
    ),
    heading(2, 'Step 6: Update your public profile while you practice'),
    paragraph(
      text('If you have not interviewed in years, your profile can help create context before a conversation starts. Keep it simple and specific.')
    ),
    paragraph(text('Update:')),
    bulletList([
      [text('Headline: Name the kind of role you want next.')],
      [text('Summary: Explain the problems you are good at solving.')],
      [text('Skills: Match the language from target roles without exaggerating.')],
      [text('Experience: Highlight outcomes, tools, responsibilities, and examples.')],
      [text('Projects or proof: Add anything that supports your story.')],
    ]),
    paragraph(
      text('Your '),
      text('profile', [linkMark('/profile')]),
      text(' and your interview answers should point in the same direction.')
    ),
    heading(2, 'Mini worksheet: prepare one interview example'),
    paragraph(text('Copy this into a note and fill it out:')),
    bulletList([
      [text('Question I am preparing for:')],
      [text('Role I played:')],
      [text('Problem or goal:')],
      [text('Steps I took:')],
      [text('Result or useful change:')],
      [text('Skill this proves:')],
      [text('One sentence that connects it to the job:')],
    ]),
    heading(2, 'How LadderStar can help'),
    paragraph(
      text('LadderStar is built for job seekers who want more than a pile of applications. You can build a public professional profile, browse roles, and use AI interview practice to get clearer before a real conversation.')
    ),
    paragraph(text('Use LadderStar to:')),
    bulletList([
      [text('Browse '), text('open jobs', [linkMark('/jobs')])],
      [text('Create or update your '), text('public profile', [linkMark('/profile')])],
      [text('Practice interviews with '), text('AI interview practice', [linkMark('/audition')])],
      [text('Compare free and paid options on the '), text('pricing page', [linkMark('/pricing')])],
      [text('Create an account', [linkMark('/sign-up')]), text(' when you are ready to save your progress')],
    ]),
    heading(2, 'FAQ'),
    heading(3, 'How long should I practice if I have not interviewed in years?'),
    paragraph(
      text('Start with three focused sessions. Use one to refresh your career story, one to prepare examples, and one to complete a mock interview. More practice helps, but three serious sessions can quickly reduce the rusty feeling.')
    ),
    heading(3, 'Should I memorize interview answers?'),
    paragraph(
      text('No. Memorized answers often sound stiff. Memorize the structure and key points instead. Know your opening sentence, the example you want to use, and the skill you want the interviewer to remember.')
    ),
    heading(3, 'What if my recent experience does not match the job exactly?'),
    paragraph(
      text('Focus on transferable proof. Show where you solved similar problems, learned quickly, communicated clearly, handled responsibility, or improved a process. Then explain why those strengths fit the role you want now.')
    ),
    heading(3, 'How do I explain being out of the workforce?'),
    paragraph(
      text('Keep it brief, neutral, and forward-looking. You can mention caregiving, health, study, relocation, contract work, family responsibilities, or personal priorities, then move quickly to what you are ready to do next.')
    ),
    heading(3, 'Can AI interview practice make my answers sound fake?'),
    paragraph(
      text('It can if you copy language that does not sound like you. Use AI practice to find gaps, organize examples, and rehearse. Keep your wording natural and anchored in real experience.')
    ),
    heading(2, 'Key takeaway'),
    paragraph(
      text('When you have not interviewed in years, the goal is not to become a different person. The goal is to make your real experience easy to understand. Choose a target role, prepare five proof stories, practice out loud, and make your profile match the direction you want next.')
    ),
    paragraph(
      text('Create a free LadderStar profile and start practicing before your next interview.', [linkMark('/sign-up')])
    ),
  ],
};

const payload = {
  title: 'How to Practice for a Job Interview When You Have Not Interviewed in Years',
  excerpt: 'A practical reset plan for job seekers who feel rusty, nervous, or unsure how to explain their experience after time away from interviewing.',
  status: 'draft',
  contentJson: JSON.stringify(contentDoc),
};

if (process.argv.includes('--print-payload')) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(0);
}

if (DRY_RUN) {
  console.log(`Dry run: would submit a human-reviewed draft with ${REQUEST_METHOD} ${API_BASE_URL}${API_PATH}`);
  console.log(JSON.stringify({ ...payload, contentJson: `[${payload.contentJson.length} bytes]` }, null, 2));
  process.exit(0);
}

if (!FIREBASE_ID_TOKEN) {
  console.error('Missing FIREBASE_ID_TOKEN, BLOG_FIREBASE_ID_TOKEN, or ID_TOKEN. Cannot authenticate to create the blog draft.');
  console.error(`Target endpoint would be: ${REQUEST_METHOD} ${API_BASE_URL}${API_PATH}`);
  console.error('Run with --print-payload to inspect the REST request body.');
  process.exit(2);
}

const response = await fetch(`${API_BASE_URL}${API_PATH}`, {
  method: REQUEST_METHOD,
  headers: {
    Authorization: `Bearer ${FIREBASE_ID_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

const responseText = await response.text();
if (!response.ok) {
  console.error(`Publish failed with HTTP ${response.status}.`);
  console.error(responseText);
  process.exit(1);
}

console.log(`Draft submission succeeded with HTTP ${response.status}.`);
console.log(responseText);
