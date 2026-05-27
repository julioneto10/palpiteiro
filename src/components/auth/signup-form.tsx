"use client";

import { useActionState } from "react";
import { signUpWithEmail } from "@/lib/actions/auth";
import { authInputClass, authPrimaryBtnClass } from "@/components/auth/auth-shell";
import { ArrowRight, Loader2, Mail } from "lucide-react";

export function SignupForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(signUpWithEmail, null);

  if (state?.success) {
    return (
      <div className="rounded-xl border border-[#2A332E] bg-[#1B231D] p-5 text-center">
        <Mail className="mx-auto mb-2 h-8 w-8 text-accent" />
        <p className="font-bold">Quase la!</p>
        <p className="mt-1 text-sm text-background/60">Confirme seu e-mail para ativar a conta.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next ?? ""} />
      <input type="text" name="displayName" placeholder="Como te chamam?" autoComplete="name" required className={authInputClass} />
      <input type="email" name="email" placeholder="seu@email.com" autoComplete="email" required className={authInputClass} />
      <input type="password" name="password" placeholder="senha (min. 6 caracteres)" autoComplete="new-password" minLength={6} required className={authInputClass} />
      <input type="password" name="confirm" placeholder="confirmar senha" autoComplete="new-password" minLength={6} required className={authInputClass} />
      <button type="submit" disabled={isPending} className={authPrimaryBtnClass}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Criar conta <ArrowRight className="h-4 w-4" /></>}
      </button>
      {state?.error && <p className="text-center text-sm text-[#FF8A82]">{state.error}</p>}
    </form>
  );
}
