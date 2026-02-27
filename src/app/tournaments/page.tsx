"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tournament } from "@/types/db";

export default function TournamentsPage() {
  const supabase = getSupabaseClient();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
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
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        console.error("Error loading tournaments", error);
        setLoading(false);
        return;
      }
      setTournaments((data ?? []) as Tournament[]);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
            Tournois du quartier
          </h1>
          <p className="text-sm text-zinc-500">
            Crée un nouveau tournoi ou rejoins ceux déjà lancés.
          </p>
        </div>
        <Link href="/tournaments/new">
          <Button>Créer un tournoi</Button>
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-zinc-400">
          Chargement des tournois...
        </p>
      )}

      {!loading && tournaments.length === 0 && (
        <p className="text-sm text-zinc-400">
          Aucun tournoi créé pour l’instant. Lance le premier !
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {tournaments.map((t) => (
          <Link key={t.id} href={`/tournaments/${t.id}`}>
            <Card className="border-zinc-800/80 bg-zinc-950/70 transition hover:border-[#00FF87]/40 hover:shadow-[0_0_18px_rgba(0,255,135,0.3)]">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>{t.name}</CardTitle>
                  <p className="text-xs text-zinc-500">
                    Démarre le {new Date(t.start_date).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary">
                  {t.format === "league"
                    ? "Championnat"
                    : t.format === "knockout"
                    ? "Élimination"
                    : "Groupes + élimination"}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Statut :{" "}
                  <span className="font-medium text-zinc-200">
                    {t.status === "draft"
                      ? "Brouillon"
                      : t.status === "active"
                      ? "En cours"
                      : "Terminé"}
                  </span>
                </span>
                <span>Joueurs max : {t.max_players}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

