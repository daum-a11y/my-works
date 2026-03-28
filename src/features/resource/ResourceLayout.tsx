import { Outlet } from 'react-router-dom';
import styles from './ResourcePage.module.css';

export function ResourceLayout() {
  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <Outlet />
      </div>
    </section>
  );
}
