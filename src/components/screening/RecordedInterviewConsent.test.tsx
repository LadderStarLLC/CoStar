import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RecordedInterviewConsent } from './RecordedInterviewConsent';

describe('RecordedInterviewConsent', () => {
  it('keeps continue disabled until consent is checked', () => {
    const onCheckedChange = vi.fn();
    render(
      <RecordedInterviewConsent
        consentText="This business screening session will be audio/video recorded."
        checked={false}
        onCheckedChange={onCheckedChange}
        onContinue={vi.fn()}
        onDecline={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /continue to recorded interview/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: /consent/i }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('disables continue when parent state blocks recording setup', () => {
    render(
      <RecordedInterviewConsent
        consentText="Recording notice"
        checked
        disabled
        onCheckedChange={vi.fn()}
        onContinue={vi.fn()}
        onDecline={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /continue to recorded interview/i })).toBeDisabled();
  });
});
