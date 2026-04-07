import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InputField, TextAreaField } from './Field';

describe('Field', () => {
  it('connects input description and error message through aria-describedby', () => {
    render(
      <InputField
        name="email"
        label="이메일"
        description="회사 계정을 입력합니다."
        errorMessage="이메일을 입력해 주세요."
      />,
    );

    const input = screen.getByLabelText('이메일');
    expect(input).toHaveAttribute('aria-describedby', 'email-description email-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('이메일을 입력해 주세요.');
  });

  it('renders textarea controls with the textarea modifier class', () => {
    render(<TextAreaField label="메모" name="memo" />);

    expect(screen.getByLabelText('메모')).toHaveClass('ui-field__control--textarea');
  });
});
