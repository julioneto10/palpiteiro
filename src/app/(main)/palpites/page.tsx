import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { PredictionCard } from "@/components/prediction/prediction-card";
import type { MatchWithTeams, Prediction } from "@/lib/types/database";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Meus Palpites",
};

export default async function PalpitesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-4xl">🔒</p>
        <p className="font-heading text-lg font-bold">
          Faca login para ver seus palpites
        </p>
        <Link href="/login">
          <Button>Entrar</Button>
        </Link>
      </div>
    );
  }

  const { data: rawPredictions } = await supabase
    .from("predictions")
    .select(
      `
      *,
      match:matches(
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*)
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const predictions = (rawPredictions ?? []) as (Prediction & {
    match: MatchWithTeams;
  })[];

  const totalPoints = predictions.reduce(
    (sum, p) => sum + (p.points_earned ?? 0),
    0
  );
  const correctWinners = predictions.filter((p) => p.is_correct_winner).length;
  const exactScores = predictions.filter((p) => p.is_exact_score).length;
  const accuracy =
    predictions.length > 0
      ? Math.round((correctWinners / predictions.length) * 100)
      : 0;

  // Separate by status
  const pending = predictions.filter(
    (p) => p.match.status === "scheduled"
  );
  const live = predictions.filter(
    (p) => p.match.status === "live" || p.match.status === "half_time"
  );
  const finished = predictions.filter(
    (p) => p.match.status === "finished"
  );

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-extrabold">Meus Palpites</h1>

      {/* Atalhos */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/palpites/campeao">
          <Button variant="outline" className="w-full justify-start gap-2 h-11">
            <span>🏆</span>
            <span className="text-sm font-medium">Palpite de Campeao</span>
          </Button>
        </Link>
        <Link href="/auditoria">
          <Button variant="outline" className="w-full justify-start gap-2 h-11">
            <span>📜</span>
            <span className="text-sm font-medium">Auditoria</span>
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-2.5 text-center">
            <p className="font-heading text-xl font-extrabold text-primary">
              {totalPoints}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase font-medium">
              Pontos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 text-center">
            <p className="font-heading text-xl font-extrabold">
              {predictions.length}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase font-medium">
              Palpites
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 text-center">
            <p className="font-heading text-xl font-extrabold text-success">
              {exactScores}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase font-medium">
              Exatos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 text-center">
            <p className="font-heading text-xl font-extrabold">
              {accuracy}%
            </p>
            <p className="text-[9px] text-muted-foreground uppercase font-medium">
              Taxa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live predictions */}
      {live.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-destructive flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            Ao Vivo ({live.length})
          </h2>
          {live.map((p) => (
            <PredictionCard key={p.id} prediction={p} match={p.match} />
          ))}
        </section>
      )}

      {/* Pending predictions */}
      {pending.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Aguardando ({pending.length})
          </h2>
          {pending.map((p) => (
            <PredictionCard key={p.id} prediction={p} match={p.match} />
          ))}
        </section>
      )}

      {/* Finished predictions */}
      {finished.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Encerrados ({finished.length})
          </h2>
          {finished.map((p) => (
            <PredictionCard key={p.id} prediction={p} match={p.match} />
          ))}
        </section>
      )}

      {/* Empty state */}
      {predictions.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">🔮</p>
          <p className="font-heading text-lg font-bold">
            Nenhum palpite ainda
          </p>
          <p className="text-sm text-muted-foreground">
            Va ate a aba{" "}
            <Link href="/jogos" className="text-primary font-medium">
              Jogos
            </Link>{" "}
            e faca seu primeiro palpite!
          </p>
        </div>
      )}
    </div>
  );
}
