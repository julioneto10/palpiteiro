import Link from "next/link";
import type { ReactNode } from "react";
import { formatTimeBRT } from "@/lib/utils/date";
import { STAGE_LABELS } from "@/lib/constants/scoring";
import type {
  MatchWithTeams,
  Prediction,
  MatchStage,
  Team,
} from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: MatchWithTeams;
  prediction?: Prediction | null;
  compact?: boolean;
}

function TeamColumn({ team, compact }: { team: Team | null; compact: boolean }) {
  const flagSize = compact ? "h-[38px] w-[38px]" : "h-[46px] w-[46px]";
  return (
    <div className="flex flex-col items-center gap-1.5">
      {team ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/flags/${team.code}.svg`}
          alt={team.name}
          className={cn(
            "rounded-full ring-[1.5px] ring-foreground/15 shadow-[0_6px_16px_rgba(0,0,0,0.4)]",
            flagSize
          )}
        />
      ) : (
        <span
          className={cn(
            "grid place-items-center rounded-full bg-secondary font-heading font-bold text-muted-foreground ring-1 ring-foreground/10",
            flagSize
          )}
        >
          ?
        </span>
      )}
      <span
        className={cn(
          "font-heading font-extrabold tracking-[0.08em]",
          compact ? "text-[15px]" : "text-[17px]",
          !team && "text-xs font-bold text-muted-foreground tracking-normal"
        )}
      >
        {team ? team.code : "A definir"}
      </span>
    </div>
  );
}

/** Minuto estimado do jogo ao vivo (sem campo `minute` no schema). */
function estimateMinute(kickoffAt: string): number {
  const elapsed = Math.floor(
    (new Date().getTime() - new Date(kickoffAt).getTime()) / 60_000
  );
  // desconta ~15 min de intervalo no 2o tempo
  const minute = elapsed <= 45 ? elapsed : elapsed - 15;
  return Math.max(1, Math.min(90, minute));
}

export function MatchCard({ match, prediction, compact = false }: MatchCardProps) {
  const isLive = match.status === "live" || match.status === "half_time";
  const isFinished = match.status === "finished";
  const isScheduled = match.status === "scheduled";

  const context = [
    match.group_letter
      ? `Grupo ${match.group_letter}`
      : STAGE_LABELS[match.stage as MatchStage],
    match.stadium,
    match.city,
  ]
    .filter(Boolean)
    .join(" · ");

  const minute = isLive ? estimateMinute(match.kickoff_at) : 0;

  // Estado do pill de palpite (ao vivo compara com o placar atual)
  let pill: ReactNode = null;
  if (prediction) {
    const p = `${prediction.predicted_home_score}×${prediction.predicted_away_score}`;
    const liveExact =
      isLive &&
      prediction.predicted_home_score === (match.home_score ?? 0) &&
      prediction.predicted_away_score === (match.away_score ?? 0);
    const exact = isFinished ? prediction.is_exact_score : liveExact;
    const win = isFinished
      ? prediction.is_correct_winner
      : isLive &&
        Math.sign(prediction.predicted_home_score - prediction.predicted_away_score) ===
          Math.sign((match.home_score ?? 0) - (match.away_score ?? 0));
    const miss = isFinished && prediction.is_correct_winner === false;

    pill = (
      <div
        className={cn(
          "mt-2.5 flex items-center justify-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold",
          exact &&
            "bg-gradient-to-r from-success/[0.18] to-accent/[0.14] text-success",
          !exact && win && "bg-success/10 text-success",
          miss && "bg-destructive/10 text-destructive/90",
          !exact && !win && !miss && "bg-foreground/[0.06] text-muted-foreground"
        )}
      >
        {(exact || win) && (
          <span className="grid h-[15px] w-[15px] place-items-center rounded-full bg-success text-[9px] font-black text-success-foreground">
            ✓
          </span>
        )}
        <span>
          {exact && isFinished ? "Cravou" : "Seu palpite"} {p}
        </span>
        {isFinished && prediction.points_earned > 0 && (
          <span className="font-heading text-sm font-black tracking-[0.04em] text-accent">
            +{prediction.points_earned} {prediction.points_earned === 1 ? "PT" : "PTS"}
          </span>
        )}
      </div>
    );
  } else if (isScheduled) {
    pill = (
      <div className="mt-2.5 flex items-center justify-center gap-2 rounded-xl bg-foreground/[0.06] px-2.5 py-2 text-xs font-bold text-muted-foreground">
        Sem palpite — toca pra palpitar
      </div>
    );
  }

  return (
    <Link href={`/jogos/${match.id}`} className="block">
      <div
        className={cn(
          "relative overflow-hidden rounded-[20px] bg-card transition-all hover:bg-popover",
          compact ? "px-4 py-3" : "px-4 pb-3 pt-3.5",
          isLive &&
            "shadow-[inset_0_0_0_1px_rgba(255,75,66,0.28),0_0_34px_-14px_rgba(255,75,66,0.4)]"
        )}
      >
        {/* Linha de contexto */}
        <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <span className="truncate">{context}</span>
          {isScheduled && (
            <span className="shrink-0 text-foreground">
              {formatTimeBRT(match.kickoff_at)}
            </span>
          )}
          {isLive && (
            <span className="inline-flex shrink-0 items-center gap-1.5 font-extrabold text-destructive">
              <span className="live-dot" />
              {match.status === "half_time" ? "Intervalo" : `${minute}'`}
            </span>
          )}
          {isFinished && <span className="shrink-0">Encerrado</span>}
          {(match.status === "postponed" || match.status === "cancelled") && (
            <span className="shrink-0 text-destructive/80">
              {match.status === "postponed" ? "Adiado" : "Cancelado"}
            </span>
          )}
        </div>

        {/* Times + placar */}
        <div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <TeamColumn team={match.home_team} compact={compact} />
          {isScheduled ? (
            <span className="px-2 font-heading text-2xl font-bold tracking-[0.04em] text-muted-foreground">
              VS
            </span>
          ) : (
            <div
              className={cn(
                "flex items-baseline gap-2.5 px-1 font-heading font-black leading-none tabular-nums",
                compact ? "text-[34px]" : "text-[44px]"
              )}
            >
              <span>{match.home_score ?? 0}</span>
              <span className="text-[0.55em] font-semibold text-muted-foreground">
                :
              </span>
              <span>{match.away_score ?? 0}</span>
            </div>
          )}
          <TeamColumn team={match.away_team} compact={compact} />
        </div>

        {/* Barra de minuto (ao vivo) */}
        {isLive && (
          <div className="mt-3">
            <div className="h-1 overflow-hidden rounded-full bg-foreground/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-destructive to-[#FF8A5C]"
                style={{ width: `${Math.round((minute / 90) * 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[9.5px] font-bold tracking-[0.06em] text-muted-foreground">
              <span>0&apos;</span>
              <span className="text-destructive">
                {match.status === "half_time" ? "INT" : `${minute}'`}
              </span>
              <span>90&apos;</span>
            </div>
          </div>
        )}

        {pill}
      </div>
    </Link>
  );
}
