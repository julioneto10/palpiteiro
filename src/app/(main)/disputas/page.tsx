import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Swords } from "lucide-react";

export const metadata = {
  title: "Disputas",
};

export default async function DisputasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-4xl">🔒</p>
        <p className="font-heading text-lg font-bold">
          Faca login para ver suas disputas
        </p>
      </div>
    );
  }

  const { data: disputes } = await supabase
    .from("disputes")
    .select(
      `
      *,
      challenger:profiles!disputes_challenger_id_fkey(display_name, avatar_url),
      opponent:profiles!disputes_opponent_id_fkey(display_name, avatar_url)
    `
    )
    .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <Link href="/disputas/nova">
        <Button className="w-full gap-2" size="lg">
          <Swords className="h-4 w-4" />
          Nova Disputa 1v1
        </Button>
      </Link>

      {disputes && disputes.length > 0 ? (
        <div className="space-y-2">
          {disputes.map((dispute) => {
            const challenger = dispute.challenger as {
              display_name: string | null;
            } | null;
            const opponent = dispute.opponent as {
              display_name: string | null;
            } | null;

            return (
              <Link key={dispute.id} href={`/disputas/${dispute.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {challenger?.display_name ?? "???"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          vs
                        </span>
                        <span className="font-medium text-sm">
                          {opponent?.display_name ?? "???"}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {dispute.status}
                      </span>
                    </div>
                    {dispute.stake_description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {dispute.stake_description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">⚔️</p>
          <p className="font-heading text-lg font-bold">
            Nenhuma disputa ainda
          </p>
          <p className="text-sm text-muted-foreground">
            Desafie um amigo para um duelo de palpites!
          </p>
        </div>
      )}
    </div>
  );
}
