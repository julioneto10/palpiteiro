"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreInput } from "./score-input";
import { PredictionLockTimer } from "./prediction-lock-timer";
import { TeamBadge } from "@/components/shared/team-badge";
import { upsertPrediction } from "@/lib/actions/predictions";
import { toast } from "sonner";
import { Check, Loader2, ChevronRight, Trophy } from "lucide-react";
import { PREDICTION_HINT_SCORING, PREDICTION_CUTOFF_MS } from "@/lib/constants/scoring";
import type { MatchWithTeams, Prediction } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface PredictionFormProps {
  match: MatchWithTeams;
  existingPrediction?: Prediction | null;
  nextMatchId?: string | null;
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
    <Card
      className={cn(
        "overflow-hidden",
        isExpired && "opacity-60"
      )}
    >
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 px-4 py-2 flex items-center justify-between">
        <h3 className="text-sm font-bold">
          {isEditing ? "Editar Palpite" : "Seu Palpite"}
        </h3>
        <PredictionLockTimer kickoffAt={match.kickoff_at} />
      </div>

      <CardContent className="p-4 space-y-5">
        {/* Score selectors */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 text-center space-y-2">
            <TeamBadge
              team={match.home_team}
              size="sm"
              showName={false}
              className="justify-center"
            />
            <p className="text-xs font-medium truncate">
              {match.home_team?.name ?? "A definir"}
            </p>
            <ScoreInput
              value={homeScore}
              onChange={(v) => handleScoreChange("home", v)}
              disabled={isExpired || isPending}
            />
          </div>

          <span className="font-heading text-2xl font-extrabold text-muted-foreground mt-6">
            x
          </span>

          <div className="flex-1 text-center space-y-2">
            <TeamBadge
              team={match.away_team}
              size="sm"
              showName={false}
              className="justify-center"
            />
            <p className="text-xs font-medium truncate">
              {match.away_team?.name ?? "A definir"}
            </p>
            <ScoreInput
              value={awayScore}
              onChange={(v) => handleScoreChange("away", v)}
              disabled={isExpired || isPending}
            />
          </div>
        </div>


        {/* Points preview */}
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">
            Pontuacao possivel
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <span>
              Vencedor:{" "}
              <strong className="text-primary">
                {Math.floor(PREDICTION_HINT_SCORING.correct_winner * match.score_multiplier)} pts
              </strong>
            </span>
            <span>
              Placar exato:{" "}
              <strong className="text-accent-foreground">
                +{Math.floor(PREDICTION_HINT_SCORING.exact_score * match.score_multiplier)} pts
              </strong>
            </span>
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isExpired || isPending || saved}
          className={cn(
            "w-full h-12 text-base font-bold",
            saved
              ? "bg-success hover:bg-success"
              : "bg-primary hover:bg-primary/90"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Salvando...
            </>
          ) : saved ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Palpite salvo!
            </>
          ) : isEditing ? (
            "Atualizar Palpite"
          ) : (
            "Confirmar Palpite"
          )}
        </Button>

        {/* Depois de salvar: leva pro proximo jogo (ou pra classificacao) */}
        {saved &&
          (nextMatchId ? (
            <Button
              variant="outline"
              onClick={() => router.push(`/jogos/${nextMatchId}`)}
              className="w-full h-12 text-base font-bold"
            >
              Proximo jogo
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => router.push("/inicio")}
              className="w-full h-12 text-base font-bold"
            >
              <Trophy className="h-5 w-5 mr-2" />
              Ver classificacao
            </Button>
          ))}
      </CardContent>
    </Card>
  );
}
