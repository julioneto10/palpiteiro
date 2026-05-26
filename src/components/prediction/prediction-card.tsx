import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamBadge } from "@/components/shared/team-badge";
import { formatDateBRT, formatTimeBRT } from "@/lib/utils/date";
import { Check, X, Target } from "lucide-react";
import type { MatchWithTeams, Prediction } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface PredictionCardProps {
  prediction: Prediction;
  match: MatchWithTeams;
}

export function PredictionCard({ prediction, match }: PredictionCardProps) {
  const isFinished = match.status === "finished";
  const isScheduled = match.status === "scheduled";
  const isLive = match.status === "live" || match.status === "half_time";

  return (
    <Link href={`/jogos/${match.id}`}>
      <Card
        className={cn(
          "transition-all hover:shadow-md",
          isFinished && prediction.is_exact_score && "border-success/50 bg-success/5",
          isFinished && prediction.is_correct_winner && !prediction.is_exact_score && "border-primary/30",
          isFinished && prediction.is_correct_winner === false && "border-destructive/20 opacity-80"
        )}
      >
        <CardContent className="p-3 space-y-2">
          {/* Match info row */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>
              {formatDateBRT(match.kickoff_at)} • {formatTimeBRT(match.kickoff_at)}
            </span>
            {isFinished && prediction.is_exact_score && (
              <Badge className="bg-success text-white text-[10px] gap-1 px-1.5 py-0">
                <Target className="h-3 w-3" />
                PLACAR EXATO
              </Badge>
            )}
            {isFinished && prediction.is_correct_winner && !prediction.is_exact_score && (
              <Badge className="bg-primary text-white text-[10px] gap-1 px-1.5 py-0">
                <Check className="h-3 w-3" />
                ACERTOU
              </Badge>
            )}
            {isFinished && prediction.is_correct_winner === false && (
              <Badge variant="outline" className="text-destructive text-[10px] gap-1 px-1.5 py-0">
                <X className="h-3 w-3" />
                ERROU
              </Badge>
            )}
            {isLive && (
              <Badge className="bg-destructive text-white text-[10px] animate-pulse">
                AO VIVO
              </Badge>
            )}
            {isScheduled && (
              <Badge variant="outline" className="text-[10px]">
                AGUARDANDO
              </Badge>
            )}
          </div>

          {/* Teams + scores */}
          <div className="flex items-center gap-3">
            {/* Teams */}
            <div className="flex-1 min-w-0 space-y-1">
              <TeamBadge team={match.home_team} size="sm" />
              <TeamBadge team={match.away_team} size="sm" />
            </div>

            {/* Actual score (if played) */}
            {!isScheduled && (
              <div className="text-center px-2 border-r pr-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">Real</p>
                <p className="font-heading text-lg font-extrabold tabular-nums leading-none">
                  {match.home_score ?? 0}
                </p>
                <p className="font-heading text-lg font-extrabold tabular-nums leading-none">
                  {match.away_score ?? 0}
                </p>
              </div>
            )}

            {/* User prediction */}
            <div className="text-center px-2">
              <p className="text-[10px] text-muted-foreground mb-0.5">
                Palpite
              </p>
              <p className="font-heading text-lg font-extrabold tabular-nums leading-none text-primary">
                {prediction.predicted_home_score}
              </p>
              <p className="font-heading text-lg font-extrabold tabular-nums leading-none text-primary">
                {prediction.predicted_away_score}
              </p>
            </div>

            {/* Points */}
            {isFinished && (
              <div className="text-center pl-2 border-l">
                <p
                  className={cn(
                    "font-heading text-xl font-extrabold",
                    prediction.points_earned > 0
                      ? "text-success"
                      : "text-muted-foreground"
                  )}
                >
                  {prediction.points_earned > 0
                    ? `+${prediction.points_earned}`
                    : "0"}
                </p>
                <p className="text-[10px] text-muted-foreground">pts</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
