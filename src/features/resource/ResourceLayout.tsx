import { Outlet } from 'react-router-dom';
import '../../styles/domain/pages/resource-page.scss';

export function ResourceLayout() {
  return (
    <section className={'page'}>
      <div className={'content'}>
        <Outlet />
      </div>
    </section>
  );
}
