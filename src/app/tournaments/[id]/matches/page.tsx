"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Match, Tournament } from "@/types/db";

type Player = {
  id: string;
  username: string;
};

export default function TournamentMatchesPage() {
  const params = useParams<{ id: string }>();
  const supabase = getSupabaseClient();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const id = params.id;
      if (!id) return;

      const [{ data: tData }, { data: pData }, { data: mData }] =
        await Promise.all([
          supabase.from("tournaments").select("*").eq("id", id).maybeSingle(),
          supabase
            .from("tournament_players")
            .select("player_id, profiles(id, username)")
            .eq("tournament_id", id),
          supabase.from("matches").select("*").eq("tournament_id", id),
        ]);

      if (!mounted) return;
      setTournament(tData as Tournament | null);
      setPlayers(
        (pData ?? []).map((row: any) => row.profiles) as Player[]
      );
      setMatches((mData ?? []) as Match[]);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [params.id, supabase]);

  const generateLeagueMatches = (playerIds: string[]) => {
    const generated: { home_player_id: string; away_player_id: string; round: number }[] =
      [];
    const n = playerIds.length;
    if (n < 2) return generated;

    const ids = [...playerIds];
    if (n % 2 === 1) {
      ids.push("BYE");
    }
    const total = ids.length;
    const rounds = total - 1;

    for (let round = 0; round < rounds; round++) {
      for (let i = 0; i < total / 2; i++) {
        const home = ids[i];
        const away = ids[total - 1 - i];
        if (home === "BYE" || away === "BYE") continue;
        generated.push({
          home_player_id: home,
          away_player_id: away,
          round: round + 1,
        });
      }
      const fixed = ids[0];
      const rotating = ids.slice(1);
      rotating.unshift(rotating.pop() as string);
      ids.splice(0, ids.length, fixed, ...rotating);
    }

    return generated;
  };

  const onGenerateMatches = async () => {
    if (!tournament) return;
    if (players.length < 2) {
      setError("Il faut au moins 2 joueurs inscrits.");
      return;
    }
    setError(null);
    setGenerating(true);

    try {
      const playerIds = players.map((p) => p.id);
      let rows: { home_player_id: string; away_player_id: string; round: number }[] =
        [];

      if (tournament.format === "league") {
        rows = generateLeagueMatches(playerIds);
      } else if (tournament.format === "knockout") {
        const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
        for (let i = 0; i < shuffled.length; i += 2) {
          const home = shuffled[i];
          const away = shuffled[i + 1];
          if (!home || !away) continue;
          rows.push({ home_player_id: home, away_player_id: away, round: 1 });
        }
      } else {
        setError(
          "La génération automatique pour les groupes n’est pas encore disponible."
        );
        setGenerating(false);
        return;
      }

      const insertRows = rows.map((r) => ({
        tournament_id: tournament.id,
        home_player_id: r.home_player_id,
        away_player_id: r.away_player_id,
        round: r.round,
        status: "scheduled",
      }));

      const { error: insertError } = await supabase
        .from("matches")
        .insert(insertRows);

      if (insertError) {
        setError(insertError.message);
      } else {
        const { data: refreshed } = await supabase
          .from("matches")
          .select("*")
          .eq("tournament_id", tournament.id);
        setMatches((refreshed ?? []) as Match[]);
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <p className="py-8 text-sm text-zinc-400">
        Chargement des matchs...
      </p>
    );
  }

  if (!tournament) {
    return (
      <p className="py-8 text-sm text-zinc-400">
        Tournoi introuvable.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
        Matchs · {tournament.name}
      </h1>

      <Card className="border-zinc-800/80 bg-zinc-950/70">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Génération du calendrier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-300">
          <p>
            {players.length} joueur(s) inscrits. Génère automatiquement tous les
            matchs en fonction du format du tournoi.
          </p>
          <Button
            size="sm"
            disabled={generating}
            onClick={onGenerateMatches}
          >
            {generating ? "Génération en cours..." : "Générer les matchs"}
          </Button>
          {error && (
            <p className="text-xs text-red-400">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-zinc-800/80 bg-zinc-950/70">
        <CardHeader>
          <CardTitle>Liste des matchs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          {matches.length === 0 && (
            <p className="text-sm text-zinc-400">
              Aucun match pour l’instant.
            </p>
          )}
          {matches
            .sort((a, b) => a.round - b.round)
            .map((m) => {
              const home = players.find((p) => p.id === m.home_player_id);
              const away = players.find((p) => p.id === m.away_player_id);
              return (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-3 py-2"
                >
                  <div className="text-xs text-zinc-200">
                    <span className="mr-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      J{m.round}
                    </span>
                    {home?.username ?? "?"}{" "}
                    <span className="text-zinc-500">vs</span>{" "}
                    {away?.username ?? "?"}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Statut : {m.status}
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>
    </div>
  );
}

