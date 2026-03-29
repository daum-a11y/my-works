import { useEffect } from 'react';
import styles from '../AdminPage.module.css';

export function AdminSummaryPage() {
  useEffect(() => {
    document.title = '관리 | My Works';
  }, []);

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h1>관리자</h1>
      </header>

      <div className={`${styles.panel} ${styles.emptyStatePanel}`}></div>
    </section>
  );
}
