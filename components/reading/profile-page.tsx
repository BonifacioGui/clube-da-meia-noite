"use client";
import { useState } from "react";
import { LogOut, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { ReadingClub } from "@/hooks/use-reading-club";
import { requireSupabase } from "@/lib/supabase";

export function ProfilePage({ club, email, onSignOut }: { club: ReadingClub; email: string; onSignOut: () => Promise<void> }) {
  const [name, setName] = useState(club.activeProfile?.name ?? "");
  const [accent, setAccent] = useState(club.activeProfile?.accent ?? "#d69b54");
  const [password, setPassword] = useState("");
  if (!club.activeProfile) return null;
  const updatePassword = async () => { if (password.length < 8) return toast.error("Use ao menos 8 caracteres."); const { error } = await requireSupabase().auth.updateUser({ password }); if (error) return toast.error(error.message); setPassword(""); toast.success("Senha atualizada."); };
  return <div className="profile-grid"><section className="panel-card profile-section"><div className="section-title"><div><span className="overline">IDENTIDADE</span><h2>Seu perfil</h2></div></div><div className="active-reader-card"><span style={{ background: accent }}>{name.slice(0, 1).toUpperCase()}</span><div><small>CONTA AUTENTICADA</small><strong>{email}</strong></div></div><div className="goal-editor"><label>Nome de exibição<input maxLength={60} value={name} onChange={(event) => setName(event.target.value)} /></label><label>Cor do avatar<input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} /></label><button className="primary-button" onClick={() => void club.updateProfile(name, accent)}><Save size={16} /> Salvar perfil</button></div></section><section className="panel-card profile-section"><div className="section-title"><div><span className="overline">SEGURANÇA</span><h2>Senha e sessão</h2></div><ShieldCheck size={22} /></div><label>Nova senha<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" /></label><button className="ghost-button" disabled={password.length < 8} onClick={updatePassword}>Atualizar senha</button><button className="ghost-button" onClick={() => void onSignOut()}><LogOut size={16} /> Sair da conta</button></section></div>;
}
