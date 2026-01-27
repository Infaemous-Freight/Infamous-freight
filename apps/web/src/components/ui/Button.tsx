/**
 * Button Component - 100% User-Friendly
 * Supports 4 variants × 3 sizes with full accessibility
 */

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles = [
      "inline-flex",
      "items-center",
      "justify-center",
      "font-medium",
      "rounded-lg",
      "transition-all",
      "duration-200",
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-offset-2",
      "disabled:opacity-50",
      "disabled:cursor-not-allowed",
    ];

    const variantStyles: Record<ButtonVariant, string[]> = {
      primary: [
        "bg-blue-600",
        "text-white",
        "hover:bg-blue-700",
        "active:bg-blue-800",
        "focus:ring-blue-500",
      ],
      secondary: [
        "bg-purple-600",
        "text-white",
        "hover:bg-purple-700",
        "active:bg-purple-800",
        "focus:ring-purple-500",
      ],
      tertiary: [
        "bg-transparent",
        "text-blue-600",
        "border-2",
        "border-blue-600",
        "hover:bg-blue-50",
        "active:bg-blue-100",
        "focus:ring-blue-500",
      ],
      danger: [
        "bg-red-600",
        "text-white",
        "hover:bg-red-700",
        "active:bg-red-800",
        "focus:ring-red-500",
      ],
    };

    const sizeStyles: Record<ButtonSize, string[]> = {
      sm: ["text-sm", "px-3", "py-1.5", "gap-1"],
      md: ["text-base", "px-4", "py-2", "gap-2"],
      lg: ["text-lg", "px-6", "py-3", "gap-2"],
    };

    const widthStyles = fullWidth ? ["w-full"] : [];

    const allStyles = [
      ...baseStyles,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...widthStyles,
      className,
    ].join(" ");

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={allStyles}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}
        <span>{children}</span>
        {!loading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
