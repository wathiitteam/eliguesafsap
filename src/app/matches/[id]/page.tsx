"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Match } from "@/types/db";

type Player = {
  id: string;
  username: string;
};

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>();
  const supabase = getSupabaseClient();

  const [match, setMatch] = useState<Match | null>(null);
  const [homePlayer, setHomePlayer] = useState<Player | null>(null);
  const [awayPlayer, setAwayPlayer] = useState<Player | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const id = params.id;
      if (!id) return;

      const [{ data: auth }, { data: mData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("matches").select("*").eq("id", id).maybeSingle(),
      ]);

      if (!mounted) return;

      if (!auth.user) {
        window.location.href = "/login";
        return;
      }

      setUserId(auth.user.id);
      if (!mData) {
        setMatch(null);
        return;
      }

      setMatch(mData as Match);
      setHomeScore(
        mData.home_score != null ? String(mData.home_score) : ""
      );
      setAwayScore(
        mData.away_score != null ? String(mData.away_score) : ""
      );

      const { data: pData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", [mData.home_player_id, mData.away_player_id]);

      if (!mounted) return;

      const h = pData?.find((p) => p.id === mData.home_player_id) ?? null;
      const a = pData?.find((p) => p.id === mData.away_player_id) ?? null;
      setHomePlayer(h as Player | null);
      setAwayPlayer(a as Player | null);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [params.id, supabase]);

  if (!match) {
    return (
      <p className="py-8 text-sm text-zinc-400">
        Match introuvable.
      </p>
    );
  }

  const isHome = userId === match.home_player_id;
  const isAway = userId === match.away_player_id;

  const canSubmitScore =
    match.status === "scheduled" && isHome;
  const canValidate =
    match.status === "pending_validation" && isAway;

  const onSubmitScore = async () => {
    if (!canSubmitScore) return;
    const h = Number(homeScore);
    const a = Number(awayScore);
    if (!Number.isFinite(h) || !Number.isFinite(a)) {
      setError("Score invalide.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        home_score: h,
        away_score: a,
        status: "pending_validation",
        confirmed_by_home: true,
      })
      .eq("id", match.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess("Score soumis, en attente de validation.");
  };

  const onConfirmScore = async () => {
    if (!canValidate) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        status: "confirmed",
        confirmed_by_away: true,
      })
      .eq("id", match.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess("Score confirmé !");
  };

  const onDispute = async () => {
    if (!canValidate) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        status: "disputed",
      })
      .eq("id", match.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess("Match signalé comme contesté. L’admin sera notifié.");
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
        Match · J{match.round}
      </h1>

      <Card className="border-zinc-800/80 bg-zinc-950/70">
        <CardHeader>
          <CardTitle>
            {homePlayer?.username ?? "Home"}{" "}
            <span className="text-zinc-500">vs</span>{" "}
            {awayPlayer?.username ?? "Away"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-300">
          <p className="text-xs text-zinc-500">
            Statut : {match.status}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={99}
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                disabled={!canSubmitScore}
                className="w-16 text-center"
              />
              <span className="text-xs text-zinc-500">
                {homePlayer?.username ?? "Home"}
              </span>
            </div>

            <span className="text-xs text-zinc-500">-</span>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={99}
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                disabled={!canSubmitScore}
                className="w-16 text-center"
              />
              <span className="text-xs text-zinc-500">
                {awayPlayer?.username ?? "Away"}
              </span>
            </div>
          </div>

          {canSubmitScore && (
            <Button
              size="sm"
              disabled={saving}
              onClick={onSubmitScore}
            >
              Soumettre le score
            </Button>
          )}

          {canValidate && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={saving}
                onClick={onConfirmScore}
              >
                Confirmer le score
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={saving}
                onClick={onDispute}
              >
                Contester
              </Button>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-emerald-400">
              {success}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

