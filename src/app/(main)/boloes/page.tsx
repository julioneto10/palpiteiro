import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, LogIn, Crown, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Boloes",
};

export default async function BoloesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="font-heading text-2xl font-black uppercase tracking-wide">
          Faca login para ver seus boloes
        </p>
        <Link href="/login">
          <Button>Entrar</Button>
        </Link>
      </div>
    );
  }

  const { data: memberships } = await supabase
    .from("group_members")
    .select(
      `
      *,
      group:groups(*)
    `
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-black uppercase tracking-tight">
        Meus Boloes
      </h1>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href="/boloes/criar" className="flex-1">
          <Button className="w-full gap-2" size="lg">
            <Plus className="h-4 w-4" />
            Criar Bolao
          </Button>
        </Link>
        <Link href="/boloes/entrar" className="flex-1">
          <Button variant="outline" className="w-full gap-2" size="lg">
            <LogIn className="h-4 w-4" />
            Entrar em Bolao
          </Button>
        </Link>
      </div>

      {/* Group list */}
      {memberships && memberships.length > 0 ? (
        <div className="space-y-2">
          {memberships.map((membership) => {
            const group = membership.group as {
              id: string;
              name: string;
              type: string;
              stake_amount: number | null;
            } | null;
            if (!group) return null;
            return (
              <Link key={group.id} href={`/boloes/${group.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold truncate">{group.name}</h3>
                        {membership.role === "owner" && (
                          <Crown className="h-3.5 w-3.5 text-accent shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {group.type === "open" ? "Aberto" : "Privado"}
                        </Badge>
                        {group.stake_amount && (
                          <span className="text-[10px] text-muted-foreground">
                            R$ {group.stake_amount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-heading text-2xl font-black text-primary leading-none">
                        {membership.total_points}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {membership.rank ? `#${membership.rank}` : "pts"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 space-y-2">
          <p className="font-heading text-2xl font-black uppercase tracking-wide">
            Nenhum bolao ainda
          </p>
          <p className="text-sm text-muted-foreground">
            Crie um bolao ou entre em um com seus amigos!
          </p>
        </div>
      )}
    </div>
  );
}
