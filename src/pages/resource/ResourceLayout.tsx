import { Outlet } from 'react-router-dom';
import '../../styles/pages/ResourcePage.scss';

export function ResourceLayout() {
  return (
    <section className="resource-page resource-page--page">
      <div className="resource-page__content">
        <Outlet />
      </div>
    </section>
  );
}
