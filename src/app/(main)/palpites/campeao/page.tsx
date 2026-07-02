import Link from "next/link";
import { ArrowLeft, Trophy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getAllTeams } from "@/lib/queries/admin";
import { BracketForm } from "@/components/prediction/bracket-form";
import type { BracketPrediction } from "@/lib/types/database";

export const metadata = { title: "Palpite de Campeao" };

export default async function PalpiteCampeaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const teams = await getAllTeams();

  // Inicio da Copa = 1o kickoff. Depois disso, trava.
  const { data: firstMatch } = await supabase
    .from("matches")
    .select("kickoff_at")
    .order("kickoff_at", { ascending: true })
    .limit(1)
    .single();

  const tournamentStart = firstMatch?.kickoff_at ?? null;
  const isLocked = tournamentStart
    ? new Date(tournamentStart) <= new Date()
    : false;

  let existing: BracketPrediction | null = null;
  if (user) {
    const { data } = await supabase
      .from("bracket_predictions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    existing = (data as BracketPrediction) ?? null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/palpites">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          <div>
            <h1 className="font-heading text-xl font-black uppercase tracking-tight">
              Palpite de Campeao
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Campeao 15 pts · Vice 8 pts · 3o lugar 5 pts
            </p>
          </div>
        </div>
      </div>

      {isLocked ? (
        <div className="rounded-lg border border-muted bg-muted/40 p-3 flex gap-2 text-xs text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            A Copa ja comecou — os palpites de campeao estao travados. Abaixo
            esta o que voce registrou.
          </span>
        </div>
      ) : (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-[11px] text-muted-foreground leading-relaxed">
          Escolha campeao, vice e terceiro lugar. Voce pode mudar quantas vezes
          quiser ate o apito inicial do primeiro jogo — depois trava de vez.
        </div>
      )}

      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            As selecoes ainda nao foram cadastradas.
          </CardContent>
        </Card>
      ) : (
        <BracketForm teams={teams} existing={existing} locked={isLocked} />
      )}
    </div>
  );
}
