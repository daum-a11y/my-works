import clsx from 'clsx';
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
    <main className="auth-layout-shell">
      <section aria-labelledby={labelledBy} className="auth-layout-shell__panel">
        <span aria-hidden="true" className="auth-layout-shell__accent" />
        <div className="auth-layout-shell__top-block">
          <h1 className="auth-layout-shell__logo-heading">
            <BrandLogo alt="My Works" width={100} height={30} />
          </h1>
          <p className="auth-layout-shell__caption">{caption}</p>
          {title ? (
            <h2 id={labelledBy} className="auth-layout-shell__title">
              {title}
            </h2>
          ) : null}
          {description ? <p className="auth-layout-shell__description">{description}</p> : null}
        </div>
        <div className="auth-layout-shell__body">{body}</div>
      </section>
      {aside ? <div className="auth-layout-shell__aside">{aside}</div> : null}
    </main>
  );
}

export function getAuthFeedbackClassName(tone: 'info' | 'success' | 'danger') {
  return clsx(
    'auth-layout-shell__feedback',
    tone === 'success' && 'auth-layout-shell__feedback--success',
    tone === 'danger' && 'auth-layout-shell__feedback--danger',
  );
}
