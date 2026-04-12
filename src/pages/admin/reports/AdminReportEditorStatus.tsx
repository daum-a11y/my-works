interface AdminReportEditorStatusProps {
  queryError: string;
  statusMessage: string;
  isMissingEditTarget: boolean;
}

export function AdminReportEditorStatus({ isMissingEditTarget }: AdminReportEditorStatusProps) {
  if (isMissingEditTarget) {
    return <p className={'reports-page__status-message'}>수정할 업무를 찾을 수 없습니다.</p>;
  }

  return null;
}
