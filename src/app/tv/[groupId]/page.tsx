import { notFound } from "next/navigation";
import { Crown } from "lucide-react";
import { getGroupById, getGroupMembers } from "@/lib/queries/groups";
import { LiveRefresh } from "@/components/shared/live-refresh";

// Sempre busca dados frescos — esta tela fica aberta numa TV durante os jogos.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const group = await getGroupById(groupId);
  return { title: group ? `${group.name} · Ao vivo` : "Ranking ao vivo" };
}

export default async function TvRankingPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const [group, members] = await Promise.all([
    getGroupById(groupId),
    getGroupMembers(groupId),
  ]);
  if (!group) notFound();

  const leader = members[0]?.total_points ?? 0;

  return (
    <main className="min-h-dvh bg-[#0B100C] text-white">
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6 py-6 lg:px-10 lg:py-8">
        {/* Cabecalho */}
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                Ao vivo
              </span>
            </div>
            <h1 className="truncate font-heading text-3xl font-black uppercase leading-none tracking-tight lg:text-5xl">
              {group.name}
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Classificacao · {members.length} participantes
            </p>
          </div>
          <LiveRefresh intervalMs={300_000} tone="dark" />
        </header>

        {/* Ranking */}
        <ol className="mt-5 flex-1 space-y-2">
          {members.map((member, index) => {
            const rank = index + 1;
            const top3 = rank <= 3;
            const pts = member.total_points;
            const barPct = leader > 0 ? Math.max(6, (pts / leader) * 100) : 6;

            return (
              <li
                key={member.id}
                className={[
                  "relative flex items-center gap-4 overflow-hidden rounded-2xl border px-4 py-3 lg:px-5 lg:py-4",
                  top3
                    ? "border-white/15 bg-white/[0.07]"
                    : "border-white/5 bg-white/[0.03]",
                ].join(" ")}
              >
                {/* Barra de progresso de fundo */}
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-emerald-500/10"
                  style={{ width: `${barPct}%` }}
                />

                {/* Posicao */}
                <span
                  className={[
                    "relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-xl font-heading text-xl font-black lg:h-14 lg:w-14 lg:text-2xl",
                    rank === 1 && "bg-gradient-to-b from-[#FFE371] to-[#F2B600] text-[#4A3500]",
                    rank === 2 && "bg-gradient-to-b from-[#F0F0F0] to-[#BBBFC1] text-[#2E2E2E]",
                    rank === 3 && "bg-gradient-to-b from-[#F4C28A] to-[#B07A3A] text-[#3B2300]",
                    !top3 && "bg-white/10 text-white/70",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {rank}
                </span>

                {/* Nome */}
                <div className="relative z-10 min-w-0 flex-1">
                  <p className="truncate font-heading text-xl font-bold lg:text-3xl">
                    {member.profile?.display_name ?? "Anonimo"}
                    {member.role === "owner" && (
                      <Crown className="ml-2 inline h-4 w-4 text-yellow-400 lg:h-5 lg:w-5" />
                    )}
                  </p>
                </div>

                {/* Pontos */}
                <div className="relative z-10 text-right">
                  <span className="font-heading text-3xl font-black tabular-nums leading-none text-emerald-400 lg:text-5xl">
                    {pts}
                  </span>
                  <span className="ml-1 text-xs font-bold uppercase text-white/40 lg:text-sm">
                    pts
                  </span>
                </div>
              </li>
            );
          })}

          {members.length === 0 && (
            <li className="py-20 text-center text-lg text-white/40">
              Nenhum participante ainda
            </li>
          )}
        </ol>

        <footer className="mt-4 border-t border-white/10 pt-3 text-center text-xs text-white/30">
          Palpiteiro · atualiza automaticamente a cada 5 min
        </footer>
      </div>
    </main>
  );
}
