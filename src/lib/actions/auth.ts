"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AuthState = { error?: string; success?: boolean } | null;

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";
}

/** So aceita caminho interno (evita open-redirect). */
function safeNext(formData: FormData): string {
  const next = (formData.get("next") as string) || "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/jogos";
}

/** Cadastro com email + senha. Com auto-confirm ligado, ja loga na hora. */
export async function signUpWithEmail(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;
  const displayName = (formData.get("displayName") as string)?.trim();

  if (!email || !password) {
    return { error: "Preencha email e senha." };
  }
  if (password.length < 6) {
    return { error: "A senha precisa ter pelo menos 6 caracteres." };
  }
  if (confirm !== undefined && confirm !== password) {
    return { error: "As senhas nao conferem." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/callback`,
      data: { full_name: displayName || email.split("@")[0] },
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already been registered")) {
      return { error: "Esse email ja tem conta. Faca login." };
    }
    return { error: error.message };
  }

  // Com auto-confirm, signUp retorna sessao -> ja esta logado.
  if (data.session) {
    redirect(safeNext(formData));
  }

  // Sem sessao (confirmacao exigida): pedir verificacao por email.
  return { success: true };
}

/** Login com email + senha. */
export async function signInWithPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Preencha email e senha." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Email ou senha incorretos." };
  }

  redirect(safeNext(formData));
}

/** Login/entrada por link magico (sem senha). */
export async function signInWithMagicLink(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    return { error: "Informe seu email." };
  }

  const next = safeNext(formData);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl()}/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
