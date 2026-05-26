"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  user?: {
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
  isAdmin?: boolean;
}

export function Header({ user, isAdmin }: HeaderProps) {
  const initials = user?.display_name
    ? user.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link href="/jogos" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground font-heading text-base font-black leading-none text-accent">
            P
          </span>
          <span className="font-heading text-xl font-black tracking-tight text-foreground">
            PALPITEIRO
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              title="Mesa de Resultados"
              className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground transition-transform active:scale-95"
            >
              <ShieldCheck className="h-[18px] w-[18px]" />
            </Link>
          )}
          <Link href="/perfil">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-foreground text-[12px] font-bold text-background">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
