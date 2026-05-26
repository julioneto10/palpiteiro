import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { TeamBadge } from "@/components/shared/team-badge";
import { MatchStatusBadge } from "./match-status-badge";
import { formatTimeBRT } from "@/lib/utils/date";
import { STAGE_LABELS } from "@/lib/constants/scoring";
import type { MatchWithTeams, Prediction, MatchStage } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: MatchWithTeams;
  prediction?: Prediction | null;
  compact?: boolean;
}

export function MatchCard({ match, prediction, compact = false }: MatchCardProps) {
  const isLive = match.status === "live" || match.status === "half_time";
  const isFinished = match.status === "finished";
  const isScheduled = match.status === "scheduled";

  return (
    <Link href={`/jogos/${match.id}`}>
      <Card
        className={cn(
          "transition-all hover:shadow-md",
          isLive && "border-destructive/50 shadow-destructive/10 shadow-md"
        )}
      >
        <CardContent className={cn("p-3", compact && "p-2")}>
          {/* Header: stage + status */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              {match.group_letter
                ? `Grupo ${match.group_letter}`
                : STAGE_LABELS[match.stage as MatchStage]}
            </span>
            <div className="flex items-center gap-2">
              {isScheduled && (
                <span className="text-xs font-semibold text-foreground">
                  {formatTimeBRT(match.kickoff_at)}
                </span>
              )}
              {!isScheduled && <MatchStatusBadge status={match.status} />}
            </div>
          </div>

          {/* Teams and Score */}
          <div className="flex items-center justify-between gap-2">
            {/* Home Team */}
            <div className="flex-1 min-w-0">
              <TeamBadge team={match.home_team} size={compact ? "sm" : "md"} />
            </div>

            {/* Score or Time */}
            <div className="flex items-center gap-1 px-2">
              {isScheduled ? (
                <span className="text-lg font-heading font-bold text-muted-foreground">
                  vs
                </span>
              ) : (
                <>
                  <span
                    className={cn(
                      "font-heading text-2xl font-extrabold tabular-nums",
                      isLive && "text-destructive"
                    )}
                  >
                    {match.home_score ?? 0}
                  </span>
                  <span className="text-muted-foreground mx-1">-</span>
                  <span
                    className={cn(
                      "font-heading text-2xl font-extrabold tabular-nums",
                      isLive && "text-destructive"
                    )}
                  >
                    {match.away_score ?? 0}
                  </span>
                </>
              )}
            </div>

            {/* Away Team */}
            <div className="flex-1 min-w-0 flex justify-end">
              <TeamBadge
                team={match.away_team}
                size={compact ? "sm" : "md"}
                className="flex-row-reverse"
              />
            </div>
          </div>

          {/* User prediction */}
          {prediction && (
            <div
              className={cn(
                "mt-2 pt-2 border-t text-center text-xs",
                prediction.is_exact_score
                  ? "text-success font-bold"
                  : prediction.is_correct_winner
                    ? "text-primary font-medium"
                    : prediction.is_correct_winner === false
                      ? "text-destructive"
                      : "text-muted-foreground"
              )}
            >
              Seu palpite: {prediction.predicted_home_score} x{" "}
              {prediction.predicted_away_score}
              {prediction.points_earned > 0 && (
                <span className="ml-1 font-bold">
                  (+{prediction.points_earned} pts)
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
