import { signInWithRedirect, type Auth, type AuthProvider } from 'firebase/auth';
import type { PublicAccountType } from './profile';

export interface DeletedAccountReactivationResponse {
  requestedType: PublicAccountType;
  reactivationToken: string;
}

export async function continueDeletedProviderReactivation(input: {
  auth: Auth;
  provider: AuthProvider;
  email: string;
  requestedType: PublicAccountType;
  requestDeletedAccountReactivation: (
    email: string,
    requestedType: PublicAccountType
  ) => Promise<DeletedAccountReactivationResponse>;
  storeSignupIntent: (requestedType: PublicAccountType, reactivationToken: string) => void;
}): Promise<void> {
  const reactivation = await input.requestDeletedAccountReactivation(input.email, input.requestedType);
  input.storeSignupIntent(input.requestedType, reactivation.reactivationToken);
  await signInWithRedirect(input.auth, input.provider);
}
