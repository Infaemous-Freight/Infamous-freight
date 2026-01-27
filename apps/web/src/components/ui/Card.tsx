/**
 * Card Component - 100% User-Friendly
 * Flexible container with header, body, and footer sections
 */

import React from "react";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  bordered?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "md",
  shadow = "md",
  bordered = false,
  hoverable = false,
  onClick,
}) => {
  const paddingStyles: Record<string, string> = {
    none: "p-0",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const shadowStyles: Record<string, string> = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  };

  const baseStyles = [
    "bg-white",
    "rounded-lg",
    "transition-all",
    "duration-200",
    paddingStyles[padding],
    shadowStyles[shadow],
    bordered ? "border border-gray-200" : "",
    hoverable ? "hover:shadow-xl cursor-pointer" : "",
    onClick ? "focus:outline-none focus:ring-2 focus:ring-blue-500" : "",
    className,
  ].join(" ");

  const CardElement = onClick ? "button" : "div";

  return (
    <CardElement
      className={baseStyles}
      onClick={onClick}
      {...(onClick ? { type: "button" } : {})}
    >
      {children}
    </CardElement>
  );
};

export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div className={`border-b border-gray-200 pb-3 mb-3 ${className}`}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return <div className={className}>{children}</div>;
};

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div className={`border-t border-gray-200 pt-3 mt-3 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
