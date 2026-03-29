import { useEffect } from 'react';
import { setDocumentTitle } from '../../../app/navigation';
import styles from '../AdminPage.module.css';

export function AdminSummaryPage() {
  useEffect(() => {
    setDocumentTitle('업무보고 현황');
  }, []);

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h1>업무보고 현황</h1>
      </header>

      <div className={`${styles.panel} ${styles.emptyStatePanel}`}></div>
    </section>
  );
}
