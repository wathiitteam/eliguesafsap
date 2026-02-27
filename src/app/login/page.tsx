"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email requis")
    .email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
  username: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    setSuccess(null);

    if (mode === "register") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            username: values.username,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccess(
        "Compte créé ! Vérifie ta boîte mail si la confirmation est activée."
      );
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="border-zinc-800/80 bg-zinc-950/70">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Connexion Quartier FC</CardTitle>
              <p className="mt-1 text-xs text-zinc-500">
                Rejoins la ligue du quartier, suis tes matchs et ton ELO.
              </p>
            </div>
            <Badge variant="default">
              eFootball
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-full px-3 py-1 ${
                  mode === "login"
                    ? "bg-zinc-900 text-zinc-100"
                    : "text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-100"
                }`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-full px-3 py-1 ${
                  mode === "register"
                    ? "bg-zinc-900 text-zinc-100"
                    : "text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-100"
                }`}
              >
                Créer un compte
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">
                    Pseudo
                  </label>
                  <Input
                    placeholder="NeymarDuBloc"
                    {...register("username")}
                  />
                  {errors.username && (
                    <p className="text-xs text-red-400">
                      {errors.username.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="toi@quartierfc.gg"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Mot de passe
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-red-400">
                    {errors.password.message}
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
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "login" ? "Entrer sur le terrain" : "Rejoindre le club"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

