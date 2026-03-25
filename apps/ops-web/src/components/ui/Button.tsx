import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import clsx from "clsx";
import styles from "./Button.module.css";

interface ButtonProps extends AriaButtonProps {
  tone?: "primary" | "secondary" | "ghost" | "danger";
}

export function Button({ children, className, tone = "primary", ...props }: ButtonProps) {
  return (
    <AriaButton {...props} className={clsx(styles.button, styles[tone], className)}>
      {children}
    </AriaButton>
  );
}
