import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "brand" | "ai" | "success" | "warning" | "error" | "info";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "brand", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
          "transition-colors duration-200",
          variant === "brand" && "bg-[#E5B536]/15 text-[#E5B536] border border-[#E5B536]/30",
          variant === "ai" && "bg-[#5DC99B]/15 text-[#5DC99B] border border-[#5DC99B]/30",
          variant === "success" && "bg-[#5DC99B]/15 text-[#5DC99B] border border-[#5DC99B]/30",
          variant === "warning" && "bg-[#E5B536]/15 text-[#E5B536] border border-[#E5B536]/30",
          variant === "error" && "bg-red-500/20 text-red-400 border border-red-500/30",
          variant === "info" && "bg-[#5DC99B]/15 text-[#5DC99B] border border-[#5DC99B]/30",
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
