"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScoreInput } from "./score-input";
import { PredictionLockTimer } from "./prediction-lock-timer";
import { upsertPrediction } from "@/lib/actions/predictions";
import { toast } from "sonner";
import { Check, Loader2, ChevronRight, Trophy } from "lucide-react";
import { PREDICTION_HINT_SCORING, PREDICTION_CUTOFF_MS } from "@/lib/constants/scoring";
import type { MatchWithTeams, Prediction, Team } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface PredictionFormProps {
  match: MatchWithTeams;
  existingPrediction?: Prediction | null;
  nextMatchId?: string | null;
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

export function PredictionForm({
  match,
  existingPrediction,
  nextMatchId = null,
}: PredictionFormProps) {
  const router = useRouter();
  const [homeScore, setHomeScore] = useState(
    existingPrediction?.predicted_home_score ?? 0
  );
  const [awayScore, setAwayScore] = useState(
    existingPrediction?.predicted_away_score ?? 0
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const isExpired =
    new Date(match.kickoff_at).getTime() - new Date().getTime() <=
    PREDICTION_CUTOFF_MS;
  const isEditing = !!existingPrediction;

  function handleScoreChange(team: "home" | "away", value: number) {
    if (team === "home") setHomeScore(value);
    else setAwayScore(value);
    setSaved(false);
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await upsertPrediction({
        matchId: match.id,
        predictedHomeScore: homeScore,
        predictedAwayScore: awayScore,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          isEditing ? "Palpite atualizado!" : "Palpite registrado!"
        );
        setSaved(true);
      }
    });
  }

  return (
    <div
      className={cn(
        "rounded-3xl bg-card px-[18px] pb-4 pt-3.5",
        isExpired && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-sm font-extrabold uppercase tracking-[0.14em]">
          {isEditing ? "Editar palpite" : "Seu palpite"}
        </h3>
        <PredictionLockTimer kickoffAt={match.kickoff_at} />
      </div>

      {/* Times + stepper */}
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-start gap-1.5">
        <BetSide
          team={match.home_team}
          value={homeScore}
          onChange={(v) => handleScoreChange("home", v)}
          disabled={isExpired || isPending}
        />
        <span className="self-start pt-[64px] font-heading text-2xl font-semibold text-muted-foreground">
          ×
        </span>
        <BetSide
          team={match.away_team}
          value={awayScore}
          onChange={(v) => handleScoreChange("away", v)}
          disabled={isExpired || isPending}
        />
      </div>

      {/* Points preview */}
      <div className="mt-4 rounded-xl bg-secondary/60 p-3 text-center">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Pontuacao possivel
        </p>
        <div className="flex items-center justify-center gap-4 text-xs">
          <span>
            Vencedor:{" "}
            <strong className="font-heading text-sm text-success">
              {Math.floor(PREDICTION_HINT_SCORING.correct_winner * match.score_multiplier)} pts
            </strong>
          </span>
          <span>
            Placar exato:{" "}
            <strong className="font-heading text-sm text-accent">
              +{Math.floor(PREDICTION_HINT_SCORING.exact_score * match.score_multiplier)} pts
            </strong>
          </span>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isExpired || isPending || saved}
        className={cn(
          "mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-[13px] text-[15px] font-extrabold transition-transform active:scale-[0.98] disabled:pointer-events-none",
          saved
            ? "bg-success text-success-foreground"
            : "bg-accent text-accent-foreground shadow-[0_10px_30px_-8px_rgba(255,212,0,0.45)]",
          isExpired && !saved && "opacity-50"
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Salvando...
          </>
        ) : saved ? (
          <>
            <Check className="h-5 w-5" />
            Palpite salvo!
          </>
        ) : isEditing ? (
          "Atualizar Palpite"
        ) : (
          "Confirmar Palpite"
        )}
      </button>

      {/* Depois de salvar: leva pro proximo jogo (ou pra classificacao) */}
      {saved &&
        (nextMatchId ? (
          <Button
            variant="outline"
            onClick={() => router.push(`/jogos/${nextMatchId}`)}
            className="mt-2 h-12 w-full text-base font-bold"
          >
            Proximo jogo
            <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => router.push("/inicio")}
            className="mt-2 h-12 w-full text-base font-bold"
          >
            <Trophy className="mr-2 h-5 w-5" />
            Ver classificacao
          </Button>
        ))}
    </div>
  );
}
