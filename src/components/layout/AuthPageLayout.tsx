import type { ReactNode } from 'react';
import { BrandLogo } from './BrandLogo';

interface AuthPageLayoutProps {
  caption: string;
  title?: ReactNode;
  description?: ReactNode;
  body: ReactNode;
  aside?: ReactNode;
  labelledBy: string;
}

export function AuthPageLayout({
  caption,
  title,
  description,
  body,
  aside,
  labelledBy,
}: AuthPageLayoutProps) {
  return (
    <div id="container" className="krds-auth-shell">
      <main className="contents">
        <section aria-labelledby={labelledBy} className="krds-auth-panel auth-panel">
          <span aria-hidden="true" className="krds-section-accent accent-mark" />
          <div className="krds-auth-head top-block">
            <div className="logo-heading">
              <BrandLogo alt="My Works" width={100} height={30} />
            </div>
            {title ? <p className="caption-text">{caption}</p> : null}
            <h1 id={labelledBy} className="auth-title">
              {title ?? caption}
            </h1>
            {description ? <p className="description-text">{description}</p> : null}
          </div>
          <div className="krds-auth-body auth-body">{body}</div>
        </section>
        {aside ? <div className="auth-aside">{aside}</div> : null}
      </main>
    </div>
  );
}
