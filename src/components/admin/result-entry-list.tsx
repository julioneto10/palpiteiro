"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Search, Trash2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScoreInput } from "@/components/prediction/score-input";
import { TeamBadge } from "@/components/shared/team-badge";
import { submitMatchResult, clearMatchResult } from "@/lib/actions/admin";
import { formatDateBRT, formatTimeBRT } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { MatchWithTeams, Player } from "@/lib/types/database";

type Filter = "all" | "pending" | "finished";

interface ResultEntryListProps {
  matches: MatchWithTeams[];
  players: Player[];
  goalsByMatch: Record<string, string[]>;
}

export function ResultEntryList({
  matches,
  players,
  goalsByMatch,
}: ResultEntryListProps) {
  const [filter, setFilter] = useState<Filter>("pending");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return matches.filter((m) => {
      if (filter === "finished" && m.status !== "finished") return false;
      if (filter === "pending" && m.status === "finished") return false;
      if (q) {
        const hay = `${m.home_team?.name ?? ""} ${m.away_team?.name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [matches, filter, search]);

  const selected = matches.find((m) => m.id === openId) ?? null;

  const filters: { key: Filter; label: string }[] = [
    { key: "pending", label: "A lancar" },
    { key: "finished", label: "Finalizados" },
    { key: "all", label: "Todos" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        {filters.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por selecao..."
          className="pl-8"
        />
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhum jogo encontrado.
            </p>
          )}
          {filtered.map((m) => {
            const isFinished = m.status === "finished";
            return (
              <button
                key={m.id}
                onClick={() => setOpenId(m.id)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="text-[10px] text-muted-foreground w-14 shrink-0 leading-tight">
                  {formatDateBRT(m.kickoff_at)}
                  <br />
                  {formatTimeBRT(m.kickoff_at)}
                </span>
                <div className="flex-1 min-w-0 text-sm font-medium truncate">
                  {m.home_team?.code ?? "?"} <span className="text-muted-foreground">x</span>{" "}
                  {m.away_team?.code ?? "?"}
                </div>
                {isFinished ? (
                  <span className="font-heading font-extrabold tabular-nums text-primary">
                    {m.home_score}-{m.away_score}
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    a lancar
                  </span>
                )}
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    isFinished ? "bg-success" : "bg-muted-foreground/30"
                  )}
                />
              </button>
            );
          })}
        </CardContent>
      </Card>

      {selected && (
        <ResultDialog
          key={selected.id}
          match={selected}
          players={players}
          initialScorerIds={goalsByMatch[selected.id] ?? []}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function ResultDialog({
  match,
  players,
  initialScorerIds,
  onClose,
}: {
  match: MatchWithTeams;
  players: Player[];
  initialScorerIds: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const isFinished = match.status === "finished";
  const [home, setHome] = useState(match.home_score ?? 0);
  const [away, setAway] = useState(match.away_score ?? 0);
  const [scorerIds, setScorerIds] = useState<string[]>(initialScorerIds);
  const [isPending, startTransition] = useTransition();
  const [isClearing, setIsClearing] = useState(false);

  const teamIds = [match.home_team_id, match.away_team_id].filter(Boolean);
  const matchPlayers = players.filter((p) => teamIds.includes(p.team_id));

  function toggleScorer(id: string) {
    setScorerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    startTransition(async () => {
      const res = await submitMatchResult({
        matchId: match.id,
        home,
        away,
        scorerPlayerIds: scorerIds,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Resultado lancado e pontos recalculados!");
        onClose();
        router.refresh();
      }
    });
  }

  function handleClear() {
    setIsClearing(true);
    startTransition(async () => {
      const res = await clearMatchResult(match.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Resultado removido.");
        onClose();
        router.refresh();
      }
      setIsClearing(false);
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {match.home_team?.name ?? "A definir"} x{" "}
            {match.away_team?.name ?? "A definir"}
          </DialogTitle>
          <DialogDescription>
            {formatDateBRT(match.kickoff_at)} · {formatTimeBRT(match.kickoff_at)}
            {match.score_multiplier > 1 && (
              <> · multiplicador {match.score_multiplier}x</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 py-2">
          <div className="flex-1 text-center space-y-1.5">
            <TeamBadge team={match.home_team} size="sm" showName={false} className="justify-center" />
            <p className="text-xs font-medium truncate">{match.home_team?.code}</p>
            <ScoreInput value={home} onChange={setHome} disabled={isPending} />
          </div>
          <span className="font-heading text-xl font-extrabold text-muted-foreground mt-6">x</span>
          <div className="flex-1 text-center space-y-1.5">
            <TeamBadge team={match.away_team} size="sm" showName={false} className="justify-center" />
            <p className="text-xs font-medium truncate">{match.away_team?.code}</p>
            <ScoreInput value={away} onChange={setAway} disabled={isPending} />
          </div>
        </div>

        {matchPlayers.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              Quem marcou (opcional)
            </p>
            <div className="max-h-40 overflow-y-auto rounded-lg border divide-y">
              {matchPlayers.map((p) => {
                const checked = scorerIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleScorer(p.id)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted/50"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border shrink-0",
                        checked ? "bg-primary border-primary text-primary-foreground" : "border-input"
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate">
                      {p.shirt_number ? `#${p.shirt_number} ` : ""}
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Marque uma vez por gol do jogador (cada acerto de artilheiro pontua).
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button onClick={handleSubmit} disabled={isPending} className="w-full gap-2">
            {isPending && !isClearing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Flag className="h-4 w-4" />
            )}
            {isFinished ? "Atualizar resultado" : "Confirmar resultado"}
          </Button>
          {isFinished && (
            <Button
              variant="destructive"
              onClick={handleClear}
              disabled={isPending}
              className="w-full gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Remover resultado
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
