"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Tournament } from "@/types/db";

export default function ChampionshipPage() {
  const supabase = getSupabaseClient();
  const [tournament, setTournament] = useState<Tournament | null>(null);

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

      const { data } = await supabase
        .from("tournaments")
        .select("*")
        .eq("format", "league")
        .eq("status", "active")
        .order("start_date", { ascending: true })
        .limit(1);

      if (!mounted) return;
      setTournament((data?.[0] as Tournament) ?? null);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
        Championnat en cours
      </h1>

      {!tournament && (
        <p className="text-sm text-zinc-400">
          Aucun championnat de type &quot;league&quot; n’est actuellement en cours.
        </p>
      )}

      {tournament && (
        <Card className="border-zinc-800/80 bg-zinc-950/70">
          <CardHeader className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{tournament.name}</CardTitle>
              <p className="mt-1 text-xs text-zinc-500">
                Démarré le{" "}
                {new Date(tournament.start_date).toLocaleDateString()}
              </p>
            </div>
            <Badge variant="secondary">En cours</Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>
              Ce mini-championnat utilise le barème 3/1/0 et un ELO dynamique
              recalculé à chaque score confirmé.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/tournaments/${tournament.id}`}>
                <span className="text-xs text-[#00FF87] hover:underline">
                  Voir le classement détaillé
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

