import { getMatches } from "@/lib/queries/matches";
import { MatchList } from "@/components/match/match-list";
import { NextMatchHero } from "@/components/match/next-match-hero";
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

  // Jogos abertos pra palpite: agendados, fora da fase de grupos, com os 2 times
  const predictableMatches = upcomingMatches.filter(
    (m) => m.stage !== "group" && m.home_team && m.away_team
  );
  const missingCount = user
    ? predictableMatches.filter((m) => !predictions[m.id]).length
    : 0;

  // Hero: proximo jogo ainda sem palpite (fallback: proximo palpitavel, depois proximo agendado)
  const heroMatch = user
    ? (predictableMatches.find((m) => !predictions[m.id]) ??
      predictableMatches[0] ??
      upcomingMatches[0])
    : (predictableMatches[0] ?? upcomingMatches[0]);

  const sectionLabel =
    "font-heading text-[13px] font-bold uppercase tracking-[0.22em] text-muted-foreground";

  return (
    <div className="space-y-6">
      {/* Hero do proximo jogo com countdown de trava */}
      {user && heroMatch && (
        <NextMatchHero match={heroMatch} missingCount={missingCount} />
      )}

      {/* Quick navigation */}
      <Link
        href="/jogos/grupos"
        className="flex items-center justify-center rounded-xl bg-primary/10 px-3 py-2.5 text-center font-heading text-sm font-bold uppercase tracking-[0.14em] text-primary transition-colors hover:bg-primary/20"
      >
        Tabela / Fase de Grupos
      </Link>

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <section className="space-y-2">
          <h2 className={`flex items-center gap-2 ${sectionLabel} !text-destructive`}>
            <span className="live-dot" />
            Ao Vivo
          </h2>
          <MatchList matches={liveMatches} predictions={predictions} />
        </section>
      )}

      {/* Upcoming matches */}
      {upcomingMatches.length > 0 && (
        <section className="space-y-2">
          <h2 className={sectionLabel}>Proximos Jogos</h2>
          <MatchList matches={upcomingMatches} predictions={predictions} />
        </section>
      )}

      {/* Finished matches */}
      {finishedMatches.length > 0 && (
        <section className="space-y-2">
          <h2 className={sectionLabel}>Resultados</h2>
          <MatchList matches={finishedMatches} predictions={predictions} />
        </section>
      )}

      {/* Empty state */}
      {matches.length === 0 && (
        <div className="space-y-2 py-16 text-center">
          <p className="font-heading text-2xl font-black uppercase tracking-wide">
            Nenhum jogo disponivel
          </p>
          <p className="text-sm text-muted-foreground">
            Os jogos da Copa do Mundo 2026 aparecerao aqui em breve!
          </p>
        </div>
      )}
    </div>
  );
}
