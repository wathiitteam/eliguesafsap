"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tournaments", label: "Tournois" },
  { href: "/championship", label: "Championnat" },
  { href: "/leaderboard", label: "Classement" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const supabase = getSupabaseClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserEmail(data.user?.email ?? null);
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const initials =
    userEmail?.[0]?.toUpperCase() ??
    "Q";

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-900/80 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00FF87] to-emerald-400 text-sm font-black text-black shadow-[0_0_20px_rgba(0,255,135,0.9)]">
              QF
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
                Quartier
              </span>
              <span className="text-base font-bold text-zinc-50">FC</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 text-xs font-medium text-zinc-400 sm:flex">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3 py-1 transition-colors",
                    active
                      ? "bg-zinc-900 text-zinc-100"
                      : "hover:bg-zinc-900/60 hover:text-zinc-100"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <NotificationsBell />

          {userEmail ? (
            <div className="flex items-center gap-2">
              <Avatar initials={initials} />
              <Button
                size="sm"
                variant="ghost"
                className="hidden text-xs text-zinc-400 hover:text-zinc-100 sm:inline-flex"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/login";
                }}
              >
                Déconnexion
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="default">
                Se connecter
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

