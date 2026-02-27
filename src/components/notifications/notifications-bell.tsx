"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase/client";

export function NotificationsBell() {
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const supabase = getSupabaseClient();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications(userId);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative border border-zinc-800/80 bg-zinc-900/70",
          open && "bg-zinc-900"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-zinc-300" />
        ) : (
          <Bell className="h-4 w-4 text-zinc-200" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00FF87] px-[3px] text-[10px] font-semibold text-black shadow-[0_0_12px_rgba(0,255,135,0.9)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-40 mt-3 w-80 rounded-2xl border border-zinc-800/80 bg-zinc-950/95 p-3 text-sm shadow-2xl shadow-black/60 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Notifications
              </span>
              {unreadCount > 0 && (
                <Badge variant="default">
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <button
              type="button"
              className="text-xs text-zinc-400 hover:text-zinc-200"
              onClick={() => markAllAsRead()}
            >
              Tout marquer comme lu
            </button>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {notifications.length === 0 && (
              <p className="py-4 text-center text-xs text-zinc-500">
                Aucune notification pour l’instant.
              </p>
            )}

            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => markAsRead(n.id)}
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-left transition",
                  n.is_read
                    ? "border-zinc-800/70 bg-zinc-900/70 text-zinc-400"
                    : "border-[#00FF87]/30 bg-[#00FF87]/5 text-zinc-100 shadow-[0_0_18px_rgba(0,255,135,0.25)]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-200">
                    {n.title}
                  </span>
                  {!n.is_read && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00FF87]" />
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-400">{n.message}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

