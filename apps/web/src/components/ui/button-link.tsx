import type { AnchorHTMLAttributes } from "react";
import Link from "next/link";

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: "primary" | "secondary" | "text";
};

export function ButtonLink({ variant = "primary", className = "", children, ...props }: ButtonLinkProps) {
  const styles = `button button--${variant} ${className}`;
  return props.href.startsWith("/") ? <Link className={styles} {...props}>{children}</Link> : <a className={styles} {...props}>{children}</a>;
}
