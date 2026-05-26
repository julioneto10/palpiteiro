"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { joinGroup, leaveGroup } from "@/lib/actions/groups";
import { LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";

interface GroupActionsProps {
  groupId: string;
  inviteCode?: string;
  isMember?: boolean;
}

export function GroupActions({ groupId, inviteCode, isMember }: GroupActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!inviteCode) return;
    setLoading(true);
    const result = await joinGroup(inviteCode);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Voce entrou no bolao!");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleLeave() {
    setLoading(true);
    const result = await leaveGroup(groupId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Voce saiu do bolao.");
      router.push("/boloes");
    }
    setLoading(false);
  }

  if (isMember) {
    return (
      <Button
        variant="outline"
        className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
        onClick={handleLeave}
        disabled={loading}
      >
        <LogOut className="h-4 w-4" />
        {loading ? "Saindo..." : "Sair do Bolao"}
      </Button>
    );
  }

  return (
    <Button
      className="w-full gap-2"
      size="lg"
      onClick={handleJoin}
      disabled={loading}
    >
      <LogIn className="h-4 w-4" />
      {loading ? "Entrando..." : "Entrar neste Bolao"}
    </Button>
  );
}
