"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TournamentFormat } from "@/types/db";

const schema = z.object({
  name: z.string().min(3, "Nom trop court"),
  format: z.enum(["league", "knockout", "groups_knockout"]),
  maxPlayers: z.coerce.number().int().min(2, "Min 2 joueurs"),
  startDate: z.string().min(1, "Date requise"),
});

type FormValues = z.infer<typeof schema>;

export default function NewTournamentPage() {
  const supabase = getSupabaseClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      format: "league",
      maxPlayers: 6,
      startDate: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!userId) return;
    setError(null);
    setSuccess(null);

    const { data, error: insertError } = await supabase
      .from("tournaments")
      .insert({
        name: values.name,
        format: values.format as TournamentFormat,
        max_players: values.maxPlayers,
        start_date: values.startDate,
        created_by: userId,
        status: "draft",
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccess("Tournoi créé ! Redirection en cours...");
    if (data?.id) {
      setTimeout(() => {
        window.location.href = `/tournaments/${data.id}`;
      }, 800);
    }
  };

  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <div className="w-full max-w-xl">
        <Card className="border-zinc-800/80 bg-zinc-950/70">
          <CardHeader className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Nouveau tournoi</CardTitle>
              <p className="mt-1 text-xs text-zinc-500">
                Configure le format, la date de début et le nombre de joueurs.
              </p>
            </div>
            <Badge variant="secondary">Organisateur</Badge>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Nom du tournoi
                </label>
                <Input
                  placeholder="Quartier Cup #1"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-red-400">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-zinc-300">
                    Format
                  </label>
                  <select
                    className="h-10 w-full rounded-full border border-zinc-800 bg-zinc-900/80 px-3 text-sm text-zinc-100 outline-none focus-visible:border-[#00FF87] focus-visible:ring-1 focus-visible:ring-[#00FF87]"
                    {...register("format")}
                  >
                    <option value="league">Championnat (aller simple)</option>
                    <option value="knockout">
                      Élimination directe (bracket)
                    </option>
                    <option value="groups_knockout">
                      Groupes + élimination
                    </option>
                  </select>
                  {errors.format && (
                    <p className="text-xs text-red-400">
                      {errors.format.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">
                    Joueurs max
                  </label>
                  <Input
                    type="number"
                    min={2}
                    max={32}
                    {...register("maxPlayers")}
                  />
                  {errors.maxPlayers && (
                    <p className="text-xs text-red-400">
                      {errors.maxPlayers.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Date de début
                </label>
                <Input type="date" {...register("startDate")} />
                {errors.startDate && (
                  <p className="text-xs text-red-400">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

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

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full"
              >
                Créer le tournoi
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

