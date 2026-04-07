import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('applies the default tone and exposes the accessible button role', () => {
    render(<Button>저장</Button>);

    const button = screen.getByRole('button', { name: '저장' });
    expect(button).toHaveClass('ui-button', 'ui-button--primary');
  });

  it('applies a custom tone and forwards disabled state', () => {
    render(
      <Button tone="danger" isDisabled>
        삭제
      </Button>,
    );

    const button = screen.getByRole('button', { name: '삭제' });
    expect(button).toHaveClass('ui-button--danger');
    expect(button).toBeDisabled();
  });
});
