import type { AnchorHTMLAttributes } from "react";
import Link from "next/link";
import { buttonClasses, type ButtonVariant } from "./button";

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
};

export function ButtonLink({ variant = "primary", className = "", children, ...props }: ButtonLinkProps) {
  const styles = buttonClasses(variant, className);
  return props.href.startsWith("/") ? <Link className={styles} {...props}>{children}</Link> : <a className={styles} {...props}>{children}</a>;
}
