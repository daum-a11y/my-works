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

      <div className={`${styles.panel} ${styles.emptyStatePanel}`}>
        <strong>좌측 관리자 메뉴에서 관리 항목을 선택해 주세요.</strong>
        <p className={styles.muted}>
          전체 업무검색, 사용자, 업무 타입, 서비스그룹 관리 화면으로 이동할 수 있습니다.
        </p>
      </div>
    </section>
  );
}
