import { AuditionPage } from '@/components/audition/AuditionPage';

interface Props {
  params: { jobId: string };
}

export default function AuditionRoute({ params }: Props) {
  return <AuditionPage jobId={params.jobId} />;
}
