import { Link } from "react-router-dom";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  return (
    <section className={styles.page}>
      <p className={styles.code}>404</p>
      <div className={styles.bodyBlock}>
        <p className={styles.kicker}>예외 화면</p>
        <h1 className={styles.title}>페이지를 찾을 수 없습니다.</h1>
        <p className={styles.body}>주소를 다시 확인하거나 상황판으로 돌아가 현재 작업을 이어가십시오.</p>
        <Link to="/dashboard" className={styles.link}>
          대시보드로 이동
        </Link>
      </div>
    </section>
  );
}
