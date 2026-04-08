import React from "react";
import Link from "next/link";

type PricingButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export function PricingButton({ href, children, variant = "primary" }: PricingButtonProps) {
  const baseClassName =
    "inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black";
  const variantClassName =
    variant === "secondary"
      ? "border border-white/25 bg-white/5 text-white hover:bg-white/10 focus:ring-white/40"
      : "bg-white text-black hover:bg-white/90 focus:ring-white";

  return (
    <Link href={href} className={`${baseClassName} ${variantClassName}`}>
      {children}
    </Link>
  );
}
