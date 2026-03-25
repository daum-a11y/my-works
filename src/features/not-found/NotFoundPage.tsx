import { Link } from "react-router-dom";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  return (
    <section className={styles.page}>
      <p className={styles.code}>404</p>
      <h1>페이지를 찾을 수 없습니다.</h1>
      <p>요청한 화면이 없거나 이동되었습니다.</p>
      <Link to="/dashboard" className={styles.link}>
        대시보드로 이동
      </Link>
    </section>
  );
}
