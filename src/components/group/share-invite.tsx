"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareInviteProps {
  inviteCode: string;
  groupName: string;
}

export function ShareInvite({ inviteCode, groupName }: ShareInviteProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/convite/${inviteCode}`
    : `/convite/${inviteCode}`;

  const shareText = `Entra no meu bolao "${groupName}" no Palpiteiro! Use o codigo: ${inviteCode}\n${inviteUrl}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast.success("Codigo copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bolao: ${groupName}`,
          text: shareText,
          url: inviteUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: open WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, "_blank");
    }
  }

  return (
    <Card size="sm">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Codigo de convite
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
        <p className="text-center font-heading text-2xl font-extrabold tracking-[0.3em] text-primary">
          {inviteCode}
        </p>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
          Convidar amigos
        </Button>
      </CardContent>
    </Card>
  );
}
