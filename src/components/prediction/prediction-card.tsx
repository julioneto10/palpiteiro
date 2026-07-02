import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamBadge } from "@/components/shared/team-badge";
import { formatDateBRT, formatTimeBRT } from "@/lib/utils/date";
import { Check, X } from "lucide-react";
import type { MatchWithTeams, Prediction } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface PredictionCardProps {
  prediction: Prediction;
  match: MatchWithTeams;
}

const CONFETTI_COLORS = ["#FFD400", "#2BD97F", "#F2F0E3", "#17B265"];

/** Card de celebracao: o usuario CRAVOU o placar deste jogo. */
function ExactScoreCard({ prediction, match }: PredictionCardProps) {
  const home = match.home_team?.code ?? "?";
  const away = match.away_team?.code ?? "?";
  return (
    <Link href={`/jogos/${match.id}`} className="block">
      <div className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(120%_120%_at_50%_-20%,rgba(255,212,0,0.18),transparent_55%),linear-gradient(160deg,#14522F,#0C2E1B)] px-4 pb-4 pt-3 text-center shadow-[inset_0_0_0_1px_rgba(43,217,127,0.3)]">
        {Array.from({ length: 18 }).map((_, i) => (
          <i
            key={i}
            className="confetti"
            style={{
              left: `${(i / 18) * 100 + Math.sin(i * 7) * 3}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDuration: `${2.4 + ((i * 37) % 100) / 55}s`,
              animationDelay: `${((i * 53) % 100) / 40}s`,
              width: `${5 + ((i * 13) % 4)}px`,
            }}
          />
        ))}
        <p className="relative font-heading text-[30px] font-black uppercase tracking-[0.1em] text-accent [text-shadow:0_4px_24px_rgba(255,212,0,0.4)]">
          Cravou!
        </p>
        <p className="relative mt-0.5 text-xs font-bold text-foreground/80">
          Você acertou {home} {match.home_score ?? 0}×{match.away_score ?? 0}{" "}
          {away} na mosca
        </p>
        <span className="pop-in relative mt-2 inline-block rounded-full bg-success px-[18px] py-1.5 font-heading text-[20px] font-black tracking-[0.06em] text-success-foreground">
          +{prediction.points_earned} PONTOS
        </span>
      </div>
    </Link>
  );
}

export function PredictionCard({ prediction, match }: PredictionCardProps) {
  const isFinished = match.status === "finished";
  const isScheduled = match.status === "scheduled";
  const isLive = match.status === "live" || match.status === "half_time";

  if (isFinished && prediction.is_exact_score) {
    return <ExactScoreCard prediction={prediction} match={match} />;
  }

  return (
    <Link href={`/jogos/${match.id}`}>
      <Card
        className={cn(
          "transition-all hover:bg-popover",
          isFinished && prediction.is_correct_winner === false && "opacity-75"
        )}
      >
        <CardContent className="p-3 space-y-2">
          {/* Match info row */}
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            <span>
              {formatDateBRT(match.kickoff_at)} · {formatTimeBRT(match.kickoff_at)}
            </span>
            {isFinished && prediction.is_correct_winner && !prediction.is_exact_score && (
              <Badge className="gap-1 bg-success/15 px-1.5 py-0 text-[10px] text-success">
                <Check className="h-3 w-3" />
                ACERTOU
              </Badge>
            )}
            {isFinished && prediction.is_correct_winner === false && (
              <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px] text-destructive/90">
                <X className="h-3 w-3" />
                ERROU
              </Badge>
            )}
            {isLive && (
              <Badge className="gap-1.5 bg-destructive/15 px-1.5 py-0 text-[10px] font-extrabold text-destructive">
                <span className="live-dot" />
                AO VIVO
              </Badge>
            )}
            {isScheduled && (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
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
              <div className="border-r border-border px-2 pr-3 text-center">
                <p className="mb-0.5 text-[10px] text-muted-foreground">Real</p>
                <p className="font-heading text-lg font-extrabold leading-none tabular-nums">
                  {match.home_score ?? 0}
                </p>
                <p className="font-heading text-lg font-extrabold leading-none tabular-nums">
                  {match.away_score ?? 0}
                </p>
              </div>
            )}

            {/* User prediction */}
            <div className="px-2 text-center">
              <p className="mb-0.5 text-[10px] text-muted-foreground">
                Palpite
              </p>
              <p className="font-heading text-lg font-extrabold leading-none text-success tabular-nums">
                {prediction.predicted_home_score}
              </p>
              <p className="font-heading text-lg font-extrabold leading-none text-success tabular-nums">
                {prediction.predicted_away_score}
              </p>
            </div>

            {/* Points */}
            {isFinished && (
              <div className="border-l border-border pl-2 text-center">
                <p
                  className={cn(
                    "font-heading text-xl font-extrabold",
                    prediction.points_earned > 0
                      ? "text-accent"
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
