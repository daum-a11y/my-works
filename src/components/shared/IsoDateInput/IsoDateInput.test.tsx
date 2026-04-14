import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IsoDateInput } from './IsoDateInput';

describe('IsoDateInput', () => {
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
});
