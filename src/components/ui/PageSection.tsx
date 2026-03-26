import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import styles from "./PageSection.module.css";

interface PageSectionProps extends ComponentPropsWithoutRef<"section"> {
  title: string;
  actions?: ReactNode;
  variant?: "plain" | "panel";
}

export function PageSection({
  title,
  actions,
  className,
  children,
  variant = "plain",
  ...props
}: PageSectionProps) {
  return (
    <section className={clsx(styles.section, styles[variant], className)} {...props}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2>{title}</h2>
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      <div className={styles.content}>{children}</div>
    </section>
  );
}
