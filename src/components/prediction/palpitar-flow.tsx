"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreInput } from "./score-input";
import { savePredictionScore } from "@/lib/actions/predictions";
import { STAGE_LABELS, PREDICTION_CUTOFF_MS } from "@/lib/constants/scoring";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { formatFullDateBRT, formatTimeBRT } from "@/lib/utils/date";
import type { MatchWithTeams, MatchStage, Team } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  LayoutGrid,
  Loader2,
  Lock,
} from "lucide-react";

interface PalpitarFlowProps {
  matches: MatchWithTeams[];
  initialPredictions: Record<string, { home: number; away: number }>;
}

type Score = { home: number; away: number };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function BetSide({
  team,
  value,
  onChange,
  disabled,
}: {
  team: Team | null;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {team ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/flags/${team.code}.svg`}
          alt={team.name}
          className="h-[52px] w-[52px] rounded-full shadow-[0_0_0_2px_rgba(242,240,227,0.14),0_8px_20px_rgba(0,0,0,0.45)]"
        />
      ) : (
        <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-secondary font-heading text-lg font-bold text-muted-foreground ring-1 ring-foreground/10">
          ?
        </span>
      )}
      <span className="font-heading text-[19px] font-black tracking-[0.08em]">
        {team ? team.code : "TBD"}
      </span>
      <span className="-mt-1.5 max-w-[110px] truncate text-[11px] font-medium text-muted-foreground">
        {team ? team.name : "A definir"}
      </span>
      <ScoreInput value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function LockNote({ kickoffAt }: { kickoffAt: string }) {
  const cutoff = new Date(
    new Date(kickoffAt).getTime() - PREDICTION_CUTOFF_MS
  );
  const c = useCountdown(cutoff);
  if (c.isExpired) return null;
  const time =
    c.days > 0
      ? `${c.days}d ${pad(c.hours)}:${pad(c.minutes)}:${pad(c.seconds)}`
      : `${pad(c.hours)}:${pad(c.minutes)}:${pad(c.seconds)}`;
  return (
    <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
      <Lock className="h-3 w-3" />
      Trava em{" "}
      <b
        suppressHydrationWarning
        className="font-heading text-[13px] font-extrabold tracking-[0.04em] text-accent tabular-nums"
      >
        {time}
      </b>{" "}
      — dá pra editar até lá
    </div>
  );
}

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

  // Jogos ja confirmados (servidor). Comeca com o que veio do banco, mas SO
  // dos jogos presentes neste fluxo (palpitaveis agora) — senao a contagem
  // estoura (ex.: 72 palpites antigos / 14 jogos abertos).
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () => new Set(matches.filter((m) => initialPredictions[m.id]).map((m) => m.id))
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
  // Palpites fecham 10 min antes do kickoff.
  const isExpired =
    new Date(match.kickoff_at).getTime() - new Date().getTime() <=
    PREDICTION_CUTOFF_MS;

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
  const context = [groupLabel, match.stadium, match.city]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-4">
      {/* Cabecalho: progresso */}
      <div className="text-center">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
          Palpite {index + 1} de {total}
        </span>
        <h1 className="mt-0.5 font-heading text-[26px] font-black uppercase tracking-[0.05em]">
          Faz teu jogo
        </h1>
        {/* Dots de progresso: verde = feito, amarelo = atual */}
        <div className="mt-2.5 flex justify-center gap-1">
          {matches.map((m, i) => (
            <button
              key={m.id}
              onClick={() => goTo(i)}
              aria-label={`Jogo ${i + 1}`}
              className={cn(
                "h-1 max-w-[22px] flex-1 rounded-full transition-colors",
                i === index
                  ? "bg-accent"
                  : savedIds.has(m.id)
                    ? "bg-primary"
                    : "bg-foreground/[0.12]"
              )}
            />
          ))}
        </div>
        <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">
          {saving > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> salvando…
            </span>
          ) : (
            <span className="text-success">
              {savedCount}/{total} preenchidos
            </span>
          )}
        </p>
      </div>

      {/* Card do palpite */}
      <div key={match.id} className="rounded-3xl bg-card px-[18px] pb-4 pt-3.5">
        <div className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {context}
        </div>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{formatFullDateBRT(match.kickoff_at)}</span>
          <span className="font-bold text-foreground">
            {formatTimeBRT(match.kickoff_at)}
          </span>
          {isSaved && (
            <span className="inline-flex items-center gap-1 font-bold text-success">
              <Check className="h-3 w-3" /> Palpitado
            </span>
          )}
        </div>

        {/* Times + stepper */}
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-1.5">
          <BetSide
            team={match.home_team}
            value={score.home}
            onChange={(v) => setSide("home", v)}
            disabled={isExpired}
          />
          <span className="self-start pt-[64px] font-heading text-2xl font-semibold text-muted-foreground">
            ×
          </span>
          <BetSide
            team={match.away_team}
            value={score.away}
            onChange={(v) => setSide("away", v)}
            disabled={isExpired}
          />
        </div>

        {!isExpired && <LockNote kickoffAt={match.kickoff_at} />}

        {/* Acao principal */}
        {isExpired ? (
          <div className="mt-3 space-y-2">
            <p className="text-center text-xs font-medium text-muted-foreground">
              Palpites encerrados para este jogo (fecham 10 min antes).
            </p>
            <Button
              onClick={() => goTo(index + 1)}
              disabled={index === total - 1}
              variant="outline"
              className="h-12 w-full text-base font-bold"
            >
              Proximo jogo
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </div>
        ) : (
          <button
            onClick={confirmAndNext}
            className="mt-3 w-full rounded-2xl bg-accent px-4 py-[13px] text-[15px] font-extrabold text-accent-foreground shadow-[0_10px_30px_-8px_rgba(255,212,0,0.45)] transition-transform active:scale-[0.98]"
          >
            {isSaved ? "Atualizar e próximo →" : "Confirmar e próximo →"}
          </button>
        )}
      </div>

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
            <p className="mb-2 font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
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
    <div className="space-y-5 pt-6">
      <div className="relative overflow-hidden rounded-3xl bg-[radial-gradient(120%_120%_at_50%_-20%,rgba(255,212,0,0.18),transparent_55%),linear-gradient(160deg,#14522F,#0C2E1B)] px-6 py-8 text-center shadow-[inset_0_0_0_1px_rgba(43,217,127,0.3)]">
        <p className="font-heading text-[34px] font-black uppercase tracking-[0.1em] text-accent [text-shadow:0_4px_24px_rgba(255,212,0,0.4)]">
          {allDone ? "Tudo palpitado!" : "Boa!"}
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground/80">
          Voce preencheu{" "}
          <strong className="text-foreground">
            {savedCount} de {total}
          </strong>{" "}
          jogos.
        </p>
        {allDone && (
          <span className="pop-in mt-4 inline-block rounded-full bg-success px-5 py-1.5 font-heading text-lg font-black uppercase tracking-[0.06em] text-success-foreground">
            Agora é torcer
          </span>
        )}
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
      <p className="font-heading text-2xl font-black uppercase tracking-wide">
        {title}
      </p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
