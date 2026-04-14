import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageSection } from './PageSection';

describe('PageSection', () => {
  it('renders the title as a section heading and shows actions', () => {
    render(
      <PageSection title="통계" actions={<button type="button">내보내기</button>}>
        <p>내용</p>
      </PageSection>,
    );

    expect(screen.getByRole('heading', { level: 2, name: '통계' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '내보내기' })).toBeInTheDocument();
    expect(screen.getByText('내용')).toBeInTheDocument();
  });

  it('keeps the panel variant available without custom styling classes', () => {
    const { container } = render(<PageSection title="리포트" variant="panel" />);

    expect(container.querySelector('section')).toHaveAttribute('data-variant', 'panel');
  });
});
