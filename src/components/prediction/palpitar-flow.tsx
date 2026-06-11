"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreInput } from "./score-input";
import { TeamBadge } from "@/components/shared/team-badge";
import { savePredictionScore } from "@/lib/actions/predictions";
import { STAGE_LABELS } from "@/lib/constants/scoring";
import { formatFullDateBRT, formatTimeBRT } from "@/lib/utils/date";
import type { MatchWithTeams, MatchStage } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  LayoutGrid,
  Loader2,
  PartyPopper,
} from "lucide-react";

interface PalpitarFlowProps {
  matches: MatchWithTeams[];
  initialPredictions: Record<string, { home: number; away: number }>;
}

type Score = { home: number; away: number };

export function PalpitarFlow({
  matches,
  initialPredictions,
}: PalpitarFlowProps) {
  const total = matches.length;

  // Placar atual de cada jogo (default 0x0; pre-preenche os ja palpitados).
  const [scores, setScores] = useState<Record<string, Score>>(() => {
    const init: Record<string, Score> = {};
    for (const m of matches) {
      init[m.id] = initialPredictions[m.id] ?? { home: 0, away: 0 };
    }
    return init;
  });

  // Jogos ja confirmados (servidor). Comeca com o que veio do banco.
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () => new Set(Object.keys(initialPredictions))
  );

  // Comeca no primeiro jogo ainda nao palpitado.
  const [index, setIndex] = useState(() => {
    const first = matches.findIndex((m) => !initialPredictions[m.id]);
    return first === -1 ? 0 : first;
  });

  const [saving, setSaving] = useState(0); // saves em andamento
  const [done, setDone] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  const savedCount = savedIds.size;

  const match = matches[index];

  const nextUnsavedFrom = useMemo(
    () => (from: number, saved: Set<string>) => {
      for (let i = from; i < matches.length; i++) {
        if (!saved.has(matches[i].id)) return i;
      }
      return -1;
    },
    [matches]
  );

  if (total === 0) {
    return (
      <EmptyState
        title="Nenhum jogo pra palpitar"
        subtitle="Os jogos aparecem aqui assim que forem liberados."
      />
    );
  }

  if (done || !match) {
    return (
      <CompletionState savedCount={savedCount} total={total} onReview={() => setDone(false)} />
    );
  }

  const score = scores[match.id] ?? { home: 0, away: 0 };
  const isSaved = savedIds.has(match.id);

  function setSide(side: "home" | "away", value: number) {
    setScores((prev) => ({
      ...prev,
      [match.id]: { ...prev[match.id], [side]: value },
    }));
  }

  function goTo(i: number) {
    if (i < 0 || i >= total) return;
    setIndex(i);
    setShowGrid(false);
  }

  function advance(saved: Set<string>) {
    const next = nextUnsavedFrom(index + 1, saved);
    if (next !== -1) {
      setIndex(next);
    } else if (index + 1 < total) {
      setIndex(index + 1);
    } else {
      setDone(true);
    }
  }

  function confirmAndNext() {
    const m = match;
    const s = scores[m.id] ?? { home: 0, away: 0 };

    // Otimista: marca como salvo e ja avanca.
    const nextSaved = new Set(savedIds).add(m.id);
    setSavedIds(nextSaved);
    advance(nextSaved);

    // Salva em background.
    setSaving((n) => n + 1);
    savePredictionScore({
      matchId: m.id,
      predictedHomeScore: s.home,
      predictedAwayScore: s.away,
    })
      .then((res) => {
        if (res?.error) {
          toast.error(res.error);
          setSavedIds((prev) => {
            const copy = new Set(prev);
            copy.delete(m.id);
            return copy;
          });
        }
      })
      .catch(() => {
        toast.error("Falha ao salvar. Verifique sua conexao.");
        setSavedIds((prev) => {
          const copy = new Set(prev);
          copy.delete(m.id);
          return copy;
        });
      })
      .finally(() => setSaving((n) => n - 1));
  }

  const groupLabel = match.group_letter
    ? `Grupo ${match.group_letter}`
    : STAGE_LABELS[match.stage as MatchStage];

  return (
    <div className="space-y-4">
      {/* Cabecalho: progresso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">
            Jogo <strong className="text-foreground">{index + 1}</strong> de{" "}
            {total}
          </span>
          <span className="flex items-center gap-1.5">
            {saving > 0 ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                salvando
              </span>
            ) : (
              <span className="text-success font-bold">
                {savedCount}/{total} preenchidos
              </span>
            )}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success transition-all duration-300"
            style={{ width: `${(savedCount / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Card do jogo */}
      <Card key={match.id} className="overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {groupLabel}
          </span>
          {isSaved && (
            <span className="flex items-center gap-1 text-xs font-bold text-success">
              <Check className="h-3.5 w-3.5" />
              Palpitado
            </span>
          )}
        </div>

        <CardContent className="space-y-5 p-4">
          {/* Data/hora */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatFullDateBRT(match.kickoff_at)}</span>
            <span className="font-bold text-primary">
              {formatTimeBRT(match.kickoff_at)}
            </span>
          </div>

          {/* Times + placar */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2 text-center">
              <TeamBadge
                team={match.home_team}
                size="lg"
                showName={false}
                className="justify-center"
              />
              <p className="truncate text-xs font-medium">
                {match.home_team?.name ?? "A definir"}
              </p>
              <ScoreInput
                value={score.home}
                onChange={(v) => setSide("home", v)}
              />
            </div>

            <span className="mt-10 font-heading text-2xl font-extrabold text-muted-foreground">
              x
            </span>

            <div className="flex-1 space-y-2 text-center">
              <TeamBadge
                team={match.away_team}
                size="lg"
                showName={false}
                className="justify-center"
              />
              <p className="truncate text-xs font-medium">
                {match.away_team?.name ?? "A definir"}
              </p>
              <ScoreInput
                value={score.away}
                onChange={(v) => setSide("away", v)}
              />
            </div>
          </div>

          {/* Acao principal */}
          <Button
            onClick={confirmAndNext}
            className="h-12 w-full text-base font-bold"
          >
            {isSaved ? "Atualizar e proximo" : "Confirmar e proximo"}
            <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>

      {/* Navegacao */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <Button
          variant="ghost"
          onClick={() => setShowGrid((v) => !v)}
          className="gap-1.5 text-muted-foreground"
        >
          <LayoutGrid className="h-4 w-4" />
          Todos
        </Button>

        <Button
          variant="outline"
          onClick={() => goTo(index + 1)}
          disabled={index === total - 1}
          className="gap-1"
        >
          Pular
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grade para pular pra qualquer jogo */}
      {showGrid && (
        <Card>
          <CardContent className="p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Ir para um jogo
            </p>
            <div className="grid grid-cols-8 gap-1.5">
              {matches.map((m, i) => {
                const filled = savedIds.has(m.id);
                const current = i === index;
                return (
                  <button
                    key={m.id}
                    onClick={() => goTo(i)}
                    className={cn(
                      "flex h-8 items-center justify-center rounded-md text-xs font-bold tabular-nums transition-colors",
                      current
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 ring-offset-background"
                        : filled
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Os palpites salvam sozinhos ao confirmar. Da pra editar qualquer um
        antes do jogo comecar.
      </p>
    </div>
  );
}

function CompletionState({
  savedCount,
  total,
  onReview,
}: {
  savedCount: number;
  total: number;
  onReview: () => void;
}) {
  const allDone = savedCount >= total;
  return (
    <div className="space-y-5 py-10 text-center">
      <p className="text-5xl">{allDone ? "🎉" : "✅"}</p>
      <div className="space-y-1">
        <h1 className="flex items-center justify-center gap-2 font-heading text-2xl font-black uppercase">
          <PartyPopper className="h-6 w-6 text-primary" />
          {allDone ? "Tudo palpitado!" : "Boa!"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Voce preencheu{" "}
          <strong className="text-foreground">
            {savedCount} de {total}
          </strong>{" "}
          jogos.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {!allDone && (
          <Button onClick={onReview} className="h-11 font-bold">
            Continuar palpitando
          </Button>
        )}
        <Link href="/palpites">
          <Button variant="outline" className="h-11 w-full font-bold">
            Ver meus palpites
          </Button>
        </Link>
        <Link href="/jogos">
          <Button variant="ghost" className="h-11 w-full">
            Voltar aos jogos
          </Button>
        </Link>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-2 py-16 text-center">
      <p className="text-4xl">⚽</p>
      <p className="font-heading text-lg font-bold">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
