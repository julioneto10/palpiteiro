"use client";

import Link from "next/link";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { PREDICTION_CUTOFF_MS, STAGE_LABELS } from "@/lib/constants/scoring";
import { formatDateBRT, formatTimeBRT } from "@/lib/utils/date";
import type { MatchWithTeams, MatchStage, Team } from "@/lib/types/database";

interface NextMatchHeroProps {
  match: MatchWithTeams;
  /** Quantos jogos abertos ainda estao sem palpite do usuario. */
  missingCount: number;
}

function HeroTeam({ team }: { team: Team | null }) {
  return (
    <div className="flex w-[92px] flex-col items-center gap-1.5">
      {team ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/flags/${team.code}.svg`}
          alt={team.name}
          className="h-14 w-14 rounded-full shadow-[0_0_0_2px_rgba(255,255,255,0.16),0_10px_24px_rgba(0,0,0,0.45)]"
        />
      ) : (
        <span className="grid h-14 w-14 place-items-center rounded-full bg-black/25 font-heading text-xl font-bold text-foreground/50 ring-2 ring-white/15">
          ?
        </span>
      )}
      <span className="font-heading text-[22px] font-black tracking-[0.08em]">
        {team ? team.code : "TBD"}
      </span>
      <span className="-mt-1.5 text-[10.5px] font-semibold text-foreground/65">
        {team ? team.name : "A definir"}
      </span>
    </div>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function NextMatchHero({ match, missingCount }: NextMatchHeroProps) {
  const lockAt = new Date(
    new Date(match.kickoff_at).getTime() - PREDICTION_CUTOFF_MS
  );
  const countdown = useCountdown(lockAt);

  const todayKey = formatDateBRT(new Date());
  const tomorrowKey = formatDateBRT(
    new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
  );
  const matchKey = formatDateBRT(match.kickoff_at);
  const dayLabel =
    matchKey === todayKey
      ? "Hoje"
      : matchKey === tomorrowKey
        ? "Amanhã"
        : matchKey;

  const stageLabel = match.group_letter
    ? `Grupo ${match.group_letter}`
    : STAGE_LABELS[match.stage as MatchStage];

  const time = countdown.isExpired
    ? "Fechado"
    : countdown.days > 0
      ? `${countdown.days}d ${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`
      : `${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`;

  return (
    <div className="bg-stadium relative overflow-hidden rounded-3xl px-[18px] pb-4 pt-[18px]">
      {/* linhas de campo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0 46px, rgba(255,255,255,0.035) 46px 92px)",
        }}
      />
      {/* circulo central decorativo */}
      <div className="pointer-events-none absolute -right-[70px] -top-[70px] h-[190px] w-[190px] rounded-full border-[1.5px] border-white/[0.07]" />

      <div className="relative flex items-center justify-between text-[10.5px] font-extrabold uppercase tracking-[0.16em]">
        <span className="text-foreground/75">Próximo jogo · {stageLabel}</span>
        <span className="rounded-full bg-black/25 px-2.5 py-1 text-accent">
          {dayLabel} · {formatTimeBRT(match.kickoff_at)}
        </span>
      </div>

      <div className="relative mt-2.5 flex items-center justify-between px-1">
        <HeroTeam team={match.home_team} />
        <span className="font-heading text-3xl font-semibold text-foreground/40">
          ×
        </span>
        <HeroTeam team={match.away_team} />
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-2.5 rounded-2xl border border-white/[0.09] bg-black/[0.28] py-2.5 pl-3.5 pr-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/60">
            Palpite trava em
          </div>
          <div
            suppressHydrationWarning
            className="mt-0.5 font-heading text-2xl font-extrabold leading-none tracking-[0.06em] tabular-nums"
          >
            {time}
          </div>
        </div>
        <Link
          href="/palpitar"
          className="shrink-0 rounded-xl bg-accent px-4 py-[11px] text-[12.5px] font-extrabold text-accent-foreground shadow-[0_6px_20px_-6px_rgba(255,212,0,0.5)] transition-transform active:scale-95"
        >
          Palpitar agora
        </Link>
      </div>

      {missingCount > 0 && (
        <p className="relative mt-2.5 text-center text-[11px] font-semibold text-foreground/60">
          {missingCount === 1
            ? "Falta 1 palpite — resolve em sequência"
            : `Faltam ${missingCount} palpites — resolve em sequência, um atrás do outro`}
        </p>
      )}
    </div>
  );
}
