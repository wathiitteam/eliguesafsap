import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="grid gap-8 md:grid-cols-[minmax(0,1.6fr),minmax(0,1fr)] md:items-center">
        <div className="space-y-5">
          <Badge variant="default" className="uppercase tracking-[0.18em]">
            Plateforme eFootball · Quartier
          </Badge>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl md:text-5xl">
            Organise tes{" "}
            <span className="bg-gradient-to-r from-[#00FF87] to-emerald-400 bg-clip-text text-transparent">
              tournois de quartier
            </span>{" "}
            comme un pro.
          </h1>
          <p className="max-w-xl text-sm text-zinc-400 sm:text-base">
            Quartier FC centralise vos matchs eFootball: tournois, championnats,
            ELO dynamique, stats détaillées et notifications temps réel. Tout
            ce qu’il faut pour décider qui est le vrai boss du quartier.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login">
              <Button size="lg">Entrer sur le terrain</Button>
            </Link>
            <Link href="/leaderboard">
              <Button size="lg" variant="ghost">
                Voir le classement global
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-zinc-800/80 bg-zinc-950/70">
          <CardHeader className="flex items-center justify-between gap-2">
            <CardTitle>Stats globales du quartier</CardTitle>
            <Badge variant="secondary">Live</Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Joueurs actifs
              </div>
              <div className="mt-1 text-2xl font-semibold text-zinc-50">
                12
              </div>
              <div className="text-[11px] text-emerald-400">
                +3 cette semaine
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Matchs joués
              </div>
              <div className="mt-1 text-2xl font-semibold text-zinc-50">
                87
              </div>
              <div className="text-[11px] text-zinc-500">
                Historique quartier FC
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                ELO moyen
              </div>
              <div className="mt-1 text-2xl font-semibold text-zinc-50">
                1012
              </div>
              <div className="text-[11px] text-zinc-500">
                Stable · meta balanced
              </div>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                <div className="h-full w-2/3 bg-gradient-to-r from-[#00FF87] to-emerald-400" />
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">
                Un nouveau mini-championnat est en cours. Les points ELO seront
                recalculés à chaque score confirmé.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
