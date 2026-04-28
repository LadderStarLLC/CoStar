import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full bg-[#1A1D20] border border-white/10 rounded-lg px-4 py-3",
          "text-[#F4F5F7] placeholder-[#F4F5F7]/38",
          "focus:outline-none focus:border-[#5DC99B] focus:ring-1 focus:ring-[#5DC99B]/30",
          "transition-colors duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
