import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart3, UserPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getIsAdmin,
  getAppStats,
  getRecentSignups,
  getRecentPredictions,
} from "@/lib/queries/admin";

export const metadata = { title: "Logs e Estatisticas" };

function ts(date: string) {
  return new Date(date).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function StatsPage() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/jogos");

  const [stats, signups, predictions] = await Promise.all([
    getAppStats(),
    getRecentSignups(),
    getRecentPredictions(),
  ]);

  const kpis: { label: string; value: number; hint?: string }[] = [
    { label: "Usuarios", value: stats.users },
    { label: "Palpites (placar)", value: stats.predictions },
    { label: "Palpites artilheiro", value: stats.scorerPredictions },
    { label: "Palpites campeao", value: stats.bracketPredictions },
    { label: "Boloes", value: stats.groups },
    { label: "Participacoes", value: stats.memberships },
    {
      label: "Jogos lancados",
      value: stats.finishedMatches,
      hint: `de ${stats.totalMatches}`,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="font-heading text-xl font-black uppercase tracking-tight">
            Logs e Estatisticas
          </h1>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-3">
              <p className="font-heading text-3xl font-black leading-none text-primary">
                {k.value}
                {k.hint && (
                  <span className="ml-1 text-sm font-bold text-muted-foreground">
                    {k.hint}
                  </span>
                )}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {k.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Palpites recentes */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Palpites recentes
        </h2>
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {predictions.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum palpite ainda.
              </p>
            )}
            {predictions.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-semibold">{p.user_name ?? "Anonimo"}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    palpitou {p.home} {p.predicted_home_score}-
                    {p.predicted_away_score} {p.away}
                  </span>
                </span>
                <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">
                  {ts(p.created_at)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Cadastros recentes */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <UserPlus className="h-3.5 w-3.5" /> Cadastros recentes
        </h2>
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {signups.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum usuario ainda.
              </p>
            )}
            {signups.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="truncate font-semibold">
                  {s.display_name ?? "Anonimo"}
                </span>
                <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">
                  {ts(s.created_at)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
