"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { settleBracket } from "@/lib/actions/admin";
import type { Team, TournamentResult } from "@/lib/types/database";

interface BracketSettleProps {
  teams: Team[];
  tournamentResult: TournamentResult | null;
}

export function BracketSettle({ teams, tournamentResult }: BracketSettleProps) {
  const router = useRouter();
  const [champion, setChampion] = useState(
    tournamentResult?.champion_team_id ?? ""
  );
  const [runnerUp, setRunnerUp] = useState(
    tournamentResult?.runner_up_team_id ?? ""
  );
  const [third, setThird] = useState(tournamentResult?.third_team_id ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!champion || !runnerUp || !third) {
      toast.error("Selecione campeao, vice e terceiro lugar.");
      return;
    }
    if (new Set([champion, runnerUp, third]).size < 3) {
      toast.error("As tres selecoes precisam ser diferentes.");
      return;
    }
    startTransition(async () => {
      const res = await settleBracket({
        championTeamId: champion,
        runnerUpTeamId: runnerUp,
        thirdTeamId: third,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Bracket apurado e pontos recalculados!");
        router.refresh();
      }
    });
  }

  const selectClass =
    "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  const rows: { label: string; value: string; set: (v: string) => void; pts: number }[] = [
    { label: "Campeao", value: champion, set: setChampion, pts: 15 },
    { label: "Vice", value: runnerUp, set: setRunnerUp, pts: 8 },
    { label: "3o lugar", value: third, set: setThird, pts: 5 },
  ];

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-accent" />
          <h2 className="font-heading text-sm font-bold">
            Apurar campeao / finalistas
          </h2>
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1">
          So preencha no fim da Copa. Pontua os palpites de bracket de todos
          (campeao {rows[0].pts} · vice {rows[1].pts} · 3o {rows[2].pts}).
          {tournamentResult?.settled_at && " Ja apurado — pode corrigir."}
        </p>

        <div className="space-y-2">
          {rows.map((r) => (
            <label key={r.label} className="flex items-center gap-2">
              <span className="text-xs font-medium w-16 shrink-0">{r.label}</span>
              <select
                value={r.value}
                onChange={(e) => r.set(e.target.value)}
                disabled={isPending}
                className={selectClass}
              >
                <option value="">— selecionar —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <Button onClick={handleSubmit} disabled={isPending} className="w-full gap-2">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trophy className="h-4 w-4" />
          )}
          Apurar bracket
        </Button>
      </CardContent>
    </Card>
  );
}
