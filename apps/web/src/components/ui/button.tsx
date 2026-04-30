import * as React from 'react';

type ButtonVariant = 'default' | 'outline' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'default', className = '', type = 'button', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950';
  const byVariant: Record<ButtonVariant, string> = {
    default: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-zinc-700 text-zinc-100 hover:bg-zinc-800',
    ghost: 'text-zinc-100 hover:bg-zinc-800',
  };

  return <button type={type} className={`${base} ${byVariant[variant]} ${className}`.trim()} {...props} />;
}
