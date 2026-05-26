import { createClient } from "@/lib/supabase/server";
import { getGroupById, getGroupMembers, getUserMembership } from "@/lib/queries/groups";
import { getScoringConfig } from "@/lib/constants/scoring";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GroupActions } from "@/components/group/group-actions";
import { ShareInvite } from "@/components/group/share-invite";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Crown, Settings, Users } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const group = await getGroupById(groupId);
  return { title: group?.name ?? "Bolao" };
}

export default async function BolaoDetalhePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const group = await getGroupById(groupId);
  if (!group) notFound();

  const members = await getGroupMembers(groupId);
  const membership = user ? await getUserMembership(groupId, user.id) : null;
  const scoring = getScoringConfig(group.scoring_config);

  const isOwner = membership?.role === "owner";
  const isAdmin = membership?.role === "admin";
  const isMember = !!membership;

  const RankIcon = ({ rank }: { rank: number }) => (
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
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/boloes">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-xl font-extrabold">
              {group.name}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {group.type === "open" ? "Aberto" : "Privado"}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                <Users className="inline h-3 w-3 mr-0.5" />
                {members.length}/{group.max_members}
              </span>
            </div>
          </div>
        </div>
        {(isOwner || isAdmin) && (
          <Link href={`/boloes/${groupId}/config`}>
            <Button variant="ghost" size="icon-sm">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Description */}
      {group.description && (
        <p className="text-sm text-muted-foreground">{group.description}</p>
      )}

      {/* Scoring summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card size="sm">
          <CardContent className="p-2 text-center">
            <p className="font-heading text-2xl font-black text-primary leading-none">
              {scoring.correct_winner}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase font-medium">
              Vencedor
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="p-2 text-center">
            <p className="font-heading text-2xl font-black text-primary leading-none">
              +{scoring.exact_score}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase font-medium">
              Placar exato
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="p-2 text-center">
            <p className="font-heading text-2xl font-black text-primary leading-none">
              {scoring.correct_scorer}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase font-medium">
              Artilheiro
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invite / Share */}
      {isMember && (
        <ShareInvite inviteCode={group.invite_code} groupName={group.name} />
      )}

      {/* Actions for non-members */}
      {!isMember && user && (
        <GroupActions groupId={groupId} inviteCode={group.invite_code} />
      )}

      {/* Stake info */}
      {group.stake_amount && (
        <Card size="sm">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Valor da aposta
            </span>
            <span className="font-heading font-bold text-primary">
              R$ {Number(group.stake_amount).toFixed(2)}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Ranking ({members.length})
        </h2>
        <Card>
          <CardContent className="p-0 divide-y">
            {members.map((member, index) => {
              const rank = index + 1;
              const isCurrentUser = user?.id === member.user_id;

              return (
                <div
                  key={member.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    isCurrentUser && "bg-primary/5",
                    rank <= 3 && "bg-accent/5"
                  )}
                >
                  <RankIcon rank={rank} />
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={member.profile?.avatar_url ?? undefined}
                    />
                    <AvatarFallback className="text-xs font-bold">
                      {(member.profile?.display_name ?? "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isCurrentUser && "text-primary font-bold"
                      )}
                    >
                      {member.profile?.display_name ?? "Anonimo"}
                      {isCurrentUser && " (voce)"}
                      {member.role === "owner" && (
                        <Crown className="inline h-3 w-3 ml-1 text-yellow-500" />
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-2xl font-black text-primary leading-none">
                      {member.total_points}
                    </p>
                    <p className="text-[10px] text-muted-foreground">pts</p>
                  </div>
                </div>
              );
            })}
            {members.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Nenhum membro ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leave group */}
      {isMember && !isOwner && (
        <GroupActions
          groupId={groupId}
          isMember={true}
        />
      )}
    </div>
  );
}
