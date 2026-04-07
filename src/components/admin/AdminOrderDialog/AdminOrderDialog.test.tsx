import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AdminOrderDialog } from './AdminOrderDialog';

const baseItems = [
  { id: 'a', title: '첫 번째 항목' },
  { id: 'b', title: '두 번째 항목' },
  { id: 'c', title: '세 번째 항목' },
];

describe('AdminOrderDialog', () => {
  it('returns null when closed', () => {
    const { container } = render(
      <AdminOrderDialog
        title="순서 편집"
        description="항목 순서를 조정합니다."
        items={baseItems}
        isOpen={false}
        isSaving={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('reorders items with keyboard interaction and saves the next ids', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <AdminOrderDialog
        title="순서 편집"
        description="항목 순서를 조정합니다."
        items={baseItems}
        isOpen
        isSaving={false}
        onClose={vi.fn()}
        onSave={handleSave}
      />,
    );

    const handles = screen.getAllByRole('button', { name: /순서 이동 핸들/ });
    handles[0]?.focus();
    await user.keyboard('{ArrowDown}');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(handleSave).toHaveBeenCalledWith(['b', 'a', 'c']);
  });
});
