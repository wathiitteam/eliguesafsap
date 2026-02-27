"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Match, Tournament } from "@/types/db";

type Player = {
  id: string;
  username: string;
  avatar_url: string | null;
  elo_rating: number;
};

type StandingRow = {
  playerId: string;
  username: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export default function TournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const id = params.id;
      if (!id) return;

      const [{ data: tData, error: tError }, { data: pData }, { data: mData }] =
        await Promise.all([
          supabase.from("tournaments").select("*").eq("id", id).maybeSingle(),
          supabase
            .from("tournament_players")
            .select("player_id, profiles(id, username, avatar_url, elo_rating)")
            .eq("tournament_id", id),
          supabase
            .from("matches")
            .select("*")
            .eq("tournament_id", id)
            .order("round", { ascending: true }),
        ]);

      if (!mounted) return;

      if (tError || !tData) {
        console.error(tError);
        setLoading(false);
        return;
      }

      setTournament(tData as Tournament);
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

  const standings: StandingRow[] = useMemo(() => {
    if (!tournament || tournament.format !== "league") return [];
    const rows = new Map<string, StandingRow>();

    for (const p of players) {
      rows.set(p.id, {
        playerId: p.id,
        username: p.username,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      });
    }

    for (const m of matches) {
      if (m.status !== "confirmed" || m.home_score == null || m.away_score == null)
        continue;

      const home = rows.get(m.home_player_id);
      const away = rows.get(m.away_player_id);
      if (!home || !away) continue;

      home.played += 1;
      away.played += 1;

      home.goalsFor += m.home_score;
      home.goalsAgainst += m.away_score;
      away.goalsFor += m.away_score;
      away.goalsAgainst += m.home_score;

      if (m.home_score > m.away_score) {
        home.wins += 1;
        away.losses += 1;
        home.points += 3;
      } else if (m.home_score < m.away_score) {
        away.wins += 1;
        home.losses += 1;
        away.points += 3;
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      }
    }

    return Array.from(rows.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.goalsFor - a.goalsAgainst;
      const diffB = b.goalsFor - b.goalsAgainst;
      if (diffB !== diffA) return diffB - diffA;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.username.localeCompare(b.username);
    });
  }, [players, matches, tournament]);

  if (loading) {
    return (
      <p className="py-8 text-sm text-zinc-400">
        Chargement du tournoi...
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

  const statusLabel =
    tournament.status === "draft"
      ? "Brouillon"
      : tournament.status === "active"
      ? "En cours"
      : "Terminé";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Tournoi
          </p>
          <h1 className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
            {tournament.name}
          </h1>
          <p className="text-xs text-zinc-500">
            Début le {new Date(tournament.start_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{statusLabel}</Badge>
          <Badge variant="outline">
            {tournament.format === "league"
              ? "Championnat"
              : tournament.format === "knockout"
              ? "Élimination"
              : "Groupes + élimination"}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/tournaments/${tournament.id}/matches`)}
          >
            Gérer les matchs
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr),minmax(0,1fr)]">
        <Card className="border-zinc-800/80 bg-zinc-950/70">
          <CardHeader className="flex items-center justify-between gap-2">
            <CardTitle>Classement</CardTitle>
            <Badge variant="secondary">
              {players.length} joueurs
            </Badge>
          </CardHeader>
          <CardContent>
            {tournament.format !== "league" && (
              <p className="mb-2 text-xs text-zinc-500">
                Pour les formats non championnat, ce tableau affichera les stats
                globales du tournoi.
              </p>
            )}
            {standings.length === 0 && (
              <p className="text-sm text-zinc-400">
                Aucun match confirmé pour l’instant.
              </p>
            )}
            {standings.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-zinc-300">
                  <thead className="border-b border-zinc-800 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    <tr>
                      <th className="px-2 py-2 text-left">#</th>
                      <th className="px-2 py-2 text-left">Joueur</th>
                      <th className="px-2 py-2 text-center">J</th>
                      <th className="px-2 py-2 text-center">G</th>
                      <th className="px-2 py-2 text-center">N</th>
                      <th className="px-2 py-2 text-center">P</th>
                      <th className="px-2 py-2 text-center">BM</th>
                      <th className="px-2 py-2 text-center">BE</th>
                      <th className="px-2 py-2 text-center">+/-</th>
                      <th className="px-2 py-2 text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, index) => {
                      const diff = row.goalsFor - row.goalsAgainst;
                      return (
                        <tr
                          key={row.playerId}
                          className={
                            index === 0
                              ? "bg-[#00FF87]/5"
                              : index % 2 === 0
                              ? "bg-zinc-950"
                              : "bg-zinc-950/60"
                          }
                        >
                          <td className="px-2 py-1.5 text-left text-zinc-500">
                            {index + 1}
                          </td>
                          <td className="px-2 py-1.5 text-left">
                            <Link
                              href={`/profile/${row.playerId}`}
                              className="text-xs font-medium text-zinc-100 hover:text-[#00FF87]"
                            >
                              {row.username}
                            </Link>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {row.played}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {row.wins}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {row.draws}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {row.losses}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {row.goalsFor}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {row.goalsAgainst}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {diff}
                          </td>
                          <td className="px-2 py-1.5 text-center font-semibold text-zinc-50">
                            {row.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/70">
          <CardHeader>
            <CardTitle>Matches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>
              {matches.length === 0
                ? "Aucun match généré pour l’instant."
                : `Il y a déjà ${matches.length} match(s) programmés.`}
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                router.push(`/tournaments/${tournament.id}/matches`)
              }
            >
              Gérer le calendrier
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

