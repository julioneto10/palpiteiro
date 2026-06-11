import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getUserId } from "@/lib/supabase/user";
import { createClient } from "@/lib/supabase/server";
import { getPredictableMatches } from "@/lib/queries/matches";
import { getMyPredictionLock } from "@/lib/queries/groups";
import { PalpitarFlow } from "@/components/prediction/palpitar-flow";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Palpitar",
};

export default async function PalpitarPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login?redirect=/palpitar");

  // Se o usuario pertence a um bolao com palpites travados, encerra por aqui.
  const lock = await getMyPredictionLock(userId);
  if (lock.locked) {
    return (
      <div className="py-10">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-7 w-7" />
            </span>
            <div className="space-y-1.5">
              <h1 className="font-heading text-2xl font-black uppercase tracking-tight">
                Palpites encerrados
              </h1>
              <p className="text-sm text-muted-foreground">
                {lock.groupName ?? "Seu bolao"} travou os palpites para o
                restante da Copa. Ninguem altera mais nada — agora e so torcer e
                acompanhar a classificacao.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Link href="/ranking">
                <Button>Ver ranking</Button>
              </Link>
              <Link href="/palpites">
                <Button variant="outline">Meus palpites</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Carrega tudo de uma vez: jogos palpitaveis + palpites ja feitos do usuario.
  // A partir daqui o fluxo e 100% client-side — abrir cada jogo e instantaneo.
  const supabase = await createClient();
  const [matches, predResult] = await Promise.all([
    getPredictableMatches(),
    supabase
      .from("predictions")
      .select("match_id, predicted_home_score, predicted_away_score")
      .eq("user_id", userId),
  ]);

  const initialPredictions: Record<string, { home: number; away: number }> =
    Object.fromEntries(
      (predResult.data ?? []).map((p) => [
        p.match_id,
        { home: p.predicted_home_score, away: p.predicted_away_score },
      ])
    );

  return (
    <PalpitarFlow matches={matches} initialPredictions={initialPredictions} />
  );
}
