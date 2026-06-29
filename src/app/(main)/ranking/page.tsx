import { createClient } from "@/lib/supabase/server";
import { getGroupById, getGroupMembers } from "@/lib/queries/groups";
import { GUERREIROS_GROUP_ID } from "@/lib/constants/groups";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

export const metadata = {
  title: "Ranking",
};

export default async function RankingPage() {
  const supabase = await createClient();

  // Ranking do Bolão dos guerreiros: usa group_members.total_points, que é
  // recalculado com a scoring_config do próprio bolão (vencedor 1 / placar
  // exato 3, sem artilheiro). O global_leaderboard usaria a pontuação PADRÃO
  // (3/5/2) e não bate com o que a galera vê dentro do bolão.
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-accent" />
        <div>
          <h1 className="font-heading text-2xl font-black tracking-tight">
            RANKING
          </h1>
          <p className="text-[11px] text-muted-foreground">
            {group?.name ?? "Bolão dos guerreiros"}
          </p>
        </div>
      </div>

      {members.length > 0 ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0 divide-y divide-border">
            {members.map((entry, index) => {
              const profile = entry.profile as {
                display_name: string | null;
                avatar_url: string | null;
                username: string | null;
              } | null;
              const rank = index + 1;
              const isCurrentUser = user?.id === entry.user_id;
              const stats = statsByUser.get(entry.user_id);

              return (
                <div
                  key={entry.user_id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5",
                    isCurrentUser && "bg-primary/5"
                  )}
                >
                  <span
                    className={cn(
                      "rank-medal h-9 w-9 text-sm",
                      rank === 1 && "rank-1",
                      rank === 2 && "rank-2",
                      rank === 3 && "rank-3"
                    )}
                  >
                    {rank}
                  </span>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-secondary text-xs font-bold">
                      {(profile?.display_name ?? "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm font-semibold",
                        isCurrentUser && "text-primary"
                      )}
                    >
                      {profile?.display_name ?? "Anonimo"}
                      {isCurrentUser && " (voce)"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {stats?.correct_winners ?? 0} acertos ·{" "}
                      {stats?.exact_scores ?? 0} placares exatos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-xl font-black leading-none text-primary">
                      {entry.total_points}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      pts
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 py-16 text-center">
          <p className="text-4xl">🏆</p>
          <p className="font-heading text-lg font-bold">Ranking vazio</p>
          <p className="text-sm text-muted-foreground">
            O ranking sera atualizado conforme os jogos acontecerem.
          </p>
        </div>
      )}
    </div>
  );
}
