"use client";
import { useEffect, useState } from "react";
import { Award, BookCheck, Clock3, Flame, LogOut, Save, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { ReadingClub } from "@/hooks/use-reading-club";
import { requireSupabase } from "@/lib/supabase";
import { achievementProgress } from "@/utils/achievements";

export function ProfilePage({ club, email, onSignOut }: { club: ReadingClub; email: string; onSignOut: () => Promise<void> }) {
  const [name, setName] = useState(club.activeProfile?.name ?? "");
  const [accent, setAccent] = useState(club.activeProfile?.accent ?? "#5f8ee6");
  const [identityDirty, setIdentityDirty] = useState(false);
  const [password, setPassword] = useState("");
  const profile = club.activeProfile; const member = club.data?.users.find((user) => user.id === profile?.id);
  const achievements = achievementProgress(club); const unlocked = achievements.filter((item) => item.unlocked).length;

  useEffect(() => { if (!identityDirty && profile) queueMicrotask(() => { setName(profile.name); setAccent(profile.accent); }); }, [identityDirty, profile]);
  if (!profile || !member) return null;

  const saveIdentity = async () => { const saved = await club.updateProfile(name, accent); if (saved) setIdentityDirty(false); };
  const updatePassword = async () => { if (password.length < 8) return toast.error("Use ao menos 8 caracteres."); const { error } = await requireSupabase().auth.updateUser({ password }); if (error) return toast.error(error.message); setPassword(""); toast.success("Senha atualizada."); };

  const stats = [
    { label: "Dias em sequência", value: member.streak, icon: Flame },
    { label: "Sessões concluídas", value: member.totalSessions, icon: Sparkles },
    { label: "Minutos de leitura", value: member.totalMinutes, icon: Clock3 },
    { label: "Livros concluídos", value: member.completedBooks, icon: BookCheck },
    { label: "Conquistas", value: `${unlocked}/${achievements.length}`, icon: Award },
  ];

  return <div className="profile-layout">
    <section className="profile-hero panel-card"><div className="profile-avatar" style={{ background: accent }}>{profile.initials}</div><div className="profile-identity"><span className="overline">LEITOR DA MEIA-NOITE</span><h2>{profile.name}</h2><p>{email}</p><div className="level-line"><strong>Nível {club.activeProgress.level}</strong><span>{club.activeProgress.name}</span></div><div className="profile-progress"><i style={{ width: `${club.activeProgress.progress}%` }} /></div><small>{club.activeProgress.xp} / {club.activeProgress.nextXp} XP · {club.activeProgress.remaining} para {club.activeProgress.nextName}</small></div></section>
    <section className="profile-stats">{stats.map(({ label, value, icon: Icon }) => <article className="profile-stat" key={label}><span><Icon size={18} /></span><strong>{value}</strong><small>{label}</small></article>)}</section>
    <section className="panel-card profile-section account-settings"><div className="section-title"><div><span className="overline">PERSONALIZAÇÃO</span><h2>Como você aparece no clube</h2></div></div><div className="goal-editor"><label>Nome de exibição<input maxLength={60} value={name} onChange={(event) => { setName(event.target.value); setIdentityDirty(true); }} /></label><label>Cor do avatar<input type="color" value={accent} onChange={(event) => { setAccent(event.target.value); setIdentityDirty(true); }} /></label><button className="primary-button" disabled={!identityDirty || !name.trim()} onClick={() => void saveIdentity()}><Save size={16} /> Salvar perfil</button></div></section>
    <section className="panel-card profile-section security-settings"><div className="section-title"><div><span className="overline">SEGURANÇA</span><h2>Senha e sessão</h2></div><ShieldCheck size={22} /></div><label>Nova senha<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" /></label><div className="security-actions"><button className="ghost-button" disabled={password.length < 8} onClick={updatePassword}>Atualizar senha</button><button className="ghost-button" onClick={() => void onSignOut()}><LogOut size={16} /> Sair da conta</button></div></section>
  </div>;
}
