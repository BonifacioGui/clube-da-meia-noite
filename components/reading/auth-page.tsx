"use client";

import { useState } from "react";
import { BookOpen, KeyRound, LogIn, MoonStar, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { requireSupabase } from "@/lib/supabase";
import { isOffline } from "@/lib/pwa";

type Mode = "login" | "signup" | "forgot";

export function AuthPage({ inviteToken }: { inviteToken?: string }) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const callback = typeof window === "undefined" ? "" : `${window.location.origin}/auth/callback?next=${encodeURIComponent(inviteToken ? `/invite/${inviteToken}` : "/")}`;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isOffline()) return toast.error("Conecte-se à internet para entrar ou criar uma conta.");
    setBusy(true);
    try {
      const supabase = requireSupabase();
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
        if (error) throw error;
        toast.success("Enviamos o link de recuperação para seu e-mail.");
        setMode("login"); return;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim() }, emailRedirectTo: callback } });
        if (error) throw error;
        if (!data.session) toast.success("Confirme seu e-mail para concluir o cadastro.");
        else toast.success("Conta criada.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível autenticar."); }
    finally { setBusy(false); }
  };

  return <main className="onboarding-shell"><div className="onboarding-brand"><span><MoonStar size={24} /></span><div><small>CLUBE DA</small><strong>Meia-Noite</strong></div></div><section className="onboarding-card"><div className="onboarding-art"><BookOpen size={46} /><span>01</span></div><p className="eyebrow"><KeyRound size={14} /> ACESSO SEGURO</p><h1>{mode === "signup" ? "Crie sua conta." : mode === "forgot" ? "Recupere seu acesso." : "Volte ao clube."}</h1>{inviteToken && <p className="onboarding-copy">Seu convite está preservado. Depois da autenticação, você entrará na sala.</p>}<form className="club-form" onSubmit={submit}>{mode === "signup" && <label>Nome<input required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} /></label>}<label>E-mail<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>{mode !== "forgot" && <label>Senha<input required minLength={8} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>}<button className="primary-button" disabled={busy} type="submit">{mode === "signup" ? <UserPlus size={17} /> : <LogIn size={17} />}{busy ? "Aguarde…" : mode === "signup" ? "Criar conta" : mode === "forgot" ? "Enviar link" : "Entrar"}</button></form><div className="auth-switch">{mode !== "login" && <button onClick={() => setMode("login")}>Já tenho conta</button>}{mode !== "signup" && <button onClick={() => setMode("signup")}>Criar conta</button>}{mode !== "forgot" && <button onClick={() => setMode("forgot")}>Esqueci a senha</button>}</div></section></main>;
}
