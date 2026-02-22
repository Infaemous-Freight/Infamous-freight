/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * User-Friendly Input Component
 */

import React, { InputHTMLAttributes, ReactNode } from "react";
import styles from "./Input.module.css";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  required?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, required, size = "md", className = "", ...props }, ref) => {
    return (
      <div className={styles.container}>
        {label && (
          <label className={styles.label}>
            {label}
            {required && <span className={styles.required}> *</span>}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <input
            ref={ref}
            className={`
              ${styles.input}
              ${styles[size]}
              ${error ? styles.error : ""}
              ${icon ? styles.withIcon : ""}
              ${className}
            `}
            aria-label={label || props["aria-label"]}
            aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p className={styles.errorText} id={`${props.id}-error`} role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className={styles.hintText} id={`${props.id}-hint`}>
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
