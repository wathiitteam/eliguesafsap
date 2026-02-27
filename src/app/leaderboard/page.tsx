"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  elo_rating: number;
};

export default function LeaderboardPage() {
  const supabase = getSupabaseClient();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, elo_rating")
        .order("elo_rating", { ascending: false })
        .limit(50);

      if (!mounted) return;
      if (error) {
        console.error("Error loading leaderboard", error);
        setLoading(false);
        return;
      }
      setRows((data ?? []) as ProfileRow[]);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
            Classement général ELO
          </h1>
          <p className="text-sm text-zinc-500">
            Qui est le boss du quartier sur eFootball ?
          </p>
        </div>
        <Badge variant="secondary">
          Top {rows.length || "…"}
        </Badge>
      </div>

      <Card className="border-zinc-800/80 bg-zinc-950/70">
        <CardHeader>
          <CardTitle>Tableau des légendes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-zinc-400">
              Chargement du classement...
            </p>
          )}
          {!loading && rows.length === 0 && (
            <p className="text-sm text-zinc-400">
              Aucun joueur pour l’instant.
            </p>
          )}
          {!loading && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-zinc-300">
                <thead className="border-b border-zinc-800 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  <tr>
                    <th className="px-2 py-2 text-left">Rang</th>
                    <th className="px-2 py-2 text-left">Joueur</th>
                    <th className="px-2 py-2 text-right">ELO</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={
                        index === 0
                          ? "bg-gradient-to-r from-[#00FF87]/15 to-emerald-500/10"
                          : index % 2 === 0
                          ? "bg-zinc-950"
                          : "bg-zinc-950/60"
                      }
                    >
                      <td className="px-2 py-1.5 text-left text-zinc-500">
                        #{index + 1}
                      </td>
                      <td className="px-2 py-1.5 text-left text-zinc-100">
                        {row.username}
                      </td>
                      <td className="px-2 py-1.5 text-right font-semibold text-zinc-50">
                        {row.elo_rating}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

