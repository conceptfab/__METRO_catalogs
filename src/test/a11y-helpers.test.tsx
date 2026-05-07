import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { expectNoA11yViolations } from './a11y-helpers';

describe('a11y-helpers', () => {
  it('passes for a button with accessible name', async () => {
    const { container } = render(<button aria-label="Save">OK</button>);
    await expectNoA11yViolations(container);
  });

  it('fails for an image without alt text', async () => {
    const { container } = render(<img src="/x.webp" />);
    await expect(expectNoA11yViolations(container)).rejects.toThrow();
  });
});
