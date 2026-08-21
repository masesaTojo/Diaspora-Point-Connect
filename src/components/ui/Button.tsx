import * as React from "react";
import { cn } from "@/src/lib/utils";

export const buttonVariants = ({ 
  variant = "primary", 
  size = "md", 
  className 
}: { 
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger", 
  size?: "sm" | "md" | "lg", 
  className?: string 
} = {}) => {
  return cn(
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dpc-blue disabled:opacity-50 disabled:pointer-events-none",
    {
      "bg-dpc-blue text-white hover:bg-dpc-blue-dark": variant === "primary",
      "bg-dpc-yellow text-navy hover:bg-dpc-yellow-dark": variant === "secondary",
      "border border-neutral-border bg-transparent hover:bg-neutral-bg text-navy": variant === "outline",
      "hover:bg-neutral-border hover:text-navy": variant === "ghost",
      "bg-red-600 text-white hover:bg-red-700": variant === "danger",
      "h-9 px-3": size === "sm",
      "h-11 px-6": size === "md",
      "h-14 px-8 text-base": size === "lg",
    },
    className
  );
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant: variant as any, size: size as any, className })}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
