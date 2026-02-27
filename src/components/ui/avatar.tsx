import * as React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  initials?: string;
}

export function Avatar({ className, src, initials, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold uppercase text-zinc-100",
        className
      )}
      {...props}
    >
      {src ? (
        <Image src={src} alt={initials ?? "Avatar"} fill sizes="36px" />
      ) : (
        <span>{initials ?? "?"}</span>
      )}
    </div>
  );
}

