import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'AI & Data Policy - LadderStar',
  description: 'How LadderStar uses AI for audition practice, transcripts, feedback, and responsible user expectations.',
};

export default function AiPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="AI & Data Policy"
      description="This policy explains how LadderStar uses AI-powered audition practice and how users should treat generated feedback."
      sections={[
        { title: '1. AI features', body: <p>LadderStar audition features may use Google Gemini Live API or related AI systems to conduct practice interviews, process microphone audio, produce transcripts, generate feedback, score responses, and summarize strengths or improvements.</p> },
        { title: '2. Data processed', body: <p>AI features may process your audition settings, role context, microphone audio, transcript text, prompts, generated responses, tool-call data, feedback, score, session status, timestamps, and saved session history.</p> },
        { title: '3. Output limitations', body: <p>AI output may be wrong, incomplete, biased, delayed, or unsuitable for a specific employer, industry, role, jurisdiction, or personal circumstance. Review and edit output before using it in applications, interviews, employment decisions, or professional communications.</p> },
        { title: '4. Sensitive information', body: <p>Do not submit government identifiers, health information, financial account numbers, confidential employer information, trade secrets, or third-party personal information unless you have the right and a clear need to do so.</p> },
        { title: '5. No employment guarantee', body: <p>AI audition practice is a coaching and preparation tool. LadderStar does not guarantee interviews, job offers, compensation, ranking, employer response, candidate quality, or hiring results.</p> },
      ]}
    />
  );
}
