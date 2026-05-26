"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { signUpWithEmail } from "@/lib/actions/auth";
import { Mail, Loader2, UserPlus } from "lucide-react";

export default function CadastroPage() {
  const [state, formAction, isPending] = useActionState(signUpWithEmail, null);

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-primary">
          PALPITEIRO
        </h1>
        <p className="text-muted-foreground">Crie sua conta e entre no bolao!</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          {state?.success ? (
            <div className="rounded-lg bg-success/10 p-4 text-center">
              <Mail className="mx-auto h-8 w-8 text-success mb-2" />
              <p className="font-medium text-success">Quase la!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Confirme seu email para ativar a conta.
              </p>
            </div>
          ) : (
            <form action={formAction} className="space-y-3">
              <Input
                type="text"
                name="displayName"
                placeholder="Seu nome"
                autoComplete="name"
                required
                className="h-12"
              />
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
                placeholder="Senha (min. 6 caracteres)"
                autoComplete="new-password"
                minLength={6}
                required
                className="h-12"
              />
              <Input
                type="password"
                name="confirm"
                placeholder="Confirmar senha"
                autoComplete="new-password"
                minLength={6}
                required
                className="h-12"
              />
              <Button
                type="submit"
                className="w-full h-12 text-base gap-2"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <UserPlus className="h-5 w-5" />
                )}
                {isPending ? "Criando conta..." : "Criar conta"}
              </Button>

              {state?.error && (
                <p className="text-sm text-destructive text-center">
                  {state.error}
                </p>
              )}
            </form>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Ja tem conta?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Fazer login
        </Link>
      </p>
    </div>
  );
}
