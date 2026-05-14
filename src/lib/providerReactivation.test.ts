import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signInWithRedirect } from 'firebase/auth';
import { continueDeletedProviderReactivation } from './providerReactivation';

vi.mock('firebase/auth', () => ({
  signInWithRedirect: vi.fn(),
}));

describe('provider deleted-account reactivation', () => {
  beforeEach(() => {
    vi.mocked(signInWithRedirect).mockReset();
  });

  it('stores the reactivation token and continues with redirect', async () => {
    const requestDeletedAccountReactivation = vi.fn().mockResolvedValue({
      requestedType: 'agency',
      reactivationToken: 'token-1',
    });
    const storeSignupIntent = vi.fn();
    const auth = { name: 'auth' } as any;
    const provider = { providerId: 'google.com' } as any;

    await continueDeletedProviderReactivation({
      auth,
      provider,
      email: 'deleted@example.com',
      requestedType: 'agency',
      requestDeletedAccountReactivation,
      storeSignupIntent,
    });

    expect(requestDeletedAccountReactivation).toHaveBeenCalledWith('deleted@example.com', 'agency');
    expect(storeSignupIntent).toHaveBeenCalledWith('agency', 'token-1');
    expect(signInWithRedirect).toHaveBeenCalledWith(auth, provider);
  });

  it('does not redirect when reactivation preparation fails', async () => {
    const requestDeletedAccountReactivation = vi.fn().mockRejectedValue(new Error('not eligible'));

    await expect(continueDeletedProviderReactivation({
      auth: { name: 'auth' } as any,
      provider: { providerId: 'google.com' } as any,
      email: 'deleted@example.com',
      requestedType: 'business',
      requestDeletedAccountReactivation,
      storeSignupIntent: vi.fn(),
    })).rejects.toThrow('not eligible');

    expect(signInWithRedirect).not.toHaveBeenCalled();
  });
});
