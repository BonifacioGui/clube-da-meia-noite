"use client";
import { useState } from "react";
import { BookOpen, Check, MoonStar, UsersRound } from "lucide-react";
import type { ReadingClub } from "@/hooks/use-reading-club";

export function OnboardingPage({ club }: { club: ReadingClub }) {
  const [name, setName] = useState(""); const [roomName, setRoomName] = useState("Nosso Clube de Leitura");
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (name.trim() && roomName.trim()) club.createRoom(name, roomName); };
  return <main className="onboarding-shell"><div className="onboarding-brand"><span><MoonStar size={24} /></span><div><small>CLUBE DA</small><strong>Meia-Noite</strong></div></div><section className="onboarding-card"><div className="onboarding-art"><BookOpen size={46} /><span>01</span></div><p className="eyebrow"><UsersRound size={14} /> PRIMEIRO CAPÍTULO</p><h1>Crie o clube de vocês.</h1><p className="onboarding-copy">Seu perfil e a sala ficam salvos somente neste navegador. Depois você poderá adicionar a segunda pessoa com um código de convite local.</p><form className="club-form" onSubmit={submit}><label>Como devemos chamar você?<input required maxLength={40} placeholder="Seu nome" value={name} onChange={(event) => setName(event.target.value)} /></label><label>Nome do clube<input required maxLength={60} value={roomName} onChange={(event) => setRoomName(event.target.value)} /></label><button className="primary-button" type="submit"><Check size={17} /> Criar minha sala</button></form><small className="local-note">MVP local · sem conta, senha ou sincronização entre dispositivos</small></section></main>;
}
