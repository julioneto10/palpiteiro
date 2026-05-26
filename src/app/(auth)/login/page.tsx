"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { signInWithGoogle, signInWithEmail } from "@/lib/actions/auth";
import { Mail, Chrome } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signInWithEmail, null);

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
        <CardContent className="space-y-4 pt-6">
          <form action={signInWithGoogle}>
            <Button
              type="submit"
              variant="outline"
              className="w-full gap-2 h-12 text-base"
            >
              <Chrome className="h-5 w-5" />
              Entrar com Google
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                ou
              </span>
            </div>
          </div>

          <form action={formAction} className="space-y-3">
            <Input
              type="email"
              name="email"
              placeholder="seu@email.com"
              required
              className="h-12"
            />
            <Input
              type="password"
              name="password"
              placeholder="Senha"
              required
              className="h-12"
            />
            <Button
              type="submit"
              className="w-full h-12 text-base bg-primary hover:bg-primary/90"
              disabled={isPending}
            >
              {isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {state?.error && (
            <p className="text-sm text-destructive text-center">
              {state.error}
            </p>
          )}
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
