"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Match } from "@/types/db";

type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  position: string | null;
  favorite_team: string | null;
  elo_rating: number;
};

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const supabase = getSupabaseClient();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const id = params.id;
    if (!id) return;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const [{ data: pData }, { data: mData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("matches")
          .select("*")
          .or(`home_player_id.eq.${id},away_player_id.eq.${id}`)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (!mounted) return;
      setProfile(pData as ProfileRow | null);
      setMatches((mData ?? []) as Match[]);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [params.id, supabase]);

  if (loading) {
    return (
      <p className="py-8 text-sm text-zinc-400">
        Chargement du profil...
      </p>
    );
  }

  if (!profile) {
    return (
      <p className="py-8 text-sm text-zinc-400">
        Joueur introuvable.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
            {profile.username}
          </h1>
          <p className="text-sm text-zinc-500">
            Fiche joueur Quartier FC.
          </p>
        </div>
        <Badge variant="secondary">
          ELO {profile.elo_rating}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr),minmax(0,1fr)]">
        <Card className="border-zinc-800/80 bg-zinc-950/70">
          <CardHeader>
            <CardTitle>Infos joueur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>
              <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Poste
              </span>
              <br />
              {profile.position ?? "Non renseigné"}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Équipe préférée
              </span>
              <br />
              {profile.favorite_team ?? "Non renseigné"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/70">
          <CardHeader>
            <CardTitle>Derniers matchs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            {matches.length === 0 && (
              <p className="text-sm text-zinc-400">
                Aucun match récent.
              </p>
            )}
            {matches.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    J{m.round}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {m.status}
                  </span>
                </div>
                {m.home_score != null && m.away_score != null ? (
                  <p className="mt-1">
                    {m.home_score} - {m.away_score}
                  </p>
                ) : (
                  <p className="mt-1 text-zinc-500">
                    Score non renseigné.
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

