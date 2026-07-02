import { createClient } from "@/lib/supabase/server";
import { getGroupById, getGroupMembers } from "@/lib/queries/groups";
import { GUERREIROS_GROUP_ID } from "@/lib/constants/groups";
import { RankingBoard, type RankingEntry } from "@/components/shared/podium";
import { LiveRefresh } from "@/components/shared/live-refresh";

export const metadata = {
  title: "Ranking",
};

export default async function RankingPage() {
  const supabase = await createClient();

  // Ranking do Bolão dos guerreiros: usa group_members.total_points, que é
  // recalculado com a scoring_config do próprio bolão (vencedor 1 / placar
  // exato 3, sem artilheiro). O global_leaderboard usaria a pontuação PADRÃO
  // e não bate com o que a galera vê dentro do bolão.
  const group = await getGroupById(GUERREIROS_GROUP_ID);
  const members = await getGroupMembers(GUERREIROS_GROUP_ID);

  // Acertos / placares exatos são independentes da config (booleanos no
  // palpite). Buscamos do global_leaderboard só pra exibir o detalhe por linha.
  const { data: lbRows } = members.length
    ? await supabase
        .from("global_leaderboard")
        .select("user_id, correct_winners, exact_scores")
        .in(
          "user_id",
          members.map((m) => m.user_id)
        )
    : { data: [] };

  const statsByUser = new Map(
    (lbRows ?? []).map((r) => [r.user_id as string, r])
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const entries: RankingEntry[] = members.map((m) => {
    const stats = statsByUser.get(m.user_id);
    return {
      userId: m.user_id,
      name: m.profile?.display_name ?? "Anonimo",
      avatarUrl: m.profile?.avatar_url ?? null,
      points: m.total_points,
      correctWinners: stats?.correct_winners ?? 0,
      exactScores: stats?.exact_scores ?? 0,
    };
  });

  return (
    <div className="space-y-1">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-black uppercase tracking-[0.06em]">
          Ranking
        </h1>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {group?.name ?? "Bolão dos guerreiros"}
        </p>
      </div>

      {entries.length > 0 ? (
        <>
          <RankingBoard
            entries={entries}
            currentUserId={user?.id}
            hrefFor={(userId) =>
              `/boloes/${GUERREIROS_GROUP_ID}/jogador/${userId}`
            }
          />
          <div className="flex justify-center pt-3">
            <LiveRefresh intervalMs={300_000} />
          </div>
        </>
      ) : (
        <div className="space-y-2 py-16 text-center">
          <p className="font-heading text-2xl font-black uppercase tracking-wide">
            Ranking vazio
          </p>
          <p className="text-sm text-muted-foreground">
            O ranking sera atualizado conforme os jogos acontecerem.
          </p>
        </div>
      )}
    </div>
  );
}
