import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "text";

export function buttonClasses(variant: ButtonVariant = "primary", className = "") {
  return `button button--${variant} ${className}`;
}

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type={type} {...props} className={buttonClasses(variant, className)} />;
}
