import Link from "next/link";
import type { ComponentProps, HTMLAttributes } from "react";

type NavigationProps = HTMLAttributes<HTMLElement> & { label: string };

/** Shared behavior and visual hook; each existing shell retains its own layout. */
export function Navigation({ label, className = "", children, ...props }: NavigationProps) {
  return <nav {...props} aria-label={label} className={`tl-navigation ${className}`}>{children}</nav>;
}

type NavigationLinkProps = ComponentProps<typeof Link> & { active?: boolean };

export function NavigationLink({ active, className = "", children, ...props }: NavigationLinkProps) {
  return <Link aria-current={active ? "page" : undefined} {...props} className={`tl-nav-link ${className}`}>{children}</Link>;
}
