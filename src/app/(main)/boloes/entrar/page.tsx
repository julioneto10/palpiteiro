"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { joinGroup } from "@/lib/actions/groups";
import { ArrowLeft, LogIn } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EntrarBolaoPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    const result = await joinGroup(code);

    if (result.error) {
      toast.error(result.error);
      if (result.groupId) {
        router.push(`/boloes/${result.groupId}`);
      }
      setLoading(false);
      return;
    }

    if (result.success && result.groupId) {
      toast.success("Voce entrou no bolao!");
      router.push(`/boloes/${result.groupId}`);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/boloes">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-heading text-xl font-extrabold">
          Entrar em Bolao
        </h1>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="code" className="text-sm font-medium">
                Codigo de convite
              </label>
              <Input
                id="code"
                placeholder="Ex: ABC123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-lg font-heading font-bold tracking-widest uppercase"
              />
              <p className="text-[10px] text-muted-foreground text-center">
                Peca o codigo de 6 digitos para o dono do bolao
              </p>
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              size="lg"
              disabled={loading || code.trim().length < 3}
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Entrando..." : "Entrar no Bolao"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
