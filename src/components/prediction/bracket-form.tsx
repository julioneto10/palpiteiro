"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { upsertBracketPrediction } from "@/lib/actions/bracket";
import type { BracketPrediction, Team } from "@/lib/types/database";

interface BracketFormProps {
  teams: Team[];
  existing: BracketPrediction | null;
  locked: boolean;
}

export function BracketForm({ teams, existing, locked }: BracketFormProps) {
  const router = useRouter();
  const [champion, setChampion] = useState(existing?.champion_team_id ?? "");
  const [runnerUp, setRunnerUp] = useState(existing?.runner_up_team_id ?? "");
  const [third, setThird] = useState(existing?.third_team_id ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const selectClass =
    "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60";

  const rows: {
    label: string;
    value: string;
    set: (v: string) => void;
    pts: number;
  }[] = [
    { label: "Campeao", value: champion, set: setChampion, pts: 15 },
    { label: "Vice", value: runnerUp, set: setRunnerUp, pts: 8 },
    { label: "3o lugar", value: third, set: setThird, pts: 5 },
  ];

  function handleSubmit() {
    if (!champion || !runnerUp || !third) {
      toast.error("Escolha campeao, vice e terceiro lugar.");
      return;
    }
    if (new Set([champion, runnerUp, third]).size < 3) {
      toast.error("As tres selecoes precisam ser diferentes.");
      return;
    }
    startTransition(async () => {
      const res = await upsertBracketPrediction({
        championTeamId: champion,
        runnerUpTeamId: runnerUp,
        thirdTeamId: third,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Palpite de campeao salvo!");
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {rows.map((r) => (
          <label key={r.label} className="block space-y-1">
            <span className="text-xs font-medium flex items-center justify-between">
              {r.label}
              <span className="text-[10px] text-muted-foreground">{r.pts} pts</span>
            </span>
            <select
              value={r.value}
              onChange={(e) => {
                r.set(e.target.value);
                setSaved(false);
              }}
              disabled={locked || isPending}
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

        {!locked && (
          <Button
            onClick={handleSubmit}
            disabled={isPending || saved}
            className="w-full gap-2 h-11"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : null}
            {saved ? "Palpite salvo!" : existing ? "Atualizar palpite" : "Salvar palpite"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
