import type { ReactNode } from 'react';
import { BrandLogo } from './BrandLogo';

interface AuthLayoutShellProps {
  caption: string;
  title?: ReactNode;
  description?: ReactNode;
  body: ReactNode;
  aside?: ReactNode;
  labelledBy: string;
}

export function AuthLayoutShell({
  caption,
  title,
  description,
  body,
  aside,
  labelledBy,
}: AuthLayoutShellProps) {
  return (
    <div id="container" className="krds-auth-shell">
      <main className="contents">
        <section aria-labelledby={labelledBy} className="krds-auth-shell__panel">
          <span aria-hidden="true" className="krds-auth-shell__accent" />
          <div className="krds-auth-shell__top-block">
            <h1 className="krds-auth-shell__logo-heading">
              <BrandLogo alt="My Works" width={100} height={30} />
            </h1>
            <p className="krds-auth-shell__caption">{caption}</p>
            {title ? (
              <h2 id={labelledBy} className="krds-auth-shell__title">
                {title}
              </h2>
            ) : null}
            {description ? <p className="krds-auth-shell__description">{description}</p> : null}
          </div>
          <div className="krds-auth-shell__body">{body}</div>
        </section>
        {aside ? <div className="krds-auth-shell__aside">{aside}</div> : null}
      </main>
    </div>
  );
}
