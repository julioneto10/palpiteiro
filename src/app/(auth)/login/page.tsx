"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { signInWithPassword, signInWithMagicLink } from "@/lib/actions/auth";
import { Mail, Loader2, LogIn, Wand2 } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [pwState, pwAction, pwPending] = useActionState(signInWithPassword, null);
  const [mlState, mlAction, mlPending] = useActionState(signInWithMagicLink, null);

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-primary">
          PALPITEIRO
        </h1>
        <p className="text-muted-foreground">
          Faca seus palpites para a Copa do Mundo 2026
        </p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          {mode === "password" ? (
            <form action={pwAction} className="space-y-3">
              <Input
                type="email"
                name="email"
                placeholder="seu@email.com"
                autoComplete="email"
                required
                className="h-12"
              />
              <Input
                type="password"
                name="password"
                placeholder="Senha"
                autoComplete="current-password"
                required
                className="h-12"
              />
              <Button type="submit" className="w-full h-12 text-base gap-2" disabled={pwPending}>
                {pwPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                {pwPending ? "Entrando..." : "Entrar"}
              </Button>
              {pwState?.error && (
                <p className="text-sm text-destructive text-center">{pwState.error}</p>
              )}
            </form>
          ) : mlState?.success ? (
            <div className="rounded-lg bg-success/10 p-4 text-center">
              <Mail className="mx-auto h-8 w-8 text-success mb-2" />
              <p className="font-medium text-success">Link enviado!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Abra seu email e clique no link para entrar.
              </p>
            </div>
          ) : (
            <form action={mlAction} className="space-y-3">
              <Input
                type="email"
                name="email"
                placeholder="seu@email.com"
                autoComplete="email"
                required
                className="h-12"
              />
              <Button type="submit" className="w-full h-12 text-base gap-2" disabled={mlPending}>
                {mlPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                {mlPending ? "Enviando..." : "Enviar link magico"}
              </Button>
              {mlState?.error && (
                <p className="text-sm text-destructive text-center">{mlState.error}</p>
              )}
            </form>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => setMode(mode === "password" ? "magic" : "password")}
          >
            {mode === "password" ? (
              <>
                <Wand2 className="h-4 w-4" />
                Entrar com link magico (sem senha)
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Entrar com senha
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Ainda nao tem conta?{" "}
        <Link href="/cadastro" className="text-primary font-medium hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
