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
        <section aria-labelledby={labelledBy} className="auth-panel">
          <span aria-hidden="true" className="accent-mark" />
          <div className="top-block">
            <h1 className="logo-heading">
              <BrandLogo alt="My Works" width={100} height={30} />
            </h1>
            <p id={title ? undefined : labelledBy} className="caption-text">
              {caption}
            </p>
            {title ? (
              <h2 id={labelledBy} className="auth-title">
                {title}
              </h2>
            ) : null}
            {description ? <p className="description-text">{description}</p> : null}
          </div>
          <div className="auth-body">{body}</div>
        </section>
        {aside ? <div className="auth-aside">{aside}</div> : null}
      </main>
    </div>
  );
}
