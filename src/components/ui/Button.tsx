import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonClasses } from "./buttonClasses";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${buttonClasses(variant, size)} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
