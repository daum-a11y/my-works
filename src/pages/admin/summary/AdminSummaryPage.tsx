import { useEffect } from 'react';
import { setDocumentTitle } from '../../../router/navigation';

export function AdminSummaryPage() {
  useEffect(() => {
    setDocumentTitle('업무보고 현황');
  }, []);

  return (
    <section className="admin-page admin-page--page">
      <header className="admin-page__hero">
        <h1>업무보고 현황</h1>
      </header>

      <div className="admin-page__panel admin-page__empty-state-panel"></div>
    </section>
  );
}
