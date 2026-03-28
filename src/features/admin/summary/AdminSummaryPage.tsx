import { useEffect } from "react";
import styles from "../AdminPage.module.css";

export function AdminSummaryPage() {
  useEffect(() => {
    document.title = "관리 | My Works";
  }, []);

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h1>관리자</h1>
      </header>

      <div className={styles.panel} style={{ textAlign: "center" }}>
        <img src="/img/emot_021.png" alt="또 바뀌었나요" style={{ maxWidth: "180px", marginInline: "auto" }} />
        <p style={{ marginBottom: "0.75rem" }}>에라이... 나도 몰라</p>
        <p>나를 찾지 마세요.</p>
      </div>
    </section>
  );
}
