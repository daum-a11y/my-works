interface AdminReportEditorStatusProps {
  queryError: string;
  statusMessage: string;
  loading: boolean;
  isMissingEditTarget: boolean;
}

export function AdminReportEditorStatus({
  queryError,
  statusMessage,
  loading,
  isMissingEditTarget,
}: AdminReportEditorStatusProps) {
  if (queryError) {
    return <p className={'reports-page__status-message'}>{queryError}</p>;
  }

  if (statusMessage) {
    return <p className={'reports-page__status-message'}>{statusMessage}</p>;
  }

  if (loading) {
    return <p className={'reports-page__status-message'}>불러오는 중입니다...</p>;
  }

  if (isMissingEditTarget) {
    return <p className={'reports-page__status-message'}>수정할 업무를 찾을 수 없습니다.</p>;
  }

  return null;
}
