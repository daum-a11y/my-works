import { Outlet } from 'react-router-dom';

export function ResourceLayout() {
  return (
    <section className="krds-page">
      <div className="krds-page__content">
        <Outlet />
      </div>
    </section>
  );
}
