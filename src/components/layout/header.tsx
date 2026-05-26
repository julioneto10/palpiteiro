"use client";

import Link from "next/link";
import { Bell, ShieldCheck } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link href="/jogos" className="flex items-center gap-2">
          <span className="font-heading text-xl font-extrabold tracking-tight text-primary">
            PALPITEIRO
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              title="Mesa de Resultados"
              className="relative rounded-full p-2 text-primary hover:bg-primary/10 transition-colors"
            >
              <ShieldCheck className="h-5 w-5" />
            </Link>
          )}
          <Link
            href="/notificacoes"
            className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
          </Link>

          <Link href="/perfil">
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarImage src={user?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
