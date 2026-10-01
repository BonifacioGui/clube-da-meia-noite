import { BookOpen, CalendarCheck, CheckCircle2, Clock3, History, XCircle } from "lucide-react";
import type { ReadingClub } from "@/hooks/use-reading-club";
import { addDays, dateKey, parseDateKey } from "@/utils/domain";

const dayLabel = (value: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(parseDateKey(value)).replaceAll(" de ", " ");
const weekLabel = (value: string) => `${dayLabel(value)} — ${dayLabel(dateKey(addDays(parseDateKey(value), 6)))}`;

export function HistoryPage({ club }: { club: ReadingClub }) {
  if (!club.data || !club.room) return null;
  const results = club.state.weeklyResults.filter((result) => result.roomId === club.room!.id).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  return <div className="history-layout">
    <section className="panel-card history-section"><div className="section-title"><div><span className="overline">SESSÕES PERSISTIDAS</span><h2>Histórico de leitura</h2></div><History size={21} /></div><div className="history-list">{club.data.sessions.map((session) => { const user = club.data!.users.find((item) => item.id === session.profileId); const book = club.data!.books.find((item) => item.id === session.bookId); return <article key={session.id}><span className="history-icon" style={{ background: user?.accent }}><BookOpen size={15} /></span><div><strong>{user?.name ?? "Leitor"} · {book?.title ?? "Livro removido"}</strong><p>{session.note || "Sessão sem anotação."}</p><small>{dayLabel(session.occurredOn)}{session.endPage != null ? ` · até a página ${session.endPage}` : ""}</small></div><b><Clock3 size={13} /> {session.durationMinutes} min</b></article>; })}{club.data.sessions.length === 0 && <div className="history-empty"><BookOpen size={26} /><h3>Nenhuma sessão registrada</h3><p>As leituras salvas aparecerão aqui em ordem cronológica.</p></div>}</div></section>
    <section className="panel-card history-section"><div className="section-title"><div><span className="overline">PACTOS ENCERRADOS</span><h2>Resultados semanais</h2></div><CalendarCheck size={21} /></div><div className="weekly-history">{results.map((result) => <article key={result.id}><header><strong>{weekLabel(result.weekStart)}</strong><span className={`outcome outcome-${result.outcome}`}>{result.outcome === "both_met" ? "Dupla cumpriu" : result.outcome === "one_met" ? "Uma pessoa cumpriu" : "Meta não cumprida"}</span></header>{club.data!.users.map((user) => <div key={user.id}>{result.memberResults[user.id] ? <CheckCircle2 className="result-met" size={15} /> : <XCircle size={15} />}<span>{user.name}</span><small>{result.memberResults[user.id] ? "cumpriu" : "não cumpriu"}</small></div>)}</article>)}{results.length === 0 && <div className="history-empty"><CalendarCheck size={26} /><h3>Nenhuma semana fechada</h3><p>Quando o pacto for encerrado, o resultado ficará registrado aqui.</p></div>}</div></section>
  </div>;
}
