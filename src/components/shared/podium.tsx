import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface RankingEntry {
  userId: string;
  name: string;
  avatarUrl: string | null;
  points: number;
  correctWinners: number;
  exactScores: number;
}

interface RankingBoardProps {
  entries: RankingEntry[];
  currentUserId?: string | null;
  /** Se definido, cada pessoa vira link (ex.: palpites do jogador). */
  hrefFor?: (userId: string) => string;
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function subLine(entry: RankingEntry) {
  const acertos = `${entry.correctWinners} acerto${entry.correctWinners === 1 ? "" : "s"}`;
  const cravadas = `${entry.exactScores} cravada${entry.exactScores === 1 ? "" : "s"}`;
  return `${acertos} · ${cravadas}`;
}

const PODIUM_STYLE = [
  {
    // 1o lugar
    ava: "h-[74px] w-[74px] text-2xl ring-[2.5px] ring-[var(--gold)] shadow-[0_0_42px_-8px_rgba(242,182,0,0.55)]",
    step: "h-[86px] rounded-t-xl bg-gradient-to-b from-[rgba(242,182,0,0.22)] to-card text-[color:rgba(242,182,0,0.75)]",
    pts: "text-[32px] text-accent",
  },
  {
    // 2o lugar
    ava: "h-[58px] w-[58px] text-xl ring-2 ring-[var(--silver)]",
    step: "h-[60px] rounded-tl-xl bg-gradient-to-b from-popover to-card text-foreground/25",
    pts: "text-2xl",
  },
  {
    // 3o lugar
    ava: "h-[58px] w-[58px] text-xl ring-2 ring-[var(--bronze)]",
    step: "h-11 rounded-tr-xl bg-gradient-to-b from-popover to-card text-foreground/25",
    pts: "text-2xl",
  },
] as const;

function PodiumColumn({
  entry,
  place,
  href,
}: {
  entry: RankingEntry;
  place: 1 | 2 | 3;
  href?: string;
}) {
  const style = PODIUM_STYLE[place - 1];
  const body = (
    <div className="flex w-24 flex-col items-center gap-2">
      <div className="relative">
        {place === 1 && (
          <span className="crown-bob absolute -top-[21px] left-1/2 -ml-[10px] text-[17px]">
            👑
          </span>
        )}
        <Avatar className={cn("bg-secondary", style.ava)}>
          <AvatarImage src={entry.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-transparent font-heading font-black">
            {initials(entry.name)}
          </AvatarFallback>
        </Avatar>
      </div>
      <span className="max-w-[90px] truncate text-[11.5px] font-bold">
        {entry.name}
      </span>
      <span
        className={cn(
          "text-center font-heading font-black leading-none tracking-[0.03em]",
          style.pts
        )}
      >
        {entry.points}
        <small className="mt-1 block font-sans text-[8.5px] font-extrabold tracking-[0.18em] text-muted-foreground">
          PTS
        </small>
      </span>
      <div
        className={cn(
          "grid w-full place-items-center pt-2 font-heading text-[22px] font-black",
          style.step
        )}
      >
        {place}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="transition-transform active:scale-[0.97]">
      {body}
    </Link>
  ) : (
    body
  );
}

export function RankingBoard({
  entries,
  currentUserId,
  hrefFor,
}: RankingBoardProps) {
  const hasPodium = entries.length >= 3;
  const podium = hasPodium ? entries.slice(0, 3) : [];
  const rest = hasPodium ? entries.slice(3) : entries;
  const leader = entries[0];

  const row = (entry: RankingEntry, rank: number) => {
    const isMe = currentUserId === entry.userId;
    const behind = leader ? leader.points - entry.points : 0;
    const content = (
      <>
        <span className="w-6 text-center font-heading text-[17px] font-extrabold text-muted-foreground">
          {rank}
        </span>
        <Avatar className="h-9 w-9 bg-secondary">
          <AvatarImage src={entry.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-transparent text-xs font-extrabold">
            {initials(entry.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-[13px] font-bold",
              isMe && "text-success"
            )}
          >
            {entry.name}
            {isMe && " (você)"}
          </p>
          <p className="mt-px text-[10px] font-semibold text-muted-foreground">
            {isMe && behind > 0
              ? `${behind} pt${behind === 1 ? "" : "s"} atrás do líder`
              : isMe && behind === 0
                ? "Empatado com o líder"
                : subLine(entry)}
          </p>
        </div>
        <span className="min-w-10 text-right font-heading text-[21px] font-black tracking-[0.02em]">
          {entry.points}
          <small className="block font-sans text-[8px] font-extrabold tracking-[0.2em] text-muted-foreground">
            PTS
          </small>
        </span>
      </>
    );
    const rowClass = cn(
      "flex items-center gap-3 px-3 py-2.5",
      !isMe && "border-b border-border last:border-b-0",
      isMe &&
        "-mx-1.5 my-0.5 rounded-2xl bg-gradient-to-r from-primary/[0.14] to-transparent px-4",
      hrefFor && "transition-colors hover:bg-foreground/[0.03]"
    );
    return hrefFor ? (
      <Link key={entry.userId} href={hrefFor(entry.userId)} className={rowClass}>
        {content}
      </Link>
    ) : (
      <div key={entry.userId} className={rowClass}>
        {content}
      </div>
    );
  };

  let restRows: ReactNode = null;
  if (rest.length > 0) {
    restRows = (
      <div className="rounded-[22px] bg-card px-3 py-1.5">
        {rest.map((entry, i) => row(entry, (hasPodium ? 4 : 1) + i))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasPodium && (
        <div className="flex items-end justify-center gap-2.5 px-2 pt-6">
          <PodiumColumn
            entry={podium[1]}
            place={2}
            href={hrefFor?.(podium[1].userId)}
          />
          <PodiumColumn
            entry={podium[0]}
            place={1}
            href={hrefFor?.(podium[0].userId)}
          />
          <PodiumColumn
            entry={podium[2]}
            place={3}
            href={hrefFor?.(podium[2].userId)}
          />
        </div>
      )}
      {restRows}
    </div>
  );
}
