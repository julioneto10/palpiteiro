import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/user";
import { createClient } from "@/lib/supabase/server";
import { getPredictableMatches } from "@/lib/queries/matches";
import { PalpitarFlow } from "@/components/prediction/palpitar-flow";

export const metadata = {
  title: "Palpitar",
};

export default async function PalpitarPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login?redirect=/palpitar");

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
