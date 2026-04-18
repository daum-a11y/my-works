import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IsoDateInput } from './IsoDateInput';

describe('IsoDateInput', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps partial manual input visible and commits only completed ISO dates', () => {
    const handleChange = vi.fn();

    render(<IsoDateInput label="시작일" value="" onChange={handleChange} />);

    const input = screen.getByLabelText('시작일');
    fireEvent.change(input, { target: { value: '2026.' } });

    expect(input).toHaveValue('2026.');
    expect(handleChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '2026.04.15' } });

    expect(input).toHaveValue('2026.04.15');
    expect(handleChange).toHaveBeenCalledWith('2026-04-15');
  });

  it('forwards ISO min and max constraints to the input element', () => {
    render(
      <IsoDateInput
        label="시작일"
        value="2026-04-15"
        onChange={vi.fn()}
        min="2026-04-01"
        max="2026-04-30"
      />,
    );

    expect(screen.getByLabelText('시작일')).toHaveAttribute('min', '2026-04-01');
    expect(screen.getByLabelText('시작일')).toHaveAttribute('max', '2026-04-30');
  });
});
