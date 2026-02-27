import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-full border border-zinc-800 bg-zinc-900/80 px-4 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-inner shadow-black/40 outline-none transition focus-visible:border-[#00FF87] focus-visible:ring-1 focus-visible:ring-[#00FF87]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

