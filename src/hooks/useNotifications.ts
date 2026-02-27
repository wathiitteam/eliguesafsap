import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export type AppNotificationType =
  | "match_scheduled"
  | "score_submitted"
  | "score_confirmed"
  | "tournament_start"
  | "new_round";

export type AppNotification = {
  id: string;
  user_id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_match_id: string | null;
  related_tournament_id: string | null;
  created_at: string;
};

export function useNotifications(userId?: string | null) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    setLoading(true);

    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error("Error loading notifications", error);
          setLoading(false);
          return;
        }
        setNotifications((data ?? []) as AppNotification[]);
        setLoading(false);
      });

    const channel = supabase
      .channel(`notifications:user:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!isMounted) return;

          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [
              payload.new as AppNotification,
              ...prev,
            ]);
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === payload.new.id
                  ? (payload.new as AppNotification)
                  : n
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("Error marking notification as read", error);
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all notifications as read", error);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}

