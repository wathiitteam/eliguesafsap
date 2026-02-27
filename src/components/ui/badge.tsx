import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium";

  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default:
      "border-transparent bg-[#00FF87]/15 text-[#00FF87]",
    secondary:
      "border-transparent bg-zinc-800/80 text-zinc-100",
    outline:
      "border-zinc-600 text-zinc-200",
  };

  return (
    <div
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}

