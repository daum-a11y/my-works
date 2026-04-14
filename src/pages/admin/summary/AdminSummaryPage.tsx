import { useEffect } from 'react';
import { EmptyState, PageHeader } from '../../../components/shared';
import { setDocumentTitle } from '../../../router/navigation';

export function AdminSummaryPage() {
  useEffect(() => {
    setDocumentTitle('업무보고 현황');
  }, []);

  return (
    <section className="krds-page-admin krds-page-admin--page">
      <PageHeader title="업무보고 현황" />

      <EmptyState
        className="krds-page-admin__empty-state-panel"
        message="업무보고 현황을 준비 중입니다."
      />
    </section>
  );
}
