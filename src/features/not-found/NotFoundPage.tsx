import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  const { status, session } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = status === "authenticated" && session;
  const destination = isAuthenticated ? "/dashboard" : "/login";
  const actionLabel = isAuthenticated ? "대시보드 복귀" : "로그인 화면으로 이동";
  const secondaryLabel = isAuthenticated ? "업무보고로 바로 이동" : "이전 화면으로 돌아가기";
  const secondaryDestination = isAuthenticated ? "/reports" : null;

  useEffect(() => {
    document.title = "My Works · 페이지를 찾을 수 없음";
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="not-found-title">
        <div className={styles.hero}>
          <h1 className={styles.logoHeading}>
            <img
              className={styles.logo}
              src="/img/my-works-logo-200x60.png"
              alt="My Works"
              width="100"
              height="30"
            />
          </h1>
          <p className={styles.caption}>404</p>
        </div>
        <div className={styles.bodyBlock}>
          <h1 id="not-found-title" className={styles.title}>페이지를 찾을 수 없습니다.</h1>
          <p className={styles.body}>
            주소를 다시 확인하시거나 {isAuthenticated
              ? "대시보드로 돌아가 현재 작업을 이어서 진행해 주세요."
              : "로그인 화면으로 돌아가 다시 진입해 주세요."}
          </p>
          <div className={styles.actionRow}>
            <Link to={destination} className={styles.link}>
              {actionLabel}
            </Link>
            {secondaryDestination ? (
              <Link to={secondaryDestination} className={styles.secondaryLink}>
                {secondaryLabel}
              </Link>
            ) : (
              <button type="button" className={styles.secondaryLink} onClick={() => navigate(-1)}>
                {secondaryLabel}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
