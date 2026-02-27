"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PushToggle } from "@/components/notifications/push-toggle";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function NotificationsPage() {
  const supabase = getSupabaseClient();
  const [userId, setUserId] = useState<string | null>(null);

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

  const { notifications, unreadCount, markAllAsRead } = useNotifications(userId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
            Centre de notifications
          </h1>
          <p className="text-sm text-zinc-500">
            Tous les évènements importants de tes tournois.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={() => markAllAsRead()}>
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <Card className="border-zinc-800/80 bg-zinc-950/70">
        <CardHeader>
          <CardTitle>Notifications in-app</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          {notifications.length === 0 && (
            <p className="text-sm text-zinc-400">
              Aucune notification pour l’instant.
            </p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border px-3 py-2 text-sm ${
                n.is_read
                  ? "border-zinc-800/80 bg-zinc-950/70 text-zinc-400"
                  : "border-[#00FF87]/40 bg-[#00FF87]/5 text-zinc-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-200">
                  {n.title}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">{n.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-zinc-800/80 bg-zinc-950/70">
        <CardHeader>
          <CardTitle>Notifications push (PWA)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          <p className="text-sm text-zinc-400">
            Active les notifications push pour recevoir une alerte même quand tu
            n’es pas sur la page (nouveau match, score soumis, score confirmé,
            début de tournoi).
          </p>
          <PushToggle />
        </CardContent>
      </Card>
    </div>
  );
}

