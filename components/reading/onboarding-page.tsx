"use client";
import { useState } from "react";
import { BookOpen, Check, Link2, MoonStar, UsersRound } from "lucide-react";
import type { ReadingClub } from "@/hooks/use-reading-club";
import { appPath, inviteTokenFromInput } from "@/lib/app-paths";

export function OnboardingPage({ club, inviteToken }: { club: ReadingClub; inviteToken?: string }) {
  const [roomName, setRoomName] = useState("");
  const [token, setToken] = useState(inviteToken ?? "");
  const [busy, setBusy] = useState(false);
  const create = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); await club.createRoom(roomName); setBusy(false); };
  const join = async () => { setBusy(true); const joined = await club.joinRoom(token); setBusy(false); if (joined) window.history.replaceState(null, "", appPath("/")); };
  return <main className="onboarding-shell"><div className="onboarding-brand"><span><MoonStar size={24} /></span><div><small>CLUBE DA</small><strong>Meia-Noite</strong></div></div><section className="onboarding-card"><div className="onboarding-art"><BookOpen size={46} /><span>02</span></div><p className="eyebrow"><UsersRound size={14} /> PRIMEIRO CAPÍTULO</p><h1>{inviteToken ? "Seu convite está pronto." : "Crie ou encontre sua dupla."}</h1><p className="onboarding-copy">Sua conta já está protegida. Agora crie uma sala nova ou use o convite recebido para entrar em uma sala existente.</p>{inviteToken ? <div className="club-form"><label>Convite<input readOnly value={token} /></label><button className="primary-button" disabled={busy} onClick={join}><Link2 size={17} /> {busy ? "Entrando…" : "Entrar nesta sala"}</button></div> : <><form className="club-form" onSubmit={create}><label>Nome do clube<input required maxLength={80} value={roomName} onChange={(event) => setRoomName(event.target.value)} /></label><button className="primary-button" disabled={busy} type="submit"><Check size={17} /> {busy ? "Criando…" : "Criar minha sala"}</button></form><div className="onboarding-divider"><span>ou</span></div><div className="club-form"><label>Token ou link de convite<input value={token} onChange={(event) => setToken(inviteTokenFromInput(event.target.value))} placeholder="Cole aqui" /></label><button className="ghost-button" disabled={busy || !token.trim()} onClick={join}><Link2 size={17} /> Entrar em uma sala</button></div></>}</section></main>;
}
