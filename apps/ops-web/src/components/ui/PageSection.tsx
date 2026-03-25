import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import styles from "./PageSection.module.css";

interface PageSectionProps extends ComponentPropsWithoutRef<"section"> {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageSection({ title, description, actions, className, children, ...props }: PageSectionProps) {
  return (
    <section className={clsx(styles.section, className)} {...props}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      <div>{children}</div>
    </section>
  );
}
