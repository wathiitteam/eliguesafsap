"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  position: string | null;
  favorite_team: string | null;
  elo_rating: number;
};

export default function DashboardPage() {
  const supabase = getSupabaseClient();
  const [profile, setProfile] = useState<Profile | null>(null);
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

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (data) {
        setProfile(data as Profile);
      }
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="py-10 text-sm text-zinc-400">
        Chargement de ton vestiaire...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-10 text-sm text-zinc-400">
        Impossible de charger ton profil.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
            Salut {profile.username} 👋
          </h1>
          <p className="text-sm text-zinc-500">
            Voici ton centre de contrôle Quartier FC.
          </p>
        </div>
        <Badge variant="secondary">ELO {profile.elo_rating}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-zinc-800/80 bg-zinc-950/70">
          <CardHeader>
            <CardTitle>Profil joueur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-zinc-300">
            <p>
              <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Poste
              </span>
              <br />
              {profile.position ?? "À définir"}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Équipe préférée
              </span>
              <br />
              {profile.favorite_team ?? "À définir"}
            </p>
            <Link href={`/profile/${profile.id}`}>
              <Button size="sm" variant="ghost" className="mt-2">
                Voir mon profil public
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/70">
          <CardHeader>
            <CardTitle>Tournois</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>Crée un nouveau tournoi ou rejoins celui des potes.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/tournaments/new">
                <Button size="sm">Créer un tournoi</Button>
              </Link>
              <Link href="/tournaments">
                <Button size="sm" variant="ghost">
                  Voir tous les tournois
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/70">
          <CardHeader>
            <CardTitle>Matchs à jouer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>
              Bientôt : liste de tes prochains matchs, scores à valider et
              historique rapide.
            </p>
            <Link href="/matches">
              <Button size="sm" variant="ghost">
                Voir tous mes matchs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

