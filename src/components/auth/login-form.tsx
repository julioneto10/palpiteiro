"use client";

import { useActionState, useState } from "react";
import { signInWithPassword, signInWithMagicLink } from "@/lib/actions/auth";
import {
  authInputClass,
  authPrimaryBtnClass,
  authGhostBtnClass,
} from "@/components/auth/auth-shell";
import { ArrowRight, Loader2, Mail, Sparkles, LogIn } from "lucide-react";

export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [pwState, pwAction, pwPending] = useActionState(signInWithPassword, null);
  const [mlState, mlAction, mlPending] = useActionState(signInWithMagicLink, null);

  if (mode === "password") {
    return (
      <form action={pwAction} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next ?? ""} />
        <input type="email" name="email" placeholder="seu@email.com" autoComplete="email" required className={authInputClass} />
        <input type="password" name="password" placeholder="senha" autoComplete="current-password" required className={authInputClass} />
        <button type="submit" disabled={pwPending} className={authPrimaryBtnClass}>
          {pwPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar <ArrowRight className="h-4 w-4" /></>}
        </button>
        {pwState?.error && <p className="text-center text-sm text-[#FF8A82]">{pwState.error}</p>}
        <button type="button" onClick={() => setMode("magic")} className="flex items-center justify-center gap-1.5 py-1 text-sm font-bold text-accent">
          <Sparkles className="h-4 w-4" /> Receber link magico no e-mail
        </button>
      </form>
    );
  }

  if (mlState?.success) {
    return (
      <div className="rounded-xl border border-[#2A332E] bg-[#1B231D] p-5 text-center">
        <Mail className="mx-auto mb-2 h-8 w-8 text-accent" />
        <p className="font-bold">Link enviado!</p>
        <p className="mt-1 text-sm text-background/60">Abra seu e-mail e clique no link para entrar.</p>
      </div>
    );
  }

  return (
    <form action={mlAction} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next ?? ""} />
      <input type="email" name="email" placeholder="seu@email.com" autoComplete="email" required className={authInputClass} />
      <button type="submit" disabled={mlPending} className={authPrimaryBtnClass}>
        {mlPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Enviar link magico</>}
      </button>
      {mlState?.error && <p className="text-center text-sm text-[#FF8A82]">{mlState.error}</p>}
      <button type="button" onClick={() => setMode("password")} className={authGhostBtnClass}>
        <LogIn className="h-4 w-4" /> Entrar com senha
      </button>
    </form>
  );
}
