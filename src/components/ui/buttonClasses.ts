type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonSize = "sm" | "md";

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
): string {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const sizeClasses =
    size === "sm"
      ? "min-h-10 px-3 py-2 text-sm"
      : "min-h-11 px-4 py-2.5 text-sm";

  const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-gray-900 text-white hover:bg-gray-700",
    secondary:
      "border border-gray-400 bg-white text-gray-800 hover:border-gray-500 hover:text-gray-900",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return `${base} ${sizeClasses} ${variantClasses[variant]}`;
}
