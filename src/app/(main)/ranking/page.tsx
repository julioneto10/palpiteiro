import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

export const metadata = {
  title: "Ranking",
};

export default async function RankingPage() {
  const supabase = await createClient();

  const { data: leaderboard } = await supabase
    .from("global_leaderboard")
    .select(
      `
      *,
      profile:profiles!global_leaderboard_user_id_fkey(
        display_name,
        avatar_url,
        username
      )
    `
    )
    .order("total_points", { ascending: false })
    .limit(100);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-accent" />
        <h1 className="font-heading text-2xl font-black tracking-tight">
          RANKING GERAL
        </h1>
      </div>

      {leaderboard && leaderboard.length > 0 ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0 divide-y divide-border">
            {leaderboard.map((entry, index) => {
              const profile = entry.profile as {
                display_name: string | null;
                avatar_url: string | null;
                username: string | null;
              } | null;
              const rank = index + 1;
              const isCurrentUser = user?.id === entry.user_id;

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
                      {entry.correct_winners} acertos · {entry.exact_scores}{" "}
                      placares exatos
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
