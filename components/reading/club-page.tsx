"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Coins, Copy, DoorOpen, Link2Off, Plus, Radio, Save, Shuffle, Trash2, Trophy, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ReadingClub } from "@/hooks/use-reading-club";
import type { CardOption } from "@/types/reading";
import { formatWeekRange, parseDateKey } from "@/utils/domain";
import { appUrl } from "@/lib/app-paths";

function CardList({ kind, cards, onRemove }: { kind: "reward" | "penalty"; cards: CardOption[]; onRemove: (kind: "reward" | "penalty", itemId: string) => void }) {
  return <div className="chip-list">{cards.map((card) => <span key={card.id}>{card.text}<button onClick={() => onRemove(kind, card.id)} aria-label={`Excluir ${card.text}`}><Trash2 size={12} /></button></span>)}{cards.length === 0 && <small className="empty-hint">Nenhuma carta cadastrada.</small>}</div>;
}

export function ClubPage({ club }: { club: ReadingClub }) {
  const [roomName, setRoomName] = useState(club.room?.name ?? "");
  const [roomDirty, setRoomDirty] = useState(false);
  const [days, setDays] = useState(club.data?.weeklyGoal.days ?? 4);
  const [minutes, setMinutes] = useState(club.data?.weeklyGoal.minutes ?? 120);
  const [goalDirty, setGoalDirty] = useState(false);
  const [reward, setReward] = useState("");
  const [penalty, setPenalty] = useState("");
  const [vault, setVault] = useState("10");
  const [transferTo, setTransferTo] = useState("");

  useEffect(() => { if (!roomDirty && club.room) queueMicrotask(() => setRoomName(club.room!.name)); }, [club.room, roomDirty]);
  useEffect(() => { if (!goalDirty && club.data) queueMicrotask(() => { setDays(club.data!.weeklyGoal.days); setMinutes(club.data!.weeklyGoal.minutes); }); }, [club.data, goalDirty]);
  if (!club.data || !club.room || !club.activeProfile) return null;

  const membership = club.state.memberships.find((item) => item.roomId === club.room!.id && item.profileId === club.activeProfile!.id);
  const isOwner = membership?.role === "owner";
  const partner = club.data.users.find((user) => user.id !== club.activeProfile!.id);
  const isFull = club.data.users.length >= 2;
  const pendingWeek = club.data.pendingWeeks[0];
  const inviteUrl = club.invite && typeof window !== "undefined" ? (() => {
    const url = new URL(appUrl("/invite/"));
    url.searchParams.set("token", club.invite!.token);
    return url.toString();
  })() : "";
  const inviteExpiry = club.invite?.expiresAt ?? club.data.activeInvite?.expiresAt;
  const syncCopy = club.syncStatus === "live" ? "Sincronizado em tempo real" : club.syncStatus === "fallback" ? "Sincronização por atualização" : "Conectando…";

  const addCard = (kind: "reward" | "penalty", value: string) => {
    const source = kind === "reward" ? club.data!.rewardCards : club.data!.penaltyCards;
    if (!value.trim()) return;
    void club.updateCards(kind, [...source, { id: crypto.randomUUID(), text: value.trim() }]);
    if (kind === "reward") setReward(""); else setPenalty("");
  };
  const removeCard = (kind: "reward" | "penalty", itemId: string) => {
    const source = kind === "reward" ? club.data!.rewardCards : club.data!.penaltyCards;
    void club.updateCards(kind, source.filter((card) => card.id !== itemId));
  };
  const saveName = async () => { if (await club.renameRoom(roomName.trim())) setRoomDirty(false); };
  const saveGoal = async () => { if (await club.updateGoal(days, minutes)) setGoalDirty(false); };
  const leave = () => club.leaveRoom(isOwner && partner ? transferTo : undefined);

  return <div className="club-layout">
    <section className="panel-card profile-section room-section">
      <div className="section-title"><div><span className="overline">CLUBE</span><h2>Identidade e membros</h2></div><span className={`sync-badge sync-${club.syncStatus}`}><Radio size={13} /> {syncCopy}</span></div>
      {isOwner ? <div className="room-name-editor"><label>Nome do clube<input maxLength={80} value={roomName} onChange={(event) => { setRoomName(event.target.value); setRoomDirty(true); }} /></label><button className="ghost-button" disabled={!roomDirty || !roomName.trim()} onClick={() => void saveName()}><Save size={15} /> Salvar nome</button></div> : <div className="room-readonly"><small>NOME DO CLUBE</small><strong>{club.room.name}</strong></div>}
      <div className="member-roster">{club.data.users.map((user) => <article key={user.id}><span style={{ background: user.accent }}>{user.initials}</span><div><strong>{user.name}{user.id === club.activeProfile!.id ? " · você" : ""}</strong><small>{user.id === club.room!.ownerProfileId ? "Proprietário" : "Membro"}</small></div><CheckCircle2 size={16} /></article>)}</div>
    </section>

    <section className="panel-card profile-section invite-section">
      <div className="section-title"><div><span className="overline">CONVITE SEGURO</span><h2>{isFull ? "Clube completo" : "O segundo lugar está livre"}</h2></div>{isFull ? <UsersRound size={22} /> : <UserPlus size={22} />}</div>
      {isFull ? <div className="full-room-state"><CheckCircle2 size={20} /><p>A dupla está formada. Novos convites ficam indisponíveis enquanto os dois membros estiverem na sala.</p></div> : isOwner ? <>
        <p>O link é temporário, só pode ser usado uma vez e substitui qualquer convite anterior.</p>
        <div className="invite-actions"><button className="primary-button" onClick={() => void club.createInvite()}>{club.data.activeInvite ? "Gerar outro link" : "Gerar convite"}</button>{club.data.activeInvite && <button className="ghost-button danger-button" onClick={() => void club.revokeInvite()}><Link2Off size={15} /> Revogar convite</button>}</div>
        {inviteUrl && <div className="invite-code"><span>{inviteUrl}</span><button aria-label="Copiar link" onClick={() => { void navigator.clipboard.writeText(inviteUrl); toast.success("Link copiado"); }}><Copy size={15} /></button></div>}
        {club.data.activeInvite && !inviteUrl && <div className="invite-private-note"><Link2Off size={16} /><span>Há um convite ativo. Por segurança, o token não é recuperado do banco; gere outro link se precisar copiá-lo.</span></div>}
        {inviteExpiry && <small>Expira em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(inviteExpiry))}</small>}
      </> : <p>A pessoa proprietária da sala pode gerar ou revogar o convite.</p>}
    </section>

    <section className="panel-card profile-section goal-section"><div className="section-title"><div><span className="overline">META SEMANAL</span><h2>Ritmo compartilhado</h2></div></div><div className="goal-editor"><label>Dias de leitura<input type="number" min="1" max="7" value={days} onChange={(event) => { setDays(Number(event.target.value)); setGoalDirty(true); }} /></label><label>Minutos na semana<input type="number" min="1" value={minutes} onChange={(event) => { setMinutes(Number(event.target.value)); setGoalDirty(true); }} /></label><button className="primary-button" disabled={!goalDirty} onClick={() => void saveGoal()}><Save size={16} /> Salvar meta</button></div></section>

    <section className="panel-card profile-section cards-editor"><div className="section-title"><div><span className="overline">PACTO</span><h2>Recompensas & consequências</h2></div><button className="ghost-button" onClick={() => void club.drawPact()}><Shuffle size={15} /> Sortear</button></div><div className="card-editor-block"><label>Recompensas</label><div className="inline-add"><input value={reward} onChange={(event) => setReward(event.target.value)} /><button onClick={() => addCard("reward", reward)} aria-label="Adicionar recompensa"><Plus size={17} /></button></div><CardList kind="reward" cards={club.data.rewardCards} onRemove={removeCard} /></div><div className="card-editor-block"><label>Consequências leves</label><div className="inline-add"><input value={penalty} onChange={(event) => setPenalty(event.target.value)} /><button onClick={() => addCard("penalty", penalty)} aria-label="Adicionar consequência"><Plus size={17} /></button></div><CardList kind="penalty" cards={club.data.penaltyCards} onRemove={removeCard} /></div></section>

    <section className="vault-detail"><div className="vault-balance"><span><Coins size={22} /></span><div><small>COFRE DO CLUBE</small><h2>{club.data.vault.balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</h2></div></div><p>Um livro-razão compartilhado e independente do XP.</p><div className="vault-add"><span>R$</span><input type="number" value={vault} onChange={(event) => setVault(event.target.value)} /><button onClick={() => void club.addVault(Number(vault), "depósito no cofre")}>Adicionar</button></div><div className="vault-history">{club.data.vault.history.map((entry) => <div key={entry.id}><span>{entry.amount > 0 ? "+" : "−"} R$ {Math.abs(entry.amount).toFixed(2).replace(".", ",")}</span><p>{entry.user} · {entry.reason}</p><small>{entry.date}</small></div>)}{club.data.vault.history.length === 0 && <small className="empty-hint">Nenhum lançamento ainda.</small>}</div></section>

    <section className="panel-card close-week-section"><div className="section-title"><div><span className="overline">RESULTADO SEMANAL</span><h2>{pendingWeek ? "Resultado disponível" : "Semana em andamento"}</h2></div><Trophy size={22} /></div>{pendingWeek ? <><p>A semana de {formatWeekRange(parseDateKey(pendingWeek))} terminou. O banco recalculará o resultado das duas pessoas de forma atômica.</p><button className="primary-button" disabled={!isFull} onClick={() => void club.closeWeek(pendingWeek)}>Fechar semana anterior</button></> : <div className="ongoing-week"><span>{club.weekLabel}</span><p>O fechamento fica disponível somente depois do domingo. A semana atual nunca pode ser encerrada antes da hora.</p></div>}</section>

    <section className="panel-card reset-section"><div><span className="overline">SAÍDA SEGURA</span><h2>Sair do clube</h2><p>Livros, sessões e histórico não são apagados silenciosamente.</p>{isOwner && partner && <label>Transferir propriedade para<select value={transferTo} onChange={(event) => setTransferTo(event.target.value)}><option value="">Selecione…</option><option value={partner.id}>{partner.name}</option></select></label>}</div><AlertDialog><AlertDialogTrigger asChild><button className="ghost-button" disabled={Boolean(isOwner && partner && transferTo !== partner.id)}><DoorOpen size={15} /> Sair da sala</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Sair do clube?</AlertDialogTitle><AlertDialogDescription>Você perderá o acesso aos dados compartilhados, mas o histórico será preservado.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void leave()}>Confirmar saída</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></section>
  </div>;
}
