import ScreeningSessionClient from './screening-session-client';

type Props = {
  params: { token: string };
};

export default function ScreeningPage({ params }: Props) {
  return <ScreeningSessionClient token={params.token} />;
}
