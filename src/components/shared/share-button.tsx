"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon-sm";
  className?: string;
  children?: React.ReactNode;
}

export function ShareButton({
  title,
  text,
  url,
  variant = "outline",
  size = "default",
  className,
  children,
}: ShareButtonProps) {
  const shareUrl =
    url ??
    (typeof window !== "undefined" ? window.location.href : "");

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // User cancelled
      }
    } else {
      // Fallback: WhatsApp
      const whatsappText = `${text}\n${shareUrl}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
      window.open(whatsappUrl, "_blank");
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado!");
    } catch {
      toast.error("Erro ao copiar link");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleShare}
      onContextMenu={(e) => {
        e.preventDefault();
        handleCopyLink();
      }}
    >
      {children ?? (
        <>
          <Share2 className="h-4 w-4" />
          Compartilhar
        </>
      )}
    </Button>
  );
}
