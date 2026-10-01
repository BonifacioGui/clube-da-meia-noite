"use client";
import { useState } from "react";
import { KeyRound, MoonStar } from "lucide-react";
import { toast, Toaster } from "sonner";
import { requireSupabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); const { error } = await requireSupabase().auth.updateUser({ password }); setBusy(false); if (error) return toast.error(error.message); toast.success("Senha atualizada."); window.setTimeout(() => window.location.replace("/"), 700); };
  return <main className="onboarding-shell"><div className="onboarding-brand"><span><MoonStar size={24} /></span><div><small>CLUBE DA</small><strong>Meia-Noite</strong></div></div><section className="onboarding-card"><div className="onboarding-art"><KeyRound size={42} /><span>OK</span></div><h1>Escolha uma nova senha.</h1><form className="club-form" onSubmit={submit}><label>Nova senha<input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="primary-button" disabled={busy} type="submit">{busy ? "Salvando…" : "Atualizar senha"}</button></form></section><Toaster position="top-center" /></main>;
}
