import { getMatches } from "@/lib/queries/matches";
import { MatchList } from "@/components/match/match-list";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = {
  title: "Jogos",
};

export default async function JogosPage() {
  const [matches, supabase] = await Promise.all([
    getMatches(),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user predictions if logged in
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let predictions: Record<string, any> = {};
  if (user) {
    const { data } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", user.id);

    if (data) {
      predictions = Object.fromEntries(
        data.map((p) => [p.match_id, p])
      );
    }
  }

  // Separate matches by status
  const liveMatches = matches.filter(
    (m) => m.status === "live" || m.status === "half_time"
  );
  const upcomingMatches = matches.filter((m) => m.status === "scheduled");
  const finishedMatches = matches
    .filter((m) => m.status === "finished")
    .reverse();

  return (
    <div className="space-y-6">
      {/* Quick navigation */}
      <div className="flex gap-2">
        <Link
          href="/jogos/grupos"
          className="flex-1 rounded-lg bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          Fase de Grupos
        </Link>
        <Link
          href="/jogos/chaves"
          className="flex-1 rounded-lg bg-accent/20 px-3 py-2 text-center text-sm font-medium text-accent-foreground hover:bg-accent/30 transition-colors"
        >
          Chaves
        </Link>
      </div>

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <section>
          <h2 className="font-heading text-lg font-bold mb-2 text-destructive flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            Ao Vivo
          </h2>
          <MatchList matches={liveMatches} predictions={predictions} />
        </section>
      )}

      {/* Upcoming matches */}
      {upcomingMatches.length > 0 && (
        <section>
          <h2 className="font-heading text-lg font-bold mb-2">
            Proximos Jogos
          </h2>
          <MatchList matches={upcomingMatches} predictions={predictions} />
        </section>
      )}

      {/* Finished matches */}
      {finishedMatches.length > 0 && (
        <section>
          <h2 className="font-heading text-lg font-bold mb-2 text-muted-foreground">
            Resultados
          </h2>
          <MatchList matches={finishedMatches} predictions={predictions} />
        </section>
      )}

      {/* Empty state */}
      {matches.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">⚽</p>
          <p className="font-heading text-lg font-bold">
            Nenhum jogo disponivel
          </p>
          <p className="text-sm text-muted-foreground">
            Os jogos da Copa do Mundo 2026 aparecerrao aqui em breve!
          </p>
        </div>
      )}
    </div>
  );
}
