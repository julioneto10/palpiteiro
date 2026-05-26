import Link from "next/link";
import { ArrowLeft, ScrollText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getResultAudit, type ResultAuditWithMatch } from "@/lib/queries/admin";

export const metadata = { title: "Auditoria" };

const ACTION_LABEL: Record<string, string> = {
  set_result: "lancou o resultado",
  update_result: "corrigiu o resultado",
  clear_result: "removeu o resultado",
  settle_bracket: "apurou o bracket",
};

function scoreText(h: number | null, a: number | null) {
  if (h === null || a === null) return "—";
  return `${h}-${a}`;
}

function entryLine(e: ResultAuditWithMatch) {
  const home = e.match?.home_team?.code ?? "?";
  const away = e.match?.away_team?.code ?? "?";
  return `${home} x ${away}`;
}

export default async function AuditoriaPage() {
  const audit = await getResultAudit();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/ranking">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" />
          <div>
            <h1 className="font-heading text-xl font-black uppercase tracking-tight">Auditoria</h1>
            <p className="text-[11px] text-muted-foreground">
              Todo lancamento e correcao de resultado fica registrado aqui
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex gap-2 text-[11px] text-muted-foreground leading-relaxed">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>
          Os palpites travam no apito inicial de cada jogo e nao podem ser
          alterados depois. Os pontos sao calculados automaticamente a partir
          dos palpites travados + o resultado oficial. Esta pagina mostra quem
          lancou cada placar e quando — total transparencia.
        </span>
      </div>

      {audit.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum resultado lancado ainda.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {audit.map((e) => (
              <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{entryLine(e)}</span>{" "}
                    <span className="text-muted-foreground">
                      {ACTION_LABEL[e.action] ?? e.action}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    por {e.actor?.display_name ?? "organizador"} ·{" "}
                    {new Date(e.created_at).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {e.action === "update_result" ? (
                    <p className="font-heading text-sm font-bold tabular-nums">
                      <span className="text-muted-foreground line-through mr-1">
                        {scoreText(e.old_home, e.old_away)}
                      </span>
                      {scoreText(e.new_home, e.new_away)}
                    </p>
                  ) : e.action === "clear_result" ? (
                    <p className="font-heading text-sm font-bold tabular-nums text-muted-foreground line-through">
                      {scoreText(e.old_home, e.old_away)}
                    </p>
                  ) : (
                    <p className="font-heading text-sm font-bold tabular-nums text-primary">
                      {scoreText(e.new_home, e.new_away)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
