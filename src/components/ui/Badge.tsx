import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "danger" | "success";
  className?: string;
  children?: React.ReactNode;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-dpc-blue",
        {
          "border-transparent bg-dpc-blue text-white hover:bg-dpc-blue-dark": variant === "default",
          "border-transparent bg-neutral-border text-navy hover:bg-neutral-border/80": variant === "secondary",
          "text-navy border-neutral-border": variant === "outline",
          "border-transparent bg-red-100 text-red-800": variant === "danger",
          "border-transparent bg-green-100 text-green-800": variant === "success",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
