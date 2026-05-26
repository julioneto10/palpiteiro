"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { joinGroup } from "@/lib/actions/groups";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

interface JoinFromInviteProps {
  inviteCode: string;
  groupId: string;
}

export function JoinFromInvite({ inviteCode, groupId }: JoinFromInviteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    const result = await joinGroup(inviteCode);
    if (result.error) {
      toast.error(result.error);
      if (result.groupId) {
        router.push(`/boloes/${result.groupId}`);
      }
    } else {
      toast.success("Voce entrou no bolao!");
      router.push(`/boloes/${groupId}`);
    }
    setLoading(false);
  }

  return (
    <Button
      className="w-full gap-2"
      size="lg"
      onClick={handleJoin}
      disabled={loading}
    >
      <LogIn className="h-4 w-4" />
      {loading ? "Entrando..." : "Participar do Bolao"}
    </Button>
  );
}
