import { Outlet } from 'react-router-dom';

export function ResourceLayout() {
  return (
    <section className="krds-page">
      <div className="content-area">
        <Outlet />
      </div>
    </section>
  );
}
