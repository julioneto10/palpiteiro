import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Award } from "lucide-react";

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

  const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-700" />;
    return (
      <span className="text-sm font-bold text-muted-foreground w-5 text-center">
        {rank}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-extrabold">Ranking Global</h1>

      {leaderboard && leaderboard.length > 0 ? (
        <Card>
          <CardContent className="p-0 divide-y">
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
                    "flex items-center gap-3 px-4 py-3",
                    isCurrentUser && "bg-primary/5",
                    rank <= 3 && "bg-accent/5"
                  )}
                >
                  <RankIcon rank={rank} />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs font-bold">
                      {(profile?.display_name ?? "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isCurrentUser && "text-primary font-bold"
                      )}
                    >
                      {profile?.display_name ?? "Anonimo"}
                      {isCurrentUser && " (voce)"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.correct_winners} acertos •{" "}
                      {entry.exact_scores} placares exatos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-lg font-extrabold text-primary">
                      {entry.total_points}
                    </p>
                    <p className="text-[10px] text-muted-foreground">pts</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">🏆</p>
          <p className="font-heading text-lg font-bold">
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
