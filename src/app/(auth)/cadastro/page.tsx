"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { signInWithGoogle, signInWithEmail } from "@/lib/actions/auth";
import { Mail, Chrome } from "lucide-react";

export default function CadastroPage() {
  const [state, formAction, isPending] = useActionState(signInWithEmail, null);

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-primary">
          PALPITEIRO
        </h1>
        <p className="text-muted-foreground">
          Crie sua conta e entre no bolao!
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
              Cadastrar com Google
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

          {state?.success ? (
            <div className="rounded-lg bg-success/10 p-4 text-center">
              <Mail className="mx-auto h-8 w-8 text-success mb-2" />
              <p className="font-medium text-success">
                Link enviado!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Verifique seu email para completar o cadastro
              </p>
            </div>
          ) : (
            <form action={formAction} className="space-y-3">
              <Input
                type="email"
                name="email"
                placeholder="seu@email.com"
                required
                className="h-12"
              />
              <Button
                type="submit"
                className="w-full h-12 text-base bg-primary hover:bg-primary/90"
                disabled={isPending}
              >
                <Mail className="h-5 w-5 mr-2" />
                {isPending ? "Enviando..." : "Cadastrar com Email"}
              </Button>
            </form>
          )}

          {state?.error && (
            <p className="text-sm text-destructive text-center">
              {state.error}
            </p>
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
