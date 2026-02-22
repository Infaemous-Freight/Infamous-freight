/**
 * Input Component - 100% User-Friendly
 * Supports validation, accessibility, and all input types
 */

import React from "react";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = "",
      id,
      required,
      disabled,
      size,
      ...props
    },
    ref,
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const containerStyles = ["relative", fullWidth ? "w-full" : "w-auto"].join(" ");

    const sizeClass = size === "sm" ? "py-1 text-sm" : size === "lg" ? "py-3 text-lg" : "py-2 text-base";

    const inputStyles = [
      "block",
      "w-full",
      "px-4",
      sizeClass,
      "border",
      "rounded-lg",
      "transition-all",
      "duration-200",
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-offset-1",
      error
        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500",
      disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : "bg-white text-gray-900",
      leftIcon ? "pl-10" : "",
      rightIcon ? "pr-10" : "",
      className,
    ].join(" ");

    return (
      <div className={containerStyles}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={inputStyles}
            disabled={disabled}
            required={required}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
