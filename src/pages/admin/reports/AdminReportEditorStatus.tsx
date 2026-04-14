import { CriticalAlert } from 'krds-react';

interface AdminReportEditorStatusProps {
  queryError: string;
  statusMessage: string;
  isMissingEditTarget: boolean;
}

export function AdminReportEditorStatus({ isMissingEditTarget }: AdminReportEditorStatusProps) {
  if (isMissingEditTarget) {
    return (
      <CriticalAlert alerts={[{ variant: 'info', message: '수정할 업무를 찾을 수 없습니다.' }]} />
    );
  }

  return null;
}
