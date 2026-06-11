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

  const missingCount = user
    ? upcomingMatches.filter((m) => !predictions[m.id]).length
    : 0;

  return (
    <div className="space-y-6">
      {/* CTA: palpitar em sequencia (rapido) */}
      {user && upcomingMatches.length > 0 && (
        <Link
          href="/palpitar"
          className="flex items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
        >
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-wide">
              Palpitar em sequencia
            </p>
            <p className="text-xs text-primary-foreground/80">
              {missingCount > 0
                ? `Faltam ${missingCount} jogo${missingCount > 1 ? "s" : ""} — rapido, um apos o outro`
                : "Revise seus palpites rapidinho"}
            </p>
          </div>
          <span className="text-xl">⚡</span>
        </Link>
      )}

      {/* Quick navigation */}
      <Link
        href="/jogos/grupos"
        className="flex items-center justify-center rounded-xl bg-primary/10 px-3 py-2.5 text-center text-sm font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary/20"
      >
        Tabela / Fase de Grupos
      </Link>

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-destructive">
            <span className="live-dot" />
            Ao Vivo
          </h2>
          <MatchList matches={liveMatches} predictions={predictions} />
        </section>
      )}

      {/* Upcoming matches */}
      {upcomingMatches.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Proximos Jogos
          </h2>
          <MatchList matches={upcomingMatches} predictions={predictions} />
        </section>
      )}

      {/* Finished matches */}
      {finishedMatches.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
