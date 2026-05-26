import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getIsAdmin,
  getMatchesForAdmin,
  getAllActivePlayers,
  getGoalEventsByMatch,
  getAllTeams,
  getTournamentResult,
} from "@/lib/queries/admin";
import { ResultEntryList } from "@/components/admin/result-entry-list";
import { BracketSettle } from "@/components/admin/bracket-settle";

export const metadata = { title: "Mesa de Resultados" };

export default async function AdminPage() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/jogos");

  const [matches, players, goalsByMatch, teams, tournamentResult] =
    await Promise.all([
      getMatchesForAdmin(),
      getAllActivePlayers(),
      getGoalEventsByMatch(),
      getAllTeams(),
      getTournamentResult(),
    ]);

  const finishedCount = matches.filter((m) => m.status === "finished").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div>
            <h1 className="font-heading text-xl font-extrabold">
              Mesa de Resultados
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {finishedCount}/{matches.length} jogos lancados · cada lancamento
              fica registrado na auditoria
            </p>
          </div>
        </div>
        <Link href="/auditoria">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ScrollText className="h-3.5 w-3.5" />
            Auditoria
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-muted-foreground leading-relaxed">
        Ao confirmar um placar, os pontos de todos os participantes sao
        recalculados automaticamente a partir dos palpites travados. Voce pode
        corrigir um resultado a qualquer momento — a correcao tambem fica
        registrada.
      </div>

      <ResultEntryList
        matches={matches}
        players={players}
        goalsByMatch={goalsByMatch}
      />

      <BracketSettle teams={teams} tournamentResult={tournamentResult} />
    </div>
  );
}
