import { useEffect } from 'react';
import { setDocumentTitle } from '../../../app/navigation';
import '../../../styles/domain/pages/admin-page.scss';

export function AdminSummaryPage() {
  useEffect(() => {
    setDocumentTitle('업무보고 현황');
  }, []);

  return (
    <section className={'page'}>
      <header className={'hero'}>
        <h1>업무보고 현황</h1>
      </header>

      <div className={`${'panel'} ${'emptyStatePanel'}`}></div>
    </section>
  );
}
