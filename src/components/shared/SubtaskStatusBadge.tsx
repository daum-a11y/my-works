import { Badge } from 'krds-react';
import type { SubtaskStatus } from '../../types/domain';

const statusBadgeColor: Record<SubtaskStatus, 'danger' | 'warning' | 'success'> = {
  미수정: 'danger',
  '일부 수정': 'warning',
  '전체 수정': 'success',
};

interface SubtaskStatusBadgeProps {
  status: SubtaskStatus;
}

export function SubtaskStatusBadge({ status }: SubtaskStatusBadgeProps) {
  return (
    <Badge variant="light" color={statusBadgeColor[status]} size="small">
      {status}
    </Badge>
  );
}
