import { Outlet } from 'react-router-dom';

export function ResourceLayout() {
  return (
    <section className="resource-page page-shell">
      <div className="resource-page__content">
        <Outlet />
      </div>
    </section>
  );
}
