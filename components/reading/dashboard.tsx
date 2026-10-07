"use client";
import { BookOpen, CalendarDays, Coins, Dices, Flame, Gift, Play, Skull, Sparkles, Target, Timer, Trophy, UsersRound, WalletCards, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ReadingClub } from "@/hooks/use-reading-club";

export function Dashboard({ club, onStartReading }: { club: ReadingClub; onStartReading: () => void }) {
  if (!club.data) return null;
  const { data } = club; const memberProgress = data.users.map((user) => { const days = Math.min(100, (user.daysThisWeek / data.weeklyGoal.days) * 100); const minutes = Math.min(100, (user.minutesThisWeek / data.weeklyGoal.minutes) * 100); return Math.min(days, minutes); }); const pairProgress = Math.round(memberProgress.length ? Math.min(...memberProgress) : 0);
  return <div className="dashboard-grid">
    <section className="hero-card">
      <div className="hero-copy"><span className="hero-kicker"><Flame size={15} fill="currentColor" /> RITUAL EM ANDAMENTO</span><h2><b>{data.coupleStreak} semanas</b> construindo uma história juntos.</h2><p>Vocês já percorreram <strong>{pairProgress}%</strong> do pacto desta semana.</p></div>
      <div className="week-ring" style={{ "--progress": `${pairProgress * 3.6}deg` } as React.CSSProperties}><div><strong>{pairProgress}%</strong><span>da meta</span></div></div>
    </section>
    <section className="stats-row">
      <div className="mini-stat"><span><Zap size={17} /></span><div><small>XP acumulado pelo clube</small><strong>{club.clubXp.toLocaleString("pt-BR")}</strong></div></div>
      <div className="mini-stat"><span><Trophy size={17} /></span><div><small>Seu nível</small><strong>{club.activeProgress.level} · {club.activeProgress.name}</strong></div></div>
      <div className="mini-stat"><span><WalletCards size={17} /></span><div><small>Cofre</small><strong>{data.vault.balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div></div>
    </section>
    <section className="reader-section panel-card">
      <div className="section-title"><div><span className="overline">LEITORES DA SEMANA</span><h2>O capítulo de cada um</h2></div><span className="quiet-badge"><CalendarDays size={14} /> semana atual</span></div>
      <div className="reader-grid">{data.users.map((user) => { const book = club.currentBook(user.id); const dayProgress = Math.round((user.daysThisWeek / data.weeklyGoal.days) * 100); const minuteProgress = Math.round((user.minutesThisWeek / data.weeklyGoal.minutes) * 100); const progress = Math.min(dayProgress, minuteProgress); const pageProgress = book?.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : 0; return <article className="reader-card" key={user.id}>
        <div className="reader-head"><span className="reader-avatar" style={{ background: user.accent }}>{user.initials}</span><div><h3>{user.name}</h3><p><Flame size={13} fill="currentColor" /> {user.streak} dias seguidos</p></div><strong>{Math.min(100, progress)}%</strong></div>
        <Progress value={Math.min(100, progress)} className="reader-progress" />
        <div className="reader-numbers"><span><b>{user.daysThisWeek}/{data.weeklyGoal.days}</b> dias</span><span><b>{user.minutesThisWeek}</b> min</span><span><b>{user.xp}</b> XP</span></div>
        <div className="current-book"><span className="tiny-cover" style={{ background: book?.color }}><BookOpen size={15} /></span><div><small>LENDO AGORA</small><strong>{book?.title ?? "Escolha um livro"}</strong><p>{pageProgress}% concluído</p></div></div>
      </article>; })}{data.users.length < 2 && <article className="reader-card invite-reader"><span><UsersRound size={22} /></span><h3>O outro lugar está esperando</h3><p>Abra Clube para gerar um link de convite seguro e temporário.</p></article>}</div>
    </section>
    <section className="pact-card panel-card">
      <div className="section-title"><div><span className="overline">PACTO DA SEMANA</span><h2>Nosso combinado</h2></div><button className="ghost-button" onClick={club.drawPact}><Dices size={16} /> Sortear pacto</button></div>
      <div className="pact-list"><div className="pact-item target"><span><Target size={20} /></span><div><small>META</small><strong>{data.weeklyGoal.days} dias e {data.weeklyGoal.minutes} minutos</strong></div></div><div className="pact-item reward"><span><Gift size={20} /></span><div><small>RECOMPENSA</small><strong>{data.pact.reward || "Ainda não sorteada"}</strong></div></div><div className="pact-item penalty"><span><Skull size={20} /></span><div><small>PENALIDADE LEVE</small><strong>{data.pact.penalty || "Ainda não sorteada"}</strong></div></div></div>
      <button className="mobile-start" disabled={!club.currentBook()} onClick={onStartReading}><Play size={18} fill="currentColor" /> {club.currentBook() ? "Começar a ler" : "Escolha um livro atual"}</button>
    </section>
    <section className="activity-card panel-card"><div className="section-title"><div><span className="overline">ÚLTIMAS PÁGINAS</span><h2>Ritmo recente</h2></div></div><div className="activity-list">{data.sessions.slice(0, 3).map((session) => { const user = club.state.profiles.find((item) => item.id === session.profileId); const book = data.books.find((b) => b.id === session.bookId); return <div key={session.id}><span className="activity-avatar" style={{ background: user?.accent }}>{user?.initials}</span><div><strong>{user?.name ?? "Leitor"} leu {book?.title ?? "um livro"}</strong><p>{session.note ?? "Mais um capítulo concluído."}</p></div><span className="activity-time"><Timer size={13} /> {session.durationMinutes} min</span></div>; })}{data.sessions.length === 0 && <div className="empty-line"><BookOpen size={18} /><p>A primeira sessão da sala aparecerá aqui.</p></div>}</div></section>
    <section className="vault-card"><div><span className="vault-icon"><Coins size={24} /></span><p>Cofre da Leitura</p><h2>{data.vault.balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</h2><small>Para livros e experiências que rendem boas histórias.</small></div><Sparkles className="vault-spark" /></section>
  </div>;
}
