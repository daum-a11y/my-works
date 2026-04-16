import { useEffect } from 'react';
import { EmptyState, PageHeader } from '../../../components/shared';
import { setDocumentTitle } from '../../../router/navigation';

export function AdminSummaryPage() {
  useEffect(() => {
    setDocumentTitle('업무보고 현황');
  }, []);

  return (
    <section className="admin-page page-view">
      <PageHeader title="업무보고 현황" />

      <EmptyState className="empty-state" message="업무보고 현황을 준비 중입니다." />
    </section>
  );
}
